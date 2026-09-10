-- 0059 · EL ANEXO POR ACTIVIDAD (subconvenio)
--
-- El convenio general (0050) dice cómo se cobra, cómo se paga y quién responde.
-- Eso no cambia entre una caminata y un descenso a una caverna. Lo que sí cambia
-- es QUÉ HAY QUE ACREDITAR para tener derecho a llevar gente: la NOM-09-TUR-2002
-- acredita guías POR MODALIDAD, y estar acreditado en senderismo no acredita
-- para buceo. La 0058 ya hizo que el EXPEDIENTE fuera por actividad; esto hace
-- que el PAPEL diga lo mismo.
--
-- Es la 0050 un nivel más abajo, con la misma disciplina y por las mismas
-- razones: append-only, versionado, congelado, y con triggers —no con reglas del
-- código— porque el service-role se salta la RLS pero no se salta un trigger.
--
-- ⚠️ EL TEXTO NO VIVE AQUÍ. El del convenio sí (`operator_agreement_versions
-- .texto`) porque es uno y lo redacta un abogado. Los anexos son dieciséis y su
-- parte variable ya existe en el catálogo (`actividades.ts`), que es la misma
-- fuente del expediente que ve el Operador en pantalla: se ARMA con
-- `textoDelAnexo()`. Lo que se guarda aquí es el HASH de lo que se le pintó, que
-- es lo que cierra la discusión de «yo no firmé eso», y la lista de documentos
-- que se le exigían ese día.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · LAS FIRMAS. Una por operadora × actividad × versión del anexo.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.operator_activity_annexes (
  id            uuid primary key default gen_random_uuid(),
  operator_id   uuid not null references public.operators(id),
  -- Slug del catálogo. Sin FK a propósito: el catálogo vive en código, no en la
  -- base (misma decisión que en la 0058). La app valida contra `ACTIVIDADES`.
  actividad     text not null,

  -- `${marco}.${huella del catálogo}` — la calcula `versionDelAnexo()`. Cambia
  -- sola cuando cambia lo que se exige, para que nadie quede firmado a un texto
  -- viejo por olvidar subir un contador a mano.
  version       text not null,
  -- sha-256 del texto EXACTO que se mostró en pantalla.
  doc_hash      text not null,

  -- QUIÉN FIRMA. Igual que en la 0050: la empresa es la contraparte y la persona
  -- declara que puede obligarla, para que el convenio sobreviva a que se vaya.
  firmante_nombre       text not null,
  firmante_email        text not null,
  firmante_puesto       text,
  facultades_declaradas boolean not null check (facultades_declaradas),
  aceptado              boolean not null check (aceptado),

  -- LO QUE QUEDA CONGELADO: qué documentos se le exigían el día que firmó. Sin
  -- esto, agregar un requisito al catálogo reescribiría hacia atrás lo que
  -- alguien aceptó, y nadie podría probar qué decía el anexo que firmó.
  documentos_snapshot jsonb not null,

  firmado_at  timestamptz not null default now(),
  ip          text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- Una sola firma por operadora, actividad y versión. Refirmar = versión nueva.
create unique index if not exists operator_activity_annexes_una
  on public.operator_activity_annexes (operator_id, actividad, version);
create index if not exists operator_activity_annexes_op_idx
  on public.operator_activity_annexes (operator_id, actividad);

create or replace function public.forbid_annex_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'operator_activity_annexes es append-only (rastro legal): ni UPDATE ni DELETE';
end $$;

drop trigger if exists operator_activity_annexes_immutable on public.operator_activity_annexes;
create trigger operator_activity_annexes_immutable
  before update or delete on public.operator_activity_annexes
  for each row execute function public.forbid_annex_mutation();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · EL CACHÉ. Igual que en la 0050: la pantalla de Comunidad lee decenas de
--     operadoras de un jalón y no puede juntar tablas para saber si firmaron.
--     Lo mantiene un trigger, no la app: así no se puede olvidar.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.operator_activities
  add column if not exists anexo_version    text,
  add column if not exists anexo_firmado_at timestamptz;

create or replace function public.sync_anexo_actividad() returns trigger
language plpgsql as $$
begin
  update public.operator_activities
     set anexo_version    = new.version,
         anexo_firmado_at = new.firmado_at,
         updated_at       = now()
   where operator_id = new.operator_id
     and actividad   = new.actividad
     and (anexo_firmado_at is null or anexo_firmado_at < new.firmado_at);
  return new;
end $$;

drop trigger if exists operator_activity_annexes_sync on public.operator_activity_annexes;
create trigger operator_activity_annexes_sync
  after insert on public.operator_activity_annexes
  for each row execute function public.sync_anexo_actividad();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · RLS. Sin policies: sólo el service-role. La operadora ve lo suyo por el
--     panel, que ya resuelve su alcance.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.operator_activity_annexes enable row level security;

comment on table public.operator_activity_annexes is
  'Anexos por actividad firmados (subconvenios). APPEND-ONLY: corregir = firmar una versión nueva.';
comment on column public.operator_activity_annexes.documentos_snapshot is
  'Qué documentos se le exigían el día que firmó. Cambiar el catálogo después no reescribe lo aceptado.';
comment on column public.operator_activities.anexo_version is
  'Caché mantenido por trigger. La verdad está en operator_activity_annexes.';
