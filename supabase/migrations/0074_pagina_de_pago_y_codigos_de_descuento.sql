-- 0074 · La página de pago y los códigos de descuento
--
-- Dos cosas que Luis pidió el 3 nov 2026:
--
--   1. Que un link de pago (el especial con descuento, y el de cobro por
--      WhatsApp) NO aterrice en Stripe a secas: la persona llegaba a una página
--      de Stripe sin contexto, pagaba, y se perdía — no sabía cómo volver a
--      firmar el deslinde. Ahora el link es una página de Caminante
--      (/caminante/pago/<token>) que explica qué paga, manda a Stripe al tocar
--      «Pagar», y al volver cae en la pantalla de éxito con «Firmar mi deslinde».
--      El token vive en la reserva: `reservations.pago_token`.
--
--   2. Códigos de descuento que la casa crea y la persona teclea en el
--      checkout web (/reservar). El monto se resuelve SIEMPRE server-side: el
--      código sólo dice cuánto se perdona; el precio sale de la base.
--
-- Aditiva. RLS prendida sin policies: sólo entra el service-role.

-- ── 1 · La reserva sabe su página de pago y cuánto se le perdonó ──────────────

alter table public.reservations
  add column if not exists pago_token text,
  add column if not exists precio_lista_mxn numeric(10,2),
  add column if not exists codigo_descuento_id uuid,
  add column if not exists descuento_mxn numeric(10,2);

create unique index if not exists reservations_pago_token_key
  on public.reservations (pago_token)
  where pago_token is not null;

comment on column public.reservations.pago_token is
  'Token de /caminante/pago/<token>: la página de Caminante que explica el cobro y manda a Stripe. Es el link que se comparte (payment_link_url lo apunta). Sin él la reserva no tiene página de pago.';
comment on column public.reservations.precio_lista_mxn is
  'Lo que habría costado a precio de lista (todas las personas). Se escribe cuando el cobro lleva descuento (código o precio especial), para que el corte sepa cuánto se perdonó. La comisión se calcula sobre LO COBRADO, no sobre esto (regla del 27 ago 2026).';
comment on column public.reservations.codigo_descuento_id is
  'El código de descuento que esta reserva usó, si usó alguno (codigos_descuento.id). Se congela al pagar.';
comment on column public.reservations.descuento_mxn is
  'Cuánto se perdonó por el código (en pesos, ya resuelto). precio_lista_mxn − descuento_mxn = lo cobrado por el viaje.';

-- ── 2 · Los códigos de descuento ──────────────────────────────────────────────

create table if not exists public.codigos_descuento (
  id uuid primary key default gen_random_uuid(),
  -- En MAYÚSCULAS y sin espacios; se compara así. «ANDER50», «AMIGOS».
  codigo text not null unique check (codigo = upper(codigo) and codigo !~ '\s' and length(codigo) between 3 and 32),
  -- porcentaje: `valor` es 1–99. monto: `valor` son pesos que se restan del viaje.
  tipo text not null check (tipo in ('porcentaje', 'monto')),
  valor numeric(10,2) not null check (valor > 0),
  -- Alcance. NULL en ambos = vale para cualquier experiencia. Con experiencia,
  -- sólo esa; con salida, sólo esa salida.
  experience_id uuid references public.experiences(id) on delete cascade,
  slot_id uuid references public.experience_slots(id) on delete cascade,
  -- Cuántas veces se puede usar en total (NULL = sin tope) y cuántas va.
  usos_max integer check (usos_max > 0),
  usos integer not null default 0,
  vigente_desde date,
  vigente_hasta date,
  activo boolean not null default true,
  -- Para qué se creó, en palabras de quien lo creó. Queda para el corte.
  nota text,
  created_by text,
  created_at timestamptz not null default now(),
  check (tipo <> 'porcentaje' or valor < 100)
);

comment on table public.codigos_descuento is
  'Códigos que la casa crea (Recursos) y la persona teclea en /reservar. El descuento aplica al VIAJE (personas × precio), no a los complementos. `usos` lo sube el webhook al confirmar el pago, nunca el checkout: un carrito abandonado no gasta usos.';
comment on column public.codigos_descuento.valor is
  'porcentaje → 1–99 (% del viaje). monto → pesos fijos que se restan del viaje (nunca deja el total abajo de $10, el mínimo de Stripe).';

create index if not exists codigos_descuento_activo_idx
  on public.codigos_descuento (activo, codigo);

alter table public.codigos_descuento enable row level security;

alter table public.reservations
  add constraint reservations_codigo_descuento_fk
  foreign key (codigo_descuento_id) references public.codigos_descuento(id) on delete set null;

-- Sube `usos` en una sola sentencia (PostgREST no incrementa). La llama el
-- webhook sólo cuando el pago quedó registrado.
create or replace function public.usar_codigo_descuento(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.codigos_descuento set usos = usos + 1 where id = p_id;
$$;

revoke all on function public.usar_codigo_descuento(uuid) from public;
grant execute on function public.usar_codigo_descuento(uuid) to service_role;
