-- 0071 · LA ATRIBUCIÓN — quién del equipo tiene qué, y desde cuándo.
--
-- La 0070 creó al equipo (`staff`) y sus facultades; lo que faltaba es a quién
-- se le atribuye cada cosa que el equipo toma. Sin esto no hay cartera que
-- transferir ni comisión que calcular, y la pantalla de Equipo dice «Todavía
-- sin operadoras en su cartera» porque no existe dónde escribirlo.
--
-- Decisiones de Luis (25 sep 2026):
--   · Las solicitudes son LIBRES: las toma quien sea del equipo con la
--     facultad. Tomar es actuar sobre ellas (agendar la llamada, contestar la
--     tarjeta); no hay una bandeja de «asígnamela».
--   · Todo es TRANSFERIBLE: operadoras, tarjetas, grupos, entre perfiles.
--   · La atribución SE CONGELA EN EL HECHO y viaja con la transferencia: lo
--     devengado hasta ese día es de quien lo tenía; desde mañana, lo nuevo es
--     de quien la recibe. Al salir alguien del equipo, su cartera pasa a quien
--     la reciba —no se queda huérfana ni vuelve a la casa en silencio.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · EL LIBRO: una fila por (persona, cosa, tramo de tiempo)
-- ─────────────────────────────────────────────────────────────────────────────
-- Un libro y no una columna `vendedor_id` en cada tabla: la columna sólo sabe
-- quién tiene la cosa HOY, y la comisión de numan se calcula sobre TRAMOS (el
-- 10% de la comisión de cada operadora mientras la tuvo). Con el libro, «quién
-- la tenía el 14 de agosto» es una consulta, no una reconstrucción.
--
-- Qué se atribuye (`objeto`) y a qué apunta `objeto_id`:
--   solicitud  → operator_applications.id   (numan · onboarding)
--   operadora  → operators.id               (numan · la cartera; nace HEREDADA de
--                                            la solicitud al aprobarla)
--   tarjeta    → crm_cards.id               (operadora · clientes)
--   grupo      → experience_slots.id        (operadora · clientes; un grupo
--                                            privado o una salida que alguien
--                                            armó y vende)
--
-- Un objeto tiene UN titular a la vez (índice parcial de abajo). La fila
-- abierta es la que tiene `hasta` en null; cerrarla es escribir `hasta` y
-- `cierre`. Nunca se borra: es lo que dice de quién fue cada peso.
create table if not exists public.staff_atribuciones (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references public.staff(id) on delete restrict,
  objeto     text not null check (objeto in ('solicitud', 'operadora', 'tarjeta', 'grupo')),
  objeto_id  uuid not null,

  desde      timestamptz not null default now(),
  hasta      timestamptz,

  -- Cómo llegó a esta persona.
  --   tomada       la tomó ella misma (solicitud libre)
  --   asignada     se la dio la casa o su operadora
  --   transferida  la recibió de otra persona del equipo
  --   heredada     la operadora nace de la solicitud que ya tenía
  como       text not null check (como in ('tomada', 'asignada', 'transferida', 'heredada')),
  -- Por qué dejó de ser suya. Null mientras lo sea.
  --   transferencia  pasó a otra persona (hay una fila nueva con el mismo objeto)
  --   baja           salió del equipo y la cartera se transfirió
  --   resuelta       el objeto terminó (la solicitud se aprobó o rechazó, la
  --                  tarjeta se cerró): no hay a quién pasarla
  --   soltada        la casa se la quitó sin dársela a nadie
  cierre     text check (cierre in ('transferencia', 'baja', 'resuelta', 'soltada')),

  -- Quién hizo el movimiento (correo de sesión), para poder preguntar después.
  por        text,

  constraint staff_atribuciones_tramo check (hasta is null or hasta >= desde),
  constraint staff_atribuciones_cierre_con_hasta check ((hasta is null) = (cierre is null))
);

-- UN titular a la vez. Dos filas abiertas del mismo objeto serían dos personas
-- cobrando la misma comisión.
create unique index if not exists staff_atribuciones_un_titular
  on public.staff_atribuciones (objeto, objeto_id)
  where hasta is null;

-- «¿Qué tiene esta persona hoy?» y «¿quién tenía esto el día X?».
create index if not exists staff_atribuciones_por_persona
  on public.staff_atribuciones (staff_id, objeto)
  where hasta is null;
create index if not exists staff_atribuciones_por_objeto
  on public.staff_atribuciones (objeto, objeto_id, desde);

comment on table public.staff_atribuciones is
  'Libro de atribución del equipo (0071): quién tiene qué (solicitud, operadora, '
  'tarjeta, grupo) y en qué tramo. Fila abierta = hasta null. Nunca se borra.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · EL PESO SABE QUIÉN LO VENDIÓ
-- ─────────────────────────────────────────────────────────────────────────────
-- La comisión de Caminante (3% del cobrado sin IVA por grupo cerrado) es por
-- PAGO, y el pago se atribuye en el momento en que entra: al titular de la
-- tarjeta de esa persona para esa salida, o del grupo, si lo hay. Se CONGELA
-- aquí igual que `operator_id` (0016): una transferencia posterior de la
-- tarjeta no mueve un peso que ya cayó. Null = nadie del equipo lo vendió
-- (la casa, la web sola), que es la verdad de todos los pagos de hoy.
alter table public.payments
  add column if not exists vendedor_id uuid references public.staff(id) on delete restrict;

create index if not exists payments_vendedor_idx
  on public.payments (vendedor_id)
  where vendedor_id is not null;

comment on column public.payments.vendedor_id is
  'Quién del equipo vendió este pago (0071). Congelado al entrar el pago desde '
  'el titular de la tarjeta o del grupo; null = nadie del equipo.';

-- Sin políticas: sólo el cliente de servicio, como `staff`.
alter table public.staff_atribuciones enable row level security;
