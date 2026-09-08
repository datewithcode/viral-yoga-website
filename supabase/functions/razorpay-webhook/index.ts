// Razorpay webhook: records every captured payment as a membership.
//
// Razorpay signs the raw body with HMAC-SHA256 using the webhook secret. We
// verify that before touching the database. auth: 'none' because Razorpay
// sends no Supabase credentials.
//
// Response codes decide whether Razorpay retries (it retries non-2xx for 24 h):
//   200  recorded, duplicate, ignored event, or a payment we can never record
//        automatically (logged with needs_attention so the owner sees it)
//   500  something transient went wrong; please deliver this event again
//
// Only a permanent failure sets needs_attention. A transient one must not, or
// the owner would see a payment that is seconds away from recording itself and
// enter it by hand, giving one payment two memberships. After MAX_ATTEMPTS we
// stop asking for retries and hand it to the owner instead.
//
// Deploy:  supabase functions deploy razorpay-webhook --no-verify-jwt
// Secret:  supabase secrets set RAZORPAY_WEBHOOK_SECRET=...

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { PaymentRejected, hmacSha256Hex, json, recordPayment, timingSafeEqual } from "../_shared/payments.ts";

// Deliveries of one event we will keep asking Razorpay to retry. Past this we
// give up, answer 200, and put it in front of the owner.
const MAX_ATTEMPTS = 5;

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

    // Untyped client: rows are shaped by the select strings below.
    // deno-lint-ignore no-explicit-any
    const db: any = ctx.supabaseAdmin;
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

    const finish = async (
      fields: { processed: boolean; needs_attention?: boolean; error?: string | null },
      result: unknown,
      status = 200,
    ) => {
      const { error } = await db.from("webhook_events").update(fields).eq("id", logId);
      // The payment has already been recorded or already rejected by this point.
      // Failing to update our own log is not a reason to ask Razorpay to send a
      // settled payment again for the next 24 hours, so the status code stands.
      if (error) console.error(`webhook_events ${logId} update failed: ${error.message}`);
      return json(result, status);
    };

    if (eventName !== "payment.captured") {
      return finish({ processed: true, needs_attention: false }, { ok: true, ignored: eventName });
    }

    try {
      const result = await recordPayment(db, evt?.payload?.payment?.entity);
      return finish({ processed: true, needs_attention: false, error: result.note ?? null }, { ok: true, ...result });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (e instanceof PaymentRejected) {
        // Final. Nothing will fix this on its own, so show the owner and stop.
        return finish({ processed: false, needs_attention: true, error: message }, { ok: false, error: message });
      }
      if (attempts >= MAX_ATTEMPTS) {
        // Retrying is not working. Stop the loop and hand it over, rather than
        // leaving it invisible until Razorpay gives up on its own.
        const giveUp = `gave up after ${attempts} attempts: ${message}`;
        return finish({ processed: false, needs_attention: true, error: giveUp }, { ok: false, error: giveUp });
      }
      // Transient, and worth another try. Deliberately not marked for attention:
      // the owner must not enter by hand a payment that is about to record itself.
      return finish(
        { processed: false, needs_attention: false, error: `attempt ${attempts}: ${message}` },
        { ok: false, error: message, retry: true },
        500,
      );
    }
  }),
};
