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
  // ⚠️ APAGAR TRANSICIONES ANTES DE MEDIR. `.pub .pub-cta{transition:background
  // .18s}` y en el Browser pane el reloj de animación del gemelo va congelado:
  // el botón se queda pintado con el color VIEJO indefinidamente y
  // getComputedStyle devuelve ese, no el destino. Costó media hora creer que el
  // CTA naranja no tomaba la marca del operador cuando sí la tomaba.
  if (!document.getElementById("huella-sin-transiciones")) {
    const off = document.createElement("style");
    off.id = "huella-sin-transiciones";
    off.textContent =
      "*,*::before,*::after{transition:none!important;animation:none!important;}";
    document.head.appendChild(off);
    void document.body.offsetHeight; // fuerza el recálculo antes de leer
  }

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

  // ⚠️ `VERCEL-LIVE-FEEDBACK` es la barra de comentarios que Vercel inyecta en
  // ALGUNOS previews y no en otros. Si no se omite, dos despliegues idénticos
  // dan huellas distintas y la prueba grita por una diferencia de
  // infraestructura. `NEXT-ROUTE-ANNOUNCER` va fuera por lo mismo.
  const OMITIR = new Set([
    "SCRIPT",
    "STYLE",
    "LINK",
    "VERCEL-LIVE-FEEDBACK",
    "NEXT-ROUTE-ANNOUNCER",
  ]);

  // ── Normalización: qué se compara de verdad ─────────────────────────────
  // Dos cosas cambian entre despliegues SIN que se haya movido un pixel, y las
  // dos harían fallar la prueba por la razón equivocada:
  //
  // 1 · `background-image` trae URLs ABSOLUTAS con el host del despliegue
  //     (`url("https://caminante-oozet5gnw-….vercel.app/…")`). Se le quita el
  //     origen.
  //
  // 2 · ⚠️ EL GRANDE. Con el color en hex literal, Tailwind resuelve las
  //     utilidades con opacidad (`bg-cream/90`, `text-olive/70`) EN EL BUILD y
  //     hornea un `oklab(0.986983 -0.00149536 …)`. Con el color detrás de un
  //     `var()` ya no puede, y emite un `color-mix()` que resuelve el NAVEGADOR:
  //     `oklab(0.986977 -0.00145039 …)`. Es la misma tinta con otros decimales
  //     —al pintarlo, los dos dan el MISMO byte de sRGB— pero como cadena
  //     difiere. Abrir la cascada obliga a ese cambio: no hay forma de tener
  //     white-label y conservar la constante horneada.
  //
  //     Por eso el color se compara PINTÁNDOLO: se rasteriza en un canvas de
  //     1×1 y se compara el RGBA de 8 bits. Que es, literalmente, el pixel.
  const COLOR = new Set([
    "color",
    "background-color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "outline-color",
    "text-decoration-color",
    "fill",
    "stroke",
  ]);
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true });

  function pixel(valor) {
    try {
      cx.clearRect(0, 0, 1, 1);
      cx.fillStyle = valor;
      cx.fillRect(0, 0, 1, 1);
      const d = cx.getImageData(0, 0, 1, 1).data;
      return `${d[0]},${d[1]},${d[2]},${d[3]}`;
    } catch {
      return valor; // `none`, `currentcolor` y demás no-colores
    }
  }

  function norm(prop, valor) {
    if (COLOR.has(prop)) return pixel(valor);
    const sinOrigen = valor.split(location.origin).join("«origen»");
    // Los flotantes que sobrevivan (box-shadow lleva color adentro) se redondean:
    // misma razón que arriba, sin poder rasterizar un valor compuesto.
    return sinOrigen.replace(/-?\d+\.\d{4,}/g, (n) => Number(n).toFixed(3));
  }

  const nodos = document.querySelectorAll("*");
  const lineas = [];
  for (let i = 0; i < nodos.length; i++) {
    const el = nodos[i];
    // El <style> del tema y los <script> no pintan nada: incluirlos sólo mete
    // ruido (su contenido SÍ cambia a propósito cuando hay marca).
    if (OMITIR.has(el.tagName)) continue;
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
    const vals = PROPS.map((p) => norm(p, cs.getPropertyValue(p).trim())).join("|");
    // El índice es el de la LISTA, no el del DOM: así omitir un nodo no corre
    // todos los demás y la comparación no se vuelve un mar de falsos positivos.
    lineas.push(`${lineas.length}\t${el.tagName}\t${clases}\t${vals}`);
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
