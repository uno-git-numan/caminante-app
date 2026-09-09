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
import { randomBytes } from "node:crypto";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureOperador } from "@/lib/operators/alta";
import { sembrarPerfilDesdeSolicitud } from "@/lib/operadores/perfil";
import { marcaLista } from "@/lib/operators/marca";
import type { OperatorBranding } from "@/lib/operators/branding";
import {
  emailInvitacionLlamada,
  emailPedirExpediente,
  emailBienvenidaOperador,
  emailRechazoOperador,
} from "@/lib/operadores/emails";

const PANEL = "/caminante/admin/plataforma/comunidad";
const SITIO = "https://caminante.numanhub.com";

// `operatorId` solo lo llena la aprobación: la tarjeta lo necesita para
// ofrecer «Completar su expediente» sin esperar a que la página recargue.
export type Res = {
  ok: boolean;
  error?: string;
  operatorId?: string;
  /**
   * La acción sí ocurrió, pero el correo NO salió. Son dos cosas distintas y
   * juntarlas fue el defecto: agendar una llamada y avisarle a la operadora son
   * pasos separados, y el segundo puede fallar solo.
   */
  aviso?: string;
};

/**
 * ⚠️ EL CORREO SE ESPERA Y SE MIRA. Antes iba con `.catch(console.error)` y su
 * booleano se tiraba: `sendViaResend` devuelve `false` cuando Resend rechaza
 * —sin lanzar— así que un correo que nunca salió dejaba la pantalla diciendo
 * «invitación enviada». Es el mismo defecto de la encuesta: la marca era el
 * acuse del INTENTO, no del envío.
 */
async function avisar(que: string, envio: Promise<boolean>): Promise<string | null> {
  try {
    return (await envio) ? null : `La ${que} NO salió. Revisa el correo y vuelve a intentar.`;
  } catch (e) {
    console.error(`${que}:`, e);
    return `La ${que} NO salió (error al enviar). Revisa el correo y vuelve a intentar.`;
  }
}

type App = {
  id: string;
  nombre_operadora: string;
  responsable: string;
  email: string;
  status: string;
  branding: OperatorBranding | null;
  operator_id: string | null;
  // Lo operativo que declaró: viaja a su perfil al aprobarlo.
  ciudad_estado: string | null;
  tipo_operacion: string | null;
  antiguedad: string | null;
  salidas_ano: string | null;
  personas_salida: string | null;
  seguro_rc: string | null;
  primeros_auxilios: string | null;
  ratio_guias: string | null;
  descripcion: string | null;
  instagram: string | null;
  whatsapp: string | null;
};

/** Carga la solicitud si está en alguno de los estados que permiten avanzar. */
async function cargar(id: string, permitidos: string[]): Promise<App | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("operator_applications")
    .select(
      "id, nombre_operadora, responsable, email, status, branding, operator_id, " +
        "ciudad_estado, tipo_operacion, antiguedad, salidas_ano, personas_salida, " +
        "seguro_rc, primeros_auxilios, ratio_guias, descripcion, instagram, whatsapp",
    )
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

  const aviso = await avisar(
    "invitación",
    emailInvitacionLlamada(app.email, app.responsable, url, cuando, mensaje, id),
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

  const avisoDocs = await avisar(
    "petición de expediente",
    emailPedirExpediente(app.email, app.responsable, url, lista.length, mensaje),
  );
  revalidatePath(PANEL);
  return { ok: true, ...(avisoDocs ? { aviso: avisoDocs } : {}) };
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

  // ⚠️ ESTO ES LO QUE HACE QUE EL EMBUDO PÚBLICO TERMINE EN ALGÚN LADO.
  // Aprobar YA NO reparte llaves de la casa (ese upsert a `admin_whitelist` se
  // quitó, ver el encabezado), pero al quitarlo el camino se quedó sin salida:
  // el operador aplicaba, se le hacía la llamada, se le pedían papeles, se
  // aprobaba, le llegaba un correo que dice «Entrar a la plataforma»… y no
  // podía entrar, porque `panel_activo` seguía en false. Nada fallaba: la
  // puerta simplemente no existía.
  //
  // Aprobar a un operador ES la decisión de darle su panel — el podado a sus
  // experiencias. Va aquí y no en `ensureOperador` porque esa función también
  // la usa la aprobación de EMBAJADORES, y un embajador vende, no opera.
  const { error: panelErr } = await sb
    .from("operators")
    .update({ panel_activo: true })
    .eq("id", alta.operatorId);
  if (panelErr) {
    console.error("aprobarOperadorApp panel:", panelErr);
    return { ok: false, error: "Se creó el operador pero no se pudo abrir su panel." };
  }

  // Lo que nos dio para ser aprobado —desde cuándo opera, su seguro, su ratio de
  // guías— es justo lo que a un viajero le da confianza, y hasta ahora se
  // quedaba enterrado en la solicitud. Se copia a su perfil, que es suyo y él
  // edita; la solicitud no se toca.
  await sembrarPerfilDesdeSolicitud(alta.operatorId, {
    id: app.id,
    ciudad_estado: app.ciudad_estado ?? null,
    tipo_operacion: app.tipo_operacion ?? null,
    antiguedad: app.antiguedad ?? null,
    salidas_ano: app.salidas_ano ?? null,
    personas_salida: app.personas_salida ?? null,
    seguro_rc: app.seguro_rc ?? null,
    primeros_auxilios: app.primeros_auxilios ?? null,
    ratio_guias: app.ratio_guias ?? null,
    descripcion: app.descripcion ?? null,
    instagram: app.instagram ?? null,
    whatsapp: app.whatsapp ?? null,
  }).catch((e) => console.error("sembrar perfil:", e));

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

  // ⚠️ AQUÍ ESTABA EL AGUJERO. Este paso hacía `upsert` en `admin_whitelist`, y
  // esa tabla no tiene niveles: quien está ahí es LA CASA. O sea que aprobar a un
  // operador externo le abría las 31 pantallas del panel — el ledger completo, el
  // CRM, los payouts de los demás operadores y la columna «Alergias / condiciones
  // / dieta» de todos los caminantes de todas las salidas.
  //
  // Ya no hace falta y NO debe volver: desde el rol «operador», el acceso al
  // panel se deriva de tener una fila viva en `operators` con ese correo, que es
  // justo lo que acaba de hacer `ensureOperador` arriba. El panel que ve está
  // podado a lo suyo (ver `lib/auth/alcance.ts` y `lib/auth/panel-operador.ts`).
  //
  // El interruptor para quitarle el acceso es `operators.active = false`.

  const { error } = await sb
    .from("operator_applications")
    .update({ status: "approved", operator_id: alta.operatorId, decided_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["pending", "calling", "docs"]);
  if (error) {
    console.error("aprobarOperadorApp update:", error);
    return { ok: false, error: "No se pudo cerrar la solicitud." };
  }

  const avisoBien = await avisar("bienvenida", emailBienvenidaOperador(app.email, app.responsable));
  revalidatePath(PANEL);
  return { ok: true, operatorId: alta.operatorId, ...(avisoBien ? { aviso: avisoBien } : {}) };
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

  const avisoNo = await avisar("respuesta", emailRechazoOperador(app.email, app.responsable));
  revalidatePath(PANEL);
  return { ok: true, ...(avisoNo ? { aviso: avisoNo } : {}) };
}
