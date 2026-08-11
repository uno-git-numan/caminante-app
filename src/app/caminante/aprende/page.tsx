import type { Metadata } from "next";
import PubStyles from "../ui/pub/PubStyles";
import PubShell from "../ui/pub/PubShell";
import { fetchPublishedExperienceRows } from "@/lib/experiences/queries";
import { toCard } from "@/lib/experiences/card";
import { unaFotoDelBanco } from "@/lib/publico/fotos";
import AprendeScreen, { type LugarFicha } from "./AprendeScreen";

// «Aprende» — la envoltura es PubAprende de design/publico-movil/pub-aprende.jsx
// (cabecera, filtros por lugar y por cara, lista, estado vacío). Esta ruta NO
// existía: la barra de pestañas del shell ya la ofrecía y daba 404, así que va
// con `modo="solo"` (no hay escritorio que respetar).
//
// ⚠️ DECISIÓN, y es la parte importante de esta pantalla:
// `PubAprende` está definida DOS veces en el entregable. La de `pub-aprende.jsx`
// (índice de CÁPSULAS: artículos, guías de campo, ensayos, series, minutos de
// lectura) es la que gana en la demo, pero **no tiene fuente de datos**: no hay
// tabla de artículos en la base (barrido 0001–0034: ni `articles`, ni `posts`,
// ni `capsulas`). Sus 4 cápsulas viven hardcodeadas en el .jsx.
//
// Instrucción de Luis (11 ago): poner la pantalla igual, con un estado claro de
// «estamos produciendo contenido», y llenarla con lo que SÍ existe. Lo que sí
// existe y está poblado es la **ficha científica** de cada experiencia
// (`Experience.ficha`): datos con FUENTE OBLIGATORIA, especies, glosario y
// temporada. Eso es el cuerpo de la pantalla; el hueco de las cápsulas largas
// se declara vacío con honestidad, sin inventar artículos, minutos de lectura
// ni fechas de publicación.
//
// Lo que se omitió del diseño y por qué:
//   · La cápsula destacada, «lo que pasa este mes» y «serie · 4 entregas»:
//     dependen de `CAPS[]` (formato, min, destacada, esteMes, serie), que no
//     existe como dato. No hay modelo de serie ni de progreso de lectura.
//   · `CapRow` (miniatura + «6 min» + entradilla) y la pantalla de lectura
//     (`PubCapsula`) no se transcriben: no hay artículo que abrir.

export const metadata: Metadata = {
  title: "Aprende · Caminante",
  description:
    "La ciencia de cada lugar donde caminamos: especies, datos con fuente, glosario y temporada. Sin fuente, el dato no entra.",
};

export const dynamic = "force-dynamic";

export default async function AprendePage() {
  const [rows, fotoNosotros] = await Promise.all([
    fetchPublishedExperienceRows(),
    unaFotoDelBanco(["paisaje", "cielo"]),
  ]);

  // Solo entra lo que trae texto Y fuente: la fuente es obligatoria y siempre se
  // muestra (regla de la casa, ver Experience.ficha en experiences/types.ts).
  const lugares: LugarFicha[] = rows
    .map(({ data }) => {
      const card = toCard(data);
      const f = data.ficha ?? {};
      return {
        slug: data.slug,
        nombre: card.title,
        estado: card.estado || card.ploc,
        datos: (f.datos ?? [])
          .filter((d) => d.texto?.trim() && d.fuente?.trim())
          .map((d) => ({
            n: d.n?.trim() || "",
            texto: d.texto.trim(),
            fuente: d.fuente.trim(),
            cara: d.cara?.trim() || "",
          })),
        especies: (f.especies ?? [])
          .map((sp) => ({
            comun: sp.comun?.trim() || "",
            cientifico: sp.cientifico?.trim() || "",
            datos: (sp.datos ?? []).filter((d) => d.texto?.trim() && d.fuente?.trim()),
          }))
          .filter((sp) => sp.comun && sp.datos.length > 0),
        glosario: (f.glosario ?? []).filter((g) => g.termino?.trim() && g.def?.trim()),
        temporada: (f.temporada ?? [])
          .filter((t) => t.epoca?.trim() && t.fenomeno?.trim())
          .map((t) => ({
            epoca: t.epoca.trim(),
            fenomeno: t.fenomeno.trim(),
            fuente: t.fuente?.trim() || "",
          })),
      };
    })
    .filter(
      (l) =>
        l.datos.length > 0 ||
        l.especies.length > 0 ||
        l.glosario.length > 0 ||
        l.temporada.length > 0,
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return (
    <>
      <PubStyles modo="solo" />
      <PubShell tab="aprende">
        <AprendeScreen lugares={lugares} fotoNosotros={fotoNosotros} />
      </PubShell>
    </>
  );
}
