// CSS de la pantalla «Solicitud recibida» del funnel de operadores —
// extracción VERBATIM del <style> de
// `design/operadores/dc/Operadores 3 Confirmacion.html` (Claude Design).
//
// ⚠️ ESTA HOJA FALTÓ DESDE EL PRIMER DÍA. Las otras dos pantallas del funnel
// toman todo de `opa.css` (→ `opa-css.ts`); ésta traía además un <style> propio
// dentro de su HTML, con `.opa-ok` y `.opa-oknext`, y al transcribirla sólo se
// copió el marcado. Las clases estaban en el JSX y no existían en ninguna
// hoja: la pantalla se veía sin diseño (texto oscuro, sin márgenes, la foto
// como bloque) y nadie lo notó porque el DOM estaba perfecto. Se encontró el
// 23 nov 2026 midiendo estilos computados al agregarle el alta directa.
//
// Si el diseño cambia, RE-EXTRAER del HTML (lo hace el script de abajo en el
// commit que la creó), no editar a mano.
export const OPA_OK_CSS = String.raw`
.opa-ok{position:relative;min-height:100vh;display:flex;flex-direction:column;justify-content:flex-end;color:#fff;padding:40px 20px 44px;overflow:hidden}.opa-ok>*:not(.opa-ph){position:relative;z-index:1}.opa-ok .in{max-width:760px}.opa-ok .lg{height:22px;width:auto;align-self:flex-start;margin-bottom:auto}.opa-oknext{margin-top:26px;border-top:1px solid rgba(255,255,255,.24)}.opa-oknext .r{display:flex;gap:14px;padding:15px 0;border-bottom:1px solid rgba(255,255,255,.18)}.opa-oknext .k{font-family:var(--opa-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--opa-orange);flex:0 0 92px;padding-top:3px}.opa-oknext b{display:block;font-size:16px;font-weight:600}.opa-oknext p{font-size:14.5px;line-height:1.55;color:rgba(255,255,255,.78);margin-top:2px}@media(min-width:900px){.opa-ok{padding:56px 40px 64px}.opa-ok .in{margin:0}.opa-ok .cta{display:flex;gap:16px;align-items:center}.opa-oknext .k{flex:0 0 120px}}
`;
