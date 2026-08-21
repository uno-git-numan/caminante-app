"use server";

// LA BANDEJA DE SOLICITUDES DE OPERADOR — el tramo que faltaba.
//
// El formulario público (`/caminante/operadores/aplicar`) llevaba días vivo
// guardando en `operator_applications`, y NINGÚN componente del panel leía esa
// tabla: la solicitud entraba, salía su correo de acuse, y del lado de Luis no
// aparecía en ninguna pantalla. Se salvó de costar una operadora real porque la
// tabla seguía en cero cuando se detectó (20 ago 2026).
//
// El recorrido tiene cuatro escalones, en el orden que pidió Luis:
//   pending  → llega la solicitud
//   calling  → se agenda la videollamada (Meet)
//   docs     → se le pide el expediente por link privado con token
//   approved → alta en `operators` + ACCESO AL PANEL
//
// ⚠️ LA DIFERENCIA QUE CUESTA SI SE CLONA MAL. `approveEmbajador` crea la fila
// en `operators` y NADA MÁS: un embajador vende, no opera, y a propósito no
// entra al panel. Aprobar a un OPERADOR tiene que hacer las DOS cosas —crear el
// operador y activar su `admin_whitelist`—, porque sin lo segundo queda
// «aprobado» y sin poder entrar. Si algún día alguien copia este archivo desde
// el de embajadores, esto es lo que se le va a olvidar.
//
// Cada action re-verifica admin: el gate del layout no cubre invocación directa.

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureOperador } from "@/lib/operators/alta";
import { marcaLista } from "@/lib/operators/marca";
import type { OperatorBranding } from "@/lib/operators/branding";
import {
  emailInvitacionLlamada,
  emailPedirExpediente,
  emailBienvenidaOperador,
  emailRechazoOperador,
} from "@/lib/operadores/emails";

const PANEL = "/caminante/admin/solicitudes";
const SITIO = "https://caminante.numanhub.com";

export type Res = { ok: boolean; error?: string };

type App = {
  id: string;
  nombre_operadora: string;
  responsable: string;
  email: string;
  status: string;
  branding: OperatorBranding | null;
  operator_id: string | null;
};

/** Carga la solicitud si está en alguno de los estados que permiten avanzar. */
async function cargar(id: string, permitidos: string[]): Promise<App | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("operator_applications")
    .select("id, nombre_operadora, responsable, email, status, branding, operator_id")
    .eq("id", id)
    .maybeSingle();
  const app = data as App | null;
  return app && permitidos.includes(app.status) ? app : null;
}

// ── 1 · Agendar la videollamada ──────────────────────────────────────────────
// A propósito NO integramos Google Calendar. El problema real es tener el link
// a la mano el día de la entrevista, y eso se resuelve pegando la liga que
// genera `meet.google.com/new` en un campo. Montar OAuth de Calendar para un
// puñado de solicitudes al mes sería trabajo tirado; cuando haya volumen se
// automatiza y este campo se llena solo.
export async function agendarLlamada(
  id: string,
  meetUrl: string,
  cuandoISO: string,
  mensaje: string,
): Promise<Res> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Solo admin." };
  const app = await cargar(id, ["pending", "calling"]);
  if (!app) return { ok: false, error: "La solicitud ya no admite agendar." };

  const url = (meetUrl || "").trim();
  if (!/^https:\/\/meet\.google\.com\/[a-z-]{3,}/i.test(url)) {
    return { ok: false, error: "Pega una liga de Google Meet válida." };
  }
  const cuando = new Date(cuandoISO);
  if (Number.isNaN(cuando.getTime())) return { ok: false, error: "Fecha inválida." };

  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("operator_applications")
    .update({
      status: "calling",
      llamada_meet_url: url,
      llamada_at: cuando.toISOString(),
      llamada_enviada_at: new Date().toISOString(),
    })
    .eq("id", id)
    .in("status", ["pending", "calling"]);
  if (error) {
    console.error("agendarLlamada:", error);
    return { ok: false, error: "No se pudo guardar la llamada." };
  }

  await emailInvitacionLlamada(app.email, app.responsable, url, mensaje).catch((e) =>
    console.error("invitacion llamada:", e),
  );
  revalidatePath(PANEL);
  return { ok: true };
}

