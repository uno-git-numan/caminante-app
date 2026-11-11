-- 0078 · La cuota de admisión de la operadora (11 nov 2026).
--
-- Al activar Connect en LIVE, NUMAN aceptó ante Stripe el modelo B («Buyers
-- will purchase from you») y con él Radar Standard: MX$20.00 por cada cuenta
-- conectada. Luis: «esos 20 cóbralos de costo de primera admisión… lo
-- descontamos del primer payout que les mandemos. Sí se tiene que agregar
-- como cláusula».
--
-- Se cobra UNA vez por operadora, revirtiendo esa cantidad de la primera
-- transferencia que Stripe le hace en una venta por su cuenta conectada
-- (`transfers.createReversal`). El cobro de la venta no cambia: la comisión,
-- su IVA y el CFDI siguen exactos; la admisión es un movimiento aparte.
--
-- UNA FILA POR OPERADORA, y la llave primaria es la que garantiza el «una
-- sola vez»: si dos ventas se pagan en el mismo segundo, sólo una inserta.
--
--   pendiente  la fila existe y la reversión se está pidiendo
--   cobrada    Stripe confirmó la reversión (reversal_id)
--   fallida    Stripe la rechazó; la siguiente venta la vuelve a intentar
--
-- ADITIVA: una tabla nueva. Ninguna fila existente cambia al aplicarla.

create table if not exists public.operator_admisiones (
  operator_id   uuid primary key references public.operators(id) on delete restrict,
  monto_mxn     numeric(10,2) not null check (monto_mxn > 0),
  estado        text not null default 'pendiente'
                check (estado in ('pendiente', 'cobrada', 'fallida')),
  payment_id    uuid references public.payments(id) on delete set null,
  transfer_id   text,
  reversal_id   text,
  error         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  cobrada_at    timestamptz,
  constraint operator_admisiones_cobrada_con_reversion
    check (estado <> 'cobrada' or (reversal_id is not null and cobrada_at is not null))
);

alter table public.operator_admisiones enable row level security;  -- sin policies: solo service-role

comment on table public.operator_admisiones is
  'Cuota de admisión de cada operadora (MX$20 = Radar por cuenta conectada), descontada UNA vez de la primera transferencia por Connect. La PK por operadora es el candado del «una sola vez». Ver src/lib/operadores/admision.ts.';
comment on column public.operator_admisiones.estado is
  'pendiente = se está pidiendo la reversión · cobrada = Stripe la confirmó (reversal_id) · fallida = Stripe la rechazó y la siguiente venta la reintenta. Sólo «cobrada» se resta de lo que recibe la operadora.';
comment on column public.operator_admisiones.monto_mxn is
  'Lo que se le descontó. Se congela al cobrar: si la cuota cambia, las admisiones viejas conservan la suya.';
