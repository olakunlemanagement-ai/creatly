# Creatly V1 — Product Requirements Document

**Version:** 1.2
**Status:** Approved for build
**Last updated:** June 2026
**Owner:** Founder
**Engineering partner:** Senior Full-Stack (Claude)

> **Name & domain:** The platform is **Creatly**, domain **joincreatly.com** (secured). The brand name still lives in a single config constant and never appears in the database, schema, or storage layer — so any future rebrand stays cheap. See [Section 19.3](#193-brand-name-convention).

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [User Roles](#3-user-roles)
4. [Free Tier vs. Subscription](#4-free-tier-vs-subscription)
5. [Subscription Plans](#5-subscription-plans)
6. [Feature Scope — MoSCoW](#6-feature-scope--moscow)
7. [User Flows](#7-user-flows)
8. [Resource Model](#8-resource-model)
9. [Download Mechanics](#9-download-mechanics)
10. [Notifications](#10-notifications)
11. [Admin & Seed Tool](#11-admin--seed-tool)
12. [Creator Dashboard (Phase 2)](#12-creator-dashboard-phase-2)
13. [Out of Scope for V1](#13-out-of-scope-for-v1)
14. [Database Schema](#14-database-schema)
15. [API Surface](#15-api-surface)
16. [Storage Structure](#16-storage-structure)
17. [Paystack Integration Model](#17-paystack-integration-model)
18. [Email & Notification Strategy](#18-email--notification-strategy)
19. [Architecture & Conventions](#19-architecture--conventions)
20. [Build Sequence & Phase Breakdown](#20-build-sequence--phase-breakdown)

---

## 1. Product Overview

**Creatly** (joincreatly.com) is a subscription-based marketplace for digital creative resources — templates, graphics, fonts, mockups, motion assets, and more — built specifically for African creatives.

**Core problems solved:**
- Global creative platforms (Envato, Adobe Stock, Creative Market) price out African creatives with USD pricing and limited local payment options.
- Existing platforms carry little culturally relevant content for African audiences.
- African creatives lack a professional-grade, affordable, locally-anchored resource hub.

**Core value loop:**
> Browse catalogue → Subscribe → Download unlimited resources → Create

**Revenue model:** Subscription only. No per-item cart or one-time purchase.
**Payment processor:** Paystack (NGN primary, supports African cards including Verve, mobile money, bank transfer, USSD, and recurring billing). Paystack is the confirmed and correct processor for a Nigeria-first product — Stripe does not directly support Nigerian merchant accounts, and Paystack (a Stripe-owned company) is its native Nigerian arm.
**Creator earnings:** Revenue share. Creators earn proportionally from the subscription pool based on download activity relative to total platform downloads.

---

## 2. Goals & Success Metrics

### V1 Launch Goals
| Goal | Metric | Target (90 days post-launch) |
|------|--------|-------------------------------|
| Paying subscribers | Active subscriptions | 500 |
| Catalogue depth | Published resources | 200+ |
| Download engagement | Downloads per active subscriber / month | ≥ 10 |
| Subscription retention | Month-2 retention | ≥ 60% |
| Download attribution integrity | Download records with creator_id | 100% |

### Non-negotiable technical goals
- Zero download records missing creator attribution
- Entitlement check server-side on every download request — never client-trusted
- Paystack webhook events idempotent — no duplicate subscription state changes

---

## 3. User Roles

### 3.1 Guest (unauthenticated)
- Can browse the catalogue (search, filter, view resource detail pages)
- Can view creator profiles (once creator dashboard exists)
- Cannot download, favourite, or save anything
- Sees upgrade/signup prompts at download CTA

### 3.2 Free User (authenticated, no active subscription)
- All guest capabilities
- Can favourite / save resources
- Cannot download
- Sees upgrade prompt at every download attempt
- Account persists; favourites are retained if they later subscribe

### 3.3 Subscriber (authenticated, active subscription)
- All free user capabilities
- Can download any resource (unlimited)
- Download is gated server-side; entitlement verified on every request
- Can view their download history in the dashboard

### 3.4 Admin
- Internal team role only
- Access to the admin seed tool (upload, edit, delete resources; manage creators; manage categories)
- Can assign admin role to other users
- Cannot purchase subscriptions (or can, separately — kept logically separate from admin role)

### 3.5 Creator (Phase 2)
- Publicly onboarded role
- Can upload resources for review
- Can view their own earnings dashboard and payout requests
- NOT in V1 public UI — schema and attribution plumbing exist from day one, public creator onboarding comes in Phase 2

---

## 4. Free Tier vs. Subscription

**Decision: Browse-only free tier (Option A)**

Free (authenticated) users can:
- Browse the full catalogue
- Search and filter
- View resource detail pages including previews
- Favourite / save resources

Free users cannot:
- Download any resource
- Access download history

On any download attempt, free users see a modal or inline prompt: **"Downloading requires an active subscription. Upgrade to get unlimited downloads."** with a CTA to the pricing/upgrade page.

Guests (unauthenticated) see: **"Sign up free, then subscribe to download."**

---

## 5. Subscription Plans

### 5.1 Plan Structure

| Plan | Billing | Description |
|------|---------|-------------|
| Monthly Personal | Monthly recurring | Single user, unlimited downloads |
| Annual Personal | Annual recurring (upfront) | Single user, unlimited downloads — priced at 10× monthly |
| Monthly Team | Monthly recurring | Up to 5 seats, unlimited downloads per seat |
| Annual Team | Annual recurring (upfront) | Up to 5 seats — priced at 10× monthly team |

**Pricing currency:** NGN (Nigerian Naira) primary at launch.
**Other currencies:** Not in V1. Paystack supports multi-currency; this is a Phase 2 scope item once NGN is stable.

### 5.2 Annual Pricing Rule (the "10-month" rule)

**Annual plans are priced at exactly 10× the monthly plan price** — i.e. paying annually gives the user **2 months free**. This is the standard incentive to push users onto annual (better cash upfront, better retention).

- Annual Personal price = Monthly Personal price × 10
- Annual Team price = Monthly Team price × 10

Implementation notes:
- This is **not** computed at runtime. Each plan has its own fixed `amount_kobo` value stored in the DB and configured as its own Paystack plan. The 10× rule is how you *set* the annual number when configuring plans — it is not a live calculation.
- The pricing page should display the saving explicitly: e.g. "Save ₦X — 2 months free with annual billing."
- If monthly pricing changes later, the annual price must be re-set to maintain the 10× relationship (a deliberate manual step, not automatic).

### 5.3 Team Plan Mechanics
- One "owner" account holds the subscription
- Owner can invite up to 4 additional members (total 5 seats)
- Invited members join via email invite link
- Each member has their own login and download history
- Downloads by any team member are attributed to the resource's creator
- If subscription lapses, all seats lose download access simultaneously

### 5.4 Entitlement Rules
- Entitlement = `subscription.status === 'active'` checked server-side against the database, driven by Paystack webhooks
- For team plans: entitlement check looks at the team's subscription, not just the individual user's record
- Trial period: optional — decision deferred to pricing phase; schema must support a `trial_ends_at` field

### 5.5 Pricing Values
Exact NGN pricing is a business decision made at launch. Schema stores amounts as **integer kobo** (1 NGN = 100 kobo). Never store as float. Annual = monthly × 10 per the rule above.

---

## 6. Feature Scope — MoSCoW

### Phase 1 — Buyer Foundation

#### MUST HAVE
- [ ] User registration (email + password via Supabase Auth)
- [ ] User login / logout
- [ ] Email verification on signup
- [ ] Password reset flow
- [ ] Browse catalogue (paginated grid, default sort: newest)
- [ ] Category filter
- [ ] Tag filter
- [ ] Keyword search (title + tags + description)
- [ ] Sort options: Newest, Most Downloaded, Featured
- [ ] Resource detail page (title, description, preview images, file info, creator attribution, download CTA)
- [ ] Favourite / save resource (heart toggle, persisted per user)
- [ ] Favourites list in dashboard
- [ ] Resource file download (server-side entitlement check → signed URL → client download trigger)
- [ ] Download logging: immutable record of (user_id, resource_id, creator_id, plan_type, timestamp)
- [ ] Download history in dashboard
- [ ] Protected download route (unauthenticated users redirected to login; free users shown upgrade prompt)

#### SHOULD HAVE
- [ ] Resource preview image gallery (multiple preview images per resource)
- [ ] Related resources section on detail page (same category)
- [ ] Compatible software tags on resource (e.g. "Figma", "Canva", "Illustrator")
- [ ] File type badge on resource card (PSD, AI, FIGMA, ZIP, etc.)
- [ ] Resource file size shown on detail page
- [ ] Responsive mobile-first design for all pages
- [ ] Loading skeletons / optimistic UI on catalogue grid
- [ ] Empty state handling on search/filter

#### COULD HAVE
- [ ] Featured / curated collections (hand-picked by admin)
- [ ] "New this week" section on homepage
- [ ] Resource view count (non-personalised, just a counter)
- [ ] Share resource link (copy to clipboard)

#### WON'T HAVE (V1)
- [ ] Social login (Google, Apple) — Phase 2
- [ ] Multi-currency pricing — Phase 2
- [ ] Creator public onboarding — Phase 2
- [ ] Creator earnings dashboard — Phase 2
- [ ] Comment / review system — Phase 2
- [ ] Follow a creator — Phase 2
- [ ] Affiliate / referral programme — Phase 2
- [ ] API access for creators — Phase 2

---

### Phase 2 — Payments & Entitlements

#### MUST HAVE
- [ ] Pricing page (display all plans, show 2-months-free annual saving)
- [ ] Checkout flow via Paystack (redirect to Paystack hosted page or inline)
- [ ] Paystack webhook handler: `charge.success`, `subscription.create`, `subscription.disable`, `invoice.payment_failed`
- [ ] Subscription record in DB, updated by webhooks only (never by client)
- [ ] Entitlement middleware: reusable server-side function `getUserEntitlement(userId)`
- [ ] Team plan seat management: owner invites members via email
- [ ] Team invite flow: invite link → signup or login → linked to team subscription
- [ ] Subscription status page in dashboard (plan, renewal date, seats if team, cancel option)
- [ ] Payment history in dashboard (list of successful charges)
- [ ] Failed payment notification (in-app + email)
- [ ] Subscription cancellation flow (cancels at period end, not immediately)
- [ ] Post-cancellation grace period handling (access until period end)

#### SHOULD HAVE
- [ ] Plan upgrade/downgrade flow (e.g. Monthly → Annual)
- [ ] Seat removal / member removal for team plans
- [ ] Renewal reminder email (3 days before)
- [ ] Receipt email on successful charge

#### COULD HAVE
- [ ] Coupon / discount code support (Paystack discount codes)
- [ ] Annual plan savings callout on pricing page

#### WON'T HAVE (V1)
- [ ] Manual invoicing
- [ ] Enterprise / custom pricing
- [ ] VAT handling — Phase 3

---

### Phase 3 — User Dashboard

Per the dashboard spec provided by founder. Full dashboard with:

#### MUST HAVE
- [ ] Dashboard home: quick links, recent downloads, favourites snapshot
- [ ] Downloads page: full download history, filterable
- [ ] Favourites page: saved resources grid
- [ ] Profile page: name, email, avatar (upload via Supabase Storage)
- [ ] Account page: subscription status, plan, renewal date, upgrade CTA
- [ ] Notification centre: in-app notification list
- [ ] Help/Support page: FAQ links, contact form
- [ ] Secure logout

#### SHOULD HAVE
- [ ] Account type badge (Free / Personal / Team Member / Team Owner)
- [ ] Notification preferences (toggle email notifications)
- [ ] Change password

#### COULD HAVE
- [ ] Dark mode toggle
- [ ] Activity summary (downloads this month, total downloads)

---

### Phase 4 — Admin & Seed Tool

#### MUST HAVE
- [ ] Admin-only route group, protected by role check
- [ ] Creator management: create creator profiles (internal team), edit, deactivate
- [ ] Resource upload: title, description, category, tags, compatible software, preview images (multiple), resource file(s) (single file or ZIP bundle)
- [ ] Resource publish/unpublish toggle
- [ ] Resource edit
- [ ] Resource delete (soft delete — never hard delete records with downloads)
- [ ] Category management: create, edit, reorder categories
- [ ] Tag management
- [ ] Basic analytics view: total resources, total downloads, total subscribers

#### SHOULD HAVE
- [ ] Bulk upload support (multiple resources in one session)
- [ ] Resource search/filter in admin
- [ ] User management: view users, see subscription status, manually adjust role

#### COULD HAVE
- [ ] Admin audit log (who changed what, when)
- [ ] Featured resource toggle (marks resource as featured for homepage)

---

### Phase 5 — Creator Dashboard (Phase 2 Public)

Schema and attribution plumbing built in Phase 1. Public UI comes after buyers and catalogue exist.

#### MUST HAVE
- [ ] Creator registration / application flow
- [ ] Creator profile page (public-facing)
- [ ] Resource upload portal (same mechanics as admin upload, but creator-facing)
- [ ] Resource review queue (admin approves before publish)
- [ ] Earnings dashboard: downloads per resource, estimated earnings, pool share
- [ ] Payout request flow
- [ ] Payout history

#### WON'T HAVE (Phase 2)
- [ ] Automated payout (manual admin approval first)

---

## 7. User Flows

### 7.1 Signup & Onboarding
```
Landing page
  └─ "Get Started" / "Browse Resources"
       └─ If guest tries to browse: allowed (catalogue is public)
       └─ If guest tries to favourite: redirect to /signup
       └─ If guest tries to download: redirect to /signup with next param
  └─ /signup → email + password → verify email → /dashboard
  └─ /login → email + password → /dashboard (or next param redirect)
```

### 7.2 Subscription Purchase
```
/dashboard or /pricing
  └─ "Upgrade" CTA
       └─ /pricing → select plan (monthly or annual; annual shows 2-months-free saving)
            └─ Paystack checkout (redirect or inline)
                 └─ Success → Paystack webhook fires → DB updated → user redirected to /dashboard
                 └─ Failure → user redirected to /pricing with error message
```

### 7.3 Download Flow
```
Resource detail page
  └─ "Download" button clicked
       └─ POST /api/downloads/[resourceId]
            └─ Server checks: is user authenticated?
                 └─ No → 401 → client redirects to /login
            └─ Server checks: does user have active subscription?
                 └─ No → 403 → client shows upgrade prompt modal
            └─ Server logs download record (user_id, resource_id, creator_id, timestamp, plan_type)
            └─ Server generates Supabase Storage signed URL (short TTL: 60 seconds)
            └─ Server returns { url: signedUrl }
            └─ Client triggers browser download (anchor click with `download` attribute)
       └─ Download begins on user's device
```

### 7.4 Team Invite Flow
```
Team owner → Dashboard → Account → Manage Team → Invite Member
  └─ Enter email address
       └─ Email sent with signed invite link (JWT, 48h expiry)
            └─ Recipient clicks link
                 └─ If not registered: /signup?invite=<token>
                 └─ If registered: /login?invite=<token> → auto-accept on login
                 └─ Account linked to team subscription
                 └─ Seat count checked before accepting (max 5)
```

---

## 8. Resource Model

### 8.1 Resource Types
All resource types are supported. No hard-coded type list — resources are categorised by admin-managed categories and tagged with compatible software. File type is inferred from the uploaded file extension.

**Common resource types in catalogue:**
- Graphic templates (Canva, Figma, Illustrator, Photoshop, CorelDraw)
- Social media templates (Instagram, Twitter/X, Facebook, LinkedIn)
- Presentation templates (PowerPoint, Google Slides, Keynote)
- Fonts and typefaces
- Icons and icon packs
- Mockups (device, clothing, print)
- Motion graphics and video templates (After Effects, Premiere, Canva)
- Brand identity kits
- Pattern / texture packs
- UI kits

### 8.2 File Structure
Resources can be:
- **Single file** — one download file (e.g. a single `.fig`, `.psd`, `.ttf`)
- **Multi-file bundle** — multiple files packaged as a ZIP (e.g. a brand kit with `.ai`, `.pdf`, `.png`, and a `.txt` read-me)

The admin/creator always uploads either a single file or a pre-prepared ZIP. Creatly does not ZIP files for them. The resource record stores the file path, file name (as shown to user), file size, and MIME type.

### 8.3 Preview Images
Every resource has:
- A **primary preview image** (shown on catalogue cards)
- Up to **5 additional preview images** (shown in gallery on detail page)

All preview images are stored in Supabase Storage, separate bucket from resource files.

### 8.4 Resource Metadata Schema (summary — full schema in Section 14)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| title | text | Required, max 120 chars |
| slug | text | URL-safe, unique, generated from title |
| description | text | Rich text (stored as plain text V1, Markdown V2) |
| category_id | UUID FK | Single category |
| tags | text[] | Array of lowercase tags |
| compatible_software | text[] | e.g. ['figma', 'canva'] |
| file_path | text | Supabase Storage path to download file |
| file_name | text | Display name shown to user |
| file_size_bytes | bigint | Stored in bytes, displayed formatted |
| file_type | text | MIME type |
| preview_image_path | text | Primary preview image path |
| creator_id | UUID FK | References creators table |
| status | enum | draft \| published \| archived |
| is_featured | boolean | Admin-toggleable |
| download_count | integer | Denormalised counter (not authoritative — downloads table is) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## 9. Download Mechanics

### 9.1 The Download Request Lifecycle

Every download goes through a single server-side API route. The sequence is non-negotiable:

1. **Authentication check** — Is there a valid Supabase session? If not → 401.
2. **Entitlement check** — Does this user (or their team's subscription) have `status = 'active'`? If not → 403 with `{ reason: 'no_active_subscription' }`.
3. **Resource existence check** — Does the resource exist and is it published? If not → 404.
4. **Log the download** — Insert into `downloads` table: `(user_id, resource_id, creator_id, subscription_id, plan_type, timestamp)`. This is an immutable append. If this insert fails, the download is aborted and an error returned. Never issue a download URL before the log record is committed.
5. **Generate signed URL** — Call Supabase Storage to create a signed URL for the resource file with a 60-second TTL.
6. **Return signed URL** — `{ url: signedUrl, fileName: resource.file_name }`.
7. **Client triggers download** — Client creates a temporary `<a href={url} download={fileName}>` and programmatically clicks it.

This server-action approach is what guarantees an immediate download to the user's device while keeping the entitlement check and attribution log on the server. The file is never directly exposed; the signed URL is single-purpose and short-lived.

### 9.2 Critical Rules
- The signed URL is generated **after** the download is logged. If the log fails, no URL is issued.
- The signed URL TTL is 60 seconds. It is useless if intercepted after that window.
- The download log is append-only. No UPDATE or DELETE on `downloads` records.
- The `creator_id` on the download record is copied from the resource at download time — it does not change if the resource is later reassigned to a different creator.

### 9.3 Re-Download
Users can download the same resource multiple times. Each download creates a new log record. This is correct: it reflects genuine usage and all records count toward creator attribution.

---

## 10. Notifications

### 10.1 Notification Types

| ID | Trigger | In-App | Email |
|----|---------|--------|-------|
| `subscription_activated` | Subscription payment succeeds | yes | yes |
| `subscription_renewed` | Recurring charge succeeds | yes | yes |
| `subscription_renewal_reminder` | 3 days before renewal | yes | yes |
| `payment_failed` | Paystack invoice payment failed | yes | yes |
| `subscription_cancelled` | User cancels subscription | yes | yes |
| `subscription_expired` | Access ends after cancellation period | yes | yes |
| `team_invite_received` | Team owner invites a member | — | yes |
| `team_invite_accepted` | A team member accepts invite | yes | — |
| `new_resources_in_category` | New resources added to a followed category | yes | yes (digest) |
| `download_receipt` | User downloads a resource | — | — (no noise) |
| `welcome` | First login after signup | — | yes |

### 10.2 Notification Preferences
Users can toggle email notifications per category in Profile > Notification Preferences. In-app notifications are always on (but can be dismissed). New-resource digest emails default to weekly.

### 10.3 In-App Notification Centre
- Bell icon in nav bar with unread count badge
- Notification list in dashboard: title, body, timestamp, read/unread state
- Mark all as read action
- Clicking a notification navigates to the relevant page (e.g. subscription page, resource page)

### 10.4 Email Stack
- **Provider:** Resend
- **Templates:** React Email components, one per notification type
- **From address:** `hello@joincreatly.com` (configured via env var)
- **Unsubscribe:** One-click unsubscribe link in every marketing/digest email (required by Resend and email best practice)

---

## 11. Admin & Seed Tool

### 11.1 Access Control
- Admin routes live at `/admin/*`
- Protected by server-side role check: `user.role === 'admin'` from the database, not from the JWT claim alone
- Role is set directly in the database; there is no self-serve admin signup

### 11.2 Creator Management (Internal)
During the seed phase, admin creates "creator" records for internal team members. This:
- Exercises the creator schema properly before Phase 2
- Ensures all seeded content has valid `creator_id` attribution
- Makes the attribution plumbing testable from the first download

Each internal creator record has: `name`, `bio`, `avatar`, `is_public: false` (hidden from public pages until Phase 2 when real creator profiles go live).

### 11.3 Resource Upload Flow (Admin)
1. Select or create a category
2. Select creator (internal creator records)
3. Fill resource metadata (title, description, tags, compatible software)
4. Upload preview images (primary + up to 5 additional)
5. Upload resource file (single file or ZIP)
6. Set status: Draft or Published
7. Submit → resource record created, files stored in Supabase Storage

### 11.4 Seed Content Strategy
Target: 200+ published resources before public launch. Admin tool must support efficient individual uploads. Bulk upload is SHOULD HAVE for Phase 4.

---

## 12. Creator Dashboard (Phase 2)

Schema and download-attribution infrastructure built in Phase 1. Public creator UI comes in Phase 2 after buyers and catalogue exist.

**Phase 2 scope (not detailed here — separate PRD addendum when Phase 1 is complete):**
- Public creator onboarding and application
- Resource upload portal (creator-facing, with admin review queue)
- Earnings dashboard (downloads × pool share formula)
- Payout request system
- Creator public profile pages

---

## 13. Out of Scope for V1

The following are explicitly excluded from all five phases of V1:

- Social login (Google, Apple, Twitter)
- Multi-currency / international pricing
- Public creator onboarding (schema exists; UI does not)
- Creator earnings UI (data collected; dashboard not built)
- Comment, review, or rating system
- Follow a creator
- Affiliate or referral programme
- API access (third-party integrations)
- Mobile app (iOS/Android)
- VAT / tax handling
- Manual invoicing
- Enterprise pricing
- Automated creator payouts

---

## 14. Database Schema

### 14.1 Schema Design Principles
- All primary keys are UUIDs (`gen_random_uuid()`)
- All timestamps are `timestamptz` (UTC)
- Monetary amounts stored as `integer` (kobo/minor units) — **never float or numeric for money**
- Soft deletes on resources (status field) — hard deletes never on records with download attribution
- Row-Level Security (RLS) enabled on all tables
- Immutable tables: `downloads`, `subscription_events` — no UPDATE, no DELETE via application
- **No brand/product name in any table name, column name, schema name, or storage bucket name** — see Section 19.3

### 14.2 Tables

```sql
-- ============================================================
-- USERS & AUTH
-- ============================================================

-- Supabase Auth manages the auth.users table.
-- We maintain a public profile table that mirrors/extends it.

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  avatar_path   text,                          -- Supabase Storage path
  role          text not null default 'user'   -- 'user' | 'admin' | 'creator'
                check (role in ('user', 'admin', 'creator')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- CREATORS
-- ============================================================

create table public.creators (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid references public.profiles(id) on delete set null,
  name          text not null,
  slug          text not null unique,
  bio           text,
  avatar_path   text,
  website_url   text,
  is_public     boolean not null default false,   -- false = internal/seed; true = Phase 2 public
  is_verified   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- CATEGORIES
-- ============================================================

create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  slug          text not null unique,
  description   text,
  icon_name     text,                             -- lucide icon name or emoji
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- RESOURCES
-- ============================================================

create table public.resources (
  id                    uuid primary key default gen_random_uuid(),
  creator_id            uuid not null references public.creators(id),
  category_id           uuid not null references public.categories(id),
  title                 text not null,
  slug                  text not null unique,
  description           text,
  tags                  text[] not null default '{}',
  compatible_software   text[] not null default '{}',   -- ['figma', 'canva', 'illustrator']

  -- File info (the actual downloadable file)
  file_path             text not null,            -- Supabase Storage path
  file_name             text not null,            -- display name, e.g. "brand-kit-v2.zip"
  file_size_bytes       bigint not null,
  file_type             text not null,            -- MIME type

  -- Preview images
  preview_image_path    text not null,            -- primary preview (catalogue card)
  preview_images        text[] not null default '{}', -- additional preview paths (max 5)

  -- Status & discovery
  status                text not null default 'draft'
                        check (status in ('draft', 'published', 'archived')),
  is_featured           boolean not null default false,
  download_count        integer not null default 0,   -- denormalised cache, not authoritative

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_resources_category_id    on public.resources(category_id);
create index idx_resources_creator_id     on public.resources(creator_id);
create index idx_resources_status         on public.resources(status);
create index idx_resources_created_at     on public.resources(created_at desc);
create index idx_resources_tags           on public.resources using gin(tags);
create index idx_resources_compat_sw      on public.resources using gin(compatible_software);
-- Full-text search index
create index idx_resources_fts on public.resources
  using gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================

create table public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null references public.profiles(id),   -- the paying account

  -- Paystack references
  paystack_customer_id  text,
  paystack_sub_code     text unique,             -- Paystack subscription code
  paystack_plan_code    text,                    -- Paystack plan code

  -- Plan details
  plan_type             text not null
                        check (plan_type in ('personal_monthly', 'personal_annual', 'team_monthly', 'team_annual')),
  max_seats             integer not null default 1,    -- 1 for personal; 5 for team
  amount_kobo           integer not null,              -- recurring charge amount in kobo (annual = monthly x 10)
  currency              text not null default 'NGN',

  -- Status — driven by webhooks only
  status                text not null default 'pending'
                        check (status in ('pending', 'active', 'past_due', 'cancelled', 'expired')),

  -- Dates
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  trial_ends_at         timestamptz,
  cancelled_at          timestamptz,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_subscriptions_owner_id   on public.subscriptions(owner_id);
create index idx_subscriptions_status     on public.subscriptions(status);

-- ============================================================
-- SUBSCRIPTION EVENTS (immutable audit log)
-- ============================================================

create table public.subscription_events (
  id                uuid primary key default gen_random_uuid(),
  subscription_id   uuid references public.subscriptions(id),
  paystack_event    text not null,               -- e.g. 'charge.success', 'subscription.disable'
  paystack_ref      text,                        -- Paystack transaction reference (for idempotency)
  payload           jsonb,                       -- full Paystack webhook payload
  processed_at      timestamptz not null default now()
);

-- Idempotency: prevent processing same Paystack event twice
create unique index idx_sub_events_paystack_ref on public.subscription_events(paystack_ref)
  where paystack_ref is not null;

-- ============================================================
-- TEAM MEMBERS
-- ============================================================

create table public.team_members (
  id                uuid primary key default gen_random_uuid(),
  subscription_id   uuid not null references public.subscriptions(id) on delete cascade,
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  role              text not null default 'member' check (role in ('owner', 'member')),
  invited_email     text,
  invite_token      text unique,
  invite_accepted   boolean not null default false,
  invited_at        timestamptz not null default now(),
  accepted_at       timestamptz,
  unique (subscription_id, profile_id)
);

-- ============================================================
-- DOWNLOADS (immutable — append only, never update or delete)
-- ============================================================

create table public.downloads (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id),
  resource_id       uuid not null references public.resources(id),
  creator_id        uuid not null,               -- denormalised from resource at download time
  subscription_id   uuid references public.subscriptions(id),
  plan_type         text,                        -- denormalised: plan at time of download
  downloaded_at     timestamptz not null default now()
  -- No updated_at. This table is append-only.
);

create index idx_downloads_user_id         on public.downloads(user_id);
create index idx_downloads_resource_id     on public.downloads(resource_id);
create index idx_downloads_creator_id      on public.downloads(creator_id);
create index idx_downloads_downloaded_at   on public.downloads(downloaded_at desc);
create index idx_downloads_subscription_id on public.downloads(subscription_id);

-- ============================================================
-- FAVOURITES
-- ============================================================

create table public.favourites (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  resource_id   uuid not null references public.resources(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (user_id, resource_id)
);

create index idx_favourites_user_id on public.favourites(user_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  type          text not null,                   -- notification type ID from spec
  title         text not null,
  body          text not null,
  action_url    text,                            -- optional deep link
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index idx_notifications_user_id    on public.notifications(user_id);
create index idx_notifications_is_read    on public.notifications(user_id, is_read)
  where is_read = false;

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================

create table public.notification_preferences (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null unique references public.profiles(id) on delete cascade,
  email_subscription_events boolean not null default true,
  email_renewal_reminders   boolean not null default true,
  email_payment_failed      boolean not null default true,
  email_team_events         boolean not null default true,
  email_new_resources       boolean not null default true,
  email_new_resources_freq  text not null default 'weekly'
                            check (email_new_resources_freq in ('daily', 'weekly', 'never')),
  updated_at                timestamptz not null default now()
);

-- ============================================================
-- CATEGORY FOLLOWS (for new-resource notifications)
-- ============================================================

create table public.category_follows (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  category_id   uuid not null references public.categories(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (user_id, category_id)
);
```

---

## 15. API Surface

All API routes live under `/api/`. They are Next.js Route Handlers (App Router). All are server-side. No client-side direct Supabase DB calls for write operations or sensitive reads.

### 15.1 Auth (handled by Supabase Auth + Next.js middleware)
```
POST   /api/auth/signup          -- handled by Supabase client
POST   /api/auth/login           -- handled by Supabase client
POST   /api/auth/logout          -- handled by Supabase client
POST   /api/auth/reset-password  -- handled by Supabase client
```

### 15.2 Resources
```
GET    /api/resources                      -- catalogue list (paginated, filtered, searched)
GET    /api/resources/[slug]               -- resource detail
POST   /api/resources                      -- admin only: create resource
PATCH  /api/resources/[id]                 -- admin only: update resource
DELETE /api/resources/[id]                 -- admin only: soft delete (set status = archived)
```

### 15.3 Downloads
```
POST   /api/downloads/[resourceId]         -- authenticated + entitled users only
                                           -- logs download, returns signed URL
GET    /api/downloads                      -- user's download history (paginated)
```

### 15.4 Favourites
```
POST   /api/favourites/[resourceId]        -- toggle favourite (add if not exists, remove if exists)
GET    /api/favourites                     -- user's favourites list (paginated)
```

### 15.5 Subscriptions
```
POST   /api/subscriptions/checkout        -- create Paystack checkout session, return URL
POST   /api/subscriptions/cancel          -- cancel subscription (sets cancel_at_period_end)
GET    /api/subscriptions/me              -- current user's subscription status
POST   /api/webhooks/paystack             -- Paystack webhook handler (signature verified)
```

### 15.6 Team
```
POST   /api/team/invite                   -- owner invites member (sends email)
POST   /api/team/accept/[token]           -- accept team invite
DELETE /api/team/members/[profileId]      -- owner removes a team member
GET    /api/team/members                  -- list team members (owner only)
```

### 15.7 Notifications
```
GET    /api/notifications                 -- user's notifications (paginated, unread first)
PATCH  /api/notifications/read-all        -- mark all as read
PATCH  /api/notifications/[id]/read       -- mark single as read
```

### 15.8 Categories
```
GET    /api/categories                    -- public: list all active categories
POST   /api/categories                    -- admin only
PATCH  /api/categories/[id]              -- admin only
```

### 15.9 Admin
```
GET    /api/admin/creators                -- list creators
POST   /api/admin/creators               -- create creator
PATCH  /api/admin/creators/[id]          -- update creator
GET    /api/admin/users                  -- list users with subscription status
GET    /api/admin/analytics              -- basic stats
```

---

## 16. Storage Structure

Supabase Storage buckets (function-named, no brand name):

```
resource-files/          -- PRIVATE bucket (signed URLs only)
  {creator_id}/
    {resource_id}/
      {filename}

resource-previews/       -- PUBLIC bucket (CDN-served)
  {resource_id}/
    primary.{ext}
    preview-1.{ext}
    preview-2.{ext}
    ...

avatars/                 -- PUBLIC bucket
  {profile_id}.{ext}

creator-avatars/         -- PUBLIC bucket
  {creator_id}.{ext}
```

**Bucket policies:**
- `resource-files` — no public access; all downloads go through signed URLs issued by the API (entitlement checked first)
- `resource-previews` — public read; these are just preview images, no gating needed
- `avatars`, `creator-avatars` — public read

---

## 17. Paystack Integration Model

### 17.1 Why Paystack (and not Stripe)
Paystack is the confirmed processor. Stripe does not directly support Nigerian merchant accounts — using it would require forming a foreign entity and routing payouts through a virtual USD account. Paystack (owned by Stripe since 2020) is its native Nigerian arm: it accepts Verve, Mastercard, Visa, bank transfers, USSD, and mobile money, settles directly to a Nigerian bank account, and supports recurring subscription billing — exactly this product's model.

### 17.2 Plans Setup (done once in Paystack dashboard)
Create plans in Paystack for each billing option:
- `personal_monthly` — NGN X / month
- `personal_annual` — NGN X × 10 / year (2 months free)
- `team_monthly` — NGN A / month
- `team_annual` — NGN A × 10 / year (2 months free)

Each plan gets a Paystack plan code (e.g. `PLN_xxx`). These codes are stored in environment variables, not in the DB.

### 17.3 Checkout Flow
1. User selects a plan → frontend calls `POST /api/subscriptions/checkout`
2. Server calls Paystack `POST /transaction/initialize` with the plan code, customer email, and a metadata payload `{ userId, planType }`
3. Paystack returns `authorization_url`
4. Server returns `{ checkoutUrl: authorization_url }` to client
5. Client redirects to Paystack hosted page
6. User completes payment on Paystack
7. Paystack redirects to our `callback_url` (e.g. `/subscription/success`)
8. **Do not** trust the callback URL params to confirm payment — wait for the webhook

### 17.4 Webhook Handler
`POST /api/webhooks/paystack`

**Verification:** Every incoming request must have its `x-paystack-signature` header verified against the HMAC-SHA512 hash of the raw request body using the Paystack secret key. Reject if signature invalid.

**Idempotency:** Before processing, check `subscription_events` table for existing record with same `paystack_ref`. If found, return 200 and skip processing (already handled).

**Events handled:**
| Event | Action |
|-------|--------|
| `charge.success` | If first charge: activate subscription, set `current_period_start/end`. Log to `subscription_events`. Send `subscription_activated` notification. |
| `invoice.payment_success` | Renewal: update `current_period_start/end`. Log event. Send `subscription_renewed` notification. |
| `invoice.payment_failed` | Set `status = 'past_due'`. Log event. Send `payment_failed` notification. |
| `subscription.disable` | Set `status = 'cancelled'`, set `cancelled_at`. Log event. Send `subscription_cancelled` notification. |
| `subscription.not_renew` | Informational. Log event. |

### 17.5 Entitlement Check
```typescript
// lib/entitlement.ts
async function getUserEntitlement(userId: string): Promise<{
  entitled: boolean
  subscription: Subscription | null
  reason?: 'no_subscription' | 'expired' | 'past_due' | 'cancelled'
}>
```

This function is called in every download handler. It queries the `subscriptions` table for an active subscription owned by the user, or a team subscription where the user is an active member.

---

## 18. Email & Notification Strategy

### 18.1 Trigger Points
Notifications are created in two ways:
1. **Webhook-triggered:** Paystack events → webhook handler → creates notification record + sends email
2. **Action-triggered:** User actions (team invite, etc.) → server action → creates notification + sends email

### 18.2 Email Templates (React Email)
One React Email component per notification type:
- `WelcomeEmail`
- `SubscriptionActivatedEmail`
- `SubscriptionRenewedEmail`
- `RenewalReminderEmail`
- `PaymentFailedEmail`
- `SubscriptionCancelledEmail`
- `TeamInviteEmail`
- `NewResourcesDigestEmail`

All email templates read the product name from the central config constant (Section 19.3) — never hardcode the brand.

### 18.3 Resend Setup
- Domain: `joincreatly.com`, verified in Resend
- API key in environment variables (server-side only)
- All email sends are fire-and-forget (do not block the user response on email delivery)
- Errors in email sending are logged to Sentry but do not fail the primary operation

---

## 19. Architecture & Conventions

### 19.1 Folder Structure
```
/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── signup/
│   │   └── reset-password/
│   ├── (marketing)/
│   │   ├── page.tsx                  -- landing page
│   │   ├── pricing/
│   │   └── about/
│   ├── (app)/
│   │   ├── browse/                   -- catalogue
│   │   ├── resources/[slug]/         -- resource detail
│   │   ├── dashboard/
│   │   │   ├── page.tsx              -- dashboard home
│   │   │   ├── downloads/
│   │   │   ├── favourites/
│   │   │   ├── profile/
│   │   │   ├── account/
│   │   │   ├── notifications/
│   │   │   └── team/
│   │   └── subscription/
│   │       ├── success/
│   │       └── cancelled/
│   ├── admin/
│   │   ├── resources/
│   │   ├── creators/
│   │   ├── categories/
│   │   └── users/
│   └── api/
│       ├── downloads/[resourceId]/
│       ├── favourites/[resourceId]/
│       ├── subscriptions/
│       ├── webhooks/paystack/
│       ├── notifications/
│       ├── categories/
│       └── admin/
├── components/
│   ├── ui/                           -- shadcn components (do not edit directly)
│   ├── resource/                     -- ResourceCard, ResourceGrid, ResourceDetail
│   ├── auth/                         -- LoginForm, SignupForm
│   ├── dashboard/                    -- DashboardNav, NotificationBell
│   ├── admin/                        -- AdminNav, ResourceUploadForm
│   └── shared/                       -- Logo, Navbar, Footer, UpgradePrompt
├── lib/
│   ├── config.ts                     -- APP_NAME ("Creatly"), domain, support email
│   ├── supabase/
│   │   ├── client.ts                 -- browser client
│   │   ├── server.ts                 -- server client (cookies)
│   │   └── admin.ts                  -- service role client (webhook handler only)
│   ├── paystack/
│   │   ├── client.ts                 -- Paystack API wrapper
│   │   └── verify-webhook.ts         -- HMAC verification
│   ├── resend/
│   │   └── send-email.ts
│   ├── entitlement.ts                -- getUserEntitlement()
│   ├── download.ts                   -- createDownloadRecord() + getSignedUrl()
│   └── validations/                  -- Zod schemas
│       ├── resource.ts
│       ├── subscription.ts
│       └── auth.ts
├── types/
│   └── database.ts                   -- All DB types (single source of truth)
├── emails/                           -- React Email templates
├── CONVENTIONS.md
└── .env.local (never committed)
```

### 19.2 CONVENTIONS.md Summary
A full `CONVENTIONS.md` is produced separately. Key rules:
- **No `any` in TypeScript** — ever
- **All DB interactions go through server-side Supabase client** — never the browser client for writes or authenticated data
- **Zod validates all route handler inputs** before any DB operation
- **Every route handler returns typed responses** — use a standard `ApiResponse<T>` wrapper
- **Error handling:** all route handlers wrapped in try/catch; errors logged to Sentry; client receives sanitised error messages only
- **No hardcoded strings** for plan types, notification types, statuses — use `const` enums in `types/database.ts`
- **Database column naming:** `snake_case` — TypeScript property naming: `camelCase` — types file handles the mapping
- **Environment variables:** all in `.env.local`, typed in `env.ts` using `zod.parse` at startup — app fails to start if required vars are missing

### 19.3 Brand Name Convention

The platform is **Creatly** (domain **joincreatly.com**). Even though the name is now final, the brand still lives in one place so any future rebrand is trivial and the data layer stays brand-agnostic. Rules:

1. **One source of truth for the name.** The product name lives in a single constant:
   ```typescript
   // lib/config.ts
   export const APP_NAME = "Creatly";
   export const APP_TAGLINE = "Creative resources for African creatives";
   export const APP_DOMAIN = "joincreatly.com";
   export const SUPPORT_EMAIL = "hello@joincreatly.com";
   ```
2. **Never hardcode the brand name** in components, pages, email templates, metadata, or copy. Every reference imports `APP_NAME` from config. Page titles, OG tags, email "from" names, nav logos — all read from config.
3. **No brand name in the data layer.** Table names, column names, schema names, and storage bucket names are **function-named only** (`resources`, `downloads`, `resource-files`). A rename never touches the database or storage — confirmed throughout Sections 14 and 16.
4. **No brand name in the repo name or package name** that can't be trivially changed. The npm `package.json` name uses a neutral placeholder; renaming the repo later is cosmetic.
5. **Domain and email** are environment-configured, not hardcoded — swapping the domain is an env change, not a code change.

Result: any future rebrand is: update `APP_NAME` (and tagline/email), point the new domain in env vars, swap the logo asset. No migration. No find-and-replace across the codebase.

---

## 20. Build Sequence & Phase Breakdown

### Phase 1 — Buyer Foundation
**Goal:** Working catalogue with authentication, browse, search, favourites, and gated download mechanic.

| Step | What | Key files |
|------|------|-----------|
| 1.1 | Project setup: Next.js 15, TypeScript strict, Tailwind 4, shadcn/ui, pnpm, `lib/config.ts` (APP_NAME = "Creatly") | `package.json`, `tsconfig.json`, `tailwind.config.ts`, `lib/config.ts` |
| 1.2 | Supabase setup: project, DB schema (all tables), RLS policies, Storage buckets | `supabase/migrations/` |
| 1.3 | Auth: signup, login, logout, email verify, password reset | `app/(auth)/`, `lib/supabase/` |
| 1.4 | Catalogue: browse page, ResourceCard, ResourceGrid, pagination | `app/(app)/browse/` |
| 1.5 | Search & filters: keyword search, category filter, sort, tag filter | `app/(app)/browse/` |
| 1.6 | Resource detail page: metadata, preview gallery, creator info, download CTA | `app/(app)/resources/[slug]/` |
| 1.7 | Favourites: toggle endpoint, favourites list | `api/favourites/`, `app/dashboard/favourites/` |
| 1.8 | Download mechanic: entitlement check → log → signed URL → client trigger | `api/downloads/`, `lib/entitlement.ts`, `lib/download.ts` |

### Phase 2 — Payments & Entitlements
| Step | What |
|------|------|
| 2.1 | Paystack plan setup (annual = monthly × 10) + environment config |
| 2.2 | Pricing page (shows 2-months-free annual saving) |
| 2.3 | Checkout flow (Paystack redirect) |
| 2.4 | Webhook handler (all events, idempotent) |
| 2.5 | Team plan: invite flow, seat management |
| 2.6 | Subscription status page in dashboard |
| 2.7 | Payment history page |

### Phase 3 — User Dashboard
| Step | What |
|------|------|
| 3.1 | Dashboard layout and navigation |
| 3.2 | Dashboard home (quick links, recent downloads, favourites) |
| 3.3 | Download history page |
| 3.4 | Profile page (edit name, avatar upload) |
| 3.5 | Account page (subscription status, upgrade CTA) |
| 3.6 | Notification centre (in-app list, mark read) |
| 3.7 | Notification preferences |
| 3.8 | Help/support page |

### Phase 4 — Admin Seed Tool
| Step | What |
|------|------|
| 4.1 | Admin route group with role protection |
| 4.2 | Creator management (CRUD) |
| 4.3 | Category management |
| 4.4 | Resource upload form (with file + preview upload to Storage) |
| 4.5 | Resource management (list, edit, publish/archive) |
| 4.6 | Basic analytics view |

### Phase 5 — Creator Dashboard (Phase 2)
Detailed breakdown in Phase 2 PRD addendum.

---

*End of Creatly V1 PRD — Version 1.2*
