# Creatly — Engineering Conventions

**Version:** 1.0
**Status:** Binding. Every contributor and every Claude Code session follows this.
**Read this first.** This document exists because the previous build was scrapped for inconsistency and technical debt. These conventions are not suggestions. When in doubt, follow the pattern here rather than inventing a new one. Cleverness that deviates from these conventions is a defect, not an improvement.

---

## 0. The One Rule That Matters Most

**Consistency beats cleverness.** If there is an established pattern in this document or in the existing codebase, follow it exactly — even if you know a "better" way. A codebase where every file looks the same is maintainable. A codebase full of locally-optimal but globally-inconsistent solutions is what we just threw away.

If you believe a convention is wrong, flag it to the founder and change it *in this document first*, then apply it everywhere. Never one-off it.

---

## 1. Language & Type Safety

### 1.1 TypeScript strict, always
- `tsconfig.json` runs in `strict` mode. Do not relax it.
- **`any` is banned.** Not "discouraged" — banned. If you reach for `any`, you have not understood the type yet. Use `unknown` and narrow it, or define the proper type.
- No `@ts-ignore` or `@ts-expect-error` without a comment explaining exactly why, and only as a last resort. These are reviewed.
- No non-null assertions (`!`) to silence the compiler unless the invariant is genuinely guaranteed and commented.

### 1.2 Types live in one place
- All database entity types live in `types/database.ts`. This is the **single source of truth** for data shapes.
- Generate Supabase types into this file (`supabase gen types typescript`) OR hand-maintain them — but pick one and never mix. **Decision: generate them**, then re-export named, app-facing types from the same file.
- Do not redefine an entity's shape locally in a component. Import it from `types/database.ts`.

### 1.3 No magic strings for enums
Plan types, statuses, roles, notification types — never typed as bare string literals scattered across files. Define them once:

```typescript
// types/database.ts
export const PLAN_TYPES = ['personal_monthly', 'personal_annual', 'team_monthly', 'team_annual'] as const;
export type PlanType = (typeof PLAN_TYPES)[number];

export const SUBSCRIPTION_STATUS = ['pending', 'active', 'past_due', 'cancelled', 'expired'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[number];

export const RESOURCE_STATUS = ['draft', 'published', 'archived'] as const;
export type ResourceStatus = (typeof RESOURCE_STATUS)[number];

export const USER_ROLE = ['user', 'admin', 'creator'] as const;
export type UserRole = (typeof USER_ROLE)[number];
```

Reference `PLAN_TYPES`, never the raw string `'personal_monthly'` typed inline.

---

## 2. Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Database tables | `snake_case`, plural | `subscription_events` |
| Database columns | `snake_case` | `current_period_end` |
| TypeScript variables / functions | `camelCase` | `getUserEntitlement` |
| TypeScript types / interfaces / components | `PascalCase` | `ResourceCard`, `SubscriptionStatus` |
| Constants (compile-time, app-wide) | `SCREAMING_SNAKE_CASE` | `APP_NAME`, `PLAN_TYPES` |
| React component files | `PascalCase.tsx` | `ResourceCard.tsx` |
| Non-component files (lib, utils, hooks) | `kebab-case.ts` | `verify-webhook.ts`, `use-favourites.ts` |
| Route handler files | `route.ts` (Next.js convention) | `app/api/downloads/[resourceId]/route.ts` |
| Folders | `kebab-case` | `resource-detail/` |
| Zod schemas | `camelCase` + `Schema` suffix | `createResourceSchema` |
| Env variables | `SCREAMING_SNAKE_CASE` | `PAYSTACK_SECRET_KEY` |

