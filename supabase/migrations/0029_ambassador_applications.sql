-- 0029 · PROGRAMA DE EMBAJADORES — aplicaciones curadas (23 jul 2026)
--
-- Un EMBAJADOR es un creador / agencia individual / líder de comunidad que
-- vende salidas a su audiencia y gana el 30% de la utilidad neta (hoja de
-- costeo por experiencia). El programa es CURADO: se entra por aplicación con
-- selección manual. Esta tabla guarda las aplicaciones; al APROBAR, el admin
-- da de alta al embajador como fila de `operators` (mismo sistema de
-- atribución de ventas con comisión congelada de la 0016) y se guarda el
-- vínculo en `operator_id`.
--
-- SOLO ADITIVA. Namespace caminante. RLS habilitado SIN policies (los inserts
-- del formulario público y las lecturas del admin pasan por service-role).

create table if not exists public.ambassador_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  whatsapp text,
  -- perfil del aplicante (cerrado): creador | agencia | comunidad
  profile_kind text not null check (profile_kind in ('creador', 'agencia', 'comunidad')),
  -- links de redes + tamaño de audiencia, texto libre (curaduría manual)
  social_links text not null,
  -- experiencia organizando viajes o grupos
  experience text,
  -- por qué caminante
  why_caminante text,
  -- cómo nos conociste
  referral_source text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  -- al aprobar: el operador creado (atribución de ventas 0016 + perfil 0020)
  operator_id uuid references public.operators (id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

-- Una aplicación viva por correo (histórico permitido: puede re-aplicar tras
-- un rechazo, pero no duplicar una pendiente).
create unique index if not exists ambassador_applications_pending_email_idx
  on public.ambassador_applications (lower(email))
  where status = 'pending';

create index if not exists ambassador_applications_status_idx
  on public.ambassador_applications (status);

alter table public.ambassador_applications enable row level security;
