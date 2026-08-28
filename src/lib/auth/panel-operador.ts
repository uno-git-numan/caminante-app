// QUÉ PANTALLAS DEL PANEL VE UN OPERADOR EXTERNO.
//
// Lista blanca, y eso es el punto entero del archivo. La alternativa —una lista
// negra de lo prohibido— se cae abierta: la pantalla que alguien agregue el mes
// que viene no estaría en la lista y nacería visible para todos los operadores,
// sin que nadie lo decidiera. Aquí nace CERRADA y hay que abrirla a mano.
//
// El panel tiene 31 rutas. Trece son de administración de la plataforma —el
// dinero global, la facturación, las solicitudes de otros operadores, los
// convenios, el cobro manual— y no tienen ninguna lectura sensata «filtrada a lo
// suyo»: simplemente no son suyas. No están aquí.
//
// ⚠️ Estar en esta lista NO alcanza. Da permiso de ver la PANTALLA; qué filas
// trae esa pantalla lo decide el alcance de cada consulta (`lib/auth/alcance.ts`).
// Son dos cerrojos independientes a propósito: si uno falla, el otro sigue.

/** Rutas exactas. */
const EXACTAS = new Set<string>([
  "/caminante/admin", // Panorama
  "/caminante/admin/eventos",
  "/caminante/admin/pagos",
  "/caminante/admin/comunidad",
  "/caminante/admin/encuesta",
  "/caminante/admin/salidas", // la línea de tiempo de SUS salidas, ya podada
  "/caminante/admin/comunicacion",
  "/caminante/admin/experiencias/nueva",
]);

// FUERA a propósito, y conviene saber por qué:
//
//   · `/admin/recursos` (y `/admin/dinero`, que redirige ahí) — es la cascada de
//     RENTABILIDAD: costos por salida, proveedores con nombre, egresos, el
//     payout de cada operador y el cobro manual. Aunque se filtrara a sus
//     salidas seguiría siendo la estructura de costos y el margen de la casa.
//     Su dinero lo ve en Panorama, ya podado: ingresos, últimos pagos e
//     ingresos por experiencia.
//   · `/admin/m` (panel-app móvil) — su pestaña «Más» trae solicitudes, el
//     catálogo de operadores y el cobro. Hasta que eso esté podado, el operador
//     entra por el panel de escritorio. Ojo: el índice del panel redirige al
//     panel-app en teléfono, y ese redirect quedó condicionado a la casa — si no,
//     sería un bucle.
//
//     ⚠️ Y OJO CON EL PREFIJO. `/caminante/admin/m/` estuvo un rato en la lista
//     de PREFIJOS de abajo mientras la ruta exacta estaba bloqueada: el resultado
//     era que `/admin/m` rebotaba pero `/admin/m/loquesea` pasaba. Hoy no filtró
//     nada porque el panel-app es UNA sola ruta (todo lo demás da 404), pero es
//     justo la forma en que una lista blanca deja de serlo. Si algún día el
//     panel-app crece en sub-rutas, el prefijo se agrega DESPUÉS de podarlas, no
//     antes.
//   · La VISTA «Solicitudes» de Comunidad — aprobar operadoras y embajadores es
//     de la casa. Aquí no alcanzaba con la lista blanca: Comunidad SÍ es del
//     operador (su CRM y su gente, ya podados por `operadorDelAlcance`) y la
//     bandeja es una vista adentro, no una ruta. El corte está en la página:
//     con rol operador la bandeja ni se consulta ni se pinta. Es el mismo
//     principio de siempre —podar en el origen, no esconder con CSS— aplicado
//     una capa más adentro porque la URL ya no distingue.
//   · operadores · payouts · facturación · proveedores · listings ·
//     soporte · cobro · accesos · social-cola — administración de la plataforma.

/** Prefijos con parámetro: `/caminante/admin/eventos/<slug>`, etc. */
const PREFIJOS = [
  "/caminante/admin/eventos/",
  "/caminante/admin/experiencias/",
  "/caminante/admin/roster/",
  "/caminante/admin/kit/",
  "/caminante/admin/social/",
  "/caminante/admin/preview/",
  "/caminante/admin/print/",
];

/**
 * ¿Un operador puede pisar esta ruta?
 *
 * Sin ruta devuelve `false`: si el middleware no alcanzó a poner `x-ruta`, la
 * respuesta segura es «no». Fallar cerrado, no abierto.
 */
export function rutaDeOperador(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const p = pathname.replace(/\/+$/, "") || "/";
  if (EXACTAS.has(p)) return true;
  return PREFIJOS.some((pre) => pathname.startsWith(pre));
}
