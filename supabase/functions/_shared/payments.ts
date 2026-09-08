// Shared by razorpay-webhook, create-order and verify-payment.

// Rupees -> plan and plan -> rupees. Keep in sync with pricing.plans in src/data/site.ts.
export const PLAN_PRICES: Record<string, number> = {
  "1 month": 2000,
  "3 months": 5000,
  "6 months": 9000,
  "1 year": 16000,
};
// Fee added on top of the plan price for online payment, in percent.
// Must match pricing.onlineFeePercent in src/data/site.ts.
export const ONLINE_FEE_PERCENT = 0;

// Amount to charge online, in paise, for a plan.
export function onlineAmountPaise(rupees: number): { base: number; fee: number; total: number } {
  const base = rupees * 100;
  // Rounded to a whole rupee so the student sees a clean number.
  const fee = Math.round(rupees * ONLINE_FEE_PERCENT / 100) * 100;
  return { base, fee, total: base + fee };
}

const encoder = new TextEncoder();

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function normalisePhone(raw: unknown): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits.length === 10 ? "91" + digits : digits;
}

// Date in India as YYYY-MM-DD.
export function indiaDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

// Razorpay REST API. RAZORPAY_API_BASE is only overridden in local tests.
export function razorpayApi() {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set");
  const base = (Deno.env.get("RAZORPAY_API_BASE") ?? "https://api.razorpay.com").replace(/\/$/, "");
  const auth = "Basic " + btoa(`${keyId}:${keySecret}`);
  return {
    keyId,
    keySecret,
    async request(path: string, init: RequestInit = {}) {
      const res = await fetch(base + path, {
        ...init,
        headers: { "content-type": "application/json", authorization: auth, ...(init.headers ?? {}) },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`Razorpay ${path} failed: ${data?.error?.description ?? res.status}`);
      return data;
    },
  };
}

/**
 * A payment we will never be able to record automatically: no matching order,
 * wrong amount, and so on. Retrying would not help; the owner sorts it out from
 * the "Payments that need attention" list. Anything else thrown by
 * recordPayment is transient (database unreachable, permission missing) and
 * the caller should ask Razorpay to retry.
 */
export class PaymentRejected extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentRejected";
  }
}

export type RecordResult = { member_id: number; plan: string; duplicate: boolean; note?: string };

/**
 * Turn a captured Razorpay payment entity into a membership row.
 *
 * Every legitimate online payment starts from create-order, so the
 * payment_orders row is the only thing trusted to say which member and plan a
 * payment belongs to. Contact details on the payment are never used to pick a
 * member. A payment without a local order is rejected and lands in the
 * attention list.
 *
 * Idempotent on razorpay_payment_id, so webhook and verify-payment can both call it.
 */
// deno-lint-ignore no-explicit-any
export async function recordPayment(db: any, p: any): Promise<RecordResult> {
  if (!p?.id) throw new PaymentRejected("No payment entity");
  const amountPaise = Number(p.amount);
  const rupees = Math.round(amountPaise / 100);
  if (!p.order_id) throw new PaymentRejected(`Payment ₹${rupees} has no order. Add it by hand in admin if it is real.`);

  const { data: order, error: orderError } = await db
    .from("payment_orders")
    .select("id, member_id, plan, amount_paise, status")
    .eq("razorpay_order_id", p.order_id)
    .maybeSingle();
  if (orderError) throw new Error(`Could not read order: ${orderError.message}`);
  if (!order) throw new PaymentRejected(`Order ${p.order_id} was not created by this site. Add it by hand in admin if it is real.`);
  if (amountPaise !== order.amount_paise) {
    throw new PaymentRejected(`Paid ₹${rupees} but order was for ₹${order.amount_paise / 100}`);
  }

  // An order that is already settled may only be replayed by the very payment
  // that settled it. A different payment on the same order is a second charge:
  // it must not quietly become a second membership.
  if (order.status === "paid") {
    const { data: already, error: alreadyError } = await db
      .from("memberships")
      .select("razorpay_payment_id")
      .eq("razorpay_order_id", p.order_id)
      .limit(1);
    if (alreadyError) throw new Error(`Could not read existing membership: ${alreadyError.message}`);
    const settledBy = already?.[0]?.razorpay_payment_id;
    if (settledBy && settledBy !== p.id) {
      throw new PaymentRejected(
        `Order ${p.order_id} was already paid by ${settledBy}. This looks like a second payment: refund it, or add it by hand.`,
      );
    }
  }

  const { data: member, error: memberError } = await db
    .from("members")
    .select("id, name, email")
    .eq("id", order.member_id)
    .maybeSingle();
  if (memberError) throw new Error(`Could not read member: ${memberError.message}`);
  if (!member) throw new PaymentRejected(`Order ${p.order_id} points at a missing member`);

  // Fill in a blank name from the payment, nothing else.
  let note: string | undefined;
  const notes = p.notes && !Array.isArray(p.notes) && typeof p.notes === "object" ? p.notes : {};
  const name = String(notes.name ?? notes.Name ?? "").trim();
  if (!member.name && name) {
    const { error } = await db.from("members").update({ name }).eq("id", member.id);
    if (error) note = `Could not update member name: ${error.message}`;
  }

  const { error: mError } = await db.from("memberships").insert({
    member_id: member.id,
    plan: order.plan,
    amount_paise: amountPaise,
    starts_on: indiaDate(Number(p.created_at) || Math.floor(Date.now() / 1000)),
    source: "razorpay",
    razorpay_payment_id: p.id,
    razorpay_order_id: p.order_id,
  });
  const duplicate = mError?.code === "23505";
  if (mError && !duplicate) throw new Error(`Could not create membership: ${mError.message}`);

  // Always run, never only on the first pass. If a first delivery inserted the
  // membership and then failed here, the retry arrives with duplicate = true and
  // is the only chance left to finish the job. Setting 'paid' twice is a no-op.
  const { error: statusError } = await db.from("payment_orders").update({ status: "paid" }).eq("id", order.id);
  if (statusError) throw new Error(`Could not mark order paid: ${statusError.message}`);

  return { member_id: member.id, plan: order.plan, duplicate, note };
}
