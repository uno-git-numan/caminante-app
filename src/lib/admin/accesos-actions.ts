"use server";

// Aprobar/rechazar solicitudes de acceso de OPERADOR.
//
// Aprobar hace DOS cosas, y antes solo hacía la primera:
//   1. Activa la fila del whitelist (is_active=true) → esa persona pasa a admin
//      en su próxima request (roleForClient lo deriva).
//   2. **La da de alta en `operators`** (`ensureOperador`). Sin ese paso entraba
//      al panel pero no existía como operador: no se le podía asignar una
//      experiencia, sus ventas no se atribuían, no aparecía en el payout y no
//      tenía perfil público. Acceso sin alta. Se detectó el 11 ago preparando
//      el primer onboarding real.
//
// Rechazar = borrar la fila del whitelist (queda como viajero). NO borra el
// operador si ya existía: puede haber ventas colgando de él.
//
// Cada action re-verifica isCurrentUserAdmin() — el gate del layout NO cubre
// actions invocadas directo.
import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureOperador } from "@/lib/operators/alta";

function cleanEmail(raw: string): string | null {
  const e = String(raw || "").trim().toLowerCase();
  return e.includes("@") && e.length <= 254 ? e : null;
}

export async function approveOperador(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "No autorizado." };
  const e = cleanEmail(email);
  if (!e) return { ok: false, error: "Correo inválido." };
  const sb = createSupabaseAdminClient();
  const { data: fila, error } = await sb
    .from("admin_whitelist")
    .update({ is_active: true })
    .eq("email", e)
    .select("email, note")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };

  // El alta como operador. El nombre sale de la nota de la solicitud si la hay;
  // si no, del correo — se corrige en el perfil, que es donde se edita.
  const nombre =
    (fila as { note?: string | null } | null)?.note?.trim() || e.split("@")[0].replace(/[._-]+/g, " ");
  const alta = await ensureOperador({
    name: nombre,
    email: e,
    notes: `Operador · acceso al panel aprobado ${new Date().toISOString().slice(0, 10)}`,
  });
  // Si el alta falla, el acceso YA quedó dado: se dice en vez de fingir que
  // todo salió bien, porque el operador entraría al panel a medias.
  if (!alta.ok) {
    return { ok: false, error: `Acceso concedido, pero el alta como operador falló: ${alta.error}` };
  }

  revalidatePath("/caminante/admin/solicitudes");
  revalidatePath("/caminante/admin/operadores");
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
