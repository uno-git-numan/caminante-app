-- 0007 — Reserva de experiencia-directa + puente al CRM de Notion
--
-- Contexto: el CRM de ventas vive en NOTION (3 bases: All Clients, Trip Pipeline, Trips).
-- Supabase es el sistema TRANSACCIONAL del sitio (cuentas, experiencias, reservas, pagos)
-- y ALIMENTA el CRM de Notion vía un sync de eventos. Por eso cada fila relevante guarda
-- el puntero (`notion_*_url`) a su página de Notion, para que el sync sea idempotente.
--
-- Mapeo Supabase ↔ Notion:
--   contacts                      ↔  All Clients   (maestro de personas)
--   experiences + experience_slots↔  Trips         (oferta + fechas/cupo)
--   reservations                  ↔  Trip Pipeline (journey persona × viaje)
--   payments (libro de abonos)    →  Pipeline.Payment Amount / Deposit Paid + rollups
--
-- Decisiones (ver "Caminante · Arquitectura de Plataforma" en Notion):
--   - Experiencia-directa; marketplace de trips dormido.
--   - Reserva SIN login (se ata a un contact por correo; user_id si se registra).
--   - El seguimiento (Follow-up Notes, Next Follow-up) vive en NOTION, no en Supabase.
--
-- Patrón de acceso: lecturas públicas mínimas; TODA escritura vía service-role.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · CONTACTS — espejo local del maestro de personas (All Clients en Notion)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  phone text,
  city text,
  instagram text,
  -- 'How they found us' en Notion (Website / Instagram / WhatsApp / …)
  source text,
  lifecycle_stage text not null default 'lead'
    check (lifecycle_stage in ('lead', 'subscriber', 'customer')),
  user_id uuid references auth.users(id) on delete set null,
  -- 'Mailing opt-in' en Notion
  mailing_opt_in boolean not null default false,
  tags jsonb not null default '[]'::jsonb,   -- ["VIP","Repeat","Mailing list",…]
  -- puente al CRM
  notion_page_url text,                       -- página en All Clients
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists contacts_email_unique
  on public.contacts (lower(email));
