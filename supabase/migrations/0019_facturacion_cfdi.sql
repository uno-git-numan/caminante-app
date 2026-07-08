-- 0019 — Facturación CFDI (autofactura) + puente a "La Caja"
--
-- Contexto: Stripe COBRA la tarjeta pero NO emite el CFDI mexicano — son dos
-- pasos. Este es el segundo: timbrar el CFDI 4.0 de ingreso vía un PAC (Facturapi)
-- con el CSD de NUMAN HUB (RFC NHU250826CS8, régimen 601), IVA 16% desglosado.
--
-- Modelo elegido: AUTOFACTURA. El cliente paga sin fricción; después, en una
-- página pública, mete sus datos fiscales (RFC, razón social, régimen, uso CFDI,
-- CP) y se timbra su CFDI. Solo factura quien lo pide; el resto se agrupa en el
-- CFDI global "público en general" al cierre de mes (fase admin).
--
-- Vocabulario de estado alineado con La Caja (ingresos.csv):
--   payments.status_cfdi: 'por-emitir' (cobrado, sin CFDI — DEFAULT)
--                       → 'emitido' (timbrado a un RFC) | 'publico-general'
--                         (incluido en el global) | 'no-facturable' (fuera de plazo).
--
-- Aditiva e inocua para prod: los pagos existentes quedan 'por-emitir'
-- (facturables). Toda escritura vía service-role; la página pública opera con
-- server actions (service-role), nunca toca estas tablas como anon.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · PAYMENTS — estado de facturación por pago
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.payments
  add column if not exists status_cfdi text not null default 'por-emitir'
    check (status_cfdi in ('por-emitir', 'emitido', 'publico-general', 'no-facturable'));

-- Solo los pagos realmente cobrados son facturables; los no-'paid' no aplican,
-- pero el default no estorba (la lógica filtra por status='paid').
create index if not exists payments_status_cfdi_idx
  on public.payments (status_cfdi) where status_cfdi = 'por-emitir';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · CFDI_INVOICES — un CFDI de ingreso por pago (datos fiscales + resultado)
--     Los datos fiscales del receptor se capturan AQUÍ (al facturar), no en el
--     checkout — por eso viven en esta tabla y no en contacts.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.cfdi_invoices (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,

  -- Receptor (CFDI 4.0) — claves del catálogo SAT.
  rfc text not null,
  razon_social text not null,          -- nombre/razón social EXACTO ante el SAT
  regimen_fiscal text not null,        -- c_RegimenFiscal (ej. '601','612','626')
  uso_cfdi text not null,              -- c_UsoCFDI (ej. 'G03','S01')
  codigo_postal text not null,         -- CP fiscal del receptor (5 dígitos)
  email text not null,                 -- a dónde se envía el CFDI

  -- Montos (MXN). Precio al público INCLUYE IVA → subtotal = total / 1.16.
  total_mxn numeric(12,2) not null check (total_mxn > 0),
  subtotal_mxn numeric(12,2),
  iva_mxn numeric(12,2),

  -- Resultado del timbrado.
  status text not null default 'pending'
    check (status in ('pending', 'stamped', 'error', 'cancelled')),
  facturapi_id text,                   -- id de la factura en el PAC
  uuid_cfdi text,                      -- folio fiscal (UUID SAT)
  xml_url text,                        -- ruta en Storage (bucket 'cfdi')
  pdf_url text,
  error text,

  -- Puente a La Caja: una skill de ~/Finanzas drena los 'stamped' sin archivar,
  -- baja XML+PDF y escribe la fila de ingresos.csv + emitidas/.
  archived_to_caja boolean not null default false,

  created_at timestamptz not null default now(),
  stamped_at timestamptz
);

-- Un pago no se factura dos veces: a lo más UN CFDI vivo (pending/stamped) por pago.
create unique index if not exists cfdi_invoices_payment_unique
  on public.cfdi_invoices (payment_id) where status in ('pending', 'stamped');
create index if not exists cfdi_invoices_status_idx on public.cfdi_invoices (status, created_at desc);
create index if not exists cfdi_invoices_caja_idx
  on public.cfdi_invoices (archived_to_caja) where status = 'stamped' and archived_to_caja = false;
create index if not exists cfdi_invoices_uuid_idx on public.cfdi_invoices (uuid_cfdi);

alter table public.cfdi_invoices enable row level security;  -- sin policies: solo service-role

-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · STORAGE — bucket privado para los pares XML+PDF timbrados
--     Privado: son documentos fiscales. Descarga del cliente vía signed URL;
--     la skill de La Caja los lee con service-role.
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('cfdi', 'cfdi', false)
on conflict (id) do nothing;
