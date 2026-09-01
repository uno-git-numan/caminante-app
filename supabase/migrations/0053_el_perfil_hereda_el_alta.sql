-- 0053 · EL PERFIL HEREDA LO QUE YA NOS DIO EN EL ALTA
--
-- Para ser aprobado, un operador nos entrega justo lo que a un viajero le da
-- confianza: desde cuándo opera, cuántas personas lleva por salida, si tiene
-- seguro de responsabilidad civil, cuántos guías por persona, si su gente sabe
-- primeros auxilios. Hoy todo eso muere en `operator_applications` y su perfil
-- público sólo enseña nombre, bio, Instagram, equipo y fotos.
--
-- Y no basta con leerlo de la solicitud: son DOS COSAS DISTINTAS. La solicitud
-- es el registro congelado de lo que declaró ESE DÍA —no se toca nunca—; el
-- perfil es un documento vivo que él edita y que cambia con los años. Meterlos
-- en la misma tabla haría que corregir su perfil reescribiera su declaración.
--
-- Por eso: jsonb propio, sembrado desde la solicitud al aprobar, suyo a partir
-- de ahí. Mismo patrón que `legal` y `branding`, que ya viven así.

alter table public.operators
  add column if not exists perfil jsonb not null default '{}'::jsonb;

comment on column public.operators.perfil is
  'Perfil VIVO del operador (lo edita él). Se siembra desde su solicitud al aprobar. La solicitud no se toca.';

-- Siembra para quienes ya fueron aprobados: hoy tienen el perfil vacío aunque
-- nos hayan dado todo. `||` con `perfil` a la derecha hace que lo que el
-- operador ya haya escrito gane sobre lo declarado hace meses.
update public.operators o
   set perfil = jsonb_strip_nulls(jsonb_build_object(
         'ciudad_estado',     a.ciudad_estado,
         'tipo_operacion',    a.tipo_operacion,
         'antiguedad',        a.antiguedad,
         'salidas_ano',       a.salidas_ano,
         'personas_salida',   a.personas_salida,
         'seguro_rc',         a.seguro_rc,
         'primeros_auxilios', a.primeros_auxilios,
         'ratio_guias',       a.ratio_guias,
         'sembrado_de',       a.id::text
       )) || o.perfil
  from public.operator_applications a
 where a.operator_id = o.id
   and a.status = 'approved'
   and o.perfil = '{}'::jsonb;

-- La bio y el Instagram sí tienen columna propia y son del perfil público: se
-- llenan sólo si están vacíos, nunca pisando lo que el operador ya escribió.
update public.operators o
   set bio = coalesce(nullif(trim(o.bio), ''), a.descripcion),
       instagram = coalesce(nullif(trim(o.instagram), ''), a.instagram),
       whatsapp = coalesce(nullif(trim(o.whatsapp), ''), a.whatsapp)
  from public.operator_applications a
 where a.operator_id = o.id and a.status = 'approved';
