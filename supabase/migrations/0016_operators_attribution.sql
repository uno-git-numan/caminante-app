-- 0016 — Operadores + atribución de ventas (para el payout mensual por operador)
--
-- Contexto: cada experiencia la opera alguien (hoy Numan/Caminante; mañana varios
-- operadores). Para poder depositar a cada operador lo que le tocó cada mes, toda
-- venta debe quedar atribuida a un operador, con su comisión CONGELADA al momento
-- de la venta (si mañana cambias la comisión, las ventas viejas conservan su trato).
--
-- La comisión es de PLATAFORMA (lo que se queda Numan). NULL = abierta / sin definir:
-- la venta se atribuye igual y el split se calcula cuando se fije el %.
--
-- Aplicar a mano en el SQL Editor (no hay CLI). Idempotente.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · OPERATORS — quién opera experiencias y recibe pagos.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.operators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  commission_pct numeric(5,2) check (commission_pct is null or (commission_pct >= 0 and commission_pct <= 100)),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.operators enable row level security;
-- Sin policies públicas → solo el service-role (server) lee/escribe. Cero exposición.

-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · EXPERIENCES → operador dueño.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.experiences
  add column if not exists operator_id uuid references public.operators(id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · RESERVATIONS → snapshot del operador + comisión al momento de la venta.
--     (Congelado: el reporte de payout usa esto, no el % actual del operador.)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.reservations
  add column if not exists operator_id uuid references public.operators(id),
  add column if not exists commission_pct numeric(5,2);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · SEED — operador Numan/Caminante (tú) + atar las experiencias existentes.
--     commission_pct NULL = abierta (la defines después).
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.operators (name, email, commission_pct)
  values ('Numan · Caminante', 'uno@numanhub.com', null)
  on conflict (email) do nothing;

update public.experiences
  set operator_id = (select id from public.operators where email = 'uno@numanhub.com')
  where operator_id is null;
