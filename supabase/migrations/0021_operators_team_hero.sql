-- 0021 — Perfil de operador editable desde el panel: equipo + foto de fondo.
-- team: [{name, role, quote, photoUrl}] — el roster humano del operador.
-- hero_photo_url: foto de naturaleza de fondo del hero del perfil (opcional).
alter table public.operators
  add column if not exists team jsonb not null default '[]'::jsonb,
  add column if not exists hero_photo_url text;
