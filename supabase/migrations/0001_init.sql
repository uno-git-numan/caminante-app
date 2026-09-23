-- Caminante · esquema inicial
--
-- ⚠️ ESTE ARCHIVO SE CORRIGIÓ EL 23 SEP 2026. Lo que decía antes NUNCA existió
-- en producción y hacía imposible reconstruir la base desde cero.
--
-- La 0001 original levantaba un marketplace entero —`profiles`, `user_roles`,
-- `trips`, `trip_items`, `bookings`, `participants`,
-- `provider_commercial_profiles`, `listing_availability_slots` y una `payments`
-- con `trip_id`— del andamio de Sprint 1. De todo eso, producción sólo tuvo
-- jamás dos tablas: `providers` y `listings`. Las otras ocho vivían únicamente
-- en este archivo.
--
-- Mientras la base no se reconstruyera, la mentira era gratis. Dejó de serlo al
-- levantar staging: la `payments` de aquí (con `trip_id`) se adelantaba a la de
-- la 0007 (con `reservation_id`), y el `create table if not exists` de la 0007
-- la saltaba EN SILENCIO — el índice siguiente tronaba con «column
-- reservation_id does not exist» y la base entera se quedaba a medias en la
-- séptima migración de sesenta.
--
-- Corregirla no es reescribir historia: es alinearla con la historia real. Lo
-- que sigue es exactamente lo que producción tiene hoy en estas dos tablas
-- (verificado columna por columna contra PostgREST el 23 sep 2026). Quien corra
-- las migraciones desde cero ahora llega al mismo esquema, sin pasos a mano.
--
-- Las 0004 y 0005 eran RLS e índices de esas ocho tablas: quedaron vacías por
-- la misma razón, y lo dicen en su encabezado.

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- PROVEEDORES Y FICHAS — el andamio del marketplace que sí sobrevivió
-- ─────────────────────────────────────────────────────────────────────────────
-- Siguen en pie porque el panel las lee (`/caminante/admin/providers`) y
-- `listings` guarda dos renglones reales. No se confundan con las tablas de
-- hoy: la oferta viva son `experiences` (0006) y sus salidas (0007), y los
-- operadores externos viven en `operators` (0016). Mientras estas dos no se
-- migren y se retiren, se quedan aquí tal cual están.
create type public.listing_type as enum (
  'activity',
  'transport',
  'accommodation',
  'package'
);

create type public.provider_api_mode as enum (
  'portal',
  'api'
);

create type public.provider_approval_state as enum (
  'applied',
  'approved',
  'rejected'
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  display_name text not null,
  country_code text not null default 'MX',
  api_mode public.provider_api_mode not null default 'portal',
  approval_state public.provider_approval_state not null default 'applied',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  type public.listing_type not null,
  title text not null,
  description text,
  destination text,
  vibe text,
  difficulty text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS prendida sin policies = sólo service-role, que es la convención de la
-- casa. `listings` recibe su única policy de lectura pública en la 0003.
alter table public.providers enable row level security;
alter table public.listings enable row level security;
