-- 0091 · LOS CANDADOS DE LA 0089 Y LA 0090, SIN HUECOS DE NULL
--
-- Un CHECK sólo rechaza lo que da FALSE; lo que da NULL pasa. Tres candados
-- comparaban una columna que podía venir en NULL (`x in (...)`, `x ~ '...'`,
-- `x > 0`, `length(btrim(x)) > 0`) y por eso dejaban pasar justo el caso que
-- debían frenar. Lo cazó la prueba revertida de la 0090 el 17 nov 2026:
--   · una bonificación «pagada» sin clave de rastreo,
--   · una cancelación por fuerza mayor sin decir cuál,
--   · y (0089) una reserva con variante y fecha pero sin la huella del texto.
-- Revisando los demás candados con la misma forma salieron dos más (0084 y
-- 0088): un CFDI de egreso sin `devuelto_acumulado_mxn` pasaba, y con ese NULL
-- el índice único que impide timbrar dos egresos por la misma devolución
-- tampoco lo frenaba.
-- Aquí cada comparación lleva su `is not null` explícito.
--
-- No cambia ningún dato. Si alguna fila existente violara el candado nuevo, el
-- `add constraint` falla y la transacción entera se revierte.

begin;

alter table public.bonificaciones drop constraint if exists bonificaciones_pago_sano;
alter table public.bonificaciones add constraint bonificaciones_pago_sano check (
  (estado = 'por-pagar' and pagada_el is null and pagado_real_mxn is null
     and cuenta_ultimos4 is null and clave_rastreo is null)
  or (estado = 'pagada' and pagada_el is not null
     and pagado_real_mxn is not null and pagado_real_mxn > 0
     and cuenta_ultimos4 is not null and cuenta_ultimos4 ~ '^[0-9]{4}$'
     and clave_rastreo is not null and length(btrim(clave_rastreo)) > 0)
);

alter table public.experience_slots drop constraint if exists experience_slots_cancelacion_sana;
alter table public.experience_slots add constraint experience_slots_cancelacion_sana check (
  (cancelacion_causa is null and cancelacion_fuerza_mayor is null)
  or (cancelacion_causa is not null and cancelacion_causa = 'imputable' and cancelacion_fuerza_mayor is null
      and cancelada_at is not null and length(btrim(coalesce(cancelacion_motivo, ''))) > 0)
  or (cancelacion_causa is not null and cancelacion_causa = 'fuerza-mayor'
      and cancelacion_fuerza_mayor is not null
      and cancelacion_fuerza_mayor in ('clima', 'cierre-autoridad', 'contingencia-bloqueo', 'emergencia-guia')
      and cancelada_at is not null and length(btrim(coalesce(cancelacion_motivo, ''))) > 0)
);

alter table public.reservations drop constraint if exists reservations_politica_sana;
alter table public.reservations add constraint reservations_politica_sana check (
  (politica_variante is null and politica_hash is null and politica_aceptada_at is null)
  or (politica_variante is not null and politica_variante in ('estandar', 'expedicion')
      and politica_hash is not null and politica_hash ~ '^[0-9a-f]{64}$'
      and politica_aceptada_at is not null)
);

alter table public.cfdi_invoices drop constraint if exists cfdi_invoices_egreso_sano;
alter table public.cfdi_invoices add constraint cfdi_invoices_egreso_sano
  check (tipo <> 'egreso' or (relacionado_uuid is not null and devuelto_acumulado_mxn is not null and devuelto_acumulado_mxn > 0));

alter table public.cfdi_invoices drop constraint if exists cfdi_invoices_egreso_comision_sano;
alter table public.cfdi_invoices add constraint cfdi_invoices_egreso_comision_sano
  check (tipo <> 'egreso-comision' or (relacionado_uuid is not null and devuelto_acumulado_mxn is not null and devuelto_acumulado_mxn > 0));

commit;
