-- 0036 · Connect + emisor propio del operador
--
-- ADITIVA.
--
-- Qué desbloquea: que un operador externo cobre en SU cuenta de Stripe (cargo
-- directo, Numan retiene application_fee) y facture al cliente con SU propio
-- CSD. Hoy el 100% del cobro cae en NUMAN HUB y al operador se le transfiere a
-- mano.
--
-- Nada aquí enciende ese camino: son los cimientos que lee el gate
-- `operadorListo` (lib/operators/listo-para-vender.ts). El cobro sigue corriendo
-- por `createCheckout` sin un solo cambio, que es la mitigación acordada — el
-- camino que hoy mueve dinero real no se toca hasta el final.
--
-- ⚠️ `stripe_account_id` YA EXISTE: la agregó otra sesión junto con
-- `platform_fee_pct`, `profit_share_pct`, `profit_share_slugs` y
-- `stripe_fee_bearer`. Va con `if not exists` para no chocar.
--
-- ⚠️ LA COMISIÓN SALE DE `commission_pct` Y DE NINGÚN OTRO LADO. `platform_fee_pct`
-- no la lee nadie (verificado: 10 archivos leen commission_pct, 0 leen la otra).
-- Si Connect leyera una y el reporte de payout la otra, el checkout cobraría un
-- porcentaje y el corte mostraría otro: un bug de dinero silencioso.

begin;

alter table public.operators
  -- Lo que STRIPE dice que la cuenta ya puede hacer, no lo que nosotros creemos.
  -- Lo escribe el webhook `account.updated`: que exista la cuenta no significa
  -- que el KYC esté completo.
  add column if not exists stripe_account_id text,
  add column if not exists stripe_charges_enabled boolean not null default false,
  add column if not exists stripe_payouts_enabled boolean not null default false,
  -- Lo que Stripe todavía le pide. Se le muestra al operador TAL CUAL, sin
  -- traducir: si Stripe pide un documento, tiene que leer cuál.
  add column if not exists stripe_requirements jsonb,
  add column if not exists stripe_onboarded_at timestamptz,

  -- Datos de EMISOR del CFDI. Sin ellos no se puede timbrar a su nombre, que es
  -- justo lo que distingue a un operador de un embajador.
  add column if not exists rfc text,
  add column if not exists razon_social text,
  add column if not exists regimen_fiscal text,
  add column if not exists cp_fiscal text,
  add column if not exists tipo_persona text,

  -- Su organización en Facturapi: el cliente deja de ser un singleton.
  add column if not exists facturapi_org_id text,
  -- RUTA del objeto en el bucket privado `csd`, NUNCA una URL. Mismo patrón que
  -- `payments.comprobante_url` (0034), pero el riesgo es mayor: un comprobante
  -- filtrado expone datos; un CSD filtrado permite SUPLANTAR fiscalmente.
  -- ⚠️ La CONTRASEÑA del CSD no se guarda aquí ni en ninguna columna: va directo
  -- a Facturapi al crear la organización.
  add column if not exists csd_path text,
  add column if not exists csd_subido_at timestamptz,
  add column if not exists csd_vence_at date,

  -- El gate lee el convenio FIRMADO, no una casilla que alguien marcó de buena fe.
  add column if not exists convenio_path text,
  add column if not exists convenio_firmado_at timestamptz;

-- Define si aplica retención de ISR e IVA de plataforma. Pendiente de la
-- respuesta de Jorge, pero la columna se crea desde ya: si el dato no se captura
-- en el alta, después hay que rellenarlo hacia atrás preguntándole a cada
-- operador, y eso ya no se hace.
alter table public.operators
  drop constraint if exists operators_tipo_persona_check;
alter table public.operators
  add constraint operators_tipo_persona_check
  check (tipo_persona is null or tipo_persona in ('fisica','moral'));

comment on column public.operators.stripe_requirements is
  'Lo que Stripe todavia pide, tal cual viene de la API. Se le muestra al operador sin traducir.';
comment on column public.operators.tipo_persona is
  'fisica | moral. Define si aplica retencion de ISR e IVA de plataforma (Numan es corresponsable solidaria).';
comment on column public.operators.csd_path is
  'RUTA en el bucket privado `csd`. NUNCA una URL: el CSD es la firma electronica del operador. La contrasenia no se guarda.';
comment on column public.operators.csd_vence_at is
  'El CSD caduca a los 4 anios. Vencido, `operadorListo` deja de aprobar al operador y el SAT rechaza el sello.';
comment on column public.operators.convenio_firmado_at is
  'Fecha de firma del convenio. El gate lee esto, no una casilla marcada a mano.';

-- ── operator_payables: una sola tabla para las dos epocas ────────────────────
--
-- Decision (13 ago): NO se crea `operator_payouts`. Las dos epocas van a
-- convivir meses —unos operadores en Connect, otros cobrando por transferencia—
-- y en dos tablas cada reporte tendria que unirlas.
--
-- ⚠️ CONDICION, o la tabla miente: `estado` significa cosas DISTINTAS segun el
-- origen. En `manual` es una deuda viva de Numan hacia el operador. En `connect`
-- el dinero YA SE PAGO SOLO (cargo directo: nunca paso por Numan) y la fila es
-- solo auditoria. TODA consulta que responda "¿cuanto debo?" TIENE que filtrar
-- `origen = 'manual'`. Una suma sin ese filtro reportaria como deuda algo que
-- Stripe ya deposito.
alter table public.operator_payables
  add column if not exists origen text not null default 'manual';

alter table public.operator_payables
  drop constraint if exists operator_payables_origen_check;
alter table public.operator_payables
  add constraint operator_payables_origen_check
  check (origen in ('manual','connect'));

comment on column public.operator_payables.origen is
  'manual | connect. En manual `estado` es DEUDA VIVA de Numan. En connect el dinero ya se pago solo (cargo directo) y la fila es AUDITORIA: Numan no debe nada. Toda consulta de "cuanto debo" DEBE filtrar origen=manual.';

create index if not exists operator_payables_origen_idx
  on public.operator_payables (origen, estado);

commit;
