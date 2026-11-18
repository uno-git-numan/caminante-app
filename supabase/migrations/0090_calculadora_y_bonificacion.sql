-- 0090 · LA CALCULADORA DEL REEMBOLSO Y LA BONIFICACIÓN DEL 20 % (D23 de legal)
-- (design/legal/POLITICA-CANCELACION-CLIENTE-2026-11.md §4 y §5)
--
-- 1 · `reembolsos` guarda qué PROPUSO el sistema (regla e importe) y cuándo se
--     recibió el aviso de cancelación. Si la casa devolvió otra cosa, queda a
--     la vista contra el motivo que escribió.
-- 2 · `experience_slots` guarda POR QUÉ se canceló una salida: por causa de
--     quien opera (imputable) o por fuerza mayor (D14), con su clase.
-- 3 · `bonificaciones`: el 20 % que se le debe a cada persona pagada cuando la
--     cancelación es imputable. La paga la casa por transferencia (la hace
--     Luis); aquí queda cuánto, hasta cuándo y, al pagarla, la fecha, el
--     importe, los últimos 4 dígitos de la cuenta y la clave de rastreo. La
--     cuenta del cliente NO se guarda (LFPDPPP art. 7).
--
-- Aditiva: columnas nuevas (todas NULL en lo que ya existe) y una tabla nueva.

begin;

-- 1 · Lo que propuso la calculadora ------------------------------------------
alter table public.reembolsos
  add column if not exists aviso_at timestamptz,
  add column if not exists regla text,
  add column if not exists propuesto_mxn numeric(12,2);

alter table public.reembolsos drop constraint if exists reembolsos_regla_sana;
alter table public.reembolsos add constraint reembolsos_regla_sana check (
  regla is null or regla in ('operacion', 'arrepentimiento-legal', 'arrepentimiento-24h', 'ventana')
);
alter table public.reembolsos drop constraint if exists reembolsos_propuesto_sano;
alter table public.reembolsos add constraint reembolsos_propuesto_sano check (
  propuesto_mxn is null or (propuesto_mxn >= 0 and regla is not null)
);

comment on column public.reembolsos.aviso_at is
  'Cuándo se recibió el aviso de cancelación del cliente (cuenta la fecha y la hora del aviso, no la del clic). NULL = reembolso anterior a la calculadora.';
comment on column public.reembolsos.regla is
  'La regla por la que el sistema propuso el importe (lib/cancelacion/politica.ts, proponerReembolso): operacion · arrepentimiento-legal · arrepentimiento-24h · ventana. NULL = no hubo propuesta (reserva sin política o sin fecha de salida).';
comment on column public.reembolsos.propuesto_mxn is
  'Lo que el sistema PROPUSO devolver. Si monto_mxn es distinto, la casa lo cambió y `motivo` dice por qué.';

-- 2 · Por qué se canceló una salida ------------------------------------------
alter table public.experience_slots
  add column if not exists cancelada_at timestamptz,
  add column if not exists cancelacion_causa text,
  add column if not exists cancelacion_fuerza_mayor text,
  add column if not exists cancelacion_motivo text;

alter table public.experience_slots drop constraint if exists experience_slots_cancelacion_sana;
alter table public.experience_slots add constraint experience_slots_cancelacion_sana check (
  (cancelacion_causa is null and cancelacion_fuerza_mayor is null)
  or (cancelacion_causa = 'imputable' and cancelacion_fuerza_mayor is null
      and cancelada_at is not null and length(btrim(coalesce(cancelacion_motivo, ''))) > 0)
  or (cancelacion_causa = 'fuerza-mayor'
      and cancelacion_fuerza_mayor in ('clima', 'cierre-autoridad', 'contingencia-bloqueo', 'emergencia-guia')
      and cancelada_at is not null and length(btrim(coalesce(cancelacion_motivo, ''))) > 0)
);

comment on column public.experience_slots.cancelacion_causa is
  'Por qué se canceló la salida: imputable (causa de quien opera: hay bonificación del 20 % al cliente, LFPC 92 Bis y 92 Ter) o fuerza-mayor (D14: no hay bonificación ni penalización). NULL = no cancelada, o cancelada antes de la 0090.';
