-- 0060 · LA CASA SUBE POR LA OPERADORA, Y LA DISPENSA DEL CANDADO
--
-- Dos cosas que salieron del mismo diagnóstico (design/mvp/MVP.md, 22 sep 2026):
--
-- 1. Nomádika no podía subir su expediente (dos verdades sobre «¿ya es
--    operadora?» y la pantalla le creía a la equivocada) y la casa tampoco podía
--    subirlo por ella. Ahora la casa SÍ puede — y cuando lo hace, el documento
--    dice quién lo subió. Sin esa columna, un papel que subió Luis se vería
--    idéntico a uno que subió la operadora, y el revisor no sabría con quién
--    hablar de él.
--
-- 2. `correr-entre-volcanes` (Kéntro) está publicada y vendiendo con el
--    expediente de senderismo incompleto. Luis lo autorizó de palabra («ya lo
--    estoy tramitando») y el sistema lo dejó pasar porque NO SE DIO CUENTA: el
--    candado sólo pregunta al guardar el formulario, no en la caja. Al próximo
--    «Guardar cambios (en vivo)» la despublica sola. La salida correcta no es
--    dejar la caja sin candado: es que el brinco EXISTA COMO OBJETO, con quién
--    lo autorizó, por qué y hasta cuándo — y que venza solo. Es la diferencia
--    entre una excepción y un agujero.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · QUIÉN SUBIÓ CADA DOCUMENTO
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.operator_documents
  add column if not exists subido_por text;

comment on column public.operator_documents.subido_por is
  'Correo de la sesión que subió el archivo. Cuando la casa sube por la operadora, aquí se ve; no es de quién es el expediente (eso es operator_id).';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · LA DISPENSA: permiso explícito, con dueño y con fecha de caducidad.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.operator_activity_dispensas (
  id              uuid primary key default gen_random_uuid(),
  operator_id     uuid not null references public.operators(id) on delete cascade,
  actividad       text not null,
  -- Por qué se brinca el expediente. Obligatorio: una dispensa sin motivo es
  -- un agujero con otro nombre.
  motivo          text not null check (length(btrim(motivo)) >= 10),
  -- Quién la dio. Es el correo de la casa; la operadora no se dispensa sola.
  autorizada_por  text not null,
  autorizada_at   timestamptz not null default now(),
  -- ⚠️ VENCE SIEMPRE. Una dispensa sin fecha se vuelve permanente por olvido,
  -- que es exactamente lo que este objeto existe para impedir.
  vence_at        timestamptz not null,
  revocada_at     timestamptz,
  revocada_por    text,
  created_at      timestamptz not null default now(),
  constraint dispensa_vence_despues check (vence_at > autorizada_at),
  constraint dispensa_revocada_completa check (
    (revocada_at is null and revocada_por is null) or
    (revocada_at is not null and revocada_por is not null)
  )
);

create index if not exists operator_activity_dispensas_vigentes
  on public.operator_activity_dispensas (operator_id, actividad, vence_at)
  where revocada_at is null;

comment on table public.operator_activity_dispensas is
  'Permiso explícito y con caducidad para publicar/vender una actividad cuyo expediente no está aprobado. Lo da la casa. Se revoca, no se borra.';

-- Sólo el service-role (sin políticas: igual que el resto de la plataforma).
alter table public.operator_activity_dispensas enable row level security;

-- APPEND-ONLY, CON TRIGGER Y NO CON REGLAS DEL CÓDIGO: el service-role se
-- salta la RLS pero no se salta un trigger. Una dispensa no se edita ni se
-- borra; si ya no aplica, se REVOCA — y la revocación es lo único que se puede
-- escribir sobre una fila existente.
create or replace function public.dispensa_solo_se_revoca()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Una dispensa no se borra: se revoca (revocada_at, revocada_por).';
  end if;
  if new.operator_id    is distinct from old.operator_id
  or new.actividad      is distinct from old.actividad
  or new.motivo         is distinct from old.motivo
  or new.autorizada_por is distinct from old.autorizada_por
  or new.autorizada_at  is distinct from old.autorizada_at
  or new.vence_at       is distinct from old.vence_at
  or new.created_at     is distinct from old.created_at then
    raise exception 'Una dispensa no se edita: sólo se revoca.';
  end if;
  if old.revocada_at is not null and (
     new.revocada_at is distinct from old.revocada_at
  or new.revocada_por is distinct from old.revocada_por) then
    raise exception 'Una dispensa revocada no se des-revoca: se otorga otra.';
  end if;
  return new;
end $$;

drop trigger if exists dispensa_solo_se_revoca on public.operator_activity_dispensas;
create trigger dispensa_solo_se_revoca
  before update or delete on public.operator_activity_dispensas
  for each row execute function public.dispensa_solo_se_revoca();
