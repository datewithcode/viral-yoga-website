# Viral Yoga website: status and next steps

Last updated: 8 September 2026, after step 2 (backend live)

Live site (placeholder content): https://startling-beignet-f4a10f.netlify.app  
Code: https://github.com/datewithcode/viral-yoga-website

## 1. What this is

A website for Viral Yoga's two studios in Anjar and Adipur. Students see classes, timetable and prices, buy a membership online, and check their own days remaining. The instructor sees who paid, who is about to expire, and who has asked about a trial class, and replies on WhatsApp with one tap.

## 2. Where we stand today

Everything is built and tested. The public website is live with placeholder content. The Supabase backend (database, security rules, four functions) is deployed to the Viral-Yoga project in Mumbai; online payment stays switched off until the Razorpay step.

| Feature | Built | Tested | Live |
|---|---|---|---|
| Public website: home, classes, timetable per studio, prices, gallery, both maps, contact form, WhatsApp button | Yes | Yes | Yes, placeholder content |
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
| Backend: database, security rules, four server functions | Yes | Yes, including security cases | Yes, Supabase project Viral-Yoga (Mumbai) |
| Real Razorpay account | Not started | No | No |
| Deployment: Netlify | Yes | Yes | Yes, auto-deploys from GitHub `main` |
| Deployment: Supabase project | Yes | Yes | Yes, free tier for now |
| Email provider (Resend) | Not started | No | No |

All names, phone numbers, addresses, timetable entries, testimonials and photos on the site are placeholders. The studio name is already set to Viral Yoga.

## 3. How it works

### For a student

1. Opens the website, sees classes and prices.
2. Taps **Buy online** on a plan, or **My membership** in the menu.
3. Types their email. We email them a sign-in link. No signup form, no password. Their account is created automatically the first time.
4. Enters name and mobile, confirms the plan, pays with UPI, card or net banking through Razorpay.
5. Sees a card with plan, start date, end date and days remaining. Can come back any time.
6. Students who prefer no fee can still pay by UPI directly from the pricing section and send a screenshot on WhatsApp. The instructor adds those by hand.

### For the instructor

1. Opens the admin page on a phone, signs in with email and password. Only the owner account works here.
2. Sees at the top: new enquiries from the website. Taps WhatsApp to reply with a ready-typed message, then Done.
3. Sees who is due for a renewal reminder (ends within 3 days or ended in the last 30). Taps WhatsApp, message is already typed, sends. The row shows "reminded" afterwards.
4. Adds UPI or cash payments received at the desk: name, phone, plan, date. Ten seconds.
5. Imports the existing member list once from a spreadsheet at the start.

### Accounts, imports, and who sees what

- There is no separate signup. Signing in with an email link is the whole account.
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
- Not built (later): automatic WhatsApp reminders through Meta's API; two-factor login for the owner.

## 5. What we need from you

- [ ] Studio phone number, WhatsApp number, email
- [ ] Both studio addresses and Google Maps links
- [ ] The real weekly timetable for each studio
- [ ] Photos: one wide hero shot, one about photo, up to six gallery images
- [ ] Real testimonials, or tell me to hide that section
- [ ] Your UPI ID (the one that receives money)
- [ ] Current member list as a spreadsheet: name, phone, email, plan, start date
- [x] Supabase project created and connected (8 Sept)
- [ ] Domain: buy `viralyoga.in` (about ₹500 to ₹900 a year) at Namecheap or GoDaddy India, domain only, no add-ons. Needed for the email provider and the final web address. Waits until you are ready to spend.
- [ ] Razorpay: create an account at razorpay.com. Test mode works immediately; start KYC in parallel for live payments
- [ ] Resend: create a free account at resend.com for sending emails, and verify the domain above
- [ ] Instructor decision 1: online fee passed to the student, on or off
- [ ] Instructor decision 2: keep direct UPI on the website, or desk-only

## 6. Steps, one at a time

1. ~~Site live on Netlify, deployed from GitHub.~~ Done 8 Sept.
2. ~~Supabase backend without payments: database, functions, admin login, enquiries.~~ Done 8 Sept.

**Now waiting on the owner. Nothing is being built until one of these arrives; any order is fine:**

- **Content and photos** (section 5). I put them in and release. No money.
- **Domain `viralyoga.in`** (about ₹700 a year at namecheap.com) **and a Razorpay account** (free at razorpay.com). With both, I switch on self-service: "Buy online" appears on every plan, a new student registers by signing in with email and paying, and the membership shows instantly. We test a full purchase with fake money first.

Then, in this order:

3. **Self-service on.** Domain pointed at the site, Resend connected for emails, sign-in email with code, Razorpay in test mode, Buy online switched on, one full test purchase. Then live Razorpay keys after KYC.
4. **Security pass.** Content security policy header, order rate limit, owner two-factor guidance, advisor checks on the live project.
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

- **Sign-in link is device-bound.** The link signs in only the device that opens it. Requesting on a laptop and opening the email on a phone signs in the phone, not the laptop. There is no cross-device sync. After step 3 the email also carries a code to type on the device you are using; until then, open the link on the same device.
- **Until step 3, sign-in emails reach only supabase.root@gmail.com** and only a few per hour. The email template cannot be edited on the free tier without a custom email provider.
- Supabase allows 30 sign-in emails per hour by default. This must be raised in the dashboard before launch, or a busy launch day fails.
- Free Supabase projects pause after 7 days without activity. Pro never pauses.
- Imported memberships record today's plan price, not what was paid back then.
- Students who pay by direct UPI are not linked to an account until the instructor adds their email.
- A paused or offline backend does not lose payments: Razorpay keeps its own record and retries for 24 hours, and anything missed appears in Razorpay's dashboard.

## 10. Things that cost money, all optional until the step that needs them

| Item | When | Cost |
|---|---|---|
| Domain `viralyoga.in` | Step 3 | About ₹500 to ₹900 a year |
| Razorpay fees | Step 3 onward | About 2.36% per online payment, or passed to the student |
| Supabase Pro | Step 6, launch | About ₹2,100 a month |
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
