-- 0067 · UNA LIQUIDACIÓN PUEDE DIFERIR DE LO CALCULADO, SI DICE POR QUÉ
--
-- La primera liquidación real no cuadró, y el desfase enseñó que faltaba algo.
--
-- Nomádika: 12 ventas de $1,750 = $21,000 cobrados. El sistema tiene congelada
-- una comisión de $3,620.64 (20% del base sin IVA, escala de venta), así que
-- calcula que le tocan $17,379.36. La transferencia real fue de **$18,707.69**
-- —$1,328.33 más— porque Luis acordó con ellos menos comisión por ser su
-- primera experiencia.
--
-- ⚠️ LA SALIDA NO ES REESCRIBIR LA COMISIÓN. `platform_fee_mxn` se congela en el
-- PAGO justamente porque el pago es inmutable (es la razón de ser de la 0032:
-- antes se congelaba en la reserva y una compra adicional reescribía el % hacia
-- atrás). Corregirla a mano para que cuadre sería deshacer ese candado, y de
-- paso perder el dato de que hubo una concesión: quedaría pareciendo que la
-- comisión siempre fue otra.
--
-- Tampoco es forzar el monto: la acción rechaza los que no cuadran, y está bien
-- que lo haga — un monto que no corresponde a lo que salda, registrado en
-- silencio, es un descuadre que aparece meses después conciliando.
--
-- La salida es la tercera: **que la diferencia se declare, con su motivo.** Lo
-- que se transfirió es un hecho; por qué difiere de lo calculado es otro hecho;
-- y los dos caben en el mismo renglón. Es el criterio de la casa —«si falta un
-- dato para cuadrar, se pide; jamás se tapa con un ajuste»— aplicado aquí: no se
-- tapa, se escribe.

alter table public.operator_liquidaciones
  -- Cuánto de lo transferido NO corresponde a lo que saldan sus cobros.
  -- Positivo = se le dio más (una concesión, un adelanto).
  -- Negativo = se le transfirió menos de lo que saldaba (un ajuste a favor de
  -- Caminante, o una retención acordada).
  add column if not exists diferencia_mxn numeric(12,2) not null default 0,
  add column if not exists diferencia_motivo text;

-- ⚠️ UNA DIFERENCIA SIN MOTIVO ES UN DESCUADRE CON OTRO NOMBRE. El mínimo de
-- diez caracteres es el mismo criterio que la dispensa de la 0060: obliga a
-- escribir una razón y no una letra.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'liquidacion_diferencia_explicada'
  ) then
    alter table public.operator_liquidaciones
      add constraint liquidacion_diferencia_explicada check (
        diferencia_mxn = 0
        or (diferencia_motivo is not null and length(btrim(diferencia_motivo)) >= 10)
      );
  end if;
end $$;

comment on column public.operator_liquidaciones.diferencia_mxn is
  'Cuánto de lo transferido NO corresponde a lo que saldan sus cobros. Positivo = se le dio más de lo calculado (una concesión acordada); negativo = menos. Cero es el caso normal. El saldo de la operadora NO la cuenta como pago: lo que salda deuda es monto_mxn − diferencia_mxn.';
comment on column public.operator_liquidaciones.diferencia_motivo is
  'Por qué la transferencia difiere de lo calculado. Obligatorio en cuanto la diferencia no es cero: sin él, el renglón es un descuadre sin explicación y en seis meses nadie sabrá si fue un acuerdo o un dedazo.';
