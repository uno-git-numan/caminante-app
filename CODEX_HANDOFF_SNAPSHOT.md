# Caminante Handoff Snapshot

## 1) Full directory tree (`find src/ -type f`)
```text
src//app/caminante/admin/bookings/requests/page.tsx
src//app/caminante/admin/layout.tsx
src//app/caminante/admin/listings/page.tsx
src//app/caminante/admin/page.tsx
src//app/caminante/admin/payouts/page.tsx
src//app/caminante/admin/providers/page.tsx
src//app/caminante/admin/support/page.tsx
src//app/caminante/api/compare/route.ts
src//app/caminante/api/health/route.ts
src//app/caminante/api/listings/route.ts
src//app/caminante/api/payments/create-intent/route.ts
src//app/caminante/api/payments/finalize/route.ts
src//app/caminante/api/payments/webhook/route.ts
src//app/caminante/auth/confirm/route.ts
src//app/caminante/compare/activities/page.tsx
src//app/caminante/compare/packages/page.tsx
src//app/caminante/layout.tsx
src//app/caminante/listings/[listingId]/page.tsx
src//app/caminante/login/page.tsx
src//app/caminante/magazine/page.tsx
src//app/caminante/page.tsx
src//app/caminante/search/page.tsx
src//app/caminante/signup/page.tsx
src//app/caminante/trips/[tripId]/checkout/page.tsx
src//app/caminante/trips/[tripId]/checkout/success/page.tsx
src//app/caminante/trips/[tripId]/hub/page.tsx
src//app/caminante/trips/[tripId]/page.tsx
src//app/caminante/trips/new/page.tsx
src//app/favicon.ico
src//app/globals.css
src//app/layout.tsx
src//app/page.tsx
src//components/payments/embedded-checkout.tsx
src//lib/admin/actions.ts
src//lib/auth/actions.ts
src//lib/auth/authorization.ts
src//lib/auth/session.ts
src//lib/listings/queries.ts
src//lib/payments/finalize.ts
src//lib/payments/queries.ts
src//lib/payments/stripe.ts
src//lib/supabase/admin.ts
src//lib/supabase/browser.ts
src//lib/supabase/env.ts
src//lib/supabase/middleware.ts
src//lib/supabase/server.ts
src//lib/trips/actions.ts
```

## 2) package.json
```json
{
  "name": "app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@stripe/react-stripe-js": "^5.6.1",
    "@stripe/stripe-js": "^8.9.0",
    "@supabase/ssr": "^0.9.0",
    "@supabase/supabase-js": "^2.98.0",
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "stripe": "^20.4.0",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

## 3) Source file contents (`.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.css` under src/)

### src//app/caminante/admin/bookings/requests/page.tsx
```tsx
export default function BookingRequestsAdminPage() {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Request-to-book queue</h2>
      <p className="text-stone-600">Same-day SLA queue for manual confirmations.</p>
    </section>
  );
}
```

### src//app/caminante/admin/layout.tsx
```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/caminante/login?next=/caminante/admin");
  }

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/caminante?error=not_admin");
  }

  return <>{children}</>;
}
```

### src//app/caminante/admin/listings/page.tsx
```tsx
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createListingAction } from "@/lib/admin/actions";

interface ListingsAdminPageProps {
  searchParams: Promise<{ created?: string; error?: string }>;
}

