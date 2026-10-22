"use server";

// LO QUE SE HACE DESDE EL TABLERO — mover, escribir, agendar, abrir la fecha.
//
// Las tres primeras etapas se mueven a mano; las demás reciben automático
// (lib/comunidad/automatico.ts). Lo que escribe aquí es el PANEL de una
// tarjeta (lámina «Comunidad», etapas 01 a 06): el mensaje por los dos
// canales, la llamada con su cita, el grupo de WhatsApp, el recordatorio de
// pago y la fecha de grupo que se abre sola al llegar a «Interesado».

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { puedeEntrarAlPanel } from "@/lib/auth/authorization";
import { A_MANO } from "@/lib/comunidad/etapas";
import { cerrarAtribucion, tomarSiLibre } from "@/lib/equipo/atribucion";
import { sendViaResend } from "@/lib/email/resend";
import { boton, h1, marco, p, parrafosDe, saludo, esc } from "@/lib/email/plantilla";
import { ics } from "@/lib/operadores/emails";
import { sendText, whatsappConfigured } from "@/lib/whatsapp/client";
import { CDMX, desdeHoraLocal, enPalabras } from "@/lib/fecha/zona";
import { experienceTitle } from "@/lib/admin/queries";
import type { Experience } from "@/lib/experiences/types";
import { firmaDe, remitenteActual } from "@/lib/comunidad/remitente";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://caminante.numanhub.com";
const RUTA = "/caminante/admin/comunidad";

// ⚠️ Sólo estas tres se mueven a mano. Pagado, Preparando y Viajó SÓLO reciben
// automático: la primera con el pago, la segunda con la fecha a dos semanas,
// la tercera con la fecha pasada. Declarar pagado a quien no pagó descuadraría
// el dinero y el roster, y nadie se enteraría.
// Se lee del módulo puro; «caido» se suma aquí porque dar por perdida una
// tarjeta SÍ es una decisión humana.
const MOVIBLE = new Set([...A_MANO, "caido"]);

export type MoverResult =
  | { ok: true; salidaAbierta: { label: string; link: string } | null }
  | { ok: false; error: string };

type Res = { ok: true; waUrl?: string | null; aviso?: string } | { ok: false; error: string };

const ahora = () => new Date().toISOString();
const sinPermiso = { ok: false as const, error: "Sin permiso." };

