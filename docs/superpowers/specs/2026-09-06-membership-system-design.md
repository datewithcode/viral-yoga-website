# Membership system design (2026-09-06)

Status: approved by the owner in conversation; implementation in progress.

## Goal

Know who paid for which plan, see who is about to expire, remind them, and let each student see their own membership. Keep the public website static and free to host.

## Decisions (made by the owner)

- Backend: Supabase (Postgres, Auth, Edge Functions). One new project.
- Payments recorded automatically from Razorpay via webhook. UPI and cash payments entered by hand in the admin page.
- Reminders are tap-to-send: the admin page lists memberships ending within 3 days (or already ended, still unrenewed) with a one-tap WhatsApp link per person. No scheduled job, no messaging provider.
- Admin login: one owner account, email and password.
- Student view: `/my-membership`, email magic link. Student sees plan, start, end, days remaining. Nothing else.
- Public site stays static on Netlify. Supabase pieces deploy separately with the Supabase CLI.

## Data model (schema `public`)

- `members` — id, name, phone (digits with country code, unique), email (unique, nullable), notes, created_at.
- `memberships` — id, member_id, plan (`1 month` | `3 months` | `6 months` | `1 year`), amount_paise, starts_on, ends_on, source (`razorpay` | `upi` | `cash`), razorpay_payment_id (unique, nullable), created_at.
  `ends_on = starts_on + plan interval` using calendar months (1 month from 15 Jan is 15 Feb).
- `reminders` — id, membership_id, sent_at, channel (`whatsapp`). One row per tap.
- `webhook_events` — id, provider, event_id, event, payload jsonb, processed, error, received_at. Raw log so a payment is never lost even if plan matching fails.

Tables are not exposed by default on new projects: explicit grants to `authenticated` only. `anon` gets nothing.

## Access control (RLS)

- Staff: JWT `app_metadata.role = 'staff'` (set by SQL on the owner user, never `user_metadata`). Full select/insert/update on members, memberships, reminders; select on webhook_events.
- Student: authenticated user whose JWT email matches `members.email` (case-insensitive) can select their own member row and its memberships. No writes.
- Edge Function uses the project secret key and bypasses RLS.

## Razorpay webhook (`supabase/functions/razorpay-webhook`)

- Verify `X-Razorpay-Signature` = HMAC-SHA256(raw body, webhook secret), hex, constant-time compare.
- Log every event to `webhook_events` first.
- Handle `payment.captured` only. Plan matched by `amount / 100` against the plan prices; unmatched amounts are logged and left for admin.
- Member matched by phone (`contact`), created if new. Name from `notes.name` if present, else empty (admin fills in). Email from `email`.
- Idempotent on `razorpay_payment_id`.
- Deployed with JWT verification off so Razorpay can call it.

## Pages (Astro, client-side supabase-js)

- `/admin` — login form; then three lists (due for reminder, active, lapsed), an "add payment" form (name, phone, email, plan, source, start date), inline edit of name/email, and per-row WhatsApp button that also inserts a `reminders` row.
- `/my-membership` — email input, magic link, then membership card with days remaining. Redirect URL must be allow-listed in Supabase Auth.

## Known constraints to tell the owner

- Supabase's built-in email only sends 2 messages per hour and only to project team addresses. Student magic links need a custom SMTP provider (Resend, Brevo, etc.) before launch. Admin password login is unaffected.
- Free-tier projects pause after 7 days without activity. Webhooks to a paused project fail. Pro plan (about $25/month) or a weekly visit avoids this.
- Members with no email cannot use the student page.
- Razorpay's payment entity carries no customer name unless the button collects it into `notes`.

## Revision 2 (2026-09-06, later): sign in first, then buy

Owner chose "sign in first, then buy" over "buy first, sign in later".

- `members.user_id` links a member to their Supabase Auth account. Student policies match on `user_id` first, email second.
- `payment_orders` records every Razorpay order we create: which member, which plan, what amount. This row, not the Razorpay payload, is the source of truth for who a payment belongs to.
- Flow: student signs in on `/my-membership` (magic link, `?plan=` preselects) → enters name and mobile → `create-order` (auth: user) finds or creates and links the member, creates the Razorpay order, stores `payment_orders` → browser opens Razorpay standard checkout → on success `verify-payment` (auth: user) checks the checkout signature, checks the order belongs to the caller, fetches the payment from Razorpay, requires `captured`, records the membership → page refreshes. The webhook remains as the backup path and is idempotent with it.
- Pricing cards: "Buy online" (primary) links to `/my-membership/?plan=…`; UPI stays as the no-sign-in alternative. Razorpay Payment Buttons removed.
- Consequence: custom SMTP is now required for any online payment, since sign-in gates purchase.
- Secrets: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. `RAZORPAY_API_BASE` exists only for local tests against a mock.
