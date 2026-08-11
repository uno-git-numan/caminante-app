import type { Metadata } from "next";
import PubStyles from "../ui/pub/PubStyles";
import PubShell from "../ui/pub/PubShell";
import { fetchPublishedExperienceRows } from "@/lib/experiences/queries";
import { toCard } from "@/lib/experiences/card";
import { fetchPublicAvailability } from "@/lib/experiences/availability";
import { fetchExperienceRatings } from "@/lib/experiences/ratings";
import { fetchDestinos } from "@/lib/destinos/queries";
import { parseMxnAmount } from "@/lib/payments/reservation-links";
import ExpsScreen, { type Destacado, type ExpVM } from "./ExpsScreen";

// «Experiencias» — transcrita de PubExps (design/publico-movil/pub-a.jsx).
//
// Esta ruta NO existía: `SiteChrome.navItems` y la barra de pestañas del shell
// ya la ofrecían y daba 404. Como no hay escritorio que respetar, el diseño
// aplica en todo ancho (`modo="solo"`).
//
// Qué dato sale de dónde:
//   · tarjetas         → fetchPublishedExperienceRows + toCard
//   · próximas fechas  → fetchPublicAvailability (salidas open + public)
//   · estrellas        → fetchExperienceRatings (encuesta respondida)
//   · lugares          → fetchDestinos (tabla `destinos`, 0023)
//   · precio           → parseMxnAmount(price.amount), el mismo parser que cobra
//
// Lo que el mockup inventa y AQUÍ NO VA (ver INTEGRACION.md §3):
//   · `e.cat` (Hiking/Trekking/Ocean Safari) — no hay campo de categoría, así
//     que no hay agrupación por categoría ni rótulos «N salidas al mar». Las
//     experiencias van en una sola lista.
//   · `e.nueva` — no hay bandera; el destacado «Nueva» del rail se omite.
//   · `e.fotos: 80` — no hay contador de fotos expuesto.

export const metadata: Metadata = {
  title: "Experiencias · Caminante",
  description:
    "Todas las experiencias de Caminante: dónde caminamos, cuándo salimos y qué se aprende en cada lugar.",
};

// La disponibilidad es EN VIVO (cupo y salidas abiertas): nada de caché.
export const dynamic = "force-dynamic";

/** Una salida ya pasó si su fecha de inicio quedó atrás. Las salidas no se
 *  cierran solas al terminar (el admin las cierra a mano), así que el público
 *  filtra: anunciar «próxima fecha · Jun 26» en agosto sería mentir. */
function esFutura(startsAt: string | null): boolean {
  if (!startsAt) return true; // sin fecha capturada → la decide el admin, no se esconde
  const t = Date.parse(startsAt);
  return Number.isNaN(t) || t >= Date.now();
}

export default async function ExperienciasPage() {
  const [rows, disponibilidad, ratings, lugares] = await Promise.all([
    fetchPublishedExperienceRows(),
    fetchPublicAvailability(),
    fetchExperienceRatings(),
    fetchDestinos(),
  ]);

  const porSlug = new Map(disponibilidad.map((d) => [d.slug, d]));

  const exps: ExpVM[] = rows.map(({ id, data }) => {
    const card = toCard(data);
    const salidas = (porSlug.get(data.slug)?.slots ?? [])
      .filter((s) => esFutura(s.startsAt))
      .map((s) => ({
        label: s.label,
        startsAt: s.startsAt,
        available: s.available,
        soldOut: s.soldOut,
      }));
    const rating = ratings.get(id) ?? null;
    return {
      slug: data.slug,
      nombre: card.title,
      // El título partido del hero: "El bosque" + "de Xalatlaco." en itálica.
      titulo: data.title || card.title,
      acento: data.titleAccent || "",
      lugar: card.estado || card.ploc,
      imagen: card.image,
      imagenAlt: card.imageAlt || card.title,
      precio: parseMxnAmount(data.price?.amount),
      salidas,
      rating,
    };
  });

  // Destacados: solo los dos que salen de datos reales. «Nueva» se cae porque
  // no existe la bandera (y `created_at` ni se selecciona).
  const destacados: Destacado[] = [];
  // `fetchPublicAvailability` ya ordena las salidas de cada experiencia por
  // fecha; aquí solo hay que ordenar entre experiencias.
  const conFecha = exps
    .filter((e) => e.salidas.length > 0)
    .sort((a, b) =>
      (a.salidas[0].startsAt ?? "9999").localeCompare(b.salidas[0].startsAt ?? "9999"),
    );
  if (conFecha.length > 0) {
    const prox = conFecha[0];
    const s = prox.salidas[0];
    destacados.push({
      k: "Próxima fecha",
      v: s.available != null ? `${s.label} · quedan ${s.available}` : s.label,
      exp: prox,
    });
  }
  const mejor = exps
    .filter((e) => e.rating)
    .sort((a, b) => b.rating!.stars - a.rating!.stars)[0];
  if (mejor && !destacados.some((d) => d.exp.slug === mejor.slug)) {
    destacados.push({
      k: "Mejor calificada",
      v: `${mejor.rating!.stars.toFixed(1).replace(".", ",")} de 5 · ${mejor.rating!.count} ${
        mejor.rating!.count === 1 ? "respuesta" : "respuestas"
      }`,
      exp: mejor,
    });
  }

  return (
    <>
      <PubStyles modo="solo" />
      <PubShell tab="experiencias">
        <ExpsScreen exps={exps} lugares={lugares} destacados={destacados} />
      </PubShell>
    </>
  );
}
