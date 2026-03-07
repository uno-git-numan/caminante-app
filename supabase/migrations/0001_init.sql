-- Caminante initial schema (Sprint 1 foundation)
-- Run in Supabase SQL editor after project creation.

create extension if not exists "uuid-ossp";

create type public.app_role as enum (
  'traveler',
  'participant',
  'operator',
  'admin',
  'agent'
);

create type public.listing_type as enum (
  'activity',
  'transport',
  'accommodation',
  'package'
);

create type public.booking_mode as enum (
  'instant',
  'request'
);

create type public.booking_status as enum (
  'pending_request',
  'confirmed',
  'rejected',
  'cancelled',
  'completed'
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

create type public.payment_status as enum (
  'pending',
  'paid',
  'failed',
  'refunded',
  'partially_refunded'
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  locale text default 'es-MX',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
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

create table if not exists public.provider_commercial_profiles (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  take_rate_pct numeric(5,2) not null,
  risk_mode_default text not null,
  risk_uplift_pct numeric(5,2) not null default 0,
  holdback_pct numeric(5,2),
  holdback_release_rule text,
  pricing_mode text not null,
  effective_from timestamptz not null default now(),
  created_at timestamptz not null default now()
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

create table if not exists public.listing_availability_slots (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity_total integer not null,
  capacity_available integer not null,
  source_mode public.provider_api_mode not null default 'portal',
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id),
  title text not null,
  destination text,
  start_date date,
  end_date date,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  listing_id uuid not null references public.listings(id),
  booking_mode public.booking_mode not null,
  starts_at timestamptz,
  ends_at timestamptz,
  quantity integer not null default 1,
  price_mxn numeric(12,2) not null,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  trip_item_id uuid not null references public.trip_items(id) on delete cascade,
  provider_id uuid not null references public.providers(id),
  status public.booking_status not null,
  confirmation_deadline_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  join_status text not null default 'invited',
  permission_level text not null default 'baseline',
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  payer_user_id uuid references auth.users(id),
  amount_mxn numeric(12,2) not null,
  status public.payment_status not null default 'pending',
  provider_ref text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS baseline
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.providers enable row level security;
alter table public.listings enable row level security;
alter table public.trips enable row level security;
alter table public.trip_items enable row level security;
alter table public.bookings enable row level security;
alter table public.participants enable row level security;
alter table public.payments enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated
using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "trips_select_member" on public.trips
for select to authenticated
using (
  owner_user_id = auth.uid()
  or exists (
    select 1 from public.participants p
    where p.trip_id = trips.id and p.user_id = auth.uid()
  )
);

create policy "trips_insert_owner" on public.trips
for insert to authenticated
with check (owner_user_id = auth.uid());
