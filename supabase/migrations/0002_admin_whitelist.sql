-- Admin whitelist for manual admin bootstrap (2A)

create table if not exists public.admin_whitelist (
  email text primary key,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

alter table public.admin_whitelist enable row level security;

-- Authenticated users can only see their own whitelist row.
create policy "admin_whitelist_select_self" on public.admin_whitelist
for select to authenticated
using (lower(email) = lower((auth.jwt() ->> 'email')));

-- Service role should handle inserts/updates in production ops.

-- Example bootstrap:
-- insert into public.admin_whitelist (email, note)
-- values ('you@company.com', 'initial admin');
