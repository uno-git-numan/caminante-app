// Datos de "Mi espacio" (la página personal del caminante). Una sola query
// layer, mismo espíritu que lib/admin/queries.ts: el server component pinta,
// aquí se agrega. Lecturas con service-role (la página está gated por sesión
// y todo se filtra por el contact ligado al user) — experience_feedback no
// tiene policy select_own, por eso no basta RLS.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureContactLink } from "@/lib/crm/contacts";
import type { User } from "@supabase/supabase-js";

const SITE = "https://caminante.numanhub.com";

const HOLDING = ["requested", "confirmed", "partially_paid", "paid", "completed"];

export type PagoChip = "pagada" | "parcial" | "pendiente";

export type ProximaSalida = {
  reservaId: string;
  slug: string;
  titulo: string;
  lugar: string; // eyebrow "// Xalatlaco · Edo. Méx."
  foto: string | null;
  fecha: string; // chip: label de la salida ("Domingo 26 jul")
  personasLinea: string; // "2 lugares · tú y Emilia"
  pago: PagoChip;
  // null = la experiencia no usa deslinde; "firmado"; o URL para firmar
  deslinde: "firmado" | { firmarUrl: string } | null;
  pagarUrl: string; // /caminante/reservar/<slug>(?grupo=token) — completar pago
  // Invitar a la gente: link para que se sumen a ESTA salida.
  invite: {
    esPrivada: boolean; // salida de grupo (link cerrado) vs abierta
    link: string; // URL absoluta a compartir
    cupoLinea: string; // "El cupo es de 8; ya van 2." o "" si sin tope
  };
};

export type SalidaVivida = {
  slug: string;
  titulo: string;
  meta: string; // "Ensenada de Muertos · 15 jun 2026"
  foto: string | null;
  // token = falta contestar (link a /feedback/[token]); "hecha"; null = sin invitación
  encuesta: { token: string } | "hecha" | null;
};

export type Firma = {
  id: string;
  titulo: string;
  version: string;
  fecha: string;
  docUrl: string | null;
};

export type Acompanante = {
  id: string;
  nombre: string;
  linea: string; // "9 años · hija"
};

export type MiEspacio = {
  contactId: string | null;
  nombre: string; // primer nombre para el saludo
  datos: {
    nombreCompleto: string;
    email: string;
    whatsapp: string;
    ciudad: string;
    nacimiento: string; // ISO para el input date
    nacimientoFmt: string;
    mailingOptIn: boolean;
  };
  medico: {
    sangre: string;
    alergias: string;
    condiciones: string;
    medicamentos: string;
    dieta: string;
    emergenciaNombre: string;
    emergenciaRelacion: string;
    emergenciaTel: string;
  } | null;
  proximas: ProximaSalida[];
  vividas: SalidaVivida[];
  acompanantes: Acompanante[];
  firmas: Firma[];
};

type ExpData = {
  title?: string;
  titleAccent?: string;
  cardTitle?: string;
  subtitle?: string;
  heroImageUrl?: string;
  cardPloc?: string;
  feedback?: { locationLabel?: string };
  registration?: { active?: boolean };
};

function titulo(d: ExpData | null, slug: string): string {
  if (!d) return slug;
  const full = [d.title, d.titleAccent].filter(Boolean).join(" ").trim();
  return d.cardTitle || full || d.subtitle || slug;
}

function lugarDe(d: ExpData | null): string {
  // locationLabel = "Ensenada de Muertos, BCS"; cardPloc = "BCS · Junio 2026"
  const loc = d?.feedback?.locationLabel;
  if (loc) return loc.replace(",", " ·");
  return d?.cardPloc?.split("·")[0]?.trim() ?? "";
}

function fmtFecha(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Mexico_City",
  }).format(new Date(iso));
}

function edad(birthIso: string | null): number | null {
  if (!birthIso) return null;
  const n = new Date(birthIso);
  if (isNaN(n.getTime())) return null;
  const hoy = new Date();
  let e = hoy.getFullYear() - n.getFullYear();
  const m = hoy.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) e--;
  return e;
}

