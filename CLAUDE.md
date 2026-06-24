# Creatly — Claude Code Context

Creatly (joincreatly.com) is a subscription-based marketplace for digital creative resources built for African creatives. Users subscribe to download unlimited templates, graphics, fonts, mockups, and motion assets. Revenue flows to creators proportionally from the subscription pool based on download activity.

## Source of truth

Before making any change, read these two documents in the project root:

- **`creatly-v1-prd.md`** — product requirements, exact folder structure (§19.1), database schema (§14), API surface (§15), and the build sequence (§20).
- **`CONVENTIONS.md`** — the binding engineering rulebook. Every decision in this project follows it. Consistency beats cleverness.

If anything in a prompt conflicts with these documents, stop and flag it.

## Build sequence

| Phase | Steps | Status |
|-------|-------|--------|
| Phase 1 — Buyer Foundation | 1.1 Scaffold · 1.2 Supabase/DB · 1.3 Auth · 1.4 Catalogue · 1.5 Search · 1.6 Resource detail · 1.7 Favourites · 1.8 Downloads | **Step 1.1 complete** |
| Phase 2 — Payments | 2.1 Paystack plans · 2.2 Pricing page · 2.3 Checkout · 2.4 Webhooks · 2.5 Team plans · 2.6 Billing · 2.7 Sub status UI · 2.8 Tests | **Complete (Paystack keys stubbed — see BLOCKERS.md)** |
| Phase 3 — User Dashboard | 3.1–3.8 Dashboard pages | Not started |
| Phase 4 — Admin Seed Tool | 4.1–4.6 Admin CRUD | Not started |
| Phase 5 — Creator Dashboard | Phase 2 public | Not started |

**Next step: 1.2 — Supabase project setup, DB schema migration, RLS policies, Storage buckets.**

## Non-negotiables

1. **TypeScript strict — zero `any`**. Use `unknown` and narrow it. No `@ts-ignore` without a comment explaining why.
2. **pnpm only**. Never npm or yarn. All install commands use `pnpm`.
3. **Money is always integer kobo**. 1 NGN = 100 kobo. Never float. Format only at display time via `formatNaira()` in `lib/format.ts`.
4. **Brand name lives only in `lib/config.ts`**. Import `APP_NAME` everywhere else. Never hardcode "Creatly" in components, pages, emails, metadata, or database objects.
5. **Download attribution is guarded** — every download logs an immutable record (including `creator_id`) *before* any signed URL is issued. No log = no URL.
6. **Entitlement is server-side** — `getUserEntitlement()` in `lib/entitlement.ts` is called on every download request. The client is never trusted for subscription status.
7. **Subscription state is driven by Paystack webhooks only** — never set `status = 'active'` from a client callback.
8. **No magic strings** — use const arrays from `types/database.ts` (`PLAN_TYPES`, `SUBSCRIPTION_STATUS`, etc.).
9. **API route handlers** follow the mandatory shape: auth → validate → authorize → execute → respond → handle (CONVENTIONS §5.2).

## Key file locations

| What | Where |
|------|-------|
| Brand constants | `lib/config.ts` |
| Env validation (Zod) | `lib/env.ts` |
| API response helpers | `lib/api-response.ts` |
| DB types + enum consts | `types/database.ts` |
| API envelope types | `types/api.ts` |
| Money formatter | `lib/format.ts` |
| shadcn components | `components/ui/` (do not hand-edit) |

## Tech stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5 (strict)
- **Styling:** Tailwind CSS 4 (CSS-first config) + shadcn/ui + Radix primitives
- **Auth + DB:** Supabase (Postgres + Auth + Storage)
- **Payments:** Paystack (NGN, recurring subscriptions)
- **Email:** Resend + React Email
- **Package manager:** pnpm

Build workflow (how work is assigned)

The ordered task list for this project lives in BUILD-PLAN.md in the repo root. It defines every build step with its scope and acceptance criteria.

When the founder gives a short instruction like:


"Do step 1.2b from the build plan."



…interpret it as:


Read BUILD-PLAN.md and find that step.
Read the always-on rules at the top of BUILD-PLAN.md — they apply to every step.
Read CONVENTIONS.md and the relevant section of creatly-v1-prd.md.
Enter plan mode behaviour: propose what you'll do for THAT step only, then wait for "proceed".
Execute strictly within the step's scope.
Confirm each acceptance criterion explicitly, summarise changes, make ONE clean commit (Conventional Commits), and STOP.


Never run ahead into the next step. Never weaken download attribution or server-side entitlement. If anything is ambiguous or conflicts with the PRD/CONVENTIONS, stop and ask rather than guessing.

After completing a step, update BUILD-PLAN.md to mark it done (✅).

Model routing & cost discipline

Use the cheapest model that can do the job well. Do not default to the most
capable model for everything.


haiku — file reads, lookups, summaries, formatting, renaming, simple
mechanical edits, running a command and reporting output.
sonnet — standard implementation: building components and pages,
writing route handlers, debugging, code review, most BUILD-PLAN steps.
opus — reserve for genuine architecture decisions, schema design, or
complex multi-file reasoning. Rare now that the architecture is settled.


When spawning a subagent:


Give it a TIGHT brief naming the exact files or directories to read. Never
"explore the repo" or "find anything related to X" — that burns tokens on
open-ended search.
Route it to the cheapest capable model (default haiku for read/search/
summarize tasks, sonnet for implementation). Do not spawn an Opus subagent
for mechanical work.
Only spawn a subagent when isolating heavy/verbose output (large file
reads, log dumps, test output) is worth the startup overhead. For a quick
one- or two-file change, just do it in the main thread.


Keep this file lean — it loads on every request.