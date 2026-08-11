"use server";

// Adaptador de la pestaña MÁS del panel móvil (Comunicación · Solicitudes ·
// Operador · Generar cobro).
//
// REGLA DEL PATRÓN: no se escriben consultas nuevas para los mismos números.
// Todo sale de las fuentes que ya usa el escritorio:
//   · cola de redes      → listRecentPosts (lib/social/posts.ts, SOLO lectura)
//   · eventos            → fetchEventos (lib/admin/queries.ts)
//   · kit                → fetchKitContext + PIEZAS/PIEZAS_E + fetchEstadoPiezas
//   · solicitudes        → las mismas 3 consultas de /admin/solicitudes
//   · operador           → fetchOperatorProfile (lib/operators/public.ts)
//
// Va en un archivo "use server" porque dos de sus lecturas son PEREZOSAS: el
// Kit y el perfil del operador se cargan al abrir la pantalla, no al abrir la
// app. Precargarlos para las 9 experiencias y todos los operadores costaría
// decenas de consultas en cada carga del panel entero (Panorama, Eventos, Gente
// y Recursos viven en la misma página) para datos que casi nunca se miran.
// Cada función re-verifica admin: una server action es un endpoint público y el
// gate del layout no la cubre.

import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cdmxDay, fetchEventos, experienceTitle } from "@/lib/admin/queries";
import { listRecentPosts, type SocialPost } from "@/lib/social/posts";
import { HORA_PUBLICACION } from "@/lib/social/publish-hora";
import { fetchEstadoPiezas, fechaPill, type PiezaEnCola } from "@/lib/kit/pieza-estado";
import { fetchKitContext } from "@/lib/kit/queries";
import { PIEZAS, PIEZAS_E, expName, type PieceDef, type PieceState } from "@/lib/kit/kit";
import { captionToText, palabraTrigger, type KitCaptions } from "@/lib/ai/kit-captions";
import { fetchConnectedAccount } from "@/lib/social/accounts";
import { fetchOperatorProfile, type OperatorProfile } from "@/lib/operators/public";
import type { Experience } from "@/lib/experiences/types";

// ── Tipos que consumen las pantallas ─────────────────────────────────────────

/** Una publicación de la cola, ya formateada para pintarse. */
export type ColaMovil = {
  id: string;
  pieza: string; // piece_id ("P3", "E2") o "—" si se publicó suelta
  evento: string; // nombre del evento (o el slug si no hay nombre)
  slug: string | null;
  /** Las tres etiquetas del entregable. Coinciden con las llaves de `Life`. */
  estado: "programada" | "publicada" | "falló";
  cuando: string; // "24 jul · ~1:00 p.m." / "16 jul 13:04" / motivo del fallo
  diaCdmx: string | null; // "YYYY-MM-DD" — para el calendario
  permalink: string | null;
};

export type EventoComMovil = {
  slug: string;
  nombre: string;
  publicado: boolean;
  piezas: number; // piezas suyas vivas en la cola
  programadas: number;
  publicadas: number;
};

/** Día de salida (para marcarlo en el calendario junto a las piezas). */
export type SalidaMovil = { diaCdmx: string; label: string; evento: string };

export type SolFechaMovil = {
  id: string;
  cliente: string;
  email: string;
  whatsapp: string;
  experiencia: string;
  slug: string;
  desiredDate: string | null; // "YYYY-MM-DD"
  nota: string | null;
  personas: number;
  groupType: "open" | "private";
  hace: string;
};

export type SolOperadorMovil = { email: string; nombre: string; hace: string };

export type SolEmbajadorMovil = {
  id: string;
  nombre: string;
  email: string;
  whatsapp: string | null;
  perfil: string;
  links: string;
  experiencia: string | null;
  porque: string | null;
  conociste: string | null;
  hace: string;
};

/** Fila del histórico: resuelta con ✓ (aprobada) o ✕ (rechazada). */
export type HistoricoMovil = { ok: boolean; titulo: string; sub: string };

export type OperadorLista = {
  id: string;
  nombre: string;
  slug: string | null; // sin slug no hay perfil público que abrir
  publico: boolean;
};

