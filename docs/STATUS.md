# Viral Yoga website: status and next steps

Last updated: 8 September 2026, after the security review fixes

Live site (placeholder content): https://startling-beignet-f4a10f.netlify.app  
Code: https://github.com/datewithcode/viral-yoga-website

## 1. What this is

A website for Viral Yoga's two studios in Anjar and Adipur. Students see classes, timetable and prices, buy a membership online, and check their own days remaining. The instructor sees who paid, who is about to expire, and who has asked about a trial class, and replies on WhatsApp with one tap.

## 2. Where we stand today

Everything is built and tested. The public website is live with placeholder content. The Supabase backend (database, security rules, four functions) is deployed to the Viral-Yoga project in Mumbai; online payment stays switched off until the Razorpay step.

| Feature | Built | Tested | Live |
|---|---|---|---|
| Public website: home, classes, timetable per studio, prices, gallery, both maps, contact form, WhatsApp button | Yes | Yes | Yes, placeholder content |
| Teacher section: photo, short bio, and a dated list of achievements | Yes | Yes | Yes, placeholder content |
| Pay by UPI directly (QR code and pay link per plan, send screenshot on WhatsApp) | Yes | Links checked, not yet opened in a real UPI app | No |
| Membership page: sign in by email link, see days remaining | Yes | Yes | Yes, with limits (see section 9) |
| Membership page: register and buy a plan online | Yes | Yes, with a stand-in for Razorpay | Hidden until domain + Razorpay exist (step 3) |
| Sign in first, then buy: online payments are tied to the student's account automatically | Yes | Yes | No |
| Admin page: owner login, lists of active, due-for-reminder and lapsed members | Yes | Yes | Yes, owner login works |
| Admin: add a UPI or cash payment by hand | Yes | Yes | Yes |
| Admin: one-tap WhatsApp renewal reminder, logged so you see who was reminded | Yes | Yes | Yes |
| Admin: import your existing member list from a spreadsheet | Yes | Yes | Yes, not yet used |
| Admin: enquiries from the contact form, with WhatsApp reply and Done | Yes | Yes | Yes |
| Optional online fee passed to the student (currently off) | Yes | Yes | No |
| Backend: database, security rules, four server functions | Yes | Yes, 51 automated cases run on every code change | Yes, Supabase project Viral-Yoga (Mumbai) |
| Security review (external, 8 Sept): 2 high, 3 medium, 1 low findings | All fixed | Yes, each has a test | Yes |
| Real Razorpay account | Not started | No | No |
| Deployment: Netlify | Yes | Yes | Yes, auto-deploys from GitHub `main` |
| Deployment: Supabase project | Yes | Yes | Yes, free tier for now |
| Email provider (Resend) | Not started | No | No |

All names, phone numbers, addresses, timetable entries, testimonials, achievements and photos on the site are placeholders, including the teacher's name and achievement list. The studio name is already set to Viral Yoga.

## 2b. How to check the security fixes yourself

1. **GitHub Actions**: https://github.com/datewithcode/viral-yoga-website/actions. The latest run on `main` has three green checks. Open `functions-integration`, expand "bash tests/run.sh": 51 lines starting with PASS, one per case, named after the finding they prove (for example "another account cannot claim a walk-in's phone").
2. **The tests are in the repo**: `tests/functions.sh`. Anyone can read what each case does.
3. **Run them on the laptop** (Docker running): `git pull`, `supabase start`, `bash tests/run.sh`. Last line: `passed 51, failed 0`.
4. **Supabase dashboard**: Edge Functions shows all four at version 2, updated 8 Sept. Table Editor shows the new column `attempts` on `webhook_events` and `ip` on `enquiries`. Database > Functions shows `submit_enquiry`.
5. **Live site**: send four contact-form messages with the same phone number. The fourth is refused with "Too many messages from this number".
6. **For the reviewer**: `docs/security-review-2026-09-08.md` lists each finding, the fix, and the test that proves it. A repeat review is planned before live Razorpay keys.

**Still to do on GitHub (owner, 1 minute):** Settings > Rules > Rulesets > protect-main > Require status checks: add `functions-typecheck` and `functions-integration`. Until then only the website build is required before a merge to main.

## 3. How it works

### For a student

