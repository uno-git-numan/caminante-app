import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getClientSupabaseEnvOrNull } from "@/lib/supabase/env";
import { cookiesDeSesion, esSesionMuerta } from "@/lib/auth/sesion-rota";

// `cabecerasExtra` deja que el middleware inyecte cabeceras en la REQUEST que
// llega a los Server Components. Se usa para `x-ruta`: los layouts no reciben el
// pathname y el del panel lo necesita para negar por omisión las pantallas que
// un operador externo no debe ver. Es solo eso — no toca cookies ni sesión, que
// es lo delicado de este archivo.
// ⏱️ EL RELOJ. Refrescar la cookie es lo ÚNICO que hace este middleware, y es
// una mejora, no un requisito: si Supabase no contesta a tiempo, la respuesta
// correcta es servir la página con la cookie tal como venía —no dejar al usuario
// esperando. Sin este límite pasa lo que pasó el 28 ago 2026: Supabase declaró
// «API Gateway: degraded performance» y `getUser()` dejó de contestar; como el
// middleware corre en CADA request, el sitio entero devolvió 504
// MIDDLEWARE_INVOCATION_TIMEOUT a los 25s **para todo el que tuviera sesión**.
// La home pública incluida. Un visitante anónimo entraba perfecto y Luis no
// podía abrir su propio panel.
//
// Que la caída de un tercero se lleve puesto el sitio es defecto NUESTRO, no
// suyo: el middleware tenía una dependencia dura donde sólo necesitaba una
// oportunista. No refrescar una vez no rompe nada —el token dura minutos y la
// siguiente request lo intenta de nuevo—; devolver 504 sí.
//
// 5s es holgado: la llamada sana tarda decenas de milisegundos. Y OJO con el
// otro camino: si se acaba el tiempo NO se borran las cookies. Lento no es lo
// mismo que muerto, y confundirlos desloguearía a todo el mundo cada vez que
// Supabase tosa.
const LIMITE_MS = 5_000;
const SE_TARDO = Symbol("supabase-auth-lento");

function conLimite<T>(promesa: Promise<T>, ms: number): Promise<T> {
  let reloj: ReturnType<typeof setTimeout>;
  return Promise.race([
    promesa.finally(() => clearTimeout(reloj)),
    new Promise<never>((_, reject) => {
      reloj = setTimeout(() => reject(SE_TARDO), ms);
    }),
  ]);
}

export async function updateSession(
  request: NextRequest,
  cabecerasExtra?: Record<string, string>,
) {
  const headers = new Headers(request.headers);
  for (const [k, v] of Object.entries(cabecerasExtra ?? {})) headers.set(k, v);

  const response = NextResponse.next({
    request: { headers },
  });

  const env = getClientSupabaseEnvOrNull();
  if (!env) {
    return response;
  }

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookieValues) {
          // ⚠️ El middleware JAMÁS escribe el `code-verifier` de PKCE. Su trabajo
          // es refrescar la sesión; el verificador lo pone la acción que arranca
          // Google/Apple en ESTE MISMO request. Con una sesión muerta en la
          // cookie, auth-js llama `_removeSession`, que también «borra» el
          // verificador, y la cabecera de borrado del middleware se montaba
          // sobre la de la acción que lo acababa de poner: Google regresaba a
          // «PKCE code verifier not found» (iPhone de Luis, 7 nov 2026).
          cookieValues
            .filter(({ name }) => !name.includes("code-verifier"))
            .forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
        },
      },
    },
  );

  // ⚠️ `getUser()` LANZA si el refresh token de la cookie ya no existe. El
  // middleware corre en CADA request, así que sin este try/catch un usuario con
  // la sesión podrida llena los logs de «Invalid Refresh Token» y nunca sale del
  // hoyo. Aquí sí podemos escribir cookies (es lo único que puede), así que este
  // es EL lugar donde la sesión muerta se cura: se borra y el usuario queda
  // simplemente deslogueado, que es la verdad.
  // ⚠️ Desde auth-js 2.1xx `getUser()` ya NO lanza con el refresh token muerto:
  // lo DEVUELVE en `error` (7 nov 2026, medido contra los logs: «Invalid
  // Refresh Token» en cada request del iPhone de Luis y la cookie seguía ahí).
  // Se atienden los dos caminos, el que lanza y el que devuelve.
  let muerta = false;
  try {
    const { error } = await conLimite(supabase.auth.getUser(), LIMITE_MS);
    muerta = !!error && esSesionMuerta(error);
  } catch (e) {
    if (e === SE_TARDO) return response; // ver abajo
    if (!esSesionMuerta(e)) throw e;
    muerta = true;
  }
  if (muerta) {
    for (const nombre of cookiesDeSesion(request.cookies.getAll().map((c) => c.name))) {
      matarCookie(response, nombre, request);
    }
  }

  return response;
}

/**
 * Borrar una cookie sólo surte efecto si el borrado trae el MISMO path y domain
 * con que se puso. La de sesión se pone hoy con `Path=/` y sin domain, pero una
 * cookie vieja de otra época (otro path, el dominio explícito) sobrevive a ese
 * borrado y deja al teléfono con la sesión podrida para siempre. Se tiran las
 * variantes plausibles: cuesta tres cabeceras y no hay nada que perder.
 */
function matarCookie(response: NextResponse, nombre: string, request: NextRequest) {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(":")[0];
  // ⚠️ `response.cookies.set` guarda UNA entrada por nombre: cuatro variantes
  // se colapsaban en la última. Las cabeceras se agregan a mano, una por una.
  const borrar = (attrs: string) => response.headers.append("set-cookie", `${nombre}=; ${attrs}; Max-Age=0; SameSite=Lax`);
  borrar("Path=/");
  borrar("Path=/caminante");
  if (host && !host.includes("localhost")) {
    borrar(`Path=/; Domain=${host}`);
    // ⚠️ numan y Caminante comparten el proyecto de Supabase, así que la
    // cookie de sesión se llama IGUAL en los dos. Una puesta para el dominio
    // padre (numanhub.com) llega a caminante.numanhub.com y sólo se borra
    // nombrando ese mismo dominio. Era la sesión muerta que el iPhone de Luis
    // no soltaba (7 nov 2026).
    const padre = host.split(".").slice(1).join(".");
    if (padre.includes(".")) borrar(`Path=/; Domain=${padre}`);
  }
}
