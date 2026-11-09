-- 0076 · RECIBO POR PAGO, FACTURA GLOBAL Y ORGANIZACIÓN DE FACTURAPI POR OPERADORA
-- (Fase 1.5–2 de facturación en el portal, 9 nov 2026)
--
-- El flujo es el de Facturapi «recibos»: cada pago cobrado genera un RECIBO (nota
-- de venta no fiscal, con PDF) en la organización de la operadora que vende; si el
-- cliente pide factura, el recibo se FACTURA a su RFC; lo que nadie facturó al
-- cerrar el mes entra en la FACTURA GLOBAL a público en general de esa
-- organización. Nada de esto decide montos: los lee de `payments`.
--
-- Aditiva. Todo lo toca sólo el service-role.

-- ── payments: el recibo y la global ─────────────────────────────────────────
alter table public.payments
  add column if not exists facturapi_receipt_id text,       -- id del recibo en Facturapi
  add column if not exists facturapi_receipt_key text,      -- key pública del recibo (liga de autofactura)
  add column if not exists recibo_expira_at timestamptz,    -- hasta cuándo se puede facturar individual
  add column if not exists recibo_enviado_at timestamptz,   -- cuándo se mandó el comprobante por correo
  add column if not exists cfdi_global_id uuid;             -- la global que lo absorbió (si ninguna persona lo facturó)

create unique index if not exists payments_facturapi_receipt_unique
  on public.payments (facturapi_receipt_id) where facturapi_receipt_id is not null;
create index if not exists payments_sin_recibo_idx
  on public.payments (status) where status = 'paid' and facturapi_receipt_id is null;

comment on column public.payments.facturapi_receipt_id is
  'Recibo (nota de venta) en Facturapi, en la organización de la operadora que vende. NULL = aún no se emite (sin llave, sin organización, o pago anterior al sistema).';
comment on column public.payments.cfdi_global_id is
  'Factura global a público en general que incluyó este pago. Cuando está puesto, status_cfdi = publico-general y ya no se factura individual.';

-- ── La factura global: un renglón por periodo y emisor ─────────────────────
create table if not exists public.cfdi_globales (
  id uuid primary key default gen_random_uuid(),
  emisor_operator_id uuid references public.operators(id) on delete set null,
  periodo_desde date not null,
  periodo_hasta date not null,
  periodicidad text not null default 'month' check (periodicidad in ('day','week','fortnight','month','two_months')),
  recibos int not null default 0,
  total_mxn numeric(12,2) not null default 0,
  facturapi_id text,
  uuid_cfdi text,
  xml_url text,
  pdf_url text,
  status text not null default 'pending' check (status in ('pending','stamped','error','cancelled')),
  error text,
  archived_to_caja boolean not null default false,
  created_at timestamptz not null default now(),
  stamped_at timestamptz
);
create index if not exists cfdi_globales_emisor_idx on public.cfdi_globales (emisor_operator_id, periodo_hasta desc);
alter table public.cfdi_globales enable row level security;  -- sin policies: solo service-role

alter table public.payments
  drop constraint if exists payments_cfdi_global_fk;
alter table public.payments
  add constraint payments_cfdi_global_fk foreign key (cfdi_global_id) references public.cfdi_globales(id) on delete set null;

-- ── cfdi_invoices: quién emite y de qué recibo salió ───────────────────────
alter table public.cfdi_invoices
  add column if not exists tipo text not null default 'cliente'
    check (tipo in ('cliente','comision','egreso','retencion')),
  add column if not exists emisor_operator_id uuid references public.operators(id) on delete set null,
  add column if not exists facturapi_receipt_id text;

comment on column public.cfdi_invoices.tipo is
  'cliente = la factura al cliente (B1/A1); comision = NUMAN→operadora (B2); egreso = nota de crédito; retencion = CFDI de retenciones (R1). Ver design/contabilidad/MAPA-FACTURACION.md.';

-- ── operators: su organización en Facturapi ────────────────────────────────
-- `facturapi_org_id` ya existe (0036). Las llaves de la organización se guardan
-- CIFRADAS (AES-256-GCM con FACTURAPI_KEY_SECRET, lib/facturacion/crypto.ts):
-- Facturapi sólo devuelve la llave Live completa al crearla, así que hay que
-- conservarla; nunca en claro.
alter table public.operators
  add column if not exists facturapi_live_key_enc text,
  add column if not exists facturapi_test_key_enc text,
  add column if not exists facturapi_legal_at timestamptz,   -- cuándo se mandaron los datos fiscales a Facturapi
  add column if not exists facturapi_csd_at timestamptz,     -- cuándo se subió el CSD a Facturapi
  add column if not exists facturapi_manifiesto_at timestamptz; -- cuándo firmó la Carta Manifiesto del PAC

comment on column public.operators.facturapi_live_key_enc is
  'Llave Live de la organización de Facturapi de esta operadora, cifrada con AES-256-GCM (FACTURAPI_KEY_SECRET). Jamás en claro ni en logs.';