1. Opens the website, sees classes and prices.
2. Taps **Buy online** on a plan, or **Sign in** at the top of the page. After signing in that button reads "Hi, <name>" and opens their membership page. (The separate "Membership" menu link was removed on 8 Sept; it went to the same page.)
3. Types their email. We email them a sign-in link. No signup form, no password. Their account is created automatically the first time.
4. Enters name and mobile, confirms the plan, pays with UPI, card or net banking through Razorpay.
5. Sees a card with plan, start date, end date and days remaining. Can come back any time.
5b. When the plan runs out, the same card turns red and says "Expired membership" with "Ended 5 days ago", and tells them how to renew. Older memberships stay below as "Earlier membership", so they keep their full history. Nobody has to mark anyone expired: it is worked out from the end date.
6. Students who prefer no fee can still pay by UPI directly from the pricing section and send a screenshot on WhatsApp. The instructor adds those by hand.

### For the instructor

1. Opens the admin page on a phone, signs in with email and password. Only the owner account works here.
2. Sees at the top: new enquiries from the website. Taps WhatsApp to reply with a ready-typed message, then Done.
3. Sees who is due for a renewal reminder (ends within 3 days or ended in the last 30). Taps WhatsApp, message is already typed, sends. The row shows "reminded" afterwards.
4. Adds UPI or cash payments received at the desk: name, phone, plan, date. Ten seconds.
5. Imports the existing member list once from a spreadsheet at the start.

### Accounts, imports, and who sees what

- There is no separate signup. Signing in with an email link is the whole account: the first sign-in with a new email creates the account. Once online payment is on, the header button reads "Sign in / Register" so new visitors know it is the same door.
- At the desk, a new online member is recognised by name and phone in the admin Active list, and by the "Hi, <name>" page on their own phone. No photo ID check, same as a UPI screenshot today.
- Importing members creates their member records and memberships, not accounts. Nothing is required from them.
- When an imported member signs in with the **same email that was in the spreadsheet**, their membership shows immediately.
- If the spreadsheet had no email for them, they see "no membership yet" until the instructor adds their email on the admin page. Then it shows.
- So: include email addresses in the spreadsheet wherever you have them.
- Phone number is the identity in the import. Two rows with the same phone are treated as the same person, so clean the sheet for wrong or shared numbers first.

## 4. What is not done

- No Razorpay account, no email provider, no domain yet. Online payment is switched off on the site until Razorpay is connected.
- All content and photos are placeholders.
- Real Razorpay has never been called. Every payment test used a stand-in that behaves like Razorpay. The first real test-mode payment is still to be done.
- Not tested: opening the UPI links in a real UPI app; the contact form's fallback to Netlify if Supabase is unreachable; the admin Edit button; real email delivery through Resend.
- Not built (later): automatic WhatsApp reminders through Meta's API; two-factor login for the owner; a member number and QR code on the membership page that the instructor scans to open that member in admin (identity check at the desk).

## 4b. What is switched off right now, and what turns it on

Everything below is **built and tested**. It is hidden only because the account behind it does not exist yet. Nothing here needs new work, just the switch.

| Hidden today | Turned on by |
|---|---|
| **Buy online** button on all four pricing cards | Razorpay account |
| **Buy panel** on the membership page: plan chooser, Pay button, Razorpay checkout | Razorpay account |
| Tapping a plan carries it across to the membership page, already chosen | Razorpay account |
| Header button reads **Sign in / Register** instead of Sign in | Razorpay account |
| Page heading reads **Join Viral Yoga** instead of Member sign-in | Razorpay account |
| Intro line reads **New here? Sign in with your email to buy a membership** | Razorpay account |
| Expired card says **Renew below** instead of pointing at UPI and WhatsApp | Razorpay account |
| UPI buttons step down to a small "pay by UPI instead" link | Razorpay account |
| **6-digit code box** on the sign-in page, so a link opened on another device still works | Domain + Resend |
| **Online fee shown to the student** ("₹5,000 + ₹118 online payment fee") | Instructor's decision, one number |

The first eight are one setting: `onlinePaymentsEnabled` in `src/data/site.ts`. The code box is `signInEmailHasCode`. The fee is `onlineFeePercent`, which must match `ONLINE_FEE_PERCENT` in `supabase/functions/_shared/payments.ts`.

