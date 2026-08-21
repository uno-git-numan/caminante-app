-- 0041 · La MARCA del operador, capturada desde la solicitud
--
-- Por qué aquí y no solo en `operators.branding` (0030): la marca se pregunta
-- ANTES de que exista el operador. Quien aplica ya tiene logo y colores; si no
-- se los pedimos en ese momento, después hay que perseguirlos por WhatsApp.
-- Al aprobar, esto se copia tal cual a `operators.branding` y esta columna
-- queda como el registro de lo que declaró al aplicar.
--
-- `branding_despues` NO es lo mismo que `branding = null`. Distingue "no quiso
-- llenarlo ahora" (decisión consciente, se le recuerda después) de "nunca se le
-- preguntó". Sin esa distinción el panel no sabe si perseguir o no.
--
-- Solo aditiva. Se aplica a mano en el SQL Editor con el visto bueno de Luis.

alter table public.operator_applications
  add column if not exists branding         jsonb,
  add column if not exists branding_despues boolean not null default false;

comment on column public.operator_applications.branding is
  'Marca declarada al aplicar: {logoUrl?, colors:{primary,accent}, font?, footerLine?}. Mismo contrato que operators.branding (lib/operators/branding.ts). Al aprobar se copia a operators.';

comment on column public.operator_applications.branding_despues is
  'true = eligió "lo configuro después" en el paso de marca. Distinto de branding null (nunca se preguntó).';