export async function fetchMiEspacio(user: User): Promise<MiEspacio> {
  const sb = createSupabaseAdminClient();

  try {
    await ensureContactLink(sb, user);
  } catch {
    // sin liga el resto sale vacío pero la página no truena
  }

  const { data: contact } = await sb
    .from("contacts")
    .select("id, full_name, email, phone, city, birth_date, mailing_opt_in")
    .eq("user_id", user.id)
    .maybeSingle();

  const nombreCompleto = (contact?.full_name as string) || "";
  const base: MiEspacio = {
    contactId: (contact?.id as string) ?? null,
    nombre: nombreCompleto.split(/\s+/)[0] || "caminante",
    datos: {
      nombreCompleto,
      email: (contact?.email as string) || user.email || "",
      whatsapp: (contact?.phone as string) || "",
      ciudad: (contact?.city as string) || "",
      nacimiento: (contact?.birth_date as string) || "",
      nacimientoFmt: contact?.birth_date ? fmtFecha(contact.birth_date as string) : "",
      mailingOptIn: Boolean(contact?.mailing_opt_in),
    },
    medico: null,
    proximas: [],
    vividas: [],
    acompanantes: [],
    firmas: [],
  };
  if (!contact) return base;

  const [medRes, depRes, resvRes, regRes] = await Promise.all([
    sb.from("medical_profiles").select("*").eq("contact_id", contact.id).maybeSingle(),
    sb
      .from("dependents")
      .select("id, full_name, relationship, birth_date")
      .eq("guardian_contact_id", contact.id)
      .order("full_name"),
    sb
      .from("reservations")
      .select("id, num_people, status, slot_id, experience_id")
      .eq("contact_id", contact.id)
      .in("status", HOLDING),
    sb
      .from("registrations")
      .select(
        "id, reservation_id, waiver_version, waiver_doc_url, signed_at, participants, identity_snapshot, experiences ( slug, data )",
      )
      .eq("contact_id", contact.id)
      .order("signed_at", { ascending: false }),
  ]);

  const m = medRes.data;
  if (m) {
    base.medico = {
      sangre: (m.blood_type as string) || "",
      alergias: (m.allergies as string) || "",
      condiciones: (m.conditions as string) || "",
      medicamentos: (m.medications as string) || "",
      dieta: (m.dietary_restrictions as string) || "",
      emergenciaNombre: (m.emergency_name as string) || "",
      emergenciaRelacion: (m.emergency_relationship as string) || "",
      emergenciaTel: (m.emergency_phone as string) || "",
    };
  }

  base.acompanantes = ((depRes.data || []) as {
    id: string;
    full_name: string;
    relationship: string | null;
    birth_date: string | null;
  }[]).map((d) => {
    const e = edad(d.birth_date);
    const partes = [e != null ? `${e} años` : null, d.relationship || null].filter(Boolean);
    return { id: d.id, nombre: d.full_name, linea: partes.join(" · ") };
  });

  // ── Reservas → próximas / vividas ──────────────────────────────────────
  const resvs = (resvRes.data || []) as {
    id: string;
    num_people: number;
    status: string;
    slot_id: string | null;
    experience_id: string;
  }[];
  const regs = (regRes.data || []) as {
    id: string;
    reservation_id: string;
    waiver_version: string;
    waiver_doc_url: string | null;
    signed_at: string;
    participants: { full_name?: string }[] | null;
    identity_snapshot: { slot_label?: string } | null;
    experiences: { slug: string; data: ExpData | null } | { slug: string; data: ExpData | null }[] | null;
  }[];

  const slotIds = resvs.map((r) => r.slot_id).filter(Boolean) as string[];
  const expIds = [...new Set(resvs.map((r) => r.experience_id))];

  const [slotsRes, expsRes, fbRes] = await Promise.all([
    slotIds.length
      ? sb
          .from("experience_slots")
          .select("id, label, starts_at, ends_at, visibility, access_token, capacity_total")
          .in("id", slotIds)
      : Promise.resolve({ data: [] as unknown[] }),
    expIds.length
      ? sb.from("experiences").select("id, slug, data").in("id", expIds)
      : Promise.resolve({ data: [] as unknown[] }),
    slotIds.length
      ? sb
          .from("experience_feedback")
          .select("slot_id, token, status")
          .eq("contact_id", contact.id)
          .in("slot_id", slotIds)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  const slots = new Map(
    ((slotsRes.data || []) as {
      id: string;
      label: string | null;
      starts_at: string | null;
      ends_at: string | null;
      visibility: string | null;
      access_token: string | null;
      capacity_total: number | null;
    }[]).map((s) => [s.id, s]),
  );

  // Ocupación por salida (Σ num_people HOLDING de TODAS las reservas, no solo las
  // de este usuario) → "ya van X" del bloque de invitar.
  const takenBySlot = new Map<string, number>();
  if (slotIds.length) {
    const { data: allResv } = await sb
      .from("reservations")
      .select("slot_id, num_people, status")
      .in("slot_id", slotIds)
      .in("status", HOLDING);
    for (const r of (allResv || []) as { slot_id: string | null; num_people: number; status: string }[]) {
      if (r.slot_id) takenBySlot.set(r.slot_id, (takenBySlot.get(r.slot_id) || 0) + (r.num_people || 0));
    }
  }
  const exps = new Map(
    ((expsRes.data || []) as { id: string; slug: string; data: ExpData | null }[]).map((e) => [
      e.id,
      e,
    ]),
  );
  const fbBySlot = new Map(
    ((fbRes.data || []) as { slot_id: string; token: string; status: string }[]).map((f) => [
      f.slot_id,
      f,
    ]),
  );
  const firmadas = new Map(regs.map((r) => [r.reservation_id, r]));

  const ahora = Date.now();
  for (const r of resvs) {
    const slot = r.slot_id ? slots.get(r.slot_id) : null;
    const exp = exps.get(r.experience_id);
    const d = exp?.data ?? null;
    const fin = slot?.ends_at || slot?.starts_at;
    const pasada = fin ? new Date(fin).getTime() < ahora : false;
    const reg = firmadas.get(r.id);

    if (pasada) {
      const fb = r.slot_id ? fbBySlot.get(r.slot_id) : undefined;
      base.vividas.push({
        slug: exp?.slug || "",
        titulo: titulo(d, exp?.slug || ""),
        meta: [lugarDe(d), slot?.starts_at ? fmtFecha(slot.starts_at) : slot?.label]
          .filter(Boolean)
          .join(" · "),
        foto: d?.heroImageUrl || null,
        encuesta:
          fb?.status === "submitted" ? "hecha" : fb?.token ? { token: fb.token } : null,
      });
      continue;
    }

    // pax: "2 lugares · tú y Emilia" (nombres del roster congelado si existen)
    const otros = (reg?.participants || [])
      .map((p) => p.full_name?.split(/\s+/)[0])
      .filter(Boolean) as string[];
    const linea =
      r.num_people === 1
        ? "1 lugar"
        : `${r.num_people} lugares${
            otros.length
              ? ` · tú y ${otros.length === 1 ? otros[0] : `${otros.length} acompañantes`}`
              : ""
          }`;

    const pago: PagoChip =
      r.status === "paid" || r.status === "completed"
        ? "pagada"
        : r.status === "partially_paid"
          ? "parcial"
          : "pendiente";

    // Invitar: link para que amigos se sumen a ESTA salida. Si la salida es
    // de grupo privado, el link lleva su token (los revela solo con el link);
    // si es abierta, la página pública de la experiencia.
    const slug = exp?.slug || "";
    const esPrivada = slot?.visibility === "private" && !!slot?.access_token;
    const grupoQ = esPrivada ? `?grupo=${slot!.access_token}` : "";
    const inviteLink = `${SITE}/caminante/experiencias/${slug}${grupoQ}`;
    const cap = slot?.capacity_total ?? null;
    const yaVan = r.slot_id ? takenBySlot.get(r.slot_id) || 0 : 0;
    const cupoLinea = cap != null ? `El cupo es de ${cap}; ya van ${yaVan}.` : "";

    base.proximas.push({
      reservaId: r.id,
      slug,
      titulo: titulo(d, slug),
      lugar: lugarDe(d),
      foto: d?.heroImageUrl || null,
      fecha: slot?.label || "Por confirmar",
      personasLinea: linea,
      pago,
      deslinde: reg
        ? "firmado"
        : d?.registration?.active
          ? { firmarUrl: `/caminante/registro/${slug}?reserva=${r.id}` }
          : null,
      pagarUrl: `${SITE}/caminante/reservar/${slug}${grupoQ}`,
      invite: { esPrivada, link: inviteLink, cupoLinea },
    });
  }

  // ── Firmas (historial, todas — también las de reservas ya pasadas) ─────
  base.firmas = regs.map((r) => {
    const e = Array.isArray(r.experiences) ? r.experiences[0] : r.experiences;
    return {
      id: r.id,
      titulo: [titulo(e?.data ?? null, e?.slug || ""), r.identity_snapshot?.slot_label]
        .filter(Boolean)
        .join(" · "),
      version: r.waiver_version,
      fecha: fmtFecha(r.signed_at),
      docUrl: r.waiver_doc_url,
    };
  });

  return base;
}
