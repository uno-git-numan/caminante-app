-- 0022 — Ajuste de encuadre de fotos del perfil de operador (zoom + punto focal).
-- No destructivo: {zoom, x, y} se aplica en render con transform:scale +
-- transform-origin. El equipo (team jsonb) guarda su propio {zoom,x,y} por
-- integrante (sin migración). NULL = sin ajuste (comportamiento actual).
alter table public.operators
  add column if not exists photo_adjust jsonb,
  add column if not exists hero_adjust jsonb;
