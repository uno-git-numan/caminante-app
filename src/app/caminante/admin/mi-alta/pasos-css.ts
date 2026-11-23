// LO QUE EL RIEL DE CINCO PASOS NECESITA Y LA LÁMINA NO TRAE (23 nov 2026).
//
// `mi-alta-css.ts` se GENERA de la lámina (`scripts/extraer-css-dc.mjs`): lo
// que se escriba ahí a mano se pierde al re-extraer. Estas tres reglas son
// nuestras y van aparte, después de la hoja de la lámina:
//
//   1. La lámina dibuja CUATRO pasos (`repeat(4,1fr)`). Son cinco.
//   2. `.paso.sel` (el paso que se está viendo) choca con `.adm .sel`, la clase
//      del <select> de los formularios, que viene después en la hoja y le ponía
//      `display:flex; flex-direction:column` al paso elegido: el número se
//      montaba arriba del texto. Se le devuelve su rejilla.
//   3. El paso 02 y el 05 enseñan UNA mitad de lo que era «Armar y cobrar»:
//      la rejilla de dos columnas de `.mitades` se queda en una.
export const CINCO_PASOS_CSS = `
.adm .pasos.cinco{grid-template-columns:1fr}
@media(min-width:1000px){.adm .pasos.cinco{grid-template-columns:repeat(5,1fr)}}
.adm .paso.sel{display:grid;gap:11px;font-size:inherit;font-weight:inherit}
.adm .mitades.una{grid-template-columns:1fr}
`;
