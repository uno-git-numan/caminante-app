# Supabase Setup (Current Build)

## 1. Create Project
1. Create a Supabase project.
2. Copy these values into `.env.local` from `.env.example`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, optional for now)
- `NEXT_PUBLIC_SITE_URL` (`http://localhost:3000` for local dev)

## 2. Run SQL Migration
- Open Supabase SQL Editor.
- Execute in order:
  1. `supabase/migrations/0001_init.sql`
  2. `supabase/migrations/0002_admin_whitelist.sql`
  3. `supabase/migrations/0003_listings_public_read.sql`
  4. `supabase/migrations/0004_hybrid_rls_travel_writes.sql`
  5. `supabase/migrations/0005_booking_payment_constraints.sql`

## 3. Configure Supabase Auth URL
- In Supabase Auth settings:
  - Site URL: `http://localhost:3000`
  - Redirect URL allowlist includes:
    - `http://localhost:3000/caminante/auth/confirm`

## 4. Bootstrap first admin (manual whitelist)
- In SQL Editor:
```sql
insert into public.admin_whitelist (email, note)
values ('your-email@domain.com', 'initial admin');
```

## 4.1 Optional seed data for search/compare
```sql
insert into public.providers (legal_name, display_name, approval_state)
values ('Caminante Internal', 'Caminante', 'approved')
returning id;
```

Use returned `provider_id`:
```sql
insert into public.listings (provider_id, type, title, description, destination, vibe, difficulty, status)
values
  ('<provider_id>', 'activity', 'Ceramica con artesanos', 'Taller de barro tradicional', 'Chihuahua', 'local', 'moderate', 'published'),
  ('<provider_id>', 'activity', 'Ruta de campamento', 'Camping guiado en barrancas', 'Chihuahua', 'adventure', 'hard', 'published'),
  ('<provider_id>', 'package', 'Copper Canyons Weekend', 'Paquete de aventura + cocina', 'Chihuahua', 'adventure', 'moderate', 'published');
```

## 5. Start App
```bash
cd /Users/luisdelarosa/Desktop/scripts/caminante/app
npm run dev
```

## 6. Verify
- Open `http://localhost:3000/caminante`
- Health check: `http://localhost:3000/caminante/api/health`
- Login: `http://localhost:3000/caminante/login`
- Admin route test: `http://localhost:3000/caminante/admin`

## 7. Access model now implemented
- Traveler writes (`trips`, `trip_items`) use authenticated Supabase client + RLS.
- Admin inventory writes (`providers`, `listings`) run through server actions using `SUPABASE_SERVICE_ROLE_KEY` and admin whitelist checks.

## 8. Stripe env needed for checkout
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## 9. Stripe webhook endpoint
- Configure Stripe webhook URL:
  - `http://localhost:3000/caminante/api/payments/webhook` (local)
- Events required:
  - `payment_intent.succeeded`
