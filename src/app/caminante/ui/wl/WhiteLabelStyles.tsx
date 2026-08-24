// WHITE-LABEL F1 · el interruptor único del funnel del cliente.
//
// Las cuatro pantallas por las que pasa quien compra (experiencia → reservar →
// deslinde → éxito) se visten con la marca del operador DUEÑO del viaje. Sin
// operador con marca este componente no pinta NADA: ni un <style>, ni una clase
// de más. Las páginas de la casa quedan idénticas.
//
// ── Por qué DOS clases y no una ──────────────────────────────────────────────
// Cada ruta renderiza los dos marcados (PUB_SWAP_CSS decide cuál se ve, corte en
// 700px) y en el funnel conviven los DOS vocabularios de variables que documenta
// branding.ts — los que usan los mismos nombres para cosas distintas:
//
//   superficie                          vocabulario        clase
//   ─────────────────────────────────────────────────────────────
//   escritorio de reservar/éxito        Tailwind           wl-app
//   (el aviso de "salida completa")     Tailwind           wl-app
//   escritorio de la experiencia (v2)   el de marca        wl-doc
//   escritorio del deslinde (.reg-page) el de marca        wl-doc
//   shell móvil (.pub)                  el de marca        wl-doc
//
// `wl-app` emite el namespace `--app-*` (lo único que lee `@theme inline`);
// `wl-doc` emite los nombres de marca (--olive, --orange, --salvia…). Los dos
// juegos son DISJUNTOS: por eso pueden convivir hasta en el mismo elemento sin
// pisarse, que es justo lo que no pasaba antes del namespace.
//
// ── Por qué el selector va DOBLE ─────────────────────────────────────────────
// `.wl-doc.wl-doc` en vez de `.wl-doc`. El CSS base de cada superficie define
// sus variables SOBRE EL PROPIO ELEMENTO (`.pub{--olive:…}`, `.reg-page{…}`), y
// varias de esas hojas se inyectan DENTRO del componente — o sea, DESPUÉS de
// este <style> en el documento. Con la misma especificidad ganaría la última y
// la marca no aparecería en el deslinde. Duplicar la clase sube la
// especificidad a (0,2,0) y el override gana sin depender del orden.
import { themeCssAppFor, themeCssFor, type OperatorTheme } from "@/lib/operators/branding";
import { marcaLista } from "@/lib/operators/marca";

/** Superficies en vocabulario TAILWIND (utilidades text-lagoon, bg-dune…). */
export const WL_APP = "wl-app";
/** Superficies en el vocabulario DE MARCA (.pub, .reg-page, template v2). */
export const WL_DOC = "wl-doc";

const hay = (t: OperatorTheme | null | undefined) => marcaLista(t?.branding);

/** `" wl-app"` si hay marca, `""` si no. Para concatenar en un className. */
export function wlApp(theme: OperatorTheme | null | undefined): string {
  return hay(theme) ? ` ${WL_APP}` : "";
}

/** `"wl-doc"` si hay marca, `undefined` si no. Para props `scope`. */
export function wlDoc(theme: OperatorTheme | null | undefined): string | undefined {
  return hay(theme) ? WL_DOC : undefined;
}

/** El <style> del tema. Va después de `<PubStyles/>`, al principio de la página. */
export default function WhiteLabelStyles({ theme }: { theme: OperatorTheme | null | undefined }) {
  const b = theme?.branding;
  if (!b || !marcaLista(b)) return null;
  // `--bg` es el ÚNICO hueco de themeCssFor sobre el shell móvil: PUB_CSS lo usa
  // para el marco alrededor de la tarjeta de app, y entre 431 y 699px ese marco
  // se ve. Sin esto quedaba un borde gris de Caminante rodeando una pantalla ya
  // vestida del operador. No se mete en themeCssFor porque esa función también
  // viste el portal `.opw`, que no tiene marco.
  const marco = `.${WL_DOC}.${WL_DOC}{--bg:color-mix(in srgb, ${b.colors.ink || "#20211c"} 8%, ${b.colors.bg || "#fbfbf7"});}`;
  const css =
    themeCssAppFor(`.${WL_APP}.${WL_APP}`, b) + themeCssFor(`.${WL_DOC}.${WL_DOC}`, b) + marco;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
