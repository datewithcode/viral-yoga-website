# Yoga studio website

A fast, static website for a yoga studio with two locations (Anjar and Adipur, Kutch).
Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com). No database, no server, nothing to maintain.

Sections: hero, why people come, classes, weekly timetable (per studio), about, your teacher and their achievements, photo gallery, two studio locations with Google Maps, student testimonials, common questions, contact form, WhatsApp button. Plus privacy, terms and refund pages, which Razorpay requires before it will approve an account.

How all the pieces connect, with diagrams: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 1. Run it locally

You need Node.js 22 or newer.

```bash
npm install
npm run dev        # opens http://localhost:4321
npm run build      # writes the finished site to dist/
npm run preview    # serves dist/ locally to check the build
```

## 2. Put in your own content

Everything specific to your studio is in **one file**: `src/data/site.ts`.

Edit it to change:

- studio name, tagline, description
- phone, WhatsApp number, email, Instagram
- both studio addresses, opening hours and map links
- the list of classes
- the weekly schedule (one row per class per day)
- every sentence on the page that describes your studio (the `copy` block)
- the reasons people come (the `benefits` block). Written as what a student wants, not as class names.
- the common questions (the `faqs` block). **Confirm every answer.** They describe studio policy, and what is in the file is a sensible guess, not your rules. They are also published as structured data, which means search engines read them as statements of fact, so a wrong answer here travels further than a wrong sentence elsewhere.
- your Google rating (the `google` block). Leave `rating` empty and the line stays hidden. **Never type a rating you have not earned:** copy the real numbers from your Google Business profile.
- testimonials. **The ones in the file are invented.** Replace them with real feedback or set the list to `[]` to hide the section.
- the teacher and their achievements (the `instructor` block). **Name, photo and every achievement in the file are invented.** Put in the real name, role and a short bio, then list the achievements newest first. Each one takes a `year` (leave it `''` if there is no date), a `title`, and an optional `detail` line. Set `achievements: []` to hide the whole section.

Also set `upiId` in the `pricing` block, or the UPI pay buttons will point at a dummy ID. And set `url` to your live address: the WhatsApp reminder message sent from the admin page links to it.

Also check the claims in the `copy` block before launch: the placeholder text promises a free first class, a same-day reply, and one membership valid at both studios. Change anything that is not true for you.

Then run `npm run build` again.

### Photos

Put your photos in `public/images/` and update the paths in `src/data/site.ts`.

The site crops each photo to the shape below automatically, so send the closest shape you have. Phone photos are fine if they are sharp.

| Section | How many | Shape | Send at least | File | Notes |
| --- | --- | --- | --- | --- | --- |
| Hero (top of home page) | 1 | Wide, 16:10 | 1920 x 1200 px | `/images/hero.jpg` | Headline sits bottom-left over a dark fade. Keep the important part of the photo in the upper-right two-thirds. Landscape only. |
| About | 1 | Portrait, 4:5 | 1200 x 1500 px | `/images/about.jpg` | Teacher with students, or the hall. |
| Teacher | 1 | Square, 1:1 | 800 x 800 px | `/images/instructor.jpg` | Head and shoulders of the teacher. Used beside the achievements list. |
| Gallery | 6 | Landscape, 4:3 | 1200 x 900 px | `/images/gallery-1.jpg` to `gallery-6.jpg` | Mix of both studios. The first one shows larger on phones. |
| Social preview (link card on WhatsApp, Facebook) | optional | 1.91:1 | 1200 x 630 px | `/images/og.jpg` | Set `ogImage` in `site.ts`. If left empty the hero photo is used, but only once the hero is a real JPG: **WhatsApp and Facebook cannot display an SVG**, so while the placeholder drawing is in place every shared link shows a blank card. |
| Logo | optional | Square | 512 x 512 px, PNG with transparent background or SVG | `/images/logo.png` | Set `logo` in `site.ts` to replace the lotus mark in the header. The browser tab icon is separate: set `favicon`. |