### 2.1 The snake_case / camelCase boundary
- The database is `snake_case`. TypeScript is `camelCase`.
- The mapping happens **once**, at the data-access boundary. Supabase returns `snake_case`; we either use generated types that preserve `snake_case` for DB rows, or map at the query function. **Decision: keep DB row types in `snake_case` (as Supabase generates them), and only map to `camelCase` when shaping data for the client/UI layer.** Do not map back and forth repeatedly.
- Be explicit and consistent about where the boundary is. A DB query function returns DB-shaped data; a "serializer" or the route handler maps it to the API response shape.

### 2.2 Brand name
- The product name "Creatly" lives in `lib/config.ts` as `APP_NAME`. Never hardcode "Creatly" anywhere else — import it. (See PRD §19.3.)
- No brand name in table/column/bucket names — ever.

---

## 3. Project Structure

Follow the folder structure in PRD §19.1 exactly. Key rules:

- **`app/`** — routes only. Route groups: `(auth)`, `(marketing)`, `(app)`, `admin`, `api`.
- **`components/`** — organised by domain (`resource/`, `auth/`, `dashboard/`, `admin/`, `shared/`) plus `ui/` for shadcn primitives.
- **`lib/`** — non-UI logic: clients (`supabase/`, `paystack/`, `resend/`), business logic (`entitlement.ts`, `download.ts`), `config.ts`, and `validations/` for Zod schemas.
- **`types/`** — `database.ts` is the source of truth.
- **`emails/`** — React Email templates.

### 3.1 Component placement
- A component used in exactly one route can live colocated in that route's folder.
- A component reused across routes lives in `components/`.
- Do not pre-emptively abstract. Inline first, extract on the second use.

### 3.2 shadcn/ui components
- shadcn components are generated into `components/ui/`.
- **Do not hand-edit `components/ui/` files** unless deliberately customising a primitive (and document why in a comment). Build on top of them in your own components instead.

---

## 4. Data Access & Supabase

### 4.1 Three clients, three jobs
| Client | File | Use for | Never use for |
|--------|------|---------|---------------|
| Browser client | `lib/supabase/client.ts` | Public reads, auth UI flows | Writes to sensitive tables, anything requiring trust |
| Server client | `lib/supabase/server.ts` | Authenticated reads/writes in Server Components & route handlers (uses request cookies) | — |
| Service-role client | `lib/supabase/admin.ts` | **Webhook handler ONLY** (bypasses RLS) | Anything reachable by a user request |

**Rule:** The service-role client bypasses RLS. It is used in exactly one place — the Paystack webhook handler — and nowhere else. If you find yourself reaching for it elsewhere, you are doing something wrong.

### 4.2 No client-side writes to protected data
- The browser never writes directly to `downloads`, `subscriptions`, `subscription_events`, or any monetary/attribution table.
- Those writes happen server-side, in route handlers, after validation and entitlement checks.

### 4.3 RLS is on for every table
- Row-Level Security is enabled on all tables (PRD §14.1). Defence in depth: the server checks permission AND the database enforces it.
- Never disable RLS to "make something work." If RLS blocks a legitimate operation, the policy is wrong — fix the policy.

### 4.4 Immutable tables
- `downloads` and `subscription_events` are **append-only**. No `UPDATE`, no `DELETE` from application code, ever.
- Soft-delete resources (`status = 'archived'`), never hard-delete a resource that has download records.

---

## 5. API Route Handlers

### 5.1 Standard response shape
Every route handler returns a consistent envelope. Define it once:

