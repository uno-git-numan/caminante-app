-- ─────────────────────────────────────────────────────────────────────────────
-- 0045 · COMUNIDAD · el pipeline, la llamada, el punto de encuentro y los
--        mensajes que salen antes del viaje.
--
-- ADITIVA: crea tablas nuevas y agrega columnas. No toca ni una fila existente.
--
-- LA UNIDAD ES PERSONA × SALIDA, no persona. Alguien puede estar interesado en
-- Barrancas y ser ya viajero de Hongos: son dos cosas distintas y no se pisan.
-- Por eso la tarjeta cuelga de (contacto, experiencia, salida) y no del contacto.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1 · LAS TARJETAS DEL TABLERO ───────────────────────────────────────────────
create table if not exists public.crm_cards (
  id uuid primary key default gen_random_uuid(),
  contact_id    uuid not null references public.contacts(id) on delete cascade,
  experience_id uuid not null references public.experiences(id),
  -- Null mientras la persona pregunta por la experiencia sin fecha elegida.
  slot_id       uuid references public.experience_slots(id),
  -- Alcance: el operador ve SUS tarjetas. Se copia de la experiencia al crear.
  operator_id   uuid references public.operators(id),

  stage text not null default 'llego'
    check (stage in ('llego','conversacion','interesado','pagado','preparando','viajo','caido')),

  num_people int not null default 1 check (num_people between 1 and 40),

  -- De dónde llegó. Es lo que se ve en la tarjeta cerrada.
  origen text not null default 'solicitud'
    check (origen in ('solicitud','whatsapp','embajador','manual')),
  slot_request_id uuid references public.slot_requests(id),

  -- Cuando paga, el webhook de Stripe la mueve y la amarra a su reserva.
  reservation_id uuid references public.reservations(id),

  -- ⚠️ Perder es un DATO. Una tarjeta caída sin motivo no enseña nada, así que
  -- la base lo exige: es la única forma de que dentro de un año se pueda
  -- contestar «¿por qué se nos cayeron?».
  motivo_caida text,

  -- El grupo de WhatsApp de esa salida. Meta NO permite crear grupos por API:
  -- el operador lo crea en su teléfono y pega la liga una sola vez.
  grupo_whatsapp_url text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  stage_changed_at  timestamptz not null default now(),

  constraint crm_cards_caida_con_motivo
    check (stage <> 'caido' or (motivo_caida is not null and length(btrim(motivo_caida)) > 0))
);

create index if not exists crm_cards_stage_idx    on public.crm_cards (stage);
create index if not exists crm_cards_operator_idx on public.crm_cards (operator_id);
create index if not exists crm_cards_contact_idx  on public.crm_cards (contact_id);
create index if not exists crm_cards_slot_idx     on public.crm_cards (slot_id);

-- Una tarjeta viva por persona y salida: la misma persona no puede estar dos
-- veces en el mismo viaje. Las caídas no cuentan — se puede volver a intentar.
create unique index if not exists crm_cards_una_viva_por_salida
  on public.crm_cards (contact_id, slot_id)
  where slot_id is not null and stage <> 'caido';

-- 2 · LA LLAMADA AGENDADA ────────────────────────────────────────────────────
-- El sistema NO crea la reunión: cada operador genera su Meet o su Zoom en su
-- propia cuenta y pega la liga. Aquí sólo se guarda y se reparte (correo,
-- WhatsApp, .ics del cliente y la agenda del operador).
create table if not exists public.crm_calls (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.crm_cards(id) on delete cascade,
  url text not null,
  starts_at timestamptz not null,
  duracion_min int not null default 30 check (duracion_min between 5 and 480),
  enviada_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists crm_calls_card_idx on public.crm_calls (card_id);
create index if not exists crm_calls_when_idx on public.crm_calls (starts_at);

-- 3 · EL PUNTO DE ENCUENTRO ES DE LA SALIDA, NO DE LA EXPERIENCIA ────────────
-- La misma caminata puede citar en dos lugares distintos según la fecha. Es el
-- mensaje más crítico de todos y hasta hoy no existía en ningún lado.
alter table public.experience_slots add column if not exists punto_encuentro text;
alter table public.experience_slots add column if not exists punto_encuentro_hora text;
alter table public.experience_slots add column if not exists guia_telefono text;

-- 4 · LOS MENSAJES QUE SALEN ANTES DEL VIAJE ─────────────────────────────────
-- El texto se arma desde la experiencia (mochila, incluye/no incluye,
-- itinerario, contacto base). Esta tabla guarda CUÁNDO sale cada uno y las
-- correcciones que el operador haga para ESTA salida.
--
-- `dias_antes` positivo = antes de salir; negativo = después de volver (la
-- encuesta sale a −1). Los envíos son POR DÍA: no se promete una hora.
create table if not exists public.slot_messages (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.experience_slots(id) on delete cascade,
  clave text not null,
  titulo text not null,
  cuerpo text not null default '',
  dias_antes int not null,
  -- true = lo propone la casa desde la experiencia; false = lo escribió el
  -- operador para esta salida. La pantalla los distingue a simple vista.
  de_la_casa boolean not null default true,
  activo boolean not null default true,
  enviado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists slot_messages_slot_idx on public.slot_messages (slot_id, dias_antes desc);
create unique index if not exists slot_messages_clave_uniq on public.slot_messages (slot_id, clave);

-- 5 · RLS ────────────────────────────────────────────────────────────────────
-- Sin policies: sólo service-role, igual que el resto del expediente. El
-- alcance por operador lo aplica la capa de datos, no la base.
alter table public.crm_cards     enable row level security;
alter table public.crm_calls     enable row level security;
alter table public.slot_messages enable row level security;
