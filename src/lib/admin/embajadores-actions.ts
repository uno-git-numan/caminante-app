"use server";

// Aprobación/rechazo de aplicaciones de EMBAJADOR (panel de Solicitudes).
// Cada action re-verifica admin (el gate del layout no cubre invocación
// directa — mismo patrón que accesos-actions).
//
// APROBAR = dar de alta al embajador como fila de `operators`: así se monta en
// el sistema de atribución de ventas con comisión congelada que YA existe
// (0016) y en el perfil público opcional (0020). `commission_pct` se deja NULL
// a propósito: esa columna es el % que retiene la plataforma por venta, y la
// economía del embajador es otra (30% de la utilidad neta según hoja de
// costeo, pactada en el convenio) — queda documentada en `notes`.
import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emailBienvenidaEmbajador, emailRechazoAplicacion } from "@/lib/embajadores/emails";

const PANEL = "/caminante/admin/solicitudes";

type Res = { ok: boolean; error?: string };

type AppRow = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string | null;
  profile_kind: string;
  status: string;
};

async function cargarPendiente(id: string): Promise<AppRow | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("ambassador_applications")
    .select("id, full_name, email, whatsapp, profile_kind, status")
    .eq("id", id)
    .maybeSingle();
  const app = data as AppRow | null;
  return app && app.status === "pending" ? app : null;
}

export async function approveEmbajador(id: string): Promise<Res> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Solo admin." };
  const app = await cargarPendiente(id);
  if (!app) return { ok: false, error: "La aplicación ya no está pendiente." };

  const sb = createSupabaseAdminClient();

  // Operador: reusa si el correo ya existe (idempotente — reintentos o alguien
  // dado de alta a mano no duplican), si no lo crea. La atribución de ventas y
  // el payout del panel de Dinero cuelgan de esta fila.
  const { data: existente } = await sb
    .from("operators")
    .select("id")
    .eq("email", app.email)
    .maybeSingle();
  let operatorId = (existente as { id: string } | null)?.id ?? null;
  if (!operatorId) {
    const { data: nuevo, error: insErr } = await sb
      .from("operators")
      .insert({
        name: app.full_name,
        email: app.email,
        commission_pct: null, // % de plataforma no aplica: el trato es 30% de utilidad (convenio)
        notes: `Embajador (${app.profile_kind}) · 30% de utilidad neta según hoja de costeo · alta ${new Date().toISOString().slice(0, 10)}`,
      })
      .select("id")
      .single();
    if (insErr || !nuevo) {
      console.error("approveEmbajador operator:", insErr);
      return { ok: false, error: "No se pudo crear el operador." };
    }
    operatorId = (nuevo as { id: string }).id;
  }

  const { error: updErr } = await sb
    .from("ambassador_applications")
    .update({ status: "approved", operator_id: operatorId, decided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending"); // nunca pisar una decisión ya tomada
  if (updErr) {
    console.error("approveEmbajador update:", updErr);
    return { ok: false, error: "No se pudo actualizar la aplicación." };
  }

  // Correo best-effort: la aprobación ya quedó; un fallo de correo no la tira.
  await emailBienvenidaEmbajador(app.email, app.full_name).catch((e) => console.error("bienvenida:", e));

  revalidatePath(PANEL);
  return { ok: true };
}

export async function rejectEmbajador(id: string): Promise<Res> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Solo admin." };
  const app = await cargarPendiente(id);
  if (!app) return { ok: false, error: "La aplicación ya no está pendiente." };

  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("ambassador_applications")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending");
  if (error) {
    console.error("rejectEmbajador:", error);
    return { ok: false, error: "No se pudo actualizar la aplicación." };
  }

  await emailRechazoAplicacion(app.email, app.full_name).catch((e) => console.error("rechazo:", e));

  revalidatePath(PANEL);
  return { ok: true };
}
