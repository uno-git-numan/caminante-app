-- 0037 · La comisión tiene UNA sola fuente
--
-- ⚠️ NO ES ADITIVA. Es la única migración de este carril que BORRA columnas, y va
-- con autorización explícita de Luis (18 ago).
--
-- Qué borra y por qué:
--
-- `platform_fee_pct` — duplicaba a `commission_pct`. Verificado antes de correr:
--   14 archivos leen `commission_pct`, CERO leen esta. Valía 0.0 en los dos
--   operadores (Kéntro y Numan · Caminante): un cero que nadie tecleó.
--   El riesgo no era que sobrara, era que alguien la usara: si Connect calculara
--   el `application_fee` con ella y el reporte de payout con `commission_pct`,
--   el checkout cobraría un porcentaje y el corte mostraría otro. Un bug de
--   dinero SILENCIOSO — cuadra en pantalla y no cuadra en el banco.
--
-- `stripe_fee_bearer` — codificaba «la comisión de Stripe la absorbe el operador».
--   Esa decisión deja de necesitar columna con CARGO DIRECTO: en un cargo directo
--   Stripe le cobra su comisión a la cuenta conectada por definición, no por
--   configuración nuestra. Una columna que dice lo que el tipo de cargo ya
--   garantiza solo puede desincronizarse. Valía NULL en los dos operadores.
--
-- Qué NO borra:
--
-- `profit_share_pct` y `profit_share_slugs` se QUEDAN. El 30% de utilidad neta del
--   programa de embajadores es un trato real que hoy vive en el convenio y podría
--   cablearse. Se marcan con comentario para que nadie las confunda con la
--   comisión de plataforma: son cosas distintas (una es % sobre la VENTA que
--   retiene Numan, la otra es % sobre la UTILIDAD que se le paga al embajador).
--
-- Recuperación si esto resultara un error: son dos `add column` de vuelta. No se
-- pierde información —ambas se verificaron sin datos con significado— pero la
-- verificación quedó escrita arriba justamente para no depender de mi memoria.

begin;

alter table public.operators drop column if exists platform_fee_pct;
alter table public.operators drop column if exists stripe_fee_bearer;

-- La regla, en la base y no solo en el código. Es el mismo patrón que `origen` en
-- `operator_payables` (0036): si una condición sostiene el dinero, se escribe donde
-- la va a leer quien consulte la tabla, no donde la lee quien abre el repo.
comment on column public.operators.commission_pct is
  'UNICA fuente del % que retiene la plataforma. La congela `reservations.commission_pct` en la venta (0016) y de aqui sale el application_fee de Connect. NULL = SIN DEFINIR, no cero: con NULL no se puede vender por Connect (el gate `operadorListo` lo rechaza) porque Numan retendria 0 y el operador se quedaria el 100%.';

comment on column public.operators.profit_share_pct is
  'NO ES LA COMISION DE PLATAFORMA (esa es commission_pct). Es el % sobre la UTILIDAD NETA del programa de embajadores. Hoy NADIE la lee: el trato vive en el convenio. Si algun dia se cablea, no se mezcla con commission_pct.';

comment on column public.operators.profit_share_slugs is
  'Experiencias a las que aplicaria profit_share_pct. Hoy NADIE la lee. Ver el comentario de profit_share_pct.';

commit;