export type CobroOpcion = {
  slug: string;
  nombre: string;
  salidas: { id: string; label: string; privada: boolean }[];
};

export type MasMovil = {
  /** Badge de la pestaña: todo lo que está esperando una decisión. */
  pendientes: number;
  cola: ColaMovil[];
  eventos: EventoComMovil[];
  salidas: SalidaMovil[];
  solicitudes: {
    fecha: SolFechaMovil[];
    operador: SolOperadorMovil[];
    embajador: SolEmbajadorMovil[];
    historico: HistoricoMovil[];
  };
  operadores: OperadorLista[];
  cobro: CobroOpcion[];
};

export type PiezaMovil = {
  id: string;
  nombre: string;
  trabajo: string;
  formato: string;
  cara: string;
  /** Llave de `Life` (kit.tsx). */
  estado: "falta insumo" | "faltan fotos" | "sin caption" | "lista" | "programada" | "publicada" | "falló";
  /** Segunda línea de la fila: la fecha de la cola o el conteo de láminas. */
  detalle: string;
  caption: string | null; // texto ya armado (gancho→cuerpo→pregunta→CTA)
  hashtags: string[];
  trigger: string | null; // palabra a vigilar en comentarios
  porques: { safe: string; real: string; raw: string } | null;
  razon: string | null; // por qué está pendiente (con la sección que la desbloquea)
  permalink: string | null;
};

export type KitMovil = {
  slug: string;
  nombre: string;
  cuenta: string | null; // @usuario de Instagram conectado
  total: number;
  kpis: { listas: number; conCaption: number; programadas: number; publicadas: number };
  grupos: { momento: string; piezas: PiezaMovil[] }[];
};

// ── Utilidades locales ───────────────────────────────────────────────────────

const TZ = "America/Mexico_City";

