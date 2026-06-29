-- Share count tracking on resources
alter table public.resources
  add column if not exists share_count integer not null default 0;

-- RPC to safely increment share_count (avoids race conditions vs client update)
create or replace function public.increment_share_count(p_resource_id uuid)
returns void
language sql
security definer
as $$
  update public.resources
  set share_count = share_count + 1
  where id = p_resource_id;
$$;
