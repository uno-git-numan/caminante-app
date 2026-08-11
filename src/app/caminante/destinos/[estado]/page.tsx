// Página de destino por estado (data-driven). /caminante/destinos/<slug>.
// Cualquier estado real de México resuelve; si tiene contenido publicado se ve
// completo, si no cae en el fallback (hero + grilla de experiencias + cierre).
// Un slug que no es un estado → 404.
//
// La ruta YA tenía escritorio (`DestinoTemplate`, CSS `.dst`): desde el sitio
// público móvil se renderizan los DOS marcados y el CSS decide cuál se ve
// (corte en 700px, modo `swap` de PubStyles). El escritorio no se tocó — solo
// se envolvió en `.pub-no`. Ver design/publico-movil/PATRON.md.
import { notFound } from "next/navigation";
import { estadoFromSlug } from "@/lib/destinos/estado-slug";
import { fetchDestino } from "@/lib/destinos/queries";
import { fetchPublishedExperienceRows } from "@/lib/experiences/queries";
import { toCard } from "@/lib/experiences/card";
import { fetchPublicAvailability, type SlotAvailabilityPublic } from "@/lib/experiences/availability";
import { fetchOperatorChipForExperience } from "@/lib/operators/public";
import { parseMxnAmount } from "@/lib/payments/reservation-links";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import PubStyles from "../../ui/pub/PubStyles";
import PubShell from "../../ui/pub/PubShell";
import DestinoTemplate from "./DestinoTemplate";
import DestinoMovil, { type ExpDestino } from "./DestinoMovil";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ estado: string }> }) {
  const { estado: slug } = await params;
  const estado = estadoFromSlug(slug);
  if (!estado) return { title: "Destino · Caminante" };
  return {
    title: `${estado} · Caminante`,
    description: `Vive ${estado} con Caminante: naturaleza, conservación, comunidades y experiencias guiadas.`,
  };
}

const fmtDia = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", day: "numeric" });
const fmtMes = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", month: "short" });

/** Una salida ya pasó si su fecha de inicio quedó atrás. El cierre de verdad lo
 *  hace el cron `cerrar-salidas` cada mañana; esto es el cinturón para las horas
 *  entre una corrida y la siguiente (anunciar «Jun 26» en agosto sería mentir). */
function esFutura(startsAt: string | null): boolean {
  if (!startsAt) return true; // sin fecha capturada → la decide el admin
  const t = Date.parse(startsAt);
  return Number.isNaN(t) || t >= Date.now();
}

function etiqueta(s: SlotAvailabilityPublic): string {
  if (s.label?.trim()) return s.label;
  if (!s.startsAt) return "Salida abierta";
  const d = fmtDia.format(new Date(s.startsAt));
  const m = fmtMes.format(new Date(s.startsAt)).replace(/\.$/, "");
  return `${d} ${m}`;
}

function dispo(s: SlotAvailabilityPublic): string {
  if (s.soldOut) return "agotada";
  if (s.available === null) return ""; // salida sin tope: no se inventa un número
  if (s.capacity != null) return `quedan ${s.available} de ${s.capacity}`;
  return `quedan ${s.available}`;
}

export default async function DestinoPage({ params }: { params: Promise<{ estado: string }> }) {
  const { estado: slug } = await params;
  const estado = estadoFromSlug(slug);
  if (!estado) notFound();

  const [destino, rows, disponibilidad] = await Promise.all([
    fetchDestino(slug),
    fetchPublishedExperienceRows(),
    fetchPublicAvailability(),
  ]);
  let content = destino?.content ?? null;

  // La "experiencia destacada" solo se muestra si la experiencia está PUBLICADA:
  // así su botón "Vivir esta experiencia" nunca apunta a un borrador (404).
  if (content?.featured?.slug) {
    try {
      const sb = createSupabaseAdminClient();
      const { data } = await sb
        .from("experiences")
        .select("status")
        .eq("slug", content.featured.slug)
        .maybeSingle();
      if (data?.status !== "published") content = { ...content, featured: null };
    } catch {
      content = { ...content, featured: null };
    }
  }

  // Grilla del móvil: las experiencias PUBLICADAS de ESTE estado, con sus
  // salidas abiertas en vivo. Mismo criterio que la grilla del escritorio
  // (exp-grid.js filtra por `data-exp-grid="<Estado>"` → data.estado).
  const porSlug = new Map(disponibilidad.map((d) => [d.slug, d]));
  const delEstado = rows.filter((r) => (r.data.estado ?? "") === estado);
  const exps: ExpDestino[] = await Promise.all(
    delEstado.map(async (r): Promise<ExpDestino> => {
      const card = toCard(r.data);
      const chip = await fetchOperatorChipForExperience(r.id);
      return {
        slug: r.data.slug,
        titulo: r.data.title || card.title,
        acento: r.data.titleAccent || "",
        hook: card.hook,
        imagen: card.image,
        imagenAlt: card.imageAlt || card.title,
        precio: parseMxnAmount(r.data.price?.amount),
        operador: chip?.name ?? null,
        salidas: (porSlug.get(r.data.slug)?.slots ?? [])
          .filter((s) => esFutura(s.startsAt))
          .map((s) => ({ label: etiqueta(s), dispo: dispo(s) })),
      };
    }),
  );

  return (
    <>
      <PubStyles />
      <div className="pub-no">
        <DestinoTemplate estado={estado} content={content} />
      </div>
      <PubShell>
        <DestinoMovil estado={estado} content={content} exps={exps} />
      </PubShell>
    </>
  );
}