/** La tarjeta con su persona y su experiencia: lo que toda acción necesita. */
async function cargar(cardId: string) {
  const sb = createSupabaseAdminClient();
  const { data: c } = await sb
    .from("crm_cards")
    .select("id, stage, contact_id, experience_id, slot_id, slot_request_id, num_people, operator_id, grupo_whatsapp_url, reservation_id")
    .eq("id", cardId)
    .maybeSingle();
  if (!c) return null;
  const [{ data: contacto }, { data: exp }, { data: op }] = await Promise.all([
    sb.from("contacts").select("id, full_name, email, phone").eq("id", c.contact_id as string).maybeSingle(),
    sb.from("experiences").select("id, slug, data").eq("id", c.experience_id as string).maybeSingle(),
    c.operator_id
      ? sb.from("operators").select("name").eq("id", c.operator_id as string).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (!contacto || !exp) return null;
  const data = (exp.data ?? null) as Partial<Experience> | null;
  return {
    sb,
    card: c as {
      id: string; stage: string; contact_id: string; experience_id: string; slot_id: string | null;
      slot_request_id: string | null; num_people: number; operator_id: string | null;
      grupo_whatsapp_url: string | null; reservation_id: string | null;
    },
    contacto: contacto as { id: string; full_name: string | null; email: string | null; phone: string | null },
    slug: exp.slug as string,
    data,
    titulo: experienceTitle(data, exp.slug as string),
    operadora: ((op as { name?: string } | null)?.name ?? "Caminante").trim(),
  };
}

const digitos = (tel: string | null) => (tel ?? "").replace(/\D/g, "");
const waUrlDe = (tel: string | null, texto: string) =>
  digitos(tel) ? `https://wa.me/${digitos(tel)}?text=${encodeURIComponent(texto)}` : null;

/**
 * WhatsApp libre sólo dentro de la ventana de 24 h desde su último mensaje
 * (regla de Meta). Fuera de ella no hay plantilla aprobada todavía, así que el
 * texto se abre en el teléfono del operador (wa.me) y lo manda él. Nunca se
 * pierde: lo que no sale por la API sale por la mano.
 */
async function porWhatsapp(sb: ReturnType<typeof createSupabaseAdminClient>, contactId: string, tel: string | null, texto: string): Promise<{ enviado: boolean; waUrl: string | null }> {
  const waUrl = waUrlDe(tel, texto);
  if (!digitos(tel)) return { enviado: false, waUrl: null };
  if (!whatsappConfigured()) return { enviado: false, waUrl };
  const { data: conv } = await sb
    .from("conversations")
    .select("last_inbound_at")
    .eq("contact_id", contactId)
    .maybeSingle();
  const ultimo = (conv as { last_inbound_at: string | null } | null)?.last_inbound_at;
  const abierta = !!ultimo && Date.now() - new Date(ultimo).getTime() < 24 * 3600 * 1000;
  if (!abierta) return { enviado: false, waUrl };
  const r = await sendText(digitos(tel), texto);
  return { enviado: r.ok, waUrl: r.ok ? null : waUrl };
}

export async function moverTarjeta(cardId: string, destino: string, motivo?: string): Promise<MoverResult> {
  if (!(await puedeEntrarAlPanel())) return sinPermiso;
  if (!MOVIBLE.has(destino)) {
    return {
      ok: false,
      error:
        destino === "pagado"
          ? "«Pagado» no se pone a mano: entra cuando el pago se confirma."
          : "Esa columna sólo recibe automático.",
    };
  }
  // Perder es un dato: sin motivo, la caída no enseña nada. La base también lo
  // exige (0045), pero se dice aquí con palabras que se entienden.
  if (destino === "caido" && !(motivo ?? "").trim()) {
    return { ok: false, error: "Una tarjeta caída necesita su motivo: es lo único que enseña algo." };
  }

  const sb = createSupabaseAdminClient();
  const { data: actual } = await sb.from("crm_cards").select("stage").eq("id", cardId).maybeSingle();
  if (!actual) return { ok: false, error: "Esa tarjeta ya no existe." };
  if (!MOVIBLE.has(String(actual.stage))) {
    return { ok: false, error: "Una tarjeta que ya pagó no se regresa a mano." };
  }

  const { error } = await sb
    .from("crm_cards")
    .update({
      stage: destino,
      stage_changed_at: ahora(),
      updated_at: ahora(),
      ...(destino === "caido" ? { motivo_caida: (motivo ?? "").trim() } : {}),
    })
    .eq("id", cardId);
  if (error) return { ok: false, error: error.message };

  // Tomar es actuar (0071): la tarjeta pasa a quien la mueve, si nadie la
  // tenía. Una tarjeta caída ya no es de nadie: no hay a quién pasarla.
  if (destino === "caido") await cerrarAtribucion("tarjeta", cardId, "resuelta");
  else await tomarSiLibre("tarjeta", cardId);

  // REGLA DE LUIS (21 oct 2026): al llegar a «Interesado», la fecha que pidió
  // se abre sola como salida de grupo privado y la tarjeta queda ligada a ella.
  const salidaAbierta = destino === "interesado" ? await abrirFechaDeGrupo(cardId) : null;

  revalidatePath(RUTA);
  return { ok: true, salidaAbierta };
}

/** Cuántos días dura la experiencia, según su itinerario. Sin itinerario, uno. */
function diasDe(data: Partial<Experience> | null): number {
  const bloques = (data?.page?.blocks ?? []) as unknown as { type: string; days?: unknown[] }[];
  const it = bloques.find((b) => b.type === "itinerary");
  const n = Array.isArray(it?.days) ? it!.days!.length : 0;
  return Math.max(1, n);
}

function etiquetaDe(inicio: string, fin: string): string {
  const f = (ymd: string, o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", ...o }).format(new Date(`${ymd}T12:00:00Z`));
  const mes = (ymd: string) => f(ymd, { month: "short" }).replace(".", "");
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  if (inicio === fin) return `${f(inicio, { day: "numeric" })} ${cap(mes(inicio))}`;
  if (mes(inicio) === mes(fin)) return `${cap(mes(inicio))} ${f(inicio, { day: "numeric" })}–${f(fin, { day: "numeric" })}`;
  return `${f(inicio, { day: "numeric" })} ${cap(mes(inicio))} – ${f(fin, { day: "numeric" })} ${cap(mes(fin))}`;
}

/**
 * La salida de grupo privado para una tarjeta: nace de su solicitud (fecha
 * deseada) o de las fechas que el operador escribe en el panel. Privada, con
 * su liga; cupo = las personas que dijo; sin precio propio (hereda el de la
 * experiencia). Idempotente: si ya tiene salida, devuelve la que hay.
 */
async function abrirFechaDeGrupo(cardId: string, fechas?: { inicio: string; fin?: string }): Promise<{ label: string; link: string } | null> {
  const ctx = await cargar(cardId);
  if (!ctx) return null;
  const { sb, card, slug, data } = ctx;
  const linkDe = (token: string | null) => `${SITE}/caminante/experiencias/${slug}${token ? `?grupo=${token}` : ""}`;

  // Una salida cancelada no cuenta: se abre otra. (Pasó el 22 oct: se canceló
  // la primera para probar y la tarjeta seguía apuntándole.)
  const viva = async (id: string | null) => {
    if (!id) return null;
    const { data: s } = await sb.from("experience_slots").select("id, label, access_token, visibility, status").eq("id", id).maybeSingle();
    return s && s.status !== "cancelled" ? s : null;
  };
  const actual = await viva(card.slot_id);
  if (actual) {
    return { label: String(actual.label ?? ""), link: linkDe(actual.visibility === "private" ? (actual.access_token as string | null) : null) };
  }

  const req = card.slot_request_id
    ? ((await sb.from("slot_requests").select("id, desired_date, status, created_slot_id").eq("id", card.slot_request_id).maybeSingle()).data as
        | { id: string; desired_date: string | null; status: string; created_slot_id: string | null }
        | null)
    : null;

  // La solicitud ya se aprobó antes (bandeja) y su salida sigue viva: sólo se liga la tarjeta.
  const deSolicitud = await viva(req?.created_slot_id ?? null);
  if (deSolicitud) {
    await sb.from("crm_cards").update({ slot_id: deSolicitud.id, updated_at: ahora() }).eq("id", card.id);
    return { label: String(deSolicitud.label ?? ""), link: linkDe(deSolicitud.visibility === "private" ? (deSolicitud.access_token as string | null) : null) };
  }

  const inicio = fechas?.inicio ?? req?.desired_date ?? null;
  if (!inicio || !/^\d{4}-\d{2}-\d{2}$/.test(inicio)) return null; // sin fecha no hay salida que abrir: el panel la pide
  const fin = fechas?.fin && /^\d{4}-\d{2}-\d{2}$/.test(fechas.fin)
    ? fechas.fin
    : new Date(new Date(`${inicio}T12:00:00Z`).getTime() + (diasDe(data) - 1) * 86400000).toISOString().slice(0, 10);
  if (fin < inicio) return null;

  const token = randomBytes(16).toString("base64url");
  const { data: slot, error } = await sb
    .from("experience_slots")
    .insert({
      experience_id: card.experience_id,
      label: etiquetaDe(inicio, fin),
      starts_at: `${inicio}T12:00:00Z`,
      ends_at: `${fin}T23:00:00Z`,
      capacity_total: card.num_people || null,
      price_mxn: null,
      status: "open",
      visibility: "private",
      access_token: token,
    })
    .select("id, label")
    .single();
  if (error || !slot) {
    console.error("abrirFechaDeGrupo:", error);
    return null;
  }
  await sb.from("crm_cards").update({ slot_id: slot.id, updated_at: ahora() }).eq("id", card.id);
  if (req) {
    await sb
      .from("slot_requests")
      .update({ status: "approved", created_slot_id: slot.id, resolved_at: ahora() })
      .eq("id", req.id);
  }
  return { label: String(slot.label), link: linkDe(token) };
}

/** Desde el panel, cuando la solicitud no traía fecha (o no hubo solicitud). */
export async function abrirFechaParaTarjeta(cardId: string, inicio: string, fin?: string): Promise<MoverResult> {
  if (!(await puedeEntrarAlPanel())) return sinPermiso;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio)) return { ok: false, error: "La salida necesita fecha de inicio." };
  if (fin && fin < inicio) return { ok: false, error: "La salida no puede terminar antes de empezar." };
  const abierta = await abrirFechaDeGrupo(cardId, { inicio, fin });
  if (!abierta) return { ok: false, error: "No pude abrir la salida. Revisa la fecha." };
  revalidatePath(RUTA);
  return { ok: true, salidaAbierta: abierta };
}

/** El grupo lo crea el operador en su teléfono y pega la liga una vez. */
export async function guardarGrupoWhatsapp(cardId: string, url: string): Promise<Res> {
  if (!(await puedeEntrarAlPanel())) return sinPermiso;
  const liga = url.trim().replace(/^https?:\/\//, "");
  if (liga && !/^chat\.whatsapp\.com\/[A-Za-z0-9_-]+$/.test(liga)) {
    return { ok: false, error: "Pega la liga de invitación del grupo (chat.whatsapp.com/…)." };
  }
  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("crm_cards")
    .update({ grupo_whatsapp_url: liga ? `https://${liga}` : null, updated_at: ahora() })
    .eq("id", cardId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  return { ok: true };
}

/**
 * El mensaje, por el canal que se eligió. Correo sale siempre. WhatsApp sale
 * por la API sólo con la ventana abierta; si no, se abre en el teléfono.
 * `pasar` = «Mandar y pasar a conversación» (etapa 01).
 */
export async function mandarMensaje(cardId: string, canal: "correo" | "whatsapp", texto: string, pasar = false): Promise<Res> {
  if (!(await puedeEntrarAlPanel())) return sinPermiso;
  const cuerpo = texto.trim();
  if (!cuerpo) return { ok: false, error: "El mensaje está vacío." };
  const ctx = await cargar(cardId);
  if (!ctx) return { ok: false, error: "Esa tarjeta ya no existe." };
  const { sb, card, contacto, titulo, operadora } = ctx;
  const firma = firmaDe(await remitenteActual(), operadora);

  let waUrl: string | null = null;
  let aviso: string | undefined;
  if (canal === "correo") {
    if (!contacto.email) return { ok: false, error: "No tiene correo. Escríbele por WhatsApp." };
    const correo = marco("Un mensaje", [h1(`Hola${saludo(contacto.full_name)}.`), ...parrafosDe(cuerpo), p(`— ${esc(firma)}`)]);
    const ok = await sendViaResend(contacto.email, `${titulo} · ${operadora}`, correo.html, { ua: "caminante-crm/1.0", text: correo.texto });
    if (!ok) return { ok: false, error: "El correo no salió. Intenta de nuevo." };
  } else {
    if (!contacto.phone) return { ok: false, error: "No tiene teléfono. Escríbele por correo." };
    const r = await porWhatsapp(sb, contacto.id, contacto.phone, cuerpo);
    waUrl = r.waUrl;
    if (!r.enviado && !waUrl) return { ok: false, error: "No pude armar la liga de WhatsApp." };
    if (!r.enviado) aviso = "La ventana de 24 h está cerrada: se abre en tu WhatsApp para que lo mandes tú.";
  }

  if (pasar && card.stage === "llego") {
    await sb.from("crm_cards").update({ stage: "conversacion", stage_changed_at: ahora(), updated_at: ahora() }).eq("id", card.id);
  } else {
    await sb.from("crm_cards").update({ updated_at: ahora() }).eq("id", card.id);
  }
  await tomarSiLibre("tarjeta", card.id);
  revalidatePath(RUTA);
  return { ok: true, waUrl, aviso };
}

/**
 * La llamada: el operador crea la reunión en su Zoom o su Meet y pega la liga.
 * Caminante no la genera: la reparte. Sale por los dos canales con el .ics y
 * queda en «Tu agenda». La tarjeta pasa a «En conversación».
 */
export async function agendarLlamada(cardId: string, i: { url: string; fecha: string; hora: string }): Promise<Res> {
  if (!(await puedeEntrarAlPanel())) return sinPermiso;
  const url = i.url.trim();
  if (!/^https?:\/\/\S+$/.test(url)) return { ok: false, error: "Pega la liga completa de tu Zoom o tu Meet." };
  const cuando = desdeHoraLocal(`${i.fecha}T${i.hora}`, CDMX);
  if (!cuando) return { ok: false, error: "Falta la fecha o la hora." };
  if (cuando.getTime() < Date.now() - 60000) return { ok: false, error: "Esa hora ya pasó." };
  const ctx = await cargar(cardId);
  if (!ctx) return { ok: false, error: "Esa tarjeta ya no existe." };
  const { sb, card, contacto, titulo, operadora } = ctx;
  const firma = firmaDe(await remitenteActual(), operadora);

  const { data: call, error } = await sb
    .from("crm_calls")
    .insert({ card_id: card.id, url, starts_at: cuando.toISOString(), duracion_min: 30 })
    .select("id")
    .single();
  if (error || !call) return { ok: false, error: error?.message ?? "No se pudo guardar la llamada." };

  const cuandoTxt = enPalabras(cuando, CDMX);
  const texto = `Hola${saludo(contacto.full_name).replace(/^, /, " ")}, soy ${firma}. Te comparto la liga de nuestra llamada del ${cuandoTxt}: ${url} — Responde a este mensaje y seguimos por aquí.`;

  let correoOk = false;
  if (contacto.email) {
    const correo = marco("Tu llamada", [
      h1(`Nos vemos el ${esc(cuandoTxt)}${saludo(contacto.full_name)}.`),
      p(`<b>${esc(cuandoTxt)}</b>, hora del centro de México. Son 30 minutos por video para contarte de <b>${esc(titulo)}</b>. Va adjunto el evento para que se meta a tu calendario.`),
      boton("Entrar a la llamada", url),
      p(`Si esa hora no te queda, responde este correo y la movemos. — ${esc(firma)}`),
    ]);
    const cal = ics({
      uid: `llamada-${call.id}@caminante.numanhub.com`,
      inicio: cuando, minutos: 30,
      titulo: `Caminante · ${titulo}`,
      descripcion: `Llamada con ${firma}.\nLiga: ${url}`,
      url, para: contacto.email,
    });
    correoOk = await sendViaResend(contacto.email, `Tu llamada · ${cuandoTxt}`, correo.html, {
      ua: "caminante-crm/1.0",
      text: correo.texto,
      attachments: [{ filename: "llamada-caminante.ics", content: Buffer.from(cal, "utf8").toString("base64"), contentType: "text/calendar; method=REQUEST; charset=utf-8" }],
    });
  }
  const wa = contacto.phone ? await porWhatsapp(sb, contacto.id, contacto.phone, texto) : { enviado: false, waUrl: null };
  if (correoOk || wa.enviado) await sb.from("crm_calls").update({ enviada_at: ahora() }).eq("id", call.id);

  if (card.stage === "llego") {
    await sb.from("crm_cards").update({ stage: "conversacion", stage_changed_at: ahora(), updated_at: ahora() }).eq("id", card.id);
  }
  await tomarSiLibre("tarjeta", card.id);
  revalidatePath(RUTA);
  const aviso = !correoOk && !wa.enviado
    ? "Quedó en tu agenda, pero no salió por ningún canal: mándala desde tu WhatsApp."
    : !wa.enviado && wa.waUrl
      ? "Salió por correo. Por WhatsApp la ventana está cerrada: se abre en tu teléfono para que la mandes tú."
      : undefined;
  return { ok: true, waUrl: wa.enviado ? null : wa.waUrl, aviso };
}

/** El recordatorio de pago: la liga para completar, por los dos canales. */
export async function recordatorioPago(cardId: string): Promise<Res> {
  if (!(await puedeEntrarAlPanel())) return sinPermiso;
  const ctx = await cargar(cardId);
  if (!ctx) return { ok: false, error: "Esa tarjeta ya no existe." };
  const { sb, card, contacto, slug, titulo, operadora } = ctx;
  let grupoQ = "";
  if (card.slot_id) {
    const { data: s } = await sb.from("experience_slots").select("visibility, access_token").eq("id", card.slot_id).maybeSingle();
    if (s?.visibility === "private" && s.access_token) grupoQ = `?grupo=${s.access_token}`;
  }
  const pagar = `${SITE}/caminante/reservar/${slug}${grupoQ}`;
  const firma = firmaDe(await remitenteActual(), operadora);
  const texto = `Hola${saludo(contacto.full_name).replace(/^, /, " ")}, soy ${firma}. Para apartar tu lugar en ${titulo} falta completar el pago: ${pagar}`;
  let correoOk = false;
  if (contacto.email) {
    const correo = marco("Tu lugar", [
      h1(`Tu lugar en ${esc(titulo)}${saludo(contacto.full_name)}.`),
      p("Para apartarlo falta completar el pago. Es un minuto y queda confirmado al instante."),
      boton("Completar el pago", pagar),
      p(`Cualquier duda, responde este correo. — ${esc(firma)}`),
    ]);
    correoOk = await sendViaResend(contacto.email, `Tu lugar en ${titulo}`, correo.html, { ua: "caminante-crm/1.0", text: correo.texto });
  }
  const wa = contacto.phone ? await porWhatsapp(sb, contacto.id, contacto.phone, texto) : { enviado: false, waUrl: null };
  if (!correoOk && !wa.enviado && !wa.waUrl) return { ok: false, error: "No tiene correo ni teléfono." };
  await sb.from("crm_cards").update({ updated_at: ahora() }).eq("id", card.id);
  await tomarSiLibre("tarjeta", card.id);
  return {
    ok: true,
    waUrl: wa.enviado ? null : wa.waUrl,
    aviso: correoOk && !wa.enviado && wa.waUrl ? "Salió por correo. Por WhatsApp se abre en tu teléfono." : undefined,
  };
}

/** Una tarjeta caída vuelve a «Llegó». No es un fracaso permanente: es un «ahora no». */
export async function reabrirTarjeta(cardId: string): Promise<Res> {
  if (!(await puedeEntrarAlPanel())) return sinPermiso;
  const sb = createSupabaseAdminClient();
  const { data: c } = await sb.from("crm_cards").select("stage").eq("id", cardId).maybeSingle();
  if (!c) return { ok: false, error: "Esa tarjeta ya no existe." };
  if (c.stage !== "caido") return { ok: false, error: "Esa tarjeta no está caída." };
  const { error } = await sb
    .from("crm_cards")
    .update({ stage: "llego", motivo_caida: null, stage_changed_at: ahora(), updated_at: ahora() })
    .eq("id", cardId);
  if (error) return { ok: false, error: error.message };
  await tomarSiLibre("tarjeta", cardId);
  revalidatePath(RUTA);
  return { ok: true };
}
