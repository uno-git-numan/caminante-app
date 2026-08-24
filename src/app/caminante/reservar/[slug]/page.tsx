import { notFound, redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cleanGrupoToken, fetchSlotAvailability } from "@/lib/experiences/availability";
import { deslindeListo } from "@/lib/experiences/flujo-venta";
import { parseMxnAmount } from "@/lib/payments/reservation-links";
import { fetchThemeForExperience } from "@/lib/operators/branding";
import type { Experience } from "@/lib/experiences/types";
import PubStyles from "../../ui/pub/PubStyles";
import PubShell from "../../ui/pub/PubShell";
import WhiteLabelStyles, { wlApp, wlDoc } from "../../ui/wl/WhiteLabelStyles";
import CheckoutForm, { type ReservarSlot } from "./CheckoutForm";
import ReservarMovil from "./ReservarMovil";

export const dynamic = "force-dynamic";

const errorMsgs: Record<string, string> = {
  datos: "Faltan datos para reservar. Inténtalo de nuevo.",
  salida: "Esa salida ya no está disponible.",
  precio: "Esta experiencia no tiene precio configurado todavía.",
  nivel: "Elige un tipo (habitación) antes de pagar.",
  cancelado: "Cancelaste el pago. Cuando quieras, aquí seguimos.",
  stripe: "No pudimos abrir el pago. Inténtalo de nuevo en un momento.",
  deslinde: "Estamos terminando de preparar esta experiencia. Escríbenos y te avisamos en cuanto abra.",
};

export default async function ReservarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; grupo?: string }>;
}) {
  const { slug } = await params;
  const { error, grupo } = await searchParams;
  const grupoToken = cleanGrupoToken(grupo);

  // El admin no compra (perfiles separados). Va a su panel.
  if (await isCurrentUserAdmin()) {
    redirect("/caminante/admin?notice=admin_no_registro");
  }

  const sb = createSupabaseAdminClient();
  const { data: expRow } = await sb
    .from("experiences")
    .select("id, data, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!expRow || expRow.status !== "published") notFound();

  const experience = (expRow.data as Experience | undefined) ?? undefined;
  const experienceId = expRow.id as string;
  const title =
    [experience?.title, experience?.titleAccent].filter(Boolean).join(" ").trim() ||
    experience?.docTitle ||
    "Experiencia Caminante";

  // Visibilidad: sin token → solo salidas públicas. Con link de grupo válido
  // → SOLO la salida privada de ese token (el link es para ESA fecha).
  let slotsQuery = sb
    .from("experience_slots")
    .select("id, label, price_mxn, starts_at, capacity_total, visibility, access_token")
    .eq("experience_id", experienceId)
    .eq("status", "open")
    .order("starts_at", { ascending: true });
  slotsQuery = grupoToken
    ? slotsQuery.eq("access_token", grupoToken)
    : slotsQuery.eq("visibility", "public");
  const { data: slotRows } = await slotsQuery;

  const avail = await fetchSlotAvailability(experienceId);
  const basePrice = parseMxnAmount(experience?.price?.amount);

  // ⚠️ Fuera las salidas que YA SALIERON. La consulta filtra por status='open',
  // que es un estado comercial (¿se vende?), NO temporal: una salida pasada que
  // nadie cerró a mano seguía apareciendo en el selector — el 26 jul de hongos
  // se mostraba como "Agotado" días después del viaje (audit del 8 ago 2026).
  // No se puede reservar un viaje que ya se fue.
  const ahora = Date.now();
  const vigentes = (slotRows ?? []).filter((s) => {
    const inicio = s.starts_at ? Date.parse(s.starts_at as string) : NaN;
    return Number.isNaN(inicio) || inicio >= ahora;
  });

  const slots: ReservarSlot[] = vigentes
    .map((s) => {
      const a = avail.get(s.id as string);
      const available = a ? a.available : null; // null = sin tope
      const perPerson =
        s.price_mxn != null ? Number(s.price_mxn) : basePrice;
      return {
        id: s.id as string,
        label: (s.label as string | null) || "Salida",
        perPerson: perPerson ?? 0,
        available,
        soldOut: available !== null && available <= 0,
      };
    })
    .filter((s) => s.perPerson > 0);

  // White-label F1: la marca del operador dueño del viaje. Sin operador con
  // marca ⇒ null y la pantalla se ve Caminante, igual que siempre.
  const tema = await fetchThemeForExperience(slug);

  const errMsg = error ? errorMsgs[error] ?? decodeURIComponent(error) : null;
  const deslindeOk = deslindeListo(experience).ok;
  // Rótulo del subtítulo de la cabecera móvil: el estado (liga con la página de
  // destino) y si no, la línea de la tarjeta. Nunca un lugar inventado.
  const lugar = experience?.estado || experience?.cardPloc || "";

  // Se renderizan los DOS marcados y el CSS decide cuál se ve (corte en 700px,
  // PUB_SWAP_CSS): abajo el teléfono, arriba el escritorio de hoy, intacto.
  // Ver design/publico-movil/PATRON.md.
  return (
    <>
      <PubStyles />
      <WhiteLabelStyles theme={tema} />
      <section className={`pub-no${wlApp(tema)} mx-auto w-full max-w-xl px-6 py-12`}>
      <p className="text-[10px] uppercase tracking-[0.25em] text-olive">Reserva</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-lagoon">{title}</h1>
      <p className="mt-2 text-sm text-olive">
        Elige tu salida y paga en línea para apartar tu lugar. Después firmas tu deslinde.
      </p>

      {errMsg ? (
        <div className="mt-6 rounded-xl border border-dune/40 bg-dune/10 p-4 text-sm text-lagoon">
          {errMsg}
        </div>
      ) : null}

      <div className="mt-8">
        {!deslindeListo(experience).ok ? (
          // REGLA: sin deslinde completo NO se vende. Mejor un aviso claro aquí
          // que fallar después del submit (createCheckout rebota igual).
          <div className="rounded-2xl border border-sand bg-white p-6 text-sm text-olive">
            Estamos terminando de preparar esta experiencia — todavía no abre la reserva en línea.{" "}
            <a href="mailto:uno@numanhub.com" className="font-semibold text-lagoon underline">
              Escríbenos y te avisamos en cuanto esté lista →
            </a>
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-2xl border border-sand bg-white p-6 text-sm text-olive">
            Por ahora no hay salidas abiertas.{" "}
            <a href={`/caminante/solicitar/${slug}`} className="font-semibold text-lagoon underline">
              Solicita una fecha para tu grupo →
            </a>
          </div>
        ) : (
          <CheckoutForm slug={slug} slots={slots} tiers={experience?.priceTiers ?? []} grupoToken={grupoToken} />
        )}
      </div>
      </section>

      <PubShell buypad scope={wlDoc(tema)}>
        <ReservarMovil
          slug={slug}
          titulo={title}
          lugar={lugar}
          slots={slots}
          tiers={experience?.priceTiers ?? []}
          grupoToken={grupoToken}
          deslindeOk={deslindeOk}
          errMsg={errMsg}
        />
      </PubShell>
    </>
  );
}
