-- LA ACTIVIDAD COMO OBJETO.
--
-- Hoy el sistema no sabe QUÉ HACE una operadora. `operator_applications.
-- tipo_operacion` guarda "mixta" — eso describe el negocio, no la actividad. Y
-- sin eso, cinco cosas no se pueden construir:
--
--   · pedirle a cada quien SU expediente (buceo no pide lo que pide senderismo)
--   · impedir que publique una experiencia de una actividad que no tiene aprobada
--   · saber qué anexo de seguridad tiene que aceptar
--   · decirle en su alta qué le falta
--   · mandarle el resumen de términos con SUS actividades dentro
--
-- ── LA DECISIÓN QUE DA FORMA A TODO ESTO (Luis, 9 sep 2026) ──────────────────
-- El permiso es POR ACTIVIDAD, no por operadora. Alguien que ya vende
-- senderismo y hoy declara buceo SIGUE VENDIENDO SENDERISMO mientras revisamos
-- su buceo. Lo contrario —congelar a la operadora entera— castigaría con
-- pérdida de ventas el haber sido honesto sobre una actividad nueva, y lo que
-- enseñaría es a no declararla.
--
-- Por eso el estado vive en `operator_activities`, una fila por operadora y
-- actividad, y NO hay una columna «expediente aprobado» en `operators`. Esa
-- columna sería justo el candado global que no queremos, y alguien la usaría.
--
-- ── DÓNDE VIVE EL CATÁLOGO ───────────────────────────────────────────────────
-- Las actividades y qué documentos pide cada una NO están en la base: viven en
-- `src/lib/operadores/actividades.ts`, del mismo modo que las tasas de comisión
-- viven en `comision.ts`. Son una DEFINICIÓN, no un dato: cambian por decisión
-- del equipo, se revisan leyendo un diff, y ninguna operadora puede editarlas.
-- La base guarda lo que sí es dato: qué declaró cada quien y en qué va.
-- El `slug` de abajo es la llave entre los dos mundos.

-- ── 1 · qué declaró al solicitar (paso 0) ────────────────────────────────────
alter table public.operator_applications
  add column if not exists actividades text[] not null default '{}';

comment on column public.operator_applications.actividades is
  'Slugs del catálogo de src/lib/operadores/actividades.ts. Es lo que dijo que
   hace al aplicar; al aprobarla se siembra operator_activities con esto.';

-- ── 2 · el estado por operadora y actividad ──────────────────────────────────
create table if not exists public.operator_activities (
  id            uuid primary key default gen_random_uuid(),
  operator_id   uuid not null references public.operators(id) on delete cascade,
  actividad     text not null,                    -- slug del catálogo

  -- incompleta → en_revision → aprobada, y de vuelta a incompleta si se rechaza.
  -- `suspendida` es distinta de borrarla: se deja de poder publicar sin perder
  -- el historial ni los documentos ya verificados (misma lógica que la 0052).
  estado        text not null default 'incompleta'
                check (estado in ('incompleta','en_revision','aprobada','suspendida')),

  declarada_at  timestamptz not null default now(),
  enviada_at    timestamptz,                      -- cuándo pidió revisión
  resuelta_at   timestamptz,                      -- cuándo la aprobamos o rechazamos
  resuelta_por  uuid references auth.users(id),
  motivo        text,                             -- por qué se rechazó o suspendió

  -- El anexo de buenas prácticas de ESTA actividad. El convenio general obliga
  -- a cumplir los anexos de lo declarado; aquí queda el recibo de cuál aceptó.
  anexo_version    text,
  anexo_aceptado_at timestamptz,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (operator_id, actividad)
);
create index if not exists operator_activities_operator_idx
  on public.operator_activities (operator_id);

-- Aprobada exige fecha de resolución, y rechazar exige decir por qué. Un «no»
-- sin motivo es un callejón sin salida para quien lo recibe.
alter table public.operator_activities
  drop constraint if exists operator_activities_resolucion_coherente;
alter table public.operator_activities
  add constraint operator_activities_resolucion_coherente check (
    (estado = 'aprobada'   and resuelta_at is not null)
    or (estado = 'suspendida' and resuelta_at is not null and motivo is not null)
    or estado in ('incompleta','en_revision')
  );

-- ── 3 · los documentos ───────────────────────────────────────────────────────
-- `actividad IS NULL` = documento GENERAL: se sube una vez y vale para todas.
-- Ese NULL es el corazón de la pantalla del expediente: al abrir una actividad
-- se listan sus documentos propios MÁS los generales que necesita, marcados
-- como ya cubiertos. Nada se sube dos veces.
create table if not exists public.operator_documents (
  id            uuid primary key default gen_random_uuid(),
  operator_id   uuid not null references public.operators(id) on delete cascade,
  actividad     text,                             -- NULL = general
  documento     text not null,                    -- slug del catálogo

  -- Ruta en el bucket privado `expedientes`. Nunca una URL pública: aquí hay
  -- identificaciones y actas constitutivas.
  archivo_path  text not null,
  archivo_nombre text,

  estado        text not null default 'en_revision'
                check (estado in ('en_revision','aprobado','rechazado')),
  motivo        text,                             -- obligatorio al rechazar

  -- ⚠️ VENCE ES UNA FECHA, NO UNA CASILLA. Un RNT o una póliza «entregados» no
  -- significan nada si caducaron: con una casilla el expediente se vería
  -- completo para siempre. Con fecha, el sistema puede avisar antes y marcarlo
  -- vencido solo. Es NULL sólo en los documentos que de verdad no caducan
  -- (acta constitutiva, protocolo de emergencia).
  vence_at      date,

  subido_at     timestamptz not null default now(),
  revisado_at   timestamptz,
  revisado_por  uuid references auth.users(id),

  unique (operator_id, actividad, documento)
);
create index if not exists operator_documents_operator_idx
  on public.operator_documents (operator_id);
-- Para el aviso de «vence pronto» sin recorrer la tabla entera.
create index if not exists operator_documents_vence_idx
  on public.operator_documents (vence_at) where vence_at is not null;

alter table public.operator_documents
  drop constraint if exists operator_documents_rechazo_con_motivo;
alter table public.operator_documents
  add constraint operator_documents_rechazo_con_motivo
  check (estado <> 'rechazado' or motivo is not null);

-- El UNIQUE de arriba trata dos NULL como distintos, así que no impediría dos
-- filas del MISMO documento general. Sin esto, «RNT» podría existir dos veces
-- con estados opuestos y la pantalla mostraría el que llegara primero.
create unique index if not exists operator_documents_general_uniq
  on public.operator_documents (operator_id, documento) where actividad is null;

-- ── 4 · de qué actividad es una experiencia ──────────────────────────────────
-- Es lo que consulta el candado de publicación. Se queda NULL en todo lo que ya
-- existe: nada de lo vendido se toca, y el candado sólo puede exigir actividad
-- donde alguien la haya declarado.
alter table public.experiences
  add column if not exists actividad text;

comment on column public.experiences.actividad is
  'Slug del catálogo. NULL = de antes de la 0058, o de la casa. El candado de
   publicación pide expediente aprobado sólo cuando NO es NULL.';

-- ── 5 · RLS ──────────────────────────────────────────────────────────────────
-- Encendida y SIN políticas, como el resto: sólo el service role entra. Aquí
-- hay identificaciones oficiales y actas; que un operador pudiera leer la
-- tabla sería poder leer el expediente de sus competidores.
alter table public.operator_activities enable row level security;
alter table public.operator_documents  enable row level security;
