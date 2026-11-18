-- 0092 · EL DOCUMENTO QUE ACREDITA LA FUERZA MAYOR (D24.4 de legal)
--
-- La fuerza mayor quita la bonificación del 20 %, y quien la invoca la prueba
-- (LFPC 92 Bis). Legal pide el ARCHIVO, no sólo su descripción: el reporte, el
-- aviso de la autoridad o el cierre publicado.
--
--   · Bucket PRIVADO `fuerza-mayor`: sólo lo toca el service-role; se ve con
--     una URL firmada de vida corta, igual que los comprobantes.
--   · `experience_slots.cancelacion_documento_path` guarda la RUTA del objeto
--     (nunca una URL).
--   · Excepción: la emergencia médica del guía se acredita con la declaración
--     de la operadora, escrita en el motivo. NO se guarda parte médico ni
--     diagnóstico (dato de salud): ahí el candado EXIGE que no haya archivo.
--
-- Aditiva: un bucket, una columna y el candado de la 0091 reescrito con la
-- columna nueva. Ninguna salida tiene causa registrada todavía.

begin;

insert into storage.buckets (id, name, public)
values ('fuerza-mayor', 'fuerza-mayor', false)
on conflict (id) do nothing;

alter table public.experience_slots
  add column if not exists cancelacion_documento_path text;

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
);

comment on column public.experience_slots.cancelacion_documento_path is
  'Ruta en el bucket privado `fuerza-mayor` del documento que acredita la fuerza mayor (reporte, aviso o cierre de la autoridad). Obligatorio en clima, cierre-autoridad y contingencia-bloqueo. En emergencia-guia va NULL a propósito: se acredita con la declaración de la operadora en cancelacion_motivo, sin parte médico ni diagnóstico (dato de salud).';
comment on column public.experience_slots.cancelacion_motivo is
  'Qué pasó, escrito por quien canceló. En fuerza mayor: la autoridad o fuente, la fecha y la liga o folio del documento. En emergencia-guia: la declaración de la operadora, sin diagnóstico.';

commit;
