-- 0081 · Los datos fiscales PRIVADOS de la operadora (11 nov 2026).
--
-- Con el modelo Airbnb, NUMAN presenta cada mes la informativa de plataformas
-- (LIVA 18-J III, decisión D4 de la sesión legal): nombre, RFC, CURP,
-- domicilio fiscal, institución financiera y CLABE de cada operadora. Eso
-- REVIERTE lo dicho el 9–11 nov («Caminante no guarda la CLABE»): Stripe no
-- devuelve la CLABE completa de una cuenta conectada (D4, D17).
--
-- POR QUÉ UNA TABLA APARTE y no columnas en `operators`: la ficha de la
-- operadora llegó a leerse con la llave pública (lo cerró la 0080). CURP y
-- CLABE son datos de identificación y patrimoniales: viven donde nunca hubo
-- una política, con RLS prendida y SIN políticas (sólo el service-role).
--
-- DE DÓNDE SALEN (un dato se obtiene, no se pide):
--   curp, domicilio_fiscal ... de la Constancia de Situación Fiscal confirmada
--                              por el SAT (lib/operadores/csf.ts), cuando su
--                              RFC es el de la operadora.
--   clabe ..................... se captura UNA vez en Cobrar; se valida su
--                              dígito de control.
--   banco ..................... de los 3 primeros dígitos de la CLABE contra
--                              el listado de Banxico (lib/fiscal/clabe.ts); si
--                              no está, se pide el nombre.
--
-- ADITIVA: una tabla nueva. Ninguna fila existente cambia al aplicarla.

create table if not exists public.operator_fiscal_privado (
  operator_id       uuid primary key references public.operators(id) on delete cascade,
  curp              text check (curp is null or curp ~ '^[A-Z][AEIOUX][A-Z]{2}[0-9]{6}[HMX][A-Z]{5}[A-Z0-9][0-9]$'),
  domicilio_fiscal  jsonb,
  csf_documento_id  uuid references public.operator_documents(id) on delete set null,
  clabe             text check (clabe is null or clabe ~ '^[0-9]{18}$'),
  banco             text,
  clabe_at          timestamptz,
  updated_at        timestamptz not null default now()
);

alter table public.operator_fiscal_privado enable row level security;  -- sin policies: solo service-role

comment on table public.operator_fiscal_privado is
  'CURP, domicilio fiscal, banco y CLABE de cada operadora, para la informativa mensual de plataformas (LIVA 18-J III). Datos personales y patrimoniales: RLS SIN políticas, sólo el service-role. Nunca se abre a anon/authenticated.';
comment on column public.operator_fiscal_privado.curp is
  'De la constancia confirmada por el SAT (persona física). Una persona moral no tiene CURP: NULL.';
comment on column public.operator_fiscal_privado.domicilio_fiscal is
  'De la constancia: {calle, numeroExterior, numeroInterior, colonia, localidad, municipio, estado, codigoPostal}.';
comment on column public.operator_fiscal_privado.clabe is
  'La CLABE donde recibe sus depósitos. Se valida el dígito de control al capturarla. No es la que viaja a Stripe como token: ésa no se guarda.';
comment on column public.operator_fiscal_privado.banco is
  'Sale de los 3 primeros dígitos de la CLABE (listado de Banxico). Sólo se teclea si el prefijo no está en el listado.';