Separate from these, **all content is still placeholder**: phone numbers, addresses, timetable, photos, the six invented testimonials, and the UPI ID `yourstudio@upi`. The testimonials section disappears on its own if the list is emptied.

Not built at all: automatic WhatsApp reminders, owner two-factor login, member QR code for the desk. See section 4.

The teacher section is a different case: it is **built and showing right now**, but with invented achievements. It disappears on its own if the achievements list is emptied, so it is safe to leave until you send the real ones.

## 5. What we need from you

- [ ] Studio phone number, WhatsApp number, email
- [ ] Both studio addresses and Google Maps links
- [ ] The real weekly timetable for each studio
- [ ] Photos: one wide hero shot, one about photo, up to six gallery images
- [ ] Real testimonials, or tell me to hide that section
- [ ] Teacher's name, role, two-line bio, and the list of achievements with the year of each. Send as many as you like, I put them newest first
- [ ] One square photo of the teacher, 800 x 800 px or larger
- [ ] Your UPI ID (the one that receives money)
- [ ] Current member list as a spreadsheet: name, phone, email, plan, start date
- [x] Supabase project created and connected (8 Sept)
- [ ] Domain: buy `viralyoga.in` (about ₹500 to ₹900 a year) at Namecheap or GoDaddy India, domain only, no add-ons. Needed for the email provider and the final web address. Waits until you are ready to spend.
- [ ] Razorpay: create an account at razorpay.com. Test mode works immediately; start KYC in parallel for live payments
- [ ] Resend: create a free account at resend.com for sending emails, and verify the domain above
- [ ] Instructor decision 1: online fee passed to the student, on or off
- [ ] Instructor decision 2: keep direct UPI on the website, or desk-only

## 5b. Check these the day Razorpay and the domain arrive

Four things cannot be settled until those accounts exist. They are written down here so none of them is forgotten. Agreed with the owner on 8 September: leave them until then, then work through this list.

- [ ] **Make one real test-mode payment end to end.** Every payment test so far runs against a stand-in server, not Razorpay. It behaves the way Razorpay is understood to behave, which is not the same as proof. Until a real test payment goes through, "payments are tested" carries that asterisk. Check the order, the membership, the student's page, and the admin list.
- [ ] **Deliver a real webhook and watch what happens when it fails.** The site now asks Razorpay to try again after an unexpected error. If there is a bug, every retry hits the same bug, and Razorpay may switch the webhook off after a day. Confirm the retry behaviour on a real delivery, and check the Razorpay dashboard for a disabled webhook after testing.
- [ ] **Test the 6-digit sign-in code with a real email.** It is written but has never run, because it needs the domain and Resend. Send yourself a code, sign in on a laptop with the email opened on a phone, and confirm it works. Only then set `signInEmailHasCode: true`.
- [ ] **Decide about Razorpay payment links.** Only payments started from the website are recorded automatically now. A payment made through a Razorpay link sent on WhatsApp lands in the admin attention list to be added by hand. This was deliberate, for safety. If the studio wants to use payment links often, say so and it can be revisited.

Also worth doing at the same time: ask the reviewer who wrote `docs/security-review-2026-09-08.md` for a second pass, which is what they recommended before live keys.

## 6. Steps, one at a time

