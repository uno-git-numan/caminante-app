-- 0089 · LA POLÍTICA DE CANCELACIÓN QUE ACEPTA EL CLIENTE (D23 de legal)
-- (design/legal/POLITICA-CANCELACION-CLIENTE-2026-11.md §3)
--
-- 1 · La prueba. Cada reserva guarda la variante de la política (Estándar o
--     Expedición), la huella sha-256 del texto que se le mostró y la fecha en
--     que se creó el cobro. Si el texto cambia después, cada reserva conserva
--     el que aceptó, igual que las firmas del convenio.
-- 2 · La variante de las experiencias que ya existen. Hasta hoy la política
--     vivía como tres renglones de plantilla (`data.cancelacion`) que el
--     cliente no veía en la ficha actual. Las que traen EXACTAMENTE los
--     renglones 30/15 quedan en `estandar`, que es lo mismo dicho con el texto
--     de legal. Las que no traen renglones (o traen otros) se quedan sin
--     variante: se elige en el formulario, y sin elegirla no se publican.
--
-- Aditiva: tres columnas nuevas y una llave nueva dentro de `experiences.data`.
-- No se borra ni se reescribe ningún dato existente.

begin;

alter table public.reservations
  add column if not exists politica_variante text,
  add column if not exists politica_hash text,
  add column if not exists politica_aceptada_at timestamptz;

alter table public.reservations drop constraint if exists reservations_politica_sana;
alter table public.reservations add constraint reservations_politica_sana check (
  (politica_variante is null and politica_hash is null and politica_aceptada_at is null)
  or (politica_variante in ('estandar', 'expedicion') and politica_hash ~ '^[0-9a-f]{64}$' and politica_aceptada_at is not null)
);

comment on column public.reservations.politica_variante is
  'La política de cancelación que se le mostró al cliente al crear el cobro: estandar (30/15) o expedicion (60/30). NULL = reserva anterior a la política publicada, o capturada a mano sin que el cliente la viera en línea.';
comment on column public.reservations.politica_hash is
  'sha-256 del texto de la política que se le mostró (lib/cancelacion/politica.ts, textoPolitica). Es la prueba de qué aceptó aunque el texto cambie después.';
comment on column public.reservations.politica_aceptada_at is
  'Cuándo se creó el cobro con la política a la vista y la frase «Al pagar aceptas la política de cancelación de esta experiencia».';

-- Las experiencias con los renglones 30/15 de la plantilla → variante estándar.
update public.experiences
   set data = jsonb_set(data, '{politicaCancelacion}', '"estandar"'::jsonb, true)
 where not (data ? 'politicaCancelacion')
   and data -> 'cancelacion' = '[{"label": "Más de 30 días antes", "val": "Sin costo"}, {"label": "15 a 29 días antes", "val": "50%"}, {"label": "0 a 14 días antes", "val": "100%"}]'::jsonb;

commit;
