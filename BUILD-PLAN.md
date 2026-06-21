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
