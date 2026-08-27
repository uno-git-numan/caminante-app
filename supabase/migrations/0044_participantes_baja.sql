-- ─────────────────────────────────────────────────────────────────────────────
-- 0044 · BAJA DE UN PARTICIPANTE, sin tocar el deslinde firmado
--
-- El 27 ago 2026 el roster de hongos (27 sep) listaba 6 personas contra 5
-- lugares pagados. La sexta era «Nala poza», relationship «Mi perrita»: el
-- titular capturó 3 participantes sobre una reserva de 2 lugares. Luis decidió
-- que no la va a pagar.
--
-- Su ficha viva salió de `dependents`. Pero el roster lee `registrations.
-- participants`, y esa tabla es APPEND-ONLY por trigger (0008): es el rastro
-- legal de lo que esa persona declaró y aceptó al firmar. Borrar de ahí sería
-- reescribir un documento firmado.
--
-- Son dos documentos distintos que hoy comparten una sola fuente:
--   · el DESLINDE   — qué se declaró y se aceptó. Inmutable.
--   · el ROSTER     — quién sube al cerro mañana. Vivo.
--
-- Esta tabla es el segundo. Es ADITIVA y no toca nada existente: registra que
-- un participante ya no va, con quién lo decidió y por qué. El roster la resta
-- al construir la lista; el deslinde firmado se queda exactamente como está.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.participant_withdrawals (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  -- Identifica al participante dentro de registrations.participants. Puede ser
  -- null cuando se capturó sin ficha: entonces manda `full_name`.
  dependent_id uuid,
  full_name text not null,
  motivo text not null,
  -- Quién lo decidió. Nunca se da de baja a alguien «solo».
  decidido_por text not null,
  created_at timestamptz not null default now()
);

create index if not exists participant_withdrawals_resv_idx
  on public.participant_withdrawals (reservation_id);

-- Una baja por participante y reserva: repetirla no cambia nada.
create unique index if not exists participant_withdrawals_uniq
  on public.participant_withdrawals (reservation_id, coalesce(dependent_id::text, full_name));

-- Sin policies: solo service-role, igual que el resto del expediente.
alter table public.participant_withdrawals enable row level security;

-- La baja de Nala, ya decidida. Idempotente.
insert into public.participant_withdrawals
  (reservation_id, dependent_id, full_name, motivo, decidido_por)
values
  ('71b676f1-dfe1-4ec0-98ee-317afe2c495e',
   '6516a980-1263-4bf8-867b-9760a6487be8',
   'Nala poza',
   'No se paga su lugar: la reserva es de 2 y se capturaron 3 participantes.',
   'Luis · 27 ago 2026')
on conflict do nothing;
