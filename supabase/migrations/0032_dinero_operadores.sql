-- 0032 · La verdad del dinero por operador
--
-- ADITIVA. No borra ni reescribe nada. Aplicar a mano en el SQL Editor.
--
-- Resuelve tres cosas que hoy hacen que el payout mienta:
--   1. La comisión se congelaba en la RESERVA, así que una compra adicional
--      reescribía el % y se aplicaba hacia atrás a los abonos viejos. Ahora se
--      congela en el PAGO, que es inmutable por definición.
--   2. Lo que Stripe cobró no vivía en ningún lado, así que el "neto" era en
--      realidad el bruto: dinero que nunca llegó al banco.
--   3. Un reembolso PARCIAL no se podía representar (el CHECK de status solo
--      admite pending|paid|failed|refunded) y se perdía en silencio.
--
-- Decisiones de Luis (11 ago 2026) que este esquema refleja:
--   · Los COSTOS **sí viven en la base** (cambio de criterio de Luis el mismo
--     día: en la hoja no están respaldados). Se extraen con IA de las hojas de
--     Drive y se guardan aquí con su procedencia, para poder auditarlos.
--   · Numan · Caminante opera TODO. Las experiencias de Kéntro se ven y se
--     operan en plataforma **como experiencias Caminante**.
--   · **La comisión de Kéntro en plataforma es 0**: Luis le transfiere su parte
--     por fuera. El sistema no la calcula ni la propone — si la calculara,
--     estaría prometiendo un pago que no ejecuta.

begin;

-- ── operators ────────────────────────────────────────────────────────────
-- Dos dimensiones SEPARADAS, porque son cosas distintas y un operador puede
-- tener una, la otra, o las dos:
--   · platform_fee_pct  = % sobre la VENTA que retiene la plataforma.
--   · profit_share_pct  = % sobre la UTILIDAD del viaje.
alter table public.operators
  add column if not exists platform_fee_pct numeric(5,2),
  add column if not exists profit_share_pct numeric(5,2),
  -- De qué experiencias participa la utilidad. NULL = ninguna.
  add column if not exists profit_share_slugs text[],
  -- Quién absorbe la comisión de Stripe: 'operator' | 'client'. Determina el
  -- tipo de cargo cuando entre Connect, no es decorativa.
  add column if not exists stripe_fee_bearer text
    check (stripe_fee_bearer in ('operator', 'client')),
  -- NULL hasta que exista Connect.
  add column if not exists stripe_account_id text;

comment on column public.operators.profit_share_pct is
  'Porcentaje sobre la UTILIDAD del viaje (ingreso - costos - Stripe), no sobre la venta. Los costos viven en experience_costs.';

-- ── payments ─────────────────────────────────────────────────────────────
-- La verdad de cada cobro: lo que entró, lo que se llevó Stripe y lo que
-- realmente queda. Se llena desde balance_transactions con la llave LIVE.
alter table public.payments
  add column if not exists stripe_fee_mxn numeric(12,2),
  add column if not exists stripe_fee_tax_mxn numeric(12,2),   -- el IVA de la comisión, acreditable con el CFDI de Stripe
  add column if not exists stripe_net_mxn numeric(12,2),
  add column if not exists balance_transaction_id text,
  add column if not exists payout_id text,
  add column if not exists payout_arrival_date date,
  -- El fee CONGELADO EN EL PAGO. Aquí está el arreglo del bug: una compra
  -- posterior ya no puede reescribir el % de un abono viejo.
  add column if not exists platform_fee_pct_frozen numeric(5,2),
  add column if not exists platform_fee_mxn numeric(12,2),
  -- Reembolsos parciales: el monto devuelto, sin tener que mentir en el status.
  add column if not exists refunded_mxn numeric(12,2) not null default 0;

create index if not exists payments_payout_idx on public.payments (payout_id);
create index if not exists payments_btxn_idx on public.payments (balance_transaction_id);

