-- 0062 · UN CONVENIO PUEDE CONGELAR UNA ESCALA, NO SÓLO UN NÚMERO
--
-- `operator_agreements.comision_pct` es `numeric not null`: al firmar hay que
-- escribir un porcentaje o no se firma. Y `firmarConvenio` lo dice con todas
-- sus letras — «Falta definir la comisión antes de firmar» — cuando
-- `operators.commission_pct` viene en NULL.
--
-- Eso da por hecho que NULL significa «sin comisión», y es falso desde que
-- existe la escala. Es el mismo error que la 0047 ya corrigió en el gate de
-- venta (ver `listo-para-vender.ts`, condición 5): con `commission_pct` en NULL
-- y `comision_desde` puesta, cobra la escala de la casa. Nomádika lleva 12
-- ventas cobradas así, a $301.72 cada una. Hoy **no puede firmar su convenio**,
-- y es la única de las tres operadoras que ya generó comisión.
--
-- ⚠️ Y NO SE ARREGLA ESCRIBIENDO 20. Las dos cosas no son la misma:
--
--     precio        escala        plano 20%     de más      con IVA
--     $1,750.00     $301.72       $301.72       $0.00       $0.00
--     $6,000.00     $991.03       $1,034.48     $43.45      $50.40
--     $12,000.00    $1,875.17     $2,068.97     $193.80     $224.81
--     $21,000.00    $3,054.48     $3,620.69     $566.21     $656.80
--
-- (medido con `comisionDeVenta`, el motor que cobra). La escala es MARGINAL por
-- tramos —20/18/16/14/14—, así que un plano 20% coincide sólo en el primer
-- tramo y de ahí cobra de más. Firmarle un 20% plano a quien venía por escala
-- le cambiaría el trato hacia arriba, en silencio, el día que firma.
--
-- ⚠️ Y TAMPOCO SE PUEDE CONGELAR «LA ESCALA VENTA» O «LA ESCALA PLATAFORMA»:
-- cuál de las dos aplica NO es del operador, es DE CADA VENTA. Lo decide quién
-- trajo al cliente (`escalaPara` en `atribucion.ts`): si el operador lo trajo,
-- paga la de plataforma; si lo trajo Caminante, la de venta. Un convenio que
-- fijara una sola estaría prometiendo algo que el cobro no cumple.
--
-- Lo que sí se congela, entonces, es EL TIPO DE TRATO: «tienes un porcentaje
-- pactado» o «vas por la tabla de la casa». Es exactamente la distinción que ya
-- hace `Regla` en el código (`{tipo:"plano"} | {tipo:"escala"}`), que hasta hoy
-- no tenía dónde vivir en la base.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · QUÉ TIPO DE TRATO SE FIRMÓ
-- ─────────────────────────────────────────────────────────────────────────────
-- El default es 'plano' porque es lo que la columna vieja podía expresar: así,
-- un renglón escrito antes de esta migración sigue significando lo mismo.
-- (Hoy no hay ninguno: `operator_agreements` está vacía. El default es por si
-- alguien firma entre que esto se aplica y el código nuevo se promueve.)
alter table public.operator_agreements
  add column if not exists comision_regla text not null default 'plano';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'operator_agreements_regla_valida'
  ) then
    alter table public.operator_agreements
      add constraint operator_agreements_regla_valida
      check (comision_regla in ('plano', 'escala'));
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · EL PORCENTAJE DEJA DE SER OBLIGATORIO
-- ─────────────────────────────────────────────────────────────────────────────
-- ⚠️ Esto RELAJA un NOT NULL, que no es lo mismo que borrar una columna pero
-- tampoco es puramente aditivo: después de correr esto, la base ya no impide
-- un renglón sin porcentaje. El candado no se pierde, se muda al check de
-- abajo, que es más exacto — antes exigía un número SIEMPRE, y para la escala
-- ese número no existe.
alter table public.operator_agreements
  alter column comision_pct drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'operator_agreements_comision_coherente'
  ) then
    alter table public.operator_agreements
      add constraint operator_agreements_comision_coherente check (
        (comision_regla = 'plano'  and comision_pct is not null)
        or
        (comision_regla = 'escala' and comision_pct is null)
      );
  end if;
end $$;

-- ⚠️ EL PORCENTAJE SIN SU TIPO MIENTE. Un 20 suelto se lee como «cobra 20%», y
-- si el trato era la escala eso es falso arriba de $3,000 de base. Quien
-- consulte esta tabla para un corte tiene que leer las dos columnas.
comment on column public.operator_agreements.comision_regla is
  'Qué tipo de trato se firmó: «plano» = un porcentaje negociado, que vive en comision_pct; «escala» = la tabla por tramos de la casa, y entonces comision_pct va NULL. NO se congela cuál de las dos escalas (venta/plataforma): eso lo decide CADA VENTA según quién trajo al cliente (escalaPara, atribucion.ts).';
comment on column public.operator_agreements.comision_pct is
  'El porcentaje pactado, congelado al firmar. NULL cuando comision_regla = «escala»: ahí no hay un número, hay una tabla marginal por tramos. Leerlo sin mirar comision_regla da un número que parece una tasa y no lo es.';
