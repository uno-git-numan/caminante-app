import type { Metadata } from "next";
import Script from "next/script";
import PubStyles from "./ui/pub/PubStyles";
import PubShell from "./ui/pub/PubShell";
import InicioScreen, { type CalificacionVM, type SalidaVM, type TestimonioVM } from "./InicioScreen";
import { landingDoc } from "@/lib/publico/landing";
import { fetchPublishedExperienceRows } from "@/lib/experiences/queries";
import { toCard } from "@/lib/experiences/card";
import { fetchPublicAvailability } from "@/lib/experiences/availability";
import { fetchExperienceRatings } from "@/lib/experiences/ratings";
import { fetchDestinos } from "@/lib/destinos/queries";
import { fetchOperadores, fetchTestimoniosPublicos } from "@/lib/operators/public";
import { fotosDelBanco } from "@/lib/publico/fotos";

// La PORTADA, `/caminante`. Un documento con los DOS marcados, como manda
// design/publico-movil/PATRON.md:
//
//   · escritorio → el landing de siempre (`public/landing/index.html`), servido
//     TAL CUAL dentro de `.pub-no`. No se editó ni una línea de ese archivo: se
//     lee y se parte en `src/lib/publico/landing.ts` (ahí está el porqué y el
//     detalle de los scripts).
//   · móvil (<700px) → `PubInicio`, la pantalla nueva, dentro de `<PubShell>`.
//
// Antes de esto `/caminante` era un rewrite `beforeFiles` en `next.config.ts` al
// HTML estático, y un rewrite no puede servir dos marcados en el mismo
// documento: o manda el archivo entero, o no manda nada. Se quitó el rewrite
// (única vía sin olfatear el user-agent, que rompería el caché de Vercel). Es
// el mismo movimiento que ya se hizo con las páginas de destino y con
// ensenada/hongos: el HTML deja de servirse por rewrite y pasa por React.
//
// Qué dato sale de dónde (el mockup traía todo inventado):
//   · próximas salidas → fetchPublicAvailability (open + public) + toCard
//   · lugares          → fetchDestinos (tabla `destinos`, 0023)
//   · operadores       → fetchOperadores (los is_public, 0020) — función nueva
//   · testimonios      → fetchTestimoniosPublicos — aprobados Y con
//                        consentimiento, firmados con INICIALES
//   · «N de 5 · … · N respuestas» → fetchExperienceRatings, por EXPERIENCIA
//   · fotos            → banco de fotos real (Experience.photoBank)

export const metadata: Metadata = {
  title: "Caminante · Naturaleza en movimiento",
};

// Fechas y cupo EN VIVO: nada de caché.
export const dynamic = "force-dynamic";

const TZ = "America/Mexico_City";
const DIA = new Intl.DateTimeFormat("es-MX", { timeZone: TZ, day: "numeric" });
const MES = new Intl.DateTimeFormat("es-MX", { timeZone: TZ, month: "short" });

/** Cuántas salidas caben en la portada antes de mandar al calendario. */
const MAX_SALIDAS = 5;

/** Una salida ya pasó si su fecha de inicio quedó atrás. Cinturón para las
 *  horas entre dos corridas del cron `cerrar-salidas`: anunciar «Jun 26» en
 *  agosto sería mentir. Sin fecha capturada, la decide el admin. */
function esFutura(startsAt: string | null): boolean {
  if (!startsAt) return false; // sin fecha no hay día que pintar en la tarjeta
  const t = Date.parse(startsAt);
  return Number.isNaN(t) || t >= Date.now();
}

export default async function CaminantePortadaPage() {
  const landing = landingDoc();

  const [rows, disponibilidad, ratings, lugares, operadores, testimonios, fotos] =
    await Promise.all([
      fetchPublishedExperienceRows(),
      fetchPublicAvailability(),
      fetchExperienceRatings(),
      fetchDestinos(),
      fetchOperadores(),
      fetchTestimoniosPublicos(3),
      fotosDelBanco(["paisaje", "cielo"], 2),
    ]);

  const porSlug = new Map(disponibilidad.map((d) => [d.slug, d]));

  // Próximas salidas: las de todas las experiencias publicadas, en una sola
  // lista ordenada por fecha (es la pregunta del visitante: «¿cuándo salen?»).
  const salidas: SalidaVM[] = rows
    .flatMap(({ data }) => {
      const card = toCard(data);
      return (porSlug.get(data.slug)?.slots ?? [])
        .filter((s) => esFutura(s.startsAt))
        .map((s) => {
          const d = new Date(s.startsAt as string);
          return {
            id: s.id,
            slug: data.slug,
            startsAt: s.startsAt as string,
            dia: DIA.format(d),
            mes: MES.format(d).replace(/\.$/, ""),
            nombre: card.title,
            lugar: card.estado || card.ploc,
            label: s.label,
            disp: s.soldOut ? "agotada" : s.available == null ? "abierta" : `quedan ${s.available}`,
            low: s.available != null && s.available <= 3 && !s.soldOut,
          };
        });
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, MAX_SALIDAS);

  // La calificación de la portada va por EXPERIENCIA con su número de
  // respuestas (decisión de Luis, 11 ago). Se muestra la mejor calificada, con
  // su nombre — el «4,8 de 5 · 12 respuestas» suelto del mockup es justo el
  // número que el panel dejó de mostrar el 10 ago por esconder dos salidas.
  let calificacion: CalificacionVM | null = null;
  for (const { id, data } of rows) {
    const r = ratings.get(id);
    if (!r) continue;
    if (!calificacion || r.stars > Number(calificacion.estrellas.replace(",", "."))) {
      calificacion = {
        estrellas: r.stars.toFixed(1).replace(".", ","),
        experiencia: toCard(data).title,
        respuestas: r.count,
      };
    }
  }

  const testis: TestimonioVM[] = testimonios.map((t) => ({
    texto: t.text,
    firma: [t.initials, t.location, t.stars ? `★${t.stars}` : ""].filter(Boolean).join(" · "),
  }));

  return (
    <>
      {/* El CSS del landing, verbatim. Va ANTES del de la vista móvil: sus
          selectores no se cruzan (los del móvil cuelgan todos de `.pub`), pero
          si algún día se cruzaran, manda el móvil. */}
      <style dangerouslySetInnerHTML={{ __html: landing.css }} />
      <PubStyles />

      {/* ESCRITORIO — el landing de siempre. `.pub-no` lo esconde abajo de 700px. */}
      <div className="pub-no" dangerouslySetInnerHTML={{ __html: landing.body }} />
      {landing.scripts.map((codigo, i) => (
        <Script key={i} id={`landing-${i}`} strategy="afterInteractive">
          {codigo}
        </Script>
      ))}
      {landing.srcs.map((src) => (
        <Script key={src} src={src} strategy="afterInteractive" />
      ))}

      {/* MÓVIL — la portada nueva. El CSS la esconde arriba de 700px. */}
      <PubShell tab="inicio">
        <InicioScreen
          heroFoto={fotos[0] || ""}
          nosotrosFoto={fotos[1] || fotos[0] || ""}
          salidas={salidas}
          lugares={lugares}
          operadores={operadores}
          testimonios={testis}
          calificacion={calificacion}
          solicitarSlug={rows[0]?.data.slug ?? null}
        />
      </PubShell>
    </>
  );
}
