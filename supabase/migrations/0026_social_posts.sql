-- 0026 · Cola de publicaciones a redes (el PUBLICADOR)
--
-- Cada fila = una publicación a Instagram (post/carrusel 4:5 o story 9:16) que se
-- publicó YA (registro) o está PROGRAMADA para una fecha. El cron `publish-social`
-- toma las 'scheduled' vencidas y las publica con el token de `social_accounts`.
--
-- Las imágenes ya viven en el bucket público (`experiences/uploads/…`): aquí se
-- guardan sus URLs en orden. El caption es el de voz de marca del kit.
--
-- SEGURIDAD: RLS habilitada SIN policies → solo el service-role (server actions /
-- cron) lee/escribe. Nada llega al cliente salvo vía el service-role.

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'instagram',
  account_id uuid references public.social_accounts(id) on delete set null,
  experience_slug text,                       -- experiencia del kit (informativo)
  piece_id text,                              -- P1..P10 (informativo)
  format text not null default 'post',        -- 'post' (feed/carrusel 4:5) | 'story' (9:16)
  caption text,                               -- caption de marca (los stories lo ignoran)
  image_urls text[] not null,                 -- URLs públicas EN ORDEN (1 = imagen, 2..10 = carrusel)
  scheduled_at timestamptz,                   -- cuándo publicar; NULL = inmediata (ya registrada)
  status text not null default 'scheduled',   -- scheduled | publishing | published | failed | canceled
  ig_media_id text,                           -- id de la media publicada
  ig_permalink text,                          -- link al post publicado
  error text,                                 -- último error si falló
  attempts int not null default 0,            -- intentos del cron (para no reintentar sin fin)
  created_by text,                            -- correo del admin que la creó
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint social_posts_status_chk check (status in ('scheduled','publishing','published','failed','canceled')),
  constraint social_posts_format_chk check (format in ('post','story')),
  constraint social_posts_provider_chk check (provider in ('instagram'))
);

-- El cron busca por (status, scheduled_at).
create index if not exists social_posts_due_idx on public.social_posts (status, scheduled_at);
-- El panel lista por experiencia y por fecha.
create index if not exists social_posts_slug_idx on public.social_posts (experience_slug, created_at desc);

-- Sin policies: SOLO el service-role (server) lee/escribe.
alter table public.social_posts enable row level security;

-- Mantener updated_at fresco.
create or replace function public.touch_social_posts_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists social_posts_touch on public.social_posts;
create trigger social_posts_touch
  before update on public.social_posts
  for each row execute function public.touch_social_posts_updated_at();
