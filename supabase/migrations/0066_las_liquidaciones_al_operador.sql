-- 0066 · LAS LIQUIDACIONES AL OPERADOR — su propia tabla
--
-- El paso 8 de los diez del MVP es «que se le liquide», y hoy no existe. Se ve
-- en la base: `operator_payables` está vacía y nada la llena.
--
-- ⚠️ Y NO ES LA TABLA. `operator_payables` guarda lo que la operadora le debe A
-- CAMINANTE —su `concepto` admite `platform_fee` y `profit_share`, y el panel
-- las llama «cobros»—. Lo que falta es la dirección contraria: lo que **Caminante
-- le debe a la operadora** cuando el cobro entró por la casa.
--
-- Medido el 23 sep 2026: Nomádika lleva 12 ventas por $21,000.00, con $3,620.64
-- de comisión, todas por canal `casa`. **Caminante le debe $17,379.36** y no hay
-- dónde escribir que ya se le pagó.
--
-- Se decidió tabla propia y no un signo en la existente (Luis, 23 sep). Mezclar
-- las dos direcciones en una tabla con signos es donde se equivoca la gente que
-- la consulta seis meses después: un total sin mirar el signo dice lo contrario
-- de la verdad.
--
-- ⚠️ ESTO SÓLO EXISTE PARA EL CANAL `casa`. Con Connect la liquidación no pasa
-- por aquí ni por nadie: el cobro entra a nombre de la operadora y su parte
-- nunca toca la cuenta de Caminante (0061, y la Cláusula Cuarta del convenio).
-- Escribir una liquidación de un pago por Connect sería inventar un movimiento
-- que no ocurrió, así que el candado de abajo lo impide.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · EL MOVIMIENTO: dinero que salió de Caminante hacia la operadora
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.operator_liquidaciones (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id) on delete restrict,

  -- Lo que se transfirió, en pesos. Mayor que cero: una liquidación de cero no
  -- es un movimiento, es un renglón que estorba.
  monto_mxn numeric(12,2) not null check (monto_mxn > 0),

  metodo text not null default 'transferencia'
    check (metodo in ('transferencia', 'efectivo', 'otro')),

  -- La referencia del banco. Es la llave para conciliar contra el estado de
  -- cuenta y la que impide registrar dos veces la misma transferencia — el
  -- mismo patrón que `payments.referencia` (0034), por la misma razón.
  referencia text,

  -- Cuándo se movió el dinero DE VERDAD, que no es cuándo se capturó. Sin esta
  -- distinción un cierre de mes no se puede defender.
  pagado_el date not null,

  comprobante_url text,
  notas text,
  -- Correo de quien lo registró. El dinero lo mueve una persona y eso se firma.
  registrado_por text,

  -- Una liquidación no se borra: si se capturó mal, se cancela y se hace otra.
  cancelada_at timestamptz,
  cancelada_por text,
  cancelada_motivo text,

  created_at timestamptz not null default now(),

  constraint liquidacion_cancelada_completa check (
    (cancelada_at is null and cancelada_por is null and cancelada_motivo is null)
    or (cancelada_at is not null and cancelada_por is not null and cancelada_motivo is not null)
  )
);

create unique index if not exists operator_liquidaciones_referencia_unica
  on public.operator_liquidaciones (referencia)
  where referencia is not null and cancelada_at is null;

create index if not exists operator_liquidaciones_operador_idx
  on public.operator_liquidaciones (operator_id, pagado_el desc);

alter table public.operator_liquidaciones enable row level security;

comment on table public.operator_liquidaciones is
  'Dinero que Caminante le transfirió a una operadora por ventas cobradas en la cuenta de la casa (canal «casa»). NO cubre Connect: ahí el cobro entra a nombre de la operadora y su parte nunca pasa por Caminante. La dirección contraria —lo que ella le debe a Caminante— vive en operator_payables.';
comment on column public.operator_liquidaciones.pagado_el is
  'Cuándo se movió el dinero, no cuándo se capturó. Es la fecha con la que cuadra el estado de cuenta.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · QUÉ PAGOS CUBRE — y el candado que impide pagar dos veces
