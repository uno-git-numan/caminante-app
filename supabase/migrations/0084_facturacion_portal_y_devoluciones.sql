-- 0084 · FACTURACIÓN DESDE EL PORTAL (D20) Y DEVOLUCIONES DOCUMENTADAS (D19)
-- (DECISIONES-LEGAL-FISCAL-2026-11-11.md §6 puntos 9 y 10; convenio v3.3,
--  Décima tercera §1 bis; aprobado por Luis el 17 nov 2026)
--
-- Aditiva. Nada de lo que existe cambia de valor; las columnas del CSD en el
-- bucket (`csd_cer_path`, `csd_key_path`) se quitan en la 0085, DESPUÉS de que
-- el código que ya no las lee esté en producción (están vacías: medido el 12 nov).
--
-- 1 · D20: la operadora ACTIVA la facturación desde su panel aceptando el §1 bis
--     del convenio. Esa aceptación es un rastro legal: append-only, con el texto
--     íntegro que se le mostró, su hash, la versión del convenio y quién aceptó.
--     El CSD ya no se guarda en ningún lado nuestro: del certificado sólo queda
--     lo que Facturapi confirma (número de serie y vigencia).
-- 2 · D19: una devolución cancela o reexpide el recibo, o emite el CFDI de
--     egreso relacionado. Cada egreso es un renglón de `cfdi_invoices` y se
--     identifica por el ACUMULADO devuelto que documenta: el mismo reembolso
--     visto dos veces (webhook + panel) choca con el índice y no timbra dos.

begin;

-- ── 1 · La activación de la facturación desde el portal ─────────────────────
create table if not exists public.operator_facturacion_portal (
  id               uuid primary key default gen_random_uuid(),
  operator_id      uuid not null references public.operators(id),
  accion           text not null check (accion in ('activar', 'desactivar')),
  -- Lo que se le mostró y aceptó (activar) o el porqué (desactivar).
  convenio_version text references public.operator_agreement_versions(version),
  texto            text not null,
  texto_hash       text not null,             -- sha-256 de `texto`
  -- Quién. El correo sale de la sesión, nunca del formulario (igual que las firmas).
  actor_nombre     text,
  actor_email      text not null,
  -- 'operadora' = ella misma desde su panel · 'casa' = la plataforma (sólo para
  -- desactivar: al terminar el convenio o por instrucción de ella).
  actor_rol        text not null check (actor_rol in ('operadora', 'casa')),
  ip               text,
  user_agent       text,
  created_at       timestamptz not null default now(),
  -- Activar lo hace sólo la operadora y con el texto del convenio.
  check (accion <> 'activar' or (actor_rol = 'operadora' and convenio_version is not null and actor_nombre is not null))
);
create index if not exists operator_facturacion_portal_op_idx
  on public.operator_facturacion_portal (operator_id, created_at desc);
alter table public.operator_facturacion_portal enable row level security;  -- sin policies: solo service-role

create or replace function public.forbid_facturacion_portal_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'operator_facturacion_portal es append-only (rastro legal): ni UPDATE ni DELETE';
end $$;
drop trigger if exists operator_facturacion_portal_immutable on public.operator_facturacion_portal;
create trigger operator_facturacion_portal_immutable
  before update or delete on public.operator_facturacion_portal
  for each row execute function public.forbid_facturacion_portal_mutation();

-- El caché en `operators`, mantenido por trigger (mismo patrón que el convenio):
-- activar lo pone, desactivar lo quita.
alter table public.operators
  add column if not exists facturacion_portal_at timestamptz,
  add column if not exists facturapi_csd_serial text;

comment on column public.operators.facturacion_portal_at is
  'Desde cuándo está ACTIVA la facturación desde el portal (D20): la operadora aceptó el §1 bis del convenio. NULL = apagada; Caminante no emite nada a su nombre. Lo mantiene el trigger de operator_facturacion_portal.';
comment on column public.operators.facturapi_csd_serial is
  'Número de serie del CSD según Facturapi. El certificado y su clave NO se guardan en la plataforma (D20 bis): viajan en memoria a Facturapi y aquí sólo queda su confirmación. La vigencia va en csd_vence_at.';

create or replace function public.sync_facturacion_portal() returns trigger
language plpgsql as $$
begin
  update public.operators
     set facturacion_portal_at = case when new.accion = 'activar' then new.created_at else null end
   where id = new.operator_id;
  return new;
end $$;
drop trigger if exists operator_facturacion_portal_sync on public.operator_facturacion_portal;
create trigger operator_facturacion_portal_sync
  after insert on public.operator_facturacion_portal
  for each row execute function public.sync_facturacion_portal();

-- ── 2 · Devoluciones ────────────────────────────────────────────────────────
-- El recibo: cuánto de lo devuelto ya está descontado en el recibo vigente
-- (reexpedido por lo neto), y los que se cancelaron en el camino.
alter table public.payments
  add column if not exists recibo_neto_de_mxn numeric(12,2),
  add column if not exists recibos_cancelados text[] not null default '{}';

comment on column public.payments.recibo_neto_de_mxn is
  'Lo devuelto que el comprobante vigente (recibo o CFDI de ingreso) YA descuenta (D19): se escribe al reexpedir el recibo por lo neto y al emitir sobre un pago con devolución previa. Si refunded_mxn es mayor, falta cancelar o reexpedir el recibo (y la global no lo toma) o falta el egreso.';
comment on column public.payments.recibos_cancelados is
  'Recibos de Facturapi cancelados por una devolución (el vigente está en facturapi_receipt_id).';

-- El egreso: qué CFDI relaciona (tipo 01) y qué acumulado devuelto documenta.
alter table public.cfdi_invoices
  add column if not exists relacionado_uuid text,
  add column if not exists devuelto_acumulado_mxn numeric(12,2),
  add column if not exists cfdi_global_id uuid references public.cfdi_globales(id) on delete set null;

-- Un egreso a público en general no tiene correo de receptor.
alter table public.cfdi_invoices alter column email drop not null;
alter table public.cfdi_invoices drop constraint if exists cfdi_invoices_email_cliente;
alter table public.cfdi_invoices add constraint cfdi_invoices_email_cliente
  check (tipo <> 'cliente' or email is not null);
alter table public.cfdi_invoices drop constraint if exists cfdi_invoices_egreso_sano;
alter table public.cfdi_invoices add constraint cfdi_invoices_egreso_sano
  check (tipo <> 'egreso' or (relacionado_uuid is not null and devuelto_acumulado_mxn > 0));

-- A lo más UNA factura de cliente viva por pago. Antes el índice no distinguía
-- el tipo: el primer egreso de un pago facturado habría chocado con su factura.
drop index if exists public.cfdi_invoices_payment_unique;
create unique index if not exists cfdi_invoices_payment_unique
  on public.cfdi_invoices (payment_id) where tipo = 'cliente' and status in ('pending', 'stamped');
create unique index if not exists cfdi_invoices_egreso_unique
  on public.cfdi_invoices (payment_id, devuelto_acumulado_mxn) where tipo = 'egreso' and status in ('pending', 'stamped');

comment on column public.cfdi_invoices.relacionado_uuid is
  'Egreso: UUID del CFDI de ingreso que corrige (la factura del cliente o la global), relación 01.';
comment on column public.cfdi_invoices.devuelto_acumulado_mxn is
  'Egreso: el refunded_mxn del pago que este egreso deja documentado. El egreso ampara la diferencia contra el anterior.';

commit;
