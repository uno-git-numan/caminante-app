-- 0027 · MÉTRICAS DE INSTAGRAM (el loop de medir-y-replicar del playbook §8)
-- Una fila por publicación publicada, refrescada por el cron fetch-insights.
-- Vive APARTE de social_posts a propósito: la cola de publicación es el camino
-- crítico (la campaña corre en vivo) y las métricas no deben poder romperla.
-- RLS sin policies = solo service-role, como el resto del módulo social.

create table if not exists public.social_insights (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  ig_media_id text not null,
  -- Métricas crudas de la Graph API. NULL = la API no la devolvió (permiso o
  -- tipo de media): se distingue de 0 = la midió y salió cero.
  likes integer,
  comments integer,
  saved integer,
  reach integer,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (post_id)
);

create index if not exists social_insights_post_idx on public.social_insights (post_id);
create index if not exists social_insights_fetched_idx on public.social_insights (fetched_at desc);

alter table public.social_insights enable row level security;

comment on table public.social_insights is
  'Métricas de IG por publicación (playbook §8: medir y replicar). Solo service-role.';
comment on column public.social_insights.saved is
  'Saves: pesan más que likes para el algoritmo — es la señal que persigue la serie E.';
