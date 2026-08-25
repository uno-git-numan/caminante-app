import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getClientSupabaseEnvOrNull } from "@/lib/supabase/env";
import { cookiesDeSesion, esSesionMuerta } from "@/lib/auth/sesion-rota";

// `cabecerasExtra` deja que el middleware inyecte cabeceras en la REQUEST que
// llega a los Server Components. Se usa para `x-ruta`: los layouts no reciben el
// pathname y el del panel lo necesita para negar por omisión las pantallas que
// un operador externo no debe ver. Es solo eso — no toca cookies ni sesión, que
// es lo delicado de este archivo.
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
    await supabase.auth.getUser();
  } catch (e) {
    if (!esSesionMuerta(e)) throw e;
    for (const nombre of cookiesDeSesion(request.cookies.getAll().map((c) => c.name))) {
      response.cookies.delete(nombre);
    }
  }

  return response;
}
