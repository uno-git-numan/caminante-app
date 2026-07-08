"use client";

import { useState } from "react";
import { createCheckout } from "@/lib/payments/checkout";

export type ReservarSlot = {
  id: string;
  label: string;
  perPerson: number;
  available: number | null; // null = sin tope
  soldOut: boolean;
};

export type PriceTier = { label: string; amount: string };

const mxn = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

// Parseo del monto del nivel (mismo criterio que parseMxnAmount del server).
const parseTier = (a: string): number => {
  const n = Number(String(a).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export default function CheckoutForm({
  slug,
  slots,
  tiers = [],
  grupoToken,
}: {
  slug: string;
  slots: ReservarSlot[];
  tiers?: PriceTier[];
  // Token de grupo privado: viaja como hidden y el server lo valida contra la
  // BD (una salida privada NUNCA se paga sin su token).
  grupoToken?: string | null;
}) {
  const firstOpen = slots.find((s) => !s.soldOut) ?? slots[0];
  const [slotId, setSlotId] = useState(firstOpen?.id ?? "");
  const [people, setPeople] = useState(1);
  const [tierIndex, setTierIndex] = useState(tiers.length ? 0 : -1);

  const slot = slots.find((s) => s.id === slotId) ?? firstOpen;
  const maxPeople = slot?.available != null ? Math.max(1, Math.min(slot.available, 12)) : 12;
  const ppl = Math.min(people, maxPeople);
  // Con niveles, el precio por persona lo fija el nivel elegido; sin niveles, el del slot.
  const perPerson = tiers.length && tierIndex >= 0 ? parseTier(tiers[tierIndex].amount) : (slot?.perPerson ?? 0);
  const total = perPerson * ppl;

  return (
    <form action={createCheckout} className="space-y-6">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="slotId" value={slotId} />
      <input type="hidden" name="numPeople" value={ppl} />
      {tiers.length ? <input type="hidden" name="tierIndex" value={tierIndex} /> : null}
      {grupoToken ? <input type="hidden" name="grupo" value={grupoToken} /> : null}

      {tiers.length ? (
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wider text-olive">Tipo</legend>
          {tiers.map((t, i) => {
            const selected = i === tierIndex;
            return (
              <button
                type="button"
                key={i}
                onClick={() => setTierIndex(i)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                  selected ? "border-dune bg-dune/5" : "border-sand bg-white hover:border-dune"
                }`}
              >
                <span className="text-sm font-semibold text-lagoon">{t.label}</span>
                <span className="text-xs font-medium text-olive">{mxn(parseTier(t.amount))} por persona</span>
              </button>
            );
          })}
        </fieldset>
      ) : null}

      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-olive">Elige tu salida</legend>
        {slots.map((s) => {
          const selected = s.id === slotId;
          return (
            <button
              type="button"
              key={s.id}
              disabled={s.soldOut}
              onClick={() => !s.soldOut && setSlotId(s.id)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                selected ? "border-dune bg-dune/5" : "border-sand bg-white hover:border-dune"
              } ${s.soldOut ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <span>
                <span className="block text-sm font-semibold text-lagoon">{s.label}</span>
                {tiers.length ? null : (
                  <span className="block text-xs text-olive">{mxn(s.perPerson)} por persona</span>
                )}
              </span>
              <span className="text-xs font-medium text-olive">
                {s.soldOut
                  ? "Agotado"
                  : s.available != null
                    ? `Quedan ${s.available}`
                    : "Lugares disponibles"}
              </span>
            </button>
          );
        })}
      </fieldset>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-olive">Personas</label>
        <div className="mt-2 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPeople((p) => Math.max(1, p - 1))}
            className="h-10 w-10 rounded-lg border border-sand text-lg text-lagoon transition hover:border-dune"
            aria-label="Menos personas"
          >
            −
          </button>
          <span className="min-w-8 text-center text-lg font-semibold text-lagoon">{ppl}</span>
          <button
            type="button"
            onClick={() => setPeople((p) => Math.min(maxPeople, p + 1))}
            className="h-10 w-10 rounded-lg border border-sand text-lg text-lagoon transition hover:border-dune"
            aria-label="Más personas"
          >
            +
          </button>
          {slot?.available != null ? (
            <span className="text-xs text-olive">Máx. {maxPeople} en esta salida</span>
          ) : null}
        </div>
      </div>

      <div className="flex items-baseline justify-between border-t border-sand pt-4">
        <span className="text-sm text-olive">Total</span>
        <span className="text-2xl font-semibold text-lagoon">{mxn(total)}</span>
      </div>

      <button
        type="submit"
        disabled={!slot || slot.soldOut}
        className="w-full rounded-xl bg-dune px-4 py-3 text-sm font-semibold text-white transition hover:bg-clay disabled:opacity-50"
      >
        Reservar y pagar {mxn(total)}
      </button>
      <p className="text-center text-[11px] text-olive/70">
        Pago seguro con Stripe. Apartas tu lugar al pagar; luego firmas tu deslinde.
      </p>
    </form>
  );
}
