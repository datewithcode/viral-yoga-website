# Security and bug review, 8 September 2026: findings and fixes

> Payments and memberships were removed from the website on 11 September 2026. The code this document describes is kept on branch `main_backup_payment` and tag `backup-2026-09-11`.

External review of `main` bf82773 / `develop` b57e044 (same tree). Six findings plus a CI gap. All fixed on branch `fix/security-review`, proven by `tests/functions.sh` (51 cases) which now runs in CI on every pull request.

**Exposure at the time of the review.** Online payment is switched off and the Razorpay keys are not set, so `create-order`, `verify-payment` and `razorpay-webhook` refused every call before reaching the flawed code. F01, F02, F04 and F05 were latent. F03 (contact-form spam) and F06 (student page) were live; neither exposes data or money.

| ID | Severity | Finding | Fix | Test that proves it |
|---|---|---|---|---|
| F01 | High | A signed-in user could claim another member's record by typing that member's phone number. | `create-order` now finds a member only by the caller's user id, or by an **unlinked** row whose email equals the caller's verified sign-in email. The link is one atomic update (`where user_id is null`). A phone that belongs to anyone else is refused with 409. Phone is never used to pick a member. | "another account cannot claim a walk-in's phone", "dev cannot use asha's phone", "asha changing to dev's phone is refused", "walk-in with matching email links to her own row" |
| F02 | High | A webhook whose database write failed was acknowledged with 200, and the duplicate-event guard meant Razorpay's retry did nothing. | Transient failures now return 500 so Razorpay retries (24 h). A redelivered event that is still unprocessed is processed again; `webhook_events.attempts` counts deliveries. Payments that can never be recorded automatically (no order, wrong amount) return 200 and stay in the admin attention list. | "database write fails: webhook answers 500", "same event redelivered: recorded", "exactly one membership for that payment", "attempt 2 logged, processed" |
| F03 | Medium | Enquiry limits were checked and inserted separately, so parallel requests bypassed them; the global limit let one bot block everyone. | Limits moved into one database function `submit_enquiry`. Per phone (3) and per IP address (5) each take an advisory lock and are exact. The overall limit of 100 per 10 minutes takes no lock, can overshoot under a burst, and is a circuit breaker only. Callable by `service_role` only. | "parallel burst: exactly three stored", "fourth from one phone refused", "sixth from one address refused", "student cannot call submit_enquiry directly" |
| F04 | Medium | `recordPayment` ignored query errors, and a failed lookup fell back to matching by phone or email, which could credit the wrong member. | Every query error is checked and thrown (the webhook then retries). The fallback is gone: a payment is recorded only against its own `payment_orders` row. Anything else goes to the attention list, unprocessed, and is never assigned by contact details. | "no order: asha's phone did NOT get a membership", "unknown order id: no membership created", "no order: kept unprocessed for the attention list" |
| F05 | Medium | A signed-in user could create unlimited Razorpay orders. | An open order for the same plan and amount under 30 minutes old is reused. Otherwise at most 5 new orders per member per hour (429). | "same plan again reuses the open order", "sixth order in an hour is refused" |
| F06 | Low | A failed membership query showed "No membership found". | Both queries are checked; a failure shows "We could not load your membership just now. Please reload…" and never the empty state. | Manual (browser); `npx astro check` clean |
| CI | Gap | CI only built the website. | Three jobs: Astro check and build; `deno check` of every function with pinned imports (`deno.json` now pins exact versions); local Supabase integration run (`tests/run.sh`) covering payments, webhook retry, member linking, rate limits and RLS. | `.github/workflows/ci.yml` |

## Decisions recorded

- **Phone OTP was not added.** The review suggested phone verification for a member whose phone is already on file. Instead: a walk-in member links by signing in with the email the studio recorded for them; with no email on file, the instructor adds it in admin. This was already the documented behaviour.
- **Payments without a local order are no longer auto-matched.** Every legitimate online payment starts at "Buy online" on the site, so an order row always exists. A Razorpay Payment Link or Button used outside the site now lands in the attention list for the owner to add by hand.
- **IP-based limiting is best effort.** The address comes from the edge's forwarded headers. It tightens the per-phone limit; it never replaces it.
- **Two users racing to claim the same record** is prevented by the atomic conditional update plus the unique constraint on `members.user_id`; not tested as a race in CI.

## How to run the tests

```bash
supabase start          # once; needs Docker
bash tests/run.sh       # resets the local database, seeds users, runs 51 cases
```

## Still open (unchanged, tracked in docs/STATUS.md)

Content-Security-Policy header, owner two-factor guidance, advisor checks on the live project after each migration, one real test-mode Razorpay payment before live keys, and a repeat review before live keys as the reviewer recommends.