export default async function ListingsAdminPage({
  searchParams,
}: ListingsAdminPageProps) {
  const { created, error } = await searchParams;
  let rows:
    | Array<{
        id: string;
        title: string;
        type: string;
        status: string;
        destination: string | null;
      }>
    | null = null;
  let providers: Array<{ id: string; display_name: string }> | null = null;
  let missingServiceRole = false;

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("listings")
      .select("id,title,type,status,destination")
      .order("updated_at", { ascending: false })
      .limit(50);
    rows = data ?? [];
    const { data: providerRows } = await supabase
      .from("providers")
      .select("id,display_name")
      .order("display_name", { ascending: true })
      .limit(200);
    providers = providerRows ?? [];
  } catch {
    missingServiceRole = true;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Listings Admin</h2>
      <p className="text-stone-600">Manage activities, transport, accommodations, and packages.</p>
      {created === "1" ? (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Listing creado.</p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(error)}</p>
      ) : null}
      {missingServiceRole ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Configure `SUPABASE_SERVICE_ROLE_KEY` to load full admin inventory.
        </p>
      ) : (
        <>
          <form action={createListingAction} className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>Provider</span>
              <select className="w-full rounded-lg border border-stone-300 px-3 py-2" name="provider_id" required>
                <option value="">Selecciona provider</option>
                {providers?.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.display_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span>Type</span>
              <select className="w-full rounded-lg border border-stone-300 px-3 py-2" name="type" defaultValue="activity">
                <option value="activity">activity</option>
                <option value="transport">transport</option>
                <option value="accommodation">accommodation</option>
                <option value="package">package</option>
              </select>
            </label>
            <input className="rounded-lg border border-stone-300 px-3 py-2" name="title" placeholder="Title" required />
            <input className="rounded-lg border border-stone-300 px-3 py-2" name="destination" placeholder="Destination" />
            <input className="rounded-lg border border-stone-300 px-3 py-2" name="vibe" placeholder="Vibe" />
            <input className="rounded-lg border border-stone-300 px-3 py-2" name="difficulty" placeholder="Difficulty" />
            <label className="space-y-1 text-sm md:col-span-2">
              <span>Description</span>
              <textarea className="w-full rounded-lg border border-stone-300 px-3 py-2" name="description" rows={3} />
            </label>
            <label className="space-y-1 text-sm">
              <span>Status</span>
              <select className="w-full rounded-lg border border-stone-300 px-3 py-2" name="status" defaultValue="draft">
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </label>
            <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800">
              Crear listing
            </button>
          </form>
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-stone-100 text-left">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Destination</th>
                  <th className="px-3 py-2">ID</th>
                </tr>
              </thead>
              <tbody>
                {rows?.map((row) => (
                  <tr key={row.id} className="border-t border-stone-200">
                    <td className="px-3 py-2">{row.title}</td>
                    <td className="px-3 py-2">{row.type}</td>
                    <td className="px-3 py-2">{row.status}</td>
                    <td className="px-3 py-2">{row.destination ?? "-"}</td>
                    <td className="px-3 py-2 text-xs text-stone-500">{row.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
```

### src//app/caminante/admin/page.tsx
```tsx
import Link from "next/link";

const adminLinks = [
  "/caminante/admin/providers",
  "/caminante/admin/listings",
  "/caminante/admin/bookings/requests",
  "/caminante/admin/payouts",
  "/caminante/admin/support",
];

export default function AdminHomePage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Admin dashboard</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {adminLinks.map((href) => (
          <Link key={href} href={href} className="rounded-xl border border-stone-200 bg-white p-4 hover:border-emerald-700">
            {href}
          </Link>
        ))}
      </div>
    </section>
  );
}
```

### src//app/caminante/admin/payouts/page.tsx
```tsx
export default function PayoutsAdminPage() {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Payouts</h2>
      <p className="text-stone-600">Weekly settlement ledger and payout run controls.</p>
    </section>
  );
}
```

### src//app/caminante/admin/providers/page.tsx
```tsx
import { createProviderAction } from "@/lib/admin/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface ProvidersAdminPageProps {
  searchParams: Promise<{ created?: string; error?: string }>;
}

export default async function ProvidersAdminPage({
  searchParams,
}: ProvidersAdminPageProps) {
  const { created, error } = await searchParams;
  let providers:
    | Array<{
        id: string;
        display_name: string;
        legal_name: string;
        country_code: string;
        approval_state: string;
      }>
    | null = null;
  let missingServiceRole = false;

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("providers")
      .select("id,display_name,legal_name,country_code,approval_state")
      .order("updated_at", { ascending: false })
      .limit(50);
    providers = data ?? [];
  } catch {
    missingServiceRole = true;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Providers</h2>
      <p className="text-stone-600">Create providers using service-role writes (hybrid model).</p>
      {created === "1" ? (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Provider creado.</p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(error)}</p>
      ) : null}
      {missingServiceRole ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Configure `SUPABASE_SERVICE_ROLE_KEY` for admin provider writes.
        </p>
      ) : (
        <>
          <form action={createProviderAction} className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 md:grid-cols-2">
            <input
              className="rounded-lg border border-stone-300 px-3 py-2"
              name="legal_name"
              placeholder="Legal name"
              required
            />
            <input
              className="rounded-lg border border-stone-300 px-3 py-2"
              name="display_name"
              placeholder="Display name"
              required
            />
            <input className="rounded-lg border border-stone-300 px-3 py-2" name="country_code" defaultValue="MX" />
            <button
              type="submit"
              className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
            >
              Crear provider
            </button>
          </form>
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-stone-100 text-left">
                <tr>
                  <th className="px-3 py-2">Display</th>
                  <th className="px-3 py-2">Legal</th>
                  <th className="px-3 py-2">Country</th>
                  <th className="px-3 py-2">State</th>
                  <th className="px-3 py-2">ID</th>
                </tr>
              </thead>
              <tbody>
                {providers?.map((provider) => (
                  <tr key={provider.id} className="border-t border-stone-200">
                    <td className="px-3 py-2">{provider.display_name}</td>
                    <td className="px-3 py-2">{provider.legal_name}</td>
                    <td className="px-3 py-2">{provider.country_code}</td>
                    <td className="px-3 py-2">{provider.approval_state}</td>
                    <td className="px-3 py-2 text-xs text-stone-500">{provider.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
```

### src//app/caminante/admin/support/page.tsx
```tsx
export default function SupportAdminPage() {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Support operations</h2>
      <p className="text-stone-600">AI support monitoring and human escalation operations.</p>
    </section>
  );
}
```

### src//app/caminante/api/compare/route.ts
```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getListingsByIds } from "@/lib/listings/queries";

const bodySchema = z.object({
  listingIds: z.array(z.uuid()).min(2).max(5),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const listings = await getListingsByIds(parsed.data.listingIds);

    const compareRows = listings.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      price: "TODO",
      vibe: item.vibe,
      difficulty: item.difficulty,
      availability: "TODO",
      destination: item.destination,
    }));

    return NextResponse.json({ data: compareRows }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
```

### src//app/caminante/api/health/route.ts
```ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "caminante-api",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
```

### src//app/caminante/api/listings/route.ts
```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { searchPublishedListings } from "@/lib/listings/queries";

const querySchema = z.object({
  q: z.string().trim().optional(),
  type: z.enum(["activity", "transport", "accommodation", "package"]).optional(),
  destination: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);

  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    destination: url.searchParams.get("destination") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query params", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const listings = await searchPublishedListings(parsed.data);
    return NextResponse.json({ data: listings }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
```

### src//app/caminante/api/payments/create-intent/route.ts
```ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTripItemsForCheckout } from "@/lib/payments/queries";
import { getStripeServerClient, toStripeAmount } from "@/lib/payments/stripe";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const tripId = typeof body?.tripId === "string" ? body.tripId : "";

  if (!tripId) {
    return NextResponse.json({ error: "Missing tripId" }, { status: 400 });
  }

  const { data: trip } = await supabase
    .from("trips")
    .select("id,owner_user_id")
    .eq("id", tripId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const { payable, payableTotalMxn } = await getTripItemsForCheckout(tripId);

  if (payable.length === 0 || payableTotalMxn <= 0) {
    return NextResponse.json(
      { error: "No payable instant items in this trip" },
      { status: 400 },
    );
  }

  const stripe = getStripeServerClient();
  const intent = await stripe.paymentIntents.create({
    amount: toStripeAmount(payableTotalMxn),
    currency: "mxn",
    automatic_payment_methods: { enabled: true },
    metadata: {
      trip_id: tripId,
      user_id: user.id,
      flow: "single_payer_instant_items",
    },
  });

  if (!intent.client_secret) {
    return NextResponse.json(
      { error: "Failed to create payment intent client secret" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amountMxn: payableTotalMxn,
      payableCount: payable.length,
    },
    { status: 200 },
  );
}
```

### src//app/caminante/api/payments/finalize/route.ts
```ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { finalizeSucceededPaymentIntent } from "@/lib/payments/finalize";
import { getStripeServerClient } from "@/lib/payments/stripe";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const paymentIntentId = typeof body?.paymentIntentId === "string" ? body.paymentIntentId : "";
  const tripId = typeof body?.tripId === "string" ? body.tripId : "";

  if (!paymentIntentId || !tripId) {
    return NextResponse.json(
      { error: "Missing paymentIntentId or tripId" },
      { status: 400 },
    );
  }

  const { data: trip } = await supabase
    .from("trips")
    .select("id,owner_user_id")
    .eq("id", tripId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const stripe = getStripeServerClient();
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (intent.status !== "succeeded") {
    return NextResponse.json(
      { error: `Payment intent not succeeded (status=${intent.status})` },
      { status: 400 },
    );
  }

  if (intent.metadata.trip_id !== tripId || intent.metadata.user_id !== user.id) {
    return NextResponse.json({ error: "Payment metadata mismatch" }, { status: 400 });
  }

  const result = await finalizeSucceededPaymentIntent(intent);

  return NextResponse.json(
    {
      ok: true,
      ...result,
    },
    { status: 200 },
  );
}
```

### src//app/caminante/api/payments/webhook/route.ts
```ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { finalizeSucceededPaymentIntent } from "@/lib/payments/finalize";
import { getStripeServerClient } from "@/lib/payments/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing stripe-signature or STRIPE_WEBHOOK_SECRET" },
      { status: 400 },
    );
  }

  const payload = await request.text();
  const stripe = getStripeServerClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${(error as Error).message}` },
      { status: 400 },
    );
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      await finalizeSucceededPaymentIntent(event.data.object as Stripe.PaymentIntent);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Webhook processing failed: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}
```

### src//app/caminante/auth/confirm/route.ts
```ts
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") ?? "/caminante";

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/caminante/login?error=missing_token", request.url));
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(new URL(`/caminante/login?error=${encodeURIComponent(error.message)}`, request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
```

### src//app/caminante/compare/activities/page.tsx
```tsx
import Link from "next/link";
import { searchPublishedListings } from "@/lib/listings/queries";

interface CompareActivitiesPageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function CompareActivitiesPage({
  searchParams,
}: CompareActivitiesPageProps) {
  const { ids } = await searchParams;
  const all = await searchPublishedListings({ type: "activity", limit: 20 });
  const selectedIds = (ids ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 4);
  const selected = all.filter((item) => selectedIds.includes(item.id));

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Comparar actividades</h2>
      <p className="text-stone-600">Selecciona 2-4 actividades agregando IDs en el query string `?ids=id1,id2`.</p>
      <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
        <h3 className="mb-2 font-semibold">Actividades disponibles</h3>
        <ul className="space-y-1">
          {all.map((item) => (
            <li key={item.id}>
              <Link className="text-emerald-700 hover:underline" href={`/caminante/listings/${item.id}`}>
                {item.title}
              </Link>{" "}
              <span className="text-stone-500">({item.id})</span>
            </li>
          ))}
        </ul>
      </div>
      {selected.length >= 2 ? (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-100 text-left">
              <tr>
                <th className="px-3 py-2">Actividad</th>
                <th className="px-3 py-2">Precio</th>
                <th className="px-3 py-2">Vibe</th>
                <th className="px-3 py-2">Dificultad</th>
                <th className="px-3 py-2">Disponibilidad</th>
              </tr>
            </thead>
            <tbody>
              {selected.map((item) => (
                <tr key={item.id} className="border-t border-stone-200">
                  <td className="px-3 py-2">{item.title}</td>
                  <td className="px-3 py-2">TODO</td>
                  <td className="px-3 py-2">{item.vibe ?? "n/a"}</td>
                  <td className="px-3 py-2">{item.difficulty ?? "n/a"}</td>
                  <td className="px-3 py-2">TODO</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-stone-600">Agrega al menos 2 IDs para comparar.</p>
      )}
    </section>
  );
}
```

### src//app/caminante/compare/packages/page.tsx
```tsx
import Link from "next/link";
import { searchPublishedListings } from "@/lib/listings/queries";

interface ComparePackagesPageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function ComparePackagesPage({
  searchParams,
}: ComparePackagesPageProps) {
  const { ids } = await searchParams;
  const all = await searchPublishedListings({ type: "package", limit: 20 });
  const selectedIds = (ids ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 4);
  const selected = all.filter((item) => selectedIds.includes(item.id));

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Comparar paquetes</h2>
      <p className="text-stone-600">Selecciona 2-4 paquetes con `?ids=id1,id2` para comparar.</p>
      <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
        <h3 className="mb-2 font-semibold">Paquetes disponibles</h3>
        <ul className="space-y-1">
          {all.map((item) => (
            <li key={item.id}>
              <Link className="text-emerald-700 hover:underline" href={`/caminante/listings/${item.id}`}>
                {item.title}
              </Link>{" "}
              <span className="text-stone-500">({item.id})</span>
            </li>
          ))}
        </ul>
      </div>
      {selected.length >= 2 ? (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-100 text-left">
              <tr>
                <th className="px-3 py-2">Paquete</th>
                <th className="px-3 py-2">Precio</th>
                <th className="px-3 py-2">Vibe</th>
                <th className="px-3 py-2">Dificultad</th>
                <th className="px-3 py-2">Disponibilidad</th>
              </tr>
            </thead>
            <tbody>
              {selected.map((item) => (
                <tr key={item.id} className="border-t border-stone-200">
                  <td className="px-3 py-2">{item.title}</td>
                  <td className="px-3 py-2">TODO</td>
                  <td className="px-3 py-2">{item.vibe ?? "n/a"}</td>
                  <td className="px-3 py-2">{item.difficulty ?? "n/a"}</td>
                  <td className="px-3 py-2">TODO</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-stone-600">Agrega al menos 2 IDs para comparar.</p>
      )}
    </section>
  );
}
```

### src//app/caminante/layout.tsx
```tsx
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";

const navItems = [
  { href: "/caminante", label: "Inicio" },
  { href: "/caminante/search", label: "Buscar" },
  { href: "/caminante/compare/activities", label: "Comparar actividades" },
  { href: "/caminante/compare/packages", label: "Comparar paquetes" },
  { href: "/caminante/magazine", label: "Magazine" },
  { href: "/caminante/admin", label: "Admin" },
];

export default async function CaminanteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">numanhub.com</p>
            <h1 className="text-2xl font-semibold">Caminante</h1>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-stone-300 px-3 py-1.5 hover:border-emerald-700 hover:text-emerald-700"
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full border border-stone-300 px-3 py-1.5 hover:border-emerald-700 hover:text-emerald-700"
                >
                  Salir ({user.email})
                </button>
              </form>
            ) : (
              <Link
                href="/caminante/login"
                className="rounded-full border border-stone-300 px-3 py-1.5 hover:border-emerald-700 hover:text-emerald-700"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
```

### src//app/caminante/listings/[listingId]/page.tsx
```tsx
interface ListingPageProps {
  params: Promise<{ listingId: string }>;
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { listingId } = await params;
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();
  const { data: listing, error } = await supabase
    .from("listings")
    .select("id,title,description,type,destination,vibe,difficulty,status,updated_at")
    .eq("id", listingId)
    .maybeSingle();

  if (error || !listing) {
    return (
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Listing no encontrado</h2>
        <p className="text-stone-600">Verifica que esté publicado y que el ID sea correcto.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">{listing.title}</h2>
      <p className="text-stone-600">
        {listing.type} · {listing.destination ?? "Sin destino"} · vibe {listing.vibe ?? "n/a"} · dificultad{" "}
        {listing.difficulty ?? "n/a"}
      </p>
      <p className="rounded-xl border border-stone-200 bg-white p-4 text-stone-700">
        {listing.description ?? "Sin descripción"}
      </p>
      <p className="text-xs text-stone-500">Listing ID: {listing.id}</p>
    </section>
  );
}
```

### src//app/caminante/login/page.tsx
```tsx
import Link from "next/link";
import { sendMagicLink } from "@/lib/auth/actions";

interface LoginPageProps {
  searchParams: Promise<{
    sent?: string;
    email?: string;
    error?: string;
    next?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { sent, email, error, next } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/caminante";

  return (
    <section className="mx-auto max-w-md space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-2xl font-semibold">Iniciar sesión</h2>
      <p className="text-sm text-stone-600">Te enviaremos un magic link por email para entrar.</p>
      {sent === "1" && email ? (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          Revisa tu correo: <strong>{email}</strong>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(error)}</div>
      ) : null}
      <form action={sendMagicLink} className="space-y-3">
        <input type="hidden" name="next" value={nextPath} />
        <label className="block text-sm font-medium text-stone-700" htmlFor="email">
          Email
        </label>
        <input
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
          id="email"
          name="email"
          type="email"
          required
          placeholder="tu@email.com"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
        >
          Enviar magic link
        </button>
      </form>
      <Link className="text-sm text-emerald-700 hover:underline" href="/caminante/signup">
        Crear cuenta
      </Link>
    </section>
  );
}
```

### src//app/caminante/magazine/page.tsx
```tsx
export default function MagazinePage() {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Magazine</h2>
      <p className="text-stone-600">Always-on content layer with global and destination stories.</p>
    </section>
  );
}
```

### src//app/caminante/page.tsx
```tsx
import Link from "next/link";

const quickLinks = [
  { href: "/caminante/search", label: "Explorar inventario" },
  { href: "/caminante/trips/new", label: "Crear viaje" },
  { href: "/caminante/magazine", label: "Leer magazine" },
  { href: "/caminante/admin/bookings/requests", label: "Ver requests" },
];

export default function CaminanteHomePage() {
  return (
    <section className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-600 p-8 text-white">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-100">V1 Build</p>
        <h2 className="mt-3 text-3xl font-semibold">Travel platform live under /caminante</h2>
        <p className="mt-3 max-w-3xl text-emerald-50">
          This baseline includes public routes, admin routes, and API endpoints aligned
          with the PRD path strategy on numanhub.com.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-stone-200 bg-white p-4 hover:border-emerald-700"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
```

### src//app/caminante/search/page.tsx
```tsx
import Link from "next/link";
import { searchPublishedListings } from "@/lib/listings/queries";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: "activity" | "transport" | "accommodation" | "package";
    destination?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, type, destination } = await searchParams;
  const listings = await searchPublishedListings({ q, type, destination, limit: 30 });

  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-semibold">Buscar experiencias</h2>
      <form className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 md:grid-cols-4">
        <input
          className="rounded-lg border border-stone-300 px-3 py-2"
          name="q"
          defaultValue={q}
          placeholder="Qué quieres hacer"
        />
        <select className="rounded-lg border border-stone-300 px-3 py-2" name="type" defaultValue={type}>
          <option value="">Todos los tipos</option>
          <option value="activity">Actividad</option>
          <option value="transport">Transporte</option>
          <option value="accommodation">Hospedaje</option>
          <option value="package">Paquete</option>
        </select>
        <input
          className="rounded-lg border border-stone-300 px-3 py-2"
          name="destination"
          defaultValue={destination}
          placeholder="Destino"
        />
        <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800">
          Buscar
        </button>
      </form>
      <p className="text-sm text-stone-600">{listings.length} resultados</p>
      <div className="grid gap-3">
        {listings.map((listing) => (
          <Link
            key={listing.id}
            href={`/caminante/listings/${listing.id}`}
            className="rounded-xl border border-stone-200 bg-white p-4 hover:border-emerald-700"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">{listing.title}</h3>
              <span className="rounded-full bg-stone-100 px-2 py-1 text-xs uppercase">{listing.type}</span>
            </div>
            <p className="text-sm text-stone-600">
              {listing.destination ?? "Sin destino"} · vibe {listing.vibe ?? "n/a"} · dificultad{" "}
              {listing.difficulty ?? "n/a"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

### src//app/caminante/signup/page.tsx
```tsx
import Link from "next/link";
import { sendMagicLink } from "@/lib/auth/actions";

interface SignupPageProps {
  searchParams: Promise<{
    next?: string;
  }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { next } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/caminante";

  return (
    <section className="mx-auto max-w-md space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-2xl font-semibold">Crear cuenta</h2>
      <p className="text-sm text-stone-600">Usamos el mismo flujo de magic link para registro.</p>
      <form action={sendMagicLink} className="space-y-3">
        <input type="hidden" name="next" value={nextPath} />
        <label className="block text-sm font-medium text-stone-700" htmlFor="email">
          Email
        </label>
        <input
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
          id="email"
          name="email"
          type="email"
          required
          placeholder="tu@email.com"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
        >
          Crear cuenta con magic link
        </button>
      </form>
      <Link className="text-sm text-emerald-700 hover:underline" href="/caminante/login">
        Ya tengo cuenta
      </Link>
    </section>
  );
}
```

### src//app/caminante/trips/[tripId]/checkout/page.tsx
```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmbeddedCheckout } from "@/components/payments/embedded-checkout";
import { getOwnedTripById, getTripItemsForCheckout } from "@/lib/payments/queries";

interface TripCheckoutPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function TripCheckoutPage({ params }: TripCheckoutPageProps) {
  const { tripId } = await params;
  const { trip, user } = await getOwnedTripById(tripId);

  if (!user) {
    redirect(`/caminante/login?next=/caminante/trips/${tripId}/checkout`);
  }

  if (!trip) {
    return (
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Checkout no disponible</h2>
        <p className="text-stone-600">No encontramos el viaje o no tienes permisos.</p>
      </section>
    );
  }

  const { payable, requestOnly, payableTotalMxn } = await getTripItemsForCheckout(tripId);

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-2xl font-semibold">Checkout: {trip.title}</h2>
        <p className="text-stone-600">
          Pago embebido para items instant. Items request-to-book se confirman por operador antes de pago.
        </p>
        <Link className="text-sm text-emerald-700 hover:underline" href={`/caminante/trips/${tripId}`}>
          Volver al viaje
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <h3 className="font-semibold">Resumen</h3>
          <p className="text-sm text-stone-600">Instant pendientes: {payable.length}</p>
          <p className="text-sm text-stone-600">Request pendientes: {requestOnly.length}</p>
          <p className="mt-2 text-lg font-semibold">Total a cobrar ahora: MXN {payableTotalMxn.toFixed(2)}</p>
        </div>

        {payableTotalMxn > 0 ? (
          <EmbeddedCheckout tripId={tripId} amountMxn={payableTotalMxn} payableCount={payable.length} />
        ) : (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            No hay items instant pendientes por pagar.
          </p>
        )}
      </div>
    </section>
  );
}
```

### src//app/caminante/trips/[tripId]/checkout/success/page.tsx
```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type Status = "loading" | "done" | "error";

export default function CheckoutSuccessPage() {
  const params = useParams<{ tripId: string }>();
  const tripId = typeof params.tripId === "string" ? params.tripId : "";
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("Validando pago...");
  const searchParams = useSearchParams();

  const paymentIntentId = useMemo(
    () => searchParams.get("payment_intent") ?? "",
    [searchParams],
  );

  useEffect(() => {
    if (!tripId || !paymentIntentId) {
      return;
    }

    const run = async () => {
      const response = await fetch("/caminante/api/payments/finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentIntentId,
          tripId,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.error ?? "No se pudo finalizar el pago.");
        return;
      }

      setStatus("done");
      setMessage(`Pago confirmado. Bookings instant confirmados: ${payload.confirmedBookings}`);
    };

    run();
  }, [paymentIntentId, tripId]);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Resultado de pago</h2>
      {!paymentIntentId ? (
        <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
          No encontramos el payment_intent para finalizar.
        </p>
      ) : null}
      <p
        className={
          status === "done"
            ? "rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
            : status === "error"
              ? "rounded-lg bg-rose-50 p-3 text-sm text-rose-800"
              : "rounded-lg bg-stone-100 p-3 text-sm text-stone-700"
        }
      >
        {message}
      </p>
      {tripId ? (
        <Link className="text-emerald-700 hover:underline" href={`/caminante/trips/${tripId}`}>
          Volver al viaje
        </Link>
      ) : null}
    </section>
  );
}
```

### src//app/caminante/trips/[tripId]/hub/page.tsx
```tsx
interface TripHubPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function TripHubPage({ params }: TripHubPageProps) {
  const { tripId } = await params;

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Trip Hub</h2>
      <p className="text-stone-600">
        Centralized success state: itinerary, calendar actions, WhatsApp group, and support.
      </p>
      <p className="text-stone-600">Trip ID: {tripId}</p>
    </section>
  );
}
```

### src//app/caminante/trips/[tripId]/page.tsx
```tsx
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { addTripItemAction, submitRequestBookingsAction } from "@/lib/trips/actions";

