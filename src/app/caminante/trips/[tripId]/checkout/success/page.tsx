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
