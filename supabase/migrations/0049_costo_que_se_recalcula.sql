-- 0049 · El costo deja de ser un total multiplicado a mano
--
-- ── El problema, con el caso real que lo destapó ─────────────────────────────
--
-- `tipo = 'variable'` existe desde la 0032 y su comentario dice «por persona».
-- Pero es sólo una ETIQUETA: `monto_mxn` guarda un total que alguien multiplicó
-- a mano, y la tarifa unitaria vive en el TEXTO del concepto:
--
--     concepto: 'Hospedaje clientes · 9 x $4,650 compartida'   monto: 41,850
--
-- `rentabilidad.ts` nunca multiplica por cabezas: sólo suma `monto_mxn`. O sea
-- que el costo se congela al capturarlo y NADIE lo recalcula si el roster
-- cambia. Y el roster siempre cambia.
--
-- Ya descuadró. La salida «Ago 29-30» de Hacienda San Andrés tiene 11 personas
-- pagadas y dos costos que suponen 9:
--
--     Hospedaje clientes    9 × $4,650 = $41,850   con 11 serían $51,150
--     Caminata guiada       9 × $1,250 = $11,250   con 11 serían $13,750
--     Buffer 5%                          $ 4,156   sobre el costo real, $4,796
--     ───────────────────────────────────────────────────────────────────────
--     COSTO                              $88,276                    $100,716
--     UTILIDAD sobre $126,500 de ingreso $38,224                     $25,784
--
-- $12,440 de utilidad que no existen. El margen que muestra el panel es 30.2%
-- y el real es 20.4%. Fíjate en que el buffer ARRASTRA el error: cualquier cosa
-- calculada sobre los costos hereda la falla.
--
-- ── Lo que se guarda ahora: la TARIFA, no el producto ────────────────────────
--
-- El total se calcula al leer, contra las personas que de verdad van. Cuatro
-- modos, que son las cuatro formas en que un costo real se comporta:
--
--   unico           — se paga completo vaya quien vaya. Vive en `monto_mxn`.
--   por_persona     — `tarifa_mxn` × personas. Hospedaje, comida, la entrada.
--   desde_personas  — escalones: a partir de N personas cuesta X. El costo NO
--                     crece parejo — una van de 1 a 6 cuesta igual que con 6, y
--                     a la séptima hay que pagar la segunda van. Es la forma
--                     real del transporte y del hospedaje por cuarto, y hoy se
--                     captura como «fijo» («Van · 3 movimientos»), lo cual es
--                     correcto sólo mientras nadie más se apunte.
--   porcentaje      — `porcentaje` sobre la suma de los demás. Es el buffer.
--
-- El buffer entra aquí por la misma razón que los otros: hoy es un 5% tecleado
-- a mano que envejece igual que el costo del que salió. Arreglar los variables
-- y dejar el buffer como monto fijo habría dejado la mitad del defecto vivo.
--
-- ⚠️ El porcentaje se calcula SOBRE LOS QUE NO SON PORCENTAJE. Si se calculara
-- sobre todo, dos filas de porcentaje se comerían la una a la otra y el
-- resultado dependería del orden en que se sumaran.
--
-- ⚠️ En los tres modos calculados, `monto_mxn` DEBE ser 0 y el CHECK lo obliga.
-- Un total viejo durmiendo en esa columna es exactamente cómo nació este bug:
-- alguien lo lee, parece un número bueno, y nadie sabe que ya no significa nada.
--
-- ── Cuándo deja de moverse ───────────────────────────────────────────────────
--
-- Mientras la salida no se va, el costo sigue al roster. Cuando la fecha pasa,
-- se guarda el número final en `congelado_mxn` y ya no se mueve: un reembolso
-- tres meses después no puede reescribir la utilidad de un mes que ya cerraste
-- y quizá ya declaraste. Es el mismo criterio con el que la comisión se congela
-- en la venta (0016) — lo que valió cuando pasó es lo único defendible.
--
-- ── Lo que esta migración NO hace, a propósito ───────────────────────────────
--
-- No reinterpreta ni una de las 35 filas que ya existen. Todas quedan en
-- `unico`, que es EXACTAMENTE como se comportan hoy: un total que no se mueve.
-- Aplicar esto no cambia ni un número de ninguna pantalla.
--
-- Podría parsear «9 x $4,650» del texto y convertirla sola. No se hace: sería
-- adivinar una tarifa desde una cadena escrita a mano para mover un número de
-- dinero. Las dos filas de Hacienda San Andrés se recapturan a conciencia, y
-- ahí se decide si eran 9 o 11.

