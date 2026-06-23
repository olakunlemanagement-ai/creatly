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

*Log resolutions here as: `✅ Resolved YYYY-MM-DD — <note>`*
