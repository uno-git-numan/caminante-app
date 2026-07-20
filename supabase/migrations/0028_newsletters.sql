-- 0028 · BOLETÍN (newsletter)
-- Un boletín = una plantilla + su contenido editable (jsonb) + su estado.
-- v1 la dispara Luis a mano desde el Kit; no hay cron.
--
-- `body` guarda el contenido YA EDITADO por el humano (no el HTML final): el
-- HTML se arma al vuelo con la plantilla, así un arreglo de maquetación aplica
-- a los boletines viejos sin migrar datos.
--
-- RLS SIN POLICIES = solo service-role (el mismo patrón de social_posts /
-- slot_requests). Nada de esto se expone al cliente.

create table if not exists public.newsletters (
  id uuid primary key default gen_random_uuid(),
  -- Experiencia de la que se pre-llenó (ficha/serie E/salidas). Opcional: un
  -- boletín puede no colgar de ninguna. ON DELETE SET NULL — borrar una
  -- experiencia jamás debe borrar el registro de un correo YA ENVIADO.
  experience_slug text,
  template text not null check (template in ('carta', 'dato', 'guia', 'vivio')),
  subject text not null,
  preheader text not null default '',
  body jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'sent')),
  sent_at timestamptz,
  -- Cuántos destinatarios recibieron el envío real (NULL mientras es borrador).
  recipients_count integer,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Un boletín enviado SIEMPRE trae fecha y conteo: evita "enviados" fantasma
  -- que falseen el historial.
  constraint newsletters_sent_completo check (
    status <> 'sent' or (sent_at is not null and recipients_count is not null)
  )
);

create index if not exists newsletters_status_idx on public.newsletters (status, created_at desc);
create index if not exists newsletters_slug_idx on public.newsletters (experience_slug);

alter table public.newsletters enable row level security;

comment on table public.newsletters is
  'Boletines (newsletter). body = contenido editado; el HTML se arma con la plantilla al enviar. Solo service-role.';
