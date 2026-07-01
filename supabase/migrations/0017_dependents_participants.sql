-- 0017 — Participantes por reserva: dependientes reutilizables + roster congelado
--
-- Contexto: muchas compras son de varios boletos (p. ej. un papá que paga por sus
-- hijos). El nº de personas ya lo maneja reservations.num_people (cobro por N y
-- cupo por N). Falta poder GUARDAR el perfil de cada participante y REUTILIZARLO.
-- Decisión (Luis, 1 jul 2026): el titular firma UN solo deslinde por todo el grupo;
-- capturar cada perfil es OPCIONAL (nunca bloquea el pago ni la firma).
--
-- Dos piezas, mismo patrón "vivo vs. congelado" que 0008:
--   dependents             — perfil VIVO reutilizable de un acompañante, propiedad
--                            del contacto titular (su "guardián"). Editable. NO es
--                            un contact (no ensucia el CRM ni Notion).
--   registrations.participants — roster CONGELADO al firmar (rastro legal), array
--                            con la foto de cada participante y su médico declarado.
--
-- Privacidad (LFPDPPP): los datos médicos de dependents y del snapshot son sensibles
-- y JAMÁS se sincronizan a Notion (igual que medical_profiles / medical_snapshot).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · DEPENDENTS — perfil de seguridad reutilizable de un acompañante (N:1 guardián)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.dependents (
  id uuid primary key default gen_random_uuid(),
  guardian_contact_id uuid not null references public.contacts(id) on delete cascade,
  full_name text not null,
  birth_date date,
  relationship text,                -- hijo/a, sobrino/a, pareja, acompañante…
  -- médico / seguridad en campo (mismos nombres que medical_profiles)
  blood_type text,
  conditions text,
  medications text,
  allergies text,
  dietary_restrictions text,
  fitness_notes text,
  -- contacto de emergencia
  emergency_name text,
  emergency_relationship text,
  emergency_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dependents_guardian_idx
  on public.dependents (guardian_contact_id);

drop trigger if exists dependents_set_updated_at on public.dependents;
create trigger dependents_set_updated_at
  before update on public.dependents
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · REGISTRATIONS.participants — roster congelado al firmar. Solo esquema
--     (ALTER es DDL: el trigger de inmutabilidad bloquea UPDATE/DELETE de FILAS,
--     no el ADD COLUMN). Filas viejas quedan con '[]'.
--     Forma: [{dependent_id, full_name, birth_date, relationship, medical_snapshot}]
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.registrations
  add column if not exists participants jsonb not null default '[]'::jsonb;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · RLS — el titular ve/edita solo los dependientes cuyo guardián es SU contact
--     (espejo de medical_profiles_select_own). Escrituras del flujo = service-role
--     (bypass RLS); sin policies de insert/update/delete.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.dependents enable row level security;

drop policy if exists "dependents_select_own" on public.dependents;
create policy "dependents_select_own" on public.dependents
  for select to authenticated
  using (
    exists (
      select 1 from public.contacts c
      where c.id = dependents.guardian_contact_id
        and c.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTA operativa:
--   submitRegistration → por cada participante: dedupe por (guardián, nombre) →
--   insert/update en dependents (perfil vivo) → snapshot al array participants de
--   la registración (congelado). El nº de lugares lo fija el pago (num_people),
--   NO el conteo de participantes: capturarlos es opcional.
-- ─────────────────────────────────────────────────────────────────────────────
