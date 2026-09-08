# Viral Yoga website: status and next steps

Last updated: 8 September 2026

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
| Student page "My membership": sign in by email link, buy a plan online, see days remaining | Yes | Yes, with a stand-in for Razorpay | No |
| Sign in first, then buy: online payments are tied to the student's account automatically | Yes | Yes | No |
| Admin page: owner login, lists of active, due-for-reminder and lapsed members | Yes | Yes | No |
| Admin: add a UPI or cash payment by hand | Yes | Yes | No |
| Admin: one-tap WhatsApp renewal reminder, logged so you see who was reminded | Yes | Yes | No |
| Admin: import your existing member list from a spreadsheet | Yes | Yes | No |
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

- No Razorpay account and no email provider yet. Online payment is switched off on the site until Razorpay is connected.
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
- [ ] Supabase: sign in when I send the link (free account)
- [ ] Razorpay: create an account at razorpay.com. Test mode works immediately; start KYC in parallel for live payments
- [ ] Resend: create a free account at resend.com for sending emails, and verify your domain
- [ ] Instructor decision 1: online fee passed to the student, on or off
- [ ] Instructor decision 2: keep direct UPI on the website, or desk-only

## 6. Go-live steps, in order

1. Put real content and photos in, rebuild, check visually.
2. Deploy the public site to Netlify (drag the `dist` folder), enable form notifications, attach the domain.
3. Create the Supabase project, apply the database, deploy the four functions, set the secrets, create the owner login, connect Resend for emails, raise the sign-in email limit.
4. Connect Razorpay: keys, webhook, automatic capture. Make one test-mode payment end to end. Then switch to live keys.
5. Import the member list. Instructor checks the admin lists match reality.
6. Upgrade Supabase to Pro. Confirm backups are on.
7. Announce the My membership link to members.

Steps 1 and 2 can happen the same day the content arrives. Steps 3 to 6 take about a day once the accounts exist.

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

- Supabase allows 30 sign-in emails per hour by default. This must be raised in the dashboard before launch, or a busy launch day fails.
- Free Supabase projects pause after 7 days without activity. Pro never pauses.
- Imported memberships record today's plan price, not what was paid back then.
- Students who pay by direct UPI are not linked to an account until the instructor adds their email.
- A paused or offline backend does not lose payments: Razorpay keeps its own record and retries for 24 hours, and anything missed appears in Razorpay's dashboard.

## 10. Running it and finding things

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
