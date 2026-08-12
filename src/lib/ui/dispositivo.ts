/**
 * ¿La petición viene de un teléfono?
 *
 * ⚠️ REGLA: olfatear el user-agent está PROHIBIDO en las páginas PÚBLICAS. El
 * sitio móvil se resuelve con CSS (`PUB_CSS_MOVIL` envuelve todo en una media
 * query y `PUB_SWAP_CSS` esconde el marcado de escritorio) precisamente porque
 * una misma URL debe devolver SIEMPRE el mismo documento — si no, el caché de
 * Vercel serviría la versión de teléfono a una computadora.
 *
 * Aquí es seguro y correcto por dos razones, y ambas deben seguir siendo
 * ciertas en cualquier lugar nuevo que llame a esta función:
 *   1. la ruta es `force-dynamic` (nunca se cachea), y
 *   2. lo único que decide es a DÓNDE redirigir, no qué HTML emitir.
 *
 * Las tablets quedan fuera a propósito: en un iPad cabe el panel de escritorio
 * completo y se lee mejor que la app de teléfono.
 */
export function esTelefono(ua: string): boolean {
  return /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua);
}

/** Query que fuerza el panel de escritorio desde un teléfono: `?escritorio=1`. */
export const FORZAR_ESCRITORIO = "escritorio";
