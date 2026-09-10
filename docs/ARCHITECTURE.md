# How the Viral Yoga & Nature Cure website fits together

Last updated: 9 September 2026. Every name in this document is a real file, table or service in this repository. If something here disagrees with the code, the code is right and this page needs fixing.

The diagrams render on GitHub. Read this page at https://github.com/datewithcode/viral-yoga-website/blob/main/docs/ARCHITECTURE.md.

## 1. The whole system on one page

There are four moving parts and three outside companies. Nothing else.

```mermaid
flowchart LR
  subgraph People
    V[Visitor or member<br/>on a phone]
    I[Instructor<br/>on a phone]
  end

  subgraph Cloudflare["Cloudflare (hosting, free)"]
    SITE["The website<br/>plain HTML, CSS, a little JavaScript<br/>built from src/ by Astro"]
  end

  subgraph Supabase["Supabase (backend, Mumbai)"]
    AUTH["Auth<br/>sign-in by email link"]
    DB[("Postgres database<br/>6 tables, row-level security")]
    FN["4 Edge Functions<br/>create-order · verify-payment<br/>razorpay-webhook · submit-enquiry"]
  end

  RZ["Razorpay<br/>online payments<br/>(switched off until step 3)"]
  RS["Resend<br/>emails<br/>(switched off until step 3)"]
  WA["WhatsApp<br/>the instructor's real channel"]

  V -->|reads pages| SITE
  I -->|/admin/| SITE
  SITE -->|sign in| AUTH
  SITE -->|reads own rows| DB
  SITE -->|calls| FN
  FN -->|writes| DB
  FN <-->|orders, payments| RZ
  RZ -->|payment.captured webhook| FN
  FN -->|enquiry copy| RS
  AUTH -->|sign-in emails| RS
  I -->|one tap, message pre-written| WA
```

**The key idea:** the website is a folder of finished files. It has no server of its own. Everything that needs a server, a database or a secret runs inside Supabase. That is why hosting is free and why the public pages keep working even if Supabase is asleep.

## 2. Where everything lives

| Piece | Where | What it is |
|---|---|---|
| All content | `src/data/site.ts` | Every name, number, address, price, sentence, plan, question, and the on/off switches |
| Public pages | `src/pages/*.astro` | `index` (home), `my-membership`, `admin`, `privacy`, `terms`, `refunds`, `thanks`, `404` |
| Sections of the home page | `src/components/*.astro` | One file per section, in the order they appear on the page |
| Sign-in form | `src/components/SignIn.astro` | Self-contained. Used by the membership page |
| Browser helper | `src/lib/supabase.ts` | Creates the Supabase client and the one shared `projectRef` |
| Styling | `src/styles/global.css` | Colours and fonts as Tailwind tokens, plus the shared button and field classes |
| Database | `supabase/migrations/*.sql` | The tables, their rules, and every change in order |
| Server code | `supabase/functions/*/index.ts` | The four functions, plus `_shared/payments.ts` they all use |
| Hosting config | `wrangler.toml`, `public/_headers`, `.node-version` | Cloudflare reads these. `netlify.toml` is left over and unused |
| Tests | `tests/` | 96 backend cases, 9 build checks (incl. plan prices agreeing across files), and two browser scripts |
| Automatic checks | `.github/workflows/ci.yml` | Three jobs on every change, described in section 8 |

## 3. Who can see what

This is the most important rule in the system, and it is enforced by the database, not by the website.

```mermaid
flowchart TB
  subgraph Browser["In the browser (public, anyone can read this)"]
    PK["Publishable key<br/>can only do what row-level security allows"]
  end
  subgraph Rules["Row-level security in Postgres"]
    R1["Not signed in → sees nothing"]
    R2["Signed-in member → sees only rows whose<br/>user_id is theirs OR whose email is theirs"]
    R3["Owner (role = staff) → sees everything"]
  end
  subgraph Server["Inside Edge Functions only (never in the browser)"]
    SR["Service role<br/>bypasses row-level security"]
    SEC["Razorpay key + secret<br/>Razorpay webhook secret<br/>Resend key"]
  end
  PK --> Rules
  Rules --> DB[(database)]
  SR --> DB
```

