-- 0055 · EL CHECK QUE PASABA CUANDO DEBÍA FALLAR
--
-- Un CHECK de Postgres sólo rechaza cuando evalúa a FALSE. Si evalúa a NULL,
-- PASA. Y `jsonb_typeof(NULL)` no es 'array' ni otra cosa: es NULL.
--
-- Por eso esto se guardaba sin protestar:
--
--   insert ... (modo, escalones) values ('desde_personas', null)
--
-- La rama del CHECK evaluaba NULL, las otras dos FALSE, y `FALSE or FALSE or
-- NULL` es NULL — o sea, pasa. Una fila con modo «por escalones» y sin
-- escalones: el costo se calcularía como cero y la utilidad de esa salida
-- saldría inflada, sin que nada avisara.
--
-- Estaba en la 0049 desde que se aplicó y lo heredé en la 0054 al copiar el
-- patrón. Lo cachó la prueba de la 0054 —por eso se prueban los constraints en
-- vez de confiar en que están bien escritos—.
--
-- El arreglo es un `is not null` explícito antes de preguntar por el contenido.

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
       and escalones is not null
       and jsonb_typeof(escalones) = 'array' and jsonb_array_length(escalones) > 0)
    or (modo = 'porcentaje'
       and tarifa_mxn is null and escalones is null and monto_mxn = 0
       and porcentaje is not null and porcentaje >= 0 and porcentaje <= 100)
  );

alter table public.experience_complements
  drop constraint if exists complements_costo_coherente;
alter table public.experience_complements
  add constraint complements_costo_coherente check (
    (costo_modo = 'unico' and costo_tarifa_mxn is null and costo_escalones is null)
    or (costo_modo = 'por_persona'
        and costo_tarifa_mxn is not null and costo_escalones is null and costo_mxn = 0)
    or (costo_modo = 'desde_personas'
        and costo_tarifa_mxn is null and costo_mxn = 0
        and costo_escalones is not null
        and jsonb_typeof(costo_escalones) = 'array'
        and jsonb_array_length(costo_escalones) > 0)
  );

-- Comprobación de que no hay filas que ya se hayan colado por el hueco.
-- Debe devolver 0; si no, hay que corregirlas ANTES de que el constraint muerda.
do $$
declare malas int;
begin
  select count(*) into malas from public.experience_costs
   where modo = 'desde_personas' and escalones is null;
  if malas > 0 then
    raise exception 'hay % filas con modo desde_personas y escalones NULL: corrígelas antes', malas;
  end if;
end $$;
