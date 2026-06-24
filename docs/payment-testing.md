# Creatly — Payment Testing Guide (Phase 2)

## Prerequisites

Before live testing, set real Paystack keys (see BLOCKERS.md):

```bash
# .env.local
PAYSTACK_SECRET_KEY=sk_test_...          # test key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Manual smoke test checklist

Run through this flow after setting test keys:

### 1. Subscribe (Solo Monthly)

1. Go to `/pricing`
2. Click **Get started** on Solo Monthly (₦1,500/month)
3. If not signed in, you're redirected to `/login`; sign in and return to `/pricing`
4. Paystack hosted page opens — use test card `4084084084084081`, any future expiry, any CVV
5. Complete payment → Paystack redirects to `/checkout/callback?reference=<ref>`
6. The callback page polls `/api/checkout/verify` every 2 s

### 2. Forward webhook locally (so Supabase gets the event)

Option A — Paystack Dashboard:
- Paystack Dashboard → Settings → Webhooks → Simulate webhook (`charge.success`)

Option B — Local forwarder:
```bash
# Using Paystack's webhook forwarder or ngrok + pasting the URL in Paystack dashboard
npx ngrok http 3000
# Then set webhook URL to: https://<ngrok>.ngrok.io/api/webhooks/paystack
```

### 3. Verify subscription activated

- Check Supabase: `select status, plan_id from subscriptions where owner_id = '<your_user_id>';`
- Should show `status = 'active'`, `plan_id = 'solo_monthly'`
- `/checkout/callback` should have redirected to `/dashboard?subscribed=1`

### 4. Download a resource (entitlement check)

1. Go to any resource detail page (`/resources/<slug>`)
2. Click **Download** — should begin a browser download (or show the signed-URL flow)
3. Check Supabase: `select creator_id, plan_type from downloads order by downloaded_at desc limit 1;`
4. Confirm a row was inserted with the correct `creator_id`

### 5. View billing page

1. Go to `/billing`
2. Should show current plan, renewal date, and payment history row

### 6. Simulate cancellation

1. `/billing` → click **Cancel subscription** → confirm in the modal
2. Check Supabase: `select cancel_at, status from subscriptions where owner_id = '<your_user_id>';`
3. `cancel_at` should be set, `status` still `active`
4. Then simulate `subscription.disable` webhook from Paystack Dashboard
5. `status` should flip to `cancelled`

### 7. Verify download blocked after cancellation

1. After subscription.disable webhook fires (status = 'cancelled')
2. Try downloading a resource → should get 403 / "Subscribe to download" prompt

---

## Stub mode (no Paystack keys)

When `PAYSTACK_SECRET_KEY` is not set:

- Checkout route returns a mock callback URL: `/checkout/callback?reference=<ref>&stub=true`
- Callback page detects `?stub=true` and simulates success after 1.2 s
- Webhook endpoint accepts all payloads without HMAC verification (logs a warning)
- All DB writes (payment_references, subscriptions, subscription_events) still use the real DB

To test the full stub flow end-to-end:
1. Leave `PAYSTACK_SECRET_KEY` unset
2. POST to `/api/checkout` with `{ planId: "solo_monthly" }`
3. Redirect to the returned `authorization_url` → callback simulates success
4. Manually POST a `charge.success` payload to `/api/webhooks/paystack` to trigger the subscription upsert:

```bash
curl -X POST http://localhost:3000/api/webhooks/paystack \
  -H "Content-Type: application/json" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "<your-reference>",
      "amount": 150000,
      "metadata": {
        "user_id": "<your-user-id>",
        "plan_id": "solo_monthly",
        "kobo": 150000
      }
    }
  }'
```

---

## Webhook unit test reference

Unit tests live in `tests/webhook.test.ts`. Run with:

```bash
pnpm test
```

Test cases:
- `valid charge.success` → subscription upserted, payment_reference marked success
- `duplicate reference` → 200 returned, no second write (idempotency guard)
- `invalid HMAC signature` → 403 (when key is set)
- `amount mismatch` → 422
- `subscription.disable` → subscription status set to 'cancelled'
