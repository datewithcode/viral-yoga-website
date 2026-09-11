# Viral Yoga & Nature Cure website: status and next steps

Last updated: 11 September 2026, after payments and member records were removed from the website

Live site (placeholder content): https://viral-yoga-website.supabase-root.workers.dev  
Code: https://github.com/datewithcode/viral-yoga-website

## 1. What this is

A website for Viral Yoga & Nature Cure's two studios in Anjar and Adipur. Visitors see the classes, the timetable for each studio, the fees, the teacher, both locations and the common questions, and ask for a free trial class through the contact form or on WhatsApp. The instructor sees every enquiry on the admin page and replies on WhatsApp with one tap.

Nothing is paid and nothing about members is kept on the website. Fees are paid at the studio.

## 2. Where we stand today

Everything is built and tested. The public website is live with placeholder content. The Supabase project in Mumbai holds only the contact-form messages and the owner's login.

| Feature | Built | Tested | Live |
|---|---|---|---|
| Public website: home, classes, timetable per studio, fees, gallery, both maps, contact form, WhatsApp button | Yes | Yes | Yes, placeholder content |
| Teacher section: photo, short bio, and a dated list of achievements | Yes | Yes | Yes, placeholder content |
| "Why people come": what students actually want, in their words | Yes | Yes | Yes, wording to confirm |
| Common questions, answering what the instructor is asked over and over | Yes | Yes | Yes, answers to confirm |
| Google rating shown on the page | Yes | Yes | Hidden until you send the real numbers |
| Privacy and terms pages | Yes | Yes | Yes, terms to confirm |
| Admin page: owner login, and the enquiries from the contact form with WhatsApp reply and Done | Yes | Yes | Yes |
| Backend: the enquiries table, its security rules, and the contact-form function | Yes | Yes, 29 automated cases run on every code change | Yes, Supabase project Viral-Yoga (Mumbai) |
| Deployment: Cloudflare | Yes | Yes | Live at viral-yoga-website.supabase-root.workers.dev, auto-deploys from GitHub |
| Deployment: Netlify | Yes | Yes | Retired 9 Sept when the build credits ran out. The old address still serves an old copy; nothing depends on it |
| Email provider (Resend) | Not started | No | No. Only needed for an emailed copy of each enquiry |

All names, phone numbers, addresses, timetable entries, testimonials, achievements and photos on the site are placeholders, including the teacher's name and achievement list. The studio name is already set to Viral Yoga & Nature Cure.

## 2a. Payments and member records removed, 11 September

The owner decided the website should be information and enquiries only. Removed:

- Online payment: the Buy online button, the checkout, the three payment functions and their tables, the attention list and the online fee option.
- The UPI QR codes and pay buttons. The pricing section is now a plain list of fees, headed "Fees", with one Book a free trial link.
- The member area: member sign-in, the page showing days remaining, and the Sign in button in the menu.
- Everything about members on the admin page: adding and importing members, the active, due and lapsed lists, and the WhatsApp renewal reminder button. The admin page now shows only enquiries.
- The refunds page, and the member and payment parts of the privacy and terms pages.

The full earlier version is kept on branch `main_backup_payment` and tag `backup-2026-09-11`, if it is ever wanted back.

On the live Supabase project, after this is released:

- [ ] Run the 11 September migration (the newest file in `supabase/migrations/`) in the SQL editor. It removes every table except `enquiries`, and the database functions that only served members.
- [ ] Delete the three payment functions under Edge Functions, leaving only `submit-enquiry`.
- [ ] Authentication > Sign In / Providers: turn off **Allow new users to sign up**. Only the owner needs an account now.
- [ ] Authentication > Users: any account other than the owner's came from member sign-in and can be deleted.

## 2b. How to check the tests yourself

1. **GitHub Actions**: https://github.com/datewithcode/viral-yoga-website/actions. The latest run on `main` has three green checks. Open `functions-integration`, expand "bash tests/run.sh": 29 lines starting with PASS, one per case, each named after what it proves (for example "parallel burst: exactly three stored").
2. **The tests are in the repo**: `tests/functions.sh`. Anyone can read what each case does.
3. **Run them on the laptop** (Docker running): `git pull`, `supabase start`, `bash tests/run.sh`. Last line: `passed 29, failed 0`.
4. **Live site**: send four contact-form messages with the same phone number. The fourth is refused with "Too many messages from this number".
5. **For the reviewer**: `docs/security-review-2026-09-08.md` lists each finding from 8 September. Only F03, the contact-form limits, applies to what is left; the other five were in the payment and member code removed on 11 September.

**Done, 10 September:** protect-main requires all three checks (`check-and-build`, `functions-typecheck`, `functions-integration`) before a merge to main.

## 2c. Confirmed working on the live site, 9 September

Checked by the owner on a real phone against the live site, not by me on a test copy:

- [x] **Contact form.** Sent from the phone, landed on the thank-you page.
- [x] **Enquiry reaches admin.** Appeared under Enquiries with name, number, studio and message.
- [x] **One-tap WhatsApp reply.** Opens WhatsApp with the message already written, addressed to the enquirer.
- [x] **Done button.** Clears the enquiry from the list.

That is the loop the instructor will use every day: someone asks about a trial class, the instructor sees it on their phone, replies in one tap, and clears it.

Two faults were found and fixed during this testing, both mine: the menu on phones collapsed and let the page scroll behind it, and the footer's row of links could not wrap, which made every page scroll sideways on any phone narrower than 477px.

## 3. How it works

### For a visitor

