-- LO QUE UNA COTIZACIÓN REAL NO CABÍA EN EL MODELO.
--
-- La 0049 partió los costos en cuatro modos y arregló el bug de los totales
-- dormidos. Sirvió. Pero al costear San Andrés (13-15 nov, Hacienda + Kéntro)
-- aparecieron TRES formas que ninguno de los cuatro modos sabe representar, y
-- las tres salieron de UNA sola cotización — que es la señal de que no son
-- casos raros, es que faltaban.
--
--   1. TARIFA POR TRAMO. La Hacienda cobra $6,790 por persona de 5 a 11, y
--      $5,980 de 12 en adelante. No es `por_persona` (la tarifa cambia) ni es
--      `desde_personas` (ese guarda un TOTAL por escalón, como la van; aquí el
--      total sí crece dentro del tramo: 7 × $6,790 ≠ 8 × $6,790).
--
--   2. CABEZAS QUE NO PAGAN PERO CUESTAN. Los dos guías duermen y comen con
--      50% de descuento. Cambian el costo Y cambian el tramo: 10 clientes + 2
--      guías son 12 cabezas, y esa doceava cabeza abarata a todo el grupo
--      $1,334 por persona. Meterlos «a mano» como un costo suelto los vuelve a
--      congelar, que es justo lo que la 0049 vino a eliminar.
--
--   3. COSTO POR OPCIÓN ELEGIDA. La caminata cuesta $2,000 por quien la toma, y
--      la toma la mitad del grupo; la corrida no cuesta porque la guía Luis. El
--      precio es el mismo para todos, así que el costo depende de una elección
--      que ocurre DESPUÉS de vender. Con 12 clientes: si caminan 4 sobran
--      $4,000, si caminan 9 faltan $6,000 — y hoy nadie lo vería.
--
-- Y una cuarta cosa que no es un modo sino una omisión: LA COMISIÓN NO ESTÁ EN
-- LA CASCADA. El margen que muestra el panel la ignora y por eso sale inflado.
-- Es el mismo defecto de la 0049 —un número que se ve bien y no significa lo
-- que parece— vivo otra vez, una capa más arriba.

-- ── 1 · tarifa por tramo ─────────────────────────────────────────────────────
alter table public.experience_costs
  drop constraint if exists experience_costs_modo_check;
alter table public.experience_costs
  add constraint experience_costs_modo_check
  check (modo in ('unico', 'por_persona', 'desde_personas', 'porcentaje', 'tarifa_por_tramo'));

-- [{"desde":5,"tarifa":6790},{"desde":12,"tarifa":5980}]
-- Aplica el tramo más alto cuyo `desde` no rebase a las CABEZAS (no a los
-- clientes: ver punto 2). Debajo del tramo más bajo se cobra el más bajo, por
-- la misma razón que en `desde_personas`: un costo real jamás debe desaparecer
-- de la cuenta por caer fuera de la escalera.
alter table public.experience_costs
  add column if not exists tramos jsonb;

comment on column public.experience_costs.tramos is
  'Array de {desde, tarifa}: a partir de `desde` CABEZAS, cada una cuesta `tarifa`. Distinto de escalones, que guarda un TOTAL por tramo. Se aplica el tramo más alto que no rebase las cabezas; por debajo del más bajo, el más bajo.';

-- ── 2 · cabezas que no pagan pero cuestan ────────────────────────────────────
-- Cuántas van sin ser clientes y con qué descuento. Viven en la EXPERIENCIA,
-- no en el costo: los mismos dos guías afectan a todos los costos por persona.
alter table public.experiences
  add column if not exists cabezas_cortesia jsonb;

comment on column public.experiences.cabezas_cortesia is
  'Array de {rol, cuantas, descuento_pct}: gente que va y cuesta sin pagar boleto (guías, cortesías). Suma a las CABEZAS para elegir el tramo, y su costo entra al total al (100 - descuento_pct)%.';

-- ── 3 · costo por opción elegida ─────────────────────────────────────────────
-- `proporcion` = qué fracción del grupo se espera que lo tome. Es un SUPUESTO y
-- por eso se guarda explícito: cuando la salida ocurra, el roster dirá la
-- fracción real y la diferencia se podrá ver en vez de descubrirse al final.
alter table public.experience_costs
  add column if not exists proporcion numeric(5,4)
  check (proporcion is null or (proporcion > 0 and proporcion <= 1));

comment on column public.experience_costs.proporcion is
  'Fracción del grupo que toma esta opción (0-1). NULL = la toman todos. La caminata de San Andrés es 0.5: la mitad camina, la otra corre, y todos pagan lo mismo.';

-- El CHECK de coherencia, con el modo nuevo. Se reescribe entero: parchear
-- una condición y dejar las otras cuatro sin revisar es cómo la 0055 tuvo que
-- venir a tapar el hueco que la 0049 dejó pasando en NULL.
alter table public.experience_costs
  drop constraint if exists experience_costs_modo_coherente;
alter table public.experience_costs
  add constraint experience_costs_modo_coherente check (
    (modo = 'unico'
      and tarifa_mxn is null and escalones is null and porcentaje is null and tramos is null)
    or (modo = 'por_persona'
      and tarifa_mxn is not null and escalones is null and porcentaje is null
      and tramos is null and monto_mxn = 0)
    or (modo = 'desde_personas'
      and tarifa_mxn is null and porcentaje is null and tramos is null and monto_mxn = 0
      and escalones is not null and jsonb_typeof(escalones) = 'array'
      and jsonb_array_length(escalones) > 0)
    or (modo = 'porcentaje'
      and tarifa_mxn is null and escalones is null and tramos is null and monto_mxn = 0
      and porcentaje is not null)
    or (modo = 'tarifa_por_tramo'
      and tarifa_mxn is null and escalones is null and porcentaje is null and monto_mxn = 0
      and tramos is not null and jsonb_typeof(tramos) = 'array'
      and jsonb_array_length(tramos) > 0)
  );
