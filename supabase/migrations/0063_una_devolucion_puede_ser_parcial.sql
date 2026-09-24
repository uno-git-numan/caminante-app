-- 0063 · UNA DEVOLUCIÓN PUEDE SER PARCIAL
--
-- La Cláusula Quinta del convenio deja que el Operador fije su política de
-- cancelación, y una política de cancelación es casi siempre parcial: «50% si
-- cancelas con siete días». El sistema sólo sabía devolver el 100%
-- (`reembolsarPersona` manda el pago entero), así que el convenio prometía algo
-- que no se podía ejecutar. De las dos salidas —construirlo o prometer menos—
-- Luis eligió construirlo (23 sep 2026).
--
-- ⚠️ LO QUE STRIPE HACE CON UN PARCIAL, MEDIDO Y NO SUPUESTO. En un cargo con
-- destino, un refund parcial con `reverse_transfer` y `refund_application_fee`
-- reparte **en proporción y solo**. Medido contra Stripe (modo prueba) el
-- 23 sep 2026, sobre una venta de $1,750 con $350 de comisión:
--
--     refund de $875 (50%)  →  comisión devuelta $175 (50%)
--                              saldo de la operadora baja $700 (50% de $1,400)
--
-- Es exactamente lo que la Quinta promete —«la comisión se ajusta en la misma
-- proporción»— y lo mismo que hace Airbnb. No hay que calcular el reparto: hay
-- que pedirlo bien.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- EL ÍNDICE QUE LO IMPEDÍA
-- ─────────────────────────────────────────────────────────────────────────────
-- `reembolsos_un_vivo_por_pago` es único sobre `payment_id` donde el estado es
-- «solicitado» O «confirmado». Sirve para que un doble clic no pida dos
-- devoluciones, y para eso está bien.
--
-- Pero «confirmado» es un estado FINAL y feliz: una vez ahí se queda para
-- siempre, así que el índice también impedía **la segunda devolución parcial
-- del mismo pago**. Con devoluciones totales eso no se notaba —no hay segunda
-- vez— y con parciales es el caso normal: se devuelve el 50% hoy y el resto al
-- resolverse la queja.
--
-- El candado no se quita, se afina: sigue habiendo uno solo EN VUELO por pago.
-- Lo que deja de bloquear es la historia.
drop index if exists public.reembolsos_un_vivo_por_pago;

create unique index if not exists reembolsos_uno_en_vuelo_por_pago
  on public.reembolsos (payment_id)
  where estado = 'solicitado';

comment on index public.reembolsos_uno_en_vuelo_por_pago is
  'Un pago no puede tener dos devoluciones EN VUELO a la vez (un doble clic no pide dos). Los reembolsos ya confirmados no cuentan: un pago puede devolverse en varias parciales, y su suma la vigila payments.refunded_mxn.';

-- ─────────────────────────────────────────────────────────────────────────────
-- LO DEVUELTO, ACUMULADO
-- ─────────────────────────────────────────────────────────────────────────────
-- `payments.refunded_mxn` existe desde antes, la LEE el panel de rentabilidad
-- (`rentabilidad.ts:213`, el renglón «reembolsado») y casi nadie la escribe.
-- Con parciales deja de ser opcional: es lo que dice cuánto queda por devolver,
-- y sin ella habría que sumar `reembolsos` en cada consulta.
--
-- ⚠️ Y AL APLICAR ESTO SALIÓ QUE LAS TRES FUENTES NO CUADRAN. Medido en
-- producción el 23 sep 2026, lo devuelto según quien se le pregunte:
--
--     payments.status = 'refunded'  →  $39,450.00  (8 pagos)
--     payments.refunded_mxn         →  $10,200.00  (3 pagos)   ← la que lee el panel
--     libro de reembolsos           →  $31,800.00  (6 filas)
--
-- Los seis reembolsos confirmados dejaron su pago en `refunded` pero con
-- `refunded_mxn` en CERO, y hay un pago devuelto entero que sigue en `paid`
-- —cuenta como ingreso y como devolución a la vez—.
--
-- ⚠️ ESTA MIGRACIÓN NO LO CUADRA, A PROPÓSITO. Rellenar esos nueve renglones es
-- decidir cuál de las tres fuentes tiene razón, y eso es una decisión de Luis
-- sobre dinero ya cobrado, no un `update` que se cuela en una migración de
-- esquema. Queda medido y dicho.
--
-- El `set default 0` y el relleno de abajo sólo tocan los NULL, así que no
-- reescriben ninguno de esos nueve.
alter table public.payments
  alter column refunded_mxn set default 0;

update public.payments set refunded_mxn = 0 where refunded_mxn is null;

comment on column public.payments.refunded_mxn is
  'Cuánto se le ha devuelto al cliente de ESTE pago, sumando parciales. Lo escribe finalizeRefund cuando Stripe confirma. Lo que queda por devolver es amount_mxn - refunded_mxn; cuando llegan a ser iguales, status pasa a «refunded».';

-- ⚠️ NO SE PUEDE DEVOLVER MÁS DE LO COBRADO. Stripe lo rechazaría, pero para
-- entonces el libro ya diría otra cosa que la caja. Que la base lo impida es
-- más barato que descubrirlo conciliando.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'payments_devuelto_no_pasa_de_cobrado'
  ) then
    alter table public.payments
      add constraint payments_devuelto_no_pasa_de_cobrado
      check (refunded_mxn is null or refunded_mxn <= amount_mxn);
  end if;
end $$;
