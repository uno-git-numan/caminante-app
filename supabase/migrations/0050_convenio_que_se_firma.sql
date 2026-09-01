-- 0050 · EL CONVENIO QUE SE FIRMA
--
-- Hoy el convenio es `operators.convenio_firmado_at`: una fecha suelta. Responde
-- CUÁNDO y nada más. No dice qué firmó, ni quién, ni con qué comisión, y un
-- UPDATE la mueve sin dejar rastro. Con eso, Kéntro y Nomádika llevan desde
-- siempre en «sin firmar» y no hay forma de cerrarlo: ninguna pantalla escribe
-- esa columna. El candado es inalcanzable.
--
-- Esto copia el modelo que ya usamos con los clientes en `registrations`: una
-- tabla APPEND-ONLY, versionada, congelada, con un trigger que impide mutarla.
-- El trigger es la pieza que importa — el service-role se salta la RLS, pero no
-- se salta un trigger.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · LAS VERSIONES. El documento vive en la base, no en el código: publicar un
--     convenio nuevo no debe necesitar un deploy.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.operator_agreement_versions (
  version       text primary key,                 -- "v1", "v2"…
  orden         int  not null unique,             -- para comparar cuál es más nueva
  tipo          text not null check (tipo in ('menor', 'mayor')),
  titulo        text not null,
  -- El texto ÍNTEGRO que se le muestra. No una liga: para que una firma valga,
  -- hay que poder probar qué se mostró en pantalla.
  texto         text not null,
  hash          text not null,                    -- sha-256 de `texto`
  publicada_at  timestamptz not null default now(),
  -- Cuándo empieza a ser exigible. En un cambio MAYOR se publica con 30 días de
  -- anticipación: durante esos 30 días el operador sigue vendiendo con la
  -- versión vieja. Un cambio MENOR nunca bloquea; sólo se avisa.
  vigente_desde timestamptz not null,
  created_at    timestamptz not null default now()
);

-- Una versión ya firmada no se puede editar: cambiaría el texto bajo los pies de
-- quien firmó. Antes de la primera firma sí, para poder corregir una errata.
create or replace function public.forbid_signed_version_mutation() returns trigger
language plpgsql as $$
begin
  if exists (select 1 from public.operator_agreements a
             where a.version = coalesce(old.version, new.version)) then
    raise exception 'la versión % ya tiene firmas: no se puede editar ni borrar', old.version;
  end if;
  return coalesce(new, old);
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · LAS FIRMAS. Append-only, una por operadora × versión.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.operator_agreements (
  id            uuid primary key default gen_random_uuid(),
  operator_id   uuid not null references public.operators(id),
  version       text not null references public.operator_agreement_versions(version),
  -- El hash de lo que REALMENTE se pintó en su pantalla. Si algún día no coincide
  -- con el de la versión, alguien tocó el documento y queremos saberlo.
  doc_hash      text not null,

  -- QUIÉN FIRMA. La empresa es la contraparte; la persona declara que puede
  -- obligarla. Por eso si el responsable se va, el convenio sigue vivo.
  firmante_nombre  text not null,
  firmante_email   text not null,
  firmante_puesto  text,
  facultades_declaradas boolean not null check (facultades_declaradas),
  aceptado              boolean not null check (aceptado),

  -- LO QUE QUEDA CONGELADO. `operators.commission_pct` se puede editar; esto no.
  -- Sin esta copia, subir la comisión de 20 a 22 borraría toda evidencia de que
  -- firmó con 20. Es el mismo congelamiento que ya hace cada venta.
  comision_pct   numeric(5,2) not null check (comision_pct >= 0 and comision_pct <= 20),
  comision_desde timestamptz,
  entidad_snapshot jsonb not null,   -- razón social, RFC, domicilio, tipo de persona

  -- RASTRO. Firmado con sesión iniciada: sin atribución, una firma no vale.
  firmado_at  timestamptz not null default now(),
  ip          text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create unique index if not exists operator_agreements_una_por_version
  on public.operator_agreements (operator_id, version);
create index if not exists operator_agreements_operador_idx
  on public.operator_agreements (operator_id);

create or replace function public.forbid_agreement_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'operator_agreements es append-only (rastro legal): ni UPDATE ni DELETE';
end $$;

drop trigger if exists operator_agreements_immutable on public.operator_agreements;
create trigger operator_agreements_immutable
  before update or delete on public.operator_agreements
  for each row execute function public.forbid_agreement_mutation();

drop trigger if exists agreement_versions_immutable on public.operator_agreement_versions;
create trigger agreement_versions_immutable
  before update or delete on public.operator_agreement_versions
  for each row execute function public.forbid_signed_version_mutation();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · EL CACHÉ. El pipeline lee decenas de operadoras de un jalón; que tenga que
--     juntar tablas para saber si firmó volvería lenta la pantalla más usada.
--     Lo mantiene un trigger, no el código de la app: así no se puede olvidar.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.operators
  add column if not exists convenio_version text
    references public.operator_agreement_versions(version);

create or replace function public.sync_convenio_operador() returns trigger
language plpgsql as $$
begin
  update public.operators
     set convenio_firmado_at = new.firmado_at,
         convenio_version    = new.version
   where id = new.operator_id
     and (convenio_firmado_at is null or convenio_firmado_at < new.firmado_at);
  return new;
end $$;

drop trigger if exists operator_agreements_sync on public.operator_agreements;
create trigger operator_agreements_sync
  after insert on public.operator_agreements
  for each row execute function public.sync_convenio_operador();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · RLS. Sin policies: sólo el service-role escribe y lee. La operadora ve su
--     convenio a través del panel, que ya resuelve su alcance.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.operator_agreement_versions enable row level security;
alter table public.operator_agreements enable row level security;

comment on table public.operator_agreements is
  'Convenios firmados por operadora. APPEND-ONLY: corregir = firmar una versión nueva.';
comment on column public.operator_agreements.comision_pct is
  'La comisión que se pactó AL FIRMAR. operators.commission_pct puede cambiar; esta no.';
