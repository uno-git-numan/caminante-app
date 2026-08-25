// Versión IMPRIMIBLE (→ PDF) de una experiencia, para compartir. Solo-admin.
// Genera un DECK: un slide por sección a tamaño fijo (16:9 horizontal / 9:16
// vertical según ?o=), al estilo de los flyers de referencia. Cada slide = una
// página exacta (@page + page-break) → sin cortes ni componentes perdidos.
// Auto-dispara el diálogo de impresión al cargar → el admin elige "Guardar como PDF".
import { notFound, redirect } from "next/navigation";
import { puedeEditarSlug } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Experience } from "@/lib/experiences/types";
import { fetchOpenSlotsForTemplate } from "@/lib/experiences/availability";
import { deckCss, DECK_GLASS_SCRIPT } from "@/lib/experiences/deck-css";
import ExperienceDeck from "../../../experiencias/[slug]/ExperienceDeck";
import DeckPdfButton from "../../../experiencias/[slug]/DeckPdfButton";

export const dynamic = "force-dynamic";

// El <title> del documento es el NOMBRE DE ARCHIVO que Chrome propone al
// "Guardar como PDF" → el flyer se descarga como "<Título de la experiencia>.pdf".
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = createSupabaseAdminClient();
  const { data: row } = await sb.from("experiences").select("data").eq("slug", slug).maybeSingle();
  const e = row?.data as Experience | undefined;
  const title =
    [e?.title, e?.titleAccent].filter(Boolean).join(" ").trim() || e?.docTitle || "Experiencia Caminante";
  return { title };
}

// Espera IMÁGENES + FUENTES antes de imprimir. Sin esperar document.fonts.ready
// el diálogo dispara con la fuente de respaldo del sistema (no Geist).
// OJO: el script de glass (DECK_GLASS_SCRIPT) va ANTES en el DOM → su listener
// de load corre primero e inyecta los clones blurreados; aquí se recogen
// document.images DESPUÉS (incluye los clones) y se espera a que carguen.
// Con ?noprint no dispara el diálogo (vista previa / depuración del deck).
const AUTOPRINT = `
window.addEventListener('load', function () {
  if (location.search.indexOf('noprint') !== -1) return;
  // Móvil: window.print() ignora el @page del deck y fragmenta las láminas en
  // cientos de páginas → ahí NO auto-imprimimos; el botón «Descargar PDF»
  // (DeckPdfButton) genera el PDF correcto en el navegador.
  if (window.matchMedia && matchMedia('(pointer: coarse)').matches) return;
  var imgs = Array.prototype.slice.call(document.images);
  var imgsReady = Promise.all(imgs.map(function (img) {
    // decode() garantiza que la imagen esté DECODIFICADA y lista para PINTAR.
    // (img.complete puede ser true sin estar pintada → Chrome imprime la página
    // ANTES de rasterizar las fotos → PDF sin fotos y glass flat. Con fotos
    // pesadas el 'complete' llega antes que el decode.) .catch para que una foto
    // rota no cuelgue el Promise.all (antes: "no descarga el PDF").
    if (img.decode) return img.decode().then(function(){return true;}).catch(function () { return true; });
    return img.complete ? true : new Promise(function (res) { img.onload = img.onerror = res; });
  }));
  var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  // Red de seguridad: imprime de todos modos a los 7s aunque algo se cuelgue.
  var safety = new Promise(function (res) { setTimeout(res, 7000); });
  Promise.race([Promise.all([imgsReady, fontsReady]), safety]).then(function () {
    setTimeout(function () { window.print(); }, 400);
  });
});
`;

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ o?: string }>;
}) {
  // Solo sobre SU experiencia (la casa, sobre cualquiera).
  if (!(await puedeEditarSlug((await params).slug))) redirect("/caminante/entrar");

  const { slug } = await params;
  const { o } = await searchParams;
  const orient: "h" | "v" = o === "v" ? "v" : "h";

  const sb = createSupabaseAdminClient();
  const { data: row } = await sb
    .from("experiences")
    .select("id, data")
    .eq("slug", slug)
    .maybeSingle();
  if (!row?.data) notFound();

  const e = row.data as Experience;
  if (e.design !== "v2" || !e.page?.blocks?.length) {
    // El deck vive del diseño v2; una experiencia legacy no tiene bloques.
    return (
      <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 560 }}>
        <h1 style={{ fontSize: 20, marginBottom: 10 }}>Aún no se puede generar el PDF</h1>
        <p style={{ color: "#555", lineHeight: 1.6 }}>
          Esta experiencia todavía usa el diseño anterior. Edítala y guárdala en el formulario
          nuevo (queda en diseño v2) y el PDF se generará solo.
        </p>
      </div>
    );
  }
  const slots = await fetchOpenSlotsForTemplate((row as { id: string }).id, { includePrivate: true });

  const titulo =
    [e.title, e.titleAccent].filter(Boolean).join(" ").trim() || e.docTitle || "Experiencia Caminante";
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: deckCss(orient) }} />
      <DeckPdfButton filename={titulo} />
      <ExperienceDeck experience={e} slots={slots} orient={orient} />
      <script dangerouslySetInnerHTML={{ __html: DECK_GLASS_SCRIPT }} />
      <script dangerouslySetInnerHTML={{ __html: AUTOPRINT }} />
    </>
  );
}