Formats: JPG for photos, PNG or SVG for a logo. Keep JPGs under ~400 KB each so the site stays fast on mobile data. [squoosh.app](https://squoosh.app) is a free tool for resizing and compressing. After adding files, update the paths in `src/data/site.ts`.

### Google Maps

The maps currently point at the towns of Anjar and Adipur. To show your exact studio:

1. Open Google Maps, search for your studio (or drop a pin on it).
2. Click **Share** then **Embed a map**, and copy the `src="..."` URL from the code it shows.
3. Paste that URL into `mapEmbedUrl` for that studio in `src/data/site.ts`.
4. For `mapLink`, click **Share** then **Copy link**.

No API key is needed.

### Membership prices and payments

Plans and prices are in the `pricing` block of `src/data/site.ts`. Two ways to get paid, and both can be on at once:

**UPI (works today, no fees).** Set `upiId` to the UPI ID you receive money on (for example `9876543210@ybl` or `studio@okaxis`) and `upiPayeeName` to the name shown to the payer. Each plan then gets a "Pay via UPI" button on phones (opens GPay, PhonePe, Paytm or any UPI app with the amount filled in) and a QR code on desktops. Payments land in your bank directly. You confirm them yourself: the page asks the student to WhatsApp you a screenshot.

**Online payment through Razorpay (UPI, cards, net banking; about 2% fee).** The "Buy online" button on each plan takes the student to `/my-membership`, where they sign in with their email and pay. The membership is tied to their account automatically and shows their days remaining. This needs the Supabase setup in section 4 and a Razorpay account (KYC takes a few days).

### Colours and fonts

Colours and typefaces are defined at the top of `src/styles/global.css` in the `@theme` block. Change the hex values there and every section updates. Fonts are loaded from Google Fonts in `src/layouts/Base.astro`.

### Privacy, terms and refunds

Three pages live at `/privacy/`, `/terms/` and `/refunds/`, linked from the footer. Razorpay's compliance team reads them during account approval and will pause your application if they are missing or do not match the business, so they are not optional once you take online payments.

The privacy page describes what the site genuinely does with personal information, so it is accurate as written. **The terms and refund pages describe studio policy and must be read and confirmed by the owner**, in particular the refund window and how long refunds take. Both come from the `legal` block in `src/data/site.ts`. None of this is legal advice; have someone check it if the studio is a registered company.

## 3. Go live

### Hosting on Cloudflare Pages

The site is a folder of static files, so any host works. Nothing needs configuring: the Supabase settings are in `src/data/site.ts` and are public by design, so the build has no secrets and no environment variables.

1. Sign in at [dash.cloudflare.com](https://dash.cloudflare.com), then **Compute**, **Workers & Pages**, **Create application**, **Import a repository**.
2. Authorise GitHub for the `datewithcode` account and pick `viral-yoga-website`.
3. Project name `viral-yoga-website`, build command `npm run build`, deploy command `npx wrangler deploy`. Leave environment variables empty.
4. **Deploy.** The first build takes about a minute and gives you an address ending in `.workers.dev`.

The deploy command reads `wrangler.toml`, which says the site is a folder of static files in `dist` with a real 404 page. The project name in the dashboard must match the `name` in that file.
5. Send me that address. It goes into `site.url` in `src/data/site.ts`, which is used for link previews and the reminder messages sent from the admin page.
6. In Supabase, **Authentication > URL Configuration**, add the new address to **Site URL** and to **Redirect URLs**, as `https://YOUR-SITE.pages.dev/my-membership/`. Sign-in emails will not work until this is done.

`public/_headers` carries the security and caching rules, the same ones `netlify.toml` sets. Both files can stay: whichever host builds the site reads its own.



### Netlify (recommended, supports drag-and-drop)

1. Run `npm run build`.
2. Go to <https://app.netlify.com/drop> and drag the **`dist`** folder onto the page. The site is live in seconds.
3. To make the contact form work: in the Netlify dashboard open your site, go to **Forms**, and click **Enable form detection**. Then under **Forms > Notifications** add an email notification so submissions reach your inbox. Without this step, submissions are stored in the dashboard but you will not be emailed.
4. Optional: **Domain settings** to attach your own domain.

If you later put the project on GitHub, connect the repo in Netlify instead. `netlify.toml` already contains the build settings, so no configuration is needed there.

### Vercel

Vercel does not have drag-and-drop. Either:

- Connect a GitHub repo at <https://vercel.com/new>. `vercel.json` already sets the framework, build command and output folder. Or:
- Deploy from your computer with `npx vercel` (it will ask you to log in the first time).

**Contact form on Vercel:** Netlify's built-in form handling does not exist on Vercel. Sign up at <https://formspree.io> (free tier is enough), create a form, and in `src/data/site.ts` set:

```ts
formProvider: 'formspree',
formspreeEndpoint: 'https://formspree.io/f/YOUR_FORM_ID',
```

Rebuild and deploy. Submissions will be emailed to you by Formspree.

### After you go live

Set `url` in `src/data/site.ts` to your real address (for example `https://shantiyoga.in`). This is used for social sharing previews and the form's thank-you redirect.

## 4. Membership system (Supabase)

The public site is static. Members, payments, and reminders live in a Supabase project (free tier works; see the note about pausing below). Design notes: `docs/superpowers/specs/2026-09-06-membership-system-design.md`.

What it gives you:

- **Automatic member list.** Every online payment is tied to the student's account and recorded with its end date the moment they pay. UPI and cash payments are added by hand in admin (ten seconds).
- **Admin page** at `/admin`, password protected. Lists who is active, who is due for a reminder (ends within 3 days or ended in the last 30), and who has lapsed. Each due row has a WhatsApp button that opens a ready-typed renewal message; the tap is logged so you can see who was already reminded.
- **Enquiries in admin.** Every contact-form message is saved and listed at the top of the admin page with a one-tap WhatsApp reply and a Done button. A copy is emailed to the studio through Resend if the email secrets are set. If Supabase is unreachable, the form falls back to Netlify Forms, so nothing is lost.
- **Student page** at `/my-membership`. The student signs in with an email link, buys a plan through Razorpay checkout, and sees plan, dates, and days remaining.

### One-time setup

1. **Create the Supabase project** (or ask Claude Code to do it through the Supabase plugin). Note the project ref. Create it with "Automatically expose new tables" **off** and "Enable automatic RLS" **on**; the migrations grant table access explicitly, including the `service_role` grants the Edge Functions need (`20260908091000_service_role_grants.sql`).
2. **Apply the database schema:**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```
3. **Razorpay keys and the webhook.**
   - Dashboard > Account & Settings > API Keys: generate a key pair. Note the Key ID and Key Secret.
   - Dashboard > Account & Settings > Webhooks > Add: URL `https://YOUR_PROJECT_REF.supabase.co/functions/v1/razorpay-webhook`, event `payment.captured`, and type any strong secret string.
   - Dashboard > Account & Settings > Payment Capture: set payments to capture automatically. Otherwise they sit as "authorized" and never become memberships.
   Then:
   ```bash
   supabase secrets set RAZORPAY_KEY_ID=rzp_live_... RAZORPAY_KEY_SECRET=... RAZORPAY_WEBHOOK_SECRET=the-secret-you-typed-in-razorpay
   supabase functions deploy razorpay-webhook --no-verify-jwt
   supabase functions deploy create-order
   supabase functions deploy verify-payment
   supabase functions deploy submit-enquiry --no-verify-jwt
   ```
   For the emailed copy of enquiries, create a free account at <https://resend.com>, verify your sending domain, and set:
   ```bash
   supabase secrets set RESEND_API_KEY=re_... ENQUIRY_EMAIL_TO=you@example.com ENQUIRY_EMAIL_FROM="Viral Yoga <enquiries@yourdomain.in>"
   ```
   Without these, enquiries still appear in admin; only the email copy is skipped. The same Resend account can be used as Supabase's SMTP provider in step 7.
   Use `rzp_test_` keys first to try a payment with Razorpay's test cards, then switch to live keys.
4. **Create the owner login.** In the Supabase dashboard: Authentication > Users > Add user, with your email and a password. Then give it admin rights by running this in the SQL editor (replace the email):
   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "staff"}'
   where email = 'you@example.com';
   ```
   Sign out and in again if you were already signed in.
5. **Sign-in email must carry a code.** Authentication > Email Templates > Magic Link. Make sure the body includes the code as well as the link, for example:
   ```html
   <h2>Sign in to Viral Yoga</h2>
   <p>Your sign-in code is <strong>{{ .Token }}</strong>. Type it on the page you were on, or open this link on this device: <a href="{{ .ConfirmationURL }}">Sign in</a>. Valid for one hour.</p>
   ```
   The link only signs in the device that opens it; the code signs in whichever device the student is using.
6. **Allow the redirect URLs** for the student sign-in link: Authentication > URL Configuration. Site URL = your live site. Add `https://YOUR-SITE/my-membership/` and `http://localhost:4321/my-membership/` to Redirect URLs.
7. **Website keys.** Copy `.env.example` to `.env`, fill in the project URL and the publishable key from Project Settings > API Keys, then `npm run build` and deploy `dist` as usual.
8. **Student emails need a mail provider, and this is required for online payment.** Students must sign in by email before they can buy, and Supabase's built-in email sends only 2 messages an hour and only to your own team's addresses. Connect an SMTP provider under Authentication > SMTP Settings before launch. Resend and Brevo both have free tiers that are plenty. The admin login is not affected.

### Things to know

- **Free projects pause after 7 days without activity.** A paused project misses webhooks, so payments made while paused will not be recorded (Razorpay shows them in its own dashboard, so nothing is lost, but you would add them by hand). Opening the admin page once a week keeps it awake. The Pro plan (about $25/month) never pauses.
- **Online fee.** To pass Razorpay's charge to the student, set `onlineFeePercent: 2.36` in `src/data/site.ts` and `ONLINE_FEE_PERCENT = 2.36` in `supabase/functions/_shared/payments.ts`, then rebuild the site and redeploy `create-order`. The student sees "₹5,000 + ₹118 online payment fee" before paying. Leave both at 0 to absorb the fee.
- **The email address is what links a member to a login.** A member record with no email can never be seen by that member on the website; they sign in and get "no membership found". Adding the email later fixes it immediately and they do not need to sign in again. Collect emails at renewals, and ask for them once on WhatsApp. See `docs/STATUS.md` section 5d.
- **Importing your existing members.** Admin > Import members takes a CSV with columns name, phone, email, plan, start_date, paid_by. Same phone = same member, and re-running a file never duplicates memberships.
- **Prices live in two places.** If you change prices in `src/data/site.ts`, change them in `supabase/functions/_shared/payments.ts` too and redeploy all three functions. The server price is what gets charged. `tests/prices-agree.mjs` (run by the build checks) fails the build if the two disagree, or if a plan name is missing from `src/lib/supabase.ts` or the database.
- **Attention list.** A payment the system could not match is kept in "Payments that need attention" on the admin page. Only payments that started from "Buy online" on the site are recorded automatically; a payment made through a Razorpay Payment Link or Button outside the site always lands here. "Add this payment" opens the form pre-filled and keeps the Razorpay payment id, so it cannot be added twice; "Done" clears it.
- **Renewals.** A new membership starts the day after the member's latest one ends (or today, if none is running), online and at the desk, so paying early never loses days. The desk form suggests the date and says why; it can be changed.
- **Who gets linked to which member.** A signed-in student is matched to the member record with the same email (set by import or in admin). A phone number typed at checkout never selects a member, and a number that already belongs to someone else is refused. So give walk-in members' emails to the admin page and they link themselves on first sign-in.
- **Limits.** Contact form: 3 messages per phone and 5 per connection every 10 minutes. Orders: an unpaid order is reused for 30 minutes, at most 5 new orders per member per hour.
- **What a member sees.** A plan paid for early says "Upcoming membership, starts on 1 Oct"; the running one says "Current membership"; once nothing is running the newest finished one says "Expired membership" in red with "Ended N days ago" and how to renew; older ones say "Earlier membership". `tests/browser-membership.mjs` checks this in a real browser (by hand, not in CI).
- **Local testing** (optional, needs Docker): `supabase start`, then `bash tests/run.sh`. It resets the local database, seeds test accounts, starts a mock Razorpay/Resend server and runs `tests/functions.sh` (payments, webhook retries, member linking, rate limits, row level security). The same run happens in CI on every pull request. `supabase status` prints the local URL and keys.

## Working with the code (branches)

- `main` is what is live. Nobody commits to it directly.
- `develop` is the working branch and the default on GitHub. New work happens on a short-lived branch off `develop`, named like `feat/member-import` or `fix/timetable-tabs`, and comes back through a pull request.
- To release, open a pull request from `develop` into `main`. Merging it is the deploy trigger once Netlify is connected to the repository.
- Every pull request runs the type check and the build automatically (see `.github/workflows/ci.yml`). Do not merge red.

```bash
git checkout develop && git pull
git checkout -b feat/short-name
# ... work, commit ...
git push -u origin feat/short-name
gh pr create --base develop
```

## Project layout

```
src/
  data/site.ts          all editable content
  styles/global.css     colours, fonts, shared classes
  layouts/Base.astro    page shell, <head>, nav, footer
  components/           one file per section of the page
  pages/index.astro     the home page (assembles the sections)
  pages/thanks.astro    shown after the contact form is sent
  pages/404.astro       not-found page
public/images/          your photos
pages/admin.astro     owner admin page (needs Supabase)
  pages/my-membership.astro  student page (needs Supabase)
  lib/supabase.ts       browser client, shared helpers
src/components/SignIn.astro  sign-in and sign-up form, one email field, no password
supabase/migrations/    database schema (tables, policies)
supabase/functions/_shared/payments.ts  plan prices, payment recording (shared)
supabase/functions/create-order/      makes a Razorpay order for the signed-in student
supabase/functions/verify-payment/    confirms checkout and records the membership
supabase/functions/razorpay-webhook/  backup path: Razorpay tells us about every payment
supabase/functions/submit-enquiry/    saves contact-form messages for the admin page, emails a copy
tests/                  local integration tests for the functions (see "Local testing")
docs/security-review-2026-09-08.md  external review findings and how each was fixed
netlify.toml            Netlify build settings
vercel.json             Vercel build settings
```
