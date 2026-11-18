-- 0093 · LA CLÁUSULA DE CUPO MÍNIMO (D26 de legal)
-- (design/legal/POLITICA-CANCELACION-CLIENTE-2026-11.md §7)
--
-- Cancelar una salida porque no se juntó gente genera la bonificación del 20 %
-- SALVO que el cliente lo supiera antes de pagar, con número y fecha. Esa
-- condición es de cada salida y viaja copiada en cada reserva que la aceptó.
--
-- 1 · La salida: la FECHA DE CONFIRMACIÓN (a más tardar ese día se confirma o
--     se cancela por cupo), cuándo se confirmó, y la hora en que salió el aviso
--     de cancelación por cupo (es la prueba de que se avisó en plazo).
--     ⚠️ El mínimo es `minimo` (0073). La fecha NO es `fecha_limite`: ésa es la
--     fecha para apartar lugar en el espacio del grupo y se llena sola.
-- 2 · La reserva: COPIA del mínimo y de la fecha que vio (no referencia a la
--     salida). Sin la copia, la reserva no tiene la cláusula.
-- 3 · La causa nueva de cancelación: `cupo-minimo`.
-- 4 · El candado de §7.4, en la base: con una reserva pagada que trae la
--     cláusula no se sube el mínimo ni se atrasa la fecha. Bajar, adelantar o
--     quitar la cláusula sí: favorece al cliente.
--
-- Aditiva: columnas nuevas (NULL en lo que existe), un candado reescrito con
-- una rama más y un trigger. Ninguna salida ni reserva existente cambia.

begin;

-- 1 · La salida ---------------------------------------------------------------
alter table public.experience_slots
  add column if not exists confirmacion_limite date,
  add column if not exists confirmada_at timestamptz,
  add column if not exists confirmada_por uuid,
  add column if not exists aviso_confirmacion_at timestamptz,
  add column if not exists cancelacion_aviso_at timestamptz;

alter table public.experience_slots drop constraint if exists experience_slots_confirmada_sana;
alter table public.experience_slots add constraint experience_slots_confirmada_sana check (
  confirmada_por is null or confirmada_at is not null
);

comment on column public.experience_slots.confirmacion_limite is
  'Cláusula de cupo mínimo (D26): el día a más tardar en que al cliente se le confirma la salida o se le cancela por falta de grupo. Junto con `minimo` activa la cláusula si respeta el piso por duración (lib/cancelacion/cupo-minimo.ts). NO es `fecha_limite` (fecha para apartar lugar en el espacio del grupo).';
comment on column public.experience_slots.confirmada_at is
  'Cuándo se confirmó que la salida sale. Una salida confirmada ya no se cancela por cupo: si después se cancela por falta de grupo es causa de quien opera (con bonificación).';
comment on column public.experience_slots.confirmada_por is
  'Quién la confirmó. NULL con confirmada_at puesto = se confirmó sola al llegar la fecha con el mínimo cubierto.';
comment on column public.experience_slots.aviso_confirmacion_at is
  'Cuándo se le avisó a la casa que la fecha de confirmación está por vencer sin el mínimo (una sola vez).';
comment on column public.experience_slots.cancelacion_aviso_at is
  'Cuándo salió a los clientes el aviso de cancelación por cupo mínimo. Es la prueba de que se avisó a más tardar el día de la fecha de confirmación.';

-- 3 · La causa nueva (el candado de la 0092, con una rama más) ----------------
alter table public.experience_slots drop constraint if exists experience_slots_cancelacion_sana;
alter table public.experience_slots add constraint experience_slots_cancelacion_sana check (
  (cancelacion_causa is null and cancelacion_fuerza_mayor is null and cancelacion_documento_path is null)
  or (cancelacion_causa is not null and cancelacion_causa = 'imputable'
      and cancelacion_fuerza_mayor is null and cancelacion_documento_path is null
      and cancelada_at is not null and length(btrim(coalesce(cancelacion_motivo, ''))) > 0)
  or (cancelacion_causa is not null and cancelacion_causa = 'fuerza-mayor'
      and cancelacion_fuerza_mayor is not null
      and cancelacion_fuerza_mayor in ('clima', 'cierre-autoridad', 'contingencia-bloqueo')
      and cancelacion_documento_path is not null and length(btrim(cancelacion_documento_path)) > 0
      and cancelada_at is not null and length(btrim(coalesce(cancelacion_motivo, ''))) > 0)
  or (cancelacion_causa is not null and cancelacion_causa = 'fuerza-mayor'
      and cancelacion_fuerza_mayor is not null and cancelacion_fuerza_mayor = 'emergencia-guia'
      and cancelacion_documento_path is null
      and cancelada_at is not null and length(btrim(coalesce(cancelacion_motivo, ''))) > 0)
  or (cancelacion_causa is not null and cancelacion_causa = 'cupo-minimo'
      and cancelacion_fuerza_mayor is null and cancelacion_documento_path is null
      and minimo is not null and confirmacion_limite is not null
      and confirmada_at is null
      and cancelada_at is not null and cancelacion_aviso_at is not null
      and length(btrim(coalesce(cancelacion_motivo, ''))) > 0)
);

