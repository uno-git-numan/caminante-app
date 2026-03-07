-- Booking + payment constraints and RLS for traveler flow

-- Idempotency for payment intents
create unique index if not exists payments_provider_ref_unique
on public.payments (provider_ref)
where provider_ref is not null;

-- One booking per trip_item in this MVP slice
create unique index if not exists bookings_trip_item_unique
on public.bookings (trip_item_id);

-- Traveler read/write access for bookings related to owned/member trips
alter table public.bookings enable row level security;

create policy "bookings_select_member" on public.bookings
for select to authenticated
using (
  exists (
    select 1
    from public.trip_items ti
    join public.trips t on t.id = ti.trip_id
    left join public.participants p on p.trip_id = t.id
    where ti.id = bookings.trip_item_id
      and (t.owner_user_id = auth.uid() or p.user_id = auth.uid())
  )
);

create policy "bookings_insert_owner" on public.bookings
for insert to authenticated
with check (
  exists (
    select 1
    from public.trip_items ti
    join public.trips t on t.id = ti.trip_id
    where ti.id = bookings.trip_item_id
      and t.owner_user_id = auth.uid()
  )
);

create policy "bookings_update_owner" on public.bookings
for update to authenticated
using (
  exists (
    select 1
    from public.trip_items ti
    join public.trips t on t.id = ti.trip_id
    where ti.id = bookings.trip_item_id
      and t.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trip_items ti
    join public.trips t on t.id = ti.trip_id
    where ti.id = bookings.trip_item_id
      and t.owner_user_id = auth.uid()
  )
);
