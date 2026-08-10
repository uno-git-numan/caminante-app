// PARCHES MÓVIL — capa que se inyecta DESPUÉS del CSS verbatim.
//
// ⚠️ Por qué vive aparte y no dentro de `template-v2-css.ts`: ese archivo está
// extraído BYTE-IDÉNTICO del HTML de Claude Design y la regla de la casa es
// re-extraerlo, nunca editarlo. Si estos arreglos vivieran ahí, la próxima
// re-extracción los borraría en silencio. Aquí sobreviven.
//
// Alcance: SOLO arreglos medidos en un iPhone de 375×812 (audit del 8 ago 2026).
// Nada de rediseño — eso llega por Claude Design en su propio HTML.
//
// Cada bloque cita el problema que resuelve para que se pueda retirar cuando el
// diseño nuevo lo cubra de origen.

export const MOVIL_FIXES_CSS = String.raw`
/* ═══ 1 · DESBORDE HORIZONTAL ═══════════════════════════════════════════════
   Medido: documento 411px en pantalla de 375 → la página se movía de lado.
   CAUSA RAÍZ: el wordmark del pie. La regla ".footer .word" fija height:30px y
   el svg va con width:auto; con una relación de aspecto de ~13:1 eso da 390px
   fijos. El nav salía "412px" solo porque su right:0 se resuelve contra el
   documento ya desbordado — era la víctima, no la causa.
   (OJO: cero backticks dentro de este template literal.) */
@media (max-width: 480px) {
  .footer .word { height: auto; }
  .footer .word svg { width: 100%; height: auto; max-width: 100%; }
}
/* Cinturón de seguridad: ningún SVG suelto vuelve a empujar el ancho. */
svg { max-width: 100%; }

/* ═══ 2 · ÁREA TÁCTIL MÍNIMA (44pt, guía de Apple) ═════════════════════════
   Medido: píldoras 38px, botones del header 33px, "Caminante — inicio" 34px.
   Se crece el área tocable SIN crecer la caja visual (padding + área negativa),
   para no alterar el ritmo del diseño. */
@media (max-width: 920px) {
  .nav a, .nav button, .drawer a, .btn, .btn-sm { min-height: 44px; }
  .nav .burger { min-width: 44px; min-height: 44px; margin-right: -6px; }
}

/* ═══ 3 · VELO SOBRE FOTO (contraste del hero) ═════════════════════════════
   Medido: en la página de experiencia el título y el párrafo van directo sobre
   la foto. Con fotos claras (los hongos de Xalatlaco) el texto se pierde.
   El velo es más fuerte abajo, que es donde cae el texto. */
@media (max-width: 920px) {
  .hero::after {
    content: "";
    position: absolute; inset: 0; z-index: 1; pointer-events: none;
    background: linear-gradient(to bottom, rgba(12,14,11,.34) 0%, rgba(12,14,11,.14) 30%, rgba(12,14,11,.72) 100%);
  }
  .hero > *:not(.bg):not(img) { position: relative; z-index: 2; }
}

/* ═══ 4 · TEXTO LEGIBLE ════════════════════════════════════════════════════
   Medido: 12px en "Operada por", "Buenas prácticas", "Salida 1", franjas de día.
   12px es el piso de una nota al pie, no de contenido. Se sube a 14–15px. */
@media (max-width: 920px) {
  .op-chip, .op-chip *, .dcard .k, .tf-card .k, .pack .k, .faq-card .q small { font-size: 14px; }
  .eyebrow, .kicker { font-size: 12.5px; letter-spacing: .16em; }
  .dates .dcard .cupo, .dates .dcard .fecha { font-size: 15px; }
}

/* ═══ 5 · ZONA SEGURA DEL IPHONE (notch + barra de gestos) ═════════════════
   Sin esto el contenido queda bajo la barra de inicio en pantalla completa. */
@supports (padding: max(0px)) {
  .nav { padding-left: max(22px, env(safe-area-inset-left)); padding-right: max(22px, env(safe-area-inset-right)); }
  .footer { padding-bottom: max(40px, calc(24px + env(safe-area-inset-bottom))); }
  .drawer { padding-bottom: max(24px, env(safe-area-inset-bottom)); }
}
`;
