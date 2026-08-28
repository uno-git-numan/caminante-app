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
          cookieValues.forEach(({ name, value, options }) => {
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
  try {
    await conLimite(supabase.auth.getUser(), LIMITE_MS);
  } catch (e) {
    if (e === SE_TARDO) return response; // ver abajo
    if (!esSesionMuerta(e)) throw e;
    for (const nombre of cookiesDeSesion(request.cookies.getAll().map((c) => c.name))) {
      response.cookies.delete(nombre);
    }
  }

  return response;
}
