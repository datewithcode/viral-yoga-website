// Receives the website contact form, stores the enquiry for the admin page,
// and emails a copy to the studio. Public endpoint (auth: 'none'): the form is
// filled by visitors with no account. Protection: honeypot, validation, and a
// per-phone rate limit backed by the database.
//
// Secrets (optional, email is skipped without them):
//   RESEND_API_KEY, ENQUIRY_EMAIL_TO, ENQUIRY_EMAIL_FROM

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { normalisePhone } from "../_shared/payments.ts";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
  "access-control-allow-methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...CORS } });

const clip = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

async function emailCopy(e: { name: string; phone: string; email: string | null; studio: string; interest: string; message: string }) {
  const key = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("ENQUIRY_EMAIL_TO");
  const from = Deno.env.get("ENQUIRY_EMAIL_FROM");
  if (!key || !to || !from) return "skipped";
  const base = (Deno.env.get("RESEND_API_BASE") ?? "https://api.resend.com").replace(/\/$/, "");
  const text = [
    `Name: ${e.name}`,
    `Phone: ${e.phone}`,
    `Email: ${e.email ?? "-"}`,
    `Studio: ${e.studio || "-"}`,
    `Interested in: ${e.interest || "-"}`,
    "",
    e.message || "(no message)",
    "",
    "Reply from the admin page, or on WhatsApp: https://wa.me/" + e.phone,
  ].join("\n");
  const res = await fetch(base + "/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [to], reply_to: e.email ?? undefined, subject: `New enquiry: ${e.name} (${e.interest || "trial class"})`, text }),
  });
  return res.ok ? "sent" : `failed ${res.status}`;
}

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Body is not JSON" }, 400);
    }

    // Honeypot: real visitors never see this field.
    if (clip(body["bot-field"], 10)) return json({ ok: true });

    const name = clip(body.name, 120);
    const phone = normalisePhone(body.phone);
    const email = clip(body.email, 200).toLowerCase() || null;
    const studio = clip(body.location, 80);
    const interest = clip(body.interest, 80);
    const message = clip(body.message, 2000);
    if (name.length < 2) return json({ error: "Please enter your name" }, 400);
    if (!/^[0-9]{10,15}$/.test(phone)) return json({ error: "Please enter a valid phone number" }, 400);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "That email does not look right" }, 400);

    const db = ctx.supabaseAdmin;

    // Rate limits: 3 per phone per 10 minutes, and 20 in total per 10 minutes
    // (a bot changing numbers must not be able to flood the admin page or the email quota).
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const [{ count: perPhone }, { count: total }] = await Promise.all([
      db.from("enquiries").select("id", { count: "exact", head: true }).eq("phone", phone).gte("created_at", since),
      db.from("enquiries").select("id", { count: "exact", head: true }).gte("created_at", since),
    ]);
    if ((perPhone ?? 0) >= 3) return json({ error: "Too many messages from this number. Please call or WhatsApp us instead." }, 429);
    if ((total ?? 0) >= 20) return json({ error: "We are receiving a lot of messages right now. Please WhatsApp us instead." }, 429);

    const { error } = await db.from("enquiries").insert({ name, phone, email, studio, interest, message });
    if (error) return json({ error: "Could not save your message. Please WhatsApp us." }, 500);

    let mail = "skipped";
    try {
      mail = await emailCopy({ name, phone, email, studio, interest, message });
    } catch (e) {
      mail = `failed: ${e instanceof Error ? e.message : String(e)}`;
    }
    return json({ ok: true, email: mail });
  }),
};
