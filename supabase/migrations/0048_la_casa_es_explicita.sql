-- 0048 · Cuál operadora es la casa deja de ser una deducción
--
-- La plataforma (Caminante) necesita contar «operadoras externas» y separar lo
-- que le genera comisión de lo que no. Para eso hay que saber cuál de las filas
-- de `operators` es la casa —la operadora propia, que se vende a sí misma y
-- retiene el 100%.
--
-- Hoy eso no está escrito en ningún lado y sólo se puede deducir. La deducción
-- disponible era «la casa es la que no tiene comisión definida», y es una
-- trampa: según la 0037, `commission_pct` en NULL significa SIN DEFINIR, que es
-- exactamente el estado de una operadora externa recién dada de alta a la que
-- todavía no se le pone su número. Con esa regla, cada operadora nueva contaría
-- como casa durante los minutos u horas que tarde alguien en configurarla:
-- desaparecería del conteo de externas, no aparecería en el pipeline de las que
-- hay que activar, y su comisión se leería como «no aplica» en vez de «falta».
-- Un operador invisible es peor que uno mal configurado.
--
-- Así que se escribe. Una columna, un valor, y un índice que impide que haya
-- dos casas — porque «la casa» en plural no significa nada y el día que alguien
-- duplique la fila por error, las dos cuentas de la plataforma quedarían mal
-- sin una sola señal.
--
-- Ojo con lo que esta columna NO es: no es «operadora de confianza» ni «la
-- primera». Es la que pertenece a la misma empresa que la plataforma, y por eso
-- no se le cobra comisión: el dinero ya es de la casa antes de cobrarlo.

begin;

alter table public.operators
  add column if not exists es_la_casa boolean not null default false;

comment on column public.operators.es_la_casa is
  'La operadora propia de la plataforma: se vende a si misma y retiene el 100%, por eso no tiene comision ni fecha de arranque. NO deducir esto de commission_pct is null — ese NULL significa SIN DEFINIR (0037) y es el estado normal de una operadora externa recien dada de alta. Solo puede haber una.';

update public.operators set es_la_casa = true where slug = 'numan-caminante';

-- Una sola casa. Sin esto, una fila duplicada por error descuadra las dos
-- cuentas de la plataforma (cuantas externas hay, cuanto genera comision) sin
-- que nada se vea roto en pantalla.
create unique index if not exists operators_una_sola_casa
  on public.operators ((true))
  where es_la_casa;

commit;
