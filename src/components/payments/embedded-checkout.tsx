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
