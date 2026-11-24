// AJUSTES A LAS CARPETAS DEL EXPEDIENTE (24 nov 2026) — aditivos.
//
// La hoja `expediente-css.ts` es generada desde la lámina y no se toca a mano.
// Esto son tres correcciones de Luis recorriendo sus documentos como
// operadora, y van aparte:
//
// · «La flechita más visible para desplegar.» El triángulo era de 10 px en
//   color arena sobre blanco: no se leía como botón. Ahora es un círculo con
//   borde, del tamaño de un dedo.
// · «El texto debe estirarse y cubrir el espacio en blanco.» `.gnhint` trae
//   `max-width:52ch`, pensado para una nota al pie; dentro de una carpeta que
//   ocupa todo el ancho dejaba el párrafo arrinconado a la izquierda.
// · «Agregar una actividad» es una carpeta más (`.actv.mas`), cerrada.
export const EXPEDIENTE_AJUSTES_CSS = `
.adm .actv>.ah .rt .chev2{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;border:1px solid var(--line);background:#fff;color:var(--charcoal);font-size:15px;line-height:1;margin-left:2px;flex:0 0 auto}
.adm .actv>.ah:hover .rt .chev2{border-color:var(--olive);color:var(--olive-d)}
.adm .actv.open>.ah .rt .chev2{background:var(--charcoal);border-color:var(--charcoal);color:#fff}
.adm .actv .ab .gnhint{max-width:none}
.adm .actv.mas>.ah .g b{font-weight:500}
.adm .actv.mas>.ab{padding-top:14px}
.adm .actv.mas>.ab>.gnhint{margin:0 0 12px}
`;
