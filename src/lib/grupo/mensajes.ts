import "server-only";

// LOS MENSAJES DEL ESPACIO DEL GRUPO — uno a uno, a cada persona, sin depender
// del grupo de WhatsApp (que sigue existiendo como conversación).
//
//   · A1 «Eres la anfitriona» + A2 «el mensaje para tu grupo»: al pasar la
//     tarjeta a Interesado (tablero-actions → abrirFechaDeGrupo).
//   · «Faltan 3 días»: a quien entró y no ha apartado, 3 días antes de la fecha
//     límite (cron recordatorio-grupo).
//   · «Se abrió un lugar»: al primero de la lista de espera cuando hay cupo.
//   · «No se juntó el mínimo»: a la operadora, el día después de la fecha límite.
//
// Cada mensaje sale por correo (siempre que haya correo) y por WhatsApp si se
// puede: plantilla aprobada → texto libre dentro de la ventana de 24 h → nada.
// Lo que no sale por WhatsApp se devuelve como liga wa.me para que la operadora
// lo mande desde su teléfono: nunca se pierde en silencio.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendTemplate, sendText, whatsappConfigured } from "@/lib/whatsapp/client";
import { sendViaResend } from "@/lib/email/resend";
import { boton, crudo, esc, h1, marco, p, saludo } from "@/lib/email/plantilla";
import { fmtMxn } from "@/lib/grupo/formato";
import { celularE164 } from "@/lib/grupo/codigo";
import type { Espacio } from "@/lib/grupo/espacio";
import { ligaDelEspacio } from "@/lib/grupo/espacio";

type Sb = ReturnType<typeof createSupabaseAdminClient>;
type Destino = { contactId: string; nombre: string | null; email: string | null; telefono: string | null };

export type Enviado = { correo: boolean; whatsapp: boolean; waUrl: string | null };

// Los contactos guardan el celular como lo tecleó la persona («5543430274»):
// sin normalizar, `wa.me/5543430274` no resuelve a México y Meta rechaza el
// envío. Mismo normalizador que el login (10 dígitos → +52).
const digitos = (t: string | null) => (t ? (celularE164(t) ?? "") : "").replace(/\D/g, "");
const waUrlDe = (tel: string | null, texto: string) =>
  digitos(tel) ? `https://wa.me/${digitos(tel)}?text=${encodeURIComponent(texto)}` : null;

async function ventanaAbierta(sb: Sb, contactId: string): Promise<boolean> {
  const { data: conv } = await sb.from("conversations").select("last_inbound_at").eq("contact_id", contactId).maybeSingle();
  const ultimo = (conv as { last_inbound_at: string | null } | null)?.last_inbound_at;
  return !!ultimo && Date.now() - new Date(ultimo).getTime() < 24 * 3600 * 1000;
}

/**
 * WhatsApp: plantilla → texto libre en ventana → liga wa.me para mandarlo a mano.
 * `plantilla` trae el nombre y los parámetros del cuerpo y del botón (sufijo de URL).
 */
async function porWhatsapp(
  sb: Sb,
  d: Destino,
  texto: string,
  plantilla: { nombre: string; cuerpo: string[]; boton?: string } | null,
): Promise<{ enviado: boolean; waUrl: string | null }> {
  const waUrl = waUrlDe(d.telefono, texto);
  if (!digitos(d.telefono) || !whatsappConfigured()) return { enviado: false, waUrl };
  const to = digitos(d.telefono);
  if (plantilla) {
    const comps: unknown[] = [
      { type: "body", parameters: plantilla.cuerpo.map((t) => ({ type: "text", text: t || "—" })) },
    ];
    if (plantilla.boton) {
      comps.push({ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: plantilla.boton }] });
    }
    const r = await sendTemplate(to, plantilla.nombre, "es_MX", comps);
    if (r.ok) return { enviado: true, waUrl: null };
  }
  if (await ventanaAbierta(sb, d.contactId)) {
    const r = await sendText(to, texto);
    if (r.ok) return { enviado: true, waUrl: null };
  }
  return { enviado: false, waUrl };
}

async function porCorreo(d: Destino, asunto: string, html: string, texto: string): Promise<boolean> {
  if (!d.email || !d.email.includes("@")) return false;
  return sendViaResend(d.email, asunto, html, { ua: "caminante-grupo/1.0", text: texto });
}

function destinoDe(c: { id: string; full_name: string | null; email: string | null; phone: string | null }): Destino {
  return { contactId: c.id, nombre: c.full_name, email: c.email, telefono: c.phone };
}

async function contacto(sb: Sb, contactId: string): Promise<Destino | null> {
  const { data } = await sb.from("contacts").select("id, full_name, email, phone").eq("id", contactId).maybeSingle();
  return data ? destinoDe(data as { id: string; full_name: string | null; email: string | null; phone: string | null }) : null;
}

