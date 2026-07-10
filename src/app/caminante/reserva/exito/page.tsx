import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeServerClient } from "@/lib/payments/stripe";
import { facturacionActiva } from "@/lib/facturacion/facturapi";
import { firmarPago } from "@/lib/facturacion/token";
import type { Experience } from "@/lib/experiences/types";

export const dynamic = "force-dynamic";

export default async function ReservaExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; session_id?: string }>;
}) {
  const { slug, session_id: sessionId } = await searchParams;
  const safeSlug = slug && /^[a-z0-9-]+$/.test(slug) ? slug : null;

  // Solo ofrecemos "firmar deslinde" si la experiencia tiene el registro activo
  // (si no, /registro/[slug] daría 404). Las demás cierran por contacto.
  let deslindeActivo = false;
  if (safeSlug) {
    try {
      const sb = createSupabaseAdminClient();
      const { data } = await sb.from("experiences").select("data").eq("slug", safeSlug).maybeSingle();
      const exp = data?.data as Experience | undefined;
      deslindeActivo = !!exp?.registration?.active;
    } catch {
      // si falla la lectura, no ofrecemos el deslinde (evita el 404)
    }
  }

  // Resolver la reserva pagada desde la sesión de Stripe (payment_intent →
  // payments.provider_ref) para atar el deslinde a ESA reserva. Best-effort: si el
  // webhook aún no procesa o falla, caemos al link simple (el deslinde igual funciona
  // reusando la reserva por correo). Nunca rompe la pantalla de éxito.
  // Resolver el pago desde la sesión de Stripe: reservation_id (para el deslinde)
  // y payment.id (para el link de autofactura). Best-effort — nunca rompe la
  // pantalla de éxito.
  let reservaId: string | null = null;
  let paymentId: string | null = null;
  if (sessionId && /^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    try {
      const stripe = getStripeServerClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const pi =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);
      if (pi) {
        const sb = createSupabaseAdminClient();
        // El webhook puede tardar un instante en crear el pago; reintentamos un par
        // de veces para resolver la reserva/pago.
        for (let i = 0; i < 3 && !paymentId; i++) {
          if (i > 0) await new Promise((r) => setTimeout(r, 1200));
          const { data: pay } = await sb
            .from("payments")
            .select("id, reservation_id")
            .eq("provider_ref", pi)
            .maybeSingle();
          reservaId = (pay?.reservation_id as string | null) ?? reservaId;
          paymentId = (pay?.id as string | null) ?? null;
        }
      }
    } catch {
      // sin pago resuelto → links simples
    }
  }
  const facturaHref =
    facturacionActiva() && paymentId
      ? `/caminante/facturacion?p=${paymentId}&t=${firmarPago(paymentId)}`
      : facturacionActiva()
        ? "/caminante/facturacion"
        : null;
  const deslindeHref =
    safeSlug && reservaId
      ? `/caminante/registro/${safeSlug}?reserva=${reservaId}`
      : safeSlug
        ? `/caminante/registro/${safeSlug}`
        : "/caminante";

  return (
    <section className="mx-auto w-full max-w-xl px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest/15">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 13l4 4L19 7" stroke="#5A7A4E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-lagoon">¡Tu lugar está apartado!</h1>
      <p className="mt-3 text-sm text-olive">
        {deslindeActivo
          ? "Recibimos tu pago y te enviamos la confirmación con los detalles a tu correo. Falta un paso para dejar todo listo: firmar tu deslinde y compartir tu perfil de seguridad antes del viaje."
          : "Recibimos tu pago y te enviamos la confirmación con los detalles a tu correo. Te contactamos con los últimos detalles antes de la experiencia."}
      </p>

      <div className="mt-8 flex flex-col items-center gap-3">
        {deslindeActivo && safeSlug ? (
          <Link
            href={deslindeHref}
            className="w-full rounded-xl bg-lagoon px-4 py-3 text-sm font-semibold text-cream transition hover:bg-dune sm:w-auto sm:px-8"
          >
            Firmar mi deslinde
          </Link>
        ) : null}
        {facturaHref ? (
          <Link
            href={facturaHref}
            className="w-full rounded-xl border border-sand px-4 py-3 text-sm font-semibold text-lagoon transition hover:border-dune sm:w-auto sm:px-8"
          >
            ¿Necesitas factura? Solicítala aquí
          </Link>
        ) : null}
        <Link href="/caminante" className="text-sm font-semibold text-forest underline">
          Volver a Caminante
        </Link>
      </div>
    </section>
  );
}
