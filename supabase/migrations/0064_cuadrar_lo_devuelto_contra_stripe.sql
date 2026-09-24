-- 0064 · CUADRAR LO DEVUELTO CONTRA STRIPE
--
-- Al aplicar la 0063 salió que las tres fuentes internas de «lo devuelto» no
-- coincidían — $39,450 por `status`, $10,200 por `refunded_mxn`, $31,800 por el
-- libro de reembolsos— y la que lee el panel de rentabilidad es la de en medio.
--
-- ⚠️ NINGUNA DE LAS TRES ES LA VERDAD. La verdad es la caja: lo que Stripe
-- efectivamente devolvió. Se le preguntó, pago por pago, con la llave
-- restringida de sólo lectura (`STRIPE_LIVE_RESTRICTED_KEY`), leyendo
-- `charge.amount_refunded` de cada `provider_ref`. 46 de los 70 pagos pasaron
-- por Stripe y son verificables; los otros 24 son transferencias, que no
-- tienen nada que devolver por ahí.
--
-- Resultado, medido el 23 sep 2026:
--
--     Stripe devolvió $42,000.00 en 9 pagos, todos TOTALES (ni un parcial).
--
--     · 6 pagos tienen `status='refunded'` correcto y `refunded_mxn` en CERO.
--     · 1 pago tiene `refunded_mxn` correcto y sigue en `status='paid'`,
--       así que cuenta como ingreso y como devolución a la vez.
--     · 2 pagos ya estaban bien.
--     · CERO pagos marcados como devueltos que Stripe no haya devuelto.
--
-- Y eso explica por qué el libro y la columna «se contradecían»: no se
-- contradicen, se reparten. El libro (0056) sólo existe desde septiembre y
-- cubre lo devuelto por el botón; la columna cubre las devoluciones viejas
-- hechas a mano en Stripe. Cada una tenía su mitad. $31,800 + $10,200 = $42,000.
--
-- De aquí en adelante no se vuelve a abrir: `finalizeRefund` escribe las DOS
-- —el monto y el status— desde el mismo evento de Stripe (0063).
--
-- Para volver a comprobarlo cuando se quiera: `node scripts/conciliar-reembolsos.mjs`.
-- No escribe nada; sólo compara la base contra Stripe y dice dónde difieren.

-- ─────────────────────────────────────────────────────────────────────────────
-- LOS SEIS A LOS QUE LES FALTA EL MONTO
-- ─────────────────────────────────────────────────────────────────────────────
-- ⚠️ CADA UNO LLEVA SU GUARDA. La 0044 enseñó que un backfill con UUID de
-- producción revienta la reconstrucción de la base desde cero. Aquí el `where`
-- hace dos cosas: sobre una base limpia no afecta a nadie, y sobre producción
-- no pisa un valor que alguien ya haya corregido a mano.
update public.payments set refunded_mxn = 2550.00
  where id = '39e72628-300a-4a1f-9b5d-2d691da39bdd' and refunded_mxn = 0;  -- 1 jul · pi_3ToXtVGdwWS7efYP1R5EpszF
update public.payments set refunded_mxn = 5100.00
  where id = '6427835a-5c7d-4bb1-afe0-ad5b6665517d' and refunded_mxn = 0;  -- 5 jul · pi_3TptWXGdwWS7efYP1IwTlvnX
update public.payments set refunded_mxn = 2550.00
  where id = 'f91ceeb6-67f5-454e-9ff2-1ec8b8a02b16' and refunded_mxn = 0;  -- 7 jul · pi_3TqaaFGdwWS7efYP05vOx6TS
update public.payments set refunded_mxn = 2550.00
  where id = '3d33cdfd-638b-4752-88d2-c7382b4dd096' and refunded_mxn = 0;  -- 10 jul · pi_3TrSuvGdwWS7efYP1SkeDISm
update public.payments set refunded_mxn = 16500.00
  where id = '963df6db-9343-494c-93a3-33e6f477fea4' and refunded_mxn = 0;  -- 31 ago · pi_3UAX9vGdwWS7efYP1SAeqqE9
update public.payments set refunded_mxn = 2550.00
  where id = 'c617a3e4-fb3d-40b4-8c15-30af28edb3fe' and refunded_mxn = 0;  -- 31 ago · pi_3UAXPyGdwWS7efYP14yyni7a

-- ─────────────────────────────────────────────────────────────────────────────
-- EL QUE CONTABA COMO INGRESO Y COMO DEVOLUCIÓN A LA VEZ
-- ─────────────────────────────────────────────────────────────────────────────
-- Stripe confirma que se devolvieron los $2,550 completos el 26 jul. Con el
-- status en «paid» este cobro seguía sumando al ingreso del mes y al bruto de
-- su operadora — o sea que se le habría pagado comisión sobre dinero devuelto,
-- que es exactamente el bicho que el encabezado de `refunds.ts` describe.
update public.payments set status = 'refunded'
  where id = '1debc0af-eb54-48d7-8432-4288db8edb66' and status = 'paid';  -- 26 jul · pi_3TxR30GdwWS7efYP1ST4W3T8
