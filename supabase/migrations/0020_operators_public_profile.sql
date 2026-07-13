-- 0020 — Perfil PÚBLICO de operadores
--
-- Contexto: cada experiencia muestra "Operada por <operador> · ★" (chip en el
-- hero) que lleva a /caminante/operador/<slug> con su perfil: bio, foto,
-- métricas derivadas (salidas, viajeros, satisfacción, % volvería) y
-- testimonios aprobados. Las MÉTRICAS no se guardan — se derivan en vivo de
-- reservations (operator_id, 0016) y experience_feedback (encuesta).
--
-- Aditiva e inocua: is_public default FALSE → ningún operador tiene perfil
-- hasta que el admin lo active. Solo el seed de Numan · Caminante queda público.

alter table public.operators
  add column if not exists slug text unique,
  add column if not exists bio text,
  add column if not exists photo_url text,
  add column if not exists instagram text,
  add column if not exists is_public boolean not null default false;

-- Slug del operador seed (Numan · Caminante) + público desde ya.
update public.operators
  set slug = 'numan-caminante', is_public = true
  where email = 'uno@numanhub.com' and slug is null;

-- Lectura pública SOLO de operadores públicos (el perfil es una página anónima;
-- las escrituras siguen siendo service-role — sin policy de escritura).
alter table public.operators enable row level security;
drop policy if exists "operators_public_read" on public.operators;
create policy "operators_public_read" on public.operators
  for select to anon, authenticated
  using (is_public = true);
