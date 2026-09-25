-- 0070 · EL EQUIPO — empleados de numan y de las operadoras, con permisos que
-- Luis prende y apaga.
--
-- Hasta hoy el panel tiene DOS llaves: `admin_whitelist` (la casa, todo) y la
-- fila de `operators` con `panel_activo` (la operadora, lo suyo). No hay forma
-- de que una persona ayude sin darle una de las dos: o ve el dinero de la
-- plataforma o se hace pasar por la operadora con su correo. Decisión de Luis
-- (25 sep 2026): un tercer rol, `equipo`, con sueldo, donde
--
--   · `numan = true`            → trabaja para la plataforma (onboarding de
--                                 operadoras: llamada, expediente, firma).
--   · `staff_operadoras`        → trabaja para esas operadoras (Caminante y
--                                 Kéntro son un solo equipo: Druidas). Ve y
--                                 actúa como la operadora, acotado a ella.
--   · las dos a la vez          → es válido; la pastilla del panel elige.
--   · `facultades`              → lo que puede hacer, y Luis lo prende y apaga:
--       onboarding  tomar solicitudes, aprobar documentos y actividades (numan)
--       clientes    CRM, WhatsApp, links de cobro, encuestas, embajadores
--       armar       experiencias: crear, editar, publicar
--       campo       rosters con datos médicos (sólo quien opera la salida)
--
-- ⚠️ LO QUE NUNCA: reembolsos, `commission_pct`, Connect/CSD/facturas,
-- dispensas, suspender o dar de baja operadoras, dar accesos. Eso sigue
-- exigiendo `admin_whitelist`; esta tabla no abre ninguna de esas puertas.
--
-- ⚠️ NO ES `admin_whitelist`. Meter a un empleado ahí es darle TODO (así entró
-- el primer operador externo al dinero de la casa, ver alcance.ts). Y NO es
-- una fila en `operators`: eso lo haría dueño. La identidad es el CORREO, igual
-- que en las otras dos listas: quien controla el buzón controla el asiento.
--
-- La atribución (quién tomó qué solicitud, qué tarjeta, qué grupo) y las
-- comisiones (10% de la comisión de numan; 3% por grupo cerrado) vienen en la
-- 0071+: primero tiene que existir a quién atribuir.

create table if not exists public.staff (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  nombre        text not null,
  -- Equipo de la plataforma. Sin esto y sin operadoras, la fila no abre nada.
  numan         boolean not null default false,
  facultades    text[] not null default '{}',
  activo        boolean not null default true,
  -- Quién lo dio de alta (correo de sesión) y cuándo; la baja conserva la fila:
  -- lo que atribuyó y devengó sigue siendo suyo hasta ese día.
  alta_por      text,
  alta_at       timestamptz not null default now(),
  baja_at       timestamptz,
  nota          text,
  constraint staff_email_minusculas check (email = lower(email)),
  constraint staff_facultades_validas check (
    facultades <@ array['onboarding','clientes','armar','campo']::text[]
  )
);

create unique index if not exists staff_email_unico on public.staff (email);

comment on table public.staff is
  'Empleados de numan y de las operadoras (rol «equipo»). NO es admin_whitelist '
  '(la casa) ni operators (la dueña). Ver 0070.';
comment on column public.staff.facultades is
  'onboarding · clientes · armar · campo. Las prende y apaga la casa.';

-- De qué operadoras es equipo. Caminante y Kéntro (Druidas) van las dos.
create table if not exists public.staff_operadoras (
  staff_id     uuid not null references public.staff(id) on delete cascade,
  operator_id  uuid not null references public.operators(id) on delete cascade,
  primary key (staff_id, operator_id)
);

-- Sin políticas: sólo el cliente de servicio las lee, como las demás tablas
-- del alta. Un cliente con sesión no ve ni una fila.
alter table public.staff            enable row level security;
alter table public.staff_operadoras enable row level security;
