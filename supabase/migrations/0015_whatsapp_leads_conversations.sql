-- 0015 — WhatsApp como puerta de entrada: leads, conversaciones, mensajes, engagement
--
-- Contexto: el número nuevo de Caminante entra al WhatsApp Cloud API. TODO mensaje
-- (entrante/saliente) pasa por el webhook de la app → se guarda aquí. Esta es la capa
-- de la "mitad de adelante" del funnel (antes de que exista una reserva), y la misma
-- que el bot de WhatsApp usará: hoy auto-acknowledge + captura; mañana cerebro Claude.
--
-- Privacidad (LFPDPPP): conversations/messages/engagement_events son OPERATIVOS y
-- NUNCA entran a notion_sync_log. Solo se sincroniza lo comercial (lead → Trip Pipeline).
--
-- Aplicar a mano en el SQL Editor (no hay CLI). Idempotente.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · CONTACTS — phone-first. Un lead de WhatsApp no trae correo: email pasa a NULLABLE.
--     (El registro web sigue exigiendo correo en el form; esto solo PERMITE phone-only.)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.contacts alter column email drop not null;

alter table public.contacts
  add column if not exists wa_phone text,              -- E.164 normalizado (id de WhatsApp)
  add column if not exists whatsapp_opt_in_at timestamptz, -- consentimiento (legalmente relevante)
  add column if not exists interest_score integer not null default 0; -- rollup de engagement_events

create index if not exists contacts_wa_phone_idx on public.contacts (wa_phone);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · LEADS — "esta persona está interesada en (esta) experiencia" ANTES de reservar.
--     Mapea a una entrada de Trip Pipeline (Lead/Interested) vía notion_sync_log.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  experience_id uuid references public.experiences(id),   -- null hasta que se sepa cuál
  slot_id uuid references public.experience_slots(id),
  source text not null default 'whatsapp',                -- 'ctwa'|'ig_dm'|'wa_link'|'broadcast'|'web'|'referral'
  ctwa_clid text,                                         -- click id de anuncios CTWA (atribución)
  ad_id text,
  status text not null default 'new',                     -- new|engaged|qualified|link_sent|won|lost
  interest_score integer not null default 0,
  last_engaged_at timestamptz,
  notion_pipeline_url text,                               -- puente a Trip Pipeline
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_contact_idx on public.leads (contact_id);
create index if not exists leads_status_idx on public.leads (status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · CONVERSATIONS — el hilo por persona/canal. last_inbound_at maneja la ventana 24h.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  channel text not null default 'whatsapp',              -- 'whatsapp' | 'instagram'
  wa_phone text,                                         -- E.164
  last_inbound_at timestamptz,                           -- (now - este) < 24h ⇒ ventana abierta (free-form)
  state text not null default 'bot',                     -- 'bot' | 'human' (escalado a Luis)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists conversations_contact_channel_uniq
  on public.conversations (contact_id, channel);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · MESSAGES — bitácora de cada mensaje. wa_message_id unique = idempotencia del webhook.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction text not null check (direction in ('in', 'out')),
  wa_message_id text,                                    -- id de WhatsApp (dedupe de webhooks)
  type text not null default 'text',                    -- text|template|interactive|image|…
  template_name text,                                   -- para salientes de template (billing/auditoría)
  body text,
  created_at timestamptz not null default now()
);

create unique index if not exists messages_wa_message_id_uniq
  on public.messages (wa_message_id) where wa_message_id is not null;
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · ENGAGEMENT_EVENTS — señal de interés (append-only). interest_score = rollup de esto.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.engagement_events (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  experience_id uuid references public.experiences(id),
  kind text not null,            -- 'replied'|'asked_about'|'price_question'|'date_question'|'clicked_link'|'opened_payment_link'|'broadcast_sent'|'ad_click'
  weight integer not null default 0,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists engagement_events_contact_idx on public.engagement_events (contact_id, created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6 · updated_at automático (reusa public.set_updated_at() del 0006)
-- ─────────────────────────────────────────────────────────────────────────────
drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7 · RLS — todo interno (service-role). Sin policies públicas (datos operativos).
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.leads enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.engagement_events enable row level security;
-- (sin create policy: solo el service-role del backend escribe/lee; el bot vive en el server)
