-- 0034 · Transferencias: el comprobante vive con el pago
--
-- ADITIVA.
--
-- Caso real que la disparó (11 ago 2026): Lorena Saravia pagó $16,500 por
-- transferencia para Barrancas 8-oct el 29 de julio, y el sistema **no se
-- enteró**. No tenía contacto, ni reserva, ni pago. Consecuencias: la salida
-- se veía en 4/12 cuando iba en 5/12 —justo su punto de equilibrio—, faltaban
-- $16,500 de ingreso, y ella iba a viajar SIN DESLINDE.
--
-- Es el patrón del caso Enyd: alguien paga y la plataforma no lo sabe. La
-- diferencia es que aquí el canal (transferencia) simplemente no existía.
--
-- `payments.method='transfer'` ya se aceptaba desde la 0007; lo que faltaba era
-- dónde guardar el comprobante y la referencia bancaria, que es lo que permite
-- conciliar contra el estado de cuenta.

begin;

alter table public.payments
  -- Captura del comprobante (screenshot o PDF) en el bucket `experiences`.
  add column if not exists comprobante_url text,
  -- La referencia del banco. Es la llave para conciliar contra el estado de
  -- cuenta, y la que evita registrar dos veces la misma transferencia.
  add column if not exists referencia text;

-- Una transferencia con referencia no se puede registrar dos veces. Parcial
-- porque los cobros de Stripe no traen referencia bancaria.
create unique index if not exists payments_referencia_unique
  on public.payments (referencia)
  where referencia is not null;

comment on column public.payments.referencia is
  'Referencia del banco en pagos por transferencia. Unica: evita capturar dos veces el mismo movimiento.';

commit;
