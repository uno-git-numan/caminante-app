import "server-only";

// EL CÓDIGO DEL CELULAR — la verificación que hace que la cuenta tenga un
// celular de verdad (decisión de Luis, 26 oct 2026: la cuenta exige celular y
// correo; el celular es por donde llegan los avisos del viaje).
//
// Por dónde viaja el código, en este orden:
//   1. WhatsApp, por la plantilla AUTHENTICATION `codigo_caminante` (Meta exige
//      plantilla para escribirle a alguien que no nos ha escrito antes).
//   2. WhatsApp, texto libre, si esa persona nos escribió en las últimas 24 h.
//   3. Correo. Es el respaldo que SIEMPRE existe: hoy el número de WhatsApp de
//      Caminante sigue siendo el de pruebas de Meta y esa cuenta no puede
//      crear plantillas de autenticación (27 oct 2026). Cuando Luis dé de alta
//      el número real y la plantilla, el camino 1 se prende solo.
//
// Se guarda el HASH del código, nunca el código. Caduca a los 10 minutos y
// aguanta 5 intentos. El mismo código es el login: al verificarlo se canjea la
// liga mágica que se generó al pedirlo (codigos_celular.token_hash).

import { createHash, randomInt } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendTemplate, sendText, whatsappConfigured } from "@/lib/whatsapp/client";
import { sendViaResend } from "@/lib/email/resend";
import { esc, h1, marco, p, saludo } from "@/lib/email/plantilla";

export const MINUTOS_CODIGO = 10;
export const INTENTOS_CODIGO = 5;
export type CanalCodigo = "whatsapp" | "correo";

/** Celular a E.164. Diez dígitos = México. Devuelve null si no parece un celular. */
export function celularE164(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return `+52${d}`;
  if (d.length === 12 && d.startsWith("52")) return `+${d}`;
  if (d.length === 13 && d.startsWith("521")) return `+52${d.slice(3)}`; // el «1» viejo de móvil
  if (d.length >= 11 && d.length <= 15) return `+${d}`;
  return null;
}

/** "+52 55 ••• 1234" — lo que la pantalla enseña sin regalar el número. */
export function celularOculto(e164: string): string {
  const d = e164.replace(/\D/g, "");
  const ult = d.slice(-4);
  const lada = d.startsWith("52") ? `+52 ${d.slice(2, 4)}` : `+${d.slice(0, d.length - 8)}`;
  return `${lada} ••• ${ult}`;
}

const hashDe = (codigo: string, id: string) => createHash("sha256").update(`${id}:${codigo}`).digest("hex");

const digitos = (e164: string) => e164.replace(/\D/g, "");

async function ventanaAbierta(sb: ReturnType<typeof createSupabaseAdminClient>, e164: string): Promise<boolean> {
  // La ventana de 24 h es por contacto; el contacto se busca por su celular.
  const { data: c } = await sb
    .from("contacts")
    .select("id")
    .or(`phone.eq.${e164},wa_phone.eq.${e164}`)
    .limit(1)
    .maybeSingle();
  if (!c) return false;
  const { data: conv } = await sb
    .from("conversations")
    .select("last_inbound_at")
    .eq("contact_id", c.id as string)
    .maybeSingle();
  const ultimo = (conv as { last_inbound_at: string | null } | null)?.last_inbound_at;
  return !!ultimo && Date.now() - new Date(ultimo).getTime() < 24 * 3600 * 1000;
}

async function porWhatsapp(sb: ReturnType<typeof createSupabaseAdminClient>, e164: string, codigo: string): Promise<boolean> {
  if (!whatsappConfigured()) return false;
  const to = digitos(e164);
  const plantilla = process.env.WHATSAPP_CODIGO_TEMPLATE || "codigo_caminante";
  // Plantilla de autenticación: el código va en el cuerpo y en el botón «Copiar».
  const r = await sendTemplate(to, plantilla, "es_MX", [
    { type: "body", parameters: [{ type: "text", text: codigo }] },
    { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: codigo }] },
  ]);
  if (r.ok) return true;
  if (await ventanaAbierta(sb, e164)) {
    const t = await sendText(to, `${codigo} es tu código de Caminante. Vence en ${MINUTOS_CODIGO} minutos. No lo compartas.`);
    return t.ok;
  }
  return false;
}

async function porCorreo(email: string, nombre: string | null, codigo: string, experiencia: string | null): Promise<boolean> {
  const { html, texto } = marco("Tu código", [
    h1(`Tu código es <span style="letter-spacing:.18em">${esc(codigo)}</span>`),
    p(`Hola${saludo(nombre)}. Escríbelo en la pantalla para verificar tu celular${experiencia ? ` y entrar al grupo de <b>${esc(experiencia.replace(/\.$/, ""))}</b>` : ""}.`),
    p(`Vence en ${MINUTOS_CODIGO} minutos. Si no lo pediste tú, ignora este correo.`),
  ]);
  return sendViaResend(email, `${codigo} es tu código · Caminante`, html, { ua: "caminante-grupo/1.0", text: texto });
}

export type CodigoPedido =
  | { ok: true; id: string; canal: CanalCodigo; celular: string; expiraEn: string }
  | { ok: false; error: string };

