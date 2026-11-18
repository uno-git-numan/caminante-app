-- 0088 · LA FACTURA DE LA COMISIÓN A LA OPERADORA Y SU NOTA DE CRÉDITO
-- (convenio v3.3, Décima tercera §2 y §4; DECISIONES D7, D8 y D9)
--
-- Por cada cobro por cuenta conectada, NUMAN le factura a la operadora su
-- comisión más IVA (`tipo = 'comision'`, que ya existía en el check desde la
-- 0076 y nadie había usado). Si la venta se devuelve, sale el egreso
-- proporcional: `tipo = 'egreso-comision'`, aparte del egreso de la factura del
-- cliente (`'egreso'`), porque los dos pueden existir para el mismo pago y el
-- mismo acumulado devuelto.
--
-- Aditiva: un valor más en el check de `tipo` (se reemplaza por uno que lo
-- contiene; ninguna fila cambia: la tabla está vacía) y dos índices únicos.

begin;

alter table public.cfdi_invoices drop constraint if exists cfdi_invoices_tipo_check;
alter table public.cfdi_invoices add constraint cfdi_invoices_tipo_check
  check (tipo in ('cliente', 'comision', 'egreso', 'retencion', 'egreso-comision'));

-- Una sola factura de comisión viva por pago.
create unique index if not exists cfdi_invoices_comision_unique
  on public.cfdi_invoices (payment_id) where tipo = 'comision' and status in ('pending', 'stamped');

-- Un egreso de comisión por acumulado devuelto: el mismo reembolso visto dos
-- veces (webhook + cron) choca aquí y no timbra dos.
create unique index if not exists cfdi_invoices_egreso_comision_unique
  on public.cfdi_invoices (payment_id, devuelto_acumulado_mxn) where tipo = 'egreso-comision' and status in ('pending', 'stamped');

alter table public.cfdi_invoices drop constraint if exists cfdi_invoices_egreso_comision_sano;
alter table public.cfdi_invoices add constraint cfdi_invoices_egreso_comision_sano
  check (tipo <> 'egreso-comision' or (relacionado_uuid is not null and devuelto_acumulado_mxn > 0));

comment on column public.cfdi_invoices.tipo is
  'cliente = la factura al cliente (B1/A1); comision = NUMAN→operadora por su comisión + IVA, y la cuota de admisión en la venta que la pagó (B2); egreso = nota de crédito al cliente o contra la global; egreso-comision = nota de crédito de la comisión cuando la venta se devuelve; retencion = CFDI de retenciones (R1). Ver design/contabilidad/MAPA-FACTURACION.md.';

commit;
