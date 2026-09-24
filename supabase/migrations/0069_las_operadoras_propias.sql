-- 0069 · CUÁLES OPERADORAS SON PROPIAS
--
-- Caminante y Kéntro las opera la MISMA empresa (Druidas, en constitución) y
-- son operadoras como cualquier otra: cobran en su cuenta, emiten sus facturas
-- y le pagan comisión a numan. Nomádika es de alguien más.
--
-- Esa diferencia no estaba escrita en ningún lado. Lo más cercano era
-- `es_la_casa`, que hoy carga TRES significados distintos en una sola casilla:
--
--   1. «no paga comisión»        → `panorama.ts` la excluye del devengado
--   2. «no tiene alta propia»    → `mi-alta` rebota, y `operadoras.ts` la exime
--                                   de los seis candados
--   3. «es el tema base»         → el deslinde y la encuesta no la visten de
--                                   white-label, porque su look ES el default
--
-- Con el modelo de Druidas, (1) y (2) dejan de ser ciertas para Caminante —va a
-- pagar comisión y va a tener su alta— y sólo queda (3). Desenredar las tres
-- toca dinero, y el dinero no se mueve hasta que Druidas exista y tenga RFC,
-- CSD y cuenta de Connect. Esta migración NO lo hace: deja `es_la_casa` intacta
-- y agrega el único hecho que hoy hace falta y que hoy se puede afirmar.
--
-- ⚠️ PARA QUÉ SIRVE: el panel de Luis tiene una pastilla de sombreros. Con el
-- sombrero de numan ve la plataforma —los números y el expediente de TODAS las
-- operadoras— y con el sombrero de una operadora ve SÓLO lo de ella. Esta
-- columna dice qué operadoras tienen sombrero.
--
-- Y eso CIERRA algo que hoy está abierto: hasta hoy el panel con sesión de
-- admin no filtra por nadie, así que la operación de Nomádika —su CRM, sus
-- rosters y los datos médicos de su gente— se ve desde la misma pantalla que la
-- propia. Los números y la documentación de Nomádika se siguen viendo, que es
-- lo que la plataforma necesita; su operación, no.
--
-- No es un permiso: quien decide qué se PUEDE hacer sigue siendo el rol. Esto
-- decide qué se VE. Por eso una operadora con `propia = false` no se puede
-- poner de sombrero aunque alguien escriba su slug en la URL.

alter table public.operators
  add column if not exists propia boolean not null default false;

comment on column public.operators.propia is
  'La opera la misma empresa que la plataforma (hoy: Druidas). Decide qué '
  'operadoras aparecen como sombrero en el panel y, por lo tanto, qué se ve con '
  'cada sombrero. NO es un permiso ni exime de comisión: una operadora propia '
  'paga su comisión igual que cualquier otra. Ver 0069.';

-- Las dos de Druidas. Se marcan por slug y no por id para que esta migración
-- se pueda correr en una base reconstruida desde cero.
update public.operators set propia = true where slug in ('numan-caminante', 'kentro');