```typescript
// types/api.ts
export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = { ok: false; error: { code: string; message: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

Helpers:
```typescript
// lib/api-response.ts
import { NextResponse } from 'next/server';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data } satisfies ApiSuccess<T>, { status });
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { code, message } } satisfies ApiError, { status });
}
```

### 5.2 The mandatory route handler shape
Every route handler follows this skeleton — in this order:

```typescript
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. AUTH — who is calling? (Supabase server client)
    const { user } = await getAuthenticatedUser();
    if (!user) return fail('unauthorized', 'Sign in to continue.', 401);

    // 2. VALIDATE — Zod-parse all inputs (body + params)
    const { id } = await params;
    const body = await req.json();
    const parsed = someSchema.safeParse(body);
    if (!parsed.success) return fail('invalid_input', 'Check your input.', 422);

    // 3. AUTHORIZE — is this user allowed to do this? (role / ownership / entitlement)
    // ... e.g. entitlement check, admin role check

    // 4. EXECUTE — the actual work (DB writes, external calls)

    // 5. RESPOND — typed success
    return ok(result);
  } catch (err) {
    // 6. HANDLE — log to Sentry, return sanitised error
    captureException(err);
    return fail('internal_error', 'Something went wrong. Please try again.', 500);
  }
}
```

The order — **auth → validate → authorize → execute → respond → handle** — is non-negotiable. Do not skip steps. Do not reorder them.

### 5.3 Validation
- **Every external input is Zod-parsed before use.** Request bodies, query params, route params, webhook payloads.
- Zod schemas live in `lib/validations/`, named `<verb><Noun>Schema` (e.g. `createResourceSchema`).
- Use `.safeParse()` and return a 422 on failure — never let a parse throw unhandled.

### 5.4 Error handling
- Every handler wrapped in try/catch.
- Internal error details (stack traces, DB errors, Paystack errors) go to **Sentry**, never to the client.
- The client receives a sanitised message and a stable error `code` it can branch on.
- Error codes are stable, lowercase, snake_case strings: `unauthorized`, `no_active_subscription`, `not_found`, `invalid_input`, `internal_error`.

### 5.5 HTTP status discipline
| Situation | Status |
|-----------|--------|
| Success | 200 (201 for created) |
| Not authenticated | 401 |
| Authenticated but not allowed (no subscription, not admin) | 403 |
| Resource not found | 404 |
| Validation failure | 422 |
| Conflict (e.g. seat limit, duplicate) | 409 |
| Server error | 500 |

---

## 6. Money

- **All monetary values are integers in minor units (kobo).** 1 NGN = 100 kobo. ₦5,000 is stored and handled as `500000`.
- **Never use `float`, `number` with decimals, or `numeric` for money.** Integer kobo only.
- Format for display only at the very last moment, in a single utility:
  ```typescript
  // lib/format.ts
  export function formatNaira(kobo: number): string {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })
      .format(kobo / 100);
  }
  ```
- Currency is explicit on every amount (`currency: 'NGN'`). NGN is primary; the field exists so multi-currency is a data change, not a schema change.
- Annual price = monthly price × 10 (the "2 months free" rule). This is a fixed stored value per plan, **not** a runtime calculation (PRD §5.2).

---

## 7. The Two Things We Guard With Our Lives

These two systems, done wrong, are expensive to fix later. They get extra scrutiny in every review.

### 7.1 Download attribution
- Every download writes an immutable `downloads` record **before** any signed URL is issued.
- The record includes `creator_id`, copied from the resource at download time (denormalised — it does not change if the resource is later reassigned).
- If the log insert fails, the download is aborted. **No log, no URL.**
- The `downloads` table is append-only. No exceptions.

### 7.2 Entitlement
- A user's right to download is checked **server-side, on every request**, via `getUserEntitlement()` in `lib/entitlement.ts`.
- **Never trust the client** about subscription status. The client can show/hide UI based on its guess, but the server is the only authority that gates the actual file.
- Subscription state is driven by Paystack webhooks only — never set `status = 'active'` from a client callback or a checkout redirect.

---

## 8. Idempotency

- The Paystack webhook handler is idempotent: check `subscription_events` for the incoming `paystack_ref` before processing; if seen, return 200 and skip.
- Verify the `x-paystack-signature` (HMAC-SHA512 of the raw body) on every webhook before doing anything else. Invalid signature → reject immediately.
- Any operation that could be retried (webhooks, payment confirmations) must be safe to run twice.

---

## 9. Environment Variables

- All secrets and config in `.env.local` (never committed). `.env.example` documents required vars with placeholder values (committed).
- Validate env at startup with Zod in `lib/env.ts`. **The app fails to boot if a required var is missing** — fail loud, fail early.
  ```typescript
  // lib/env.ts
  import { z } from 'zod';
  const envSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    PAYSTACK_SECRET_KEY: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    // ...
  });
  export const env = envSchema.parse(process.env);
  ```
- `NEXT_PUBLIC_*` vars are exposed to the browser — only non-secret values go there. Secret keys never get the `NEXT_PUBLIC_` prefix.

---

## 10. Forms & Validation (Client)

- Forms use **React Hook Form + Zod** via `@hookform/resolvers/zod`.
- The **same Zod schema** validates on the client (UX) and the server (trust). Define it once in `lib/validations/`, import on both sides.
- Client validation is for user experience. Server validation is for trust. Both always happen.

---

## 11. Styling & UI

- Tailwind CSS 4. Use utility classes; avoid custom CSS files unless genuinely necessary.
- shadcn/ui + Radix primitives for components. Don't reinvent dialogs, dropdowns, tooltips — use the primitive.
- **Mobile-first.** Design and build for 375px first, then scale up with responsive modifiers (`sm:`, `md:`, `lg:`). Many users are on mobile with limited bandwidth (PRD principle #9).
- Lazy-load images and heavy assets. Use Next.js `<Image>` for all images.
- Every interactive element is keyboard-accessible with a visible focus state. Respect `prefers-reduced-motion`.
- Loading states (skeletons) and empty states are part of the feature, not an afterthought. A screen with no data shows a helpful empty state, not a blank void.

### 11.1 Copy
- Sentence case for UI text. Plain verbs. An action keeps its name through the whole flow (the button says "Download", the toast says "Downloaded").
- Errors say what happened and how to fix it, in the product's voice. No apologies, no vagueness.

---

## 12. Comments & Documentation

- Comment the **why**, not the **what**. The code says what; comments explain intent, trade-offs, and non-obvious constraints.
- Any deviation from these conventions must carry a comment explaining why.
- The two guarded systems (§7) get explanatory comments at their critical lines.

---

## 13. Git & Commits

- **Conventional Commits:** `type(scope): description`
  - Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`, `ci`
  - Example: `feat(downloads): add server-side entitlement check before signed URL`
