// Called by the browser right after Razorpay checkout succeeds, so the
// membership appears immediately instead of waiting for the webhook. Both
// paths are idempotent, so whichever arrives first wins and the other is a no-op.

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { hmacSha256Hex, json, razorpayApi, recordPayment, timingSafeEqual } from "../_shared/payments.ts";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const userId: string | undefined = ctx.userClaims?.id ?? ctx.jwtClaims?.sub;
    if (!userId) return json({ error: "Not signed in" }, 401);

    let body: { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: "Body is not JSON" }, 400);
    }
    const orderId = String(body.razorpay_order_id ?? "");
    const paymentId = String(body.razorpay_payment_id ?? "");
    const signature = String(body.razorpay_signature ?? "");
    if (!orderId || !paymentId || !signature) return json({ error: "Missing payment details" }, 400);

    let rz;
    try {
      rz = razorpayApi();
    } catch (e) {
      return json({ error: (e as Error).message }, 500);
    }

    // 1. Razorpay's checkout signature: HMAC-SHA256("order_id|payment_id", key secret).
    if (!timingSafeEqual(signature, await hmacSha256Hex(rz.keySecret, `${orderId}|${paymentId}`))) {
      return json({ error: "Invalid payment signature" }, 401);
    }

    // 2. The order must be one we created for this very account.
    const db = ctx.supabaseAdmin;
    const { data: order } = await db
      .from("payment_orders")
      .select("id, amount_paise, member:members(user_id)")
      .eq("razorpay_order_id", orderId)
      .maybeSingle();
    if (!order) return json({ error: "Unknown order" }, 404);
    if (order.member?.user_id !== userId) return json({ error: "This order belongs to a different account" }, 403);

    // 3. Ask Razorpay for the payment itself; never trust the browser's copy.
    let payment;
    try {
      payment = await rz.request(`/v1/payments/${encodeURIComponent(paymentId)}`);
    } catch (e) {
      return json({ error: (e as Error).message }, 502);
    }
    if (payment.order_id !== orderId) return json({ error: "Payment does not belong to this order" }, 400);
    if (payment.status !== "captured") return json({ ok: false, pending: true, status: payment.status });

    try {
      const result = await recordPayment(db, payment);
      return json({ ok: true, ...result });
    } catch (e) {
      return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
    }
  }),
};
