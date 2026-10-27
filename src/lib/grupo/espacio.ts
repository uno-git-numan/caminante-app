import "server-only";

// EL ESPACIO DEL GRUPO — lo que ve una salida privada en /caminante/g/<token>.
//
// Una salida privada tenía como única puerta la página pública de la
// experiencia con `?grupo=<token>`. Desde el 27 oct 2026 la liga lleva a un
// espacio propio, estilo viaje de Airbnb: la anfitriona invita y ve quién va
// entrando; cada invitado entra con su cuenta (celular y correo), aparta su
// lugar y firma. Diseño: design/comunidad/dc/espacio-del-grupo.dc.html.
//
// Lo que se muestra se DERIVA, nunca se escribe dos veces:
//   · «entré»  = fila en grupo_lugares
//   · «pagué»  = una reserva que aparta (HOLDING_STATUSES), propia o de quien
//                cubrió el lugar
//   · «firmé»  = registration de esa reserva firmada por esta persona
//   · «N de M» = Σ num_people de las reservas que apartan (availability.ts),
//                la misma cuenta que usa la caja
// Nunca se enseñan montos ni datos médicos de otros: sólo quién entró, pagó y
// firmó (decisión de Luis, 26 oct).

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { HOLDING_STATUSES, cleanGrupoToken, fetchSlotAvailability } from "@/lib/experiences/availability";
import { parseMxnAmount } from "@/lib/payments/reservation-links";
import { fetchOperatorContactoForExperience } from "@/lib/operators/public";
import { cdmxDay, iniciales } from "@/lib/admin/formato";
import type { Experience, V2Checklist, V2Hero, V2Itinerary, V2Packing } from "@/lib/experiences/types";

export const SITE = "https://caminante.numanhub.com";

export type EstadoLugar = "entro" | "pago" | "firmo";

export type PersonaDelGrupo = {
  lugarId: string;
  contactId: string;
  nombre: string;
  iniciales: string;
  estado: EstadoLugar;
  anfitrion: boolean;
  /** Si otro del grupo cubrió su lugar: el nombre de pila de quien pagó. */
  pagadoPor: string | null;
  /** Cuántos lugares pagó con su reserva (1 normalmente; 3 si cubrió a dos). */
  lugaresPagados: number;
  listaEspera: boolean;
  entroEl: string;
  /** La reserva que paga su lugar (propia o de quien lo cubrió): a ella se ata el deslinde. */
  reservationId: string | null;
};

export type Espacio = {
  token: string;
  slotId: string;
  experienceId: string;
  slug: string;
  titulo: string;
  tituloAcento: string;
  tituloPlano: string;
  foto: { url: string; alt: string; pos?: string } | null;
  lugar: string | null; // "Sierra Nevada" (metaEst del hero)
  etiqueta: string; // "Nov 28–29"
  fechaLarga: string; // "sábado 28 y domingo 29 de noviembre"
  fechaCorta: string; // "28–29 nov"
  inicio: string; // YYYY-MM-DD (CDMX)
  fin: string;
  status: "open" | "closed" | "cancelled";
  cupo: number | null;
  apartados: number;
  disponibles: number | null;
  cupoLleno: boolean;
  yaViajaron: boolean;
  fechaLimite: string | null; // YYYY-MM-DD
  fechaLimiteTexto: string | null; // "14 de noviembre"
  diasParaLimite: number | null; // negativo = ya pasó
  vencida: boolean; // pasó la fecha límite
  minimo: number | null;
  vencidaSinMinimo: boolean;
  precio: number | null; // por persona, MXN
  anfitrion: { contactId: string; nombre: string; pila: string } | null;
  /** Cuándo pidió la fecha (slot_requests), YYYY-MM-DD. */
  pidioEl: string | null;
  personas: PersonaDelGrupo[];
  entraron: number;
  pagaron: number;
  grupoWhatsappUrl: string | null;
  puntoEncuentro: { texto: string; hora: string | null } | null;
  itinerario: { lab: string; ttl: string | null; texto: string }[];
  incluye: string[];
  mochila: string[];
  operadora: { nombre: string; whatsapp: string | null; email: string | null };
  minPeople: number | null;
  /** `registration.active` de la experiencia: sin él no hay /registro que firmar. */
  deslindeActivo: boolean;
};

type SlotRow = {
  id: string;
  experience_id: string;
  label: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity_total: number | null;
  price_mxn: number | null;
  status: string;
  visibility: string;
  access_token: string | null;
  anfitrion_contact_id: string | null;
  fecha_limite: string | null;
  minimo: number | null;
  punto_encuentro: string | null;
  punto_encuentro_hora: string | null;
};

