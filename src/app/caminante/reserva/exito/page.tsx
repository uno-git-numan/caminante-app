import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ReservaExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;
  const safeSlug = slug && /^[a-z0-9-]+$/.test(slug) ? slug : null;

  return (
    <section className="mx-auto w-full max-w-xl px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest/15">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 13l4 4L19 7" stroke="#5A7A4E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-lagoon">¡Tu lugar está apartado!</h1>
      <p className="mt-3 text-sm text-olive">
        Recibimos tu pago. Te enviamos el comprobante a tu correo. Falta un paso para dejar todo
        listo: firmar tu deslinde y compartir tu perfil de seguridad antes del viaje.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3">
        {safeSlug ? (
          <Link
            href={`/caminante/registro/${safeSlug}`}
            className="w-full rounded-xl bg-lagoon px-4 py-3 text-sm font-semibold text-cream transition hover:bg-dune sm:w-auto sm:px-8"
          >
            Firmar mi deslinde
          </Link>
        ) : null}
        <Link href="/caminante" className="text-sm font-semibold text-forest underline">
          Volver a Caminante
        </Link>
      </div>
    </section>
  );
}
