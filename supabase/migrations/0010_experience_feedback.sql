-- ─────────────────────────────────────────────────────────────────────────────
-- 0010 · ENCUESTA DE SATISFACCIÓN post-experiencia
--
-- Una invitación por persona × reserva, con TOKEN para responder sin login (el
-- correo/WhatsApp lleva el link). La fila nace al ENVIAR la invitación (status
-- 'invited') y se llena al RESPONDER (status 'submitted'). NO es append-only: el
-- usuario puede corregir/reenviar mientras esté abierta.
--
-- Referencia por LOCACIÓN (no por fecha). Testimonio publicable SOLO con permiso
-- explícito y SOLO con iniciales (nunca nombre completo) — eso lo aplica la capa
-- de publicación; aquí guardamos el consentimiento.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.experience_feedback (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id),
  contact_id     uuid not null references public.contacts(id),
  experience_id  uuid not null references public.experiences(id),
  location_label text,                 -- "Ensenada de Muertos, BCS" (NO la fecha)

  -- acceso sin login + trazabilidad del canal
  token  uuid not null default gen_random_uuid(),
  status text not null default 'invited'
    check (status in ('invited', 'submitted')),
  source text check (source in ('email', 'whatsapp', 'web')),

  -- métricas duras (estrellas con medias: 1.0 … 5.0 en pasos de 0.5)
  overall_stars   numeric(2,1) check (overall_stars between 1 and 5),
  nps             smallint check (nps between 0 and 10),
  section_ratings jsonb not null default '{}'::jsonb,  -- {key: {stars, comment}}

  -- abiertas (para crecer)
  loved_text        text,   -- "¿qué fue lo que más te marcó?"
  improve_text      text,   -- ruta privada de quien calificó bajo
  expected_gap_text text,   -- "¿algo que esperabas y no pasó?"
  rebook_interest   boolean not null default false,  -- → lead al Pipeline

  -- testimonio publicable (SOLO iniciales si se autoriza)
  testimonial_text    text,
  testimonial_stars   smallint check (testimonial_stars between 1 and 5),
  testimonial_consent boolean not null default false,  -- permiso de publicar
  photo_consent       boolean not null default false,
  publish_status      text not null default 'none'
    check (publish_status in ('none', 'pending', 'approved', 'rejected')),

  feedback_version text not null default 'v1',
  invited_at   timestamptz not null default now(),
  submitted_at timestamptz,
  updated_at   timestamptz not null default now()
);

-- una invitación por persona × reserva (reenviar = misma fila)
create unique index if not exists experience_feedback_once
  on public.experience_feedback (reservation_id, contact_id);
create unique index if not exists experience_feedback_token
  on public.experience_feedback (token);
create index if not exists experience_feedback_experience_idx
  on public.experience_feedback (experience_id);
-- para listar testimonios aprobados rápido
create index if not exists experience_feedback_publish_idx
  on public.experience_feedback (publish_status)
  where publish_status = 'approved';

-- updated_at automático
create or replace function public.experience_feedback_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists experience_feedback_set_updated_at on public.experience_feedback;
create trigger experience_feedback_set_updated_at
  before update on public.experience_feedback
  for each row execute function public.experience_feedback_touch();

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS — el dueño (vía su contact ligado) lee su propio feedback; las escrituras
--       van por el server action con service-role (igual que registrations). El
--       acceso por token (sin login) lo resuelve el server, no una policy.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.experience_feedback enable row level security;

drop policy if exists "experience_feedback_select_own" on public.experience_feedback;
create policy "experience_feedback_select_own" on public.experience_feedback
  for select to authenticated
  using (
    exists (
      select 1 from public.contacts c
      where c.id = experience_feedback.contact_id
        and c.user_id = auth.uid()
    )
  );