-- El CHECK viejo no admitía representar un reembolso parcial.
alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments add constraint payments_status_check
  check (status in ('pending', 'paid', 'failed', 'refunded', 'partially_refunded'));

-- ── cuentas por pagar ────────────────────────────────────────────────────
-- Lo que se le debe a cada operador, con vencimiento y estado. Sirve para el
-- periodo manual de hoy y para conciliar contra Connect después.
create table if not exists public.operator_payables (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id) on delete restrict,
  -- 'platform_fee' = comisión sobre ventas · 'profit_share' = % de utilidad
  concepto text not null check (concepto in ('platform_fee', 'profit_share', 'ajuste')),
  -- A qué se refiere: una salida concreta o un periodo.
  slot_id uuid references public.experience_slots(id),
  periodo text,                                   -- 'YYYY-MM' cuando no es por salida
  -- La aritmética QUE SE USÓ, guardada: sin esto un pago viejo no se puede
  -- auditar cuando cambien los porcentajes.
  base_mxn numeric(12,2) not null,                -- utilidad o venta, según concepto
  pct numeric(5,2) not null,
  monto_mxn numeric(12,2) not null,
  memoria jsonb,                                  -- de dónde salió la base (hoja de Drive, ids, fecha de lectura)
  estado text not null default 'por_pagar'
    check (estado in ('por_pagar', 'pagado', 'cancelado')),
  vence_el date,
  pagado_el date,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists operator_payables_op_idx on public.operator_payables (operator_id, estado);

-- Solo service-role (mismo patrón que el resto de las tablas de operación).
alter table public.operator_payables enable row level security;

-- ── costos por salida ────────────────────────────────────────────────────
-- Fijos (no dependen de cuánta gente va: guía, transporte, permisos) y
-- variables (por persona: comida, hospedaje, entradas). La distinción no es
-- cosmética: es la que determina el punto de equilibrio.
--
-- Se extraen con IA de la hoja de costeo y se guardan CON SU PROCEDENCIA
-- (`fuente`), para que cualquier cifra se pueda rastrear hasta la celda de
-- donde salió. Un costo sin procedencia no se puede defender.
create table if not exists public.experience_costs (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  -- NULL = aplica a la experiencia (plantilla). Con slot_id = el costo REAL de
  -- esa salida, que es el que manda para la utilidad.
  slot_id uuid references public.experience_slots(id) on delete cascade,
  concepto text not null,
  tipo text not null check (tipo in ('fijo', 'variable')),
  monto_mxn numeric(12,2) not null check (monto_mxn >= 0),
  -- De dónde salió: {sheetId, pestaña, celda, leido_el, por: 'ia'|'manual'}
  fuente jsonb,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists experience_costs_exp_idx on public.experience_costs (experience_id);
create index if not exists experience_costs_slot_idx on public.experience_costs (slot_id);
alter table public.experience_costs enable row level security;

comment on table public.experience_costs is
  'Costos por salida, extraidos con IA de las hojas de costeo de Drive. fijo = no escala con pax; variable = por persona. La utilidad de una salida es ingreso - (fijos + variables x pax) - Stripe.';

-- ── seed de los dos operadores de hoy ────────────────────────────────────
-- Numan · Caminante es la casa: no se cobra fee a sí misma.
update public.operators
   set platform_fee_pct = null,
       profit_share_pct = null
 where slug = 'numan-caminante';

-- Kéntro: CERO en plataforma. Sus experiencias se operan como Caminante y su
-- parte se liquida por transferencia fuera del sistema. Poner aquí el 30% haría
-- que el panel propusiera un pago que la plataforma no ejecuta.
update public.operators
   set profit_share_pct = 0,
       platform_fee_pct = 0,
       profit_share_slugs = null,
       notes = coalesce(notes || ' · ', '') ||
         'Comision en plataforma = 0 (11 ago 2026). Sus experiencias (barrancas, volcanes) se operan como Caminante; la participacion de Kentro se liquida por transferencia fuera del sistema.'
 where slug = 'kentro';

commit;
