-- 0018 · Solicitar nueva fecha + salidas privadas por link
-- A) experience_slots gana visibilidad: 'public' (default, todo lo existente) o
--    'private' (solo visible/pagable con su access_token — link cerrado de grupo).
--    El token lo genera la APP solo para privados (crypto.randomBytes(16).base64url);
--    no hay default en SQL a propósito.
-- B) slot_requests: solicitudes de fecha nueva hechas por clientes desde la web.
--    El admin las aprueba (crea la salida real) o rechaza desde el panel.
-- 100% aditiva: no toca datos ni comportamiento existente.

-- A · Visibilidad + token en experience_slots
alter table public.experience_slots
  add column if not exists visibility text not null default 'public'
    check (visibility in ('public','private')),
  add column if not exists access_token text unique;

alter table public.experience_slots
  add constraint experience_slots_private_needs_token
    check (visibility = 'public' or access_token is not null);

-- B · Solicitudes de nueva fecha
create table if not exists public.slot_requests (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  desired_date date,          -- fecha exacta deseada (opcional)
  nota text,                  -- texto libre ("fechas flexibles…") (opcional)
  num_people integer not null check (num_people >= 1),
  group_type text not null default 'private' check (group_type in ('private','open')),
  status text not null default 'new' check (status in ('new','approved','rejected')),
  created_slot_id uuid references public.experience_slots(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  -- al menos una señal de cuándo quiere salir
  constraint slot_requests_fecha_o_nota check (desired_date is not null or nota is not null)
);

create index if not exists slot_requests_status_idx
  on public.slot_requests (status, created_at desc);
create index if not exists slot_requests_experience_idx
  on public.slot_requests (experience_id);

-- Sin policies: solo el service-role (server actions) lee/escribe.
alter table public.slot_requests enable row level security;
