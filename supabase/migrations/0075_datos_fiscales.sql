-- 0075 · DATOS FISCALES DEL CLIENTE (Fase 1 de facturación en el portal, 9 nov 2026)
--
-- Una ficha fiscal por CUENTA (decisión de Luis: una, editable). Vive en
-- «Mi espacio» → Tu expediente → Datos fiscales, y es lo que «Facturar» usa sin
-- volver a teclear. Cada CFDI congela su copia en cfdi_invoices (rfc, razon_social,
-- regimen_fiscal, uso_cfdi, codigo_postal, email), así que editar la ficha después
-- no reescribe ninguna factura emitida.
--
-- Aditiva. Sólo la toca el service-role (RLS prendida sin policies).

create table if not exists public.datos_fiscales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  -- Receptor CFDI 4.0, tal como lo exige el SAT (nombre EXACTO de la CSF).
  rfc text not null check (rfc = upper(rfc) and char_length(rfc) between 12 and 13),
  razon_social text not null check (char_length(razon_social) between 2 and 254),
  regimen_fiscal text not null,          -- c_RegimenFiscal ('601','612','626',…)
  uso_cfdi text not null default 'G03',  -- c_UsoCFDI por defecto al facturar
  codigo_postal text not null check (codigo_postal ~ '^[0-9]{5}$'),
  email text not null,                   -- a dónde llegan XML+PDF
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.datos_fiscales is
  'Ficha fiscal del cliente (una por cuenta). La usa «Facturar» en Mi espacio; cada CFDI congela su copia en cfdi_invoices.';
comment on column public.datos_fiscales.razon_social is
  'Nombre o razón social EXACTO de la Constancia de Situación Fiscal (CFDI 4.0 lo valida contra el SAT).';

create index if not exists datos_fiscales_contact_idx on public.datos_fiscales (contact_id);

alter table public.datos_fiscales enable row level security;  -- sin policies: solo service-role
