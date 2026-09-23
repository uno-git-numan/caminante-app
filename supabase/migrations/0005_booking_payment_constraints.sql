-- 0005 · VACÍA A PROPÓSITO (corregida el 23 sep 2026)
--
-- Índices y policies de `bookings` y de la `payments` vieja — marketplace que
-- producción nunca tuvo (ver la 0001).
--
-- Su único contenido con descendencia era el índice único de `provider_ref`
-- para que un webhook repetido no cobrara dos veces. Esa idea sigue viva: la
-- 0007 crea `payments_provider_ref_unique` sobre la `payments` de verdad, la de
-- `reservation_id`. No se perdió nada al vaciar esto.
--
-- Se conserva el archivo con su número para no mover la numeración.

select 1;
