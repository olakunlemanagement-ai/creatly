# Creatly — Blockers & Founder Actions

Items that require a human decision or dashboard action that cannot be automated in code.
Resolved items are struck through and dated.

---

## 1.9.0 — Verification Email (Resend SMTP + DNS)

### A. Wire Resend SMTP in Supabase dashboard

Supabase → Project Settings → Authentication → SMTP

| Field | Value |
|-------|-------|
| Enable custom SMTP | ✅ |
| Sender name | Creatly |
| Sender email | noreply@joincreatly.com |
| Host | smtp.resend.com |
| Port number | 465 |
| Username | resend |
| Password | `<your RESEND_API_KEY>` |

**After saving:** Send a test email from the Supabase dashboard to confirm delivery.

---

### B. Redirect URL allow-list in Supabase Auth

Supabase → Project Settings → Authentication → URL Configuration

| Field | Value |
|-------|-------|
| Site URL | https://joincreatly.com |
| Redirect URLs | https://joincreatly.com/** |
| | http://localhost:3000/** |
| | https://*.vercel.app/** |

A missing redirect URL causes an `otp_expired` / 404 even when the email sends fine.

---

### C. DNS verification for joincreatly.com (Resend domain)

Resend dashboard → Domains → Add `joincreatly.com` → copy the DNS records below and add them to your DNS provider (Cloudflare / Namecheap / etc.).

**Records required (exact values from Resend dashboard — copy from there):**

| Type | Name | Value |
|------|------|-------|
| TXT | `resend._domainkey.joincreatly.com` | `<DKIM value from Resend>` |
| TXT | `joincreatly.com` | `v=spf1 include:amazonses.com ~all` |

> ⚠️ Values above are placeholders. Get the exact records from **Resend → Domains → joincreatly.com → DNS Records** and paste them here once retrieved.

DNS propagation can take up to 24 hours. Resend will show a green "Verified" badge when done.

---

### D. Custom email template in Supabase

Supabase → Project Settings → Authentication → Email Templates → Confirm signup

Replace the default template body with the HTML content from `emails/confirm-signup.html`.
Make sure the template contains `{{ .ConfirmationURL }}` — do NOT remove it.

---

### E. Add RESEND_API_KEY to Vercel

Vercel → Project → Settings → Environment Variables

| Name | Value | Environment |
|------|-------|-------------|
| `RESEND_API_KEY` | `re_...` | Production, Preview |

The app validates this at boot (`lib/env.ts`) and will fail to start if it is missing.

---

---

## 1.10.5 — First Admin Bootstrap

Before any asset can be manually reviewed, at least one user must have `role = 'admin'` in the `profiles` table. There is no sign-up flow for admins — the first admin is bootstrapped via SQL.

### Steps

1. Sign up normally at `/signup` with the admin email address.
2. In the Supabase dashboard → SQL Editor, run:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-admin@example.com';
```

3. The user can now access `/admin/review`. Non-admins get a 404 (no information leak).

> ⚠️ This only needs to be done once. Subsequent admins can be promoted by the first admin via the same SQL command, or via an admin management UI added in a future step.

---

## Phase 2 — Paystack API Keys (BLOCKER)

The following environment variables are required for live payment processing. Until they are set, Paystack API calls are stubbed with mock responses. Everything else in Phase 2 (DB schema, pricing page, billing UI, webhook structure, team invites) is fully wired and testable without these keys.

### Required env vars

| Var | Where used | How to get |
|-----|-----------|------------|
| `PAYSTACK_SECRET_KEY` | Server only — checkout route, webhook HMAC verification, subscription cancel | Paystack Dashboard → Settings → API Keys → Secret key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Client — Paystack Inline.js (if used for card forms) | Paystack Dashboard → Settings → API Keys → Public key |

### Steps to activate

1. **Get keys:** Paystack Dashboard → Settings → API Keys
   - Use `sk_test_...` / `pk_test_...` for development
   - Use `sk_live_...` / `pk_live_...` for production

2. **Add to `.env.local`:**
   ```
   PAYSTACK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Add to Vercel (production):**
   Vercel → Project → Settings → Environment Variables
   ```
   PAYSTACK_SECRET_KEY         = sk_live_...   (Production, Preview)
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = pk_live_...   (Production, Preview)
   NEXT_PUBLIC_APP_URL         = https://joincreatly.com  (Production)
   ```

4. **Register webhook in Paystack Dashboard:**
   - Webhook URL: `https://joincreatly.com/api/webhooks/paystack`
   - Events: `charge.success`, `subscription.disable`, `invoice.payment_failed`, `invoice.create`

5. **Remove stubs:** Search codebase for `TODO: replace with real Paystack call` and swap in the real implementations.

> ⚠️ The `PAYSTACK_SECRET_KEY` is used for HMAC-SHA512 webhook signature verification. Without it, the webhook handler accepts all payloads (stub mode). This MUST be set before going live.

---

## Phase 4 — First Admin Bootstrap

Before any admin routes are accessible, at least one user must have `role = 'admin'` in the `profiles` table. Run this SQL in the Supabase SQL Editor after signing up normally:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'olakunle.management@gmail.com';
```

Non-admins are redirected to `/dashboard` (not a 404 — the role check is in the admin layout, not middleware, so the URL space is not leaked).

---

---

## Sentry Error Monitoring (BLOCKER)

Sentry is wired up but **not active** until the DSN and (optionally) auth token are set.

### Required env vars

| Var | Where | How to get |
|-----|-------|-----------|
| `NEXT_PUBLIC_SENTRY_DSN` | Client + Server | sentry.io → Project → Settings → Client Keys → DSN |
| `SENTRY_AUTH_TOKEN` | CI/Build only | sentry.io → Settings → Auth Tokens → Create new token (scope: `project:releases`, `org:read`) |
| `SENTRY_ORG` | CI/Build only | Your Sentry organisation slug (visible in the Sentry URL) |
| `SENTRY_PROJECT` | CI/Build only | Your Sentry project slug |

### Steps to activate

1. Create a project at **sentry.io** (platform: Next.js).
2. Copy the DSN and add it to `.env.local` and Vercel environment variables.
3. For source map uploads in CI, create an auth token and add `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` to your CI/Vercel env.
4. In development, hit `GET /api/sentry-test` to confirm errors are flowing into your Sentry dashboard.

> ⚠️ Without `NEXT_PUBLIC_SENTRY_DSN`, errors are silently dropped. The app boots and runs normally — Sentry is a no-op until the DSN is set.

---

*Log resolutions here as: `✅ Resolved YYYY-MM-DD — <note>`*
