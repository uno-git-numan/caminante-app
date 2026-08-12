import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getClientSupabaseEnv } from "@/lib/supabase/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = getClientSupabaseEnv();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookieValues) {
          try {
            cookieValues.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // `setAll` was called from a Server Component, where cookies are
            // read-only. Safe to ignore: the middleware refreshes the session
            // cookie on every request. Without this guard, any logged-in user
            // loading a Server Component page (e.g. an experience page) 500s.
          }
        },
      },
    },
  );
}

/**
 * Cliente para las RUTAS DE AUTENTICACIÓN (`auth/confirm`, `auth/callback`).
 *
 * ⚠️ Diferencia con `createSupabaseServerClient`: este **ignora la sesión que
 * traiga el navegador**. No la borra — la deja de leer.
 *
 * Por qué hace falta: si la cookie que llega trae un refresh token muerto, el
 * cliente intenta refrescarla ANTES de mirar el token nuevo y `verifyOtp` /
 * `exchangeCodeForSession` **lanzan**, dejando al usuario encerrado: ni con una
 * liga mágica recién pedida podía entrar (11 y 12 ago 2026). Borrar las cookies
 * no alcanzaba: `cookies().delete()` marca la baja en la RESPUESTA, pero
 * `getAll()` sigue devolviendo las de la PETICIÓN, así que el cliente las veía
 * igual.
 *
 * ⚠️ El `code-verifier` SÍ se lee: los tokens `pkce_…` (que es lo que emite
 * Supabase hoy, también para la liga mágica) lo necesitan para el canje. Es la
 * única cookie `sb-` que pasa el filtro.
 */
export async function createSupabaseAuthClient() {
  const cookieStore = await cookies();
  const env = getClientSupabaseEnv();

  const esSesion = (n: string) =>
    n.startsWith("sb-") && n.includes("auth-token") && !n.includes("code-verifier");

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().filter((c) => !esSesion(c.name));
        },
        setAll(cookieValues) {
          try {
            cookieValues.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // igual que arriba: en un contexto de solo-lectura no rompemos
          }
        },
      },
    },
  );
}