- The **publishable key** is in the code on purpose. It cannot read anything the rules do not allow.
- The **owner** is one Supabase user whose `app_metadata.role` is `staff`. Only SQL can set that; no form can.
- A **member** is matched by the email they signed in with, or by the account id once they have bought online. That is why collecting emails matters: it is the only link between the studio's records and a login.
- **Secrets** live only as Supabase function secrets. The website never sees them.

## 4. The database

```mermaid
erDiagram
  members ||--o{ memberships : "has"
  members ||--o{ payment_orders : "creates"
  memberships ||--o{ reminders : "was reminded"
  members {
    bigint id PK
    text name
    text phone UK "digits only, 91 prefix"
    text email UK "lower-cased, the login link"
    uuid user_id UK "set once they sign in"
  }
  memberships {
    bigint id PK
    bigint member_id FK
    text plan "1 month, 3 months, 6 months, 1 year"
    int amount_paise
    date starts_on
    date ends_on "filled by a trigger"
    text source "razorpay, upi, cash"
    text razorpay_payment_id UK "makes recording idempotent"
  }
  payment_orders {
    text razorpay_order_id UK
    bigint member_id FK
    text plan
    int amount_paise
    text status "created, paid"
  }
  reminders {
    bigint membership_id FK
    timestamptz sent_at
  }
  enquiries {
    text name
    text phone
    text email
    text studio
    text message
    text ip "spam limit only"
    text status "new, done"
  }
  webhook_events {
    text event_id UK
    jsonb payload
    bool processed
    bool needs_attention "shown to the owner"
    int attempts
  }
  order_attempts {
    uuid user_id
    timestamptz created_at
  }
```

Two rows are the source of truth for money:

- `payment_orders` says which member and plan an online payment is **for**. It is created before anyone pays. A payment that does not match one of these rows is never recorded automatically.
- `memberships.razorpay_payment_id` is unique, so the same payment can arrive twice, from the browser and from the webhook, and only one membership results.

A desk payment (cash or UPI) is unique per member, plan and start date, so a double tap on the admin form cannot save it twice.

`order_attempts` and `enquiries.ip` exist only for rate limiting. `webhook_events` is a log so a payment can never be lost even when matching fails.

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

## 6. Flow: signing in and seeing your membership

```mermaid
sequenceDiagram
  actor M as Member (phone)
  participant S as SignIn.astro
  participant A as Supabase Auth
  participant P as my-membership page
  participant DB as Postgres

  M->>S: types email
  S->>A: signInWithOtp (creates the account if new)
  A-->>M: email with a link (only a link, until Resend)
  M->>A: taps link ON THE SAME DEVICE
  A-->>P: session stored in the browser
  P->>DB: select memberships (row-level security: own rows only)
  DB-->>P: their plan, or nothing
  P->>P: caches first name for the header greeting
```

Three things follow from this design:

- **There is no register button.** The first sign-in creates the account. The same email later signs the same person in.
- **The link is device-bound.** Ask on the phone, open on the phone. Step 3 adds a code you can type anywhere.
- **The email is the join.** A member record with no email shows "no membership found" until the instructor adds one with the Edit button. Adding it later works without a second sign-in.

How a member record gets created, so that a name and a plan can show:

| How the record is created | Available |
|---|---|
| The instructor adds a cash or UPI payment in admin, with the member's email | Today |
| The instructor imports the member spreadsheet, with emails | Today |
| The member buys online and types their own name and email | After Razorpay |

Sign-in asks for an email and nothing else, by decision. Signing in proves the email is yours; the name comes from the studio's records, which are more reliable than a hurried typist, and asking only newcomers would leak who is a member. The full reasoning is in `docs/STATUS.md` section 3.

## 7. Flow: buying online (built, switched off until Razorpay exists)

