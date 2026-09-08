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

export const PLANS: Record<number, string> = Object.fromEntries(
  Object.entries(PLAN_PRICES).map(([plan, rupees]) => [rupees, plan]),
);

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

export type RecordResult = { member_id: number; plan: string; duplicate: boolean; note?: string };

/**
 * Turn a captured Razorpay payment entity into a membership row.
 * Trust order: our own payment_orders row (signed-in purchase) > phone > email > new member.
 * Idempotent on razorpay_payment_id, so webhook and verify-payment can both call it.
 */
// deno-lint-ignore no-explicit-any
export async function recordPayment(db: any, p: any): Promise<RecordResult> {
  if (!p?.id) throw new Error("No payment entity");
  const amountPaise = Number(p.amount);
  const rupees = Math.round(amountPaise / 100);
  const phone = normalisePhone(p.contact);
  const email = p.email ? String(p.email).trim().toLowerCase() : null;
  const notes = p.notes && !Array.isArray(p.notes) && typeof p.notes === "object" ? p.notes : {};
  const name = String(notes.name ?? notes.Name ?? "").trim();
  let note: string | undefined;

  let plan: string | undefined;
  let member: { id: number; name: string; email: string | null; phone: string } | null = null;

  const { data: order } = p.order_id
    ? await db.from("payment_orders").select("id, member_id, plan, amount_paise").eq("razorpay_order_id", p.order_id).maybeSingle()
    : { data: null };

  if (order) {
    if (amountPaise !== order.amount_paise) throw new Error(`Paid ₹${rupees} but order was for ₹${order.amount_paise / 100}`);
    plan = order.plan;
    ({ data: member } = await db.from("members").select("id, name, email, phone").eq("id", order.member_id).maybeSingle());
    if (!member) throw new Error(`Order ${p.order_id} points at a missing member`);
  } else {
    plan = PLANS[rupees];
    if (!plan) throw new Error(`No plan matches amount ₹${rupees}. Add this payment by hand in admin.`);
    if (!phone) throw new Error("Payment has no contact number");
    ({ data: member } = await db.from("members").select("id, name, email, phone").eq("phone", phone).maybeSingle());
    if (!member && email) {
      ({ data: member } = await db.from("members").select("id, name, email, phone").eq("email", email).maybeSingle());
    }
    if (!member) {
      const { data: created, error } = await db.from("members").insert({ name, phone, email }).select("id, name, email, phone").single();
      if (error) throw new Error(`Could not create member: ${error.message}`);
      member = created;
    }
  }

  // Fill in anything we learned that the member row lacks.
  const patch: Record<string, string> = {};
  if (!member!.name && name) patch.name = name;
  if (!member!.email && email) patch.email = email;
  if (!member!.phone && phone) patch.phone = phone;
  if (Object.keys(patch).length) {
    const { error } = await db.from("members").update(patch).eq("id", member!.id);
    if (error) note = `Could not update member details: ${error.message}`;
  }

  const { error: mError } = await db.from("memberships").insert({
    member_id: member!.id,
    plan,
    amount_paise: amountPaise,
    starts_on: indiaDate(Number(p.created_at) || Math.floor(Date.now() / 1000)),
    source: "razorpay",
    razorpay_payment_id: p.id,
    razorpay_order_id: p.order_id ?? null,
  });
  const duplicate = mError?.code === "23505";
  if (mError && !duplicate) throw new Error(`Could not create membership: ${mError.message}`);
  if (order && !duplicate) await db.from("payment_orders").update({ status: "paid" }).eq("id", order.id);

  return { member_id: member!.id, plan: plan!, duplicate, note };
}
