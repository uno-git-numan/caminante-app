-- 0061 · EL PESO CON DOMICILIO
--
-- `payments` tiene veintiún columnas y ninguna dice A QUÉ CUENTA DE STRIPE cayó
-- el dinero. Mientras todo entraba a NUMAN HUB daba igual: la respuesta era la
-- misma siempre y no hacía falta escribirla. Con Connect deja de serlo, y cada
-- renglón se vuelve ambiguo — no habría forma de saber, leyendo la tabla, si un
-- pago entró a la casa o a la operadora.
--
-- Se le da hogar ANTES de prender Connect, no después. Es el mismo error de
-- familia que el cupo en tres lugares y la casa que «era operator_id IS NULL»:
-- un hecho sin un solo domicilio. La diferencia es que éste todavía no ha
-- nacido, y así se queda.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · POR DÓNDE ENTRÓ
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.payments
  add column if not exists canal_cobro text not null default 'casa',
  add column if not exists stripe_account_id text,
  add column if not exists transfer_id text,
  -- Comisión + IVA: lo que Stripe retuvo como `application_fee`. NO es el
  -- ingreso (eso es `platform_fee_mxn`, sin IVA): es el total del CFDI que
  -- Caminante le emite a la operadora, y el número que tiene que cuadrar contra
  -- el estado de cuenta de Stripe al cierre del mes.
  add column if not exists fee_retenido_mxn numeric(12,2);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'payments_canal_cobro_valido'
  ) then
    alter table public.payments
      add constraint payments_canal_cobro_valido check (canal_cobro in ('casa', 'connect'));
  end if;
end $$;

-- ⚠️ `connect` EXIGE SABER A QUÉ CUENTA. Un pago que dice haber entrado a la
-- cuenta de la operadora sin decir cuál no se puede conciliar ni reembolsar:
-- el `reverse_transfer` necesita la cuenta. Que la base lo impida es más barato
-- que descubrirlo el día que alguien pida su dinero de vuelta.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'payments_connect_dice_su_cuenta'
  ) then
    alter table public.payments
      add constraint payments_connect_dice_su_cuenta check (
        canal_cobro <> 'connect' or stripe_account_id is not null
      );
  end if;
end $$;

comment on column public.payments.canal_cobro is
  'Por dónde entró el dinero: «casa» = a la cuenta de NUMAN HUB y se transfiere a mano; «connect» = cargo con destino, entró a NUMAN y Stripe transfirió a la cuenta de la operadora reteniendo la comisión.';
comment on column public.payments.stripe_account_id is
  'La cuenta conectada (acct_…) que recibió la transferencia. Obligatoria cuando canal_cobro = connect: sin ella no se puede conciliar ni revertir.';
comment on column public.payments.transfer_id is
  'El id de la transferencia (tr_…) hacia la cuenta conectada, para rastrear el movimiento. ⚠️ NO leer su monto para conciliar: transfer.amount es el BRUTO (Stripe transfiere todo y luego le carga la comisión a esa cuenta). Lo que recibió la operadora es amount_mxn - fee_retenido_mxn.';
comment on column public.payments.fee_retenido_mxn is
  'Lo que Stripe retuvo como application_fee = comisión + IVA. NO es el ingreso de la casa (eso es platform_fee_mxn, sin IVA): es el total del CFDI que Caminante le emite a la operadora.';

-- Los 70 pagos que ya existen son todos del camino de siempre. El default los
-- deja en «casa», que es la verdad — no se está reescribiendo historia.

-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · LA COLUMNA MUERTA
-- ─────────────────────────────────────────────────────────────────────────────
-- `platform_fee_pct_frozen`: NULL en los 70 renglones, y ni una lectura ni una
-- escritura en todo `src/`. Es el duplicado de la comisión que la 0037 quitó de
-- `operators` y que aquí sobrevivió sin que nadie lo notara.
--
-- ⚠️ NO SE BORRA EN ESTA MIGRACIÓN. Un `drop column` no es reversible y va en
-- su propia migración con autorización aparte (regla de la casa). Queda dicho
-- aquí para que quien lea la tabla sepa que no la use mientras tanto.
comment on column public.payments.platform_fee_pct_frozen is
  'MUERTA — nunca se escribió ni se leyó. NULL en el 100% de las filas. No usar: la comisión de una venta vive en platform_fee_mxn. Se elimina en una migración aparte.';
