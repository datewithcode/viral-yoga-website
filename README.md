# Yoga studio website

A fast, static website for a yoga studio with two locations (Anjar and Adipur, Kutch).
Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com). No database, no server, nothing to maintain.

Sections: hero, why people come, classes, weekly timetable (per studio), about, your teacher and their achievements, photo gallery, two studio locations with Google Maps, student testimonials, common questions, contact form, WhatsApp button. Plus privacy and terms pages.

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

Also set `url` to your live address: link previews and the page addresses search engines see are built from it.

Also check the claims in the `copy` block before launch: the placeholder text promises a free first class, a same-day reply, and one plan valid at both studios. Change anything that is not true for you.

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

### Fees

The price list is in the `pricing` block of `src/data/site.ts`: a name, a price and a one-line note for each plan, and the sentence shown above them. It is for information only. The website takes no payments; fees are paid at the studio.

### Colours and fonts

Colours and typefaces are defined at the top of `src/styles/global.css` in the `@theme` block. Change the hex values there and every section updates. Fonts are loaded from Google Fonts in `src/layouts/Base.astro`.

### Privacy and terms

Two pages live at `/privacy/` and `/terms/`, linked from the footer.

The privacy page describes what the site genuinely does with personal information, which is the contact form and nothing else, so it is accurate as written. **The terms page describes how the studio runs and must be read and confirmed by the owner.** The business name on both comes from the `legal` block in `src/data/site.ts`. None of this is legal advice; have someone check it if the studio is a registered company.

## 3. Go live

### Hosting on Cloudflare Pages

The site is a folder of static files, so any host works. Nothing needs configuring: the Supabase settings are in `src/data/site.ts` and are public by design, so the build has no secrets and no environment variables.

1. Sign in at [dash.cloudflare.com](https://dash.cloudflare.com), then **Compute**, **Workers & Pages**, **Create application**, **Import a repository**.
2. Authorise GitHub for the `datewithcode` account and pick `viral-yoga-website`.
3. Project name `viral-yoga-website`, build command `npm run build`, deploy command `npx wrangler deploy`. Leave environment variables empty.
4. **Deploy.** The first build takes about a minute and gives you an address ending in `.workers.dev`.

The deploy command reads `wrangler.toml`, which says the site is a folder of static files in `dist` with a real 404 page. The project name in the dashboard must match the `name` in that file.
5. Send me that address. It goes into `site.url` in `src/data/site.ts`, which is used for link previews.

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

## 4. Enquiries and the admin page (Supabase)

The public site is static. The only things kept in the Supabase project are the messages sent through the contact form and the owner's login. Nobody else has an account.

What it gives you:

- **Enquiries in admin.** Every contact-form message is saved and listed on the admin page with a one-tap WhatsApp reply and a Done button. A copy is emailed to the studio through Resend if the email secrets are set. If Supabase cannot be reached, the form tells the visitor to message on WhatsApp instead.
- **Admin page** at `/admin`, for the owner only, signed in with email and password. Any other account is signed straight out.

### One-time setup

1. **Create the Supabase project** (or ask Claude Code to do it through the Supabase plugin). Note the project ref. Create it with "Automatically expose new tables" **off** and "Enable automatic RLS" **on**; the migrations grant table access explicitly, including the `service_role` grants the Edge Function needs (`20260908091000_service_role_grants.sql`).
2. **Apply the database schema:**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```
3. **Deploy the contact-form function.**
   ```bash
   supabase functions deploy submit-enquiry --no-verify-jwt
   ```
   For the emailed copy of enquiries, create a free account at <https://resend.com>, verify your sending domain, and set:
   ```bash
   supabase secrets set RESEND_API_KEY=re_... ENQUIRY_EMAIL_TO=you@example.com ENQUIRY_EMAIL_FROM="Viral Yoga & Nature Cure <enquiries@yourdomain.in>"
   ```
   Without these, enquiries still appear in admin; only the email copy is skipped.
4. **Create the owner login.** In the Supabase dashboard: Authentication > Users > Add user, with your email and a password. Then give it admin rights by running this in the SQL editor (replace the email):
   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "staff"}'
   where email = 'you@example.com';
   ```
   Sign out and in again if you were already signed in.
5. **Switch off sign-ups.** Authentication > Sign In / Providers: turn off **Allow new users to sign up**. Only the owner needs an account. The admin page already refuses anyone else; with sign-ups off, nobody else can even create one.
6. **Website keys.** The project URL and publishable key are in `src/data/site.ts` (`supabaseUrl`, `supabasePublishableKey`); both are public by design. To point a build at a different project, put `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env` (see `.env.example`) and run `npm run build`.

No custom email (SMTP) setup is needed: nobody signs in by email. The owner signs in with a password.

### Things to know

- **Free projects pause after 7 days without activity.** While paused, the contact form cannot save messages (it tells the visitor to use WhatsApp instead) and the admin page cannot load, until the project is restored from the Supabase dashboard. The public pages carry on. Opening the admin page once a week keeps it awake. With only enquiries stored, the Pro plan is not needed for the data; it would only remove the pausing.
- **Limits.** Contact form: 3 messages per phone and 5 per connection every 10 minutes. The admin page shows the 50 newest open enquiries.
- **Local testing** (optional, needs Docker): `supabase start`, then `bash tests/run.sh`. It resets the local database, seeds two test accounts, starts a mock Resend server and runs `tests/functions.sh` (enquiries, rate limits, row level security). The same run happens in CI on every pull request. `supabase status` prints the local URL and keys.

## Working with the code (branches)

- `main` is what is live. Nobody commits to it directly.
- `develop` is the working branch and the default on GitHub. New work happens on a short-lived branch off `develop`, named like `feat/gallery-photos` or `fix/timetable-tabs`, and comes back through a pull request.
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
  layouts/Legal.astro   shell for the privacy and terms pages
  components/           one file per section of the page
  pages/index.astro     the home page (assembles the sections)
  pages/admin.astro     owner admin page: enquiries (needs Supabase)
  pages/thanks.astro    shown after the contact form is sent
  pages/404.astro       not-found page
  lib/supabase.ts       browser client for the contact form and the admin page
public/images/          your photos
supabase/migrations/    database schema (the enquiries table and its rules)
supabase/functions/submit-enquiry/    saves contact-form messages for the admin page, emails a copy
supabase/functions/_shared/phone.ts   phone number clean-up for the function
tests/                  local integration tests (see "Local testing")
docs/security-review-2026-09-08.md  external review findings from 8 September (history)
netlify.toml            Netlify build settings
vercel.json             Vercel build settings
```
