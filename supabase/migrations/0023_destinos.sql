-- 0023 · Destinos data-driven
-- Contenido editorial de las páginas de destino por estado. Antes eran HTML
-- estáticos (public/landing/destinos/*.html) con rewrite manual por estado; ahora
-- la ruta dinámica /caminante/destinos/[estado] lee de aquí. La lista de
-- experiencias de cada destino ya era dinámica (exp-grid.js filtra por estado);
-- esto agrega el contenido editorial (hero, territorio, 4 caras, galería,
-- destacada, cierre) en un jsonb flexible. Un estado sin fila → fallback válido
-- en el template (hero + grilla + cierre), nunca 404.

create table if not exists public.destinos (
  id uuid primary key default gen_random_uuid(),
  estado text not null,                 -- canónico, p. ej. "Baja California Sur"
  slug text not null unique,            -- p. ej. "baja-california-sur"
  is_published boolean not null default false,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lectura pública SOLO de destinos publicados (el código admin usa service-role,
-- que salta RLS). Mismo patrón que operators.
alter table public.destinos enable row level security;

drop policy if exists destinos_public_read on public.destinos;
create policy destinos_public_read on public.destinos
  for select using (is_published = true);
