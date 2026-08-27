-- ─────────────────────────────────────────────────────────────────────────────
-- 0046 · EL REGALO DE CUMPLEAÑOS
--
-- ADITIVA. Un regalo es un DESCUENTO CON NOMBRE Y APELLIDO: nace para una
-- persona, viaja en una liga única dentro de su mensaje, sirve una sola vez y
-- vence. No es un cupón que se teclea ni que se puede reenviar a un grupo.
--
-- ⚠️ EL DINERO SE DECIDE AQUÍ Y SE COBRA EN `createCheckout`, server-side. La
-- liga no lleva el monto: lleva el token. El servidor resuelve cuánto vale, lo
-- resta del `unit_amount` y lo deja en la metadata de Stripe. El cliente nunca
-- manda un precio.
--
-- LA COMISIÓN NO CAMBIA (decisión de Luis, 27 ago 2026): se calcula normal
-- sobre lo que efectivamente se cobró. Un descuento baja la base, así que el
-- costo lo absorben operador y casa en la misma proporción de siempre. No hay
-- trato especial para experiencias con descuento.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),

  -- Lo que viaja en la liga. Aleatorio y largo: es la única llave.
  token text not null unique,

  contact_id  uuid not null references public.contacts(id) on delete cascade,
  -- Quién lo regala. Su utilidad es la que baja.
  operator_id uuid references public.operators(id),
  -- Null = sirve en cualquiera de sus experiencias.
  experience_id uuid references public.experiences(id),

  tipo  text not null check (tipo in ('porcentaje','monto')),
  valor numeric(10,2) not null check (valor > 0),

  -- ⚠️ Un regalo sin fecha es un descuento permanente que nadie recuerda haber
  -- dado. La columna es NOT NULL a propósito.
  vence_at timestamptz not null,

  motivo text not null default 'cumpleanos',

  -- Su vida: se manda, se abre, se usa. O se vence sin abrirse.
  enviado_at timestamptz,
  abierto_at timestamptz,
  usado_at   timestamptz,

  -- Con qué se pagó y cuánto se descontó DE VERDAD. Se escribe al cobrar, no
  -- al regalar: es el número que cuadra contra Stripe.
  reservation_id   uuid references public.reservations(id),
  monto_descontado numeric(10,2),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Un porcentaje mayor a 100 regalaría dinero.
  constraint gifts_porcentaje_sano
    check (tipo <> 'porcentaje' or (valor > 0 and valor <= 100)),
  -- Si está usado, tiene que decir con qué y por cuánto. Sin esto el ledger no
  -- puede explicar por qué una venta cobró menos de lo que dice la lista.
  constraint gifts_usado_con_cuenta
    check (usado_at is null or (reservation_id is not null and monto_descontado is not null))
);

create index if not exists gifts_contact_idx on public.gifts (contact_id);
create index if not exists gifts_vence_idx   on public.gifts (vence_at) where usado_at is null;
create index if not exists gifts_operator_idx on public.gifts (operator_id);

-- ⚠️ «Un solo regalo activo por persona» NO se puede expresar como índice: la
-- condición depende de now(), que no es inmutable. Lo aplica la capa de datos
-- antes de crear uno nuevo (lib/comunidad/regalos.ts). Si algún día aparecen
-- dos activos, el bug está ahí, no aquí.

alter table public.gifts enable row level security;
