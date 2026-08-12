// Una sesión que ya no se puede refrescar NO es un error: es "no hay sesión".
//
// ⚠️ El caso real (11 ago 2026, Luis desde su iPhone): sus cookies traían un
// refresh token que Supabase ya no reconocía. Cada render del servidor intentaba
// refrescarlo y `getUser()` lanzaba
//
//     AuthApiError: Invalid Refresh Token: Refresh Token Not Found
//
// Como nadie lo atrapaba, el error subía hasta la página. Síntomas, los dos a la
// vez y sin relación aparente: la home mostraba «Application error: a
// client-side exception», y el login contestaba «No pudimos completar el inicio
// de sesión» incluso con un enlace mágico recién pedido — porque el callback
// tropezaba con la cookie vieja ANTES de canjear el código nuevo.
//
// Lo peor es que se realimenta: mientras la cookie muerta siga ahí, cada intento
// de entrar vuelve a fallar. Por eso no basta con no romperse; hay que BORRARLA.

/** ¿Este error es «tu sesión ya no sirve» y no un problema de verdad? */
export function esSesionMuerta(e: unknown): boolean {
  const msg =
    e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : String(e ?? "");
  return /refresh token|session[_ ]?not[_ ]?found|jwt expired|invalid claim/i.test(msg);
}

/**
 * Nombres de las cookies de sesión de Supabase presentes en la request.
 *
 * El adaptador SSR parte el token en varias (`...-auth-token.0`, `.1`, …) cuando
 * no cabe en una, así que se borran TODAS las que empiecen con `sb-`; dejar una
 * mitad es tan inservible como dejarlas completas.
 */
export function cookiesDeSesion(nombres: string[]): string[] {
  return nombres.filter(
    (n) =>
      n.startsWith("sb-") &&
      n.includes("auth-token") &&
      // ⚠️ JAMÁS el verificador de PKCE. Se llama
      // `sb-<ref>-auth-token-code-verifier`, o sea que CAE en el filtro de
      // arriba — y es justo lo que `exchangeCodeForSession` necesita para
      // canjear el código que Google acaba de devolver. Borrarlo un instante
      // antes deja el login con «No pudimos completar el inicio de sesión»,
      // que es exactamente el bug que este archivo venía a arreglar: lo
      // introduje yo el 11 ago al escribir `limpiarSesion` sin esta excepción.
      // Hay una regla en scripts/invariantes.mjs que impide que vuelva a pasar.
      !n.includes("code-verifier"),
  );
}

/**
 * Borra las cookies de sesión de la request. Solo funciona donde SÍ se pueden
 * escribir cookies: route handlers y server actions (en un Server Component el
 * adaptador se las traga, por diseño).
 *
 * Se llama al ENTRAR por un camino de login (`auth/confirm`, `auth/callback`):
 * ahí se va a establecer una sesión nueva de todos modos, así que la vieja no
 * sirve para nada — y si está podrida, tumba el canje del token nuevo antes de
 * que empiece. Era justo lo que pasaba: un enlace mágico recién pedido
 * contestaba «No pudimos completar el inicio de sesión».
 */
export async function limpiarSesion(): Promise<void> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  for (const nombre of cookiesDeSesion(store.getAll().map((c) => c.name))) {
    try {
      store.delete(nombre);
    } catch {
      // contexto de solo-lectura: no pasa nada, el guard de arriba evita el crash
    }
  }
}
