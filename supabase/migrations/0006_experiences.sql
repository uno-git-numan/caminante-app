-- Experiences: the data-driven source for every experience page, the landing grid,
-- and the calendar. One row per experience. The rich content (template + four lenses)
-- lives in `data` (JSONB), matching the Experience TypeScript type. Scalar columns
-- (slug, status) are kept out for indexing/filtering.
--
-- Writes go through the service-role admin client (bypasses RLS). Public users can
-- read only published experiences.

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.experiences enable row level security;

drop policy if exists "experiences_public_read_published" on public.experiences;
create policy "experiences_public_read_published"
  on public.experiences
  for select
  to anon, authenticated
  using (status = 'published');

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists experiences_set_updated_at on public.experiences;
create trigger experiences_set_updated_at
  before update on public.experiences
  for each row execute function public.set_updated_at();
