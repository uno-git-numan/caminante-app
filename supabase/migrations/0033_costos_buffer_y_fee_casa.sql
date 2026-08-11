-- 0033 · El buffer como tercer tipo de costo + el fee de la casa en 0
--
-- ADITIVA. Decisiones de Luis (11 ago 2026).
--
-- 1. `buffer` (la reserva de 5% por imprevistos del canon de costeo) se
--    distingue de un costo fijo real. Para el PUNTO DE EQUILIBRIO cuenta con
--    los fijos —hay que cubrirlo igual— pero en el tablero se ve aparte, como
--    en las hojas de Drive.
--
-- 2. `platform_fee_pct = 0` para Numan · Caminante, explícito y no NULL.
--    NULL significaba "no sé"; 0 significa "la casa no se cobra comisión a sí
--    misma", que es la verdad. Ojo: el neto NO es el bruto — falta restar la
--    comisión REAL de Stripe, que todavía no está cargada (0 de 48 pagos).

begin;

alter table public.experience_costs drop constraint if exists experience_costs_tipo_check;
alter table public.experience_costs add constraint experience_costs_tipo_check
  check (tipo in ('fijo', 'variable', 'buffer'));

comment on column public.experience_costs.tipo is
  'fijo = se paga completo vaya quien vaya · variable = por persona · buffer = reserva de imprevistos (cuenta con los fijos para el equilibrio, pero se muestra aparte).';

update public.operators
   set platform_fee_pct = 0
 where slug = 'numan-caminante';

commit;