interface TripPageProps {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ error?: string; added?: string; requests_submitted?: string }>;
}

export default async function TripPage({ params, searchParams }: TripPageProps) {
  const { tripId } = await params;
  const { error, added, requests_submitted: requestsSubmitted } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: trip } = await supabase
    .from("trips")
    .select("id,title,destination,start_date,end_date,status")
    .eq("id", tripId)
    .maybeSingle();

  const { data: tripItems } = await supabase
    .from("trip_items")
    .select("id,listing_id,booking_mode,quantity,price_mxn,status,created_at")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });

  const { data: listings } = await supabase
    .from("listings")
    .select("id,title,type,destination")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (!trip) {
    return (
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Trip no encontrado</h2>
        <p className="text-stone-600">Verifica acceso y el identificador del viaje.</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-2xl font-semibold">{trip.title}</h2>
        <p className="text-stone-600">
          {trip.destination ?? "Sin destino"} · {trip.start_date ?? "sin fecha"} a {trip.end_date ?? "sin fecha"} ·{" "}
          {trip.status}
        </p>
        <Link className="text-sm text-emerald-700 hover:underline" href={`/caminante/trips/${tripId}/hub`}>
          Ir al Trip Hub
        </Link>
      </div>

      {added === "1" ? (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Item agregado al viaje.</p>
      ) : null}
      {requestsSubmitted === "1" ? (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          Requests enviados a operadores (SLA mismo dia).
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(error)}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/caminante/trips/${tripId}/checkout`}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Ir a checkout (instant)
        </Link>
        <form action={submitRequestBookingsAction}>
          <input type="hidden" name="trip_id" value={tripId} />
          <button
            type="submit"
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium hover:border-emerald-700"
          >
            Enviar request-to-book
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <form action={addTripItemAction} className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
          <h3 className="font-semibold">Agregar item</h3>
          <input type="hidden" name="trip_id" value={tripId} />
          <label className="space-y-1 text-sm">
            <span>Listing</span>
            <select className="w-full rounded-lg border border-stone-300 px-3 py-2" name="listing_id" required>
              <option value="">Selecciona un listing publicado</option>
              {listings?.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.title} ({listing.type}) - {listing.destination ?? "N/A"}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Modo de booking</span>
            <select className="w-full rounded-lg border border-stone-300 px-3 py-2" name="booking_mode" defaultValue="instant">
              <option value="instant">instant</option>
              <option value="request">request</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Cantidad</span>
            <input className="w-full rounded-lg border border-stone-300 px-3 py-2" name="quantity" type="number" min={1} defaultValue={1} />
          </label>
          <label className="space-y-1 text-sm">
            <span>Precio MXN (placeholder)</span>
            <input
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
              name="price_mxn"
              type="number"
              min={0}
              step="0.01"
              defaultValue={0}
            />
          </label>
          <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800">
            Agregar item
          </button>
        </form>

        <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
          <h3 className="font-semibold">Items del viaje</h3>
          {tripItems && tripItems.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {tripItems.map((item) => (
                <li key={item.id} className="rounded-lg border border-stone-200 p-3">
                  <p>
                    listing: <span className="font-mono text-xs">{item.listing_id}</span>
                  </p>
                  <p>
                    mode: {item.booking_mode} · qty: {item.quantity} · MXN {item.price_mxn}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-600">No hay items aún.</p>
          )}
        </div>
      </div>
    </section>
  );
}
```

### src//app/caminante/trips/new/page.tsx
```tsx
import { createTripAction } from "@/lib/trips/actions";

interface NewTripPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function NewTripPage({ searchParams }: NewTripPageProps) {
  const { error } = await searchParams;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Crear viaje</h2>
      <p className="text-stone-600">Crea un viaje base y luego agrega items (actividades, hospedaje, transporte).</p>
      {error ? (
        <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(error)}</p>
      ) : null}
      <form action={createTripAction} className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 md:grid-cols-2">
        <input
          className="rounded-lg border border-stone-300 px-3 py-2"
          name="title"
          placeholder="Nombre del viaje"
          required
        />
        <input className="rounded-lg border border-stone-300 px-3 py-2" name="destination" placeholder="Destino" />
        <label className="space-y-1 text-sm">
          <span>Fecha inicio</span>
          <input className="w-full rounded-lg border border-stone-300 px-3 py-2" name="start_date" type="date" />
        </label>
        <label className="space-y-1 text-sm">
          <span>Fecha fin</span>
          <input className="w-full rounded-lg border border-stone-300 px-3 py-2" name="end_date" type="date" />
        </label>
        <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800">
          Crear viaje
        </button>
      </form>
    </section>
  );
}
```

### src//app/globals.css
```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: "Avenir Next", "Montserrat", "Trebuchet MS", sans-serif;
}
```

### src//app/layout.tsx
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Caminante Platform",
  description: "Caminante travel platform under numanhub.com/caminante",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

### src//app/page.tsx
```tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/caminante");
}
```

### src//components/payments/embedded-checkout.tsx
```tsx
"use client";

import { useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

interface EmbeddedCheckoutProps {
  tripId: string;
  amountMxn: number;
  payableCount: number;
}

function CheckoutForm({ tripId, amountMxn }: { tripId: string; amountMxn: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/caminante/trips/${tripId}/checkout/success`,
      },
    });

    if (result.error) {
      setErrorMessage(result.error.message ?? "No se pudo procesar el pago.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-sm text-stone-600">Total a pagar ahora: MXN {amountMxn.toFixed(2)}</p>
      <PaymentElement />
      {errorMessage ? <p className="text-sm text-rose-700">{errorMessage}</p> : null}
      <button
        type="submit"
        disabled={!stripe || !elements || isSubmitting}
        className="w-full rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {isSubmitting ? "Procesando..." : "Pagar ahora"}
      </button>
    </form>
  );
}

