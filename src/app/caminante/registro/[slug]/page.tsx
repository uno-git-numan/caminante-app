import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { fetchRegistrationContext, fetchPrefillForUser } from "@/lib/registration/queries";
import RegistrationForm from "./RegistrationForm";

export const dynamic = "force-dynamic";

export default async function RegistroPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await fetchRegistrationContext(slug);
  if (!ctx) notFound();

  const { experience, slots } = ctx;
  const title = `${experience.title} ${experience.titleAccent}`.trim();
  const datesBadge = experience.datesBadge?.big
    ? `${experience.datesBadge.big} ${experience.datesBadge.rest || ""}`.trim()
    : experience.cardPloc || "";

  // Estado (d): hay salidas en BD pero ninguna con lugares. Una salida sin tope
  // (seatsAvailable === null) JAMÁS está llena.
  const allFull =
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
      waiverDocUrl={experience.registration?.waiverDocUrl || ""}
      hasSession={!!user}
      sessionEmail={user?.email || ""}
      prefill={prefill}
    />
  );
}
