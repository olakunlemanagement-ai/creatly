# Creatly — Build Plan

**Purpose:** This is the authoritative, ordered task list for building Creatly. Each step has a scope and explicit acceptance criteria. Claude Code reads this file (and `CONVENTIONS.md` and `creatly-v1-prd.md`) and executes one step at a time on instruction.

**How the founder drives this:**
> "Read BUILD-PLAN.md and do step X.Y. Follow CONVENTIONS.md and the PRD. Work only within that step's scope. Stop at the acceptance criteria, summarise, and commit."

## UI POLISH BACKLOG (parked — address in a dedicated pass, not now)

Refinements noted during the build. These are polish, not blockers. Do NOT
address them mid-step; batch them into one focused design pass (end of Phase 1
or when the founder calls for it). Add new items here as they're spotted.

- [ ] **Browse hero is too tall** — nearly fills the viewport, pushing category
      pills and the resource grid below the fold. Trim vertical padding
      (e.g. py-16/py-20 → ~py-10/py-12) so categories peek above the fold.
- [ ] **Category pills clipped on the left edge** — the horizontal scroll
      container starts flush against the viewport edge ("Social Media" shows as
      "ocial Media"). Add left padding / scroll-padding so the first pill is
      fully visible.
- [ ] (add more as spotted…)

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

### 1.3 — Authentication ✅

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

### 1.4 — Catalogue browse + design foundation ✅

The first real storefront UI. This step establishes Creatly's visual identity AND builds the browse grid. Search/filters are 1.5; the resource detail page is 1.6 — do NOT build those here. This is: design tokens, the browse page, the resource card, the grid, pagination, loading skeletons, and the empty state.

**Decisions (locked):**
- Card style: a distinctive hybrid — **image-forward** (the preview dominates, Pinterest-like) **with a clean info row** (title, category pill, file-type badge) and a favourite affordance. Not a generic Envato clone, not bare tiles — something that feels crafted and is genuinely usable on mobile.
- Visual identity: **invest now.** Distinctive, branded, not a neutral placeholder.
- Default sort: newest first.

**Use the frontend-design skill.** This step is design-led. Read and apply `/mnt/skills/public/frontend-design/SKILL.md` for the design-token system, typography, and styling constraints in this environment. Distinctive and intentional, never templated-default.

