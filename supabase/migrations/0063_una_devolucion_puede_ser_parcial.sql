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
-- `payments.refunded_mxn` existe desde antes y NUNCA se escribió: es una de las
-- columnas que este repo llama «escritas que nadie lee», al revés. Con parciales
-- deja de ser decorativa — es lo que dice cuánto queda por devolver, y sin ella
-- la única forma de saberlo sería sumar `reembolsos` en cada consulta.
--
-- El default 0 es la verdad para los 62 pagos que existen: ninguno tiene
-- devolución confirmada.
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