/** El texto que la anfitriona reenvía a su grupo (A2). También lo usa «Invitar a mi grupo». */
export function mensajeParaElGrupo(e: Espacio): string {
  const n = e.cupo != null ? `Somos ${e.cupo} lugares. ` : "";
  return `Hola, estoy armando ${e.tituloPlano} el ${e.fechaLarga} con Caminante. ${n}Entra aquí para apartar el tuyo: ${ligaDelEspacio(e.token)}`;
}

/** A1 + A2: lo que recibe la anfitriona al abrirse su espacio. */
export async function avisarAnfitriona(e: Espacio): Promise<Enviado> {
  const sb = createSupabaseAdminClient();
  if (!e.anfitrion) return { correo: false, whatsapp: false, waUrl: null };
  const d = await contacto(sb, e.anfitrion.contactId);
  if (!d) return { correo: false, whatsapp: false, waUrl: null };
  const liga = ligaDelEspacio(e.token);
  const precio = e.precio != null ? `${fmtMxn(e.precio)} por persona` : "precio por confirmar";
  const lugares = e.cupo != null ? `${e.cupo} lugares` : "sin tope de lugares";
  const limite = e.fechaLimiteTexto ?? "la fecha que te diga la operadora";
  const reenvio = mensajeParaElGrupo(e);

  // A1 · correo
  const a1 = marco("Eres la anfitriona", [
    h1(`${esc(e.anfitrion.pila || "Hola")}, se abrió tu salida.`),
    p(`Ya es oficial: eres la anfitriona de <b>${esc(e.tituloPlano)}</b>. Esto es lo que se abrió para tu grupo:`),
    crudo(
      `<tr><td style="padding:0 36px 8px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.7;color:#1c2b26;">
<div>// ${esc(e.fechaLarga)}</div><div>// ${esc(lugares)}</div><div>// ${esc(precio)}</div></td></tr>`,
      `- ${e.fechaLarga}\n- ${lugares}\n- ${precio}`,
    ),
    p("Lo que sigue:"),
    crudo(
      `<tr><td style="padding:0 36px 8px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.7;color:#1c2b26;">
<div>// Invita a tu grupo con tu liga.</div><div>// Cada quien aparta su lugar antes del ${esc(limite)}.</div><div>// Cada quien firma su deslinde antes de salir.</div></td></tr>`,
      `- Invita a tu grupo con tu liga.\n- Cada quien aparta su lugar antes del ${limite}.\n- Cada quien firma su deslinde antes de salir.`,
    ),
    boton("Abrir mi espacio", liga),
  ]);
  // A2 · correo
  const a2 = marco("Para tu grupo", [
    h1("El mensaje para tu grupo."),
    p("Cópialo y mándalo a tus amigos o a tu grupo de WhatsApp:"),
    crudo(
      `<tr><td style="padding:0 36px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"><div style="border:1px solid rgba(32,33,28,.13);border-left:3px solid #ff5d36;border-radius:10px;padding:16px 18px;background:#fff;font-size:16px;line-height:1.6;color:#1c2b26;">${esc(reenvio)}</div></td></tr>`,
      reenvio,
    ),
    p("Cada persona que entre por tu liga crea su cuenta Caminante y aparta su lugar. Tú ves quién va entrando en tu espacio."),
  ]);
  const [c1, c2] = await Promise.all([
    porCorreo(d, `Eres la anfitriona · ${e.tituloPlano}`, a1.html, a1.texto),
    porCorreo(d, `El mensaje para tu grupo · ${e.tituloPlano}`, a2.html, a2.texto),
  ]);

  // A1 · WhatsApp
  const textoA1 =
    `Hola${d.nombre ? `, ${d.nombre.split(/\s+/)[0]}` : ""}. Ya es oficial: eres la anfitriona de *${e.tituloPlano}*.\n\n` +
    `Se abrió tu salida privada:\n// ${e.fechaLarga}\n// ${lugares}\n// ${precio}\n\n` +
    `Lo que sigue:\n// Invita a tu grupo con tu liga.\n// Cada quien aparta su lugar antes del ${limite}.\n// Cada quien firma su deslinde antes de salir.\n\nTu espacio: ${liga}`;
  const w1 = await porWhatsapp(sb, d, textoA1, {
    nombre: process.env.WHATSAPP_ANFITRIONA_TEMPLATE || "anfitriona_espacio",
    cuerpo: [e.anfitrion.pila || "Hola", e.tituloPlano, e.fechaLarga, e.cupo != null ? String(e.cupo) : "—", e.precio != null ? fmtMxn(e.precio) : "por confirmar", limite],
    boton: e.token,
  });
  // A2 · WhatsApp (sólo si el A1 salió por la API; si no, la liga manual ya lleva A1)
  if (w1.enviado) {
    await porWhatsapp(sb, d, `Este es el mensaje para tu grupo. Reenvíalo o cópialo:\n\n${reenvio}`, {
      nombre: process.env.WHATSAPP_GRUPO_TEMPLATE || "grupo_mensaje",
      cuerpo: [e.tituloPlano, e.fechaLarga, e.cupo != null ? String(e.cupo) : "los que seamos", e.token],
    });
  }
  return { correo: c1 || c2, whatsapp: w1.enviado, waUrl: w1.enviado ? null : waUrlDe(d.telefono, `${textoA1}\n\n${reenvio}`) };
}

