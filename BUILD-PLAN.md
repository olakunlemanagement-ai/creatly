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
