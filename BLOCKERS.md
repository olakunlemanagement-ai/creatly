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

## ~~Phase 2 — Paystack API Keys~~ ✅ Resolved 2026-06-26

Keys provisioned and all stubs replaced. Real Paystack calls are active.

### ⚠️ FOUNDER ACTION REQUIRED — Register webhook in Paystack Dashboard

Log in to [Paystack Dashboard](https://dashboard.paystack.com) → Settings → API → Webhooks

| Field | Value |
|-------|-------|
| Webhook URL | `https://joincreatly.com/api/webhooks/paystack` |
| Events | `charge.success`, `subscription.disable`, `invoice.payment_failed`, `invoice.create` |

Without this, subscription activations will not fire after payment. Test with Paystack test card: `4084 0840 8408 4081`, expiry any future date, CVV `408`.

### Vercel env vars to add before going live

Vercel → Project → Settings → Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `PAYSTACK_SECRET_KEY` | `sk_live_...` | Production |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | `pk_live_...` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://joincreatly.com` | Production |

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

---

## Phase 5 — Creator Earnings & Payouts

### 1. Enable Paystack Transfers (founder action)

Paystack Transfers (the Transfer API used for creator payouts) must be explicitly enabled on the account — it is off by default.

**Steps:**
1. Log in to your Paystack Dashboard.
2. Go to **Settings → Preferences → Transfers**.
3. Enable transfers.
4. Ensure your Paystack account is fully verified and has sufficient balance before triggering payouts.

> Without this, `POST /api/admin/process-payouts` will fail with a Paystack error.

---

### 2. First earnings calculation (admin action)

Earnings are NOT calculated automatically. An admin must trigger them manually each month:

1. Go to `/admin/earnings`.
2. Select the month (e.g. `2026-06`).
3. Click **Calculate earnings** — this upserts `creator_earnings` rows.
4. Review the table, then click **Process payouts** to trigger Paystack transfers.

> Automated cron scheduling is a future enhancement. For now, this is a monthly admin task.

---

### 3. Paystack Transfer webhook events

The following Paystack webhook events must be subscribed to in the Paystack Dashboard for payout status to update automatically:

| Event | Effect |
|-------|--------|
| `transfer.success` | Marks payout as `success` + sets `settled_at` |
| `transfer.failed` | Marks payout as `failed` + stores `failure_reason` |
| `transfer.reversed` | Marks payout as `reversed` |

Add these to the existing webhook subscription at:
**Paystack Dashboard → Settings → API Keys & Webhooks → Webhook URL**

---

---

## CP1.14 — Google OAuth Provider (BLOCKER)

The `GoogleOAuthButton` component is wired up on `/login` and `/signup` and calls
`supabase.auth.signInWithOAuth({ provider: "google" })`. The button is ready — but
Google OAuth **will not work** until the following two steps are completed by the founder:

### Step 1 — Create a Google Cloud OAuth 2.0 client

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**.
3. Application type: **Web application**.
4. Name: `Creatly`.
5. Add Authorised JavaScript origins:
   - `https://joincreatly.com`
   - `http://localhost:3000`
6. Add Authorised redirect URIs (copy from Supabase — step 2 below):
   - `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
7. Click **Create**. Copy the **Client ID** and **Client Secret**.

### Step 2 — Enable Google provider in Supabase

1. Go to Supabase Dashboard → Authentication → Providers → Google.
2. Toggle **Enabled** on.
3. Paste the **Client ID** and **Client Secret** from Step 1.
4. Copy the **Callback URL** shown by Supabase and paste it into Google Cloud Console (Step 1, item 6).
5. Save.

**No code change needed** — the button is already deployed. OAuth will activate as soon as the provider is enabled in Supabase.

---

## CP1.15 — 5 GB Upload Cap (BLOCKER: Supabase Pro required)

`MAX_FILE_SIZE_BYTES` is now set to 5 GB and `TUS_THRESHOLD_BYTES` is 100 MB (above which
TUS resumable upload should be used). However, the **Supabase Free plan caps individual
storage objects at 50 MB**. Uploads larger than 50 MB will fail until:

### Required founder action

1. Upgrade the Supabase project to the **Pro plan** (Supabase Dashboard → Settings → Billing).
   - Pro plan allows up to **50 GB** per object (configurable).
2. In Supabase → Storage → Buckets → `resources` → Edit:
   - Set **Max upload size** to `5368709120` (5 GB in bytes).
3. For files above 100 MB, the upload wizard should use **TUS resumable upload** via
   `@supabase/storage-js` `UploadManager`. This is not yet implemented in `UploadWizard.tsx`
   — it is marked for a future step once Pro is active.

**Current state:** The validation cap is raised in code. Files up to 50 MB will work on Free plan.
Files 50 MB–5 GB will fail until Pro is active.

*Log resolutions here as: `✅ Resolved YYYY-MM-DD — <note>`*