// ── 2 · Pedir el expediente ──────────────────────────────────────────────────
// Qué se le pide cambia por actividad —a una operadora de montaña no se le pide
// certificación de buceo—, por eso la lista viaja en jsonb y no en una tabla
// catálogo. El link es TOKENIZADO y expira: los papeles de una empresa no
// pueden quedar tras una URL adivinable y eterna.
export async function pedirExpediente(id: string, docs: string[], mensaje: string): Promise<Res> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Solo admin." };
  const app = await cargar(id, ["pending", "calling", "docs"]);
  if (!app) return { ok: false, error: "La solicitud ya no admite pedir documentos." };

  const lista = docs.map((d) => d.trim()).filter(Boolean).slice(0, 12);
  if (!lista.length) return { ok: false, error: "Elige al menos un documento." };

  const token = randomBytes(24).toString("base64url");
  const expira = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000); // 21 días
  const url = `${SITIO}/caminante/operadores/expediente/${token}`;

  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("operator_applications")
    .update({
      status: "docs",
      expediente_token: token,
      expediente_expira: expira.toISOString(),
      expediente: lista.map((nombre) => ({ nombre, estado: "pendiente", archivo: null })),
    })
    .eq("id", id)
    .in("status", ["pending", "calling", "docs"]);
  if (error) {
    console.error("pedirExpediente:", error);
    return { ok: false, error: "No se pudo generar el expediente." };
  }

  await emailPedirExpediente(app.email, app.responsable, url, lista.length, mensaje).catch((e) =>
    console.error("pedir expediente:", e),
  );
  revalidatePath(PANEL);
  return { ok: true, error: undefined };
}

// ── 3 · Aprobar ──────────────────────────────────────────────────────────────
export async function aprobarOperadorApp(id: string): Promise<Res> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Solo admin." };
  const app = await cargar(id, ["pending", "calling", "docs"]);
  if (!app) return { ok: false, error: "La solicitud ya fue decidida." };

  const alta = await ensureOperador({
    name: app.nombre_operadora,
    email: app.email,
    notes: `Operador aprobado desde solicitud ${id.slice(0, 8)} · ${new Date().toISOString().slice(0, 10)}`,
  });
  if (!alta.ok) return { ok: false, error: alta.error };

  const sb = createSupabaseAdminClient();

  // La marca declarada al aplicar se copia al operador — pero NUNCA pisa una
  // que ya exista: si alguien ya la configuró desde el panel, esa manda.
  if (marcaLista(app.branding)) {
    const { data: op } = await sb
      .from("operators")
      .select("branding")
      .eq("id", alta.operatorId)
      .maybeSingle();
    if (!(op as { branding: unknown } | null)?.branding) {
      await sb.from("operators").update({ branding: app.branding }).eq("id", alta.operatorId);
    }
  }

  // ⚠️ EL PASO QUE NO ESTÁ EN EL FLUJO DE EMBAJADORES: sin esta fila activa,
  // queda aprobado y no puede entrar al panel.
  const { error: wlErr } = await sb
    .from("admin_whitelist")
    .upsert({ email: app.email, is_active: true }, { onConflict: "email" });
  if (wlErr) {
    console.error("aprobarOperadorApp whitelist:", wlErr);
    return { ok: false, error: "Se creó el operador pero no se pudo abrir su acceso al panel." };
  }

  const { error } = await sb
    .from("operator_applications")
    .update({ status: "approved", operator_id: alta.operatorId, decided_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["pending", "calling", "docs"]);
  if (error) {
    console.error("aprobarOperadorApp update:", error);
    return { ok: false, error: "No se pudo cerrar la solicitud." };
  }

  await emailBienvenidaOperador(app.email, app.responsable).catch((e) => console.error("bienvenida:", e));
  revalidatePath(PANEL);
  return { ok: true };
}

// ── 4 · Rechazar ─────────────────────────────────────────────────────────────
export async function rechazarOperadorApp(id: string, motivo: string): Promise<Res> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Solo admin." };
  const app = await cargar(id, ["pending", "calling", "docs"]);
  if (!app) return { ok: false, error: "La solicitud ya fue decidida." };

  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("operator_applications")
    .update({
      status: "rejected",
      motivo_rechazo: (motivo || "").trim().slice(0, 500) || null,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id)
    .in("status", ["pending", "calling", "docs"]);
  if (error) {
    console.error("rechazarOperadorApp:", error);
    return { ok: false, error: "No se pudo actualizar la solicitud." };
  }

  await emailRechazoOperador(app.email, app.responsable).catch((e) => console.error("rechazo:", e));
  revalidatePath(PANEL);
  return { ok: true };
}
