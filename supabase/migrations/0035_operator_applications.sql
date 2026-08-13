-- 0035 · Aplicaciones de OPERADOR
--
-- Espejo de 0029_ambassador_applications, con la diferencia que importa:
-- aprobar a un operador no solo lo crea en `operators`, le abre el PANEL —
-- reservas, datos médicos de clientes y dinero. Por eso esta tabla lleva el
-- expediente de documentos y un status con más escalones que el de embajadores:
-- la decisión pasa por una llamada y por papeles vigentes, no por un sí/no.
--
-- Solo aditiva. Se aplica a mano en el SQL Editor con el visto bueno de Luis.

create table if not exists public.operator_applications (
  id uuid primary key default gen_random_uuid(),

  -- Paso 1 · Quién eres
  nombre_operadora text not null,
  responsable      text not null,
  email            text not null,
  whatsapp         text not null,
  instagram        text,
  ciudad_estado    text not null,

  -- Paso 2 · Qué operas
  tipo_operacion   text not null check (tipo_operacion in
                     ('montana','mar','cuevas','naturaleza','cultura','mixta')),
  descripcion      text not null,
  antiguedad       text not null check (antiguedad in
                     ('menos-1','1-3','3-10','mas-10')),
  salidas_ano      text,
  personas_salida  text,
  rango_precio     text,

  -- Paso 3 · Cómo cuidas a la gente (el filtro real)
  seguro_rc        text not null check (seguro_rc in
                     ('vigente','vence-pronto','tramite','no')),
  primeros_auxilios text not null check (primeros_auxilios in
                     ('todos','algunos','botiquin','no')),
  ratio_guias      text not null,
  -- Obligatoria a propósito: un incidente bien manejado suma, uno escondido
  -- descalifica. Se pregunta de frente porque es la respuesta que más informa.
  incidentes       text not null,

  -- Paso 4 · Por qué Caminante
  porque           text,
  conociste        text,
  -- Las tres reglas duras del sistema, aceptadas ANTES de la llamada.
  acepta_cobro     boolean not null default false,
  acepta_deslinde  boolean not null default false,
  acepta_encuesta  boolean not null default false,

  -- Decisión
  status text not null default 'pending'
    check (status in ('pending','calling','docs','approved','rejected')),
  motivo_rechazo text,
  notas          text,
  operator_id uuid references public.operators(id) on delete set null,
  decided_at  timestamptz,

  -- Expediente: el token del link privado y la lista de documentos pedidos con
  -- su estado. Va en jsonb porque qué se le pide cambia por actividad (a una
  -- operadora de montaña no se le pide certificación de buceo) y no queremos
  -- una tabla-catálogo para algo que se define caso por caso.
  expediente_token   text unique,
  expediente_expira  timestamptz,
  expediente         jsonb not null default '[]'::jsonb,

  -- Llamada
  llamada_enviada_at timestamptz,
  llamada_at         timestamptz,
  llamada_meet_url   text,

  created_at timestamptz not null default now()
);

-- Una PENDIENTE por correo. El histórico sí se permite: quien fue rechazado
-- puede volver a aplicar cuando resuelva lo que le faltaba.
create unique index if not exists operator_applications_pending_email_idx
  on public.operator_applications (lower(email))
  where status = 'pending';

create index if not exists operator_applications_status_idx
  on public.operator_applications (status, created_at desc);

-- RLS prendida SIN policies: nadie llega por PostgREST anónimo. La aplicación
-- entra por server action con service-role, y el expediente se abre por el
-- token del link, nunca por sesión.
alter table public.operator_applications enable row level security;
