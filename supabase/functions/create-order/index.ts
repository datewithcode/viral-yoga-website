// Creates a Razorpay order for the signed-in student, and remembers which
// member and plan it is for. The browser then opens Razorpay checkout with it.
//
// Called with the student's session (auth: 'user'). Price comes from the
// server, never from the browser.

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { PLAN_PRICES, json, normalisePhone, onlineAmountPaise, razorpayApi } from "../_shared/payments.ts";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const userId: string | undefined = ctx.userClaims?.id ?? ctx.jwtClaims?.sub;
    const userEmail = String(ctx.userClaims?.email ?? ctx.jwtClaims?.email ?? "").toLowerCase() || null;
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
    const name = String(body.name ?? "").trim();
    const phone = normalisePhone(body.phone);
    if (name.length < 2) return json({ error: "Please enter your name" }, 400);
    if (!/^[0-9]{12,15}$/.test(phone)) return json({ error: "Please enter a valid mobile number" }, 400);

    let rz;
    try {
      rz = razorpayApi();
    } catch (e) {
      return json({ error: (e as Error).message }, 500);
    }

    const db = ctx.supabaseAdmin;
    const cols = "id, name, phone, email, user_id";

    // Find the member for this account: by user id, then phone, then email. Then link.
    let { data: member } = await db.from("members").select(cols).eq("user_id", userId).maybeSingle();
    if (!member) {
      ({ data: member } = await db.from("members").select(cols).eq("phone", phone).maybeSingle());
      if (member?.user_id && member.user_id !== userId) {
        return json({ error: "This mobile number is already linked to another account. Please message the studio." }, 409);
      }
    }
    if (!member && userEmail) {
      ({ data: member } = await db.from("members").select(cols).eq("email", userEmail).maybeSingle());
      if (member?.user_id && member.user_id !== userId) member = null;
    }

    if (!member) {
      const { data, error } = await db.from("members").insert({ name, phone, email: userEmail, user_id: userId }).select(cols).single();
      if (error) {
        if (error.code === "23505") return json({ error: "These details are already linked to another account. Please message the studio." }, 409);
        return json({ error: error.message }, 500);
      }
      member = data;
    } else {
      const patch: Record<string, string> = { name, phone, user_id: userId };
      if (!member.email && userEmail) patch.email = userEmail;
      const { error } = await db.from("members").update(patch).eq("id", member.id);
      if (error) {
        if (error.code === "23505") return json({ error: "This mobile number belongs to another member. Please message the studio." }, 409);
        return json({ error: error.message }, 500);
      }
    }

    const { base, fee, total: amount } = onlineAmountPaise(rupees);
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
    if (oError) return json({ error: oError.message }, 500);

    return json({
      order_id: order.id,
      amount,
      currency: "INR",
      key_id: rz.keyId,
      plan,
      base_paise: base,
      fee_paise: fee,
      prefill: { name, email: member.email ?? userEmail ?? "", contact: phone },
    });
  }),
};
