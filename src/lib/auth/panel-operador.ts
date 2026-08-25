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
  "/caminante/admin/reservas",
  "/caminante/admin/personas",
  "/caminante/admin/encuesta",
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
//   · solicitudes · operadores · payouts · facturación · proveedores · listings ·
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
  "/caminante/admin/m/",
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
