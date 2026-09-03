-- REEMBOLSOS: el libro de lo que se devolvió, y por qué.
--
-- Hasta hoy un reembolso solo existía en Stripe. `finalizeRefund` marcaba el
-- pago como 'refunded' cuando llegaba `charge.refunded` y ahí terminaba: no
-- había forma de saber quién lo pidió, con qué motivo, ni si esa devolución
-- debía además sacar a la persona de la salida. Por eso la reserva NO se
-- cancelaba sola — el webhook no tenía cómo distinguir un ajuste de una baja.
--
-- Esta tabla es esa intención, escrita ANTES de llamar a Stripe. El webhook la
-- lee cuando Stripe confirma y recién entonces cancela, libera el lugar y
-- manda el correo. Si Stripe nunca confirma, la fila se queda en 'solicitado'
-- y se ve: un reembolso a medias deja de ser invisible.

create table if not exists public.reembolsos (
  id uuid primary key default gen_random_uuid(),

  payment_id     uuid not null references public.payments(id) on delete restrict,
  reservation_id uuid references public.reservations(id) on delete set null,
  slot_id        uuid references public.experience_slots(id) on delete set null,

  -- El id del refund en Stripe (re_...). UNIQUE: es la llave de idempotencia
  -- del webhook — el mismo evento puede llegar dos veces.
  stripe_refund_id text unique,

  monto_mxn numeric(12,2) not null check (monto_mxn > 0),
  motivo    text,

  -- De dónde salió. Sacar a UNA persona no es lo mismo que cancelar la salida
  -- entera, y al leer el libro seis meses después esa diferencia importa.
  origen text not null check (origen in ('persona', 'salida')),

  -- ¿Esta devolución además la saca del viaje? Casi siempre sí. Un ajuste de
  -- precio se reembolsa sin cancelar, y por eso es una columna y no un supuesto.
  cancela_reserva boolean not null default true,

  estado text not null default 'solicitado'
    check (estado in ('solicitado', 'confirmado', 'fallido')),
  error text,

  -- Se sella cuando el correo SALIÓ. Sin esto, un reintento del webhook le
  -- mandaría a la persona su aviso de reembolso dos veces.
  correo_enviado_at timestamptz,
  confirmado_at     timestamptz,

  -- Quién apretó el botón. Un movimiento de dinero sin autor no es auditable.
  solicitado_por uuid,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reembolsos_payment_idx     on public.reembolsos (payment_id);
create index if not exists reembolsos_reservation_idx on public.reembolsos (reservation_id);
create index if not exists reembolsos_slot_idx        on public.reembolsos (slot_id);
create index if not exists reembolsos_estado_idx      on public.reembolsos (estado);

-- Un pago no se puede reembolsar dos veces desde el panel mientras el primero
-- sigue vivo. Índice PARCIAL: los fallidos no bloquean un segundo intento.
create unique index if not exists reembolsos_un_vivo_por_pago
  on public.reembolsos (payment_id)
  where estado in ('solicitado', 'confirmado');

drop trigger if exists reembolsos_touch on public.reembolsos;
create trigger reembolsos_touch
  before update on public.reembolsos
  for each row execute function public.set_updated_at();

alter table public.reembolsos enable row level security;

comment on table public.reembolsos is
  'Libro de reembolsos. Se escribe ANTES de llamar a Stripe; el webhook lo cierra, cancela la reserva, libera el lugar y manda el correo.';