/** «Faltan N días para apartar tu lugar» a quien entró y no ha pagado. */
export async function recordarLugar(e: Espacio, contactId: string, dias: number): Promise<Enviado> {
  const sb = createSupabaseAdminClient();
  const d = await contacto(sb, contactId);
  if (!d || !e.fechaLimiteTexto) return { correo: false, whatsapp: false, waUrl: null };
  const liga = ligaDelEspacio(e.token);
  const quien = e.anfitrion?.pila ? ` con el grupo de ${e.anfitrion.pila}` : "";
  const van = e.cupo != null ? `Van ${e.apartados} de ${e.cupo} lugares.` : `Van ${e.apartados} lugares apartados.`;
  const texto =
    `Hola${d.nombre ? `, ${d.nombre.split(/\s+/)[0]}` : ""}. Faltan ${dias} días para apartar tu lugar en *${e.tituloPlano}*${quien}.\n\n` +
    `${van} La lista se cierra el ${e.fechaLimiteTexto}.\n\nAparta aquí: ${liga}`;
  const m = marco("Tu lugar", [
    h1(`Faltan ${dias} días para apartar tu lugar.`),
    p(`Hola${saludo(d.nombre)}. Entraste al grupo de <b>${esc(e.tituloPlano)}</b>${quien ? esc(quien) : ""} y tu lugar todavía no está apartado.`),
    p(`${esc(van)} La lista se cierra el <b>${esc(e.fechaLimiteTexto)}</b>.`),
    boton("Apartar mi lugar", liga),
  ]);
  const [correo, wa] = await Promise.all([
    porCorreo(d, `Faltan ${dias} días · ${e.tituloPlano}`, m.html, m.texto),
    porWhatsapp(sb, d, texto, {
      nombre: process.env.WHATSAPP_RECORDATORIO_TEMPLATE || "recordatorio_lugar",
      cuerpo: [d.nombre?.split(/\s+/)[0] || "Hola", String(dias), e.tituloPlano, e.anfitrion?.pila || "tu grupo", String(e.apartados), e.cupo != null ? String(e.cupo) : "—", e.fechaLimiteTexto],
      boton: e.token,
    }),
  ]);
  return { correo, whatsapp: wa.enviado, waUrl: wa.waUrl };
}

/** «Se abrió un lugar» al primero de la lista de espera. */
export async function avisarLugarLibre(e: Espacio, contactId: string): Promise<Enviado> {
  const sb = createSupabaseAdminClient();
  const d = await contacto(sb, contactId);
  if (!d) return { correo: false, whatsapp: false, waUrl: null };
  const liga = ligaDelEspacio(e.token);
  const texto = `Hola${d.nombre ? `, ${d.nombre.split(/\s+/)[0]}` : ""}. Se abrió un lugar en *${e.tituloPlano}* (${e.fechaCorta}). Apártalo antes de que se vaya: ${liga}`;
  const m = marco("Se abrió un lugar", [
    h1("Se abrió un lugar."),
    p(`Hola${saludo(d.nombre)}. Alguien liberó su lugar en <b>${esc(e.tituloPlano)}</b> (${esc(e.fechaCorta)}). Es tuyo si lo apartas antes de que se vaya.`),
    boton("Apartar mi lugar", liga),
  ]);
  const [correo, wa] = await Promise.all([
    porCorreo(d, `Se abrió un lugar · ${e.tituloPlano}`, m.html, m.texto),
    porWhatsapp(sb, d, texto, null),
  ]);
  return { correo, whatsapp: wa.enviado, waUrl: wa.waUrl };
}

/** A la operadora: venció la fecha límite y no se juntó el mínimo. Nada se cancela solo. */
export async function avisarMinimoNoAlcanzado(e: Espacio): Promise<boolean> {
  const a = process.env.ADMIN_EMAIL || "uno@numanhub.com";
  const m = marco("Espacio del grupo", [
    h1(`${esc(e.tituloPlano)} · ${esc(e.etiqueta)}: no se juntó el mínimo.`),
    p(`Venció la fecha límite (${esc(e.fechaLimiteTexto ?? "")}) con <b>${e.apartados}</b> lugares apartados de un mínimo de <b>${e.minimo ?? "—"}</b>${e.anfitrion ? `, grupo de ${esc(e.anfitrion.nombre)}` : ""}.`),
    p("La salida sigue en pie: el espacio le dice al grupo que vas a escribirles. Decide tú: mover la fecha límite, bajar el mínimo o cancelar la salida desde el panel."),
    boton("Abrir en Comunidad", "https://caminante.numanhub.com/caminante/admin/comunidad"),
  ]);
  return sendViaResend(a, `No se juntó el mínimo · ${e.tituloPlano} ${e.etiqueta}`, m.html, { ua: "caminante-grupo/1.0", text: m.texto });
}