begin;

alter table public.experience_costs
  add column if not exists modo text not null default 'unico',
  -- Tarifa unitaria de `por_persona`.
  add column if not exists tarifa_mxn numeric(12,2),
  -- [{"desde":1,"monto":3000},{"desde":7,"monto":6000}] para `desde_personas`.
  add column if not exists escalones jsonb,
  -- El % de `porcentaje`. 5 = cinco por ciento.
  add column if not exists porcentaje numeric(5,2),
  -- El total del día que la salida se fue. NULL = todavía se recalcula.
  add column if not exists congelado_mxn numeric(12,2),
  add column if not exists congelado_at timestamptz;

alter table public.experience_costs
  drop constraint if exists experience_costs_modo_check;
alter table public.experience_costs
  add constraint experience_costs_modo_check
  check (modo in ('unico', 'por_persona', 'desde_personas', 'porcentaje'));

-- Coherencia. Un modo sin su dato es un costo que se leería como cero y
-- desaparecería de la cuenta sin una sola señal. Se prohíbe en la base y no en
-- el formulario, porque el formulario no es el único que escribe aquí.
alter table public.experience_costs
  drop constraint if exists experience_costs_modo_coherente;
alter table public.experience_costs
  add constraint experience_costs_modo_coherente
  check (
    (modo = 'unico'
       and tarifa_mxn is null and escalones is null and porcentaje is null)
    or (modo = 'por_persona'
       and tarifa_mxn is not null and tarifa_mxn >= 0
       and escalones is null and porcentaje is null and monto_mxn = 0)
    or (modo = 'desde_personas'
       and tarifa_mxn is null and porcentaje is null and monto_mxn = 0
       and jsonb_typeof(escalones) = 'array' and jsonb_array_length(escalones) > 0)
    or (modo = 'porcentaje'
       and tarifa_mxn is null and escalones is null and monto_mxn = 0
       and porcentaje is not null and porcentaje >= 0 and porcentaje <= 100)
  );

-- Un congelado a medias no es un congelado: sin la fecha nadie sabe si el
-- número es el cierre o basura de una prueba.
alter table public.experience_costs
  drop constraint if exists experience_costs_congelado_completo;
alter table public.experience_costs
  add constraint experience_costs_congelado_completo
  check ((congelado_mxn is null) = (congelado_at is null));

comment on column public.experience_costs.modo is
  'COMO se calcula el monto. unico = total fijo, vive en monto_mxn · por_persona = tarifa_mxn x personas · desde_personas = escalones, salta por tramos · porcentaje = % sobre los costos que NO son porcentaje (el buffer). En los tres calculados monto_mxn es 0 y no significa nada: el total se resuelve al leer, contra el roster real.';

comment on column public.experience_costs.escalones is
  'Array de {desde, monto}: a partir de `desde` personas el costo es `monto`. Aplica el escalon mas alto cuyo `desde` no rebase a las personas que van. Si van MENOS que el escalon mas bajo, se cobra el mas bajo: la van se paga completa vaya quien vaya, y un costo real jamas debe desaparecer de la cuenta por caer fuera de la escalera.';

comment on column public.experience_costs.porcentaje is
  'Porcentaje sobre la suma de los costos de esta salida que NO son de modo porcentaje. Excluirlos es lo que impide que dos filas de porcentaje se coman la una a la otra y que el resultado dependa del orden de la suma.';

comment on column public.experience_costs.congelado_mxn is
  'El total del dia que la salida se fue. Mientras es NULL el costo sigue al roster; en cuanto se congela, manda este numero. Existe para que un reembolso tardio no reescriba la utilidad de un mes ya cerrado — mismo criterio que commission_pct en la 0016.';

comment on column public.experience_costs.tipo is
  'fijo | variable | buffer. OJO: `tipo` decide el EQUILIBRIO (fijo y buffer hay que cubrirlos vaya quien vaya); `modo` decide COMO se calcula el monto. Son ejes distintos y no se deducen uno del otro: un costo por escalones sigue siendo variable, y el buffer es tipo=buffer con modo=porcentaje.';

commit;
