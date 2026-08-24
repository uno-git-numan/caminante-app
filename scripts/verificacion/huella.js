/* HUELLA DE ESTILOS COMPUTADOS — la prueba de no-regresión del white-label.
 *
 * Regla de la casa: las páginas de Caminante no pueden cambiar ni un pixel
 * cuando el viaje NO es de un operador con marca. Un screenshot no sirve para
 * probarlo (el pane del navegador scrollea un gemelo oculto y el rAF visible
 * corre a ~1Hz), así que se compara el DOM: para CADA elemento de la página, un
 * puñado de propiedades computadas, en orden de documento.
 *
 * Uso — se pega en la consola (o se evalúa con el tool de JS) sobre la MISMA
 * URL en los dos despliegues, y las dos salidas se comparan con shasum:
 *
 *     huella()   → { n, firma, hash }
 *
 * `hash` es un FNV-1a de 64 bits en hex: barato, sin dependencias y suficiente
 * para "¿es idéntico?". Si dos hashes difieren, se guardan las dos `firma` y se
 * les hace diff — ahí sale la línea exacta (elemento + propiedad) que cambió.
 */
window.huella = function huella() {
  // Las propiedades que puede mover un tema: color, tipografía y caja. Se dejan
  // FUERA las que dependen del viewport o del scroll (width/height/top), que
  // cambian entre dos cargas sin que nada se haya roto.
  const PROPS = [
    "color",
    "background-color",
    "background-image",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "border-top-width",
    "border-right-width",
    "border-bottom-width",
    "border-left-width",
    "border-top-left-radius",
    "outline-color",
    "text-decoration-color",
    "fill",
    "stroke",
    "box-shadow",
    "opacity",
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "letter-spacing",
    "line-height",
    "text-transform",
    "display",
    "padding-top",
    "padding-left",
    "margin-top",
    "margin-left",
  ];

  const nodos = document.querySelectorAll("*");
  const lineas = [];
  for (let i = 0; i < nodos.length; i++) {
    const el = nodos[i];
    // El <style> del tema y los <script> no pintan nada: incluirlos sólo mete
    // ruido (su contenido SÍ cambia a propósito cuando hay marca).
    if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "LINK") continue;
    const cs = getComputedStyle(el);
    const clases = (el.getAttribute("class") || "")
      .split(/\s+/)
      .filter(Boolean)
      // ⚠️ Las clases `wl-app`/`wl-doc` se ignoran A PROPÓSITO: en una página sin
      // operador con marca no existen, y si algún día se pintaran siempre, lo
      // que importa seguiría siendo que el ESTILO COMPUTADO no cambie.
      .filter((c) => c !== "wl-app" && c !== "wl-doc")
      .sort()
      .join(".");
    const vals = PROPS.map((p) => cs.getPropertyValue(p).trim()).join("|");
    lineas.push(`${i}\t${el.tagName}\t${clases}\t${vals}`);
  }

  const firma = lineas.join("\n");
  // FNV-1a 64 bits con BigInt.
  let h = 0xcbf29ce484222325n;
  const M = 0x100000001b3n;
  const MASK = 0xffffffffffffffffn;
  for (let i = 0; i < firma.length; i++) {
    h = ((h ^ BigInt(firma.charCodeAt(i) & 0xff)) * M) & MASK;
    const alto = firma.charCodeAt(i) >> 8;
    if (alto) h = ((h ^ BigInt(alto)) * M) & MASK;
  }
  return { n: lineas.length, hash: h.toString(16).padStart(16, "0"), firma };
};
