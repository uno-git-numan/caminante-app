-- 0047 · La comisión tiene tope, y la cuenta tiene fecha de arranque
--
-- Dos decisiones de Luis (28 ago 2026), escritas donde las va a leer quien
-- consulte la tabla y no solo quien abra el repo. Mismo criterio que la 0037.
--
-- ── 1. El tope ───────────────────────────────────────────────────────────────
-- «La comisión que tenemos pa cualquier otro operador. Tope en 20%, bajando
-- desde ahí.» O sea: 20% NO es una escala que baja sola con el volumen — es el
-- techo con el que entra todo mundo, y de ahí se negocia a la baja caso por
-- caso. Cada operador guarda SU número; el 20 es el default y el máximo.
--
-- El CHECK existe porque un tope que solo vive en la cabeza de alguien no es un
-- tope. Si algún día hay un trato legítimo arriba del 20%, se sube el límite
-- aquí a conciencia (una migración de tres líneas) en vez de descubrirlo cuando
-- ya se cobró.
--
-- ── 2. El arranque limpio ────────────────────────────────────────────────────
-- «La cuenta arranca limpia desde ahora en adelante.»
--
-- Esto NO es una nota: es un dato. Si viviera solo en un comentario, cualquier
-- consulta futura que multiplique commission_pct × ventas históricas inventaría
-- ingreso que nadie cobró, y lo haría en una pantalla que se ve perfectamente
-- sana. Con `comision_desde` esa suma es imposible: la comisión solo cuenta
-- desde la fecha, y quien escriba la consulta tropieza con la columna.
--
-- Aplica igual a todo operador, hoy y mañana: lo que vendió antes de su fecha
-- de arranque no genera comisión y no se suma nunca.

-- ── Lo que esta migración NO hace ────────────────────────────────────────────
-- No le pone comisión a `numan-caminante`. La casa vendiéndose a sí misma
-- retiene el 100%: un porcentaje ahí no significa nada. Se queda en NULL, que
-- según la 0037 además impide vender por Connect — correcto, porque la casa no
-- cobra por Connect sino con cargo directo.
--
-- No toca ninguna reserva ni ningún pago existentes. La comisión se congela en
-- la venta (0016) y jamás se recalcula; esto solo define lo que valdrá de aquí
-- en adelante.

begin;

-- ── El tope ──────────────────────────────────────────────────────────────────
alter table public.operators
  drop constraint if exists operators_commission_pct_tope;
alter table public.operators
  add constraint operators_commission_pct_tope
  check (commission_pct is null or (commission_pct >= 0 and commission_pct <= 20));

comment on constraint operators_commission_pct_tope on public.operators is
  'Tope de politica: 20% es el techo con el que entra todo operador y de ahi se negocia A LA BAJA. No es una escala por volumen. Si algun dia hay un trato legitimo arriba del 20, se sube este limite a conciencia.';

-- ── El arranque ──────────────────────────────────────────────────────────────
alter table public.operators
  add column if not exists comision_desde timestamptz;

comment on column public.operators.comision_desde is
  'Desde cuando este operador genera comision. NULL = nunca ha generado. Toda consulta de comision DEBE filtrar por esta fecha: lo vendido antes ya paso sin comision, y multiplicarlo por commission_pct inventaria ingreso que nadie cobro.';

-- ── Los operadores externos entran con el techo ──────────────────────────────
-- Los dos operadores dados de alta entran con el techo: 20% (nadie ha negociado a
-- la baja todavía) y su cuenta empieza hoy.
update public.operators
   set commission_pct = 20.00,
       comision_desde = coalesce(comision_desde, now())
 where slug in ('kentro', 'nomadika');

commit;
