-- 0031 · ENCUESTA ABIERTA POR SALIDA — la segunda ruta (5 ago 2026)
--
-- Hoy la encuesta tiene UNA sola puerta: el token personal que sale por correo
-- (+24h de que termina la salida). Eso deja fuera a todo el que no pagó: en la
-- salida de hongos del 26 jul fueron **18 personas y solo 7 tenían link** — los
-- 11 acompañantes no tenían forma de opinar. Y mandar el token de alguien al
-- grupo NO es opción: `submitFeedback` hace UPDATE sobre esa fila, así que cada
-- respuesta pisaría la anterior y todas quedarían firmadas por la misma persona.
--
-- Esta migración abre la SEGUNDA ruta: un link por SALIDA que Luis manda al
-- grupo de WhatsApp. Cada quien pone nombre y correo; el sistema deduplica
-- contra `contacts` y CREA su propia fila (no pisa la de nadie).
--
-- SOLO ADITIVA. Namespace caminante.

-- 1 · La fila de feedback puede existir SIN reserva (un acompañante no compró).
alter table public.experience_feedback
  alter column reservation_id drop not null;

-- 2 · Saber de QUÉ salida es la respuesta. Antes se deducía por la reserva;
--     una respuesta abierta no tiene reserva de dónde deducirlo.
alter table public.experience_feedback
  add column if not exists slot_id uuid references public.experience_slots(id);

comment on column public.experience_feedback.slot_id is
  'Salida a la que responde. Obligatorio de facto en las respuestas ABIERTAS (sin reservation_id); en las invitadas se rellena desde la reserva.';

-- 3 · Backfill: las filas existentes SÍ tienen reserva → de ahí sale la salida.
update public.experience_feedback f
   set slot_id = r.slot_id
  from public.reservations r
 where f.reservation_id = r.id
   and f.slot_id is null;

-- 4 · Una respuesta por persona × salida. El índice viejo
--     (reservation_id, contact_id) deja de cubrir el caso abierto: en Postgres
--     los NULL son distintos entre sí, así que sin esto un acompañante podría
--     responder N veces. Con esto, si vuelve a entrar por el link del grupo, el
--     código ACTUALIZA su fila en vez de crear otra.
create unique index if not exists experience_feedback_once_slot
  on public.experience_feedback (slot_id, contact_id)
  where slot_id is not null;

-- 5 · El token PÚBLICO de la salida = el link que se manda al grupo.
--     Va en la salida, no en la experiencia: cada salida junta a otra gente y
--     su encuesta debe cerrarse por separado.
alter table public.experience_slots
  add column if not exists feedback_token text unique;

comment on column public.experience_slots.feedback_token is
  'Token del link ABIERTO de encuesta (/caminante/feedback/salida/<token>). Se genera bajo demanda desde el panel; NULL = esa salida no tiene link de grupo.';

-- 6 · El origen 'abierta' distingue quién llegó por el link del grupo.
alter table public.experience_feedback
  drop constraint if exists experience_feedback_source_check;
alter table public.experience_feedback
  add constraint experience_feedback_source_check
  check (source in ('email', 'whatsapp', 'web', 'abierta'));

-- Sin policies nuevas: RLS ya está activo sin policies (solo service-role) y el
-- acceso por token lo resuelve el server, igual que la encuesta personal.
