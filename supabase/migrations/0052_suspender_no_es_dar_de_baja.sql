-- 0052 · SUSPENDER NO ES DAR DE BAJA
--
-- Hoy sólo existe `operators.active`, un booleano. Con eso, quitarle la venta a
-- una operadora y borrarla del mapa son la misma operación — y no lo son.
--
-- Una operadora con reservas vendidas que deja de poder vender NO es una
-- operadora borrada: hay VIAJEROS QUE YA PAGARON y que no hicieron nada. Cortar
-- de golpe es la única forma de que este sistema le quede mal a un cliente.
--
--   activa      · vende y opera.
--   suspendida  · no vende, SÍ opera lo ya vendido. Sus páginas siguen vivas y
--                 sus clientes no se enteran de nada. Es el 95% de los casos.
--   en_salida   · no vende, termina lo que tiene, y se cierra cuando pase su
--                 última salida.
--   baja        · el caso grave. Antes de esto hay que contestar quién atiende a
--                 los que ya pagaron y qué pasa con el dinero en tránsito; el
--                 sistema no puede contestarlo solo, pero sí puede obligar a que
--                 quede escrito (`estado_motivo` es obligatorio para la baja).

alter table public.operators
  add column if not exists estado text not null default 'activa'
    check (estado in ('activa', 'suspendida', 'en_salida', 'baja'));

alter table public.operators
  add column if not exists estado_desde timestamptz;
alter table public.operators
  add column if not exists estado_motivo text;

-- Migración de los datos que ya hay. `active = false` se traduce a SUSPENDIDA,
-- nunca a baja: dar de baja es una decisión con consecuencias para clientes
-- reales y no se toma por inferencia desde un booleano.
update public.operators
   set estado = case when active then 'activa' else 'suspendida' end,
       estado_desde = coalesce(estado_desde, updated_at, created_at)
 where estado = 'activa' and active is not null;

-- Una baja sin motivo escrito no se guarda.
alter table public.operators drop constraint if exists operators_baja_con_motivo;
alter table public.operators add constraint operators_baja_con_motivo
  check (estado <> 'baja' or (estado_motivo is not null and length(trim(estado_motivo)) > 0));

-- ⚠️ `operators.active` SIGUE AQUÍ A PROPÓSITO y se elimina en la 0053.
-- Si se borrara ahora, el código que está arriba en producción —que todavía
-- filtra por `active`— rompería las pantallas de operadores en el momento en que
-- se corriera esta migración. No es un parche: es el orden correcto de un
-- cambio de columna en caliente. Primero la columna nueva, luego el código que
-- la lee, y hasta entonces se tira la vieja.
comment on column public.operators.active is
  'OBSOLETA — la reemplaza `estado`. Se elimina en 0052b, ya que el código lea `estado`.';
comment on column public.operators.estado is
  'activa | suspendida (no vende, sí opera lo vendido) | en_salida | baja';