export function EmbeddedCheckout({
  tripId,
  amountMxn,
  payableCount,
}: EmbeddedCheckoutProps) {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const stripePromise = useMemo(() => {
    if (!publishableKey) {
      return null;
    }

    return loadStripe(publishableKey);
  }, [publishableKey]);

  async function createIntent() {
    setLoading(true);
    setError(null);

    const response = await fetch("/caminante/api/payments/create-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tripId }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "No se pudo crear el intento de pago.");
      setLoading(false);
      return;
    }

    setClientSecret(payload.clientSecret);
    setLoading(false);
  }

  if (!publishableKey) {
    return (
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
        Falta `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` en `.env.local`.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-600">Items instant a cobrar: {payableCount}</p>
      {!clientSecret ? (
        <button
          onClick={createIntent}
          disabled={loading}
          className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {loading ? "Preparando checkout..." : "Continuar a pago seguro"}
        </button>
      ) : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {clientSecret && stripePromise ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm tripId={tripId} amountMxn={amountMxn} />
        </Elements>
      ) : null}
    </div>
  );
}
```

### src//lib/admin/actions.ts
```ts
"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";

function val(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

async function requireAdminOrRedirect() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/caminante?error=not_admin");
  }
}

export async function createProviderAction(formData: FormData) {
  await requireAdminOrRedirect();

  const legalName = val(formData, "legal_name");
  const displayName = val(formData, "display_name");
  const countryCode = val(formData, "country_code") || "MX";

  if (!legalName || !displayName) {
    redirect("/caminante/admin/providers?error=missing_fields");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("providers").insert({
    legal_name: legalName,
    display_name: displayName,
    country_code: countryCode,
    api_mode: "portal",
    approval_state: "approved",
  });

  if (error) {
    redirect(`/caminante/admin/providers?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/caminante/admin/providers?created=1");
}

export async function createListingAction(formData: FormData) {
  await requireAdminOrRedirect();

  const providerId = val(formData, "provider_id");
  const type = val(formData, "type");
  const title = val(formData, "title");
  const description = val(formData, "description");
  const destination = val(formData, "destination");
  const vibe = val(formData, "vibe");
  const difficulty = val(formData, "difficulty");
  const status = val(formData, "status") || "draft";

  if (!providerId || !type || !title) {
    redirect("/caminante/admin/listings?error=missing_fields");
  }

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("listings").insert({
    provider_id: providerId,
    type,
    title,
    description: description || null,
    destination: destination || null,
    vibe: vibe || null,
    difficulty: difficulty || null,
    status,
  });

  if (error) {
    redirect(`/caminante/admin/listings?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/caminante/admin/listings?created=1");
}
```

### src//lib/auth/actions.ts
```ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getOrigin() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

function parseEmail(formData: FormData) {
  const raw = formData.get("email");
  if (typeof raw !== "string") {
    return null;
  }

  const email = raw.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return null;
  }

  return email;
}

export async function sendMagicLink(formData: FormData) {
  const email = parseEmail(formData);
  if (!email) {
    redirect("/caminante/login?error=invalid_email");
  }

  const next = typeof formData.get("next") === "string" ? String(formData.get("next")) : "/caminante";
  const origin = await getOrigin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/caminante/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(`/caminante/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/caminante/login?sent=1&email=${encodeURIComponent(email)}`);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/caminante");
}
```

### src//lib/auth/authorization.ts
```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function isCurrentUserAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return false;
  }

  const { data, error } = await supabase
    .from("admin_whitelist")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}
