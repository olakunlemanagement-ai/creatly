# Creatly — Build Plan

**Purpose:** This is the authoritative, ordered task list for building Creatly. Each step has a scope and explicit acceptance criteria. Claude Code reads this file (and `CONVENTIONS.md` and `creatly-v1-prd.md`) and executes one step at a time on instruction.

**How the founder drives this:**
> "Read BUILD-PLAN.md and do step X.Y. Follow CONVENTIONS.md and the PRD. Work only within that step's scope. Stop at the acceptance criteria, summarise, and commit."

**Rules that apply to EVERY step (do not repeat per step, they always hold):**
- Read `CONVENTIONS.md` and the relevant PRD section before starting. Conventions are binding.
- Stay strictly within the named step's scope. If you find yourself building the next step's work, STOP.
- TypeScript strict, no `any`. pnpm only. Money is always integer kobo.
- Download attribution and server-side entitlement are guarded — never weaken them.
- Validate every external input with Zod. Never trust the client for permissions.
- At the end of a step: confirm each acceptance criterion explicitly, summarise what changed, make ONE clean commit in Conventional Commits format, and STOP. Do not roll into the next step.
- If anything conflicts with this plan, the PRD, or CONVENTIONS — stop and ask the founder rather than guessing.

**Status legend:** ✅ done · 🔄 in progress · ⬜ not started

---

## PHASE 1 — Buyer Foundation

### 1.1 — Project scaffold ✅
Next.js 15 + TS strict + Tailwind 4 + shadcn + pnpm; folder skeleton (PRD §19.1); foundational files (`lib/config.ts`, `lib/env.ts`, `types/api.ts`, `lib/api-response.ts`, `types/database.ts` enums, `lib/format.ts`); `CLAUDE.md`; `.claude/settings.json`. **Complete and committed.**

### 1.2a — Supabase connection layer ✅
shadcn → Radix switch; `@supabase/supabase-js` + `@supabase/ssr` (pinned); three clients (`client.ts`, `server.ts`, `admin.ts` with webhook-only warning); env validation for Supabase vars (publishable + secret keys); session-refresh `middleware.ts`; Supabase CLI init + link; connection smoke test. No schema/RLS/storage/auth-gating. **In progress.**

### 1.2b — Data layer (schema, RLS, storage) ✅
**This is a guarded step — the download-attribution and immutability guarantees are built here. Go carefully.**

Scope:
1. Write a versioned migration (Supabase CLI, in `supabase/migrations/`) implementing the FULL schema from PRD §14.2 — every table: `profiles`, `creators`, `categories`, `resources`, `subscriptions`, `subscription_events`, `team_members`, `downloads`, `favourites`, `notifications`, `notification_preferences`, `category_follows`. Include all columns, types, constraints, defaults, and indexes exactly as specified. Money columns are `integer` (kobo) — never float/numeric.
2. A `profiles` row must be auto-created when an `auth.users` row is created — add the trigger/function for this (standard Supabase pattern), inserting `id`, `email`, default role `user`.
3. Enable **Row-Level Security on every table** and write policies per the access intent table below. Defence in depth: server checks AND database enforces.
4. Enforce **append-only immutability** on `downloads` and `subscription_events`: no UPDATE, no DELETE for any client-reachable role. Implement via RLS (no update/delete policies) AND revoke update/delete grants, so it's enforced even if a policy is mis-added later. Comment clearly.
5. Create the **Storage buckets** per PRD §16: `resource-files` (PRIVATE — signed URLs only), `resource-previews` (public read), `avatars` (public read), `creator-avatars` (public read). Add bucket policies matching this.
6. Generate TypeScript types from the live schema into `types/database.ts`, replacing the commented placeholder. Keep the hand-written enum consts (`PLAN_TYPES`, etc.) — they coexist with generated row types. Add a `pnpm` script to regenerate types.
7. Apply the migration to the remote project and confirm it succeeded.

RLS access intent (write policies to match; ask if any case is ambiguous):
| Table | Read | Insert | Update | Delete |
| --- | --- | --- | --- | --- |
| profiles | own row; admin all | via signup trigger | own row; admin any | none (cascade from auth only) |
| creators | public if `is_public`; admin all | admin only | admin only | admin only |
| categories | public if `is_active`; admin all | admin only | admin only | admin only |
| resources | public if `status='published'`; admin all | admin only | admin only | admin only (soft via status) |
| subscriptions | owner own; admin all | service role (webhook) | service role (webhook) | none |
| subscription_events | admin all | service role only | NONE (immutable) | NONE (immutable) |
| team_members | owner + members of that team | owner (invite); accept flow | owner; self-accept | owner |
| downloads | own rows; admin all | authenticated + entitled (server) | NONE (immutable) | NONE (immutable) |
| favourites | own rows | own (authenticated) | none | own |
| notifications | own rows | service role / server | own (mark read) | own |
| notification_preferences | own row | own / default-created | own | none |
| category_follows | own rows | own | none | own |

