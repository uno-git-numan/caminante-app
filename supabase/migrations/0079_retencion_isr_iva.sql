-- 0079 · La retención de ISR e IVA a la operadora (11 nov 2026).
--
-- Luis: «Hay que hacerlo como hace airbnb entonces. Construye.» En el modelo B
-- de Stripe el dinero de la venta entra a NUMAN y se le transfiere a la
-- operadora; NUMAN cobra por cuenta de ella y la ley lo obliga a retenerle ISR
-- e IVA (decisión D1 de la sesión legal; LISR 113-A, LIVA 18-J II, LIF 2026
-- art. 25 VI y IX). Para 2026: ISR 2.5 % de lo cobrado sin IVA, IVA 50 % del
-- IVA cobrado (sin RFC: 20 % / 100 %).
--
-- Se calcula AL COBRAR y se congela en el pago, como la comisión. La
-- transferencia a la operadora ya sale neta (cobrado − comisión con IVA −
-- retención), así que estas columnas son el registro de lo que NUMAN se quedó
-- para enterar al SAT el día 17 y reportar en el CFDI de retenciones del día 5.
--
-- Las devoluciones NO se restan aquí: lo retenido que sigue en pie se deriva en
-- proporción a lo devuelto (src/lib/fiscal/retencion.ts → retencionVigente).
--
-- ADITIVA: tres columnas nullable. Ninguna fila existente cambia al aplicarla
-- (ninguna venta ha pasado todavía por cuenta conectada).

alter table public.payments
  add column if not exists isr_retenido_mxn numeric(10,2),
  add column if not exists iva_retenido_mxn numeric(10,2),
  add column if not exists retencion_regla  text;

alter table public.payments
  add constraint payments_retencion_sana check (
    (isr_retenido_mxn is null and iva_retenido_mxn is null)
    or (
      canal_cobro = 'connect'
      and isr_retenido_mxn >= 0 and iva_retenido_mxn >= 0
      and retencion_regla is not null
    )
  );

comment on column public.payments.isr_retenido_mxn is
  'ISR retenido a la operadora al cobrar por cuenta conectada (modelo Airbnb). Congelado: no se recalcula. Lo vigente tras devoluciones se DERIVA en proporción (retencionVigente). NULL = venta sin retención (por la casa, o anterior al 11 nov 2026).';
comment on column public.payments.iva_retenido_mxn is
  'IVA retenido a la operadora al cobrar por cuenta conectada (50 % del IVA cobrado con RFC; 100 % sin RFC). Mismas reglas que isr_retenido_mxn.';
comment on column public.payments.retencion_regla is
  'Con qué tasas se retuvo, p. ej. «2026:isr=0.025;iva=0.5;rfc». Las tasas son de la LIF y cambian por ejercicio.';