```

### src//lib/auth/session.ts
```ts
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
});
```

### src//lib/listings/queries.ts
```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ListingSearchFilters {
  q?: string;
  type?: "activity" | "transport" | "accommodation" | "package";
  destination?: string;
  limit?: number;
}

export async function searchPublishedListings(filters: ListingSearchFilters = {}) {
  const supabase = await createSupabaseServerClient();
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);

  let query = supabase
    .from("listings")
    .select("id,title,type,destination,vibe,difficulty,status,updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (filters.q) {
    query = query.or(
      `title.ilike.%${filters.q}%,description.ilike.%${filters.q}%,destination.ilike.%${filters.q}%`,
    );
  }

  if (filters.type) {
    query = query.eq("type", filters.type);
  }

  if (filters.destination) {
    query = query.ilike("destination", `%${filters.destination}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to search listings: ${error.message}`);
  }

  return data ?? [];
}

export async function getListingsByIds(listingIds: string[]) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("listings")
    .select("id,title,type,destination,vibe,difficulty,status")
    .in("id", listingIds)
    .limit(20);

  if (error) {
    throw new Error(`Failed to load listings for compare: ${error.message}`);
  }

  return data ?? [];
}
```

### src//lib/payments/finalize.ts
```ts
import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fromStripeAmount } from "@/lib/payments/stripe";

