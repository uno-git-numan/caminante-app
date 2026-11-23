-- 0094 · EL PERMISO QUE NO APLICA
--
-- Convenio v3.5 (Anexo B) y anexo por actividad, marco v3 (Cláusula Cuarta; D30
-- de legal, 23 nov 2026): los documentos de la actividad se entregan antes de
-- la primera salida, y «cuando un permiso no aplique a sus salidas, el Operador
-- lo declara así en la plataforma, bajo protesta de decir verdad, y esa
-- declaración forma parte de este anexo».
--
-- Dos permisos dependen del SITIO y no de la actividad: el del INAH (sólo si
-- hay vestigios) y el de área natural protegida (sólo si la salida entra a
-- una). Sin dónde declarar «no aplica», el candado de la salida le exigiría a
-- la operadora un permiso que no existe.
--
-- POR QUÉ UNA TABLA Y NO UN ESTADO MÁS EN `operator_documents`: esa tabla es de
-- ARCHIVOS (`archivo_path` es NOT NULL, y con razón: una fila es un papel que
-- alguien subió y que alguien revisa). Una declaración no es un papel: no tiene
-- archivo, no se aprueba ni se rechaza, y lo que importa de ella es QUIÉN la
-- hizo y CUÁNDO. Meterla ahí obligaría a inventar una ruta de archivo.
--
-- APPEND-ONLY EN LA PRÁCTICA: retirarla (sí aplicaba) no borra la fila, le pone
-- fecha. La declaración que se hizo sigue siendo un hecho con autor.

create table if not exists public.operator_no_aplica (
  id            uuid primary key default gen_random_uuid(),
  operator_id   uuid not null references public.operators(id) on delete cascade,
  actividad     text not null,
  documento     text not null,
  -- Quién lo declaró (correo de la sesión). Si actuó la casa por la operadora,
  -- es el correo de la casa: se ve que no fue ella.
  declarado_por text not null,
  declarado_at  timestamptz not null default now(),
  -- La versión del anexo de esa actividad vigente al declarar: la declaración
  -- forma parte de ESE anexo.
  anexo_version text,
  -- Sí aplicaba, o dejó de ser cierto: la declaración deja de valer desde aquí.
  retirada_at   timestamptz,
  retirada_por  text
);

-- Sólo los dos permisos que dependen del sitio. Una declaración de «no aplica»
-- sobre la póliza o la credencial del guía sería saltarse el candado.
alter table public.operator_no_aplica
  drop constraint if exists operator_no_aplica_documento_check;
alter table public.operator_no_aplica
  add constraint operator_no_aplica_documento_check
  check (documento is not null and documento in ('permiso-inah', 'permiso-anp'));

-- Retirar pide decir quién. (Un CHECK deja pasar el NULL: cada lado con su
-- `is not null`.)
alter table public.operator_no_aplica
  drop constraint if exists operator_no_aplica_retiro_check;
alter table public.operator_no_aplica
  add constraint operator_no_aplica_retiro_check
  check (
    (retirada_at is null and retirada_por is null)
    or (retirada_at is not null and retirada_por is not null and length(btrim(retirada_por)) > 0)
  );

alter table public.operator_no_aplica
  drop constraint if exists operator_no_aplica_autor_check;
alter table public.operator_no_aplica
  add constraint operator_no_aplica_autor_check
  check (declarado_por is not null and length(btrim(declarado_por)) > 0
         and actividad is not null and length(btrim(actividad)) > 0);

-- Una sola declaración VIVA por operadora, actividad y permiso.
create unique index if not exists operator_no_aplica_viva_idx
  on public.operator_no_aplica (operator_id, actividad, documento)
  where retirada_at is null;

create index if not exists operator_no_aplica_operator_idx
  on public.operator_no_aplica (operator_id);

-- Sin políticas: sólo el cliente de servicio la lee y la escribe, igual que el
-- resto del expediente.
alter table public.operator_no_aplica enable row level security;

comment on table public.operator_no_aplica is
  'Declaración de la operadora de que un permiso que depende del sitio (INAH, área natural protegida) no aplica a sus salidas de una actividad. Forma parte del anexo de esa actividad (marco v3, Cláusula Cuarta). No se borra: se retira con fecha.';
