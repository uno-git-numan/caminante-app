"use server";

// Aprobar/rechazar solicitudes de acceso de OPERADOR. Aprobar = activar la fila
// del whitelist (is_active=true) → esa persona pasa a admin en su próxima
// request (roleForClient lo deriva). Rechazar = borrar la fila (queda como
// viajero). Cada action re-verifica isCurrentUserAdmin() — el gate del layout
// NO cubre actions invocadas directo.
import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function cleanEmail(raw: string): string | null {
  const e = String(raw || "").trim().toLowerCase();
  return e.includes("@") && e.length <= 254 ? e : null;
}

export async function approveOperador(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "No autorizado." };
  const e = cleanEmail(email);
  if (!e) return { ok: false, error: "Correo inválido." };
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("admin_whitelist").update({ is_active: true }).eq("email", e);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/caminante/admin/solicitudes");
  return { ok: true };
}

export async function rejectOperador(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "No autorizado." };
  const e = cleanEmail(email);
  if (!e) return { ok: false, error: "Correo inválido." };
  const sb = createSupabaseAdminClient();
  // Solo borra si está PENDIENTE (is_active=false) — nunca revoca a un admin
  // activo por accidente desde esta acción.
  const { error } = await sb.from("admin_whitelist").delete().eq("email", e).eq("is_active", false);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/caminante/admin/solicitudes");
  return { ok: true };
}
