-- 0052b · SE VA `operators.active`
--
-- Correr SÓLO cuando el código que lee `estado` ya esté en producción. Antes de
-- eso, esta migración tira las pantallas de operadores.
--
-- Comprobación previa (debe devolver 0 filas):
--   select id, name, active, estado from public.operators
--    where active <> (estado = 'activa');

alter table public.operators drop column if exists active;