1. ~~Site live on Netlify, deployed from GitHub.~~ Done 8 Sept.
2. ~~Supabase backend without payments: database, functions, admin login, enquiries.~~ Done 8 Sept.
2b. ~~Security review fixes.~~ Done 8 Sept. An external review found two high-risk flaws in the payment backend (a signed-in user could claim another member's record by phone; a failed webhook was never retried) and four smaller ones. All six are fixed and each has an automated test; the tests now run on every code change. Details: `docs/security-review-2026-09-08.md`. Nothing exploitable was live, because online payment is still switched off.

**Now waiting on the owner. Nothing is being built until one of these arrives; any order is fine:**

- **Content and photos** (section 5). I put them in and release. No money.
- **Domain `viralyoga.in`** (about ₹700 a year at namecheap.com) **and a Razorpay account** (free at razorpay.com). With both, I switch on self-service: "Buy online" appears on every plan, a new student registers by signing in with email and paying, and the membership shows instantly. We test a full purchase with fake money first.

Then, in this order:

3. **Self-service on.** Domain pointed at the site, Resend connected for emails, sign-in email with code, Razorpay in test mode, Buy online switched on, one full test purchase. Then live Razorpay keys after KYC.
4. **Security pass.** Content security policy header, owner two-factor guidance, advisor checks on the live project, repeat review before live Razorpay keys. (Order rate limit and the review findings are already done.)
5. **Pilot** with the instructor and about ten members for one to two weeks.
6. **Launch.** Supabase Pro, backups confirmed, announce the Membership link to all members.

Member import can happen at any time; it does not block anything.

**About "register":** it is built, not missing. It is hidden only until the domain and Razorpay exist, because without them students cannot receive the sign-in email or pay.

## 7. Costs

| Item | Cost |
|---|---|
| Netlify (website hosting) | Free |
| Supabase Pro (database, logins, backups, never pauses) | About ₹2,100 per month |
| Resend (emails) | Free at this volume |
| Razorpay | 2% per payment plus 18% GST on the fee, about 2.36% in total. No setup or annual fee |
| Direct UPI | Free |
| WhatsApp reminders, tap-to-send | Free |
| WhatsApp reminders, automatic (later) | About ₹0.12 per message, plus Meta business verification and possibly a provider at ₹1,000 to ₹2,500 per month |

If the online fee is passed to the student, they pay: 1 month ₹2,047, 3 months ₹5,118, 6 months ₹9,212, 1 year ₹16,378, and the studio receives the full plan price. If absorbed, on ₹5 lakh a month of online payments the fee is about ₹11,800 a month.

## 8. Decisions already made

- Backend: Supabase. Free tier for development, Pro before launch.
- Students sign in first, then buy. Purchases are tied to their account automatically.
- One owner login for admin.
- Reminders: tap-to-send on WhatsApp now, automatic later if wanted.
- Both payment paths: Razorpay online and direct UPI.
- Hosting: Netlify.
- Studio name: Viral Yoga.

## 9. Known limits to remember

- **Sign-in link is device-bound.** The link signs in only the device that opens it. Requesting on a laptop and opening the email on a phone signs in the phone, not the laptop. There is no cross-device sync. After step 3 the email also carries a code to type on the device you are using; until then the page asks you to open the link on the same device.
- **Until step 3, sign-in emails come from Supabase's built-in mailer:** only a few per hour, fixed wording, link only (no code). They do reach any address, so sign-in can be tested with a few real people, slowly.
- Supabase allows 30 sign-in emails per hour by default. This must be raised in the dashboard before launch, or a busy launch day fails.
- Free Supabase projects pause after 7 days without activity. Pro never pauses.
- Imported memberships record today's plan price, not what was paid back then.
- Students who pay by direct UPI are not linked to an account until the instructor adds their email. A phone number typed at checkout never links anyone; only the email does.
- Only payments that start from "Buy online" on the site are recorded automatically. A payment through a Razorpay link outside the site goes to the admin attention list to be added by hand.
- Contact form: 3 messages per phone number and 5 per connection every 10 minutes. Orders: at most 5 unpaid orders per member per hour.
- A paused or offline backend does not lose payments: Razorpay keeps its own record and retries for 24 hours, and anything missed appears in Razorpay's dashboard.

## 10. Things that cost money, all optional until the step that needs them

| Item | When | Cost |
|---|---|---|
| Domain `viralyoga.in` | Step 3 | About ₹500 to ₹900 a year |
| Razorpay fees | Step 3 onward | About 2.36% per online payment, or passed to the student |
| Supabase Pro | Step 6, launch | About ₹2,100 a month |
| Member QR code for desk check-in | Future | Free, small build |
| Automatic WhatsApp reminders | Future | About ₹0.12 per message plus setup, or a provider at ₹1,000 to ₹2,500 a month |

Everything else (Netlify, Supabase free tier, Resend at this volume, tap-to-send reminders) is free.

## 11. Running it and finding things

```bash
cd /Users/vaibhavthukral/Documents/Yoga_website
npm run dev        # opens http://localhost:4321
npm run build      # produces the dist folder for Netlify
```

- `src/data/site.ts`: every name, number, address, price, timetable entry and sentence on the site.
- `public/images/`: photos.
- `src/pages/admin.astro`: the admin page. `src/pages/my-membership.astro`: the student page.
- `supabase/`: database schema and the four server functions.
- `README.md`: full setup instructions for every service.
- `docs/superpowers/specs/`: design notes.
