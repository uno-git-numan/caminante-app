-- 0013 · fecha de fin por salida (para encuesta automática +24h) + cupo estándar
-- El cupo se estandariza por experiencia (tipo+lugar), no por fecha: Ocean Safari BCS = 16.
alter table public.experience_slots add column if not exists ends_at timestamptz;

-- Ensenada de Muertos: cupo 16 en cada salida + fecha/hora de fin (último día 16:00 BCS = 23:00Z)
update public.experience_slots
   set capacity_total = 16, ends_at = '2026-06-15T23:00:00Z'
 where experience_id = '4791b13b-8a36-480b-a30d-784d3db8876d' and label = 'Jun 12-15';

update public.experience_slots
   set capacity_total = 16, ends_at = '2026-06-21T23:00:00Z'
 where experience_id = '4791b13b-8a36-480b-a30d-784d3db8876d' and label = 'Jun 18-21';

-- Cupo estándar a nivel experiencia (las salidas nuevas lo heredan)
update public.experiences
   set data = jsonb_set(coalesce(data,'{}'::jsonb), '{capacity}', '16'::jsonb)
 where slug = 'ensenada-de-muertos';