comment on column public.experience_slots.cancelacion_fuerza_mayor is
  'La clase de fuerza mayor (D14): clima · cierre-autoridad · contingencia-bloqueo · emergencia-guia. El documento que la acredita se describe en cancelacion_motivo.';
comment on column public.experience_slots.cancelacion_motivo is
  'Qué pasó, escrito por quien canceló. En fuerza mayor incluye el documento que la acredita (reporte, aviso de autoridad, parte médico).';

-- 3 · La bonificación por pagar ----------------------------------------------
create table if not exists public.bonificaciones (
  id uuid primary key default gen_random_uuid(),

  reservation_id uuid not null references public.reservations(id) on delete restrict,
  slot_id        uuid references public.experience_slots(id) on delete set null,
  -- La operadora de la que se recupera (convenio, Quinta §3 y §9). NULL = la
  -- experiencia es de la casa y la bonificación es costo de la casa.
  operator_id    uuid references public.operators(id) on delete set null,

  pagado_mxn numeric(12,2) not null check (pagado_mxn > 0),
  monto_mxn  numeric(12,2) not null check (monto_mxn > 0),
  vence_el   date not null,

  estado text not null default 'por-pagar' check (estado in ('por-pagar', 'pagada')),

  -- La transferencia, cuando ya se hizo. La cuenta completa NO se guarda.
  pagada_el        date,
  pagado_real_mxn  numeric(12,2),
  cuenta_ultimos4  text,
  clave_rastreo    text,
  registrada_por   uuid,
  registrada_at    timestamptz,

  creada_por uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bonificaciones_una_por_reserva unique (reservation_id),
  constraint bonificaciones_pago_sano check (
    (estado = 'por-pagar' and pagada_el is null and pagado_real_mxn is null
       and cuenta_ultimos4 is null and clave_rastreo is null)
    or (estado = 'pagada' and pagada_el is not null and pagado_real_mxn > 0
       and cuenta_ultimos4 ~ '^[0-9]{4}$' and length(btrim(clave_rastreo)) > 0)
  )
);

create index if not exists bonificaciones_por_pagar on public.bonificaciones (vence_el) where estado = 'por-pagar';

drop trigger if exists bonificaciones_updated_at on public.bonificaciones;
create trigger bonificaciones_updated_at
  before update on public.bonificaciones
  for each row execute function public.set_updated_at();

-- Sólo la toca el service-role desde las server actions de la casa.
alter table public.bonificaciones enable row level security;

comment on table public.bonificaciones is
  'El 20 % que se le debe a cada persona pagada cuando una salida se cancela por causa de quien opera (LFPC 92 Bis y 92 Ter; D23). Se crea al registrar la cancelación como imputable; con fuerza mayor no se crea. La paga la casa por transferencia; el sistema calcula y avisa, no mueve dinero.';
comment on column public.bonificaciones.pagado_mxn is
  'Lo que esa persona había pagado al cancelarse la salida, complementos incluidos. Es la base del 20 %.';
comment on column public.bonificaciones.monto_mxn is
  '20 % de pagado_mxn. NO va en el CFDI de egreso de la venta (el egreso no puede exceder al ingreso); cómo se documenta lo confirma la contadora (M24).';
comment on column public.bonificaciones.vence_el is
  'Fecha límite para pagarla: 5 días hábiles desde la cancelación (lunes a viernes sin los descansos del art. 74 LFT).';
comment on column public.bonificaciones.operator_id is
  'La operadora de la que se recupera, junto con la devolución y la penalización (convenio, Quinta §3 y §9). NULL = experiencia de la casa: es costo de la casa.';
comment on column public.bonificaciones.cuenta_ultimos4 is
  'Sólo los últimos 4 dígitos de la cuenta a la que se transfirió. La cuenta completa del cliente no se guarda (dato financiero, LFPDPPP art. 7).';

commit;