type LugarRow = {
  id: string;
  contact_id: string;
  user_id: string | null;
  rol: string;
  entro_at: string;
  reservation_id: string | null;
  pagado_por: string | null;
  lista_espera_at: string | null;
};

const pila = (nombre: string) => {
  const p = nombre.trim().split(/\s+/)[0] ?? "";
  return p ? p.charAt(0).toUpperCase() + p.slice(1) : "";
};

const DIA = 86400000;

function fechaLarga(inicio: string, fin: string): string {
  const f = (ymd: string, o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", ...o }).format(new Date(`${ymd}T12:00:00Z`));
  const dia = (ymd: string) => `${f(ymd, { weekday: "long" })} ${f(ymd, { day: "numeric" })}`;
  const mes = (ymd: string) => f(ymd, { month: "long" });
  if (inicio === fin) return `${dia(inicio)} de ${mes(inicio)}`;
  if (mes(inicio) === mes(fin)) return `${dia(inicio)} y ${dia(fin)} de ${mes(inicio)}`;
  return `${dia(inicio)} de ${mes(inicio)} al ${dia(fin)} de ${mes(fin)}`;
}

function fechaCorta(inicio: string, fin: string): string {
  const f = (ymd: string, o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", ...o }).format(new Date(`${ymd}T12:00:00Z`));
  const mes = (ymd: string) => f(ymd, { month: "short" }).replace(".", "");
  if (inicio === fin) return `${f(inicio, { day: "numeric" })} ${mes(inicio)}`;
  if (mes(inicio) === mes(fin)) return `${f(inicio, { day: "numeric" })}–${f(fin, { day: "numeric" })} ${mes(inicio)}`;
  return `${f(inicio, { day: "numeric" })} ${mes(inicio)} – ${f(fin, { day: "numeric" })} ${mes(fin)}`;
}

/** "14 de noviembre" */
export function diaDeMes(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", ...o }).format(d);
  return `${f({ day: "numeric" })} de ${f({ month: "long" })}`;
}

/** Días enteros entre hoy (CDMX) y una fecha YYYY-MM-DD. Negativo si ya pasó. */
export function diasHasta(ymd: string): number {
  const hoy = cdmxDay(new Date());
  return Math.round((Date.parse(`${ymd}T12:00:00Z`) - Date.parse(`${hoy}T12:00:00Z`)) / DIA);
}

function precioDe(slot: SlotRow, data: Partial<Experience> | null): number | null {
  if (slot.price_mxn != null) return Number(slot.price_mxn);
  const tiers = data?.priceTiers ?? [];
  if (tiers.length) {
    const montos = tiers.map((t) => parseMxnAmount(t.amount)).filter((n): n is number => n != null && n > 0);
    if (montos.length) return Math.min(...montos);
  }
  const base = parseMxnAmount(data?.price?.amount);
  return base != null && base > 0 ? base : null;
}

function bloquesDe(data: Partial<Experience> | null) {
  const blocks = data?.page?.blocks ?? [];
  return {
    hero: blocks.find((b) => b.type === "hero") as V2Hero | undefined,
    itin: blocks.find((b) => b.type === "itinerary") as V2Itinerary | undefined,
    checklist: blocks.find((b) => b.type === "checklist") as V2Checklist | undefined,
    packing: blocks.find((b) => b.type === "packing") as V2Packing | undefined,
  };
}

/** Quita el **negrita** del markdown ligero del itinerario. */
const plano = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1");

export async function fetchEspacio(tokenRaw: unknown): Promise<Espacio | null> {
  const token = cleanGrupoToken(tokenRaw);
  if (!token) return null;
  const sb = createSupabaseAdminClient();

  const { data: slotRow } = await sb
    .from("experience_slots")
    .select(
      "id, experience_id, label, starts_at, ends_at, capacity_total, price_mxn, status, visibility, access_token, anfitrion_contact_id, fecha_limite, minimo, punto_encuentro, punto_encuentro_hora",
    )
    .eq("access_token", token)
    .maybeSingle();
  const slot = slotRow as SlotRow | null;
  if (!slot || slot.visibility !== "private" || slot.status === "cancelled") return null;

  const [{ data: expRow }, avail, { data: lugaresRows }] = await Promise.all([
    sb.from("experiences").select("id, slug, data").eq("id", slot.experience_id).maybeSingle(),
    fetchSlotAvailability(slot.experience_id),
    sb
      .from("grupo_lugares")
      .select("id, contact_id, user_id, rol, entro_at, reservation_id, pagado_por, lista_espera_at")
      .eq("slot_id", slot.id)
      .order("entro_at", { ascending: true }),
  ]);
  if (!expRow) return null;
  const data = (expRow.data ?? null) as Partial<Experience> | null;
  const slug = expRow.slug as string;
  const lugares = (lugaresRows ?? []) as LugarRow[];

  const contactIds = Array.from(
    new Set([...lugares.map((l) => l.contact_id), ...(slot.anfitrion_contact_id ? [slot.anfitrion_contact_id] : [])]),
  );
  const [{ data: contactos }, { data: reservas }, { data: tarjetaHost }, contactoOp, { data: solicitud }] = await Promise.all([
    contactIds.length
      ? sb.from("contacts").select("id, full_name").in("id", contactIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    sb
      .from("reservations")
      .select("id, contact_id, num_people, status")
      .eq("slot_id", slot.id)
      .in("status", HOLDING_STATUSES),
    slot.anfitrion_contact_id
      ? sb
          .from("crm_cards")
          .select("grupo_whatsapp_url")
          .eq("slot_id", slot.id)
          .eq("contact_id", slot.anfitrion_contact_id)
          .neq("stage", "caido")
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null as { grupo_whatsapp_url: string | null } | null }),
    fetchOperatorContactoForExperience(slot.experience_id),
    sb.from("slot_requests").select("created_at").eq("created_slot_id", slot.id).order("created_at", { ascending: true }).limit(1).maybeSingle(),
  ]);
  const nombreDe = new Map((contactos ?? []).map((c) => [c.id as string, (c.full_name as string | null) ?? ""]));
  const reservasVivas = (reservas ?? []) as { id: string; contact_id: string; num_people: number; status: string }[];
  const reservaIds = reservasVivas.map((r) => r.id);
  const { data: firmas } = reservaIds.length
    ? await sb.from("registrations").select("reservation_id, contact_id").in("reservation_id", reservaIds)
    : { data: [] as { reservation_id: string; contact_id: string | null }[] };
  const firmasVivas = (firmas ?? []) as { reservation_id: string; contact_id: string | null }[];

  // La reserva que paga cada lugar: la apuntada, o la viva de esa persona en
  // esta salida (quien pagó por el camino normal, sin pasar por el espacio).
  const reservaDe = (l: LugarRow) =>
    reservasVivas.find((r) => r.id === l.reservation_id) ??
    (l.pagado_por ? undefined : reservasVivas.find((r) => r.contact_id === l.contact_id));

  const lugarPorId = new Map(lugares.map((l) => [l.id, l]));
  const personas: PersonaDelGrupo[] = lugares.map((l) => {
    const res = reservaDe(l);
    // Firmó: una registration de SU reserva con su contacto. Si la firma no
    // trae contacto (registro viejo), cuenta sólo para quien es titular.
    const firmo =
      !!res &&
      firmasVivas.some(
        (f) => f.reservation_id === res.id && (f.contact_id === l.contact_id || (!f.contact_id && !l.pagado_por)),
      );
    const nombre = nombreDe.get(l.contact_id) || "Alguien del grupo";
    const quienPago = l.pagado_por ? lugarPorId.get(l.pagado_por) : null;
    return {
      lugarId: l.id,
      contactId: l.contact_id,
      nombre,
      iniciales: iniciales(nombre),
      estado: firmo ? "firmo" : res ? "pago" : "entro",
      anfitrion: l.rol === "anfitrion" || l.contact_id === slot.anfitrion_contact_id,
      pagadoPor: quienPago ? pila(nombreDe.get(quienPago.contact_id) || "") || "alguien del grupo" : null,
      lugaresPagados: res && !l.pagado_por && res.contact_id === l.contact_id ? Number(res.num_people) || 1 : res ? 1 : 0,
      listaEspera: !!l.lista_espera_at,
      entroEl: l.entro_at,
      reservationId: res?.id ?? null,
    };
  });
  // La anfitriona primero; luego por orden de llegada.
  personas.sort((a, b) => Number(b.anfitrion) - Number(a.anfitrion));

  const inicio = cdmxDay(slot.starts_at);
  const fin = slot.ends_at ? cdmxDay(slot.ends_at) : inicio;
  const a = avail.get(slot.id);
  const apartados = a?.taken ?? reservasVivas.reduce((n, r) => n + (Number(r.num_people) || 0), 0);
  const cupo = slot.capacity_total ?? null;
  const disponibles = cupo == null ? null : Math.max(0, cupo - apartados);
  const diasParaLimite = slot.fecha_limite ? diasHasta(slot.fecha_limite) : null;
  const vencida = diasParaLimite != null && diasParaLimite < 0;
  const pagaron = personas.filter((p) => p.estado !== "entro").length;
  const hoy = cdmxDay(new Date());

  const { hero, itin, checklist, packing } = bloquesDe(data);
  const titulo = hero?.title ?? data?.title ?? slug;
  const tituloAcento = hero?.titleAccent ?? data?.titleAccent ?? "";
  const fotoUrl = hero?.bg?.url || data?.heroImageUrl || "";
  const anfNombre = slot.anfitrion_contact_id ? nombreDe.get(slot.anfitrion_contact_id) || "" : "";

  return {
    token,
    slotId: slot.id,
    experienceId: slot.experience_id,
    slug,
    titulo,
    tituloAcento,
    tituloPlano: [titulo, tituloAcento].filter(Boolean).join(" ").trim(),
    foto: fotoUrl ? { url: fotoUrl, alt: hero?.bg?.alt || data?.heroImageAlt || "", pos: hero?.bg?.pos } : null,
    lugar: hero?.metaEst ?? null,
    etiqueta: slot.label ?? fechaCorta(inicio, fin),
    fechaLarga: fechaLarga(inicio, fin),
    fechaCorta: fechaCorta(inicio, fin),
    inicio,
    fin,
    status: slot.status as Espacio["status"],
    cupo,
    apartados,
    disponibles,
    cupoLleno: disponibles != null && disponibles <= 0,
    yaViajaron: fin < hoy,
    fechaLimite: slot.fecha_limite,
    fechaLimiteTexto: slot.fecha_limite ? diaDeMes(slot.fecha_limite) : null,
    diasParaLimite,
    vencida,
    minimo: slot.minimo,
    vencidaSinMinimo: vencida && slot.minimo != null && apartados < slot.minimo,
    precio: precioDe(slot, data),
    anfitrion: slot.anfitrion_contact_id
      ? { contactId: slot.anfitrion_contact_id, nombre: anfNombre, pila: pila(anfNombre) }
      : null,
    pidioEl: (solicitud as { created_at: string } | null)?.created_at ? cdmxDay((solicitud as { created_at: string }).created_at) : null,
    personas,
    entraron: personas.length,
    pagaron,
    grupoWhatsappUrl: (tarjetaHost as { grupo_whatsapp_url: string | null } | null)?.grupo_whatsapp_url ?? null,
    puntoEncuentro: slot.punto_encuentro
      ? { texto: slot.punto_encuentro, hora: slot.punto_encuentro_hora }
      : null,
    itinerario: (itin?.days ?? []).map((d) => ({
      lab: d.lab,
      ttl: d.ttl ?? null,
      texto: (d.items ?? []).map(plano).join(" · "),
    })),
    incluye: checklist?.yesItems ?? [],
    mochila: packing?.items ?? [],
    operadora: {
      nombre: contactoOp ? "Tu operadora" : "Luis · Caminante",
      whatsapp: contactoOp?.whatsapp ?? "+525512020565",
      email: contactoOp?.email ?? "uno@numanhub.com",
    },
    minPeople: data?.minPeople ?? null,
    deslindeActivo: !!data?.registration?.active,
  };
}

/** El lugar de una persona en el espacio (por contacto). */
export function lugarDe(e: Espacio, contactId: string | null): PersonaDelGrupo | null {
  if (!contactId) return null;
  return e.personas.find((p) => p.contactId === contactId) ?? null;
}

/** El contacto de quien tiene sesión: por user_id, y si no por correo. */
export async function contactoDeUsuario(user: { id: string; email?: string | null }) {
  const sb = createSupabaseAdminClient();
  const porUser = await sb
    .from("contacts")
    .select("id, full_name, email, phone, phone_verified_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (porUser.data) return porUser.data as ContactoSesion;
  const email = (user.email ?? "").trim().toLowerCase();
  if (!email) return null;
  const porMail = await sb
    .from("contacts")
    .select("id, full_name, email, phone, phone_verified_at")
    .eq("email", email)
    .maybeSingle();
  return (porMail.data as ContactoSesion | null) ?? null;
}

export type ContactoSesion = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  phone_verified_at: string | null;
};

export const ligaDelEspacio = (token: string) => `${SITE}/caminante/g/${token}`;