comment on column public.experience_slots.cancelacion_causa is
  'Por qué se canceló la salida: imputable (causa de quien opera: bonificación del 20 % al cliente, LFPC 92 Bis y 92 Ter) · fuerza-mayor (D14: sin bonificación ni penalización) · cupo-minimo (D26: no se juntó el mínimo y se avisó en plazo; sin bonificación para las reservas que traen la cláusula, con bonificación para las anteriores). NULL = no cancelada, o cancelada antes de la 0090.';

-- 2 · La reserva --------------------------------------------------------------
alter table public.reservations
  add column if not exists clausula_minimo integer,
  add column if not exists clausula_limite date;

alter table public.reservations drop constraint if exists reservations_clausula_sana;
alter table public.reservations add constraint reservations_clausula_sana check (
  (clausula_minimo is null and clausula_limite is null)
  or (clausula_minimo is not null and clausula_minimo >= 2
      and clausula_limite is not null
      and politica_variante is not null and politica_hash is not null)
);

comment on column public.reservations.clausula_minimo is
  'Cláusula de cupo mínimo que el cliente vio antes de pagar (D26 §7.4): el mínimo de personas. COPIA, no referencia a la salida. NULL = la reserva no trae la cláusula: si la salida se cancela por falta de grupo, a esta persona se le debe la bonificación.';
comment on column public.reservations.clausula_limite is
  'Cláusula de cupo mínimo: la fecha a más tardar en que se le prometió confirmar o cancelar. La huella `politica_hash` cubre el texto con este mínimo y esta fecha ya escritos.';

-- 4 · El candado de §7.4 ------------------------------------------------------
create or replace function public.experience_slots_candado_clausula()
returns trigger
language plpgsql
as $$
declare
  minimo_prometido integer;
  limite_prometido date;
begin
  if new.minimo is not distinct from old.minimo
     and new.confirmacion_limite is not distinct from old.confirmacion_limite then
    return new;
  end if;

  -- Lo más estricto que se le prometió a alguien que ya pagó con la cláusula.
  select min(r.clausula_minimo), min(r.clausula_limite)
    into minimo_prometido, limite_prometido
    from public.reservations r
   where r.slot_id = new.id
     and r.clausula_minimo is not null
     and r.status in ('partially_paid', 'paid', 'completed');

  if minimo_prometido is null then
    return new;
  end if;

  if new.minimo is not null and new.minimo > minimo_prometido then
    raise exception 'Ya hay personas que pagaron sabiendo que el mínimo era %: no se puede subir.', minimo_prometido
      using errcode = 'check_violation';
  end if;
  if new.confirmacion_limite is not null and new.confirmacion_limite > limite_prometido then
    raise exception 'Ya hay personas que pagaron sabiendo que se les confirmaba a más tardar el %: la fecha no se puede atrasar.', limite_prometido
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists experience_slots_candado_clausula on public.experience_slots;
create trigger experience_slots_candado_clausula
  before update of minimo, confirmacion_limite on public.experience_slots
  for each row execute function public.experience_slots_candado_clausula();

comment on function public.experience_slots_candado_clausula() is
  'D26 §7.4: con una reserva pagada que trae la cláusula de cupo mínimo, el mínimo de la salida no sube y la fecha de confirmación no se atrasa respecto de lo que esa persona aceptó. Bajar, adelantar o quitar (NULL) sí: favorece al cliente.';

commit;