-- ─────────────────────────────────────────────────────────────────────────────
-- Una liquidación cubre varios pagos (se junta la salida y se transfiere una
-- vez), y un pago se liquida UNA SOLA VEZ. Esa segunda mitad no es un detalle
-- de modelado: es el único candado que impide pagarle dos veces lo mismo a
-- alguien, y por eso es un índice único de la base y no una comprobación del
-- código.
create table if not exists public.operator_liquidacion_pagos (
  liquidacion_id uuid not null references public.operator_liquidaciones(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete restrict,
  -- Lo que de ese pago le tocaba: cobrado − devuelto − comisión. Se congela
  -- aquí porque la comisión de un pago viejo puede recalcularse mañana y lo que
  -- se transfirió ayer no cambia.
  neto_mxn numeric(12,2) not null check (neto_mxn > 0),
  primary key (liquidacion_id, payment_id)
);

-- ⚠️ EL CANDADO QUE IMPORTA: un pago no puede estar en dos liquidaciones.
--
-- Va sin condiciones, y eso es a propósito. El primer intento fue un índice
-- parcial «sólo las liquidaciones no canceladas», y Postgres lo rechaza:
-- `cannot use subquery in index predicate`. La salida fácil habría sido copiar
-- aquí el `cancelada_at` de la liquidación para poder filtrar por él — y eso es
-- exactamente el error que este repo persigue: el mismo hecho viviendo en dos
-- lugares, listos para desincronizarse.
--
-- Así que el renglón del vínculo significa una sola cosa, sin matices: **este
-- pago está liquidado**. Cancelar una liquidación borra sus vínculos (el
-- trigger de abajo), y con eso sus pagos vuelven a quedar por liquidar.
create unique index if not exists operator_liquidacion_pagos_un_pago_una_vez
  on public.operator_liquidacion_pagos (payment_id);

-- Cancelar una liquidación libera sus pagos. Va en un trigger y no en el
-- código porque es lo que sostiene el candado de arriba: si alguien cancela
-- por SQL y los vínculos se quedan, esos pagos no se le podrían volver a pagar
-- a nadie y nadie sabría por qué.
--
-- ⚠️ Se pierde el detalle de QUÉ cubría la liquidación cancelada; quedan su
-- monto, su fecha y el motivo. Es el precio de tener un solo hogar para «este
-- pago está liquidado», y se paga sólo en el caso de una captura equivocada.
create or replace function public.liberar_pagos_al_cancelar_liquidacion()
returns trigger language plpgsql as $$
begin
  if new.cancelada_at is not null and old.cancelada_at is null then
    delete from public.operator_liquidacion_pagos where liquidacion_id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists liberar_pagos_al_cancelar on public.operator_liquidaciones;
create trigger liberar_pagos_al_cancelar
  after update on public.operator_liquidaciones
  for each row execute function public.liberar_pagos_al_cancelar_liquidacion();

-- ⚠️ UN PAGO POR CONNECT NO SE LIQUIDA, PORQUE NUNCA PASÓ POR AQUÍ.
--
-- El encabezado de esta migración lo prometía y esta es la parte que lo cumple.
-- En Connect el cobro entra a nombre de la operadora y su parte jamás toca la
-- cuenta de Caminante: registrar una liquidación de ese pago sería escribir un
-- movimiento que no ocurrió, y después cuadraría de menos contra el banco.
--
-- También se exige que el pago siga vivo: liquidar uno reembolsado es
-- transferirle a alguien dinero que ya se le devolvió al cliente.
create or replace function public.solo_se_liquida_lo_de_la_casa()
returns trigger language plpgsql as $$
declare
  canal text;
  estado text;
begin
  select p.canal_cobro, p.status into canal, estado
    from public.payments p where p.id = new.payment_id;
  if canal is distinct from 'casa' then
    raise exception 'Ese cobro entró por % y no por la casa: su parte nunca pasó por Caminante, así que no hay nada que liquidarle.', coalesce(canal, 'un canal desconocido');
  end if;
  if estado <> 'paid' then
    raise exception 'Ese cobro está en «%» y no vivo: liquidarlo sería transferir dinero que ya se devolvió.', estado;
  end if;
  return new;
end $$;

drop trigger if exists solo_la_casa_se_liquida on public.operator_liquidacion_pagos;
create trigger solo_la_casa_se_liquida
  before insert on public.operator_liquidacion_pagos
  for each row execute function public.solo_se_liquida_lo_de_la_casa();

alter table public.operator_liquidacion_pagos enable row level security;

comment on table public.operator_liquidacion_pagos is
  'Qué pagos cubrió cada liquidación, con el neto congelado de cada uno. Un pago sólo puede estar en UNA liquidación viva: ése es el candado contra pagar dos veces lo mismo.';