1. Opens the website, sees the classes, the timetable, the fees and both studios.
2. Sends the contact form, or taps WhatsApp, to ask for a free trial class.
3. Comes to the class. Joining and paying happen at the studio.

### For the instructor

1. Opens the admin page on a phone and signs in with email and password. Only the owner account works here.
2. Sees the new enquiries from the website. Taps WhatsApp to reply with a ready-typed message, then Done.

## 4. What is not done

- No email provider and no domain yet. Neither is needed for the site to work; Resend only adds an emailed copy of each enquiry.
- All content and photos are placeholders.
- Not tested: real email delivery through Resend.
- Not built (later): two-factor login for the owner.

The teacher section is **built and showing right now**, but with invented achievements. It disappears on its own if the achievements list is emptied, so it is safe to leave until you send the real ones. The testimonials section does the same if its list is emptied.

## 5. What we need from you

- [ ] Studio phone number, WhatsApp number, email
- [ ] Both studio addresses and Google Maps links
- [ ] The real weekly timetable for each studio
- [ ] Photos: one wide hero shot, one about photo, up to six gallery images
- [ ] Real testimonials, or tell me to hide that section. Send the person's age and how long they have come, which is what makes them convincing
- [ ] Your Google Business listing link, and the rating and review count showing on it. Nothing is displayed until you send these, because a rating must never be invented
- [ ] Read the ten answers in the questions section and correct anything that is not your policy. They are published in a form search engines read as fact, so a wrong answer matters
- [ ] Read `/terms/` and confirm it describes how the studio runs
- [ ] Teacher's name, role, two-line bio, and the list of achievements with the year of each. Send as many as you like, I put them newest first
- [ ] One square photo of the teacher, 800 x 800 px or larger
- [x] Supabase project created and connected (8 Sept)
- [ ] Domain, optional: `viralyoga.in` (about ₹500 to ₹900 a year) at Namecheap or GoDaddy India, domain only, no add-ons. Gives the site its own address and lets Resend send from it.
- [ ] Resend, optional: a free account at resend.com, with the domain above verified, for an emailed copy of each enquiry

## 5c. Hosting, as of 9 September

The site runs on **Cloudflare** at https://viral-yoga-website.supabase-root.workers.dev and rebuilds itself whenever code reaches GitHub. It is free, with no build limits at this size.

It moved off Netlify because that account ran out of monthly build credits, which froze deploys. The old Netlify address still serves an older copy of the site; nothing points at it any more, and it can be deleted whenever you like.

The build needs no settings at all. The Supabase address and key live in `src/data/site.ts`, and both are public by design, so there is nothing to configure on a new host and nothing to forget.

- [ ] Confirm in the Cloudflare dashboard that the production branch is `main`, not `develop`. `develop` is work in progress; `main` is what has been released and checked.

## 6. Steps, one at a time

1. ~~Site live on Netlify, deployed from GitHub.~~ Done 8 Sept. Moved to Cloudflare 9 Sept.
2. ~~Supabase backend: database, contact-form function, admin login, enquiries.~~ Done 8 Sept.
2b. ~~Security review fixes.~~ Done 8 Sept. Details: `docs/security-review-2026-09-08.md`.
2c. ~~Payments and member records removed from the website.~~ Done 11 Sept, see section 2a.

**Now waiting on the owner:**

- **Content and photos** (section 5). I put them in and release. No money.
- Optional: **a domain and a free Resend account**, for the site's own address and an emailed copy of each enquiry.

Then:

3. **Security pass.** Content security policy header, owner two-factor guidance, advisor checks on the live project.
4. **Launch.** Share the website freely: on Instagram, in print, anywhere.

## 7. Costs

| Item | Cost |
|---|---|
| Cloudflare (website hosting) | Free |
| Supabase free plan (enquiries and the owner login) | Free. Pauses after a week without activity, see section 9 |
| Supabase Pro (never pauses) | About ₹2,100 per month. Optional: with only enquiries stored, it is not needed for the data |
| Resend (emailed copy of each enquiry) | Free at this volume |
| Domain | About ₹500 to ₹900 a year, optional |
| WhatsApp replies, tap-to-send | Free |

## 8. Decisions already made

- The website is information and enquiries only. No payments and no member records: fees are paid at the studio (decided 11 Sept).
- Backend: Supabase, holding only enquiries and the owner's login.
- One owner login for admin.
- Replies: tap-to-send on WhatsApp.
- Hosting: Cloudflare (moved from Netlify on 9 Sept).
- Studio name: Viral Yoga & Nature Cure.

## 9. Known limits to remember

- Free Supabase projects pause after 7 days without activity. While paused, the contact form cannot save messages (the visitor is told to use WhatsApp instead) and the admin page cannot load, until the project is restored in the Supabase dashboard. Opening the admin page once a week keeps it awake. Pro never pauses.
- Contact form: 3 messages per phone number and 5 per connection every 10 minutes.
- The admin page shows the 50 newest open enquiries.

## 10. Running it and finding things

```bash
cd /Users/vaibhavthukral/Documents/Yoga_website
npm run dev        # opens http://localhost:4321
npm run build      # produces the dist folder
```

- `src/data/site.ts`: every name, number, address, fee, timetable entry and sentence on the site.
- `public/images/`: photos.
- `src/pages/admin.astro`: the admin page.
- `supabase/`: the enquiries table and the contact-form function.
- `README.md`: full setup instructions for every service.
- `docs/ARCHITECTURE.md`: how every piece connects, with diagrams.
- `docs/superpowers/specs/`: design notes from 6 September, kept as history.
