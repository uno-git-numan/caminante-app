// Nombre y vida de la cookie de atribución. En archivo aparte porque un módulo
// `"use server"` solo puede exportar funciones async, no constantes — mismo
// motivo que `auth/op-intent.ts`.

export const ATRIB_COOKIE = "cam_atrib";

/**
 * PRIMER TOQUE a 60 días (decisión de Luis, 13 ago 2026).
 *
 * Primer toque y no último: premia a quien TRAJO al cliente, que es lo que se
 * le pide al operador. Si él lo introdujo y semanas después el cliente vuelve
 * por el Instagram de Caminante, el crédito sigue siendo suyo.
 *
 * 60 y no 30 (el estándar de afiliados): un viaje de naturaleza se decide en
 * semanas, no en días.
 */
export const ATRIB_DIAS = 60;
