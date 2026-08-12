import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { esSesionMuerta } from "@/lib/auth/sesion-rota";

// Dos perfiles claramente separados:
//   admin     → crea/edita experiencias, cobra, gestiona. NO compra.
//   caminante → viajero: se registra, reserva/compra, ve su perfil. NO entra a /admin.
// El rol se DERIVA (no hay columna): admin = admin_whitelist activo; caminante =
// cualquier usuario autenticado que no sea admin; null = sin sesión.
export type Role = "admin" | "caminante";

// Resuelve el rol usando un cliente Supabase YA con sesión (mismo handler/acción).
// Útil justo tras un login (exchangeCodeForSession / signInWithPassword) donde las
// cookies nuevas aún no están en la request, así que reusamos esa misma instancia.
export async function roleForClient(
  supabase: SupabaseClient,
): Promise<Role | null> {
  // ⚠️ `getUser()` LANZA cuando el refresh token de la cookie ya no existe
  // («Invalid Refresh Token: Refresh Token Not Found»). Aquí nadie lo atrapaba y
  // el error subía hasta la página: la home tronaba con «Application error» y el
  // login contestaba «No pudimos completar el inicio de sesión» aunque el enlace
  // fuera nuevo. Una sesión que ya no se puede refrescar es simplemente NO HAY
  // SESIÓN — que es exactamente lo que devuelve `null`. Ver auth/sesion-rota.ts.
  let user: { email?: string | null } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (e) {
    if (!esSesionMuerta(e)) throw e;
    return null;
  }

  if (!user?.email) {
    return null;
  }

  const { data, error } = await supabase
    .from("admin_whitelist")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    // Ante duda, el menor privilegio: tratamos como caminante (NO admin).
    return "caminante";
  }

  return data ? "admin" : "caminante";
}

// Rol del usuario de la request actual (lee cookies). null si no hay sesión.
export async function getCurrentRole(): Promise<Role | null> {
  const supabase = await createSupabaseServerClient();
  return roleForClient(supabase);
}

export async function isCurrentUserAdmin() {
  return (await getCurrentRole()) === "admin";
}
