// Creates a Razorpay order for the signed-in student, and remembers which
// member and plan it is for. The browser then opens Razorpay checkout with it.
//
// Called with the student's session (auth: 'user'). Price comes from the
// server, never from the browser.
//
// Which member row belongs to this account:
//   1. the row already linked to this user id, else
//   2. an unlinked row whose email equals the signed-in (verified) email.
// A phone number typed into the form never selects a member. It is stored on
// the member's own row and must not belong to anybody else.

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { PLAN_PRICES, json, normalisePhone, onlineAmountPaise, razorpayApi } from "../_shared/payments.ts";

// Reuse an unpaid order for the same plan and amount created within this window.
const REUSE_MINUTES = 30;
// Fresh orders a member may create per hour.
const ORDERS_PER_HOUR = 5;
// Calls one signed-in account may make per hour, counted before any lookup.
// Without this, a phone number could be tested over and over to learn whether
// it belongs to a member, because that check has to answer truthfully.
const ATTEMPTS_PER_HOUR = 15;

const CONTACT_STUDIO = "Please message the studio.";

// Enough for the owner to recognise their own address, not enough to harvest it.
function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return "…";
  const head = name.slice(0, 2);
  return `${head}${"·".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const userId: string | undefined = ctx.userClaims?.id ?? ctx.jwtClaims?.sub;
    const userEmail = String(ctx.userClaims?.email ?? ctx.jwtClaims?.email ?? "").trim().toLowerCase() || null;
    if (!userId) return json({ error: "Not signed in" }, 401);

    let body: { plan?: string; name?: string; phone?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: "Body is not JSON" }, 400);
    }
    const plan = String(body.plan ?? "");
    const rupees = PLAN_PRICES[plan];
    if (!rupees) return json({ error: "Unknown plan" }, 400);
    const name = String(body.name ?? "").trim().slice(0, 120);
    const phone = normalisePhone(body.phone);
    if (name.length < 2) return json({ error: "Please enter your name" }, 400);
    if (!/^[0-9]{12,15}$/.test(phone)) return json({ error: "Please enter a valid mobile number" }, 400);

    let rz;
    try {
      rz = razorpayApi();
    } catch (e) {
      return json({ error: (e as Error).message }, 500);
    }

    // Untyped client: rows are shaped by the select strings below.
    // deno-lint-ignore no-explicit-any
    const db: any = ctx.supabaseAdmin;
    const cols = "id, name, phone, email, user_id";
    const fail = (e: { message: string }) => json({ error: `Database error: ${e.message}` }, 500);

    // Count this attempt first, so probing is bounded even when it never gets
    // as far as creating an order.
    const attemptSince = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: attempts, error: attemptError } = await db
      .from("order_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", attemptSince);
    if (attemptError) return fail(attemptError);
    if ((attempts ?? 0) >= ATTEMPTS_PER_HOUR) {
      return json({ error: "Too many attempts. Please try again in an hour, or message the studio." }, 429);
    }
    const { error: logError } = await db.from("order_attempts").insert({ user_id: userId });
    if (logError) return fail(logError);

    // 1. Member already linked to this account.
    let { data: member, error: byUser } = await db.from("members").select(cols).eq("user_id", userId).maybeSingle();
    if (byUser) return fail(byUser);

    // 2. Unlinked member with the same verified email: claim it atomically.
    if (!member && userEmail) {
      const { data: claimed, error } = await db
        .from("members")
        .update({ user_id: userId })
        .eq("email", userEmail)
        .is("user_id", null)
        .select(cols)
        .maybeSingle();
      if (error) return fail(error);
      member = claimed;
    }

    // The phone must not belong to a different member.
    const { data: phoneOwner, error: phoneError } = await db.from("members").select("id, email").eq("phone", phone).maybeSingle();
    if (phoneError) return fail(phoneError);
    if (phoneOwner && phoneOwner.id !== member?.id) {
      // Telling someone to sign in with "the email the studio has for you" is
      // useless when the studio has no email for them, which is the normal case
      // for a walk-in member. Say what they can actually do instead.
      return json({
        error: phoneOwner.email
          ? `This mobile number is already registered. Sign in with the email the studio has for you (${maskEmail(phoneOwner.email)}), or ${CONTACT_STUDIO.toLowerCase()}`
          : `This mobile number is already registered at the studio, but no email is linked to it yet. ${CONTACT_STUDIO} We will link it to this account and your membership will appear here.`,
      }, 409);
    }

    if (!member) {
      const { data, error } = await db.from("members").insert({ name, phone, email: userEmail, user_id: userId }).select(cols).single();
      if (error) {
        if (error.code === "23505") return json({ error: `These details are already registered. ${CONTACT_STUDIO}` }, 409);
        return fail(error);
      }
      member = data;
    } else if (member.name !== name || member.phone !== phone) {
      const { error } = await db.from("members").update({ name, phone }).eq("id", member.id).eq("user_id", userId);
      if (error) {
        if (error.code === "23505") return json({ error: `This mobile number belongs to another member. ${CONTACT_STUDIO}` }, 409);
        return fail(error);
      }
      member = { ...member, name, phone };
    }

    const { base, fee, total: amount } = onlineAmountPaise(rupees);
    const prefill = { name, email: member.email ?? userEmail ?? "", contact: phone };

    // Reuse a recent unpaid order for the same plan instead of piling up rows.
    const reuseSince = new Date(Date.now() - REUSE_MINUTES * 60 * 1000).toISOString();
    const { data: existing, error: existingError } = await db
      .from("payment_orders")
      .select("razorpay_order_id")
      .eq("member_id", member.id)
      .eq("plan", plan)
      .eq("amount_paise", amount)
      .eq("status", "created")
      .gte("created_at", reuseSince)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) return fail(existingError);
    if (existing) {
      return json({ order_id: existing.razorpay_order_id, amount, currency: "INR", key_id: rz.keyId, plan, base_paise: base, fee_paise: fee, prefill, reused: true });
    }

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await db
      .from("payment_orders")
      .select("id", { count: "exact", head: true })
      .eq("member_id", member.id)
      .gte("created_at", hourAgo);
    if (countError) return fail(countError);
    if ((count ?? 0) >= ORDERS_PER_HOUR) {
      return json({ error: "Too many payment attempts. Please try again in an hour, or pay by UPI." }, 429);
    }

    let order;
    try {
      order = await rz.request("/v1/orders", {
        method: "POST",
        body: JSON.stringify({
          amount,
          currency: "INR",
          receipt: `m${member.id}-${Date.now()}`.slice(0, 40),
          notes: { plan, member_id: String(member.id) },
        }),
      });
    } catch (e) {
      return json({ error: (e as Error).message }, 502);
    }

    const { error: oError } = await db.from("payment_orders").insert({
      razorpay_order_id: order.id,
      member_id: member.id,
      plan,
      amount_paise: amount,
    });
    if (oError) return fail(oError);

    return json({ order_id: order.id, amount, currency: "INR", key_id: rz.keyId, plan, base_paise: base, fee_paise: fee, prefill });
  }),
};
