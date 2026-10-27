-- 0073 · El espacio del grupo
--
-- Una salida privada deja de ser «la página de la experiencia con un token» y
-- se vuelve un espacio propio (/caminante/g/<token>), estilo viaje de Airbnb:
-- la anfitriona invita y ve quién entra; cada invitado entra con su cuenta
-- (celular y correo), aparta su lugar y firma. Decisiones de Luis, 26 oct 2026.
--
-- Lo que nace aquí:
--   · experience_slots: quién es la anfitriona, la fecha límite para apartar y el
--     mínimo de lugares. La fecha límite NO cancela sola: al vencer sin el mínimo,
--     la operadora escribe (design/comunidad/PROMPT-2 §B-estados).
--   · grupo_lugares: una fila por persona que ENTRÓ al espacio. «Pagué» y
--     «firmé» se DERIVAN (reservations / registrations), no se escriben aquí.
--     `pagado_por` dice si otro del grupo cubrió el lugar.
--   · codigos_celular: los códigos de verificación del celular (hash, nunca el
--     código). El celular verificado se marca en contacts.phone_verified_at.
--   · crm_cards.origen admite 'grupo': la tarjeta de un invitado nace al entrar.
--
-- Aditiva. RLS prendida sin policies: sólo entra el service-role.

alter table public.experience_slots
  add column if not exists anfitrion_contact_id uuid references public.contacts(id) on delete set null,
  add column if not exists fecha_limite date,
  add column if not exists minimo integer,
  add column if not exists aviso_minimo_at timestamptz;

alter table public.experience_slots
  drop constraint if exists experience_slots_minimo_positivo;
alter table public.experience_slots
  add constraint experience_slots_minimo_positivo check (minimo is null or minimo >= 1);

comment on column public.experience_slots.anfitrion_contact_id is
  'Quien pidió la fecha y es anfitrión del espacio del grupo (/caminante/g/<access_token>).';
comment on column public.experience_slots.fecha_limite is
  'Hasta cuándo se aparta lugar en el espacio del grupo. Al vencer NO se cancela sola: si no se juntó el mínimo, la operadora escribe.';
comment on column public.experience_slots.minimo is
  'Mínimo de lugares para que la salida privada salga. NULL = sin mínimo declarado.';
comment on column public.experience_slots.aviso_minimo_at is
  'Cuándo se le avisó a la operadora que venció la fecha límite sin el mínimo (una sola vez).';

alter table public.contacts
  add column if not exists phone_verified_at timestamptz;
comment on column public.contacts.phone_verified_at is
  'Cuándo se verificó el celular con un código (WhatsApp o correo). NULL = nunca.';

create table if not exists public.grupo_lugares (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.experience_slots(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  rol text not null default 'invitado' check (rol in ('anfitrion', 'invitado')),
  entro_at timestamptz not null default now(),
  -- La reserva que paga este lugar: la propia, o la de quien lo cubrió.
  reservation_id uuid references public.reservations(id) on delete set null,
  -- Si otro del grupo pagó por esta persona, su lugar.
  pagado_por uuid references public.grupo_lugares(id) on delete set null,
  -- Lista de espera cuando el cupo está lleno; avisado cuando se abrió un lugar.
  lista_espera_at timestamptz,
  avisado_lugar_at timestamptz,
  -- El recordatorio «faltan 3 días» ya se mandó (una sola vez).
  recordatorio_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slot_id, contact_id)
);
comment on table public.grupo_lugares is
  'Una fila por persona que ENTRÓ al espacio de una salida privada. Pagué/firmé se derivan de reservations y registrations; aquí sólo vive el vínculo.';
create index if not exists grupo_lugares_slot_idx on public.grupo_lugares (slot_id);
create index if not exists grupo_lugares_contact_idx on public.grupo_lugares (contact_id);
alter table public.grupo_lugares enable row level security;

create table if not exists public.codigos_celular (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  email text,
  user_id uuid references auth.users(id) on delete cascade,
  slot_id uuid references public.experience_slots(id) on delete set null,
  nombre text,
  code_hash text not null,
  -- El token_hash de la liga mágica que se canjea al verificar el código (así
  -- el código ES el login). NULL cuando la persona ya tenía sesión.
  token_hash text,
  canal text not null check (canal in ('whatsapp', 'correo')),
  attempts integer not null default 0,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.codigos_celular is
  'Códigos de verificación del celular. Se guarda el hash, nunca el código. Caducan a los 10 minutos y aguantan 5 intentos.';
create index if not exists codigos_celular_phone_idx on public.codigos_celular (phone, created_at desc);
alter table public.codigos_celular enable row level security;

-- La tarjeta de un invitado nace al entrar al espacio, con origen 'grupo'.
alter table public.crm_cards drop constraint if exists crm_cards_origen_check;
alter table public.crm_cards
  add constraint crm_cards_origen_check
  check (origen in ('solicitud', 'whatsapp', 'embajador', 'manual', 'grupo'));
