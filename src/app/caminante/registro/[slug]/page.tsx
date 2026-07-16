import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import {
  fetchRegistrationContext,
  fetchPrefillForUser,
  fetchReservationLock,
} from "@/lib/registration/queries";
import RegistrationForm from "./RegistrationForm";

export const dynamic = "force-dynamic";

export default async function RegistroPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reserva?: string }>;
}) {
  const { slug } = await params;
  const { reserva } = await searchParams;
  // Reserva YA pagada (self-serve) sobre la que se firma este deslinde. Validamos
  // formato UUID; la existencia/propiedad la revalida el server action.
  const reservationId =
    reserva && /^[0-9a-fA-F-]{36}$/.test(reserva) ? reserva : undefined;

  // Perfiles separados: el flujo de compra/reserva es para viajeros (caminantes).
  // Un admin no "compra" → lo mandamos a su panel. (Para probar el registro, usa una
  // cuenta de viajero distinta.) Reversible: quita este guard si quieres que el admin
  // pueda reservar también.
  if (await isCurrentUserAdmin()) {
    redirect("/caminante/admin?notice=admin_no_registro");
  }
  const ctx = await fetchRegistrationContext(slug);
  if (!ctx) notFound();

  const { experience, slots } = ctx;
  const title = `${experience.title} ${experience.titleAccent}`.trim();
  const datesBadge = experience.datesBadge?.big
    ? `${experience.datesBadge.big} ${experience.datesBadge?.rest || ""}`.trim()
    : experience.cardPloc || "";

  // Si el deslinde viene de una reserva ya hecha, la fecha YA se eligió al reservar:
  // la fijamos y no la volvemos a preguntar.
  const lockedSlot = reservationId
    ? await fetchReservationLock(reservationId, ctx.experienceId)
    : null;

  // Estado (d): hay salidas en BD pero ninguna con lugares. Una salida sin tope
  // (seatsAvailable === null) JAMÁS está llena. Si ya reservó una salida (lockedSlot),
  // no lo bloqueamos aunque el cupo público esté lleno — su lugar ya está apartado.
  const allFull =
    !lockedSlot &&
    slots.length > 0 &&
    slots.every((s) => s.seatsAvailable !== null && s.seatsAvailable <= 0);
  if (allFull) {
    return (
      <div className="mx-auto flex w-full max-w-[560px] flex-col items-center px-4 py-16 text-center sm:px-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-sand bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-olive">
          Registro cerrado
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-lagoon sm:text-4xl">
          Esta salida está completa
        </h1>
        <p className="mt-3 text-sm text-olive">
          {title} ya no tiene lugares disponibles. Escríbenos y te avisamos de la próxima
          ventana.
        </p>
        <a
          href={`https://wa.me/${experience.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-lagoon px-6 py-3.5 text-sm font-semibold text-cream transition hover:bg-lagoon-light"
        >
          Avísame de la próxima
        </a>
      </div>
    );
  }

  const user = await getCurrentUser();
  const prefill = user ? await fetchPrefillForUser(user.id) : null;

  return (
    <RegistrationForm
      slug={slug}
      title={title}
      datesBadge={datesBadge}
      slots={slots}
      waiverClauses={(experience.registration?.waiverClauses || []).filter(Boolean)}
      waiverDocUrl={experience.registration?.waiverDocUrl?.trim() || `/caminante/deslinde/${slug}`}
      hasSession={!!user}
      sessionEmail={user?.email || ""}
      prefill={prefill}
      reservationId={reservationId}
      lockedSlot={lockedSlot}
    />
  );
}
