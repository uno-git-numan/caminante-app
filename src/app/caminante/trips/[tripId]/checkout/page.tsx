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
