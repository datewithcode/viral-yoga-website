# How the Viral Yoga & Nature Cure website fits together

Last updated: 11 September 2026. Every name in this document is a real file, table or service in this repository. If something here disagrees with the code, the code is right and this page needs fixing.

The diagrams render on GitHub. Read this page at https://github.com/datewithcode/viral-yoga-website/blob/main/docs/ARCHITECTURE.md.

## 1. The whole system on one page

There are four moving parts and two outside companies. Nothing else.

```mermaid
flowchart LR
  subgraph People
    V[Visitor<br/>on a phone]
    I[Instructor<br/>on a phone]
  end

  subgraph Cloudflare["Cloudflare (hosting, free)"]
    SITE["The website<br/>plain HTML, CSS, a little JavaScript<br/>built from src/ by Astro"]
  end

  subgraph Supabase["Supabase (backend, Mumbai)"]
    AUTH["Auth<br/>the owner's login only"]
    DB[("Postgres database<br/>1 table: enquiries")]
    FN["1 Edge Function<br/>submit-enquiry"]
  end

  RS["Resend<br/>emailed copy of each enquiry<br/>(not set up yet)"]
  WA["WhatsApp<br/>the instructor's real channel"]

  V -->|reads pages| SITE
  I -->|/admin/| SITE
  SITE -->|contact form| FN
  FN -->|writes| DB
  FN -->|enquiry copy| RS
  SITE -->|owner signs in| AUTH
  SITE -->|owner reads enquiries| DB
  I -->|one tap, message pre-written| WA
```

**The key idea:** the website is a folder of finished files. It has no server of its own. Everything that needs a server, a database or a secret runs inside Supabase. That is why hosting is free and why the public pages keep working even if Supabase is asleep.

## 2. Where everything lives

| Piece | Where | What it is |
|---|---|---|
| All content | `src/data/site.ts` | Every name, number, address, fee, sentence, class and question |
| Pages | `src/pages/*.astro` | `index` (home), `admin`, `privacy`, `terms`, `thanks`, `404` |
| Sections of the home page | `src/components/*.astro` | One file per section, in the order they appear on the page |
| Browser helper | `src/lib/supabase.ts` | Creates the Supabase client used by the contact form and the admin page |
| Styling | `src/styles/global.css` | Colours and fonts as Tailwind tokens, plus the shared button and field classes |
| Database | `supabase/migrations/*.sql` | The tables, their rules, and every change in order. Only `enquiries` is left |
| Server code | `supabase/functions/submit-enquiry/index.ts` | The contact-form function, plus `_shared/phone.ts` |
| Hosting config | `wrangler.toml`, `public/_headers`, `.node-version` | Cloudflare reads these. `netlify.toml` is left over and unused |
| Tests | `tests/` | 27 backend cases, 7 build checks, and a browser script for phone widths |
| Automatic checks | `.github/workflows/ci.yml` | Three jobs on every change, described in section 7 |

## 3. Who can see what

This rule is enforced by the database, not by the website.

```mermaid
flowchart TB
  subgraph Browser["In the browser (public, anyone can read this)"]
    PK["Publishable key<br/>can only do what row-level security allows"]
  end
  subgraph Rules["Row-level security in Postgres"]
    R1["Not signed in → sees nothing"]
    R2["Any other signed-in account → sees nothing"]
    R3["Owner (role = staff) → reads enquiries and marks them done"]
  end
  subgraph Server["Inside the Edge Function only (never in the browser)"]
    SR["Service role<br/>writes enquiries through submit_enquiry()"]
    SEC["Resend key"]
  end
  PK --> Rules
  Rules --> DB[(database)]
  SR --> DB
```

- The **publishable key** is in the code on purpose. It cannot read anything the rules do not allow.
- The **owner** is one Supabase user whose `app_metadata.role` is `staff`. Only SQL can set that; no form can. The admin page signs any other account straight out.
- **Nobody else needs an account.** With "Allow new users to sign up" switched off in Supabase Auth, none can be created.
- **Enquiries arrive through the function**, which checks the honeypot, validates the fields and applies the rate limits inside `submit_enquiry()`. A visitor cannot write one any other way, or call `submit_enquiry()` directly.
- **Secrets** live only as Supabase function secrets. The website never sees them.

## 4. The database

```mermaid
erDiagram
  enquiries {
    bigint id PK
    text name
    text phone "digits only, 91 prefix"
    text email
    text studio
    text interest
    text message
    text ip "spam limit only"
    text status "new, done"
    timestamptz created_at
  }
```

One table. `ip` exists only for rate limiting. Nothing else about visitors is stored.

## 5. Flow: someone asks about a trial class

This is the loop the instructor uses every day, and it is fully confirmed on the live site.

```mermaid
sequenceDiagram
  actor V as Visitor
  participant S as Website (Contact.astro)
  participant F as submit-enquiry
  participant DB as Postgres
  participant R as Resend
  actor I as Instructor (admin page)

  V->>S: fills name, phone, studio, message
  S->>F: POST (no login needed)
  F->>F: honeypot, validation
  F->>DB: submit_enquiry() — locked limits: 3/phone, 5/address
  DB-->>F: ok, or which limit was hit
  F->>R: email copy (skipped until Resend exists)
  F-->>S: ok
  S->>V: /thanks/
  I->>DB: opens /admin/, reads enquiries (staff rule)
  I->>I: taps WhatsApp — message already written
  I->>DB: taps Done — status = done
```

If the function is unreachable the form tells the visitor to WhatsApp instead. There is no second place the message can go.

## 6. Flow: the owner signs in

The admin page signs in with email and password. If the account's `app_metadata.role` is not `staff`, the page signs it out again and says so. Once in, it lists the 50 newest open enquiries; Done sets an enquiry's status to `done`. The website has no other sign-in.

## 7. How code reaches the live site

```mermaid
flowchart LR
  W[work on a branch] --> PR1[pull request → develop]
  PR1 --> CI{3 checks}
  CI -->|check-and-build| A["astro check, build,<br/>tests/build-checks.sh"]
  CI -->|functions-typecheck| B["deno check<br/>the function"]
  CI -->|functions-integration| C["local Supabase +<br/>mock Resend,<br/>27 cases"]
  CI --> M1[merge to develop]
  M1 --> PR2[pull request → main]
  PR2 --> CI2{same 3 checks}
  CI2 --> M2[merge to main]
  M2 --> CF["Cloudflare builds and publishes<br/>viral-yoga-website.supabase-root.workers.dev"]
```

- Nothing is committed to `main` directly. It is protected, and all three checks are required before a merge, not just the first.
- Database changes are SQL files in `supabase/migrations/`. They were applied to the live project with the Supabase tools; the function was deployed the same way. There is no automatic backend deploy.

## 8. What is deliberately not there

- **No server of our own.** Cloudflare serves files; Supabase runs the logic. Nothing to patch, nothing to keep awake except Supabase itself.
- **No payments.** Fees are paid at the studio; the fee list on the site is for information.
- **No member records and no member logins.** The website does not know who is a member. Removed on 11 September; the earlier version is on branch `main_backup_payment` and tag `backup-2026-09-11`.
- **No automatic WhatsApp messages.** Replies are tap-to-send, by design.
