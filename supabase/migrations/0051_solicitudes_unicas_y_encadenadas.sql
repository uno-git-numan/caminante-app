-- 0051 · UNA SOLICITUD ABIERTA POR CORREO, Y LAS VIEJAS NO SE BORRAN
--
-- `operator_applications` no tiene ningún índice único. Eso no es un riesgo
-- futuro: hoy mismo alguien puede mandar la solicitud cinco veces y aparecen
-- cinco tarjetas idénticas en «01 Llegó». El tablero ya te puede mentir.
--
-- Y cuando alguien vuelve a aplicar después de un rechazo, la salida NO es
-- reabrir su fila. Una solicitud es el registro de lo que declaró ESE DÍA:
-- seguro, ratio de guías, incidentes. Si en enero declaró «0 incidentes» y en
-- octubre «2», ésas dos versiones son justo lo que quieres poder ver. Se
-- encadenan, no se sobrescriben — el mismo append-only de `registrations`.

alter table public.operator_applications
  add column if not exists solicitud_anterior_id uuid
    references public.operator_applications(id) on delete set null;

-- El motivo que ÉL lee sale de una lista cerrada. El texto libre (`motivo_rechazo`,
-- `notas`) se queda como está: interno, y él no lo ve. Esta separación es lo que
-- evita que algo escrito a las once de la noche acabe citado en otro lado.
alter table public.operator_applications
  add column if not exists motivo_publico text
    check (motivo_publico is null or motivo_publico in (
      'sin_seguro',           -- no cumple requisitos de seguro
      'sin_antiguedad',       -- sin antigüedad suficiente
      'expediente_incompleto',
      'fuera_de_catalogo',    -- no es el tipo de experiencia que operamos
      'no_ahora'              -- no podemos avanzar en este momento
    ));

-- Cuándo se le vuelve a abrir la puerta. NULL = sólo por invitación de la casa.
-- El plazo depende del motivo, no es un número fijo: «todavía no» son 90 días
-- porque queremos que vuelva; un «no» de seguridad no tiene fecha.
alter table public.operator_applications
  add column if not exists reabre_at timestamptz;

-- UNA sola solicitud viva por correo. Las cerradas (approved/rejected) no
-- estorban: por eso el índice es parcial y por eso reaplicar puede crear una
-- fila nueva sin chocar con la vieja.
create unique index if not exists operator_applications_una_abierta_por_correo
  on public.operator_applications (lower(email))
  where status in ('pending', 'calling', 'docs');

create index if not exists operator_applications_anterior_idx
  on public.operator_applications (solicitud_anterior_id);

comment on column public.operator_applications.solicitud_anterior_id is
  'Si volvió a aplicar, apunta a su solicitud previa. El tablero enseña UNA tarjeta con el historial detrás.';
comment on column public.operator_applications.motivo_publico is
  'Lista cerrada, es lo que él lee. El texto libre de motivo_rechazo/notas NO sale de la casa.';