Acceptance criteria:
1. Migration file exists in `supabase/migrations/`, is versioned, and applies cleanly to the remote project.
2. All 12 tables exist with exact columns/types/constraints/indexes from PRD §14.2.
3. Money columns are integer kobo; no float/numeric anywhere for money.
4. `profiles` auto-creation trigger works (creating an auth user creates a profile).
5. RLS enabled on all tables; policies match the access intent table.
6. `downloads` and `subscription_events` reject UPDATE and DELETE at the DB level (verified), enforced by both absent policies and revoked grants.
7. The four storage buckets exist with correct public/private settings and policies.
8. `types/database.ts` has generated row types + retained enum consts; a regenerate script exists; `pnpm typecheck` passes.
9. No application/feature code (no auth UI, no catalogue) — schema layer only.
10. One clean commit, e.g. `feat(db): add schema, RLS policies, storage buckets, generated types`.

### 1.3 — Authentication ⬜

Email/password auth via Supabase Auth, with strict email verification. This is the step where real users begin to exist — the `profiles` row already auto-creates via the `handle_new_user()` trigger from 1.2b; this step adds the auth UI, the flows, route protection, and the `notification_preferences` row on signup.

**Decisions (locked):**
- Email verification is **required before login** — unverified users cannot sign in.
- After signup-verification and after login, users land on **`/browse`**.
- Password-reset emails use **Supabase's built-in email** in V1 (branded Resend templates come later — no rework needed to switch).

**Scope:**

1. **Validation schemas** — `lib/validations/auth.ts` with Zod schemas: `signupSchema` (email, password with min length + complexity, optional full_name), `loginSchema`, `requestPasswordResetSchema` (email), `resetPasswordSchema` (new password + confirm). These schemas are shared by client forms (React Hook Form) and any server validation. Single source of truth — no duplicate inline validation.

2. **Signup flow** — `app/(auth)/signup/`:
   - Form: full name, email, password (with visible requirements + show/hide toggle), confirm password.
   - On submit: `supabase.auth.signUp` with `emailRedirectTo` pointing at the verification callback.
   - Because verification is required, after submit show a "Check your email to verify" confirmation state — do NOT log the user in yet.
   - On the `auth.users` insert, the existing trigger creates the `profiles` row. **Extend signup so a `notification_preferences` row is also created for the new user** (all defaults true, weekly digest). Do this via a DB trigger on `auth.users` (preferred — consistent with `handle_new_user`) OR in a post-verification server action. Recommend the trigger approach; if a trigger, add it as a NEW migration file (do not edit the 1.2b migration).

3. **Email verification callback** — a route (e.g. `app/(auth)/callback/route.ts` or `app/auth/confirm/route.ts` per current Supabase SSR guidance) that exchanges the verification token for a session, then redirects to `/browse`. Handle the error case (expired/invalid link) with a clear message and a way to resend verification.