export interface FinalizeResult {
  tripId: string;
  paymentIntentId: string;
  confirmedBookings: number;
  paymentRecorded: boolean;
}

export async function finalizeSucceededPaymentIntent(
  intent: Stripe.PaymentIntent,
): Promise<FinalizeResult> {
  if (intent.status !== "succeeded") {
    throw new Error(`Payment intent not succeeded: ${intent.status}`);
  }

  const tripId = intent.metadata.trip_id;
  const userId = intent.metadata.user_id;

  if (!tripId || !userId) {
    throw new Error("Missing trip_id or user_id metadata in payment intent");
  }

  const supabase = createSupabaseAdminClient();

  const { data: trip } = await supabase
    .from("trips")
    .select("id,owner_user_id")
    .eq("id", tripId)
    .maybeSingle();

  if (!trip) {
    throw new Error("Trip not found for payment intent");
  }

  if (trip.owner_user_id !== userId) {
    throw new Error("Payment metadata user_id does not match trip owner");
  }

  const paidMxn = fromStripeAmount(intent.amount_received || intent.amount || 0);
  if (paidMxn <= 0) {
    throw new Error("Invalid amount received");
  }

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("provider_ref", intent.id)
    .maybeSingle();

  let paymentRecorded = false;
  if (!existingPayment) {
    const { error: paymentError } = await supabase.from("payments").insert({
      trip_id: tripId,
      payer_user_id: userId,
      amount_mxn: paidMxn,
      status: "paid",
      provider_ref: intent.id,
      paid_at: new Date().toISOString(),
    });

    if (paymentError && !paymentError.message.toLowerCase().includes("duplicate key")) {
      throw new Error(`Failed to record payment: ${paymentError.message}`);
    }

    if (!paymentError) {
      paymentRecorded = true;
    }
  }

  const { data: tripItems, error: tripItemsError } = await supabase
    .from("trip_items")
    .select("id,listing_id")
    .eq("trip_id", tripId)
    .eq("booking_mode", "instant");

  if (tripItemsError) {
    throw new Error(`Failed to load trip items: ${tripItemsError.message}`);
  }

  const itemIds = (tripItems ?? []).map((item) => item.id);
  const listingIds = (tripItems ?? []).map((item) => item.listing_id);

  const { data: existingBookings } = itemIds.length
    ? await supabase
        .from("bookings")
        .select("trip_item_id")
        .in("trip_item_id", itemIds)
    : { data: [] as Array<{ trip_item_id: string }> };

  const existingSet = new Set((existingBookings ?? []).map((row) => row.trip_item_id));

  const { data: listings } = listingIds.length
    ? await supabase
        .from("listings")
        .select("id,provider_id")
        .in("id", listingIds)
    : { data: [] as Array<{ id: string; provider_id: string }> };

  const providerMap = new Map((listings ?? []).map((row) => [row.id, row.provider_id]));

  let confirmedBookings = 0;
  for (const item of tripItems ?? []) {
    if (existingSet.has(item.id)) {
      continue;
    }

    const providerId = providerMap.get(item.listing_id);
    if (!providerId) {
      continue;
    }

    const { error: bookingError } = await supabase.from("bookings").insert({
      trip_item_id: item.id,
      provider_id: providerId,
      status: "confirmed",
      confirmation_deadline_at: null,
    });

    if (bookingError && !bookingError.message.toLowerCase().includes("duplicate key")) {
      throw new Error(`Failed creating booking for item ${item.id}: ${bookingError.message}`);
    }

    if (!bookingError) {
      confirmedBookings += 1;
    }
  }

  return {
    tripId,
    paymentIntentId: intent.id,
    confirmedBookings,
    paymentRecorded,
  };
}
```

### src//lib/payments/queries.ts
```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PayableTripItem {
  id: string;
  trip_id: string;
  listing_id: string;
  quantity: number;
  price_mxn: number;
  booking_mode: "instant" | "request";
}

