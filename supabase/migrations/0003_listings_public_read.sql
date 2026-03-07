-- Public browsing: published listings are readable for anonymous and authenticated users.

create policy "listings_public_read_published" on public.listings
for select to anon, authenticated
using (status = 'published');
