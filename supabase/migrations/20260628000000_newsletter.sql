-- ============================================================
-- Newsletter subscribers table
-- Anyone can insert (public subscribe); only admins can read.
-- ============================================================

create table public.newsletter_subscribers (
  id         uuid        primary key default gen_random_uuid(),
  email      text        unique not null,
  source     text        not null default 'footer',  -- footer | landing | pricing
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

-- Public insert: anyone can subscribe (no auth required)
create policy "newsletter_subscribers: public insert"
  on public.newsletter_subscribers
  for insert
  with check (true);

-- Admin read: only admins can list subscribers
create policy "newsletter_subscribers: admin select"
  on public.newsletter_subscribers
  for select
  using (public.is_admin());
