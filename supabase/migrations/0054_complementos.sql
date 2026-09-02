-- 0054 · COMPLEMENTOS — lo que se agrega a una experiencia y cambia el precio
--
-- El caso que lo trae: la Travesía Barrancas del Cobre se vende con tren y sin
-- tren. No es un producto distinto —es el mismo viaje con una extensión— y
-- duplicar la experiencia para vender dos versiones te deja dos fichas que hay
-- que mantener iguales a mano. Se desincronizan a la primera corrección.
--
-- Un complemento tiene DOS CARAS y no son la misma:
--   · lo que PAGA el cliente  → precio_*
--   · lo que CUESTA proveerlo → costo_*
-- Modelarlas juntas como «un monto» fue el error que la 0049 ya corrigió para
-- los costos; aquí nace bien de una vez.
--
-- Los modos de cálculo son LOS MISMOS de `experience_costs` (0049), a propósito:
-- una segunda gramática para decir lo mismo es una segunda gramática que
-- mantener. `unico` = total fijo · `por_persona` = tarifa × personas.

create table if not exists public.experience_complements (
  id            uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  -- NULL = aplica a toda la experiencia. Con slot_id, sólo a esa salida: el tren
  -- puede existir en la travesía de marzo y no en la de octubre.
  slot_id       uuid references public.experience_slots(id) on delete cascade,

  nombre      text not null,
  descripcion text,

  -- LO QUE PAGA EL CLIENTE
  precio_modo       text not null default 'por_persona'
    check (precio_modo in ('unico', 'por_persona')),
  precio_mxn        numeric(12,2) not null default 0 check (precio_mxn >= 0),
  precio_tarifa_mxn numeric(12,2) check (precio_tarifa_mxn >= 0),

  -- LO QUE CUESTA. Mismos modos que experience_costs.
  costo_modo       text not null default 'por_persona'
    check (costo_modo in ('unico', 'por_persona', 'desde_personas')),
  costo_mxn        numeric(12,2) not null default 0 check (costo_mxn >= 0),
  costo_tarifa_mxn numeric(12,2) check (costo_tarifa_mxn >= 0),
  costo_escalones  jsonb,

  -- Un complemento obligatorio no es opcional: se cobra siempre y se suma al
  -- precio base. Existe porque hay cosas —una entrada a un ejido— que no se
  -- pueden declinar pero sí conviene desglosar.
  obligatorio boolean not null default false,
  activo      boolean not null default true,
  orden       int     not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Coherencia: el modo manda y los campos que no le tocan van en NULL. Sin esto,
-- una fila puede decir «por persona» y traer también un total fijo, y entonces
-- nadie sabe cuál de los dos es el bueno.
alter table public.experience_complements
  drop constraint if exists complements_precio_coherente;
alter table public.experience_complements
  add constraint complements_precio_coherente check (
    (precio_modo = 'unico' and precio_tarifa_mxn is null)
    or (precio_modo = 'por_persona'
        and precio_tarifa_mxn is not null and precio_mxn = 0)
  );

alter table public.experience_complements
  drop constraint if exists complements_costo_coherente;
alter table public.experience_complements
  add constraint complements_costo_coherente check (
    (costo_modo = 'unico' and costo_tarifa_mxn is null and costo_escalones is null)
    or (costo_modo = 'por_persona'
        and costo_tarifa_mxn is not null and costo_escalones is null and costo_mxn = 0)
    or (costo_modo = 'desde_personas'
        and costo_tarifa_mxn is null and costo_mxn = 0
        and jsonb_typeof(costo_escalones) = 'array'
        and jsonb_array_length(costo_escalones) > 0)
  );

create index if not exists complements_experiencia_idx
  on public.experience_complements (experience_id);
create index if not exists complements_slot_idx
  on public.experience_complements (slot_id);

drop trigger if exists complements_set_updated_at on public.experience_complements;
create trigger complements_set_updated_at
  before update on public.experience_complements
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- LO QUE CADA RESERVA COMPRÓ — congelado, igual que la comisión.
--
-- Sin esto, «¿quién va en el tren?» se contestaría leyendo el complemento HOY, y
-- el día que le cambies el precio o lo apagues, el roster de una salida vendida
-- cambiaría solo. El precio se copia al comprar y ya no se mueve.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.reservation_complements (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  complement_id  uuid not null references public.experience_complements(id),

  -- Copia del nombre al momento de comprar: si mañana se renombra, el roster de
  -- esta salida sigue diciendo lo que la persona creyó estar comprando.
  nombre_snapshot text not null,
  personas    int  not null default 1 check (personas > 0),
  precio_mxn  numeric(12,2) not null check (precio_mxn >= 0),

  created_at timestamptz not null default now()
);

create unique index if not exists reservation_complements_uno
  on public.reservation_complements (reservation_id, complement_id);
create index if not exists reservation_complements_reserva_idx
  on public.reservation_complements (reservation_id);

alter table public.experience_complements enable row level security;
alter table public.reservation_complements enable row level security;

comment on table public.experience_complements is
  'Agregables de una experiencia (el tren, una noche extra). Precio y costo por separado: no son lo mismo.';
comment on table public.reservation_complements is
  'Qué compró cada reserva, con el precio CONGELADO. Cambiar el complemento no reescribe lo ya vendido.';
