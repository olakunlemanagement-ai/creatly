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

## PHASE 1 ✅ — Buyer Foundation (see BUILD-PLAN-archive.md)

## UI POLISH PASS ✅ — Pre-Phase-2 design polish (see BUILD-PLAN-archive.md)

## PHASE 1.9 ✅ — Brand, Navigation & Onboarding (see BUILD-PLAN-archive.md)

## PHASE 1.10 ✅ — Creator Side (pulled forward from Phase 5) (see BUILD-PLAN-archive.md)

## PHASE 2 ✅ — Payments (see BUILD-PLAN-archive.md)

## PHASE 3 ✅ — User Dashboard (see BUILD-PLAN-archive.md)

## PHASE 4 ✅ — Admin Seed Tool (see BUILD-PLAN-archive.md)

## PHASE 5 ✅ — Creator Earnings & Payouts (see BUILD-PLAN-archive.md)

## CORRECTION PASS 1 ✅ (see BUILD-PLAN-archive.md)

---
CORRECTION PASS 2 ✅


⚙️ AUTONOMOUS RUN MODE

Execute every item in order. Build + self-review + one commit per item + /clear between items. Log blockers to BLOCKERS.md. STOP at end of this pass. Output completion checklist at the end.




CP2.1 — Newsletter backend ✅

Scope:
The footer has a newsletter email input with "Subscribe" button that currently goes nowhere.


Migration — new table:


sqlcreate table public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  source     text default 'footer',  -- footer | landing | pricing
  created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
-- Public insert (anyone can subscribe); admin read all; no public read
create policy "public_insert" on public.newsletter_subscribers
  for insert with check (true);
create policy "admin_read" on public.newsletter_subscribers
  for select using (public.is_admin());


Server action lib/actions/newsletter.ts:



Validate email with Zod
Check for duplicate (return friendly "already subscribed" message, not an error)
Insert into newsletter_subscribers
Send welcome email via Resend:

Subject: "Welcome to Creatly — you're on the list 🎉"
Body: warm, on-brand, brief — "Thanks for subscribing. We'll send you the best African creative resources, new asset drops, and creator stories. No spam, ever."
From: hello@joincreatly.com



Return { success: true } or { error: string }



Wire the footer form (components/landing/SiteFooter.tsx):



Convert the email input + button into a small client component NewsletterForm
On submit: call the server action, show inline success ("You're subscribed!") or error
Loading state on button during submission
Clear input on success



Admin newsletter section in /backstage-cl-hq-manage-9x3kp2/:



Add "Newsletter" link to admin sidebar (icon: lucide Mail)
Page: total subscribers count, subscriber list (email, source, date), export as CSV button
No sending functionality yet (just list management for now)


Commit: feat(newsletter): subscriber backend, welcome email, admin list


CP2.2 — Envato-style category redesign ✅ (design-led)

Reference: https://elements.envato.com/ — study the category browsing experience.

Two parts: structure + visual

Part A — Category structure (Envato-aligned top level):
New migration to update level-1 categories to match Envato Elements broader buckets while keeping the Bethmor sub-categories:

sql-- New top-level categories (replace existing level-1 with these)
-- Keep all level-2 and level-3 sub-categories, just reorganise parents

Top level (level 1):
1. Graphic Templates  (covers: social media, presentations, print, brand kits)
2. Video             (covers: stock video, video assets, motion graphics)
3. Music             (covers: stock music — keep all Bethmor music facets)
4. Sound Effects     (covers: sound assets)
5. Photos            (covers: stock photos)
6. Fonts             (covers: fonts)
7. Add-ons           (covers: plugins, web assets, CMS assets, WordPress assets)
8. Web Templates     (covers: web assets, UI kits)
9. Presentations     (covers: presentation assets — Keynote, PowerPoint, Google Slides)
10. 3D               (covers: 3D assets)
11. Graphic Elements (covers: graphic elements — logos, mockups, icons, illustrations)

Update the seed data — migrate existing resources to new category mapping. Keep all sub-categories intact under their new parents.

Part B — Visual redesign of browse/landing category sections:

On /browse and the landing page category section — replace current tiles with Envato-style layout:


Hero category grid (landing page):

Large feature tile for the most popular category (full-width or 2/3 width)
Smaller tiles for remaining categories
Each tile: category name, asset count, representative background image or gradient + subtle pattern
On-brand colors (rotate through forest, terracotta, cream, sand for tile backgrounds)
Clean sans-serif label, bold, bottom-left aligned on each tile
Hover: subtle scale + brightness lift



Browse page category section:

Horizontal scrollable row of category cards (like Envato's top nav expanded)
Each card: icon (lucide or custom SVG), category name, count
Active category: terracotta background, cream text
Below the row: when a category is selected, show its sub-categories as filter chips



Sub-category navigation:

When a main category is selected (e.g. "Music"), show facet groups below (Mood, Genre, Tempo etc.)
Each facet group is a collapsible section in the sidebar
Mobile: bottom sheet with the full filter tree





Commit: feat(categories): Envato-aligned structure + visual redesign


CP2.3 — Teams plan ✅

Recommended team plan structure (based on the individual plan pricing of ₦10k/month):

ts// Add to lib/pricing.ts alongside individual plans
team_monthly:  { id: 'team_monthly',  kobo: 3500000,  label: 'Team Monthly',  seats: 5, description: 'Up to 5 seats, 1 month',   per_seat_kobo: 700000 },
team_quarterly:{ id: 'team_quarterly',kobo: 9000000,  label: 'Team 3 Months', seats: 5, description: 'Up to 5 seats, 3 months',  per_seat_kobo: 600000, savings: 'Save ₦1,500/seat' },
team_annual:   { id: 'team_annual',   kobo: 30000000, label: 'Team Annual',   seats: 5, description: 'Up to 5 seats, 1 year',    per_seat_kobo: 500000, savings: 'Save ₦2,400/seat', featured: true },

Rationale: Individual monthly = ₦10k/seat. Team monthly = ₦7k/seat (30% discount for 5 seats). Encourages teams while being meaningfully cheaper per seat.

What to build:


Migration — add team plans to plans table
Pricing page update:

Add a toggle: "Individual" / "Team" (pill switcher at top)
Individual tab: existing 4 plans
Team tab: 3 team plans (monthly, quarterly, annual)
Each team card shows: price, per-seat price, seat count ("Up to 5 members"), savings badge
Team annual highlighted as "Best for teams"



Team checkout flow (reuse Phase 2 team infrastructure):

On team plan checkout: after payment confirmed via webhook → auto-create team workspace
Team owner gets an invite link to share with up to 4 teammates
Each teammate clicks invite → signs up/logs in → joins team → gets full access
Team management at /dashboard/team (already built in Phase 2)



Seat enforcement:

Server-side: when a team member tries to download, check their team's subscription is active AND seat count not exceeded
If team is at capacity (5/5): new invites rejected with "Seat limit reached — upgrade or remove a member"



Team billing page:

Shows team plan, renewal date, seat usage (3/5 used), member list with "Remove" option
"Upgrade to more seats" CTA (future — for now just 5-seat plans)





Commit: feat(teams): team pricing plans + team tab on pricing page + seat enforcement


CP2 Completion checklist (Claude outputs this at the end):

CP2.1  Newsletter backend + welcome email + admin list    ✅/❌
CP2.2  Envato category structure + visual redesign        ✅/❌
CP2.3  Teams plan + pricing tab + seat enforcement        ✅/❌

BLOCKERS: (list any)

## CORRECTION PASS 3 — User Experience Features ⬜

> ## ⚙️ AUTONOMOUS RUN MODE
>
> Execute every item in order. Build + self-review + one commit per item + `/clear` between items. Log blockers to `BLOCKERS.md`. STOP at end of this pass. Output completion checklist at the end.
>
> **Critical:** Do NOT break existing functionality. Every item is additive — no rewrites of existing search, browse, download, or auth logic. If a step would require changing core Phase 1-5 logic, find the additive path instead and note it.

---

### CP3.1 — Search suggestions (as-you-type dropdown) ✅

**Scope:**
When a user types in the search bar (both navbar search and browse hero search), show a live dropdown of matching suggestions before they hit enter.

1. **New API route** `app/api/search/suggestions/route.ts` — GET:
   - Accepts `?q=` (min 2 chars, max 50, Zod-validated)
   - Returns up to 8 suggestions combining:
     - **Resource matches**: top 4 published resources matching title (ilike `%q%`), return `{ type: 'resource', title, slug, category }`
     - **Category matches**: top 2 categories (level 1) matching name, return `{ type: 'category', name, slug }`
     - **Tag matches**: top 2 resources where tags array contains a matching tag, return `{ type: 'tag', tag, count }`
   - Server-side only; RLS applies (only published resources)
   - Response: `{ suggestions: Suggestion[] }`

2. **`SearchSuggestions` client component** (`components/search/SearchSuggestions.tsx`):
   - Wraps the existing search input
   - Debounce: 200ms (faster than the browse filter debounce — this is just UI)
   - Shows dropdown below the input: resource results (with tiny thumbnail), category chips, tag pills
   - Keyboard navigation: arrow keys move through results, Enter selects, Escape closes
   - Clicking a resource → `/resources/[slug]`; clicking a category → `/browse?category=[slug]`; clicking a tag → `/browse?q=[tag]`
   - Close on click outside; close on route change
   - Loading state: subtle shimmer in the dropdown while fetching
   - Empty state: "No results for '[query]'" after 300ms with no results
   - Does NOT replace or alter the existing search/filter logic on `/browse` — suggestions are a UX layer only

3. **Wire into navbar search** (`HeaderClient.tsx` search input) and the browse hero search input.

4. **No new DB indexes needed** — the existing FTS index (`idx_resources_fts`) covers this. Use `ilike` for the suggestion query (fast enough for 8 results).

**Acceptance criteria:**
1. Typing 2+ chars in navbar or browse search shows a dropdown within ~300ms.
2. Dropdown shows resource, category, and tag suggestions correctly.
3. Keyboard navigation works (arrows + Enter + Escape).
4. Clicking a suggestion navigates correctly.
5. Existing browse search/filter behaviour completely unchanged.
6. Mobile: dropdown fits within viewport width, touch-friendly tap targets.
7. `pnpm typecheck` + `pnpm lint` pass.
8. Commit: `feat(search): as-you-type search suggestions dropdown`

**Watch for:** don't fire on every keystroke — debounce 200ms; don't break the existing browse URL-driven search; keep the dropdown z-index above the category bar.

---

### CP3.2 — Recently viewed ⬜

**Scope:**
Track the last 10 resources a logged-in user viewed and show them on the dashboard overview and a dedicated section.

1. **Migration** — new table:
```sql
create table public.recently_viewed (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  resource_id uuid not null references public.resources on delete cascade,
  viewed_at   timestamptz not null default now(),
  unique (user_id, resource_id)  -- one entry per resource; update viewed_at on re-view
);
-- Keep only last 10 per user (enforced via trigger or application logic)
alter table public.recently_viewed enable row level security;
create policy "owner" on public.recently_viewed
  for all using (auth.uid() = user_id);
```

2. **Track views** — in the resource detail page server component (`app/(app)/resources/[slug]/page.tsx`), after fetching the resource, fire a server action to record the view:
   - Only for logged-in users (skip guests)
   - Upsert: if the resource is already in recently_viewed, update `viewed_at = now()`
   - After upsert, delete any rows beyond the 10 most recent for this user
   - Use the admin client (server action, identity already verified) — fire-and-forget (don't block page render)

3. **Dashboard overview** — add a "Recently viewed" row below "Recent downloads" on `/dashboard/overview`:
   - Fetch last 4 recently viewed resources
   - Render as small `ResourceCard`s
   - "View all" → `/dashboard/recently-viewed`
   - Empty state: "No recently viewed resources yet — start browsing"
   - Hide the section entirely if no viewed resources

4. **`/dashboard/recently-viewed` page** — full list:
   - All recently viewed resources (up to 10), newest first
   - Same grid as downloads page
   - "Clear history" button → deletes all recently_viewed rows for the user (with confirmation)
   - Add "Recently Viewed" link to dashboard sidebar (icon: lucide History)

**Acceptance criteria:**
1. Visiting a resource detail page records the view (logged-in users only).
2. Dashboard overview shows last 4 recently viewed; section hidden if none.
3. `/dashboard/recently-viewed` shows full list with clear history.
4. Re-visiting a resource moves it to the top (updates viewed_at).
5. Maximum 10 entries per user enforced.
6. No impact on page render performance (fire-and-forget tracking).
7. Commit: `feat(dashboard): recently viewed resources tracking and display`

---

### CP3.3 — Free trial (7-day) ⬜

**Scope:**
Allow new users to start a 7-day free trial before subscribing. This is a major conversion driver — users experience the product before committing money.

**Trial rules (locked):**
- One trial per user, ever (enforced server-side)
- Trial gives full entitlement (same as active subscription)
- Trial expires after 7 days — no payment taken automatically
- After expiry, user must subscribe to continue downloading
- Trial available to new users only (no existing subscription or prior trial)

1. **Migration**:
```sql
alter table public.subscriptions
  add column if not exists is_trial boolean not null default false,
  add column if not exists trial_used boolean not null default false;
-- trial_used on profiles to prevent multiple trials
alter table public.profiles
  add column if not exists trial_used boolean not null default false;
```

2. **`app/api/trial/start/route.ts`** — POST, auth-gated:
   - Check `profiles.trial_used = false` — if already used → 409 `{ error: 'trial_already_used' }`
   - Check no active subscription exists → if yes → 409 `{ error: 'already_subscribed' }`
   - Insert `subscriptions` row: `{ status: 'active', is_trial: true, current_period_start: now(), current_period_end: now() + 7 days, plan_id: 'monthly' }`
   - Update `profiles.trial_used = true`
   - Use admin client (server-side, identity verified)
   - Return `{ ok: true, expires_at }`

3. **Trial CTA placement:**
   - On `/pricing` page: above the plan cards, a prominent banner: "New to Creatly? Start your 7-day free trial — no credit card required." with a "Start free trial →" button
   - On resource detail page (for logged-in free users): below the subscribe prompt, a smaller "Or try free for 7 days →" link
   - On `/dashboard/overview` subscription card (free users): "Start your free trial" CTA
   - Hide the trial CTA if `profiles.trial_used = true`

4. **Trial expiry banner** — when `is_trial = true` and `current_period_end < now() + 2 days`:
   - Show a banner on all pages (reuse `ExpiredBanner` pattern from Phase 2): "Your free trial expires in X days. Subscribe to keep downloading."
   - After expiry: existing `ExpiredBanner` already handles `status = inactive`

5. **Entitlement** — `getUserEntitlement()` from Phase 1.8 already reads `subscriptions.status = 'active'` — trial rows with `status = 'active'` automatically grant entitlement. No change needed to the download mechanic.

**Acceptance criteria:**
1. New user can start a 7-day trial from `/pricing`, resource detail, or dashboard — no payment required.
2. Trial grants full download entitlement immediately.
3. Second trial attempt returns 409 (server-enforced, not just UI).
4. Trial CTA hidden after trial used.
5. Expiry banner shows when trial ending soon.
6. After expiry, download blocked (existing entitlement check handles this).
7. `profiles.trial_used` prevents re-trialing even after account changes.
8. Commit: `feat(trial): 7-day free trial with server-side enforcement`

**Watch for:** trial rows must go through the server action — never trust the client to create subscription rows (existing webhook-only rule has an exception here since this is a free trial with no payment); use admin client after identity verification; document this exception with a comment.

---

### CP3.4 — Social sharing ⬜ (design-led)

**Scope:**
Let users share resource pages on social media. Each resource detail page gets share buttons. Sharing drives organic discovery — a creator shares their own work, a user shares something they found useful.

1. **Share buttons on resource detail page** (`app/(app)/resources/[slug]/page.tsx`):
   - A "Share" button (lucide Share2 icon) in the resource detail sidebar, near the download CTA
   - Clicking opens a small share panel (popover, not a modal) with:
     - **Copy link** — copies `https://joincreatly.com/resources/[slug]` to clipboard, shows "Copied!" feedback
     - **WhatsApp** — `https://wa.me/?text=Check out [title] on Creatly: [url]` (most relevant for African audience)
     - **X (Twitter)** — `https://twitter.com/intent/tweet?text=...&url=...`
     - **LinkedIn** — `https://www.linkedin.com/sharing/share-offsite/?url=...`
     - **Facebook** — `https://www.facebook.com/sharer/sharer.php?u=...`

2. **OG meta tags** — each resource detail page must have proper Open Graph tags for rich previews when shared:
   - Already handled by `generateMetadata` in the resource detail page — verify/enhance:
     - `og:title`: resource title
     - `og:description`: resource description (truncated to 160 chars)
     - `og:image`: the resource's primary preview image URL
     - `og:url`: canonical URL
     - `twitter:card`: `summary_large_image`

3. **Share count** (optional, lightweight):
   - Add a `share_count integer default 0` column to resources (migration)
   - Increment via a server action when the copy-link button is clicked (best-effort, fire-and-forget)
   - Show share count on the resource detail page alongside download count: "142 downloads · 23 shares"

4. **Share on creator storefront** — add the same share panel to `/creators/[handle]` so creators can share their own storefront page.

**Acceptance criteria:**
1. Share button on resource detail page opens a popover with 5 share options.
2. Copy link copies the correct URL and shows feedback.
3. WhatsApp, X, LinkedIn, Facebook links open correctly with pre-filled text.
4. OG meta tags are correct — test by pasting a resource URL into https://opengraph.xyz.
5. Share panel on creator storefront works.
6. Mobile-first: share panel is touch-friendly, full-width on mobile.
7. Commit: `feat(sharing): social share buttons on resource detail + creator storefront`

---

### CP3 Completion checklist (Claude outputs this at the end):

```
CP3.1  Search suggestions dropdown              ✅/❌
CP3.2  Recently viewed tracking + dashboard     ✅/❌
CP3.3  Free trial (7-day, server-enforced)      ✅/❌
CP3.4  Social sharing + OG meta tags            ✅/❌

BLOCKERS: (list any)
```