/** "hace 3 d" / "hace 5 h" / "hoy" — la antigüedad que pide el entregable. */
function hace(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const min = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} d`;
}

function fmtFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: TZ });
  } catch {
    return iso;
  }
}

// La hora de una PROGRAMADA es la del cron (~1pm), no la normalizada a 08:00
// UTC que solo marca el día — mismo criterio que la cola de escritorio.
function cuandoDe(p: SocialPost): string {
  if (p.status === "published") return fechaPill(p.publishedAt, true);
  if (p.status === "failed") return p.error ? p.error.slice(0, 90) : "sin motivo registrado";
  return `${fechaPill(p.scheduledAt, false)} · ${HORA_PUBLICACION}`;
}

function estadoDe(s: SocialPost["status"]): ColaMovil["estado"] | null {
  if (s === "published") return "publicada";
  if (s === "failed") return "falló";
  if (s === "scheduled" || s === "publishing") return "programada";
  return null; // cancelada: no es un estado vigente, no entra a la cola
}

function nombreDeNota(note: string | null): string {
  const m = /solicitud operador:\s*(.+)/i.exec(note || "");
  return m ? m[1].trim() : "";
}

const vacio: MasMovil = {
  pendientes: 0,
  cola: [],
  eventos: [],
  salidas: [],
  solicitudes: { fecha: [], operador: [], embajador: [], historico: [] },
  operadores: [],
  cobro: [],
};

// ── Filas crudas ─────────────────────────────────────────────────────────────

type SolRow = {
  id: string;
  desired_date: string | null;
  nota: string | null;
  num_people: number;
  group_type: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  contacts: { full_name: string | null; email: string | null; phone: string | null } | null;
  experiences: { slug: string; data: Partial<Experience> | null } | null;
};

type WLRow = { email: string; is_active: boolean; note: string | null; created_at: string };

type EmbRow = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string | null;
  profile_kind: string;
  social_links: string;
  experience: string | null;
  why_caminante: string | null;
  referral_source: string | null;
  status: string;
  created_at: string;
};

type SlotRow = {
  id: string;
  experience_id: string;
  label: string | null;
  starts_at: string | null;
  visibility: string | null;
};

// Aplicaciones de embajador y operadores: best-effort. Si la tabla no existe
// (0029 / 0020 sin aplicar), la sección sale vacía y nada se cae — mismo patrón
// que el panel de escritorio.
async function embApps(): Promise<EmbRow[]> {
  try {
    const sb = createSupabaseAdminClient();
    const { data, error } = await sb
      .from("ambassador_applications")
      .select(
        "id, full_name, email, whatsapp, profile_kind, social_links, experience, why_caminante, referral_source, status, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as EmbRow[];
  } catch {
    return [];
  }
}

async function operadoresLista(): Promise<OperadorLista[]> {
  try {
    const sb = createSupabaseAdminClient();
    const { data, error } = await sb
      .from("operators")
      .select("id, name, slug, is_public")
      .eq("active", true)
      .order("name", { ascending: true });
    if (error) return [];
    return ((data ?? []) as { id: string; name: string | null; slug: string | null; is_public: boolean }[]).map(
      (o) => ({
        id: o.id,
        nombre: o.name || "—",
        slug: (o.slug || "").trim() || null,
        publico: !!o.is_public,
      }),
    );
  } catch {
    return [];
  }
}

// ── MÁS: todo lo que la pestaña necesita de un tiro ──────────────────────────

export async function fetchMasMovil(): Promise<MasMovil> {
  if (!(await isCurrentUserAdmin())) return vacio;
  const sb = createSupabaseAdminClient();

  const [eventos, posts, solRes, wlRes, embs, ops, slotsRes] = await Promise.all([
    fetchEventos(),
    listRecentPosts(300),
    sb
      .from("slot_requests")
      .select(
        "id, desired_date, nota, num_people, group_type, status, created_at, resolved_at, contacts(full_name, email, phone), experiences(slug, data)",
      )
      .order("created_at", { ascending: false }),
    sb.from("admin_whitelist").select("email, is_active, note, created_at").order("created_at", { ascending: false }),
    embApps(),
    operadoresLista(),
    sb
      .from("experience_slots")
      .select("id, experience_id, label, starts_at, visibility")
      .eq("status", "open"),
  ]);

  const nombrePorSlug = new Map(eventos.map((e) => [e.slug, e.nombre]));

  // ── Cola de redes ──
  const cola: ColaMovil[] = [];
  for (const p of posts) {
    const estado = estadoDe(p.status);
    if (!estado) continue;
    const ref = p.publishedAt || p.scheduledAt || p.createdAt;
    cola.push({
      id: p.id,
      pieza: p.pieceId || "—",
      evento: (p.experienceSlug && nombrePorSlug.get(p.experienceSlug)) || p.experienceSlug || "—",
      slug: p.experienceSlug,
      estado,
      cuando: cuandoDe(p),
      diaCdmx: ref ? cdmxDay(ref) : null,
      permalink: p.igPermalink,
    });
  }

  const porEvento = new Map<string, ColaMovil[]>();
  for (const c of cola) {
    if (!c.slug) continue;
    porEvento.set(c.slug, [...(porEvento.get(c.slug) ?? []), c]);
  }
  const eventosCom: EventoComMovil[] = eventos.map((e) => {
    const suya = porEvento.get(e.slug) ?? [];
    return {
      slug: e.slug,
      nombre: e.nombre,
      publicado: e.status === "published",
      piezas: suya.length,
      programadas: suya.filter((c) => c.estado === "programada").length,
      publicadas: suya.filter((c) => c.estado === "publicada").length,
    };
  });

  // ── Salidas abiertas (calendario + selector de cobro) ──
  const hoy = cdmxDay(new Date());
  const slots = ((slotsRes.data ?? []) as SlotRow[]).filter((s) => s.starts_at && cdmxDay(s.starts_at) >= hoy);
  const porExpId = new Map(eventos.map((e) => [e.id, e]));
  const salidas: SalidaMovil[] = slots
    .map((s) => ({
      diaCdmx: cdmxDay(s.starts_at as string),
      label: s.label || fmtFecha(s.starts_at as string),
      evento: porExpId.get(s.experience_id)?.nombre ?? "—",
    }))
    .sort((a, b) => a.diaCdmx.localeCompare(b.diaCdmx));

  const cobro: CobroOpcion[] = eventos
    .filter((e) => e.status === "published")
    .map((e) => ({
      slug: e.slug,
      nombre: e.nombre,
      salidas: slots
        .filter((s) => s.experience_id === e.id)
        .sort((a, b) => (a.starts_at || "").localeCompare(b.starts_at || ""))
        .map((s) => ({
          id: s.id,
          label: s.label || fmtFecha(s.starts_at as string),
          privada: s.visibility === "private",
        })),
    }));

  // ── Solicitudes ──
  const solRows = (solRes.data ?? []) as unknown as SolRow[];
  const tituloExp = (r: SolRow) => experienceTitle(r.experiences?.data ?? null, r.experiences?.slug ?? "");
  const fecha: SolFechaMovil[] = solRows
    .filter((r) => r.status === "new")
    .map((r) => ({
      id: r.id,
      cliente: r.contacts?.full_name || "Sin nombre",
      email: r.contacts?.email || "—",
      whatsapp: r.contacts?.phone || "—",
      experiencia: tituloExp(r),
      slug: r.experiences?.slug || "",
      desiredDate: r.desired_date,
      nota: r.nota,
      personas: r.num_people,
      groupType: r.group_type === "open" ? "open" : "private",
      hace: hace(r.created_at),
    }));

  const wl = (wlRes.data ?? []) as WLRow[];
  const operador: SolOperadorMovil[] = wl
    .filter((r) => !r.is_active)
    .map((r) => ({ email: r.email, nombre: nombreDeNota(r.note), hace: hace(r.created_at) }));

  const embajador: SolEmbajadorMovil[] = embs
    .filter((r) => r.status === "pending")
    .map((r) => ({
      id: r.id,
      nombre: r.full_name,
      email: r.email,
      whatsapp: r.whatsapp,
      perfil: r.profile_kind,
      links: r.social_links,
      experiencia: r.experience,
      porque: r.why_caminante,
      conociste: r.referral_source,
      hace: hace(r.created_at),
    }));

  // Histórico: lo ya resuelto de las tres bandejas, lo más reciente arriba.
  const historico: HistoricoMovil[] = [
    ...solRows
      .filter((r) => r.status !== "new")
      .map((r) => ({
        ok: r.status === "approved",
        titulo: `${r.contacts?.full_name || "—"} · ${tituloExp(r)}`,
        sub: `fecha · ${r.status === "approved" ? "aprobada" : "rechazada"}${
          r.resolved_at ? " · " + fmtFecha(r.resolved_at) : ""
        }`,
        orden: r.resolved_at || r.created_at,
      })),
    ...embs
      .filter((r) => r.status !== "pending")
      .map((r) => ({
        ok: r.status === "approved",
        titulo: r.full_name,
        sub: `embajador · ${r.status === "approved" ? "aprobado" : "rechazado"} · ${fmtFecha(r.created_at)}`,
        orden: r.created_at,
      })),
    ...wl
      .filter((r) => r.is_active)
      .map((r) => ({
        ok: true,
        titulo: r.email,
        sub: `operador · con acceso al panel${r.note ? " · " + r.note : ""}`,
        orden: r.created_at,
      })),
  ]
    .sort((a, b) => (b.orden || "").localeCompare(a.orden || ""))
    .slice(0, 30)
    .map(({ ok, titulo, sub }) => ({ ok, titulo, sub }));

  return {
    pendientes: fecha.length + operador.length + embajador.length,
    cola,
    eventos: eventosCom,
    salidas,
    solicitudes: { fecha, operador, embajador, historico },
    operadores: ops,
    cobro,
  };
}

// ── KIT (perezoso) ───────────────────────────────────────────────────────────
//
// El ciclo de vida es el MISMO que pinta el tablero de escritorio: la cola
// manda; si no hay cola, insumos; si hay insumos, caption. En el teléfono se ve
// el ESTADO y nada más: exportar PNG y programar campaña rasterizan las láminas
// leyendo `[data-piece] .slide` del DOM off-screen del Kit de escritorio, que
// aquí no existe. Para ACTUAR se abre la computadora.
function cicloMovil(
  state: PieceState,
  tieneCaption: boolean,
  cola: PiezaEnCola | undefined,
): { estado: PiezaMovil["estado"]; detalle: string } {
  if (cola) {
    if (cola.status === "published") return { estado: "publicada", detalle: fechaPill(cola.publishedAt, true) };
    if (cola.status === "failed") {
      return { estado: "falló", detalle: cola.error ? cola.error.slice(0, 90) : "sin motivo registrado" };
    }
    return { estado: "programada", detalle: `${fechaPill(cola.scheduledAt, false)} · ${HORA_PUBLICACION}` };
  }
  if (state.estado === "pendiente") {
    // Una pieza trabada POR FOTOS lo dice a la cara: se resuelve subiendo fotos,
    // no completando la ficha.
    const fotos = /foto/i.test(state.razon);
    return { estado: fotos ? "faltan fotos" : "falta insumo", detalle: state.razon };
  }
  if (!tieneCaption) return { estado: "sin caption", detalle: "usa «Captions con IA»" };
  return {
    estado: "lista",
    detalle: `${state.laminas.length} lámina${state.laminas.length === 1 ? "" : "s"}`,
  };
}

export async function cargarKitMovil(slug: string): Promise<KitMovil | null> {
  if (!(await isCurrentUserAdmin())) return null;
  const ctx = await fetchKitContext(slug);
  if (!ctx) return null;

  const captions = ((ctx.exp as unknown as { kitCaptions?: KitCaptions }).kitCaptions) ?? {};
  const cola = await fetchEstadoPiezas(slug);
  const cuenta = await fetchConnectedAccount("instagram");

  const todas: { def: PieceDef; state: PieceState }[] = [...PIEZAS, ...PIEZAS_E].map((p) => ({
    def: p,
    state: p.build(ctx),
  }));

  const piezas: PiezaMovil[] = todas.map(({ def, state }) => {
    const cap = captions[def.id];
    const { estado, detalle } = cicloMovil(state, !!cap, cola[def.id]);
    return {
      id: def.id,
      nombre: def.nombre,
      trabajo: def.trabajo,
      formato: def.formato,
      cara: def.cara,
      estado,
      detalle,
      // Los 3 porqués son nota interna: NUNCA van en el texto copiable.
      caption: cap ? captionToText({ ...cap, hashtags: [] }) : null,
      hashtags: cap?.hashtags ?? [],
      trigger: palabraTrigger(cap),
      porques: cap?.porques ?? null,
      razon: state.estado === "pendiente" ? state.razon : null,
      permalink: cola[def.id]?.igPermalink ?? null,
    };
  });

  const listas = todas.filter((x) => x.state.estado === "lista");
  const enCola = todas.map((x) => cola[x.def.id]).filter(Boolean) as PiezaEnCola[];

  // Los momentos salen del orden real de PIEZAS/PIEZAS_E (M1 → M2 → M3 → E).
  const grupos: KitMovil["grupos"] = [];
  todas.forEach(({ def }, i) => {
    const g = grupos.find((x) => x.momento === def.momento);
    if (g) g.piezas.push(piezas[i]);
    else grupos.push({ momento: def.momento, piezas: [piezas[i]] });
  });

  return {
    slug,
    nombre: expName(ctx.exp),
    cuenta: cuenta && cuenta.status === "connected" ? cuenta.username : null,
    total: piezas.length,
    kpis: {
      listas: listas.length,
      conCaption: listas.filter((x) => captions[x.def.id]).length,
      programadas: enCola.filter((c) => c.status === "scheduled" || c.status === "publishing").length,
      publicadas: enCola.filter((c) => c.status === "published").length,
    },
    grupos,
  };
}

// ── OPERADOR (perezoso) ──────────────────────────────────────────────────────
// Devuelve el MISMO perfil que sirve la página pública (`includeDraft` para
// poder verlo en borrador): así el teléfono no puede discrepar de lo que ve el
// visitante. La edición vive en el panel de escritorio.
export async function cargarOperadorMovil(slug: string): Promise<OperatorProfile | null> {
  if (!(await isCurrentUserAdmin())) return null;
  return fetchOperatorProfile(slug, { includeDraft: true });
}