- One logical change per commit. No "WIP" or "stuff" commits on main.
- Branch naming: `phase-1/download-mechanic`, `fix/webhook-idempotency`.
- Never commit `.env.local`, secrets, or generated build artifacts.
- PRs reference the PRD phase/step they implement.

---

## 14. Testing

- **Vitest** for unit tests and route handlers. **Playwright** for end-to-end.
- The two guarded systems (§7) get tests first and most thoroughly:
  - Download flow: unauthenticated → 401; authenticated free user → 403; entitled user → log written + URL returned; log failure → no URL.
  - Webhook idempotency: same `paystack_ref` twice → processed once.
  - Entitlement: active / past_due / cancelled / expired / team-member cases.
- A route handler is not "done" until its auth, validation, and authorization branches are tested.
- Test behaviour, not implementation. Tests should survive a refactor that preserves behaviour.

---

## 15. What "Done" Means

A feature is done when:
1. It follows every convention in this document.
2. TypeScript compiles with zero errors and zero `any`.
3. All inputs are Zod-validated server-side.
4. Auth, entitlement, and authorization are enforced server-side where relevant.
5. Errors are caught, logged to Sentry, and return sanitised messages.
6. It works at 375px and scales up.
7. Loading and empty states exist.
8. The relevant tests pass (and the guarded systems have tests).
9. No secrets or `.env.local` committed.
10. The commit message follows Conventional Commits.

If any of these is missing, the feature is not done — it is in progress.

---

*End of Creatly Engineering Conventions — Version 1.0*