create index if not exists contacts_user_id_idx on public.contacts (user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · EXPERIENCE_SLOTS — cada fecha de salida con su cupo
--     "cuántos lugares quedan" = seats_available (columna generada)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.experience_slots (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  -- etiqueta legible que mapea al select 'Fecha' del Trip Pipeline (ej. "Jun 12-15")
  label text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity_total integer not null check (capacity_total >= 0),
  seats_taken integer not null default 0 check (seats_taken >= 0),
  price_mxn numeric(12,2),             -- null = usa precio base de la experiencia
  status text not null default 'open'
    check (status in ('open', 'closed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experience_slots_seats_within_capacity
    check (seats_taken <= capacity_total),
  seats_available integer generated always as (capacity_total - seats_taken) stored
);

create index if not exists experience_slots_experience_idx
  on public.experience_slots (experience_id, starts_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · RESERVATIONS — la reserva (mapea a una entrada de Trip Pipeline en Notion)
-- ─────────────────────────────────────────────────────────────────────────────
drop type if exists public.reservation_status cascade;
create type public.reservation_status as enum (
  'requested',        -- pedida, sin pago        → Notion: Interested
  'confirmed',        -- confirmada, sin pago     → Notion: Committed
  'partially_paid',   -- anticipo recibido        → Notion: Paid (Deposit Paid)
  'paid',             -- pagada completa          → Notion: Paid / Confirmed
  'cancelled',        --                          → Notion: Cancelled
  'completed'         -- experiencia vivida       → Notion: Attended
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id),
  slot_id uuid references public.experience_slots(id),
  contact_id uuid not null references public.contacts(id),
  num_people integer not null default 1 check (num_people > 0),
  total_amount_mxn numeric(12,2) not null default 0 check (total_amount_mxn >= 0),
  status public.reservation_status not null default 'requested',
  channel text not null default 'web'
    check (channel in ('web', 'whatsapp', 'email', 'admin')),
  notes text,
  -- puente al CRM
  notion_pipeline_url text,            -- entrada en Trip Pipeline
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reservations_contact_idx on public.reservations (contact_id);
create index if not exists reservations_slot_idx on public.reservations (slot_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · PAYMENTS — libro de abonos de una reserva (experiencia-directa)
--     Saldo de una reserva = total_amount_mxn − Σ payments con status='paid'
--     (La tabla `payments` del marketplace 0001 nunca se creó en esta base, así
--      que aquí se crea desde cero, atada a reservations — sin dependencia de trips.)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  contact_id uuid references public.contacts(id),
  amount_mxn numeric(12,2) not null check (amount_mxn >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  method text,                         -- 'stripe' | 'transfer' | 'cash' | …
  provider_ref text,                   -- id de Stripe (payment intent / link)
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists payments_provider_ref_unique
  on public.payments (provider_ref) where provider_ref is not null;
create index if not exists payments_reservation_idx on public.payments (reservation_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · EXPERIENCES — puente al catálogo de viajes del CRM (Trips en Notion)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.experiences
  add column if not exists notion_trip_url text;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6 · NOTION_SYNC_LOG — backbone del sync plataforma → Notion (idempotencia + retries)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.notion_sync_log (
  id uuid primary key default gen_random_uuid(),
  entity text not null,                -- 'contact' | 'reservation' | 'payment'
  entity_id uuid not null,
  action text not null,                -- 'lead' | 'interested' | 'paid' | 'cancelled' | …
  notion_url text,                     -- página de Notion afectada
  status text not null default 'pending'
    check (status in ('pending', 'synced', 'error')),
  error text,
  payload jsonb,
  created_at timestamptz not null default now(),
  synced_at timestamptz
);

create index if not exists notion_sync_log_pending_idx
  on public.notion_sync_log (status, created_at) where status = 'pending';
create index if not exists notion_sync_log_entity_idx
  on public.notion_sync_log (entity, entity_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7 · updated_at automático (reusa public.set_updated_at() del 0006)
-- ─────────────────────────────────────────────────────────────────────────────
drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

drop trigger if exists experience_slots_set_updated_at on public.experience_slots;
create trigger experience_slots_set_updated_at
  before update on public.experience_slots
  for each row execute function public.set_updated_at();

drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at
  before update on public.reservations
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 8 · RLS — lecturas públicas mínimas; escrituras vía service-role
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.contacts enable row level security;
alter table public.experience_slots enable row level security;
alter table public.reservations enable row level security;
alter table public.payments enable row level security;
alter table public.notion_sync_log enable row level security;

-- CONTACTS: PII. Solo el dueño de su propia fila. (alta de newsletter/lead = service-role)
create policy "contacts_select_own" on public.contacts
  for select to authenticated
  using (user_id = auth.uid());

-- EXPERIENCE_SLOTS: cupos visibles públicamente (mostrar disponibilidad).
create policy "experience_slots_public_read" on public.experience_slots
  for select to anon, authenticated
  using (status <> 'cancelled');

-- RESERVATIONS: el usuario logueado ve sus reservas (vía su contact vinculado).
create policy "reservations_select_own" on public.reservations
  for select to authenticated
  using (
    exists (
      select 1 from public.contacts c
      where c.id = reservations.contact_id
        and c.user_id = auth.uid()
    )
  );

-- PAYMENTS: el usuario logueado ve sus pagos (vía reserva → contact vinculado).
create policy "payments_select_own" on public.payments
  for select to authenticated
  using (
    exists (
      select 1
      from public.reservations r
      join public.contacts c on c.id = r.contact_id
      where r.id = payments.reservation_id
        and c.user_id = auth.uid()
    )
  );

-- NOTION_SYNC_LOG: solo interno (service-role). Sin policy pública.

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTA operativa (capa app / sync, todo vía service-role):
--   newsletter  → upsert contacts(mailing_opt_in=true) → upsert All Clients
--   lead/interés→ crea/actualiza reservation → entrada Trip Pipeline (Lead/Interested)
--   pago Stripe → inserta payments; recalcula reservation.status; Pipeline=Paid +
--                 Deposit Paid/Payment Amount/Method/Date; rollups en Trips y All Clients
--   REGLA: el sync nunca mueve un Pipeline.Status HACIA ATRÁS (ventas manda en lo manual);
--          la plataforma solo avanza estados que ella origina o actualiza campos de pago.
-- ─────────────────────────────────────────────────────────────────────────────
