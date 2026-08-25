import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { esSesionMuerta } from "@/lib/auth/sesion-rota";

// TRES perfiles, no dos:
//   admin     → la casa. Crea/edita experiencias, cobra, gestiona TODO. NO compra.
//   operador  → socio externo con `operators.panel_activo` (0042). Entra al
//                MISMO panel, pero solo ve lo suyo.
//   caminante → viajero: se registra, reserva/compra, ve su perfil. NO entra a /admin.
//
// El rol se DERIVA (no hay columna): admin = `admin_whitelist` activo; operador =
// fila viva en `operators` con ese correo; caminante = autenticado que no es
// ninguno de los dos; null = sin sesión.
//
// ⚠️ `isCurrentUserAdmin()` SIGUE SIGNIFICANDO «LA CASA», y eso es a propósito.
// Lo llaman dos docenas de server actions y el día que se le hiciera significar
// «puede entrar al panel» las abriría TODAS al operador de un plumazo, sin que
// nadie revisara ninguna. Con este significado intacto, un operador no puede
// hacer nada hasta que alguien abra esa puerta a mano y con alcance. La lista de
// lo que sí puede vive en `lib/auth/alcance.ts` y en el layout del panel.
export type Role = "admin" | "operador" | "caminante";

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

  const email = user.email.toLowerCase();

  const { data, error } = await supabase
    .from("admin_whitelist")
    .select("email")
    .eq("email", email)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    // Ante duda, el menor privilegio: tratamos como caminante (NO admin).
    return "caminante";
  }
  // LA CASA MANDA — antes que operador. La fila «Numan · Caminante» de
  // `operators` trae el correo de Luis; sin esta precedencia se vería su propio
  // panel filtrado a sí mismo.
  if (data) return "admin";

  // ¿Operador vivo? Se pregunta con el MISMO cliente que trae la sesión, no con
  // el de servicio: este camino corre justo después del login, cuando las
  // cookies nuevas todavía no están en la request.
  const { data: op, error: opErr } = await supabase
    .from("operators")
    .select("id")
    .eq("email", email)
    .eq("panel_activo", true)
    .maybeSingle();
  if (opErr) return "caminante";

  return op ? "operador" : "caminante";
}

// Rol del usuario de la request actual (lee cookies). null si no hay sesión.
export async function getCurrentRole(): Promise<Role | null> {
  const supabase = await createSupabaseServerClient();
  return roleForClient(supabase);
}

/** ¿Es LA CASA? Este es el gate de todo lo que administra la plataforma. */
export async function isCurrentUserAdmin() {
  return (await getCurrentRole()) === "admin";
}

/**
 * ¿Puede pisar el panel? Casa u operador.
 *
 * Solo lo usa el layout de `/caminante/admin`. Que alguien pueda ENTRAR no dice
 * nada de qué pantallas ve ni de qué filas: eso lo deciden la lista de rutas del
 * layout y el alcance de cada consulta.
 */
export async function puedeEntrarAlPanel(): Promise<boolean> {
  const r = await getCurrentRole();
  return r === "admin" || r === "operador";
}
