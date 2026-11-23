// DEL FORMULARIO AL PANEL (23 nov 2026).
//
// Cuando la solicitud se aprueba al llegar (`llamada.ts`), la pantalla de
// «listo» pide una contraseña y entra a su panel. El correo que dio en el paso
// 1 viaja en esta cookie —una hora, httpOnly, sólo bajo /caminante/operadores—
// para no volver a pedirlo ni ponerlo en la URL.
//
// Va en su propio archivo porque `actions.ts` es `"use server"` y de ahí sólo
// se pueden exportar acciones.
export const COOKIE_ALTA = "cam_alta_correo";

/** A dónde va al crear la cuenta: `/entrar` rutea por rol, y ya es operadora. */
export const DESTINO_ALTA = "/caminante/entrar";
