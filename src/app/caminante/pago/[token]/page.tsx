import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPagoPorToken } from "@/lib/payments/pago-loader";
import { iniciarPagoDeReserva } from "@/lib/payments/pagina-pago";
import { cleanPagoToken } from "@/lib/payments/pago-token";
import { fetchThemeForReservation } from "@/lib/operators/branding";
import PubStyles from "../../ui/pub/PubStyles";
import PubShell from "../../ui/pub/PubShell";
import WhiteLabelStyles, { wlApp, wlDoc } from "../../ui/wl/WhiteLabelStyles";
import PagoMovil from "./PagoMovil";

// LA PÁGINA DE PAGO — /caminante/pago/<token>. Es a donde llega un link de
// cobro (precio especial desde Salidas, o cobro por WhatsApp). Antes el link
// era Stripe a secas y la persona se perdía al volver; aquí ve qué paga, toca
// «Pagar», va a Stripe, y regresa a la pantalla de éxito con su deslinde.
//
// Se renderizan los DOS marcados y el CSS decide (design/publico-movil/PATRON.md).

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Tu pago · Caminante", robots: { index: false, follow: false } };

const mxn = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

export default async function PagoPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token: raw } = await params;
  const { error } = await searchParams;
  const token = cleanPagoToken(raw);
  if (!token) notFound();
  const p = await fetchPagoPorToken(token);
  if (!p) notFound();

  const tema = await fetchThemeForReservation(p.reservationId);
  const deslindeHref = p.deslindeActivo ? `/caminante/registro/${p.slug}?reserva=${p.reservationId}` : null;
  const wa = p.contacto.whatsapp ? `https://wa.me/${p.contacto.whatsapp.replace(/\D/g, "")}` : null;
  const lugares = `${p.personas} ${p.personas === 1 ? "lugar" : "lugares"}`;

  return (
    <>
      <PubStyles />
      <WhiteLabelStyles theme={tema} />
      <section className={`pub-no${wlApp(tema)} mx-auto w-full max-w-xl px-6 py-16`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">Tu pago</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-lagoon">{p.experiencia}</h1>
        {p.salida || p.fechaLarga ? (
          <p className="mt-2 text-sm text-olive">{[p.salida, p.fechaLarga].filter(Boolean).join(" · ")}</p>
        ) : null}

        {p.estado === "pendiente" ? (
          <>
            <p className="mt-6 text-sm text-olive">
              {p.pila ? `Hola, ${p.pila}. ` : ""}Este es tu link de pago. Al pagar apartas {p.personas === 1 ? "tu lugar" : `tus ${lugares}`}; después firmas tu deslinde y quedas listo para salir.
            </p>
            <div className="mt-6 rounded-2xl border border-sand bg-white p-5">
              <div className="flex items-baseline justify-between text-sm text-olive">
                <span>{lugares}</span>
                {p.listaMxn ? <span className="line-through">{mxn(p.listaMxn)}</span> : null}
              </div>
              {p.listaMxn ? (
                <div className="mt-1 flex items-baseline justify-between text-sm text-olive">
                  <span>Tu precio</span>
                  <span>−{mxn(p.listaMxn - p.montoMxn)}</span>
                </div>
              ) : null}
              <div className="mt-3 flex items-baseline justify-between border-t border-sand pt-3">
                <span className="text-sm text-olive">Total</span>
                <span className="text-2xl font-semibold text-lagoon">{mxn(p.montoMxn)}</span>
              </div>
            </div>
            {error ? <p className="mt-4 text-sm font-semibold text-dune">{error}</p> : null}
            <form action={iniciarPagoDeReserva} className="mt-6">
              <input type="hidden" name="token" value={p.token} />
              <button type="submit" className="w-full rounded-xl bg-dune px-4 py-3 text-sm font-semibold text-white transition hover:bg-clay">
                Pagar {mxn(p.montoMxn)}
              </button>
            </form>
            <p className="mt-3 text-center text-[11px] text-olive/70">Pago seguro con tarjeta vía Stripe. Al terminar vuelves aquí para firmar tu deslinde.</p>
          </>
        ) : p.estado === "pagada" ? (
          <>
            <p className="mt-6 text-sm text-olive">Este pago ya está hecho{p.pila ? `, ${p.pila}` : ""}. Tu lugar está apartado.</p>
            {deslindeHref ? (
              <Link href={deslindeHref} className="mt-6 inline-block w-full rounded-xl bg-lagoon px-4 py-3 text-center text-sm font-semibold text-cream transition hover:bg-dune">
                Firmar mi deslinde
              </Link>
            ) : null}
          </>
        ) : (
          <>
            <p className="mt-6 text-sm text-olive">
              {p.estado === "cerrada" ? "Esta salida ya cerró ventas." : "Este link ya no está activo."} Escríbenos y lo resolvemos.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {wa ? (
                <a href={wa} target="_blank" rel="noopener" className="w-full rounded-xl bg-lagoon px-4 py-3 text-center text-sm font-semibold text-cream">
                  Escribir por WhatsApp
                </a>
              ) : null}
              {p.contacto.email ? (
                <a href={`mailto:${p.contacto.email}`} className="w-full rounded-xl border border-sand px-4 py-3 text-center text-sm font-semibold text-lagoon">
                  {p.contacto.email}
                </a>
              ) : null}
            </div>
          </>
        )}
        <p className="mt-8 text-center">
          <Link href="/caminante" className="text-sm font-semibold text-forest underline">
            Volver a Caminante
          </Link>
        </p>
      </section>

      <PubShell scope={wlDoc(tema)}>
        <PagoMovil p={p} error={error ?? null} deslindeHref={deslindeHref} wa={wa} />
      </PubShell>
    </>
  );
}
