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
CORRECTION PASS 2 ⬜


⚙️ AUTONOMOUS RUN MODE

Execute every item in order. Build + self-review + one commit per item + /clear between items. Log blockers to BLOCKERS.md. STOP at end of this pass. Output completion checklist at the end.




CP2.1 — Newsletter backend ⬜

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


CP2.2 — Envato-style category redesign ⬜ (design-led)

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


CP2.3 — Teams plan ⬜

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