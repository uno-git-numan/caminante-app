-- 0025 · Cuentas de redes conectadas (OAuth) — base para publicar nativo
--
-- Guarda la cuenta de Instagram conectada por OAuth (Instagram API with Instagram
-- Login): el token de LARGA duración (~60 días) + ig_user_id + username. De aquí
-- otros módulos (el publicador, a futuro) leen el token para publicar.
--
-- SEGURIDAD: `access_token` es un SECRETO. RLS habilitada SIN policies → NADIE lo
-- lee salvo el service-role (server actions / rutas server). Jamás llega al
-- cliente (la UI solo recibe username/estado/vencimiento vía el service-role).
--
-- Reusable: `operator_id` NULL = la cuenta de la propia plataforma (Caminante).
-- A futuro, un operador conecta la suya y su fila lleva su operator_id.

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'instagram',              -- 'instagram' (único hoy)
  ig_user_id text,                                         -- id de la cuenta IG (para publicar)
  username text,                                           -- @usuario mostrado en el panel
  access_token text,                                       -- SECRETO (long-lived); solo service-role
  token_expires_at timestamptz,                            -- cuándo caduca el long-lived
  scopes text[],                                           -- permisos concedidos
  status text not null default 'connected',                -- 'connected' | 'expired' | 'revoked'
  operator_id uuid references public.operators(id) on delete cascade,  -- NULL = plataforma
  connected_by text,                                       -- correo del admin que conectó
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_accounts_status_chk check (status in ('connected','expired','revoked')),
  constraint social_accounts_provider_chk check (provider in ('instagram'))
);

-- Una sola cuenta ACTIVA por (proveedor, operador). El operador NULL (plataforma)
-- se normaliza a '' para que el índice único aplique. Reconectar = reemplaza.
create unique index if not exists social_accounts_provider_operator_uniq
  on public.social_accounts (provider, coalesce(operator_id::text, ''))
  where status = 'connected';

create index if not exists social_accounts_status_idx on public.social_accounts (status);

-- Sin policies: SOLO el service-role (server) lee/escribe. El token nunca sale al cliente.
alter table public.social_accounts enable row level security;

-- Mantener updated_at fresco.
create or replace function public.touch_social_accounts_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists social_accounts_touch on public.social_accounts;
create trigger social_accounts_touch
  before update on public.social_accounts
  for each row execute function public.touch_social_accounts_updated_at();
