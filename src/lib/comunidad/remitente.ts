import "server-only";

// QUIÉN FIRMA EL MENSAJE — «soy Cat de Nomádika», «soy Luis de Caminante».
//
// El nombre sale de la fila de equipo (staff) de quien tiene la sesión; si no
// está en el equipo, del perfil de su cuenta. Sin nombre, firma la operadora
// sola. Nunca «soy Caminante de Caminante».

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function remitenteActual(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    if (!u?.email) return null;
    const sb = createSupabaseAdminClient();
    const { data: st } = await sb.from("staff").select("nombre").ilike("email", u.email).eq("activo", true).maybeSingle();
    const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
    const nombre = (st?.nombre as string | undefined) || (meta.full_name as string | undefined) || (meta.name as string | undefined) || "";
    const pila = nombre.trim().split(/\s+/)[0] ?? "";
    return pila ? pila.charAt(0).toUpperCase() + pila.slice(1) : null;
  } catch {
    return null;
  }
}

/** «Cat de Nomádika» · «Nomádika de Caminante» · «Caminante». */
export function firmaDe(remitente: string | null, operadora: string): string {
  const op = operadora.trim() || "Caminante";
  if (remitente && remitente.toLowerCase() !== op.toLowerCase()) return `${remitente} de ${op}`;
  if (op.toLowerCase() !== "caminante") return `${op} de Caminante`;
  return op;
}
