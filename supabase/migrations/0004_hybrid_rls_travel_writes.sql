-- Hybrid access model
-- - Traveler writes through authenticated client + RLS
-- - Admin inventory writes through service role on server actions

-- Trip items RLS
alter table public.trip_items enable row level security;

create policy "trip_items_select_member" on public.trip_items
for select to authenticated
using (
  exists (
    select 1
    from public.trips t
    left join public.participants p on p.trip_id = t.id
    where t.id = trip_items.trip_id
      and (t.owner_user_id = auth.uid() or p.user_id = auth.uid())
  )
);

create policy "trip_items_insert_owner" on public.trip_items
for insert to authenticated
with check (
  exists (
    select 1
    from public.trips t
    where t.id = trip_items.trip_id
      and t.owner_user_id = auth.uid()
  )
);

create policy "trip_items_update_owner" on public.trip_items
for update to authenticated
using (
  exists (
    select 1
    from public.trips t
    where t.id = trip_items.trip_id
      and t.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trips t
    where t.id = trip_items.trip_id
      and t.owner_user_id = auth.uid()
  )
);

-- Participants RLS
alter table public.participants enable row level security;

create policy "participants_select_member" on public.participants
for select to authenticated
using (
  exists (
    select 1
    from public.trips t
    left join public.participants p2 on p2.trip_id = t.id
    where t.id = participants.trip_id
      and (t.owner_user_id = auth.uid() or p2.user_id = auth.uid())
  )
);

create policy "participants_insert_owner" on public.participants
for insert to authenticated
with check (
  exists (
    select 1
    from public.trips t
    where t.id = participants.trip_id
      and t.owner_user_id = auth.uid()
  )
);

-- Payments RLS baseline
alter table public.payments enable row level security;

create policy "payments_select_member" on public.payments
for select to authenticated
using (
  exists (
    select 1
    from public.trips t
    left join public.participants p on p.trip_id = t.id
    where t.id = payments.trip_id
      and (t.owner_user_id = auth.uid() or p.user_id = auth.uid())
  )
);

create policy "payments_insert_owner_or_payer" on public.payments
for insert to authenticated
with check (
  payer_user_id = auth.uid()
  and exists (
    select 1
    from public.trips t
    where t.id = payments.trip_id
      and t.owner_user_id = auth.uid()
  )
);
