// Razorpay webhook: records every captured payment as a membership.
//
// Razorpay signs the raw body with HMAC-SHA256 using the webhook secret. We
// verify that before touching the database. auth: 'none' because Razorpay
// sends no Supabase credentials.
//
// Deploy:  supabase functions deploy razorpay-webhook --no-verify-jwt
// Secret:  supabase secrets set RAZORPAY_WEBHOOK_SECRET=...

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { hmacSha256Hex, json, recordPayment, timingSafeEqual } from "../_shared/payments.ts";

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!secret) return json({ error: "RAZORPAY_WEBHOOK_SECRET is not set" }, 500);

    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";
    if (!timingSafeEqual(signature, await hmacSha256Hex(secret, body))) return json({ error: "Invalid signature" }, 401);

    // deno-lint-ignore no-explicit-any
    let evt: any;
    try {
      evt = JSON.parse(body);
    } catch {
      return json({ error: "Body is not JSON" }, 400);
    }

    const db = ctx.supabaseAdmin;
    const eventName: string = evt?.event ?? "unknown";

    // Log first, so nothing is ever lost. Duplicate deliveries stop here.
    const { data: logged, error: logError } = await db
      .from("webhook_events")
      .insert({ provider: "razorpay", event: eventName, event_id: req.headers.get("x-razorpay-event-id"), payload: evt })
      .select("id")
      .single();
    if (logError) {
      if (logError.code === "23505") return json({ ok: true, duplicate: true });
      return json({ error: logError.message }, 500);
    }

    const finish = async (fields: { processed: boolean; error?: string }, result: unknown) => {
      await db.from("webhook_events").update(fields).eq("id", logged.id);
      // Always 200 once logged: a retry would not fix a data problem, and admin can see the log.
      return json(result);
    };

    if (eventName !== "payment.captured") return finish({ processed: true }, { ok: true, ignored: eventName });

    try {
      const result = await recordPayment(db, evt?.payload?.payment?.entity);
      return finish({ processed: true, error: result.note }, { ok: true, ...result });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return finish({ processed: false, error: message }, { ok: false, error: message });
    }
  }),
};
