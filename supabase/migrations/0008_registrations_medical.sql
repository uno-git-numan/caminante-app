-- 0008 — Perfil médico reutilizable + snapshot legal inmutable de registro
--
-- Contexto: el registro/deslinde de cada viaje se firma EN LA PLATAFORMA
-- (/caminante/registro/[slug]); reemplaza al flujo de Google Forms (regla de
-- sistema limpio: el legacy se elimina cuando esto esté en producción).
--
-- Dos piezas:
--   medical_profiles  — el perfil "vivo" que la plataforma recuerda (1:1 contact).
--                       Existe SOLO para quien se registra a una experiencia; los
--                       contactos de newsletter no lo tienen (LEFT JOIN, no error).
--   registrations     — la foto congelada de lo que la persona declaró AL FIRMAR
--                       (rastro legal probatorio). APPEND-ONLY de verdad: trigger
--                       que bloquea UPDATE/DELETE incluso al service-role.
--
-- Reglas de privacidad (LFPDPPP):
--   - Datos médicos = sensibles. Viven aquí y JAMÁS se sincronizan a Notion.
--   - medical_snapshot dentro de registrations también es sensible: ninguna
--     query de UI/API pública debe hacer select * de registrations.
--
-- Mailing (decisión de arquitectura): Supabase es la fuente de verdad de la
-- audiencia (opt-in/opt-out); Notion es la vista CRM. Las bajas son sagradas:
-- si mailing_unsubscribed_at tiene valor, NADA lo reactiva salvo el propio
-- usuario re-suscribiéndose explícitamente.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · CONTACTS — columnas nuevas (identidad no sensible + bajas de mailing)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.contacts
  add column if not exists birth_date date,
  add column if not exists mailing_unsubscribed_at timestamptz;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · MEDICAL_PROFILES — perfil de seguridad reutilizable (1:1 contact)
--     Bloque aseguradora incluido desde ya (pólizas colectivas de accidentes
--     para ecoturismo piden: sexo, CURP/ID, nacionalidad y BENEFICIARIO).
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.medical_profiles (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null unique references public.contacts(id) on delete cascade,
  -- médico / seguridad en campo
  blood_type text,
  conditions text,                -- enfermedades / padecimientos actuales
  medications text,               -- medicamentos de uso periódico
  allergies text,
  dietary_restrictions text,
  fitness_notes text,             -- condición física, lesiones, nivel de nado, etc.
  -- contacto de emergencia
  emergency_name text,
  emergency_relationship text,
  emergency_phone text,
  -- bloque aseguradora (todos opcionales hasta que haya póliza contratada)
  gender text,
  curp text,
  nationality text,
  government_id text,             -- pasaporte / INE si falta CURP o es extranjero
  occupation text,
  beneficiary_name text,          -- crítico: sin beneficiario, la indemnización va a sucesión legal
  beneficiary_relationship text,
  beneficiary_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists medical_profiles_set_updated_at on public.medical_profiles;
create trigger medical_profiles_set_updated_at
  before update on public.medical_profiles
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · REGISTRATIONS — snapshot probatorio congelado al firmar. APPEND-ONLY.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id),
  contact_id uuid not null references public.contacts(id),
  -- denormalizado a propósito: el snapshot no debe depender de joins futuros
  experience_id uuid not null references public.experiences(id),
  waiver_version text not null,
  waiver_doc_url text,
  signature_name text not null,        -- nombre completo tecleado como firma
  signed_at timestamptz not null default now(),
  waiver_accepted boolean not null check (waiver_accepted),
  privacy_consent boolean not null check (privacy_consent),
  image_consent boolean not null default false,
  newsletter_opt_in boolean not null default false,
  minors jsonb not null default '[]'::jsonb,    -- [{name, age, relationship}]
  medical_snapshot jsonb not null,     -- copia congelada de lo declarado (sensible)
  identity_snapshot jsonb not null,    -- nombre, nacimiento, correo, tel, ciudad, salida
  created_at timestamptz not null default now()
);

create index if not exists registrations_contact_idx
  on public.registrations (contact_id);
create index if not exists registrations_reservation_idx
  on public.registrations (reservation_id);
-- una firma por persona × reserva × versión del deslinde (doble submit = no-op;
-- re-firma legítima = nueva versión = nueva fila, queda historial)
create unique index if not exists registrations_once_per_version
  on public.registrations (reservation_id, contact_id, waiver_version);

-- Inmutabilidad REAL: el service-role hace bypass de RLS, pero un trigger no se
-- puede saltar. Corregir un error = editar medical_profiles (perfil vivo) y, si
-- importa legalmente, re-firmar con nueva versión. La fila firmada nunca se toca.
create or replace function public.forbid_registration_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'registrations es append-only (rastro legal probatorio): ni UPDATE ni DELETE';
end $$;

drop trigger if exists registrations_immutable on public.registrations;
create trigger registrations_immutable
  before update or delete on public.registrations
  for each row execute function public.forbid_registration_mutation();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · RLS — lectura solo del dueño (vía su contact ligado); escrituras solo
--     service-role (sin policies de insert/update/delete).
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.medical_profiles enable row level security;
alter table public.registrations enable row level security;

drop policy if exists "medical_profiles_select_own" on public.medical_profiles;
create policy "medical_profiles_select_own" on public.medical_profiles
  for select to authenticated
  using (
    exists (
      select 1 from public.contacts c
      where c.id = medical_profiles.contact_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "registrations_select_own" on public.registrations;
create policy "registrations_select_own" on public.registrations
  for select to authenticated
  using (
    exists (
      select 1 from public.contacts c
      where c.id = registrations.contact_id
        and c.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTA operativa:
--   registro web → findOrCreateContact (dedupe user_id → email → teléfono,
--   enriquecer solo vacíos) → upsert medical_profiles → reserva confirmed
--   (nunca retroceder status) → insert registrations (snapshot congelado) →
--   notion_sync_log action='registered' con payload SOLO comercial.
-- ─────────────────────────────────────────────────────────────────────────────