```mermaid
sequenceDiagram
  actor M as Member (signed in)
  participant P as my-membership page
  participant CO as create-order
  participant RZ as Razorpay
  participant VP as verify-payment
  participant WH as razorpay-webhook
  participant DB as Postgres

  M->>P: picks a plan, enters name + mobile
  P->>CO: POST (session required)
  CO->>DB: count order_attempts (15/hour) — stops phone probing
  CO->>DB: find member by user_id, else claim by verified email
  CO->>DB: refuse if the phone belongs to someone else
  CO->>DB: reuse an open order (30 min) or count orders (5/hour)
  CO->>RZ: create order (price decided here, never by the browser)
  CO->>DB: insert payment_orders
  CO-->>P: order id + key
  P->>RZ: Razorpay checkout (UPI, card, netbanking)
  RZ-->>P: payment id + signature
  P->>VP: POST
  VP->>VP: check signature, check the order is this member's
  VP->>RZ: fetch the payment, must be captured
  VP->>DB: recordPayment() → membership row, order = paid
  Note over RZ,WH: Backup path, if the browser closed
  RZ->>WH: payment.captured (signed)
  WH->>DB: log to webhook_events first
  WH->>DB: recordPayment() — same idempotent step
  WH-->>RZ: 200 done · 200 needs_attention · 500 retry me
```

`recordPayment` in `_shared/payments.ts` is the one place a membership is created from a payment. Both paths call it. It trusts only the `payment_orders` row, never the contact details on the payment, and refuses a second payment on an order already settled.

The new membership starts on the day of payment, or the day after the member's latest membership ends, whichever is later, so renewing early never loses paid days. The same rule is suggested on the admin form.

A payment that can never be recorded automatically (wrong amount, unknown order) is put in front of the owner once, whichever path saw it first; the admin page lets the owner add it against the right member, keeping the Razorpay payment id so it cannot be added twice, or mark it done.

Webhook answers mean something: **200** for done or "a human must look" (`needs_attention`), **500** for "try again later". After five failed tries it stops asking and hands it to the owner, so a bug cannot loop for a day.

## 8. How code reaches the live site

```mermaid
flowchart LR
  W[work on a branch] --> PR1[pull request → develop]
  PR1 --> CI{3 checks}
  CI -->|check-and-build| A["astro check, build,<br/>tests/build-checks.sh"]
  CI -->|functions-typecheck| B["deno check<br/>each function"]
  CI -->|functions-integration| C["local Supabase +<br/>mock Razorpay,<br/>70 cases"]
  CI --> M1[merge to develop]
  M1 --> PR2[pull request → main]
  PR2 --> CI2{same 3 checks}
  CI2 --> M2[merge to main]
  M2 --> CF["Cloudflare builds and publishes<br/>viral-yoga-website.supabase-root.workers.dev"]
```

- Nothing is committed to `main` directly. It is protected, and all three checks are required before a merge, not just the first.
- Database changes are SQL files in `supabase/migrations/`. They were applied to the live project with the Supabase tools; the functions were deployed the same way. There is no automatic backend deploy.

## 9. What is switched off, and the one switch for each

| Hidden today | Setting in `site.ts` | Turned on by |
|---|---|---|
| Buy online button, Buy panel, "Sign in / Register" label, and five more | `onlinePaymentsEnabled` | Razorpay account + secrets set in Supabase |
| 6-digit code on the sign-in page | `signInEmailHasCode` | Domain + Resend connected + email template edited |
| Online fee shown to the student | `onlineFeePercent` | The instructor's decision |

All three are built and tested. Section 4b of `docs/STATUS.md` lists each hidden item.

## 10. What is deliberately not there

- **No server of our own.** Cloudflare serves files; Supabase runs the logic. Nothing to patch, nothing to keep awake except Supabase itself.
- **No phone-number matching.** A typed phone number never selects a member. It caused an account-takeover bug and was removed.
- **No automatic member matching for payments made outside the site.** Those land in the owner's attention list.
- **No way yet to cancel, pause or refund a membership.** Planned before the pilot.
- **No automatic WhatsApp reminders.** Tap-to-send only, by design, for now.