**Task 0 — Design foundation (do this first):**
Establish Creatly's core design system as Tailwind 4 theme tokens / CSS variables in the global stylesheet, so every component from here on inherits it. Direction:
- **Palette:** deep forest green as primary (e.g. a rich `#1a3d2f`-ish green), warm terracotta/orange as the accent (e.g. `#c8732e`-ish), a warm off-white / cream as the page background (not stark white), near-black for text, plus a neutral grey scale. Define proper semantic tokens (background, foreground, primary, accent, muted, border, etc.) — don't hardcode hex in components.
- **Typography:** a characterful but readable pairing — a distinctive display face for headings (something with personality, suited to a creative brand) and a clean, highly-legible sans for body/UI. Load via `next/font`. Define type scale tokens.
- **Feel:** warm, premium-but-accessible, creative, African-rooted without cliché or literal motifs. Generous spacing, soft but not gimmicky radii, restrained shadows.
- Support **dark mode tokens** in the system even if no toggle is built yet (so we don't retrofit later).
- This must look cohesive with the brand used elsewhere — green/orange/cream is the established direction.

**Task 1 — Image URL resolution helper:**
- `lib/storage.ts` (or similar): a small, well-tested `getPreviewImageUrl(path: string)` that returns `path` directly if it's an absolute URL (starts with `http`), otherwise resolves it to a Supabase Storage public URL from the `resource-previews` bucket.
- This is not cleverness — it's a standard absolute-vs-relative image source pattern, and it lets dev seed data (which uses external placeholder image URLs) render correctly while real uploads (Storage paths, Phase 4) also work. Comment it as such.

**Task 2 — Data fetching:**
- Server-side fetch of published resources (`status = 'published'`) via the server Supabase client, ordered by `created_at desc`, paginated.
- Page size ~24. Pagination via URL search param (`?page=2`) so it's shareable and back-button-friendly. Server Component reads the param and fetches the right page.
- Return the data typed against the generated `types/database.ts` row types — no `any`.

**Task 3 — Components (in `components/resource/`):**
- **`ResourceCard.tsx`** — the hybrid card. Preview image (via `getPreviewImageUrl`, using `next/image` with proper sizing + lazy loading), title, a category pill, a file-type badge (derived from `file_type`/extension), and a favourite heart button (UI + optimistic toggle wiring may be stubbed if favourites isn't until 1.7 — if so, render the heart but no-op it with a clear TODO; do NOT build the favourites backend here). Whole card links to the (future) resource detail route `/resources/[slug]` — the route may 404 until 1.6; that's fine, just wire the href.
- **`ResourceGrid.tsx`** — responsive grid: 1 column at 375px, scaling up (2 / 3 / 4 columns at breakpoints). Mobile-first. Handle the image-forward layout cleanly across sizes.
- **`ResourceCardSkeleton.tsx`** — loading skeleton matching the card shape.
- **`CatalogueEmptyState.tsx`** — a friendly empty state for when there are zero published resources (helpful message, on-brand, not a blank void).

**Task 4 — Browse page (`app/(app)/browse/page.tsx`):**
- Replace the 1.3 placeholder with the real catalogue.
- Header/hero area (tasteful, on-brand — this is the storefront), then the grid, then pagination controls.
- Loading UI via skeletons (Suspense or loading.tsx).
- Empty state when no resources.
- Fully responsive, mobile-first, bandwidth-conscious (lazy-load images, appropriate `next/image` sizes).
- Public route — guests and free users can browse (no auth gate).

**Acceptance criteria (done when):**
1. Design tokens (palette, typography, spacing, radii, dark-mode vars) are defined as a coherent system in the Tailwind theme / global CSS; components reference tokens, not hardcoded hex.
2. The frontend-design skill was applied; the result looks distinctive and on-brand (green/orange/cream), not a default template.
3. `getPreviewImageUrl` resolves both absolute URLs and Storage paths; covered by a small unit test.
4. `/browse` renders published resources in a responsive, image-forward hybrid card grid (1 col at 375px scaling to multi-column).
5. Cards show preview image, title, category pill, and file-type badge; favourite heart is present (real wiring deferred to 1.7 if needed, clearly TODO'd).
6. Pagination works via `?page=` URL param; default sort is newest first; page size ~24.
7. Loading skeletons show during fetch; a friendly empty state shows when there are no resources.
8. Card links to `/resources/[slug]` (route may not exist until 1.6 — href wired regardless).
9. Public access confirmed (works logged-out); images lazy-load via `next/image`.
10. No search/filter UI (that's 1.5); no resource detail page (1.6); no favourites backend (1.7).
11. TypeScript strict, no `any`; `pnpm typecheck` and `pnpm lint` pass.
12. One clean commit, e.g. `feat(catalogue): add design system and browse grid`.

**Watch for (review before approving the plan):**
- Design tokens established as a real system, not one-off styles per component (this prevents the drift that sank the first build).
- `next/image` configured for the placeholder image domain (e.g. picsum.photos) in `next.config` so dev images load — but keep production Storage URLs working too.
- Heart/favourite must NOT pull the favourites backend forward from 1.7 — UI only, stubbed.
- Card must remain usable and legible at 375px — image-forward must not crush the info row on mobile.

1.4a — Fix: creator attribution on cards ✅ (quick fix)

The browse cards show "Unknown creator" because the creators SELECT RLS policy only allows reading rows where is_public = true, but seed/internal creators are is_public = false. The creators(name) join therefore returns null for published resources by internal creators.

Decision (locked): A creator's name is public once they have a published resource (their work is already shown publicly). Internal creators with no published work stay private.

Scope:


New migration file (do NOT edit earlier migrations) that replaces the creators SELECT policy with: allow reading a creator row if is_public = true OR that creator has at least one resource with status = 'published'. Use an EXISTS subquery on resources. Keep insert/update/delete policies unchanged (admin only).
Verify the browse card now shows the real creator name ("Creatly Studio") instead of "Unknown creator".
Apply migration to remote; pnpm typecheck + pnpm lint pass.


Acceptance criteria:


New migration only; earlier migrations untouched.
Browse cards show the actual creator name for published resources.
Internal creators with no published resources remain unreadable by anon/public.
One clean commit, e.g. fix(rls): allow reading creators with published resources.


1.4b — Design elevation: make the catalogue come alive ✅ (design-led)

The catalogue works and is on-brand, but it's static and bland. This step injects energy and discovery, drawing on the patterns that make Envato Elements / ThemeForest feel alive — WITHOUT abandoning the established green/terracotta/cream identity or breaking scope into 1.5 (real search/filter logic is still 1.5; this builds the presentation and entry points).

Apply the frontend-design skill. Read /mnt/skills/public/frontend-design/SKILL.md and design with intent. The goal is "alive and premium," not "busy."

Scope — add these to the browse experience:


Hero section at the top of /browse (replaces the plain "Browse resources / 10 resources available" header):

A confident headline using the serif display (e.g. "Unlimited downloads for African creatives" — final copy your call) + a short supporting line.
A prominent search bar front and center (visual only in this step — wire the actual query in 1.5; for now it can route to /browse?q= or be a styled non-functional input clearly stubbed). This is the single biggest "alive" signal — Envato leads with it.
Set on a richer background: a deep forest-green band, or a warm cream-to-terracotta gradient, with generous vertical padding. This breaks the flat-white monotony.
A small trust/stat line under the search (e.g. "Thousands of templates, fonts, mockups & more") — social-proof texture.



Category quick-nav — a horizontal row of category "pills" or small tiles below the hero (Social Media, Presentations, Fonts, Mockups, Brand Kits, Icons — read from the categories table, don't hardcode). Clicking is visual-only or routes to /browse?category= (real filtering is 1.5). These give the page entry points and immediate sense of breadth.
A "Featured" strip — a distinct horizontal section surfacing is_featured = true resources (you already have some in seed data) above the main grid, with a section heading. Visual differentiation (slightly larger cards or a different treatment) creates rhythm instead of one flat grid.
Card life — elevate ResourceCard:

Smoother hover: image subtle zoom (scale) within the frame, card lift (shadow + slight translate), the favourite heart fading in. Respect prefers-reduced-motion.
A category pill on the card (you have category data) in addition to the file-type badge, for color/texture.
Tighten proportions slightly so cards feel less heavy.



Overall rhythm & polish:

Section spacing that creates a top-to-bottom narrative: Hero → Categories → Featured → All resources grid → pagination.
Tasteful use of the terracotta accent for energy (section accents, hover states) against the green/cream base — currently the accent barely appears.
Keep it fast and mobile-first: hero and search must look great and remain usable at 375px; lazy-load images; no layout shift.





Constraints / scope fences:


Do NOT build real search or filter logic — that's 1.5. Search bar and category pills are presentation + routing stubs only, clearly marked TODO for 1.5.
Do NOT change the core data fetch or pagination from 1.4 beyond what's needed to add the Featured strip.
Stay within the established design tokens — enrich their use, don't introduce a new palette.
No new heavy dependencies for animation; CSS transitions / Tailwind are enough.


Acceptance criteria:


/browse opens with a distinctive hero (headline + prominent search bar + richer green/gradient background), not a plain text header.
A category quick-nav row renders from the categories table.
A Featured strip surfaces is_featured resources above the main grid, visually distinct.
Cards have polished hover motion (image zoom + lift + heart fade), a category pill, and tightened proportions; prefers-reduced-motion respected.
The terracotta accent is used purposefully for energy; the page reads as "alive and premium," cohesive with the brand.
Fully responsive and fast at 375px; images lazy-load; no CLS.
Search bar and category pills are presentation/routing stubs only — no real query logic (deferred to 1.5), clearly TODO'd.
TypeScript strict, no any; typecheck + lint pass.
One clean commit, e.g. feat(browse): elevate catalogue with hero, categories, featured strip, card motion.


Watch for (review before approving the plan):


The search bar must be visually prominent — it's the #1 "alive" signal. Don't bury it.
Hero background must not hurt text contrast/accessibility (check against tokens).
Don't let the Featured strip + hero push the actual grid below the fold on mobile to the point browsing feels buried — balance the narrative.
No scope creep into real search/filtering (1.5).

### 1.5 — Search & filters ✅
### 1.5a — FTS index + tag matching for search ✅

Wire the search bar and category pills (stubbed in 1.4b) to real query logic, and add sorting. This makes the catalogue actually navigable. Builds on the existing browse data fetch — does NOT rebuild the page layout (that's done) and does NOT touch the resource detail page (1.6) or favourites (1.7).

**Decisions (locked):**
- Search updates **as-you-type, debounced ~300ms** (not on every keystroke). Feels instant, avoids hammering the DB on low-bandwidth mobile.
- URL is the source of truth for search/filter/sort state (`?q=`, `?category=`, `?sort=`, `?page=`) — shareable, back-button-friendly, and the server reads it to fetch.
- Sort options: **Newest** (default), **Most downloaded**, **Featured first**.

**Scope:**

1. **Query parsing & validation:**
   - The browse page (Server Component) reads `q`, `category`, `sort`, `page` from `searchParams`.
   - Validate/normalize with a small Zod schema (`lib/validations/browse.ts` or inline): `q` is a trimmed string (cap length, e.g. 100 chars); `category` is a slug string; `sort` is one of an allowed set (`newest` | `popular` | `featured`), defaulting to `newest`; `page` is a positive int. Never trust raw params.

2. **Search (keyword):**
   - Full-text search across title + description using the FTS index already created in the 1.2b migration (`idx_resources_fts`), plus tag matching.
   - Use Postgres FTS via Supabase (`textSearch` on the tsvector, or `ilike` fallback for partial matches — prefer FTS for the indexed columns; consider also matching `tags` via array contains/overlap for tag hits).
   - If `q` is empty, no keyword constraint is applied.

3. **Category filter:**
   - When `?category=<slug>` is present, resolve the category by slug and filter resources to that `category_id`.
   - Invalid/unknown slug → treat as no filter (or empty result with a clear message — prefer: ignore unknown slug, show all, don't error).

4. **Sort:**
   - `newest` → `created_at desc` (default)
   - `popular` → `download_count desc` (then `created_at desc` tiebreak)
   - `featured` → `is_featured desc, created_at desc`

5. **Combine cleanly:** search + category + sort + pagination all compose in one query. All filters are ANDed. Pagination still works with filters applied (recompute total count for the filtered set so page numbers are correct).

6. **Client wiring (the as-you-type part):**
   - The search input becomes a client component that debounces input (~300ms) and updates the URL query param (`router.replace` with the new `?q=`, preserving other params), which re-runs the server fetch. Use `useTransition` so the input stays responsive and you can show a subtle pending state.
   - Category pills update `?category=` (toggle: clicking the active category clears it). Preserve other params.
   - A sort control (dropdown or segmented control) updates `?sort=`. Preserve other params.
   - Changing q/category/sort resets `page` to 1.

7. **States:**
   - Reuse the existing loading skeletons and `CatalogueEmptyState`.
   - Empty state copy should adapt: if a search/filter is active and returns nothing, show "No resources match your search" with a clear way to clear filters — distinct from the "no resources yet" cold-start empty state.
   - Show the active query/filter context (e.g. "Results for 'mockups'" or the active category) so the user knows what they're looking at.

8. **Featured strip + hero behaviour with active search:** when a search or category filter is active, hide the Featured strip and the hero can collapse to a slimmer state (search still present) so results are the focus. Keep it simple — at minimum, the Featured strip should not show alongside filtered results (it's a discovery element, not a results element).

**Acceptance criteria (done when):**
1. Typing in the search bar updates results as-you-type, debounced (~300ms), without a full page reload feel; input stays responsive (useTransition).
2. Search matches against title, description (FTS), and tags; empty query returns all.
3. Clicking a category pill filters to that category; clicking the active one clears it.
4. Sort control offers Newest / Most downloaded / Featured first; default is Newest.
5. Search, category, and sort all reflect in the URL (`?q=&category=&sort=&page=`) and are restored on reload/share/back.
6. Filters compose (search + category + sort together); pagination works on the filtered set with correct counts; changing a filter resets to page 1.
7. Active-search empty state ("no matches" + clear filters) is distinct from the cold-start empty state.
8. Featured strip is hidden when a search/filter is active.
9. Mobile-first; fast on slow connections (debounce confirmed; no query-per-keystroke).
10. TypeScript strict, no `any`; inputs validated with Zod; typecheck + lint pass.
11. One clean commit, e.g. `feat(browse): add debounced search, category filter, and sort`.

**Watch for (review before approving the plan):**
- Debounce must actually be present — confirm no query fires on every keystroke.
- URL-driven state: the server fetch reads from searchParams; the client only updates the URL. Don't introduce a parallel client-side results state that can desync from the URL.
- Use the existing FTS index (`idx_resources_fts`) rather than unindexed `ilike` on large columns where possible.
- Don't pull in detail-page (1.6) or favourites (1.7) work.
- Preserve other params when updating one (changing sort shouldn't wipe the active search).

### 1.6 — Resource detail page ✅

The page each catalogue card links to (`/resources/[slug]`) — where a user decides to download. Gallery-led layout with a details sidebar. This builds the page, the preview gallery, the metadata, related resources, and the download CTA *states* — but NOT the actual download mechanic (entitlement check, attribution logging, signed URL). That is the guarded step 1.8. Here the download button is present and shows the correct state per user, but the click action is stubbed for 1.8.

**Decisions (locked):**
- Layout: **big preview gallery + details sidebar** (classic, conversion-focused — preview dominates, sidebar holds the decision).
- Subscribe CTA for non-subscribers: **subtle, not aggressive.** We sell a membership, not this item. A calm "Download" with a quiet subscribe prompt when needed — no loud price-pushing per resource.

**Use the frontend-design skill.** Stay within the established green/terracotta/cream tokens; match the quality of the browse page.

**Scope:**

1. **Route & data fetch (`app/(app)/resources/[slug]/page.tsx`):**
   - Server Component. Read `slug` from params, fetch the single published resource by slug, joining `creators(name, slug, avatar_path, is_public)` and `categories(name, slug)`.
   - If not found OR not `status='published'` (and viewer isn't admin), render `notFound()` (Next.js 404). Don't leak draft/archived resources.
   - Public route — guests and free users can view detail pages (same as browse).
   - Set page `<title>`/metadata from the resource title + APP_NAME (generateMetadata).

2. **Preview gallery (main column):**
   - Primary preview image large at top (via `getPreviewImageUrl`), using `next/image`.
   - If `preview_images[]` has additional images, render them as a thumbnail strip / gallery the user can click to swap the main image (client component for the interaction). If only the primary exists, just show it.
   - Tasteful, on-brand, mobile-first (gallery stacks on mobile).

3. **Details sidebar (side column on desktop, below gallery on mobile):**
   - Title (serif heading), creator attribution (name + link to creator — creator profile page doesn't exist yet, wire href to `/creators/[slug]` which may 404 until Phase 2; or render name without link if cleaner — your judgment, keep it simple).
   - Category pill, file-type badge, file size (format `file_size_bytes` human-readable, e.g. "4.3 MB" — add a small `formatBytes` util to `lib/format.ts`).
   - Compatible software shown as small tags/chips (from `compatible_software[]`).
   - Tags shown as chips (from `tags[]`).
   - Download count ("142 downloads").
   - **The download CTA** (see state logic below).
   - Favourite (heart) button — UI present; real favourites backend is 1.7, so stub the toggle with a clear TODO (same approach as the card).

4. **Download CTA states (button present, ACTION stubbed for 1.8):**
   - **Subscriber (active subscription):** primary "Download" button, confident, enabled. On click: stubbed — `/* TODO 1.8: real download via /api/downloads/[id] */` (e.g. a no-op or a toast "Download coming in 1.8"). Do NOT implement entitlement checks, logging, or signed URLs here.
   - **Free user (logged in, no active subscription):** "Download" button that, instead of downloading, subtly prompts subscription — e.g. button reads "Download" but opens/links to `/pricing` (which may not exist until Phase 2 — wire the href), with a calm helper line like "Included with a Creatly subscription." Keep it understated, no aggressive upsell, no big price.
   - **Guest (not logged in):** "Download" prompts sign-up — links to `/signup?next=<this resource path>`, with a quiet "Sign up to get started" helper.
   - Determine the user/subscription state server-side using `getAuthenticatedUser()` and an entitlement check. NOTE: real entitlement comes from subscriptions (Phase 2). For 1.6, implement a single `getUserEntitlement()`-style check that currently returns false-for-everyone-except-none (since no subscriptions exist yet) — OR read subscription status if the helper already exists. Design the state branching so 1.8 / Phase 2 can plug real entitlement in without rebuilding the UI. Comment this clearly.

5. **Related resources:**
   - Below the gallery/sidebar, a "More like this" section: fetch up to ~4–8 other published resources in the SAME category (excluding the current one), render with the existing `ResourceCard` / a horizontal strip or small grid.
   - If none, hide the section.

6. **States & polish:**
   - Loading skeleton (loading.tsx for the route) matching the gallery+sidebar shape.
   - Fully responsive: two-column on desktop (gallery main + sidebar), single-column stacked on mobile with the download CTA easily reachable.
   - Breadcrumb or back-to-browse affordance (small, optional but nice).

**Acceptance criteria (done when):**
1. `/resources/[slug]` renders a published resource with gallery + details sidebar; unknown/unpublished slug → 404 (drafts/archived not leaked to non-admins).
2. Preview gallery shows the primary image; additional `preview_images` are browsable (thumbnail → swaps main); gracefully handles single-image resources.
3. Sidebar shows title, creator, category, file-type, human-readable file size, compatible software, tags, and download count.
4. Download CTA shows the correct state for subscriber / free user / guest, with a SUBTLE subscribe prompt for free users and a sign-up prompt for guests.
5. The download action is stubbed/TODO for 1.8 — no entitlement logging, no signed URL, no real file delivery implemented here; state branching is structured so real entitlement plugs in later without UI rework.
6. Favourite heart present but UI-only (backend deferred to 1.7), clearly TODO'd.
7. Related resources ("More like this") show same-category published resources; section hidden if none.
8. Loading skeleton + mobile-first responsive layout; metadata set from resource title.
9. `formatBytes` util added to lib/format.ts; file size displays human-readable.
10. TypeScript strict, no `any`; typecheck + lint pass.
11. One clean commit, e.g. `feat(resources): add resource detail page with gallery, details, related`.

**Watch for (review before approving the plan):**
- Do NOT implement the real download mechanic (entitlement check against subscription, attribution logging to `downloads`, signed URL generation) — that's the guarded step 1.8. Button + states only; action stubbed.
- 404 must apply to non-published resources for non-admins (don't leak drafts).
- Favourites stays UI-only (1.7). Pricing/creator/signup hrefs may point at not-yet-built routes — that's fine, wire them.
- Keep the subscribe prompt understated — this is a membership product, not per-item checkout.
- Reuse existing components/utils (ResourceCard, getPreviewImageUrl, badges) — don't duplicate.

### 1.6a — Resource preview lightbox ✅ (follow-up to 1.6)

Add a fullscreen lightbox/modal for resource previews on the detail page. Resources like brand kits, decks, and template sets have multiple preview images showing different segments — the inline gallery is too small to evaluate them properly. The lightbox lets users see previews at full size and browse between them, which is conversion-critical (people decide to download based on what they can actually see).

**Decisions (locked):**
- Opens via a **dedicated "Preview" / expand button** (not by clicking the image — clearer affordance, avoids accidental opens).
- Navigation inside the lightbox: **combination UX** — swipe on mobile, arrow keys + on-screen prev/next arrows on desktop, AND a thumbnail strip along the bottom to jump directly to any image. (This is how Envato/Behance handle multi-image previews; the thumbnail strip is what makes a 6-image set genuinely browsable rather than a click-through slideshow.)

**Use the existing Radix Dialog primitive** (shadcn `Dialog` in `components/ui/`) as the lightbox base — gives focus trap, Escape-to-close, scroll lock, and ARIA for free, and stays consistent with conventions. Add the shadcn `dialog` component if not already present.

**Scope:**

1. **Preview/expand button** on the detail gallery:
   - A clear "Preview" button (with an expand/maximize icon, e.g. lucide `Maximize2` or `Expand`) overlaid on or beneath the main gallery image. On-brand styling.
   - Clicking opens the lightbox at the currently-active gallery image.

2. **Lightbox component** (`components/resource/ResourcePreviewLightbox.tsx`, client component):
   - Built on Radix Dialog. Fullscreen / near-fullscreen overlay with a dimmed backdrop.
   - Shows the active preview image large and centered (`next/image`, contained — never cropped; the user must see the whole image).
   - Close: an X button (top corner) and Escape key (Radix handles Escape).
   - Props: the full ordered list of image URLs (already resolved via `getPreviewImageUrl`) + the initial index.

3. **Navigation inside the lightbox:**
   - **Desktop:** on-screen prev/next arrow buttons (left/right edges) + left/right arrow keys. Disable/wrap at ends (recommend wrap-around; your call — wrap is friendlier).
   - **Mobile:** horizontal swipe between images (touch). Keep it lightweight — a simple swipe handler or CSS scroll-snap carousel; no heavy carousel dependency.
   - **Thumbnail strip:** a row of thumbnails along the bottom; the active one is highlighted (green ring); clicking jumps to that image. Horizontally scrollable if many.
   - An image counter (e.g. "3 / 6") for orientation.

4. **Single-image resources:** if there's only one preview image, the lightbox still works (opens it fullscreen) but hides the navigation arrows, thumbnail strip, and counter — no dead controls.

5. **Accessibility & polish:**
   - Focus trap + return focus to the trigger on close (Radix default — keep it).
   - `prefers-reduced-motion` respected (no slide animation if set; just swap).
   - Lazy-load lightbox images; the active image gets priority.
   - Mobile-first: works cleanly at 375px; swipe feels natural; close button reachable.

**Scope fences:**
- Detail-page-only. Don't touch browse cards, search, or the download mechanic.
- No new heavy carousel/lightbox library — use Radix Dialog + Tailwind + minimal JS. (If a tiny well-justified helper is needed for swipe, fine, but prefer native.)
- Don't change the inline gallery's existing behaviour beyond adding the Preview button; the inline thumbnail-swap from 1.6 stays.

**Acceptance criteria (done when):**
1. A clear "Preview" button on the detail gallery opens a fullscreen lightbox at the active image.
2. Lightbox shows images fully (contained, never cropped) on a dimmed backdrop; closes via X and Escape.
3. Desktop: prev/next arrows + arrow-key navigation work; an image counter shows position.
4. Mobile: horizontal swipe between images works at 375px.
5. A thumbnail strip lets users jump directly to any image; active thumbnail is highlighted.
6. Single-image resources open in the lightbox with navigation controls hidden (no dead UI).
7. Built on Radix Dialog (focus trap, Escape, scroll lock, ARIA); focus returns to trigger on close; `prefers-reduced-motion` respected.
8. Images resolved via `getPreviewImageUrl`; lazy-loaded; mobile-first.
9. TypeScript strict, no `any`; typecheck + lint pass.
10. One clean commit, e.g. `feat(resources): add fullscreen preview lightbox with navigation`.

**Watch for (review before approving the plan):**
- Use the existing Radix Dialog, not a new lightbox dependency.
- Images must be CONTAINED in the lightbox (whole image visible), not cover-cropped — the point is letting users evaluate the full preview.
- Hide navigation/thumbnail/counter for single-image resources (no dead controls).
- Don't pull in or alter the download mechanic (1.8) or favourites (1.7).

### 1.7 — Favourites ✅

Wire the heart icon (UI-only since 1.4) to real save/unsave, and build the favourites list. Uses the `favourites` table from 1.2b (RLS already enforces own-rows-only).

**Decision (locked):** Logged-in users only. Guests clicking the heart are prompted to sign up (links to `/signup?next=<current path>`).

**Scope:**

1. **Toggle endpoint** `app/api/favourites/[resourceId]/route.ts` (POST):
   - Follow the CONVENTIONS §5.2 route shape: auth check (401 if guest) → validate resourceId (Zod, must be uuid) → toggle (if a favourite row exists for this user+resource, delete it; else insert) → return `{ favourited: boolean }`.
   - Server-side via the server Supabase client; RLS already restricts to own rows.
   - Idempotent in effect: result reflects the new state regardless of prior clicks.

2. **`useFavourite` client hook / wiring** (or a small client component):
   - The heart button becomes interactive with **optimistic update**: toggle the UI immediately, call the endpoint, roll back on error.
   - Guest (not logged in): clicking the heart does NOT call the API — instead routes to `/signup?next=<current path>` (or opens a small prompt). Determine auth state passed down from the server component.
   - Used by both `ResourceCard` (browse) and the detail page sidebar heart.

3. **Reflect favourited state** on render:
   - Browse cards and detail page need to know which resources the current user has already favourited, so the heart shows filled vs outline correctly on load.
   - Fetch the user's favourited resource IDs server-side (one query) and pass down; cards check membership. Keep it efficient (one set of IDs, not a query per card).

4. **Favourites page** `app/(app)/dashboard/favourites/page.tsx`:
   - Server Component, auth-required (middleware already gates `/dashboard`).
   - Fetch the user's favourited resources (join through `favourites` to `resources`, published only), newest-saved first.
   - Render with the existing `ResourceGrid` + `ResourceCard`.
   - Empty state: friendly message + link to `/browse` when no favourites yet.
   - (This is a minimal dashboard page; the full dashboard shell/nav is Phase 3 — keep this page simple, reachable directly by URL for now. If there's no dashboard layout yet, a minimal standalone page is fine.)

**Acceptance criteria (done when):**
1. Logged-in user can favourite/unfavourite from a browse card AND the detail page; heart reflects state with optimistic update; rolls back on error.
2. Guest clicking the heart is routed to `/signup?next=<path>` and NO favourite is written.
3. On page load, hearts show filled for already-favourited resources (state fetched server-side, efficiently — not one query per card).
4. `POST /api/favourites/[resourceId]` follows the conventions route shape (auth → Zod validate → toggle → typed response); writes server-side; RLS enforces own-rows.
5. `/dashboard/favourites` lists the user's favourited published resources, newest first, with a friendly empty state.
6. TypeScript strict, no `any`; Zod validates the resourceId; typecheck + lint pass.
7. One clean commit, e.g. `feat(favourites): add favourite toggle, state, and favourites page`.

**Watch for (review before approving the plan):**
- Don't fetch favourite state per-card (N queries) — fetch the user's favourited IDs once and pass down.
- Guest path must not hit the API — route to signup instead.
- Use the existing `favourites` table + RLS; no schema change needed.
- Optimistic update must roll back on failure (don't leave a false "saved" state).
- Don't build the full Phase 3 dashboard shell — just the minimal favourites page.

### 1.8 — Download mechanic ✅ (GUARDED — most critical step in Phase 1)

The real download flow: server-side entitlement check → immutable attribution log → short-lived signed URL → client-triggered download. This is the foundation of creator revenue share. Build it exactly right; it is expensive to fix later. NO test-only code paths or bypasses — testing is done by inserting a real subscription row in the DB (see "Testing" below).

**Locked principles (from PRD §9 and CONVENTIONS §7 — non-negotiable):**
- Entitlement is checked **server-side on every download request.** Never trust the client.
- The download is **logged BEFORE the signed URL is issued.** If the log insert fails, no URL is returned.
- The `downloads` row is **immutable** (append-only — enforced by 1.2b RLS + revoked grants) and records `creator_id` **denormalised from the resource at download time** (never changes if the resource is later reassigned).
- Signed URL is **short-lived (60s TTL).**

**Scope:**

1. **`lib/entitlement.ts` — `getUserEntitlement(userId)`** (the real authority, replacing the 1.6 stub):
   - Returns whether the user has an active entitlement and the relevant subscription.
   - Entitled if: the user is `owner_id` of a subscription with `status = 'active'`, OR an accepted member of a team subscription (via `team_members.profile_id` where `invite_accepted = true`) whose subscription is `status = 'active'`.
   - Returns a typed result, e.g. `{ entitled: boolean; subscription: Subscription | null; reason?: 'no_subscription' | 'inactive' }`.
   - Pure server-side. This is the single source of truth used by the download route (and reusable in Phase 2/3).

2. **`lib/download.ts`** — helpers:
   - `logDownload({ userId, resource, subscriptionId, planType })` → inserts the immutable `downloads` row with `creator_id` copied from `resource.creator_id`, `plan_type` denormalised. Returns the inserted row or throws.
   - `createSignedUrl(filePath)` → calls Supabase Storage to create a signed URL for the `resource-files` bucket with **60s** expiry. Returns the URL.

3. **`app/api/downloads/[resourceId]/route.ts` (POST)** — the gated endpoint, in this exact order (CONVENTIONS §5.2):
   1. **Auth** — authenticated user? If not → 401 `{ reason: 'unauthorized' }`.
   2. **Validate** — `resourceId` is a uuid (Zod).
   3. **Resource** — fetch the resource; must exist and be `status = 'published'` (or 404). Need `creator_id`, `file_path`, `file_name`.
   4. **Entitlement** — `getUserEntitlement(user.id)`; if not entitled → 403 `{ reason: 'no_active_subscription' }`. Do NOT log, do NOT issue URL.
   5. **Log** — insert the immutable `downloads` row (with `creator_id`, `subscription_id`, `plan_type`). If this insert fails → abort with 500, NO URL issued.
   6. **Signed URL** — only after the log commits, create the 60s signed URL for the file.
   7. **Respond** — `{ url, fileName }`.
   - Optionally increment `resources.download_count` (denormalised cache) after a successful log — non-authoritative; the `downloads` table is the source of truth. Keep it simple (best-effort; don't fail the download if the counter update fails).

4. **`GET /api/downloads`** — the user's download history (paginated), own rows only (RLS), newest first. (Used by the dashboard in Phase 3; build the endpoint now.)

5. **Client wiring — replace the 1.6 stubbed download button:**
   - On click (subscriber state): POST to `/api/downloads/[resourceId]`, receive `{ url, fileName }`, then trigger the browser download by programmatically creating an `<a href={url} download={fileName}>` and clicking it.
   - Handle the states: 401 → redirect to login; 403 → show the subtle subscribe prompt / route to /pricing (consistent with 1.6 free-user treatment); success → download begins.
   - Loading/disabled state on the button during the request. Error toast on failure.

6. **Storage:** the `resource-files` bucket is private (from 1.2b). Confirm signed-URL generation works against it. NOTE: seed resources have fake `file_path`s pointing at files that don't exist in storage — see Testing for how to handle.

**Testing (no test-only code — use real data):**
- Insert one real `active` subscription row for your test user in Supabase (owner_id = your user id, plan_type e.g. 'personal_monthly', status 'active', amount_kobo whatever). The real `getUserEntitlement` will then grant downloads — exercising the genuine path. Delete the row when done.
- For an actual file to download: upload one small real file to the `resource-files` bucket and point one resource's `file_path` at it (the seed `file_path`s are fake). Then the full flow (log + signed URL + download) can be verified end-to-end on that resource.
- Verify the guarded behaviours explicitly: (a) guest → 401; (b) logged-in but no active subscription → 403, and confirm NO `downloads` row was written; (c) entitled user → a `downloads` row IS written with correct `creator_id`, then a working signed URL; (d) confirm you cannot UPDATE/DELETE a `downloads` row (immutability — try it in SQL, expect rejection).

**Acceptance criteria (done when):**
1. `getUserEntitlement` correctly returns entitled for an active owner OR active accepted team member; not entitled otherwise; typed result.
2. `POST /api/downloads/[resourceId]` enforces order: auth → validate → resource(published) → entitlement → log → signed URL → respond. A failure at any gate stops the flow.
3. Entitlement failure returns 403 and writes NO download row and issues NO URL.
4. On success, an immutable `downloads` row is written with `creator_id` denormalised from the resource, BEFORE the signed URL is created; if the log fails, no URL is returned.
5. Signed URL has a 60s TTL against the private `resource-files` bucket.
6. Client download button (subscriber) triggers an actual browser download via the returned signed URL; 401→login, 403→subtle subscribe prompt.
7. `GET /api/downloads` returns the user's own history, paginated, newest first.
8. Verified by test: guest→401; no-sub→403 (no row written); entitled→row written + working URL; downloads row cannot be updated/deleted.
9. No test-only/bypass code anywhere; entitlement reads real subscription state so Phase 2 needs no rework here.
10. TypeScript strict, no `any`; Zod validates input; conventions route shape; typecheck + lint pass.
11. One clean commit, e.g. `feat(downloads): add entitlement check, immutable attribution log, and signed-url download`.

**Watch for (review the plan carefully — this is the guarded step):**
- Log MUST precede the signed URL. Reject any plan that issues the URL first or logs after.
- `creator_id` on the download row is copied from the resource at download time — not looked up later, not a join.
- No bypass / test-only entitlement path. Real subscription read only.
- Entitlement must cover BOTH owner and accepted team member (not just owner_id).
- Immutability holds — no UPDATE/DELETE on downloads (already enforced in 1.2b; don't add policies that weaken it).
- Don't build Paystack/subscription creation here — that's Phase 2. This step only READS subscription state.

## UI POLISH PASS (pre-Phase-2) — make it feel engineered, not AI-generated

Goal: remove the "AI-built / template" feel and make Creatly feel like a real product crafted by a design-minded engineer. Motion is **subtle & premium** (Linear/Stripe school) — restraint, not spectacle. Three bounded steps.

---

### UI-1 — Design polish & motion foundation ✅ (design-led)

Establish reusable motion + interaction primitives and apply a refinement pass to existing surfaces. This is the "de-template-ify" step.

**Apply the frontend-design skill.** Stay within established green/terracotta/cream tokens.

**Motion approach (locked):** subtle & premium. Prefer CSS transitions + a small Intersection-Observer-based reveal hook for scroll animations. Only add a motion library (e.g. framer-motion) if genuinely needed and justified — keep the bundle lean (mobile audience). Respect `prefers-reduced-motion` everywhere — all motion must gracefully disable.

**Scope:**
1. **Reveal-on-scroll primitive** — a small reusable hook/component (`useReveal` or `<Reveal>`) using IntersectionObserver that fades + gently translates content in as it enters the viewport. Applied tastefully to sections (hero content, category row, featured strip, grid sections) — staggered, not everything-at-once.
2. **Micro-interactions** — refine across existing components:
   - Buttons: subtle press/scale + smooth color transitions on hover/active/focus.
   - Cards: already have hover lift — refine timing/easing so it feels smooth and intentional (good easing curves, ~200ms, not linear).
   - Links/nav: smooth underline or color transitions.
   - Focus-visible states that look designed, not default-browser.
3. **Browse hero elevation** — make it feel alive (currently dull):
   - Animate the hero content in on load (staggered fade/translate of headline → subline → search → stat line).
   - A subtle, tasteful background treatment on the green band — e.g. a soft animated gradient sheen, faint grain/texture, or a slow subtle motion — NOT a loud moving graphic. Premium and quiet.
   - Address the parked backlog items: trim hero vertical padding so categories peek above the fold; fix category pill left-edge clipping (scroll-padding).
4. **Spacing & typography refinement pass** — audit the existing pages for the default-shadcn-spacing tells: overly uniform gaps, cramped or too-loose sections, inconsistent rhythm. Tighten to a deliberate vertical rhythm. Make sure the serif/sans pairing is used with intent (sizes, weights, letter-spacing on headings).
5. **Polish details that signal craft:** consistent border-radii, considered shadows (soft, layered, not default), hover/active feedback on every interactive element, smooth page-level transitions where cheap.

**Acceptance criteria:**
1. A reusable reveal-on-scroll primitive exists and is applied tastefully (staggered, not all-at-once) on browse.
2. Buttons, cards, links, and focus states have refined, intentional micro-interactions (good easing, ~200ms).
3. Browse hero animates in on load and has a subtle premium background treatment; no loud/garish motion.
4. Parked backlog cleared: hero padding trimmed (categories peek above fold), category pills not clipped at the left edge.
5. `prefers-reduced-motion` fully respected — all motion disables cleanly.
6. Spacing/typography refined away from default-shadcn uniformity; deliberate vertical rhythm.
7. Bundle stays lean — no heavy animation dep unless justified and noted; mobile-fast.
8. TypeScript strict, no `any`; typecheck + lint pass.
9. One clean commit, e.g. `feat(ui): add motion primitives, micro-interactions, hero elevation`.

**Watch for:** motion must be subtle (premium, not agency-flashy); reduced-motion respected; don't bloat the bundle; don't break existing functionality (search, favourites, download) — this is presentation only.

---

### UI-2 — Real preview thumbnails ✅

Replace the flat colored placeholders with designed, mockup-style thumbnails so the catalogue looks like real creative work, not AI placeholders. (Dev/seed imagery — real creator uploads come in Phase 4/5.)

**Scope:**
- Create designed thumbnail images that *look like* the resource type: an Instagram-story-style graphic, a font specimen card, a presentation-slide thumbnail, a mockup scene, a brand-kit board, an icon-set grid. On-brand aesthetic.
- Recommended approach: generate these as local assets in `/public/seed/` (reliable, no external-host issues — we learned that lesson) OR as richly-designed SVG/CSS thumbnails. Decide and justify.
- Update the seed resources' `preview_image_path` (and a couple of `preview_images` for the lightbox demo) to point at the new assets.
- Ensure they look great in cards, the detail gallery, and the lightbox.

**Acceptance criteria:**
1. Seed resources display designed, realistic-looking preview thumbnails (not flat color blocks) across browse cards, detail gallery, and lightbox.
2. Images are reliably served (local `/public` or generated) — no external-host failures.
3. On-brand, varied per resource type; mobile-fast (sized/optimized).
4. One clean commit, e.g. `chore(seed): add realistic preview thumbnails`.

**Watch for:** use local/generated assets (picsum-style external hosting caused failures before); keep file sizes reasonable.

---

### UI-3 — Landing page ✅ (design-led)

Build a real home page at `/` (currently the Next.js default — the biggest "unfinished" tell). The marketing front door.

**Apply the frontend-design skill.** Subtle premium motion (reuse UI-1 primitives). On-brand.

**Scope (typical high-converting structure, on-brand & animated):**
- Hero: strong serif headline, value prop, primary CTA ("Browse resources" / "Get started"), secondary CTA; animated in; tasteful background.
- Social-proof / value strip (e.g. "Thousands of templates, fonts, mockups" / categories).
- "What you get" / feature section — a few benefit blocks (affordability, local payments, curated for African creatives) with reveal-on-scroll.
- Category showcase (pulls from categories table) linking into /browse.
- A featured-resources teaser (real seed resources) → links to /browse.
- Pricing teaser pointing to /pricing (built in Phase 2) — keep CTA wired even if /pricing 404s for now.
- Footer (brand, links, support email from config).
- Fully responsive, mobile-first, fast.

**Acceptance criteria:**
1. `/` is a real, branded, animated landing page (no Next.js default content anywhere).
2. Sections reveal on scroll (reusing UI-1 primitives); hero animates in; motion subtle + reduced-motion respected.
3. Pulls real categories + featured resources from the DB; CTAs wired (browse, signup, pricing).
4. Footer with brand + support email from config (no hardcoded brand string).
5. Mobile-first, fast; TypeScript strict, no `any`; typecheck + lint pass.
6. One clean commit, e.g. `feat(landing): add animated marketing home page`.

**Watch for:** reuse UI-1 motion primitives (don't reinvent); don't hardcode brand name; keep it fast; pricing CTA may point at a not-yet-built route — fine.

UI-4 — Lively UI & Animation pass ✅ (design-led)


⚙️ AUTONOMOUS — this step self-drives, commits, and stops. No prompt needed between tasks. Log blockers to BLOCKERS.md and continue.



Goal: make Creatly feel alive — energetic, premium, editorial. Framer Motion is justified here given the scope; install it if not already present (pnpm add framer-motion). All motion respects prefers-reduced-motion. Stay within brand tokens (forest, terracotta, cream). Do NOT touch auth logic, download mechanic, RLS, or any server-side code — presentation only.

Decisions (locked):


Framer Motion for JS-driven animation (page transitions, stagger, tilt, count-up).
CSS only for simple effects (shimmer, gradient mesh, glassmorphism).
Every animated element has a prefers-reduced-motion fallback (instant/no motion).
Mobile-first — no animation that tanks performance on low-end devices (use will-change sparingly, avoid animating layout properties).



Task 1 — Glassmorphism navbar


Replace the current solid navbar background with: backdrop-blur-md bg-white/70 dark:bg-forest/70 border-b border-white/20 — frosted glass effect.
Smooth slide-down entrance on first load (framer-motion AnimatePresence + motion.header, y: -100 → 0).
Active nav link: animated underline that slides in (motion.span with layoutId="nav-underline" for smooth transfer between links).
Logo: subtle scale pulse on hover (whileHover={{ scale: 1.05 }}).
Mobile overlay menu: items stagger in (variants with staggerChildren: 0.07).


Task 2 — Landing hero: animated gradient mesh background


Replace the static hero background with a slow CSS animated gradient mesh: 3–4 radial gradients in forest/terracotta/cream, animating position via @keyframes (slow, ~20s loop, subtle — not a disco). Use background-size: 400% 400% with background-position animation.
Hero text: animate in word-by-word using Framer Motion motion.span with staggerChildren on the headline. Subline and CTA follow with delay.
CTA button: shimmer sweep on hover — a ::after pseudo-element with a diagonal gradient that slides across on hover via CSS @keyframes.
Floating asset collage (the staggered previews): on load, each card animates in with a slight rotation + scale from 0 (initial: { opacity: 0, scale: 0.8, rotate: -3 }, animate: { opacity: 1, scale: 1, rotate: Xdeg }), staggered 0.1s per card.


Task 3 — Scroll-triggered section entrances


Wrap every landing section and browse section in a <ScrollReveal> component (update the existing <Reveal> / useReveal from UI-1 to use Framer Motion useInView + motion.div).
Entrance: { opacity: 0, y: 40 } → { opacity: 1, y: 0 }, duration: 0.6, ease: [0.16, 1, 0.3, 1] (expo out).
Children stagger: staggerChildren: 0.08 on the parent variants so grid items, feature blocks, and category tiles cascade in.
Apply to: landing sections, browse hero, category row, featured strip, resource grid (first page load only — not on filter/search updates).


Task 4 — Resource card: 3D tilt + shine


Wrap ResourceCard in a <TiltCard> client component: track mouse position on onMouseMove, apply a subtle CSS transform: perspective(800px) rotateX(Xdeg) rotateY(Ydeg) (max ±8deg). Smooth reset on onMouseLeave.
Shine/glare: a ::after radial gradient that follows the mouse position (CSS custom properties --mouse-x, --mouse-y updated via JS), low opacity (~0.15) — the "glass shine" effect.
Image zoom on card hover: already present from 1.4b — ensure it's scale(1.05) inside overflow-hidden, smooth transition: transform 0.4s ease.
Favourite heart: fade + scale in on card hover (currently always visible — change to opacity: 0 → 1 on card hover, scale: 0.8 → 1).


Task 5 — Count-up stats animation


Landing trust strip / stats (e.g. "2,400+ resources", "50+ creators"): when they scroll into view, animate the number counting up from 0 using a custom useCountUp(target, duration) hook (Framer Motion useMotionValue + useTransform, or a simple requestAnimationFrame loop).
Trigger once on first useInView.


Task 6 — Category tiles: bounce-in + color flood hover


Category tiles/pills on load: stagger bounce-in (type: "spring", stiffness: 300, damping: 20).
Hover: background color floods from center outward — CSS radial-gradient transition or a motion.div scale from 0 on the background layer (position: absolute, scale: 0 → 1, border-radius: 50% → 0% via Framer layoutId or simple spring scale).


Task 7 — Page transitions


Wrap the root layout children in a Framer Motion AnimatePresence with a motion.div per page: initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, duration: 0.25. Smooth, not dramatic.
Use key={pathname} (from usePathname) on the motion wrapper to trigger per-route.



Acceptance criteria (done when):


Navbar is glassmorphism; slides in on load; active link has animated underline; logo pulses on hover; mobile menu items stagger in.
Landing hero has animated gradient mesh background, word-by-word headline entrance, shimmer CTA, staggered collage card entrance.
All landing + browse sections reveal on scroll with staggered children; expo-out easing.
Resource cards have 3D tilt + mouse-tracked shine; image zoom smooth; heart fades in on hover.
Stats count up on scroll-into-view; triggers once.
Category tiles bounce in on load; hover floods background.
Page transitions are smooth (fade + 8px y) between routes.
prefers-reduced-motion: ALL motion above is instant/disabled — no layout shift, no broken UI.
Bundle impact is acceptable — framer-motion is tree-shaken; no other new heavy deps.
No auth, RLS, download, or server logic touched — presentation only.
pnpm typecheck + pnpm lint pass; pnpm build clean.
One clean commit: feat(ui): lively animation pass — glassmorphism nav, hero mesh, card tilt, scroll reveals, page transitions.


Watch for: don't animate layout properties (width/height) — only transform + opacity for performance; tilt effect must reset cleanly on mouse leave; count-up must not re-trigger on every scroll; page transition AnimatePresence needs mode="wait" to prevent overlap; shine effect must not cause repaints on every frame (use CSS custom properties, not inline style recalc).

---
PHASE 1.9 — Brand, Navigation & Onboarding ✅

The "doesn't feel AI-generated" pass with teeth: a real logo/identity, a proper navigation system, a rebuilt landing page, branded auth, and a guided onboarding flow. Plus one live bug fix (verification email). Phase 1 shipped the storefront and the guarded download mechanic; this phase makes Creatly feel like an owned brand before we take money in Phase 2.

Applies to every step in this phase: use the frontend-design skill (/mnt/skills/public/frontend-design/SKILL.md); stay within and extend the established green/terracotta/cream tokens and the UI-1 motion primitives (reuse <Reveal> / useReveal, don't reinvent); subtle premium motion only; prefers-reduced-motion always respected; mobile-first at 375px; no bundle bloat.


1.9.0 — Fix: verification email not sending ✅ (bug fix — do FIRST)

Email verification (built in 1.3) is not delivering. Onboarding (1.9.5) depends on a working verify flow, so this is unblocked first. No new features — diagnose and fix the existing pipeline.

Decisions (locked):


Production email provider is Resend, wired into Supabase as custom SMTP (the 1.3 plan already anticipated switching off Supabase built-in with "no rework needed").
Sender identity: noreply@joincreatly.com (requires a verified domain in Resend).


Scope:


Diagnose in order, documenting findings:

Confirm whether Supabase is still on default built-in SMTP (rate-limited to a few/hour, silently drops/delays — the most likely cause for "not sending").
Check Authentication → URL Configuration: Site URL = https://joincreatly.com; redirect allow-list includes https://joincreatly.com/**, http://localhost:3000/**, and the Vercel preview pattern. A missing redirect URL surfaces as otp_expired/404 even when mail sends.
Verify the confirm template still contains the {{ .ConfirmationURL }} token (a broken/edited template kills the link).
Verify the callback route from 1.3 exchanges the code for a session (exchangeCodeForSession) and redirects to /browse (per 1.3 decision), handling the expired/invalid case with a resend path.
Check Auth logs (Dashboard → Logs → Auth) for send failures; locally, check Inbucket.



Wire Resend SMTP in Supabase (Host smtp.resend.com, port 465, user resend, password = RESEND_API_KEY, sender noreply@joincreatly.com).
Branded confirm-signup template — inline-styled HTML on-brand (forest/terracotta/cream, Creatly wordmark), preserving {{ .ConfirmationURL }}. This is the "branded Resend templates come later" item from 1.3, brought in now.
Env + DNS: add RESEND_API_KEY to env (lib/env.ts validation + Vercel). Domain DNS verification (SPF/DKIM for joincreatly.com) is a founder action if not already done — if blocked, record the exact DNS records needed in BLOCKERS.md and continue; do not stall the phase.


Acceptance criteria (done when):


A signup on a fresh email delivers a verification mail within ~60s (via Resend, not built-in SMTP).
Clicking the link confirms the account and lands the user on /browse with a session (no otp_expired).
The unverified-login block and resend flow from 1.3 still work end-to-end.
Confirm-signup email is on-brand and contains a working {{ .ConfirmationURL }}.
RESEND_API_KEY is validated in lib/env.ts; if DNS verification is outstanding, BLOCKERS.md documents the exact records.
No 1.3 auth logic regressed; pnpm typecheck + pnpm lint pass.
One clean commit, e.g. fix(auth): wire Resend SMTP + branded verification email.


Watch for: default Supabase SMTP is the prime suspect; redirect allow-list is the second; don't rewrite 1.3 flows, only fix the pipeline; DNS is a founder action — log it, don't block.


1.9.1 — Brand identity: logo & mark ✅ 🔶 CHECKPOINT (design-led)


🔶 CHECKPOINT: complete, self-review, and commit this step, then STOP and present the logo (all variants, on cream + forest, favicon, OG) to the founder for approval before continuing. The logo anchors everything visual downstream — don't /clear past it unapproved.



Creatly has no real logo — the wordmark reads as a default. Build an ownable identity as code (SVG components), themeable and crisp at every size.

Use the frontend-design skill.

Decisions (locked):


A wordmark + monogram system. Monogram: a "C" built as a stylised aperture/loop (a nod to lens/creativity and woven geometry) from overlapping forest + terracotta arcs. Wordmark: "Creatly" in the display face, tight tracking, a small terracotta accent on the descender.
Implemented as inline SVG React components (vector, currentColor-themeable) — no raster source of truth.


Scope:


components/brand/Logo.tsx exporting three variants: full (mark + wordmark — nav, footer), mark (monogram — favicon, mobile nav, loading), wordmark (text). Props for tone (ink | cream | mono) and size. Generate real SVG geometry — no placeholder.
Favicon + icons: app/icon.svg (Next 15 auto-favicon), app/apple-icon.png (180×180), and a dynamic app/opengraph-image.tsx (mark + tagline on a brand field) — replaces any Next default OG/favicon.
Use APP_NAME from config for any text alongside the logo where appropriate; never hardcode the brand string elsewhere.


Acceptance criteria (done when):


<Logo /> renders crisply at 24px and ~200px; all three variants work; tone variants legible on cream and forest.
Browser tab shows the Creatly mark (not the Next default); OG image renders the brand.
All vector — no raster placeholder anywhere; tokens/currentColor used, no hardcoded hex in the component beyond defined brand values.
pnpm typecheck + pnpm lint pass.
One clean commit, e.g. feat(brand): add Creatly logo system, favicon, and OG image.


Watch for: keep it vector + themeable; don't introduce a new palette (extend tokens); replace the Next default favicon/OG, don't leave both.


1.9.2 — Navigation system ✅ (design-led)

There is no dedicated nav component — build a real one used across public + app surfaces. Auth-aware, with category discovery and a clear creator entry point.

Use the frontend-design skill. Reuse UI-1 motion primitives.

Decisions (locked):


Sticky, transparent over the hero, solidifying to cream with backdrop-blur on scroll.
Auth-aware actions; a distinguished "For Creators" entry (funnels into the pulled-forward creator phase).


Scope:


components/nav/SiteHeader.tsx (+ supporting pieces): left = <Logo variant="full" />; center (desktop) = Browse, Categories (mega-menu), For Creators, Pricing; right = search affordance + auth-aware actions.

Logged out: Log in (ghost) + Sign up (terracotta solid pill — the high-contrast anchor).
Logged in: avatar dropdown — Dashboard, Favourites, Billing (Phase 2), Log out, + Creator Studio when the user is a creator (role check; the role column lands in the creator phase — until then the item is simply absent).



Categories mega-menu: multi-column panel from the categories table (not hardcoded), each with a tiny preview; opens with the expo ease; keyboard accessible.
Search affordance: expands/routes into the existing 1.5 FTS search (/browse?q=) — do not rebuild search.
Mobile: full-screen overlay menu (logo mark + close), large display-font links, mono section labels, focus-trapped, closes on route change.
A11y: keyboard-navigable dropdowns, aria-expanded, skip-to-content, visible focus.
Wire the header into the public layout and app layout consistently (replace whatever ad-hoc nav exists).


Acceptance criteria (done when):


Sticky header transparent over hero, solid + blur on scroll; consistent across public and app routes.
Mega-menu renders categories from the DB, opens/closes smoothly, keyboard accessible.
Auth-aware: correct actions for logged-out / logged-in; Creator Studio item appears only for creators (gracefully absent until the role exists).
Search affordance routes into existing FTS search (no search rebuild).
Mobile overlay works, traps focus, closes on navigation; reduced-motion respected.
pnpm typecheck + pnpm lint pass.
One clean commit, e.g. feat(nav): add auth-aware site header with category mega-menu and mobile overlay.


Watch for: don't rebuild 1.5 search — link into it; categories from the table, not hardcoded; the Creator Studio item must no-op/absent until the creator role exists; don't fight the hero (z-index/spacing).


1.9.3 — Auth UI redesign ✅ (design-led)

The 1.3 auth screens work but read as default. Rebuild their presentation only — flows, validation, and redirects from 1.3 are untouched.

Use the frontend-design skill.

Scope:


Split-screen layout (desktop): left = form on cream; right = branded forest panel with grain texture, the logo mark, and a staggered asset collage (reuse UI-2 thumbnails). Mobile: brand panel collapses to a slim header.
Apply to signup, login, reset-password, update-password: large display headings, mono field labels, generous spacing, terracotta primary buttons with loading states, inline (not submit-only) validation, password strength meter on signup, clear error/success states. Keep all existing React-Hook-Form + Zod (lib/validations/auth.ts) wiring — presentation change only.
Preserve every 1.3 behaviour: verification-required gate, resend, no account enumeration, safe next redirects, land on /browse.


Acceptance criteria (done when):


All four auth screens are branded split-screen (slim header on mobile); no default/AI-looking forms.
Inline validation + password strength + proper loading/error states present.
All 1.3 flows still pass (verify-before-login, resend, no enumeration, safe next, /browse landing) — no behavioural regression.
Reduced-motion respected; mobile-first at 375px.
pnpm typecheck + pnpm lint pass.
One clean commit, e.g. feat(auth-ui): branded split-screen auth screens.


Watch for: presentation only — do not alter 1.3 auth logic, schemas, or redirects; reuse the shared Zod schemas; no enumeration leaks reintroduced via new error copy.


1.9.4 — Landing page: full redesign (rip & replace) ✅ 🔶 CHECKPOINT (design-led)


🔶 CHECKPOINT: complete, self-review, and commit this step, then STOP and present the rebuilt landing page (desktop + 375px mobile) to the founder for approval before continuing to 1.9.5. The hero treatment and art direction set the product's first impression — don't /clear past it unapproved.



The UI-3 landing page is replaced — not refined — with a bold, editorial, asset-forward home page. Founder decision: rip and replace. Reuse UI-1 motion primitives and UI-2 thumbnails; pull live categories + featured resources as UI-3 did.

Use the frontend-design skill.

Decisions (locked):


Editorial bold-minimalism: oversized type-led asymmetric hero (not centered-hero-with-gradient), monospace eyebrows/labels, intentional negative space, subtle grain texture, high-contrast terracotta CTA, real asset previews as proof.
Hero height ~88vh (resolves the parked "hero too tall" tell on the home page).


Scope (sections, each a component in components/landing/):


Hero — mono eyebrow (// SUBSCRIPTION-BASED CREATIVE LIBRARY), oversized asymmetric display headline (second line terracotta), one-line subcopy, primary terracotta CTA (Start creating →) + ghost (Browse the library), and an overlapping, slightly-rotated parallax collage of real UI-2 previews. Grain texture; staggered load-in via UI-1 primitives.
Category showcase — asymmetric bento grid from the categories table; hover zoom + terracotta accent; links to /browse?category=.
Featured strip — real is_featured resources; mono metadata; links to /browse.
Value pillars — staggered (not evenly-spaced) rows: Curated for quality / Fair pay for creators / Download with confidence; hand-drawn-style line icons.
For-Creators band — dark forest, grain overlay, mono kicker // FOR CREATORS, CTA → the creator landing (route from the creator phase; wire the href even if it 404s until then).
Pricing teaser — compact, links to /pricing (Phase 2; href wired).
Footer — large wordmark, link columns, mono copyright, support email from config (no hardcoded brand).



Reveal-on-scroll per section (UI-1), hero parallax, magnetic CTA hover; reduced-motion disables non-essential motion; lazy-load below-fold imagery; no CLS.


Acceptance criteria (done when):


/ is fully replaced: asymmetric, type-led hero (no centered-gradient look), ~88vh; old UI-3 layout gone.
Real categories + featured resources pulled from the DB; real UI-2 previews used throughout (no placeholders).
All sections responsive (collage stacks, bento → single column on mobile); reveal-on-scroll via UI-1 primitives; reduced-motion respected.
For-Creators band + pricing teaser CTAs wired (may 404 until their routes exist).
Footer uses APP_NAME/support email from config — no hardcoded brand string.
Lighthouse not regressed (lazy-load, no CLS); pnpm typecheck + pnpm lint pass.
One clean commit, e.g. feat(landing): editorial rip-and-replace home page.


Watch for: this replaces UI-3 — remove the old page, don't layer on it; reuse UI-1/UI-2, don't reinvent motion or imagery; no hardcoded brand; creator/pricing routes may not exist yet (wire hrefs); keep it fast.


1.9.5 — Onboarding flow ✅

1.3 has no post-signup onboarding. Add a short guided wizard after first verified login that captures intent (consumer vs creator) and personalises the experience — and routes would-be creators toward the pulled-forward creator phase.

Decisions (locked):


Runs once, after first verified login; persisted so refresh doesn't restart it; skipped for already-onboarded users.
Needs an onboarded flag (and, looking ahead, a role) on the profile. These columns are introduced as a NEW migration here (1.2b/1.3 migrations untouched) so onboarding is self-contained and the creator phase can build on role.


Scope:


Migration (new file): add profiles.onboarded boolean not null default false and profiles.role text not null default 'consumer' check (role in ('consumer','creator','admin')). RLS: a user may update their own onboarded/role to consumer/creator only (never self-assign admin — enforce in policy/server). Regenerate types/database.ts.
Wizard (app/onboarding/), mono step indicator 01 / 03:

Step 1 — intent: "How will you use Creatly?" → I'm here to download (consumer) or I want to sell my work (creator). Sets role.
Step 2 — personalise: multi-select interest categories (chips, from categories), optional display name/avatar.
Step 3 — done: confirmation + next action (Browse, or — if creator — Start your creator profile, routing toward the creator phase). Subtle on-brand motion moment.



Gating: after first verified login, if onboarded = false route to /onboarding; on completion set onboarded = true and route (consumer → /browse; creator → creator apply/landing, href wired even if that route arrives in the creator phase). Already-onboarded users never see it.
Server-side writes only; never trust the client for role (no admin), and validate interests against real categories.


Acceptance criteria (done when):


New migration adds onboarded + role with safe RLS (no client self-assignment of admin); types regenerated; earlier migrations untouched.
Wizard runs once after first verified login, persists progress, sets role + interests, marks onboarded, and is skipped thereafter.
Consumer completes → /browse; creator completes → creator apply/landing (href wired even if 404 until the creator phase).
All writes server-side and validated; reduced-motion respected; mobile-first.
pnpm typecheck + pnpm lint pass.
One clean commit, e.g. feat(onboarding): add post-signup onboarding wizard with role + interests.


Watch for: new migration only; role cannot be set to admin by a client; don't break the 1.3 verify→/browse path (onboarding interleaves after first login, doesn't replace the redirect logic); creator route may not exist yet — wire the href.


PHASE 1.10 — Creator Side (pulled forward from Phase 5) ✅

Supply side of the marketplace: creators apply, get a profile, upload assets, assets go live. Approved assets flow into the existing catalogue, detail page, and the guarded 1.8 download mechanic — do NOT fork those.

Launch decision (locked): CREATOR_AUTO_APPROVE env flag, default true. When true, creators and uploads go live with no human gate, but all server-side validation still runs. Flipping to false re-enables manual review with zero code change.

Phase guardrails (apply to every step): catalogue/detail/download reused not forked; only approved assets are public; ALL creator/admin writes are server-side and role-checked; creator_id is immutable and is the attribution source 1.8 denormalises; never trust the client for role, review_status, or creator_id. Reuse the ROLE_DB_MAP pattern from 1.9.5 ('creator' UI value → DB value). Use createAdminClient() only after getAuthenticatedUser() + Zod validation, with a comment explaining why (same pattern as the onboarding action). TS strict, no any. Zod-validate every external input.


1.10.1 — Data model + storage (new migration) ✅

Scope:


New timestamped migration (YYYYMMDDHHMMSS_creator_side.sql — correct prefix, do not edit earlier migrations).
creator_profiles table:

user_id uuid primary key references auth.users on delete cascade
handle text unique not null (slug, lowercase, ^[a-z0-9_]{3,30}$)
display_name text not null, bio text, avatar_path text, banner_path text, location text, website text, socials jsonb not null default '{}'
status text not null default 'approved' check (status in ('pending','approved','suspended'))
created_at timestamptz not null default now()



Extend resources (use ADD COLUMN IF NOT EXISTS, but VERIFY each landed — the 1.9.5 lesson: a silently-skipped add):

creator_id uuid references creators(id) — NOTE align with existing schema: resources already have a creator linkage from Phase 1; confirm the real column/table name (creators.id) and reuse it. The review columns below are the new part.
review_status text not null default 'draft' check (review_status in ('draft','submitted','approved','rejected'))
rejection_reason text, submitted_at timestamptz, reviewed_at timestamptz, reviewed_by uuid references auth.users



Map creator identity: a creator's creator_profiles.user_id links to their creators row (the existing catalogue creator entity). Add a creators.user_id uuid unique references auth.users if it doesn't exist, so uploaded resources attribute to the right public creator. Confirm and reuse existing structure rather than duplicating.
RLS:

creator_profiles: public SELECT where status='approved'; owner SELECT/UPDATE own; INSERT own (auth.uid() = user_id); admin all. No client DELETE.
resources: extend existing published-only public read to status='published' AND review_status='approved' for public/anon. Creators SELECT/UPDATE/INSERT their OWN rows (creator_id resolves to their creator entity). Admin all. Keep immutability/guards from 1.2b intact.
Never allow a client to set review_status='approved' directly — enforce via policy with_check (non-admin can only set draft/submitted) AND server-side.



Storage: reuse the private resource-files bucket (1.2b) for originals and resource-previews (public) for previews. Add bucket policies allowing an authenticated creator to upload to a path namespaced by their id (e.g. resource-files/{user_id}/...). Signed-URL download (1.8) already serves originals — unchanged.
Regenerate types/database.ts; pnpm typecheck.


Acceptance criteria:


Migration applies cleanly to remote (pnpm supabase db push), correct timestamp prefix.
creator_profiles exists with constraints above; status defaults to approved (matches auto-approve launch).
Review columns exist on resources and are VERIFIED present (queried information_schema.columns), not silently skipped.
Public/anon can only read resources that are BOTH published and review_status='approved'.
RLS prevents a non-admin client from setting review_status='approved' or another user's creator_id.
Creator can upload to their namespaced storage path; download mechanic (1.8) still works unchanged.
Types regenerated; pnpm typecheck + pnpm lint pass.
Commit: feat(creator): creator_profiles, resource review columns, storage policies.


Watch for: verify each ADD COLUMN actually landed (1.9.5 trap); don't fork the creators/resources entities — extend and reuse; don't weaken 1.2b immutability or 1.8 guards.


1.10.2 — /creators landing + apply flow ✅ (design-led)

Use frontend-design skill. Reuse UI-1 motion + brand tokens. This is the route the navbar "For Creators" and landing "For Creators" band already point at.

Scope:


app/creators/page.tsx — public marketing page: value prop (earn from your work), how-it-works, FAQ, CTA Become a creator → /creators/apply. Editorial, on-brand. Pulls nothing sensitive; public.
app/creators/apply/page.tsx — gated: if not logged in → /login?next=/creators/apply; if already a creator → redirect /creator.

Form (RHF + Zod, schema in lib/validations/creator.ts): handle (live uniqueness check via a small route/RPC, regex ^[a-z0-9_]{3,30}$), display_name, bio, location, optional website, agree-to-terms checkbox.



Server action applyAsCreator:

getAuthenticatedUser() → validate inputs → on CREATOR_AUTO_APPROVE=true insert creator_profiles with status='approved', set profiles.role to creator (via ROLE_DB_MAP), ensure/create the linked creators row with user_id. Admin client for the role write (verified-identity comment, per 1.9.5 pattern).
Uniqueness conflict on handle → 409, friendly inline error.
On success → redirect /creator.





Acceptance criteria:


/creators renders on-brand; CTAs wired; navbar/landing links resolve (no 404).
/creators/apply gates correctly (guest→login, existing creator→/creator).
Handle uniqueness checked live + enforced server-side; invalid handle rejected by Zod.
Submitting creates creator_profiles (approved under the flag), sets role, links creators row — all server-side; client cannot self-assign admin or approved-without-flag.
Redirects to /creator on success; reduced-motion respected; mobile-first.
pnpm typecheck + pnpm lint pass.
Commit: feat(creator): /creators landing + become-a-creator apply flow.


Watch for: role write needs admin client (RLS blocks self role-change, per 1.9.5); honor CREATOR_AUTO_APPROVE; don't trust client status/role.


1.10.3 — Creator Studio dashboard + profile editor ✅ (design-led)

Scope:


Route group app/(app)/creator/ gated to creator role (middleware or layout guard via getAuthenticatedUser() + role check; non-creators → /creators).
creator/page.tsx — overview: counts by review_status (draft/submitted/approved/rejected), basic stats (downloads, favourites) from real data where available, CTA to upload.
creator/assets/page.tsx — list/grid of the creator's OWN resources with review_status badges; edit drafts, delete drafts, view rejection_reason, resubmit rejected.
creator/profile/page.tsx — edit creator_profiles (display_name, bio, avatar, banner, location, website, socials) with live preview of the public storefront card. Avatar/banner upload to creator-avatars/previews bucket.
Add "Creator Studio" to the navbar avatar dropdown when role is creator (the 1.9.2 nav already conditionally renders it — wire it live now).


Acceptance criteria:


/creator/* accessible only to creators; others redirected.
Overview shows accurate counts + available stats.
Asset list shows only the creator's own resources with correct status badges; draft edit/delete + resubmit work; all writes server-side + ownership-checked.
Profile editor saves and shows live preview; image uploads land in the correct bucket/path.
Navbar Creator Studio entry appears for creators, routes to /creator.
pnpm typecheck + pnpm lint pass.
Commit: feat(creator): Creator Studio dashboard + profile editor.


Watch for: ownership check on every read/write (a creator sees only their own); reuse existing card/grid components.


1.10.4 — Asset upload flow ✅

Scope:


studio/upload/ — multi-step wizard (mono step indicator, reuse onboarding wizard pattern):

Step 1 Files: drag-drop source file(s) → upload to private resource-files/{user_id}/.... Client collects; SERVER validates type + size (Zod + server check). Show progress. Generate/derive preview thumbnail(s) to resource-previews; creator picks the primary preview.
Step 2 Details: title, description, category (from categories), tags, file_type, compatible_software, license_type. Inline validation.
Step 3 Preview & submit: render exactly as catalogue card + detail page would (reuse those components in preview mode). Show immutable attribution (creator name, not editable).



Save-as-draft at any step; resumable (persist draft resources row with review_status='draft').
Submit server action: getAuthenticatedUser() → verify creator role + ownership → validate → set fields. Submit behaviour by flag (SERVER decides):

CREATOR_AUTO_APPROVE=true → review_status='approved', status='published', submitted_at=reviewed_at=now(), reviewed_by=null → live immediately ("Published").
false → review_status='submitted', submitted_at=now() → enters review queue ("Submitted for review").



creator_id set server-side from the creator's own entity — never from client. Immutable thereafter.


Acceptance criteria:


Multi-step upload works; files land in private bucket under the user's namespace; previews in public bucket; primary preview selectable.
Server validates file type/size and all metadata; client values never trusted for creator_id/review_status/status.
Save-as-draft + resume works.
Under auto-approve, submit publishes live and the asset appears in browse/detail and is downloadable via 1.8 with correct immutable attribution; under manual mode it enters the queue.
Preview step matches real catalogue/detail rendering.
pnpm typecheck + pnpm lint pass.
Commit: feat(creator): multi-step asset upload to private bucket.


Watch for: server-side file validation is mandatory (don't trust client MIME); creator_id from server; honor the flag; reuse catalogue/detail components for preview, don't rebuild.


1.10.5 — Admin review queue ✅

Scope:


app/(app)/admin/review/page.tsx gated to admin role (reuse existing /admin guard from middleware; role check).
Queue of review_status='submitted', newest first: full preview, metadata, creator, files.
Actions (server actions, admin-only, admin client after identity check):

Approve → review_status='approved', status='published', reviewed_at=now(), reviewed_by=admin.id. Asset goes live.
Reject → require rejection_reason, set review_status='rejected', reviewed_at, reviewed_by. Creator sees reason in Studio, can resubmit.



Under CREATOR_AUTO_APPROVE=true the queue is normally empty (assets auto-approve) — page still functions for when the flag flips. Document this.
First-admin bootstrap: document in BLOCKERS.md that the first admin is set by manually flipping one profiles.role='admin' via SQL.


Acceptance criteria:


/admin/review admin-only; non-admins blocked.
Submitted assets listed with full context; approve/reject work server-side with role checks; reject requires a reason.
Approve makes the asset live in catalogue; reject surfaces reason to creator + allows resubmit.
Queue functions correctly when flag is false; empty (by design) when true.
First-admin bootstrap documented in BLOCKERS.md.
pnpm typecheck + pnpm lint pass.
Commit: feat(admin): submission review queue (approve/reject).


Watch for: admin role enforced server-side, not just hidden in UI; reject reason mandatory; don't let approve be reachable by non-admins.


1.10.6 — Public creator storefront ✅ (design-led)

Scope:


app/creators/[handle]/page.tsx — public page for status='approved' creators: banner, avatar, display_name, bio, location, socials, and a grid (reuse ResourceGrid/ResourceCard) of their published+approved resources. Unknown/non-approved handle → notFound().
Link resource-detail creator attribution (from 1.6) to /creators/[handle].
generateMetadata from creator display_name + APP_NAME.


Acceptance criteria:


/creators/[handle] renders approved creators with their live assets; unknown/unapproved → 404 (no leak).
Resource detail attribution links to the storefront.
Reuses catalogue components; on-brand; mobile-first; metadata set.
pnpm typecheck + pnpm lint pass.
Commit: feat(creator): public creator storefront /creators/[handle].


Watch for: only approved creators + approved/published assets are public; reuse existing grid/card.

# Phase 2 — Payments (Creatly) ✅

> **Ground rules (repeat them in every PR description)**
> - All money is stored and transmitted as **integer kobo** (₦1 = 100 kobo). Zero floats near financial logic.
> - Annual price = **10 × monthly** kobo (2 months free).
> - **Webhooks are the only writer of subscription state.** No client-side trust, ever.
> - Paystack `reference` is your idempotency key — store it in `payment_references` before redirecting; reject duplicate webhook deliveries.
> - Signed URLs on downloads are already gated on real subscription rows — no entitlement rework needed.

---

## Step 2.1 — Pricing constants + DB schema ✅

### What to build

**`lib/pricing.ts`** — single source of truth, never computed at runtime
```ts
export const PLANS = {
  solo_monthly:  { id: 'solo_monthly',  kobo: 150000, interval: 'monthly', seats: 1 },
  solo_annual:   { id: 'solo_annual',   kobo: 1500000, interval: 'annual',  seats: 1 },
  team_monthly:  { id: 'team_monthly',  kobo: 400000, interval: 'monthly', seats: 5 },
  team_annual:   { id: 'team_annual',   kobo: 4000000, interval: 'annual',  seats: 5 },
} as const
export type PlanId = keyof typeof PLANS
export const toNaira = (kobo: number) => (kobo / 100).toFixed(2)
```

**Supabase migration `20240001_payments.sql`**
```sql
-- Plans reference table (seed from pricing.ts)
create table public.plans (
  id          text primary key,           -- 'solo_monthly' etc.
  kobo        integer not null check (kobo > 0),
  interval    text not null check (interval in ('monthly','annual')),
  seats       integer not null default 1,
  label       text not null,
  active      boolean not null default true
);

-- Idempotency / audit log — insert BEFORE redirect, never update
create table public.payment_references (
  reference   text primary key,           -- Paystack reference (uuid v4 generated client-side)
  user_id     uuid not null references auth.users,
  plan_id     text not null references public.plans,
  kobo        integer not null,
  status      text not null default 'pending'  -- pending | success | failed
              check (status in ('pending','success','failed')),
  created_at  timestamptz not null default now(),
  settled_at  timestamptz
);

-- Subscriptions (already read by entitlement logic)
-- Ensure correct shape; add columns if Phase 1 migration differs:
alter table public.subscriptions
  add column if not exists plan_id     text references public.plans,
  add column if not exists team_id     uuid,
  add column if not exists paystack_sub_code text,   -- for managed recurring
  add column if not exists cancel_at   timestamptz;

-- Team workspaces
create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references auth.users,
  created_at  timestamptz not null default now()
);

-- Team membership
create table public.team_members (
  team_id     uuid not null references public.teams on delete cascade,
  user_id     uuid not null references auth.users  on delete cascade,
  role        text not null default 'member' check (role in ('owner','member')),
  joined_at   timestamptz not null default now(),
  primary key (team_id, user_id)
);

-- Pending invites
create table public.team_invites (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams on delete cascade,
  email       text not null,
  token       text not null unique default encode(gen_random_bytes(32),'hex'),
  invited_by  uuid not null references auth.users,
  accepted_at timestamptz,
  expires_at  timestamptz not null default now() + interval '7 days',
  created_at  timestamptz not null default now()
);

-- RLS: users only see their own payment_references
alter table public.payment_references enable row level security;
create policy "owner" on public.payment_references
  for select using (auth.uid() = user_id);

-- RLS: subscriptions readable by member (team or self)
-- (add to existing subscriptions RLS; adjust if policy already exists)
```

**Seed plans** (run after migration)
```sql
insert into public.plans (id, kobo, interval, seats, label) values
  ('solo_monthly',  150000,  'monthly', 1, 'Solo Monthly'),
  ('solo_annual',   1500000, 'annual',  1, 'Solo Annual'),
  ('team_monthly',  400000,  'monthly', 5, 'Team Monthly'),
  ('team_annual',   4000000, 'annual',  5, 'Team Annual')
on conflict do nothing;
```

**Review checklist**
- [ ] `kobo` column is `integer`, no `decimal`/`float` anywhere
- [ ] `payment_references` has no `update` policy — insert-only from server
- [ ] Migration is reversible (add `drop table` stubs in a `down` block)

---

## Step 2.2 — Pricing page `/pricing` ✅

**One-liner**
```
pnpm claude "Build /pricing page per BUILD-PLAN step 2.2 — toggle monthly/annual, plan cards, checkout CTA; commit when done"
```

### What to build

**`app/pricing/page.tsx`** — server component shell + client toggle

**UI spec**
- Monthly / Annual toggle (pill switcher) — annual shows "2 months free" badge
- 2 plan columns: **Solo** (₦1,500/mo · ₦15,000/yr) and **Team** (₦4,000/mo · ₦40,000/yr)
- Feature comparison rows: downloads/month, seats, priority support, team workspace
- Active plan highlighted with terracotta border + "Current plan" label (read from `useSubscription` hook)
- CTA: "Get started" → hits `/api/checkout` server action; signed-in check first (redirect to login if not)
- FAQ accordion at bottom (3–4 common Q&A)

**Locale formatting helper** (use everywhere currency is displayed)
```ts
// lib/format-naira.ts
export const formatNaira = (kobo: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
    .format(kobo / 100)
```

**Review checklist**
- [ ] Prices come from `PLANS` constant, never hardcoded in JSX
- [ ] `formatNaira` used for every price display
- [ ] No checkout logic in this file — just navigation to `/api/checkout`

---

## Step 2.3 — Checkout server action + Paystack initialisation ✅

**One-liner**
```
pnpm claude "Build /api/checkout server action per BUILD-PLAN step 2.3 — insert payment_reference, call Paystack initialize, redirect; commit when done"
```

### What to build

**`app/api/checkout/route.ts`** — POST only
```
POST /api/checkout
Body: { planId: PlanId }
```

**Logic (server-side, never trust client for price)**
1. Auth-gate: get session from Supabase server client; 401 if missing
2. Look up `PLANS[planId]` — if invalid, 400
3. Generate `reference = crypto.randomUUID()`
4. Insert into `payment_references` `{ reference, user_id, plan_id, kobo }` — if insert fails (duplicate), 409
5. Call Paystack `/transaction/initialize`:
   ```
   POST https://api.paystack.co/transaction/initialize
   Authorization: Bearer PAYSTACK_SECRET_KEY
   {
     email: user.email,
     amount: plan.kobo,          // kobo
     currency: "NGN",
     reference,
     callback_url: `${NEXT_PUBLIC_APP_URL}/checkout/callback`,
     metadata: { user_id, plan_id, kobo: plan.kobo }
   }
   ```
6. On success → `{ authorization_url }` → redirect 303 to Paystack hosted page
7. On Paystack error → 502 with `{ error: 'payment_init_failed' }`

**Env vars needed**
```
PAYSTACK_SECRET_KEY=sk_live_...      # never exposed to client
NEXT_PUBLIC_APP_URL=https://joincreatly.com
```

**`app/checkout/callback/page.tsx`** — landing page after Paystack redirect
- Show spinner + "Verifying your payment…"
- Poll `/api/checkout/verify?reference=xxx` every 2 s (max 10 attempts)
- On `status: success` → redirect to `/dashboard` with toast "Subscription activated 🎉"
- On `status: failed` → show error + "Try again" button back to `/pricing`
- On timeout → "Still processing — check back in a moment" + link to `/billing`

**`app/api/checkout/verify/route.ts`** — GET, auth-gated
- Read `payment_references` for this `reference` + `user_id` (RLS enforced)
- Return `{ status }` — webhook will have updated it; this is read-only

**Review checklist**
- [ ] `PAYSTACK_SECRET_KEY` used server-side only; grep for accidental exposure
- [ ] `amount` sent to Paystack is `PLANS[planId].kobo` from server, not client
- [ ] `payment_references` insert happens before Paystack call (idempotency first)
- [ ] Callback page never writes subscription state — only reads

---

## Step 2.4 — Webhook handler (idempotent, signature-verified) ✅

**One-liner**
```
pnpm claude "Build /api/webhooks/paystack per BUILD-PLAN step 2.4 — HMAC verify, idempotency guard, write subscription state; commit when done"
```

### What to build

**`app/api/webhooks/paystack/route.ts`** — POST, no auth middleware (Paystack calls this)

**Verification (first thing, before any DB access)**
```ts
import { createHmac } from 'crypto'

const sig  = req.headers.get('x-paystack-signature') ?? ''
const body = await req.text()          // raw bytes for HMAC
const hash = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
               .update(body)
               .digest('hex')
if (!timingSafeEqual(Buffer.from(hash), Buffer.from(sig))) {
  return new Response('Forbidden', { status: 403 })
}
const event = JSON.parse(body)
```

**Idempotency guard**
```ts
// Use Paystack's own reference as idempotency key
const ref = event.data?.reference
const existing = await supabase
  .from('payment_references')
  .select('status')
  .eq('reference', ref)
  .single()

if (existing.data?.status === 'success') {
  return new Response('OK', { status: 200 })   // already processed
}
```

**Event handling — `charge.success`**
```ts
if (event.event === 'charge.success') {
  const { reference, customer, metadata } = event.data
  const { user_id, plan_id, kobo } = metadata   // written by us at init time

  // 1. Verify amount matches plan (defence-in-depth)
  if (PLANS[plan_id]?.kobo !== event.data.amount) {
    console.error('Amount mismatch', { plan_id, expected: PLANS[plan_id]?.kobo, got: event.data.amount })
    return new Response('Amount mismatch', { status: 422 })
  }

  const plan      = PLANS[plan_id]
  const now       = new Date()
  const expiresAt = plan.interval === 'annual'
    ? new Date(now.setFullYear(now.getFullYear() + 1))
    : new Date(now.setMonth(now.getMonth() + 1))

  // 2. Upsert subscription row (webhook is sole writer)
  await supabase.from('subscriptions').upsert({
    user_id,
    plan_id,
    status: 'active',
    current_period_start: new Date().toISOString(),
    current_period_end:   expiresAt.toISOString(),
    paystack_sub_code:    event.data.subscription_code ?? null,
    updated_at:           new Date().toISOString(),
  }, { onConflict: 'user_id' })

  // 3. Mark reference settled
  await supabase.from('payment_references').update({
    status: 'success',
    settled_at: new Date().toISOString(),
  }).eq('reference', reference)

  // 4. If team plan, create/update team seat count
  if (plan.seats > 1) {
    await ensureTeamForUser(supabase, user_id, plan)
  }
}
```

**Event handling — `subscription.disable` / `invoice.payment_failed`**
```ts
// Mark subscription inactive; entitlement logic already reads status column
await supabase.from('subscriptions').update({
  status: 'inactive',
  cancel_at: new Date().toISOString(),
}).eq('paystack_sub_code', event.data.subscription_code)
```

**Always return 200** (even on business logic errors) to prevent Paystack retries for non-transient failures. Log errors to console/Sentry, don't surface them to Paystack.

**Disable Next.js body parsing** (required for raw body HMAC)
```ts
export const config = { api: { bodyParser: false } }
// In App Router, use req.text() — body is already a stream, this is fine
```

**Review checklist**
- [ ] `timingSafeEqual` used for HMAC comparison (not `===`)
- [ ] Raw `req.text()` captured before any `JSON.parse`
- [ ] Idempotency check happens before any write
- [ ] `metadata.kobo` re-validated against `PLANS` server-side
- [ ] No client-provided price or plan leaks into subscription write
- [ ] Returns 200 on all handled events (Paystack retries on non-2xx)
- [ ] Webhook secret rotated separately from `PAYSTACK_SECRET_KEY` if Paystack supports it (it doesn't currently — same key)

---

## Step 2.5 — Team workspace: invites + member management ✅

**One-liner**
```
pnpm claude "Build team invite flow per BUILD-PLAN step 2.5 — invite API, accept page, member list UI; commit when done"
```

### What to build

**`app/api/teams/invite/route.ts`** — POST, auth-gated
- Verify caller owns a team plan subscription (`status: active`, `seats > 1`)
- Count existing `team_members` — reject if at seat limit
- Insert `team_invites { team_id, email, invited_by }` (token auto-generated by DB default)
- Send email via Supabase `auth.admin.inviteUserByEmail` or Resend with the accept link: `{APP_URL}/teams/accept?token=xxx`
- Return 201 `{ token }` (for dev preview in response)

**`app/teams/accept/page.tsx`** — server component
- Read `?token` from search params
- Query `team_invites` where `token = ? AND accepted_at IS NULL AND expires_at > now()`
- If expired/used → show error with "Request a new invite" CTA
- If user not signed in → redirect to `/login?next=/teams/accept?token=xxx`
- On valid token + signed-in user: call `/api/teams/accept` server action

**`app/api/teams/accept/route.ts`** — POST, auth-gated
- Validate token (same checks as above)
- Insert `team_members { team_id, user_id, role: 'member' }`
- Mark `team_invites.accepted_at = now()`
- Upsert `subscriptions` for the new member pointing at the team's plan (so entitlement passes)
- Redirect to `/dashboard` with toast "Welcome to the team!"

**`app/dashboard/team/page.tsx`** — team settings page (owner only)
- Member list: avatar, email, role badge, "Remove" button (owner can remove members)
- "Invite member" form: email input + send button → calls `/api/teams/invite`
- Seat usage indicator: "3 / 5 seats used"
- Link to billing page

**`app/api/teams/remove-member/route.ts`** — DELETE, auth-gated (owner only)
- Verify caller is team owner
- Delete from `team_members`
- Set that user's subscription `status = 'inactive'`

**Review checklist**
- [ ] Seat limit enforced server-side before inserting invite
- [ ] Token expiry checked server-side, not client-side
- [ ] New team member subscription written server-side (not self-granted)
- [ ] Removing a member immediately deactivates their subscription row

---

## Step 2.6 — Billing + subscription status pages ✅

**One-liner**
```
pnpm claude "Build /billing page per BUILD-PLAN step 2.6 — current plan, renewal date, invoice history, cancel flow; commit when done"
```

### What to build

**`app/billing/page.tsx`** — server component (SSR, no stale data)
```
┌─────────────────────────────────────────────────┐
│  Current plan                                    │
│  Solo Annual  ·  ₦15,000/year  ·  Renews Jan 22 │
│  [Upgrade]  [Cancel subscription]               │
├─────────────────────────────────────────────────┤
│  Payment history                                 │
│  Jan 22, 2025  ·  Solo Annual  ·  ₦15,000  ✓   │
│  ...                                             │
└─────────────────────────────────────────────────┘
```

**Data sources**
- `subscriptions` join `plans` — current plan, period end, status
- `payment_references` where `status = 'success'` — invoice history (no Paystack API call needed)

**Cancel flow** (soft cancel — access until period end)
- "Cancel subscription" → confirmation modal with period-end date
- On confirm → `POST /api/billing/cancel`
- Server action calls Paystack `DELETE /subscription/:code/disable` (for recurring) then sets `subscriptions.cancel_at = current_period_end` (does NOT set `status = inactive` — entitlement still passes until period end)
- Webhook `subscription.disable` fires later and sets `status = inactive`
- Page re-renders showing "Cancels on Jan 22, 2026" banner

**`app/api/billing/cancel/route.ts`**
- Auth-gate
- Fetch subscription for user
- Call Paystack disable if `paystack_sub_code` present
- Set `cancel_at` on subscription row
- Return 200

**`app/billing/upgrade/page.tsx`** (or modal on `/billing`)
- Show plan comparison (reuse pricing page components)
- CTA hits `/api/checkout` with new plan — Paystack handles proration (or explain no proration for first version)

**Review checklist**
- [ ] Billing page is server-rendered (no stale subscription data)
- [ ] Cancel sets `cancel_at`, NOT `status = inactive` (entitlement still works until period end)
- [ ] Payment history reads from `payment_references` (our table), not Paystack API
- [ ] Upgrade CTA reuses existing `/api/checkout` — no new payment logic

---

## Step 2.7 — Subscription status UI + nav integration ✅

**One-liner**
```
pnpm claude "Wire subscription status into nav/dashboard per BUILD-PLAN step 2.7 — upgrade nudge, active badge, expired banner; commit when done"
```

### What to build

**`hooks/use-subscription.ts`** (client hook, already stub from Phase 1 — fill it in)
```ts
// Reads from Supabase realtime or SWR poll
// Returns: { plan, status, periodEnd, isActive, isTeam, seatsUsed, seatsTotal }
```

**Upgrade nudge** — show in nav and dashboard if `status !== 'active'`
- Small pill: "Free plan · Upgrade →" linking to `/pricing`
- Downloads blocked by entitlement show inline gate: "Subscribe to download" + CTA

**Active badge** — in nav avatar dropdown: plan name + period end

**Expired banner** — full-width banner if `status === 'inactive'` and user had a prior subscription: "Your subscription expired on {date}. Renew to restore downloads."

**Review checklist**
- [ ] `isActive` derived from DB `status`, never from client payment state
- [ ] Nudge/banner dismissal is UI-only (sessionStorage) — DB is source of truth
- [ ] Realtime subscription on `subscriptions` table so banner hides immediately after webhook fires

---

## Step 2.8 — E2E smoke test + Paystack webhook simulation ✅

**One-liner**
```
pnpm claude "Write E2E payment smoke test per BUILD-PLAN step 2.8 using Paystack test keys + local webhook simulation; commit when done"
```

### What to build

**Manual smoke test checklist** (document in `docs/payment-testing.md`)
```
1. Set PAYSTACK_SECRET_KEY to test key (sk_test_...)
2. Go to /pricing → click Solo Monthly → complete with test card 4084084084084081
3. Paystack redirects to /checkout/callback
4. Forward webhook locally: npx paystack-webhook-forwarder (or use Paystack Dashboard → Simulate)
5. Check Supabase subscriptions table — status should be 'active'
6. Download a resource — should succeed
7. Go to /billing — plan + renewal date visible
8. Simulate subscription.disable webhook → status should flip to inactive
9. Download attempt → should be blocked
```

**Automated test `tests/webhook.test.ts`**
```ts
// Unit test the webhook handler with a real HMAC-signed payload
// Mock Supabase client
// Test: valid charge.success → subscription upserted
// Test: duplicate reference → 200 with no second write
// Test: invalid signature → 403
// Test: amount mismatch → 422
// Test: subscription.disable → status set inactive
```

**Review checklist**
- [ ] All four webhook unit tests pass
- [ ] Test card flow completes end-to-end in test mode before going live
- [ ] `PAYSTACK_SECRET_KEY` in `.env.local` is test key until prod deploy
- [ ] Vercel env vars set for both test (preview) and live (production) environments

---

## Env var summary for Phase 2

```bash
# .env.local (never commit)
PAYSTACK_SECRET_KEY=sk_test_...          # test; swap to sk_live_ in Vercel prod
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...  # safe to expose
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Vercel production
PAYSTACK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=https://joincreatly.com
```

**Paystack Dashboard setup**
- Webhook URL: `https://joincreatly.com/api/webhooks/paystack`
- Events to subscribe: `charge.success`, `subscription.disable`, `invoice.payment_failed`, `invoice.create`
- No IP allowlist needed (Paystack doesn't publish stable IPs) — HMAC is the guard

---

## Commit discipline (same as Phase 1)

Each step gets exactly one commit:
```
feat(payments): step 2.1 — pricing constants + DB schema
feat(payments): step 2.2 — /pricing page
feat(payments): step 2.3 — checkout server action + Paystack init
feat(payments): step 2.4 — webhook handler (idempotent, HMAC-verified)
feat(payments): step 2.5 — team invites + member management
feat(payments): step 2.6 — /billing page + cancel flow
feat(payments): step 2.7 — subscription status UI + nav wiring
feat(payments): step 2.8 — E2E smoke test + webhook unit tests
```

Run `/clear` in Claude Code between steps. Review before committing. Money is in kobo.

PHASE 3 — User Dashboard ✅


⚙️ AUTONOMOUS RUN MODE — Phase 3 only

Overrides the global "one step then STOP" rule for this phase only. Execute every step in order (3.1 → 3.8), build + self-review against acceptance criteria + one clean commit + /clear between steps, without stopping for prompts.

Log blockers to BLOCKERS.md and continue. STOP at end of Phase 3.

🔶 No checkpoints in Phase 3 — all steps are functional, not design-led decisions. Run straight through.

Guardrails: reuse existing components/patterns; never weaken 1.8 download guarantees; TS strict no any; Zod-validate inputs; server components by default; 'use client' only where interactivity demands it; all data fetched server-side where possible (no stale client state for sensitive data).



Phase context: The dashboard is the logged-in user's home base — downloads, profile, account, notifications. The creator studio (/creator/*) already exists from Phase 1.10; do NOT duplicate or merge it here. The dashboard is for consumers (and creators who want to manage their account/subscription). Reuse ResourceCard, ResourceGrid, brand tokens, motion primitives throughout.


3.1 — Dashboard layout + shell ✅

Scope:


app/(app)/dashboard/layout.tsx — persistent shell layout for all /dashboard/* routes:

Sidebar (desktop): Creatly logo mark, nav links (Overview, Downloads, Favourites, Profile, Account, Notifications), upgrade nudge at bottom if free plan, user avatar + name.
Top bar (mobile): hamburger → slide-in drawer with same nav links.
Active link highlighted in terracotta.
Sidebar collapses to icon-only at medium breakpoints (tooltips on hover).
Auth-gated: middleware already covers /dashboard/* — layout just reads the session.



app/(app)/dashboard/page.tsx — redirect to /dashboard/overview (the real home tab is 3.2).
Reuse SiteHeader is NOT shown inside dashboard — the sidebar IS the nav for dashboard routes. Ensure the app layout doesn't double-render the site header inside /dashboard/*.


Acceptance criteria:


/dashboard/* routes all show the persistent sidebar/drawer shell.
Active link highlighted; mobile drawer works and closes on navigation.
Site header not shown inside dashboard (no double nav).
Auth gate works — unauthenticated → /login?next=/dashboard.
pnpm typecheck + pnpm lint pass.
Commit: feat(dashboard): add persistent dashboard shell layout.



3.2 — Dashboard overview (home tab) ✅

Scope:
app/(app)/dashboard/overview/page.tsx — server component:


Welcome header: "Good [morning/afternoon/evening], [display_name]." (time-based greeting, display_name from profile).
Subscription status card: current plan (or "Free plan"), renewal date, usage. CTA: "Upgrade" → /pricing if free; "Manage" → /billing if subscribed. Reuse UpgradeNudge component.
Recent downloads: last 4 downloads from downloads table (own rows, RLS), rendered as small ResourceCards. "View all" → /dashboard/downloads.
Saved favourites teaser: last 4 favourites. "View all" → /dashboard/favourites.
Quick actions: Browse resources, Upload (if creator role → /creator), Manage subscription.
Loading skeletons for each section.


Acceptance criteria:


Time-based greeting with real display_name.
Subscription card shows real status from use-subscription hook or server fetch.
Recent downloads + favourites show real data, newest first, max 4 each.
Empty states for each section (no downloads yet, no favourites yet).
All links route correctly; skeletons show during load.
Commit: feat(dashboard): overview page with greeting, subscription, recent activity.



3.3 — Downloads history ✅

Scope:
app/(app)/dashboard/downloads/page.tsx — server component:


Fetch user's downloads joined with resources (title, preview_image_path, category, file_type, creator name), newest first, paginated (12/page, ?page= URL param).
Render as a list (not grid — downloads are a record, not a browse experience): each row shows thumbnail, title, category, download date, file type badge, and a Re-download button.
Re-download button: POST to existing /api/downloads/[resourceId] — reuses the full entitlement check + signed URL flow from 1.8. If still entitled → downloads again; if not (subscription lapsed) → shows subscribe prompt.
Empty state: "No downloads yet — browse the library."
Pagination with ?page= URL param.


Acceptance criteria:


Downloads list shows real data, newest first, paginated.
Re-download triggers the real 1.8 flow (entitlement check → signed URL → browser download).
Empty state and pagination work.
Commit: feat(dashboard): downloads history with re-download.



3.4 — Profile page ✅

Scope:
app/(app)/dashboard/profile/page.tsx — client component (form):


Edit profile: display_name, bio (optional), avatar upload (to avatars bucket).
Avatar upload: drag-drop or click, preview before save, upload to Supabase Storage avatars/{user_id}, update profiles.avatar_url.
Read-only: email (shown, not editable — email change is account settings), member since date.
Save via server action — validate with Zod, update profiles row (user-scoped client is fine here — RLS allows own-row update for non-role fields).
Success toast on save; inline validation.


Acceptance criteria:


Display_name + bio editable and saved to DB.
Avatar upload works — image previewed, uploaded to storage, URL saved to profile.
Email shown read-only; member since shown.
Zod validation; success toast; error handling.
Commit: feat(dashboard): profile editor with avatar upload.



3.5 — Account settings ✅

Scope:
app/(app)/dashboard/account/page.tsx:


Change password: current password + new password + confirm (RHF + Zod). Server action calls supabase.auth.updateUser({ password }). Success → toast + sign out (force re-login with new password).
Email address: show current, "Change email" button → inline form → supabase.auth.updateUser({ email }) → "Verification sent to new email."
Danger zone: "Delete account" — confirmation modal with typed confirmation (type "DELETE" to confirm). Server action: delete profile data then supabase.auth.admin.deleteUser(userId) (admin client, identity already verified). Redirect to / on success.
Connected accounts: placeholder section for future OAuth (Google, etc.) — show "Coming soon" if no OAuth configured.


Acceptance criteria:


Password change works; re-login required after.
Email change sends verification to new address.
Account deletion works with typed confirmation; user data removed; redirected to /.
Danger zone is visually distinct (red border/section).
Commit: feat(dashboard): account settings — password, email, delete account.


Watch for: delete account uses admin client — requires getAuthenticatedUser() + typed confirmation before admin call; never trust client for this.


3.6 — Notifications ✅

Scope:
app/(app)/dashboard/notifications/page.tsx — server component:


Fetch user's notifications (own rows, RLS), newest first, paginated.
Render as a list: icon (by type), title, body, timestamp (relative, e.g. "2 hours ago"), unread indicator (bold/dot).
Mark as read: clicking a notification marks it read (notifications.read_at = now()). "Mark all read" button.
Empty state: "You're all caught up."
Unread count badge on the sidebar nav link (read from a count query server-side).


Acceptance criteria:


Notifications list shows real data, newest first.
Mark read / mark all read work (server action, own-rows RLS).
Unread badge on sidebar link reflects real count.
Empty state works.
Commit: feat(dashboard): notifications list with mark-read.



3.7 — Notification preferences ✅

Scope:
app/(app)/dashboard/notifications/preferences/page.tsx — client component:


Read notification_preferences row for the user.
Toggles for each preference (from the schema — e.g. new_resources, download_receipts, marketing, digest_frequency).
Save via server action — upsert notification_preferences row.
Link from notifications page: "Manage preferences →".


Acceptance criteria:


Preferences load from DB and save correctly.
Toggles reflect real DB state on load.
Save shows success toast.
Commit: feat(dashboard): notification preferences.



3.8 — Help & support ✅

Scope:
app/(app)/dashboard/help/page.tsx:


FAQ accordion: 6-8 common questions (subscription, downloads, licensing, creator signup, refunds, contact). On-brand accordion component (reuse from pricing page if exists, or build one).
Contact support: a simple form — subject (dropdown: Billing, Downloads, Technical, Other), message textarea. On submit: send via Resend to support@joincreatly.com (or hello@joincreatly.com from config). Server action, Zod-validated, rate-limited (simple: one submission per user per 10 min using a timestamp in the session/cookie).
Quick links: link to /pricing, /billing, email hello@joincreatly.com.


Acceptance criteria:


FAQ accordion works, on-brand.
Contact form sends email via Resend to the support address from config; success toast shown; Zod-validated.
Quick links correct.
Basic rate limiting on form submission.
Commit: feat(dashboard): help page with FAQ and contact form.

PHASE 4 — Admin Seed Tool ⬜


⚙️ AUTONOMOUS RUN MODE — Phase 4 only

Overrides the global "one step then STOP" rule for this phase only. Execute every step in order (4.1 → 4.6), build + self-review against acceptance criteria + one clean commit + /clear between steps, without stopping for prompts.

Log blockers to BLOCKERS.md and continue. STOP at end of Phase 4.

Guardrails: admin routes are ALWAYS double-gated — middleware AND server-side role check on every route/action. Never trust the client for role. All file uploads server-validated (type + size). Reuse existing catalogue components. TS strict, no any. Money in kobo.



Phase context: The admin tool lets the Creatly team seed and manage the catalogue — creators, categories, resources — and view basic analytics. The creator upload flow (Phase 1.10) handles creator-submitted assets; this phase handles internal/admin content management. The existing /admin/review queue (1.10.5) already exists — do not duplicate it, link to it from the admin nav.


4.1 — Admin route group + role guard ✅

Scope:


Confirm /admin/* is already gated in middleware (it should be from 1.3 — verify). If only auth-gated (not role-gated), add role check: profiles.role = 'admin' required, otherwise redirect to /dashboard.
app/(admin)/layout.tsx — admin shell layout:

Sidebar: Creatly logo mark + "Admin" badge, nav links (Overview, Creators, Categories, Resources, Review Queue → links to existing /admin/review, Analytics).
Dark forest sidebar (#14342B), cream text, terracotta active link.
No SiteHeader inside admin routes.
Server-side role check in layout (getAuthenticatedUser() → verify role === 'admin' → redirect if not).



app/(admin)/admin/page.tsx → redirect to /admin/overview.
Document in BLOCKERS.md: first admin must be set manually via SQL:


sql   update public.profiles set role = 'admin' where email = 'olakunle.management@gmail.com';

Acceptance criteria:


/admin/* requires both auth AND admin role — non-admins redirected to /dashboard.
Admin shell renders with sidebar, active link highlighting.
No SiteHeader inside admin.
First-admin SQL documented in BLOCKERS.md.
Commit: feat(admin): admin route group + role guard + shell layout.



4.2 — Creator CRUD ✅

Scope:
app/(admin)/admin/creators/ — manage the creators table (the catalogue creator entity, not creator_profiles):


List page (page.tsx): table of all creators — name, slug, avatar, resource count, is_public, created_at. Search by name. Paginated.
Create page (new/page.tsx): form — name, slug (auto-generated from name, editable), bio, avatar upload (creator-avatars bucket), is_public toggle. Server action: validate (Zod), insert creators row, upload avatar.
Edit page ([id]/edit/page.tsx): same form pre-populated. Server action: update row.
Delete: soft-delete via is_public = false (don't hard-delete — resources reference creators). Confirm modal.
All writes: admin client after server-side role check.


Acceptance criteria:


Creator list shows all creators with resource count.
Create/edit/delete (soft) all work server-side with role check.
Avatar uploads to creator-avatars bucket.
Slug auto-generated but editable; unique constraint enforced.
Commit: feat(admin): creator CRUD.



4.3 — Category management ✅

Scope:
app/(admin)/admin/categories/:


List page: table — name, slug, description, is_active, resource count, sort order. Drag-to-reorder (or up/down arrows for simplicity — prefer arrows, no heavy DnD dep).
Create/edit: name, slug (auto from name), description, is_active toggle, sort_order. Server action: validate + upsert.
Deactivate: toggle is_active — deactivated categories hidden from public browse. Confirm if category has resources.


Acceptance criteria:


Category list with resource counts.
Create/edit/deactivate work server-side.
Sort order adjustable via up/down arrows.
Deactivation hides from public browse (existing RLS/filter already handles is_active — verify).
Commit: feat(admin): category management.



4.4 — Resource upload (admin) ✅

Scope:
app/(admin)/admin/resources/new/page.tsx — multi-step admin resource upload (similar to creator upload from 1.10.4 but with admin privileges — can set any creator, any status):

Step 1 — Files:


Source file upload → private resource-files/{resource_id}/ path. Server-validates type + size.
Preview image(s) upload → public resource-previews/{resource_id}/. Multiple allowed; admin picks primary.


Step 2 — Details:


Title, description, slug (auto from title, editable, unique).
Category (dropdown from categories table).
Creator (dropdown from creators table).
Tags (comma-separated input → stored as array).
File type (auto-detected from upload, editable).
Compatible software (multi-select chips: Figma, Canva, Adobe Illustrator, After Effects, PowerPoint, Other).
License type (Standard / Extended).
File size (auto-populated from upload).
is_featured toggle.


Step 3 — Review + publish:


Preview exactly as it appears on catalogue + detail page (reuse components).
Status selector: Draft / Published (admin can publish directly — sets review_status='approved', status='published').
Submit → server action: validate all fields (Zod), insert resources row, set creator_id from selected creator (server-side, never client), set review_status='approved' and status='published' if published.


Acceptance criteria:


Files upload to correct private/public buckets with namespaced paths.
All metadata fields save correctly; slug unique-checked.
creator_id set server-side from admin selection — never from client.
Published resources immediately appear in catalogue.
Preview step matches real catalogue/detail rendering.
Commit: feat(admin): resource upload with file + preview + metadata.



4.5 — Resource management ✅

Scope:
app/(admin)/admin/resources/:


List page: table — preview thumbnail, title, creator, category, status, review_status, is_featured, download_count, created_at. Filters: status, category, creator, featured. Search by title. Paginated (20/page).
Edit page ([id]/edit/page.tsx): same form as 4.4 Step 2, pre-populated. Can change status, creator, category, featured, tags, etc.
Quick actions (inline in table):

Toggle is_featured (star icon).
Toggle status published/draft.
Delete (soft: set status='archived'; confirm modal).



Link to review queue: "Pending Review (N)" link → existing /admin/review.


Acceptance criteria:


Resource list with filters + search + pagination.
Edit works for all fields; changes reflect immediately in catalogue.
Featured toggle, status toggle, soft-delete all work server-side.
Link to existing review queue present.
Commit: feat(admin): resource management list + edit + quick actions.



4.6 — Analytics ✅

Scope:
app/(admin)/admin/analytics/page.tsx — simple server-rendered analytics dashboard (no external analytics service — reads from our own DB):

Metrics (all from DB, server-side):


Total resources (published), total creators, total users, total downloads (all time).
New users this month (count from auth.users or profiles.created_at).
Downloads this month vs last month (from downloads table).
Top 10 most downloaded resources (join resources + count downloads).
Top 5 categories by download count.
Subscription breakdown: free vs active subscribers (from subscriptions table).


Presentation:


Stat cards at top (4 key numbers).
Two simple tables: top resources + top categories.
Subscription breakdown as a simple visual (CSS bar or just numbers — no heavy charting library unless recharts is already installed).
All server-rendered, no real-time updates needed (refresh to update).
Date range: default "This month" with a simple month picker (prev/next month via URL param ?month=YYYY-MM).


Acceptance criteria:


All 6 metric types show real data from DB.
Top resources + top categories tables correct.
Subscription breakdown accurate.
Month navigation works via URL param.
No heavy new dependencies — recharts if already installed, otherwise CSS/tables.
Commit: feat(admin): analytics dashboard.



PHASE 5 — Creator Earnings & Payouts ✅


⚙️ AUTONOMOUS RUN MODE — Phase 5 only

Overrides the global "one step then STOP" rule for this phase only. Execute every step in order (5.1 → 5.5), build + self-review against acceptance criteria + one clean commit + /clear between steps, without stopping for prompts.

Log blockers to BLOCKERS.md and continue. STOP at end of Phase 5.

Guardrails: all money in integer kobo. Never float. Earnings calculations are server-side only — never trust client. Paystack Transfer API is the only writer of payout state. Admin client used only after getAuthenticatedUser() + role check. TS strict, no any. Zod-validate all inputs.



Payout model (locked):


70% to creators, 30% to platform per subscription revenue period
Revenue pool = total subscription revenue collected in a period
Each creator's share = (their download count / total downloads in period) × 70% of revenue pool
Calculated monthly, stored in integer kobo
Paid out via Paystack Transfer API (automated)
Minimum payout threshold: ₦5,000 (500000 kobo) — creators below threshold carry over to next month



5.1 — Earnings data model (migration) ✅

Scope:
New timestamped migration:

sql-- Creator bank accounts (for Paystack transfers)
create table public.creator_bank_accounts (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid not null references auth.users on delete cascade,
  bank_code     text not null,        -- Paystack bank code
  account_number text not null,
  account_name  text not null,        -- verified account name from Paystack
  bank_name     text not null,
  is_default    boolean not null default true,
  verified_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (creator_id, account_number, bank_code)
);

-- Monthly earnings snapshots (computed, append-only)
create table public.creator_earnings (
  id              uuid primary key default gen_random_uuid(),
  creator_id      uuid not null references auth.users,
  period_month    text not null,       -- 'YYYY-MM'
  download_count  integer not null default 0,
  total_downloads integer not null default 0,  -- platform total for that month
  revenue_pool_kobo integer not null default 0, -- 70% of platform revenue for month
  earnings_kobo   integer not null default 0,   -- creator's share (kobo)
  status          text not null default 'pending'
                  check (status in ('pending','paid','carried_over')),
  created_at      timestamptz not null default now(),
  unique (creator_id, period_month)
);

-- Payout records (Paystack Transfer API — append-only)
create table public.creator_payouts (
  id                  uuid primary key default gen_random_uuid(),
  creator_id          uuid not null references auth.users,
  bank_account_id     uuid not null references public.creator_bank_accounts,
  amount_kobo         integer not null check (amount_kobo > 0),
  paystack_transfer_code text,         -- from Paystack Transfer API response
  paystack_recipient_code text,        -- Paystack transfer recipient
  status              text not null default 'pending'
                      check (status in ('pending','success','failed','reversed')),
  period_months       text[] not null,  -- which earning periods this covers
  initiated_at        timestamptz not null default now(),
  settled_at          timestamptz,
  failure_reason      text
);

-- RLS:
-- creator_bank_accounts: owner read/write own; admin all
-- creator_earnings: owner read own; admin all; no client insert/update (server only)
-- creator_payouts: owner read own; admin all; no client insert (server only)
alter table public.creator_bank_accounts enable row level security;
alter table public.creator_earnings enable row level security;
alter table public.creator_payouts enable row level security;

create policy "owner" on public.creator_bank_accounts
  for all using (auth.uid() = creator_id);
create policy "admin" on public.creator_bank_accounts
  for all using (public.is_admin());

create policy "owner_read" on public.creator_earnings
  for select using (auth.uid() = creator_id);
create policy "admin" on public.creator_earnings
  for all using (public.is_admin());

create policy "owner_read" on public.creator_payouts
  for select using (auth.uid() = creator_id);
create policy "admin" on public.creator_payouts
  for all using (public.is_admin());

Acceptance criteria:


Migration applies cleanly to remote.
All 3 tables exist with correct constraints.
RLS: creators read own rows only; no client writes to earnings/payouts.
Types regenerated; pnpm typecheck pass.
Commit: feat(earnings): creator earnings + payouts + bank accounts migration.



5.2 — Bank account setup (creator) ✅

Scope:
app/(creator)/creator/payouts/bank-account/page.tsx:


Verify account via Paystack before saving:

Form: bank name (dropdown from Paystack /bank endpoint — Nigerian banks list), account number (10 digits).
On submit: call server action → POST https://api.paystack.co/bank/resolve?account_number=xxx&bank_code=xxx → returns account_name.
Show verified account name to creator for confirmation ("Is this you? Adewale Okafor — GTBank").
On confirm → insert creator_bank_accounts row with verified details.



Show existing bank account if set; allow replacing it.
Server action: PAYSTACK_SECRET_KEY server-side only; Zod-validate inputs; ownership-checked.


Acceptance criteria:


Bank account verification calls real Paystack resolve endpoint.
Account name shown for confirmation before saving.
Saved account appears on the page; can be updated.
Server-side only; creator cannot set another creator's bank account.
Commit: feat(earnings): creator bank account setup with Paystack verification.



5.3 — Earnings calculation (server job) ✅

Scope:


lib/earnings.ts — earnings calculation logic:


ts   // calculateMonthlyEarnings(month: string) → void
   // 1. Sum subscription revenue collected in the month from payment_references
   //    (status='success', settled_at in month range) → revenue_pool_kobo
   // 2. Apply 70% creator share: creator_pool = revenue_pool * 0.70 (integer kobo)
   // 3. Count total downloads in the month from downloads table
   // 4. For each creator with downloads that month:
   //    - Count their downloads
   //    - earnings = (their_downloads / total_downloads) * creator_pool
   //    - Round down to nearest kobo (Math.floor)
   // 5. Upsert creator_earnings rows (server only, admin client)
   // 6. Carry over pending earnings < 500000 kobo from previous months


app/api/admin/calculate-earnings/route.ts — POST, admin-only:

Accepts { month: 'YYYY-MM' } (Zod-validated).
Calls calculateMonthlyEarnings(month).
Returns summary: total creators paid, total kobo distributed, platform share.
Idempotent: re-running for the same month updates existing rows (upsert).



Admin UI (/admin/earnings):

Month picker, "Calculate earnings" button → calls the endpoint.
Table: creator name, download count, earnings (kobo formatted as ₦), status.
"Process payouts" button → triggers 5.4.





Key rules:


All arithmetic in integer kobo. Never float. Use Math.floor for division results.
Platform keeps the remainder from rounding (never shortchange creators).
Calculation is idempotent — safe to re-run.


Acceptance criteria:


calculateMonthlyEarnings correctly splits 70/30 in integer kobo.
Per-creator share calculated proportionally from download counts.
Minimum threshold (500000 kobo) enforced — below threshold → carried_over.
Admin endpoint is admin-only, idempotent, Zod-validated.
Admin UI shows earnings table + calculate button.
Commit: feat(earnings): monthly earnings calculation + admin UI.



5.4 — Paystack Transfer API (automated payouts) ✅

Scope:

lib/payouts.ts — payout execution:

ts// processPayouts(month: string) → PayoutSummary
// For each creator_earnings row where status='pending' AND earnings_kobo >= 500000:
// 1. Get creator's default bank account
// 2. If no bank account → skip, log warning
// 3. Create Paystack transfer recipient (POST /transferrecipient):
//    { type: 'nuban', name, account_number, bank_code, currency: 'NGN' }
//    → returns recipient_code
// 4. Initiate transfer (POST /transfer):
//    { source: 'balance', amount: earnings_kobo, recipient: recipient_code,
//      reason: `Creatly earnings ${month}`, reference: uuid }
//    → returns transfer_code, status
// 5. Insert creator_payouts row
// 6. Update creator_earnings status → 'paid'
// Return summary: { processed, skipped, total_kobo }

app/api/admin/process-payouts/route.ts — POST, admin-only:


Accepts { month: 'YYYY-MM' }.
Calls processPayouts(month).
Returns summary.
Idempotent: skip already-paid earnings.


Paystack Transfer webhook — add to existing webhook handler (app/api/webhooks/paystack/route.ts):

ts// transfer.success → update creator_payouts status='success', settled_at=now()
// transfer.failed → update status='failed', failure_reason
// transfer.reversed → update status='reversed'

Env vars needed:

PAYSTACK_SECRET_KEY=  # already exists
# Paystack transfers require the secret key — no new vars needed
# BUT: Paystack transfer feature must be enabled on the account
# Log in BLOCKERS.md: enable transfers in Paystack Dashboard → Settings → Transfers

Acceptance criteria:


processPayouts creates real Paystack transfer recipients and initiates transfers.
creator_payouts row inserted before transfer initiated (idempotency).
Webhook handler updates payout status on transfer.success/failed/reversed.
Already-paid earnings are skipped (idempotent).
Creators without bank accounts are skipped with a logged warning.
Admin endpoint is admin-only; all money in kobo.
Commit: feat(earnings): Paystack Transfer API automated payouts.


Watch for: Paystack Transfers must be enabled on the account (separate from regular payments). Log this in BLOCKERS.md as a founder action.


5.5 — Creator earnings dashboard ✅ (design-led)

Scope:
app/(creator)/creator/earnings/page.tsx — creator's earnings overview:


Summary cards:

Total earnings all time (sum of paid creator_earnings)
This month's earnings (current period, pending)
Pending payout (sum of carried_over + current pending above threshold)
Total downloads all time



Earnings history table:

Month, download count, earnings (₦), status badge (Pending/Paid/Carried over), payout date if paid.
Paginated, newest first.



Bank account section:

Shows current bank account (name, bank, masked account number).
"Update bank account" → /creator/payouts/bank-account.
Warning if no bank account set: "Add a bank account to receive payouts."



Payout schedule info:

"Payouts are processed on the 1st of each month for the previous month's earnings."
"Minimum payout: ₦5,000. Earnings below this carry over to the next month."



Add to creator navbar: "Earnings" link → /creator/earnings.


Acceptance criteria:


All summary cards show real data from creator_earnings + creator_payouts.
Earnings history table correct, paginated.
Bank account section shows current account or prompts to add one.
Payout schedule info displayed.
Earnings link in creator navbar.
On-brand, mobile-first, Creatly design tokens.
Commit: feat(earnings): creator earnings dashboard.



BLOCKERS for Phase 5 (log in BLOCKERS.md)


Enable Paystack Transfers: Paystack Dashboard → Settings → Transfers → Enable
Paystack transfer feature requires a verified business account with sufficient balance
First earnings calculation must be run manually by admin via /admin/earnings
Payout processing is manual (admin-triggered) for now — automated scheduling (cron) is a future enhancement

---

CORRECTION PASS 1 ✅


⚙️ AUTONOMOUS RUN MODE

Execute every item in order. Build + self-review + one commit per item + /clear between items. Log blockers to BLOCKERS.md. STOP at end of this pass.

After completing ALL items, output a checklist of every item with ✅ done or ❌ blocked + reason.




CP1.1 — Admin role selector: show roles list ✅

The role dropdown on /admin/team invite form is not showing the seeded roles.

Fix:


Query admin_roles table server-side in the /admin/team page and pass roles as props to the invite form client component
Confirm the native <select> renders all non-super_admin roles with label + description
Verify admin_roles table has data: select * from public.admin_roles; — if empty, re-run the seed inserts from the RBAC migration
Test: open invite form → dropdown shows Content Admin, Creator Admin, Support Admin, Finance Admin, Analytics Admin


Commit: fix(admin): seed admin_roles + pass roles to invite form select


CP1.2 — Update pricing plans ✅

New pricing (all in integer kobo):

tsexport const PLANS = {
  monthly:       { id: 'monthly',       kobo: 1000000,  label: 'Monthly',       description: 'Unlimited downloads for 1 month',   duration: '1 month'  },
  quarterly:     { id: 'quarterly',     kobo: 2700000,  label: '3 Months',      description: 'Unlimited downloads for 3 months',  duration: '3 months', savings: 'Save ₦3,000' },
  biannual:      { id: 'biannual',      kobo: 5000000,  label: '6 Months',      description: 'Unlimited downloads for 6 months',  duration: '6 months', savings: 'Save ₦10,000' },
  annual:        { id: 'annual',        kobo: 10000000, label: 'Annual',         description: 'Unlimited downloads for 1 year',    duration: '1 year',   savings: 'Save ₦20,000', featured: true },
} as const


New migration to update plans table (deactivate old Cruise plans, insert new ones)
Update /pricing page: 4 cards, annual highlighted, savings badges shown on 3/6/12 month plans
Update landing page pricing teaser
Update /billing page to reference new plan IDs
Update use-subscription hook


Commit: feat(pricing): update to 4-tier pricing — 10k/27k/50k/100k


CP1.3 — Pricing page redesign ✅

Current pricing page feels bland. Redesign with energy and colour, referencing Envato Elements pricing page style.

Design direction:


Hero section: bold headline "Choose your plan", mono eyebrow, terracotta accent
Plan cards: larger, more visual — featured (Annual) card is notably bigger with a forest green background + cream text + terracotta "Most Popular" badge
Savings badges: prominent, coloured (terracotta pill)
Feature list per plan: checkmarks in forest green, clear hierarchy
A comparison table below cards (what's included in all plans)
FAQ accordion at bottom
Animated reveal on scroll (existing motion primitives)
Mobile: cards stack, featured card first


Commit: feat(pricing): redesign pricing page with bold editorial layout


CP1.4 — Categories rebuild (Envato Elements reference) ✅

Reference: https://elements.envato.com/ for category layout and presentation.

What to build:


Browse page categories section: large visual tiles (not just text pills) — each category has a representative icon/illustration, name, and asset count
Category tiles arranged in a responsive grid (2 cols mobile, 3-4 desktop)
Hover: lift + terracotta accent border
Each tile links to /browse?category=[slug]
Pull from the real categories table (level 1 only for the main grid)
Replace the current pill-style category row with this tile grid on the browse page and landing page category section
Keep the sidebar filter tree for active browse filtering (that's separate)


Commit: feat(browse): visual category tiles à la Envato Elements


CP1.5 — Dashboard footer (users + creators) ✅

Add a minimal footer to dashboard and creator studio pages.

Dashboard footer (components/dashboard/DashboardFooter.tsx):


Slim, cream background, bottom of every /dashboard/* page
Content: "© 2025 Creatly · joincreatly.com" | Links: Help, Privacy Policy, Terms | Support email from config
Add to DashboardShell layout below main content


Creator footer (components/nav/CreatorFooter.tsx):


Same slim style, forest background, cream text
Content: "© 2025 Creatly · joincreatly.com" | Links: Marketplace, Help, Terms
Add to creator layout below main content


Commit: feat(layout): add footer to dashboard and creator studio


CP1.6 — Remove all placeholder/dummy data ✅

Audit and remove all hardcoded placeholder numbers and dummy content across the app.

Specific locations to fix:


Admin overview cards: replace any hardcoded numbers (e.g. "1,234 users", "89% growth") with real DB queries or "—" if no data
Analytics page: replace placeholder chart data with real queries or empty states
Creator earnings overview: replace "₦0" placeholders with real data or "No earnings yet"
Any Math.random() or hardcoded stat in any component
Landing page stats strip: if numbers are fake (e.g. "125M+ customers" from Bethmor), replace with real counts from DB or remove entirely
Replace any Lorem Ipsum text anywhere in the app


Commit: fix(data): remove all placeholder numbers and dummy content


CP1.7 — Admin overview page complete overhaul ✅

Current issues: shows creator data instead of user data, cards not linked, missing key metrics.

Rebuild /admin/overview as a proper admin command centre:

Stats cards row 1 (all real DB queries, all linked):


Total Users (consumers only, role='user') → links to /admin/users
Total Creators (role='creator') → links to /admin/creators
Active Subscribers (subscriptions.status='active') → links to /admin/subscriptions
Inactive/Free Users (no active subscription) → links to /admin/users?filter=free


Stats cards row 2:


Total Resources Published → links to /admin/resources
Pending Review (review_status='submitted') → links to /admin/review
Total Downloads (all time) → links to /admin/analytics
Total Revenue (sum of payment_references.kobo where status='success') → links to /admin/earnings


Recent activity section:


Last 5 signups (name, email, date, role)
Last 5 downloads (resource, user, date)
Last 5 payments (user, plan, amount, date)


All cards linked to their respective pages.

Commit: feat(admin): complete overview overhaul with real data and linked cards


CP1.8 — Admin users list page ✅

New page: /admin/users — list of ALL users (not just creators):

Table columns: Avatar, Name, Email, Role badge (user/creator/admin), Plan (active plan name or "Free"), Downloads count, Joined date, Status (active/inactive)

Filters:


By role: All, Consumers, Creators, Admins
By subscription: All, Subscribed, Free
Search by name or email


Sort options: Date joined (newest/oldest), Downloads (highest/lowest), Name (A-Z/Z-A)

Each row actions: View profile, View downloads, Deactivate account (super_admin only — see CP1.12)

Commit: feat(admin): users list page with filters, sort, and subscription status


CP1.9 — Admin creators list improvements ✅

Fix the existing /admin/creators page:


Fetch real creator details — join creator_profiles + profiles + download counts + earnings
Table columns: Avatar, Display name, Handle, Email (from profiles), Total uploads, Total downloads, Total earnings (kobo → ₦), Status badge, Joined date
Contact details on edit page — add email (read-only, from profiles), phone (from profiles if set)
Filters (right side of search bar):

Sort by: Highest downloads, Highest earnings, Date joined (newest/oldest), A-Z name
Filter by: Status (approved/suspended), Has uploads, No uploads



Search by name or handle (existing)


Commit: feat(admin): creators list with real data, contact details, earnings, and sort/filter


CP1.10 — Admin subscriptions page ✅

New page: /admin/subscriptions — all subscription records:

Table: User name/email, Plan, Status badge (active/inactive/cancelled), Start date, End/renewal date, Amount paid (₦), Paystack reference

Filters: By status, By plan, Date range

Summary cards at top: Active, Inactive, Cancelled, Total revenue this month

Commit: feat(admin): subscriptions management page


CP1.11 — Fix "Mark as featured" forbidden error ✅

Admin is getting a 403 when trying to toggle is_featured on resources.

Fix:


In the resource management server action that updates is_featured, check hasPermission(userId, 'resources.write') — currently may be checking the wrong permission or the admin_team row isn't being found
Add debug: log the permission check result server-side
Ensure the logged-in admin has resources.write permission (Content Admin or super_admin role)
Test: toggle featured on a resource → should save without forbidden error


Commit: fix(admin): resolve forbidden error on mark-as-featured


CP1.12 — Deactivate account: super_admin only ✅

Account deactivation (both user and creator accounts) must be restricted to super_admin only.

Fix:


In any "Deactivate account" or "Delete user" server action in admin pages, replace hasPermission(userId, 'users.write') with a super_admin-only check
UI: hide the deactivate button for non-super_admin admins (don't just disable — hide it)
Show a "Deactivate" option in the users list (CP1.8) only for super_admin
Deactivation sets profiles.role='user' and subscriptions.status='inactive' — does NOT delete the account (that's a separate nuclear option)


Commit: fix(admin): restrict account deactivation to super_admin only


CP1.13 — Fix /creator routing ✅

joincreatly.com/creator is redirecting to / instead of the creator dashboard.

Fix:


app/(creator)/creator/page.tsx should redirect to /creator/home (the creator dashboard home)
Any URL starting with /creator/* should stay in the creator route group — verify middleware isn't redirecting /creator to /
/creators (with s) = public marketing page — unaffected
/creator (no s) = creator studio — must route to /creator/home
Test all creator routes: /creator, /creator/home, /creator/assets, /creator/upload, /creator/earnings


Commit: fix(creator): /creator routes to /creator/home not /


CP1.14 — Google OAuth signup ✅

Add "Continue with Google" to signup and login pages.

Scope:


Enable Google provider in Supabase Dashboard → Authentication → Providers → Google (founder action — log in BLOCKERS.md with exact steps: create OAuth credentials in Google Cloud Console, add client ID + secret to Supabase)
Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to env schema (optional — Supabase handles OAuth, just needs the provider enabled)
Add Google OAuth button to:

/signup page (consumer): "Continue with Google" above the form divider
/login page: "Continue with Google"
/creator/signup page: "Continue with Google"
/creator/login page: "Continue with Google"



Server action: supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: NEXT_PUBLIC_APP_URL + '/auth/callback' } })
After OAuth callback: check if user is new → route to /onboarding; returning user → /browse or /creator/home based on role
Style: white button, Google logo (SVG), "Continue with Google" text — on-brand, not the default blue Google button


BLOCKER: Requires Google Cloud Console OAuth setup + Supabase provider config. Log exact steps in BLOCKERS.md.

Commit: feat(auth): Google OAuth signup and login


CP1.15 — Fix download/upload storage cap ✅

Fix:


In all upload flows (creator upload, admin resource upload), remove or raise the file size validation cap
Set to 5GB (5_368_709_120 bytes) or read from env var MAX_UPLOAD_SIZE_BYTES (default 5GB)
Update both client-side validation (error message shown to user) and server-side validation (Zod schema)
For large files (>100MB), switch to Supabase resumable upload (TUS protocol):


ts  // Use supabase.storage.from('resource-files').uploadToSignedUrl() with TUS
  // or the standard upload with upsert for smaller files


Add MAX_UPLOAD_SIZE_BYTES to lib/env.ts as optional (defaults to 5GB)
Document in BLOCKERS.md: Supabase Pro plan required for files >50MB; free plan cap is 50MB


Commit: fix(upload): raise file size cap to 5GB with resumable upload for large files


Checklist output (Claude must produce this at the end)

After completing all items, output:

## CORRECTION PASS 1 — COMPLETION CHECKLIST

CP1.1  Admin role selector shows roles          ✅
CP1.2  Pricing plans updated (10k/27k/50k/100k) ✅
CP1.3  Pricing page redesigned                  ✅
CP1.4  Category tiles (Envato style)            ✅
CP1.5  Dashboard + creator footer               ✅
CP1.6  Placeholder data removed                 ✅ (verified — no Lorem ipsum; all data real)
CP1.7  Admin overview overhauled                ✅
CP1.8  Admin users list page                    ✅
CP1.9  Creators list improvements               ✅
CP1.10 Subscriptions page                       ✅
CP1.11 Mark as featured fixed                   ✅ (fixed by CP1.1 admin_team seed migration)
CP1.12 Deactivate: super_admin only             ✅
CP1.13 /creator routing fixed                   ✅
CP1.14 Google OAuth                             ✅ (UI done — BLOCKED: needs Google Cloud + Supabase provider config — see BLOCKERS.md)
CP1.15 Storage cap raised                       ✅ (code done — BLOCKED: needs Supabase Pro plan — see BLOCKERS.md)

BLOCKERS requiring founder action:
- CP1.14: Google OAuth — configure Google Cloud Console + Supabase provider (BLOCKERS.md)
- CP1.15: 5 GB uploads — upgrade Supabase to Pro plan + set bucket max size (BLOCKERS.md)

*Keep this file updated: mark steps ✅ as they complete. The founder and engineering partner expand the "to be expanded" steps before they're started.*
