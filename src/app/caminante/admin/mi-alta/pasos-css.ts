// LO QUE EL RIEL DE CINCO PASOS NECESITA Y LA LÁMINA NO TRAE (23 nov 2026).
//
// `mi-alta-css.ts` se GENERA de la lámina (`scripts/extraer-css-dc.mjs`): lo
// que se escriba ahí a mano se pierde al re-extraer. Estas reglas son nuestras
// y van aparte, después de la hoja de la lámina:
//
//   1. La lámina dibuja CUATRO pasos (`repeat(4,1fr)`). Son cinco.
//   2. El paso 02 y el 05 enseñan UNA mitad de lo que era «Armar y cobrar»:
//      la rejilla de dos columnas de `.mitades` se queda en una.
//
// ⚠️ NO «ARREGLES» `.paso.sel`. La primera versión de este archivo le ponía
// `display:grid` al paso elegido, creyendo que `.adm .sel` (la clase del
// <select>) lo descomponía. En producción el paso es `display:block` —la
// rejilla vive en su botón `.phead`— y esa regla partía el texto palabra por
// palabra. Se vio al medir estilos COMPUTADOS, no leyendo la hoja.
export const CINCO_PASOS_CSS = `
.adm .pasos.cinco{grid-template-columns:1fr}
@media(min-width:1000px){.adm .pasos.cinco{grid-template-columns:repeat(5,1fr)}}
.adm .mitades.una{grid-template-columns:1fr}
`;