4. **Login flow** — `app/(auth)/login/`:
   - Form: email, password.
   - On submit: `supabase.auth.signInWithPassword`.
   - **Block unverified users**: if email is not confirmed, deny login with a clear message + offer to resend the verification email. (Supabase can enforce this; verify the project's "Confirm email" setting is on, and handle the unverified error explicitly in the UI.)
   - On success: redirect to `/browse` (or the `next` param if present and safe).
   - Link to "Forgot password?".

5. **Password reset flow** — two parts:
   - **Request** (`app/(auth)/reset-password/`): email field → `supabase.auth.resetPasswordForEmail` with redirect to the update page. Always show the same "if an account exists, we've sent a link" message regardless of whether the email exists (no account enumeration).
   - **Update** (`app/(auth)/update-password/` or similar): reached from the email link with a recovery session; new password + confirm → `supabase.auth.updateUser`. On success, redirect to `/login` (or `/browse` if a session is active).

6. **Logout** — a server action or route that calls `supabase.auth.signOut` and clears the session, redirecting to `/` (landing). Place a reusable logout control in shared nav (the dashboard nav comes in Phase 3, but the action/util should exist now).

7. **Route protection (middleware)** — extend the existing `middleware.ts` (which currently only refreshes the session) to gate routes:
   - **Protected** (require an authenticated, verified session): `/dashboard/*` and `/admin/*` (admin role check comes in Phase 4 — for now just require auth on these).
   - **Public**: `/`, `/browse`, `/resources/*`, `/pricing`, and all `(auth)` routes.
   - **Auth routes when already logged in**: if a logged-in user hits `/login` or `/signup`, redirect them to `/browse`.
   - Unauthenticated access to a protected route redirects to `/login?next=<path>`. Keep the `next` handling safe (only allow same-origin relative paths — no open redirects).

8. **Auth helpers** — a small `lib/auth.ts` (or similar) with `getAuthenticatedUser()` used by Server Components / route handlers (the same helper CONVENTIONS §5.2 references in the route-handler skeleton). Returns the user + profile, or null. This is reused everywhere downstream, so get its shape right.

9. **UI/UX** — all auth pages mobile-first (375px), use shadcn form components + React Hook Form + Zod resolver, show field-level validation errors, loading states on submit, and clear success/error messaging. Use `APP_NAME` from config, never hardcoded. Accessible labels and focus states.

**Acceptance criteria (done when):**
1. A user can sign up; a `profiles` row AND a `notification_preferences` row are created for them.
2. After signup, the user is NOT logged in and sees a "verify your email" state.
3. Clicking the verification link confirms the account and lands the user on `/browse` with a session.
4. An unverified user cannot log in and is shown a clear message with a resend option.
5. A verified user can log in and lands on `/browse` (or a safe `next` path).
6. Password reset request → email sent (Supabase built-in); reset link → set new password → can log in with it.
7. Password reset request shows the same message whether or not the email exists (no enumeration).
8. Logout clears the session and redirects to `/`.
9. Middleware: `/dashboard` and `/admin` require auth (redirect to `/login?next=…` otherwise); logged-in users hitting `/login`/`/signup` are redirected to `/browse`; `next` only allows safe same-origin paths.
10. `getAuthenticatedUser()` exists and returns user+profile or null; used by at least one protected route as proof.
11. All auth schemas live in `lib/validations/auth.ts` and are shared client+server; no duplicate inline validation.
12. Any new DB trigger is a NEW migration file (1.2b migration untouched); `pnpm typecheck` and `pnpm lint` pass.
13. New `notification_preferences` trigger/flow does not break the existing `handle_new_user` trigger (test: signup creates exactly one profile + one preferences row).
14. One clean commit, e.g. `feat(auth): add signup, login, verification, password reset, route protection`.

**Watch for (review before approving the plan):**
- The `notification_preferences` row must be created reliably for every new user (trigger preferred). Confirm it fires for users created via the verification flow, not just raw inserts.
- Account-enumeration safety on both signup ("email already registered" should be handled carefully) and password reset.
- `next` param must not allow open redirects (same-origin relative paths only).
- Do NOT build the dashboard or admin pages themselves here — only the route protection that guards them. Those pages come in Phase 3/4.

### 1.4 — Catalogue browse ⬜
Browse page, `ResourceCard`, `ResourceGrid`, pagination, default sort newest. Server-side data fetching. Mobile-first. Loading skeletons + empty states. *(To be expanded.)*

### 1.5 — Search & filters ⬜
Keyword search (title/description/tags via FTS), category filter, tag filter, sort (newest / most downloaded / featured). *(To be expanded.)*

### 1.6 — Resource detail page ⬜
`app/(app)/resources/[slug]/`: metadata, preview gallery, creator attribution, compatible-software + file-type badges, file size, related resources, download CTA. *(To be expanded.)*

### 1.7 — Favourites ⬜
Toggle endpoint `POST /api/favourites/[resourceId]`; favourites list; heart toggle (optimistic). Guests redirected to signup. *(To be expanded.)*

### 1.8 — Download mechanic ⬜ (GUARDED)
`POST /api/downloads/[resourceId]`: auth → entitlement → resource check → **log download (immutable, with creator_id) BEFORE issuing URL** → 60s signed URL → client trigger. `lib/entitlement.ts` and `lib/download.ts`. In Phase 1 (pre-payments), entitlement returns false for everyone except a test path — design it so Phase 2 wires real subscription state in without rework. Download history endpoint. *(Full scope + acceptance criteria to be expanded — this is the most guarded step in Phase 1.)*

---

## PHASE 2 — Payments & Entitlements ⬜
2.1 Paystack plans (annual = monthly ×10) + env · 2.2 Pricing page · 2.3 Checkout · 2.4 Webhook handler (idempotent, signature-verified) · 2.5 Team plans + invites · 2.6 Subscription status page · 2.7 Payment history. *(Expanded when Phase 1 completes.)*

## PHASE 3 — User Dashboard ⬜
3.1 Layout/nav · 3.2 Home · 3.3 Downloads · 3.4 Profile · 3.5 Account · 3.6 Notifications · 3.7 Notification prefs · 3.8 Help/support. *(Expanded later.)*

## PHASE 4 — Admin Seed Tool ⬜
4.1 Admin route group + role guard · 4.2 Creator CRUD · 4.3 Category mgmt · 4.4 Resource upload (files + previews) · 4.5 Resource mgmt · 4.6 Analytics. *(Expanded later.)*

## PHASE 5 — Creator Dashboard (Phase 2 public) ⬜
Public onboarding, upload portal + review queue, earnings dashboard, payouts. *(Separate PRD addendum.)*

---

*Keep this file updated: mark steps ✅ as they complete. The founder and engineering partner expand the "to be expanded" steps before they're started.*
