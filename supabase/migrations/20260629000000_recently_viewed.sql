-- Recently viewed resources per user (last 10 entries enforced at app level)
create table public.recently_viewed (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  resource_id uuid not null references public.resources on delete cascade,
  viewed_at   timestamptz not null default now(),
  unique (user_id, resource_id)
);

alter table public.recently_viewed enable row level security;

create policy "owner" on public.recently_viewed
  for all using (auth.uid() = user_id);

-- Index for efficient per-user ordered lookups
create index recently_viewed_user_viewed_at_idx
  on public.recently_viewed (user_id, viewed_at desc);
