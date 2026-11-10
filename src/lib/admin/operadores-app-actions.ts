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
//   (docs    → «pedir el expediente» por link con token: QUITADO el 9 nov
//              2026. La liga daba 404 y el expediente vive en Mi alta, que se
//              abre al aprobar. Las solicitudes viejas en `docs` se siguen
//              pudiendo aprobar o rechazar.)
//   approved → alta en `operators`, y con eso su panel
//
// ⚠️ APROBAR YA NO REPARTE LLAVES DE LA CASA. Antes este paso también prendía
// `admin_whitelist`, que no tiene niveles: el operador externo acababa viendo
// las 31 pantallas, el ledger y los datos médicos de todos. Hoy el acceso se
// DERIVA de existir en `operators` con `active = true`, y lo que ve está podado
// a sus experiencias. Crear la fila es todo lo que hay que hacer; si alguien
// vuelve a agregar aquí un upsert a `admin_whitelist`, está reabriendo el hoyo.
//
// (Un embajador vende y no opera: `approveEmbajador` crea la fila con
// `active` en su valor por omisión y ese sí es el mismo camino. La diferencia
// entre los dos ya no está en el acceso sino en el convenio.)
//
// Cada action re-verifica admin: el gate del layout no cubre invocación directa.

import { revalidatePath } from "next/cache";
import { desdeHoraLocal } from "@/lib/fecha/zona";
import { puedeOnboarding } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emailInvitacionLlamada, emailRechazoOperador } from "@/lib/operadores/emails";
import { tomarSiLibre, cerrarAtribucion } from "@/lib/equipo/atribucion";
import { PANEL, aprobarSolicitud, avisar, cargar, type Res } from "./aprobar-solicitud";

export type { Res };

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
  if (!(await puedeOnboarding())) return { ok: false, error: "Solo la casa o el equipo de onboarding." };
  const app = await cargar(id, ["pending", "calling"]);
  if (!app) return { ok: false, error: "La solicitud ya no admite agendar." };

  // ⚠️ NO se exige Google Meet. Lo exigía, y eso rebotaba una liga de Zoom, de
  // Whereby o de una sala propia sin más razón que la costumbre. Lo que importa
  // es que sea una dirección segura a la que se pueda entrar.
  const url = (meetUrl || "").trim();
  let host = "";
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") throw new Error("http");
    host = u.hostname;
  } catch {
    return { ok: false, error: "Pega la liga completa de la videollamada, empezando con https://" };
  }
  if (!host.includes(".")) return { ok: false, error: "Esa liga no tiene un dominio válido." };

  // ⚠️ El input entrega "2026-09-09T09:00" SIN zona y el servidor corre en UTC:
  // `new Date()` guardaba las 9:00 como 09:00Z, o sea las 3 de la mañana en
  // CDMX. La hora que se teclea es la del centro de México.
  const cuando = desdeHoraLocal(cuandoISO);
  if (!cuando) return { ok: false, error: "Fecha inválida." };

  const sb = createSupabaseAdminClient();
  // ⚠️ `llamada_enviada_at` NO se escribe aquí. La llamada queda agendada de
  // inmediato —eso sí ocurrió— pero la marca de «ya le avisamos» sólo se pone
  // si el correo de verdad salió. Escribirla junto con el resto la volvía el
  // acuse del intento.
  const { error } = await sb
    .from("operator_applications")
    .update({ status: "calling", llamada_meet_url: url, llamada_at: cuando.toISOString() })
    .eq("id", id)
    .in("status", ["pending", "calling"]);
  if (error) {
    console.error("agendarLlamada:", error);
    return { ok: false, error: "No se pudo guardar la llamada." };
  }
  // Tomar es actuar (0071): la solicitud pasa a quien agenda, si nadie la tenía.
  await tomarSiLibre("solicitud", id);

  const aviso = await avisar(
    "invitación",
    emailInvitacionLlamada(app.email, app.responsable, url, cuando, mensaje, id, {
      responsable: app.responsable,
      operadora: app.nombre_operadora,
      llamada: cuando,
      actividades: app.actividades ?? [],
      rangoPrecio: app.rango_precio,
    }),
  );
  if (!aviso) {
    await sb
      .from("operator_applications")
      .update({ llamada_enviada_at: new Date().toISOString() })
      .eq("id", id);
  }
  revalidatePath(PANEL);
  return { ok: true, ...(aviso ? { aviso } : {}) };
}

// ── 3 · Aprobar ──────────────────────────────────────────────────────────────
// El núcleo vive en `aprobar-solicitud.ts` (sin guarda, no exportado al
// cliente); aquí sólo la guarda de la casa.
export async function aprobarOperadorApp(id: string): Promise<Res> {
  if (!(await puedeOnboarding())) return { ok: false, error: "Solo la casa o el equipo de onboarding." };
  return aprobarSolicitud(id);
}

// ── 4 · Rechazar ─────────────────────────────────────────────────────────────
export async function rechazarOperadorApp(id: string, motivo: string): Promise<Res> {
  if (!(await puedeOnboarding())) return { ok: false, error: "Solo la casa o el equipo de onboarding." };
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
  await cerrarAtribucion("solicitud", id, "resuelta");

  const avisoNo = await avisar("respuesta", emailRechazoOperador(app.email, app.responsable));
  revalidatePath(PANEL);
  return { ok: true, ...(avisoNo ? { aviso: avisoNo } : {}) };
}
