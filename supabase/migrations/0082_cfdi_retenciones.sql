-- 0082 · El CFDI de retenciones e información de pagos (12 nov 2026).
--
-- Con el modelo Airbnb, NUMAN le entrega a cada operadora, a más tardar el día
-- 5 del mes siguiente, un CFDI de retenciones (clave 26 «Servicios mediante
-- Plataformas Tecnológicas») con el complemento Servicios Plataformas
-- Tecnológicas 1.0, una sección por venta (LISR 113-C II; LIVA 18-J II c;
-- design/legal/REPORTE-MENSUAL-RETENCIONES-2026-11-12.md §2.2).
--
-- 1 · `payments.medio_pago`: con qué pagó el cliente, tal como lo dice Stripe
--     («card:credit», «card:debit», «card:prepaid», «oxxo», «customer_balance»…).
--     El complemento pide la forma de pago POR VENTA (FormaPagoServ, M14); la
--     clave del SAT se deriva en código (lib/fiscal/cfdi-retenciones.ts), no se
--     guarda: si el catálogo cambia, el dato crudo sigue sirviendo.
--
-- 2 · `cfdi_retenciones`: un comprobante por operadora y mes. Su `timbrado_at`
--     es el CORTE del reporte: una devolución confirmada antes se neta en su
--     venta; después, ya no toca el mes (legal §3).
--
-- ADITIVA: una columna nullable y una tabla nueva.

alter table public.payments
  add column if not exists medio_pago text;

comment on column public.payments.medio_pago is
  'Con qué pagó el cliente, como lo reporta Stripe: card:credit | card:debit | card:prepaid | card:unknown | oxxo | customer_balance | <tipo>. Fuente de FormaPagoServ del complemento de plataformas (la clave SAT se deriva en código). NULL = cobro anterior al 12 nov 2026 o sin dato.';

create table if not exists public.cfdi_retenciones (
  id                 uuid primary key default gen_random_uuid(),
  operator_id        uuid not null references public.operators(id) on delete restrict,
  mes                text not null check (mes ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  estado             text not null default 'pendiente'
                     check (estado in ('pendiente', 'timbrado', 'fallido', 'cancelado')),
  facturapi_id       text,
  uuid               text,
  -- Lo que el comprobante dice, congelado al timbrar (regla del SAT: montoRet
  -- = BaseRet × tasa, truncado).
  num_servicios      integer,
  monto_operacion    numeric(14,2),
  iva_trasladado     numeric(14,2),
  isr_retenido       numeric(14,2),
  iva_retenido       numeric(14,2),
  comision           numeric(14,2),
  payment_ids        uuid[] not null default '{}',
  error              text,
  enviado_a          text,
  enviado_at         timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  timbrado_at        timestamptz,
  constraint cfdi_retenciones_timbrado_completo
    check (estado <> 'timbrado' or (facturapi_id is not null and uuid is not null and timbrado_at is not null))
);

-- Un solo comprobante VIVO por operadora y mes: dos clics no timbran dos.
create unique index if not exists cfdi_retenciones_uno_vivo
  on public.cfdi_retenciones (operator_id, mes)
  where estado in ('pendiente', 'timbrado');

alter table public.cfdi_retenciones enable row level security;  -- sin policies: solo service-role

comment on table public.cfdi_retenciones is
  'CFDI de retenciones (clave 26, complemento Servicios Plataformas Tecnológicas 1.0) por operadora y mes. timbrado_at es el CORTE del reporte mensual. Uno vivo por operadora y mes (índice parcial). Ver src/lib/fiscal/cfdi-retenciones.ts.';
comment on column public.cfdi_retenciones.isr_retenido is
  'Lo que dice el CFDI: base del mes × tasa, TRUNCADO (regla del SAT). Puede diferir unos centavos de la suma de lo retenido por venta; esos centavos los pone NUMAN al enterar (legal, M15).';