export async function getOwnedTripById(tripId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { trip: null, user: null };
  }

  const { data: trip } = await supabase
    .from("trips")
    .select("id,title,destination,start_date,end_date,status,owner_user_id")
    .eq("id", tripId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  return { trip, user };
}

export async function getTripItemsForCheckout(tripId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: tripItems, error } = await supabase
    .from("trip_items")
    .select("id,trip_id,listing_id,quantity,price_mxn,booking_mode")
    .eq("trip_id", tripId)
    .in("booking_mode", ["instant", "request"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const tripItemIds = (tripItems ?? []).map((item) => item.id);
  const { data: existingBookings } = tripItemIds.length
    ? await supabase
        .from("bookings")
        .select("trip_item_id,status")
        .in("trip_item_id", tripItemIds)
    : { data: [] as Array<{ trip_item_id: string; status: string }> };

  const bookedMap = new Map((existingBookings ?? []).map((b) => [b.trip_item_id, b.status]));

  const payable = (tripItems ?? []).filter(
    (item) => item.booking_mode === "instant" && !bookedMap.has(item.id),
  ) as PayableTripItem[];

  const requestOnly = (tripItems ?? []).filter(
    (item) => item.booking_mode === "request" && !bookedMap.has(item.id),
  ) as PayableTripItem[];

  const payableTotalMxn = payable.reduce(
    (acc, item) => acc + Number(item.price_mxn) * item.quantity,
    0,
  );

  return { payable, requestOnly, payableTotalMxn };
}
```

### src//lib/payments/stripe.ts
```ts
import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeServerClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function toStripeAmount(amountMxn: number) {
  return Math.round(amountMxn * 100);
}

export function fromStripeAmount(amountCents: number) {
  return amountCents / 100;
}
```

### src//lib/supabase/admin.ts
```ts
import { createClient } from "@supabase/supabase-js";
import { getServerSupabaseEnv } from "@/lib/supabase/env";

export function createSupabaseAdminClient() {
  const env = getServerSupabaseEnv();

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
```

### src//lib/supabase/browser.ts
```ts
import { createBrowserClient } from "@supabase/ssr";
import { getClientSupabaseEnv } from "@/lib/supabase/env";

export function createSupabaseBrowserClient() {
  const env = getClientSupabaseEnv();

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
```

### src//lib/supabase/env.ts
```ts
import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

export function getClientSupabaseEnv() {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function getClientSupabaseEnvOrNull() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return null;
  }

  return getClientSupabaseEnv();
}

export function getServerSupabaseEnv() {
  return serverEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
```

### src//lib/supabase/middleware.ts
```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getClientSupabaseEnvOrNull } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const env = getClientSupabaseEnvOrNull();
  if (!env) {
    return response;
  }

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookieValues) {
          cookieValues.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}
```

### src//lib/supabase/server.ts
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getClientSupabaseEnv } from "@/lib/supabase/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = getClientSupabaseEnv();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookieValues) {
          cookieValues.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}
```

### src//lib/trips/actions.ts
```ts
"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function requireString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function toNullableDate(raw: string) {
  if (!raw) {
    return null;
  }
  return raw;
}

export async function createTripAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/caminante/login?next=/caminante/trips/new");
  }

  const title = requireString(formData, "title");
  const destination = requireString(formData, "destination");
  const startDate = toNullableDate(requireString(formData, "start_date"));
  const endDate = toNullableDate(requireString(formData, "end_date"));

  if (!title) {
    redirect("/caminante/trips/new?error=title_required");
  }

  const { data, error } = await supabase
    .from("trips")
    .insert({
      owner_user_id: user.id,
      title,
      destination: destination || null,
      start_date: startDate,
      end_date: endDate,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    redirect(`/caminante/trips/new?error=${encodeURIComponent(error?.message ?? "create_failed")}`);
  }

  redirect(`/caminante/trips/${data.id}`);
}

export async function addTripItemAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tripId = requireString(formData, "trip_id");
  const listingId = requireString(formData, "listing_id");
  const bookingMode = requireString(formData, "booking_mode") || "instant";
  const quantityRaw = Number(requireString(formData, "quantity") || "1");
  const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? Math.floor(quantityRaw) : 1;
  const priceRaw = Number(requireString(formData, "price_mxn") || "0");
  const price = Number.isFinite(priceRaw) && priceRaw >= 0 ? priceRaw : 0;

  if (!user) {
    redirect(`/caminante/login?next=/caminante/trips/${tripId}`);
  }

  if (!tripId || !listingId) {
    redirect(`/caminante/trips/${tripId}?error=missing_fields`);
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id,status")
    .eq("id", listingId)
    .eq("status", "published")
    .maybeSingle();

  if (!listing) {
    redirect(`/caminante/trips/${tripId}?error=listing_not_available`);
  }

  const { error } = await supabase.from("trip_items").insert({
    trip_id: tripId,
    listing_id: listingId,
    booking_mode: bookingMode,
    quantity,
    price_mxn: price,
    status: "draft",
  });

  if (error) {
    redirect(`/caminante/trips/${tripId}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/caminante/trips/${tripId}?added=1`);
}

export async function submitRequestBookingsAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tripId = requireString(formData, "trip_id");

  if (!user) {
    redirect(`/caminante/login?next=/caminante/trips/${tripId}`);
  }

  const { data: trip } = await supabase
    .from("trips")
    .select("id,owner_user_id")
    .eq("id", tripId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!trip) {
    redirect("/caminante?error=trip_not_found");
  }

  const { data: requestItems } = await supabase
    .from("trip_items")
    .select("id,listing_id,booking_mode")
    .eq("trip_id", tripId)
    .eq("booking_mode", "request");

  if (!requestItems || requestItems.length === 0) {
    redirect(`/caminante/trips/${tripId}?error=no_request_items`);
  }

  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("trip_item_id")
    .in(
      "trip_item_id",
      requestItems.map((item) => item.id),
    );
  const existingSet = new Set((existingBookings ?? []).map((b) => b.trip_item_id));

  const listingIds = requestItems.map((item) => item.listing_id);
  const { data: listingProviders } = await supabase
    .from("listings")
    .select("id,provider_id")
    .in("id", listingIds);
  const providerMap = new Map((listingProviders ?? []).map((l) => [l.id, l.provider_id]));

  const deadline = new Date();
  deadline.setHours(23, 59, 59, 999);

  for (const item of requestItems) {
    if (existingSet.has(item.id)) {
      continue;
    }

    const providerId = providerMap.get(item.listing_id);
    if (!providerId) {
      continue;
    }

    const { error } = await supabase.from("bookings").insert({
      trip_item_id: item.id,
      provider_id: providerId,
      status: "pending_request",
      confirmation_deadline_at: deadline.toISOString(),
    });

    if (error && !error.message.toLowerCase().includes("duplicate key")) {
      redirect(`/caminante/trips/${tripId}?error=${encodeURIComponent(error.message)}`);
    }
  }

  redirect(`/caminante/trips/${tripId}?requests_submitted=1`);
}
```

## 4) Configuration files

### next.config.ts
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
```

### postcss.config.mjs
```mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### middleware.ts
```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### .env.example
```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## 5) Database/schema files

### supabase/migrations/0001_init.sql
```sql
-- Caminante initial schema (Sprint 1 foundation)
-- Run in Supabase SQL editor after project creation.

create extension if not exists "uuid-ossp";

create type public.app_role as enum (
  'traveler',
  'participant',
  'operator',
  'admin',
  'agent'
);

create type public.listing_type as enum (
  'activity',
  'transport',
  'accommodation',
  'package'
);

create type public.booking_mode as enum (
  'instant',
  'request'
);

create type public.booking_status as enum (
  'pending_request',
  'confirmed',
  'rejected',
  'cancelled',
  'completed'
);

create type public.provider_api_mode as enum (
  'portal',
  'api'
);

create type public.provider_approval_state as enum (
  'applied',
  'approved',
  'rejected'
);

create type public.payment_status as enum (
  'pending',
  'paid',
  'failed',
  'refunded',
  'partially_refunded'
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  locale text default 'es-MX',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  display_name text not null,
  country_code text not null default 'MX',
  api_mode public.provider_api_mode not null default 'portal',
  approval_state public.provider_approval_state not null default 'applied',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_commercial_profiles (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  take_rate_pct numeric(5,2) not null,
  risk_mode_default text not null,
  risk_uplift_pct numeric(5,2) not null default 0,
  holdback_pct numeric(5,2),
  holdback_release_rule text,
  pricing_mode text not null,
  effective_from timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  type public.listing_type not null,
  title text not null,
  description text,
  destination text,
  vibe text,
  difficulty text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_availability_slots (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity_total integer not null,
  capacity_available integer not null,
  source_mode public.provider_api_mode not null default 'portal',
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id),
  title text not null,
  destination text,
  start_date date,
  end_date date,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  listing_id uuid not null references public.listings(id),
  booking_mode public.booking_mode not null,
  starts_at timestamptz,
  ends_at timestamptz,
  quantity integer not null default 1,
  price_mxn numeric(12,2) not null,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  trip_item_id uuid not null references public.trip_items(id) on delete cascade,
  provider_id uuid not null references public.providers(id),
  status public.booking_status not null,
  confirmation_deadline_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  join_status text not null default 'invited',
  permission_level text not null default 'baseline',
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  payer_user_id uuid references auth.users(id),
  amount_mxn numeric(12,2) not null,
  status public.payment_status not null default 'pending',
  provider_ref text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS baseline
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.providers enable row level security;
alter table public.listings enable row level security;
alter table public.trips enable row level security;
alter table public.trip_items enable row level security;
alter table public.bookings enable row level security;
alter table public.participants enable row level security;
alter table public.payments enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated
using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "trips_select_member" on public.trips
for select to authenticated
using (
  owner_user_id = auth.uid()
  or exists (
    select 1 from public.participants p
    where p.trip_id = trips.id and p.user_id = auth.uid()
  )
);

create policy "trips_insert_owner" on public.trips
for insert to authenticated
with check (owner_user_id = auth.uid());
```

### supabase/migrations/0002_admin_whitelist.sql
```sql
-- Admin whitelist for manual admin bootstrap (2A)

create table if not exists public.admin_whitelist (
  email text primary key,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

alter table public.admin_whitelist enable row level security;

-- Authenticated users can only see their own whitelist row.
create policy "admin_whitelist_select_self" on public.admin_whitelist
for select to authenticated
using (lower(email) = lower((auth.jwt() ->> 'email')));

-- Service role should handle inserts/updates in production ops.

-- Example bootstrap:
-- insert into public.admin_whitelist (email, note)
-- values ('you@company.com', 'initial admin');
```

### supabase/migrations/0003_listings_public_read.sql
```sql
-- Public browsing: published listings are readable for anonymous and authenticated users.

create policy "listings_public_read_published" on public.listings
for select to anon, authenticated
using (status = 'published');
```

### supabase/migrations/0004_hybrid_rls_travel_writes.sql
```sql
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
```

### supabase/migrations/0005_booking_payment_constraints.sql
```sql
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
```

## 6) Public assets (`find public/ -type f`)
```text
public//file.svg
public//globe.svg
public//next.svg
public//vercel.svg
public//window.svg
```

## 8) `process.env.*` references
```text
src/app/caminante/api/payments/webhook/route.ts:10:  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
src/components/payments/embedded-checkout.tsx:66:  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
src/lib/auth/actions.ts:8:  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
src/lib/payments/stripe.ts:6:  const secretKey = process.env.STRIPE_SECRET_KEY;
src/lib/supabase/env.ts:14:    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
src/lib/supabase/env.ts:16:      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
src/lib/supabase/env.ts:22:    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
src/lib/supabase/env.ts:23:    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
src/lib/supabase/env.ts:33:    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
src/lib/supabase/env.ts:35:      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
src/lib/supabase/env.ts:36:    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
```

## 7) Current state summary

This codebase is a Next.js 16 App Router project for Caminante under `/caminante` routes. Core scaffolding is implemented for public pages, admin pages, API routes, auth pages, trip pages, and checkout pages. The app is wired for Supabase (auth + data), Stripe embedded checkout, and webhook-based payment finalization.

Working areas in code:
- Route structure under `/caminante`, `/caminante/admin`, `/caminante/api`.
- Magic-link auth flow with Supabase (`/caminante/login`, `/caminante/signup`, `/caminante/auth/confirm`).
- Admin whitelist gate for admin routes.
- Inventory APIs and pages (`/caminante/search`, compare pages, listing detail).
- Trip creation and trip item add flow.
- Embedded Stripe checkout for instant-book items and request-to-book submission action.
- Stripe webhook endpoint (`/caminante/api/payments/webhook`) plus shared finalization logic.

Partially built / scaffolding:
- Compare dimensions for price/availability are still placeholder `TODO` in compare API/page rendering.
- No full operator request queue UX yet (only submit request action and pending status creation).
- Trip Hub is present but mostly scaffolded UI text.
- No WhatsApp automation, Google Calendar sync, or `.ics` generation implemented yet.
- No split-pay implementation yet (single payer flow only).

Known issues / deployment gotchas encountered:
- If Supabase env vars are missing/invalid in Vercel, server-side render crashes.
- If Supabase schema migrations are not applied, inventory and other DB-backed pages crash.
- SQL editor confusion: running migration filenames directly fails; actual SQL contents must be pasted.

Next planned steps (based on latest conversation intent):
1. Stabilize staging by applying full migrations and validating inventory/search/admin flows.
2. Finish request-to-book operator confirmation workflow and post-confirm payment trigger.
3. Implement Trip Hub success automation pieces (calendar, WhatsApp link generation scaffolding).
4. Implement split payments and participant allocations.
5. Domain routing plan for `numanhub.com/caminante` with staging first and production cutover.

## 8b) Environment variables and purpose mapping

- `NEXT_PUBLIC_SUPABASE_URL`: Public Supabase project URL used by browser/server Supabase clients.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Public Supabase key for client/server SSR auth sessions.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-only elevated Supabase key for admin/service operations (provider/listing writes, webhook-safe finalization path using admin client).
- `NEXT_PUBLIC_SITE_URL`: Canonical base URL used to build auth magic-link redirect URLs.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Public Stripe key used by Stripe.js/Elements in embedded checkout.
- `STRIPE_SECRET_KEY`: Server Stripe key used to create/retrieve PaymentIntents and verify payment status.
- `STRIPE_WEBHOOK_SECRET`: Signing secret used to verify Stripe webhook signatures.
