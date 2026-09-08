// Razorpay webhook: records every captured payment as a membership.
//
// Razorpay signs the raw body with HMAC-SHA256 using the webhook secret. We
// verify that before touching the database. auth: 'none' because Razorpay
// sends no Supabase credentials.
//
// Response codes decide whether Razorpay retries (it retries non-2xx for 24 h):
//   200  recorded, duplicate, ignored event, or a payment we can never record
//        automatically (it is logged with its reason for the admin attention list)
//   500  something transient went wrong; please deliver this event again
//
// Deploy:  supabase functions deploy razorpay-webhook --no-verify-jwt
// Secret:  supabase secrets set RAZORPAY_WEBHOOK_SECRET=...

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { PaymentRejected, hmacSha256Hex, json, recordPayment, timingSafeEqual } from "../_shared/payments.ts";

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
    const eventId = req.headers.get("x-razorpay-event-id");

    // Log first, so nothing is ever lost.
    let logId: number;
    let attempts = 1;
    const { data: logged, error: logError } = await db
      .from("webhook_events")
      .insert({ provider: "razorpay", event: eventName, event_id: eventId, payload: evt, attempts: 1 })
      .select("id")
      .single();
    if (logError && logError.code !== "23505") return json({ error: logError.message }, 500);

    if (logError) {
      // Seen before. Done already: acknowledge. Not done: this is a retry, process it again.
      const { data: prior, error } = await db.from("webhook_events").select("id, processed, attempts").eq("event_id", eventId).maybeSingle();
      if (error || !prior) return json({ error: error?.message ?? "Duplicate event not found" }, 500);
      if (prior.processed) return json({ ok: true, duplicate: true });
      logId = prior.id;
      attempts = prior.attempts + 1;
      const { error: bump } = await db.from("webhook_events").update({ attempts }).eq("id", logId);
      if (bump) return json({ error: bump.message }, 500);
    } else {
      logId = logged.id;
    }

    const finish = async (fields: { processed: boolean; error?: string | null }, result: unknown, status = 200) => {
      const { error } = await db.from("webhook_events").update(fields).eq("id", logId);
      if (error) return json({ error: error.message }, 500);
      return json(result, status);
    };

    if (eventName !== "payment.captured") return finish({ processed: true }, { ok: true, ignored: eventName });

    try {
      const result = await recordPayment(db, evt?.payload?.payment?.entity);
      return finish({ processed: true, error: result.note ?? null }, { ok: true, ...result });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (e instanceof PaymentRejected) {
        // Final: keep it visible in admin, tell Razorpay not to retry.
        return finish({ processed: false, error: message }, { ok: false, error: message });
      }
      // Transient: keep the reason, ask Razorpay to try again.
      return finish({ processed: false, error: `attempt ${attempts}: ${message}` }, { ok: false, error: message, retry: true }, 500);
    }
  }),
};