/**
 * Genera, guarda y manda un código. `tokenHash` es la liga mágica que se va a
 * canjear al verificar (null si la persona ya tenía sesión).
 */
export async function pedirCodigo(i: {
  celular: string; // E.164
  email: string | null;
  nombre: string | null;
  userId: string | null;
  slotId: string | null;
  tokenHash: string | null;
  experiencia: string | null;
}): Promise<CodigoPedido> {
  const sb = createSupabaseAdminClient();

  // Freno: no más de 3 códigos por celular en 10 minutos.
  const desde = new Date(Date.now() - MINUTOS_CODIGO * 60000).toISOString();
  const { count } = await sb
    .from("codigos_celular")
    .select("id", { count: "exact", head: true })
    .eq("phone", i.celular)
    .gte("created_at", desde);
  if ((count ?? 0) >= 3) return { ok: false, error: "Ya mandamos varios códigos a ese número. Espera unos minutos." };

  const codigo = String(randomInt(0, 1000000)).padStart(6, "0");
  const expiraEn = new Date(Date.now() + MINUTOS_CODIGO * 60000).toISOString();

  const mandado = await porWhatsapp(sb, i.celular, codigo);
  let canal: CanalCodigo = "whatsapp";
  if (!mandado) {
    if (!i.email) return { ok: false, error: "No pudimos mandarte el código por WhatsApp y no tenemos tu correo." };
    const porMail = await porCorreo(i.email, i.nombre, codigo, i.experiencia);
    if (!porMail) return { ok: false, error: "No pudimos mandarte el código. Revisa el número y el correo e inténtalo otra vez." };
    canal = "correo";
  }

  const { data, error } = await sb
    .from("codigos_celular")
    .insert({
      phone: i.celular,
      email: i.email,
      user_id: i.userId,
      slot_id: i.slotId,
      nombre: i.nombre,
      code_hash: "pendiente",
      token_hash: i.tokenHash,
      canal,
      expires_at: expiraEn,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "No se pudo guardar el código." };
  const id = data.id as string;
  // El hash lleva el id de la fila como sal: dos filas con el mismo código no comparten hash.
  await sb.from("codigos_celular").update({ code_hash: hashDe(codigo, id) }).eq("id", id);
  return { ok: true, id, canal, celular: i.celular, expiraEn };
}

export type CodigoVerificado =
  | {
      ok: true;
      celular: string;
      email: string | null;
      nombre: string | null;
      userId: string | null;
      slotId: string | null;
      tokenHash: string | null;
    }
  | { ok: false; error: string; agotado?: boolean };

/** Compara el código contra la fila. Marca intentos y, si cuadra, `used_at`. */
export async function verificarCodigo(id: string, codigoRaw: string): Promise<CodigoVerificado> {
  const sb = createSupabaseAdminClient();
  const codigo = codigoRaw.replace(/\D/g, "");
  if (codigo.length !== 6) return { ok: false, error: "El código tiene seis dígitos." };

  const { data } = await sb
    .from("codigos_celular")
    .select("id, phone, email, nombre, user_id, slot_id, code_hash, token_hash, attempts, expires_at, used_at")
    .eq("id", id)
    .maybeSingle();
  const row = data as
    | {
        id: string; phone: string; email: string | null; nombre: string | null; user_id: string | null;
        slot_id: string | null; code_hash: string; token_hash: string | null; attempts: number;
        expires_at: string; used_at: string | null;
      }
    | null;
  if (!row) return { ok: false, error: "Pide un código nuevo.", agotado: true };
  if (row.used_at) return { ok: false, error: "Ese código ya se usó. Pide uno nuevo.", agotado: true };
  if (Date.parse(row.expires_at) < Date.now()) return { ok: false, error: "Ese código ya venció. Pide uno nuevo.", agotado: true };
  if (row.attempts >= INTENTOS_CODIGO) return { ok: false, error: "Demasiados intentos. Pide un código nuevo.", agotado: true };

  if (hashDe(codigo, row.id) !== row.code_hash) {
    await sb.from("codigos_celular").update({ attempts: row.attempts + 1 }).eq("id", row.id);
    const quedan = INTENTOS_CODIGO - row.attempts - 1;
    return {
      ok: false,
      error: quedan > 0 ? `Ese no es el código. Te quedan ${quedan} intento${quedan === 1 ? "" : "s"}.` : "Demasiados intentos. Pide un código nuevo.",
      agotado: quedan <= 0,
    };
  }
  await sb.from("codigos_celular").update({ used_at: new Date().toISOString() }).eq("id", row.id);
  return {
    ok: true,
    celular: row.phone,
    email: row.email,
    nombre: row.nombre,
    userId: row.user_id,
    slotId: row.slot_id,
    tokenHash: row.token_hash,
  };
}

/** Lo que la pantalla del código necesita saber de una fila (sin el hash). */
export async function fichaDelCodigo(id: string): Promise<{ celular: string; canal: CanalCodigo; expiraEn: string; usado: boolean } | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("codigos_celular").select("phone, canal, expires_at, used_at").eq("id", id).maybeSingle();
  if (!data) return null;
  return {
    celular: data.phone as string,
    canal: data.canal as CanalCodigo,
    expiraEn: data.expires_at as string,
    usado: !!data.used_at,
  };
}
