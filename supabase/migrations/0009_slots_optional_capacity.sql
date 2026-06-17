-- 0009 — Cupo OPCIONAL por salida: capacity_total NULL = sin tope.
--
-- Contexto: en esta etapa Caminante quiere recibir registros sin que las fechas
-- se "agoten" (un cliente quedó bloqueado en Jun 18-21 al llegar a 13/13). El cupo
-- sigue siendo una feature real (la querremos cuando haya límite logístico real),
-- así que NO se elimina: se vuelve opcional.
--
-- Diseño: capacity_total deja de ser NOT NULL. NULL significa "sin tope".
--   · El check `seats_taken <= capacity_total` pasa solo cuando capacity_total es
--     finito; con NULL evalúa a NULL = TRUE (no bloquea). No hay que tocarlo.
--   · La columna generada seats_available = capacity_total - seats_taken queda NULL
--     en las salidas sin tope. El código trata seatsAvailable === null como ilimitado
--     (no muestra conteo ni "Agotado", nunca rechaza por cupo).
--   · seats_taken se SIGUE incrementando: queda como contador informativo de
--     cuántos se registraron a esa fecha.
--
-- Reversible: para volver a topar una salida, basta poner capacity_total = N.

alter table public.experience_slots
  alter column capacity_total drop not null;

-- Quita el tope a las salidas de Ensenada de Muertos (las únicas activas hoy).
-- Setear NULL recomputa la columna generada seats_available a NULL.
update public.experience_slots s
   set capacity_total = null, updated_at = now()
  from public.experiences e
 where s.experience_id = e.id
   and e.slug = 'ensenada-de-muertos';
