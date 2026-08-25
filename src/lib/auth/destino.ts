// A DÓNDE VA CADA QUIEN DESPUÉS DE AUTENTICARSE — en UN solo lugar.
//
// Esta función existe por un incidente del 25 ago 2026, y vale la pena contarlo
// entero porque es el mismo error que este archivo evita a futuro.
//
// Al agregar el tercer rol («operador») se actualizó quién puede entrar y qué ve
// adentro, pero el DESTINO estaba copiado a mano en cinco archivos, y los cinco
// solo conocían dos roles. El patrón era siempre el mismo:
//
//     role === "admin" ? "/caminante/admin" : "/caminante/perfil"
//
// …o, peor, en `/caminante/entrar`: dos `if` y un `redirect` al login como
// último renglón. Un operador no entraba en ningún `if`, así que caía al login.
// Y `login/page.tsx` tampoco lo reconocía, así que no lo sacaba de ahí.
//
// Resultado, con una operadora real enfrente: entraba con Google, elegía su
// cuenta, daba permiso… y volvía a la pantalla de login. Una y otra vez. En la
// base su `last_sign_in_at` se actualizaba en cada vuelta —el login SÍ
// funcionaba— pero el redirect la regresaba al principio. Ningún error, ninguna
// alerta: un bucle silencioso.
//
// Por eso el destino vive aquí y los cinco lugares lo llaman. Si mañana aparece
// un cuarto rol, TypeScript obliga a decidir su destino en este archivo, y con
// eso queda decidido en todas las puertas a la vez.

import type { Role } from "@/lib/auth/authorization";

/**
 * Destino canónico para un rol recién autenticado.
 *
 * `telefono` solo cambia el destino de la CASA, que tiene panel-app propio.
 *
 * ⚠️ El operador va SIEMPRE al panel de escritorio, incluso desde el teléfono.
 * `/caminante/admin/m` está fuera de su lista blanca (su pestaña «Más» trae
 * solicitudes, el catálogo de operadores y el cobro), así que mandarlo ahí sería
 * cambiar un bucle por otro: /m → rebote → /m.
 */
export function destinoPorRol(role: Role | null, opts?: { telefono?: boolean }): string {
  switch (role) {
    case "admin":
      return opts?.telefono ? "/caminante/admin/m" : "/caminante/admin";
    case "operador":
      return "/caminante/admin";
    case "caminante":
      return "/caminante/perfil";
    default:
      return "/caminante/login?next=/caminante/entrar";
  }
}

/** ¿Este rol tiene panel? Lo usan el nav público y el login para no rebotar. */
export function tienePanel(role: Role | null): boolean {
  return role === "admin" || role === "operador";
}
