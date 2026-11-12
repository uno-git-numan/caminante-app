-- 0083 · FACTURADA FUERA DEL SISTEMA (candado del corte, DECISIONES-LEGAL-FISCAL §6)
--
-- La plataforma factura a clientes sólo lo cobrado desde el corte
-- (lib/facturacion/corte.ts, propuesta 10 nov 2026, la confirma la contadora).
-- Lo cobrado DESPUÉS del corte que la contadora ya facturó por su lado se marca
-- aquí con el UUID de su CFDI: ni recibo, ni autofactura, ni global. Un CFDI
-- nuestro encima sería ingreso duplicado ante el SAT.
--
-- Aditiva: un valor más en el check de `status_cfdi` (se reemplaza el check
-- por uno que lo contiene; ninguna fila existente cambia) y tres columnas.

begin;

alter table public.payments drop constraint if exists payments_status_cfdi_check;
alter table public.payments add constraint payments_status_cfdi_check
  check (status_cfdi in ('por-emitir', 'emitido', 'publico-general', 'no-facturable', 'externo'));

alter table public.payments
  add column if not exists cfdi_externo_uuid text,
  add column if not exists cfdi_externo_at timestamptz,
  add column if not exists cfdi_externo_nota text;

-- 'externo' ⇔ trae el UUID de la contadora; el UUID con forma de UUID; y un
-- pago con recibo de la plataforma no se puede marcar (primero se cancela el recibo).
alter table public.payments add constraint payments_cfdi_externo_sano check (
  (status_cfdi = 'externo') = (cfdi_externo_uuid is not null)
  and (cfdi_externo_uuid is null
       or cfdi_externo_uuid ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
  and (status_cfdi <> 'externo' or facturapi_receipt_id is null)
);

comment on column public.payments.cfdi_externo_uuid is
  'UUID del CFDI que la contadora emitió FUERA de la plataforma por este cobro (puede ser una global suya, compartida por varios pagos). Puesto ⇔ status_cfdi = externo: la plataforma ya no emite recibo, factura ni global de este pago.';
comment on column public.payments.cfdi_externo_at is
  'Cuándo se marcó el pago como facturado fuera del sistema.';
comment on column public.payments.cfdi_externo_nota is
  'De dónde salió la marca (p. ej. «lista de Marisol, correo del 14 nov»).';

commit;
