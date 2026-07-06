// Fusiona el resultado del pre-llenado con IA sobre el estado del formulario v2.
// Regla: la IA solo escribe donde trae contenido — JAMÁS pisa con vacío algo que
// el admin ya capturó. Las fotos nunca vienen de la IA: al fusionar secciones se
// preservan las imágenes del borrador previo (mosaico, guías, fondos).
//
// La IA devuelve el contenido con la forma de V2Draft (secciones del diseño
// bespoke ensenada/hongos) + los metadatos de la experiencia (estado, tarjeta,
// precio, deslinde, encuesta). `aplicarPrellenadoV2` reparte: metadatos → exp,
// secciones → draft. Normalización de categorías cerradas: estado → uno de
// ESTADOS exacto; moneda → canónica.

import type { Experience } from "@/lib/experiences/types";
import type { V2Draft, V2GuideDraft } from "@/lib/experiences/page-v2";
import { emptyGuide, parseBeat } from "@/lib/experiences/page-v2";
import type { SlotIA } from "./prellenar";
import { ESTADOS } from "@/lib/experiences/estados";

function lleno(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  return true;
}
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const strs = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];

// ── Normalizadores de categoría cerrada ─────────────────────────────────────
function base(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .replace(/[.\-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Alias comunes → estado canónico. Cubre variantes que la IA o Luis podrían escribir.
const ALIAS_ESTADO: Record<string, string> = {
  "edomex": "Estado de México",
  "edo mex": "Estado de México",
  "edo de mexico": "Estado de México",
  "estado de mex": "Estado de México",
  "estado mexico": "Estado de México",
  "mexico estado": "Estado de México",
  "cdmx": "Ciudad de México",
  "ciudad de mexico": "Ciudad de México",
  "df": "Ciudad de México",
  "distrito federal": "Ciudad de México",
  "bcs": "Baja California Sur",
  "baja california sur": "Baja California Sur",
  "bc": "Baja California",
  "slp": "San Luis Potosí",
  "qroo": "Quintana Roo",
  "q roo": "Quintana Roo",
};

// Devuelve el estado canónico o "" (Luis lo elige en el dropdown). Nunca adivina.
export function normalizarEstado(raw: string): string {
  const b = base(raw);
  if (!b) return "";
  const directo = ESTADOS.find((e) => base(e) === b);
  if (directo) return directo;
  if (ALIAS_ESTADO[b]) return ALIAS_ESTADO[b];
  return "";
}

function normalizarMoneda(raw: string | undefined): string {
  const b = base(raw ?? "");
  if (b.includes("usd") || b.includes("dolar") || b.includes("dollar")) {
    return "USD · por persona";
  }
  return "MXN · por persona"; // default de la marca
}

// ── Tipos sueltos de lo que manda la IA (parseo tolerante) ──────────────────
type RawGuide = {
  eyebrow?: string; title?: string; titleAccent?: string; subEyebrow?: string;
  items?: { name?: string; role?: string }[];
  paragraphs?: string[]; lead?: string;
};
type RawDay = { num?: string; lab?: string; ttl?: string; items?: string[] };

export function aplicarPrellenadoV2(
  prevExp: Experience,
  prevDraft: V2Draft,
  raw: Record<string, unknown>,
): { exp: Experience; draft: V2Draft } {
  const d = raw as {
    estado?: string; cardTitle?: string; cardPloc?: string; cardHook?: string;
    price?: { amount?: string; currency?: string; desc?: string };
    priceTiers?: { label?: string; amount?: string }[];
    hero?: { eyebrow?: string; metaEst?: string; title?: string; titleAccent?: string; sub?: string };
    experiencia?: { title?: string; titleAccent?: string; points?: string[] };
    statement?: { eyebrowPre?: string; eyebrow?: string; title?: string; titleAccent?: string; body?: string; quote?: string };
    guides?: RawGuide[];
    itinerario?: { title?: string; titleAccent?: string; days?: RawDay[] };
    tariff?: { title?: string; titleAccent?: string; lead?: string; tier?: string; price?: string; priceCur?: string; availK?: string; availV?: string };
    checklist?: { eyebrow?: string; title?: string; titleAccent?: string; yesItems?: string[]; noTitle?: string; noItems?: string[]; noMark?: string };
    faq?: { q?: string; a?: string }[];
    packing?: { cap?: string; items?: string[] };
    dates?: { title?: string; titleAccent?: string; cap?: string; priceLine?: string };
    waiverClauses?: string[];
    feedbackLocationLabel?: string;
    feedbackSections?: { key: string; label: string; icon?: string; prompt?: string }[];
  };

  const exp: Experience = { ...prevExp };
  const draft: V2Draft = structuredClone(prevDraft);

  // ── metadatos → exp ────────────────────────────────────────────────────
  if (lleno(d.estado)) {
    const norm = normalizarEstado(d.estado!);
    if (norm) exp.estado = norm; // sin match confiable → conserva lo previo
  }
  if (lleno(d.cardTitle)) exp.cardTitle = d.cardTitle;
  if (lleno(d.cardPloc)) exp.cardPloc = d.cardPloc;
  if (lleno(d.cardHook)) exp.cardHook = d.cardHook;

  if (d.price && (lleno(d.price.amount) || lleno(d.price.desc))) {
    const b = prevExp.price ?? { amount: "", currency: "MXN · por persona", desc: "" };
    exp.price = {
      amount: lleno(d.price.amount) ? d.price.amount! : b.amount,
      currency: lleno(d.price.currency) ? normalizarMoneda(d.price.currency) : b.currency,
      desc: lleno(d.price.desc) ? d.price.desc! : b.desc,
    };
  }
  if (lleno(d.priceTiers)) {
    const tiers = d.priceTiers!
      .filter((t) => lleno(t.label) && lleno(t.amount))
      .map((t) => ({ label: t.label!.trim(), amount: t.amount!.trim() }));
    if (tiers.length) exp.priceTiers = tiers;
  }

  // Deslinde: solo el resumen de cláusulas. active/versión/doc los decide Luis.
  if (lleno(d.waiverClauses)) {
    const reg = prevExp.registration ?? { active: false, waiverVersion: "v1", waiverDocUrl: "", waiverClauses: [] };
    exp.registration = { ...reg, waiverClauses: strs(d.waiverClauses) };
  }
  // Encuesta: locación + secciones. active la decide Luis.
  if (lleno(d.feedbackLocationLabel) || lleno(d.feedbackSections)) {
    const fb = prevExp.feedback ?? { active: false, version: "v1", locationLabel: "", npsEnabled: true, sections: [], testimonialPrompt: "" };
    exp.feedback = {
      ...fb,
      locationLabel: lleno(d.feedbackLocationLabel) ? d.feedbackLocationLabel! : fb.locationLabel,
      sections: lleno(d.feedbackSections) ? d.feedbackSections! : fb.sections,
    };
  }

  // ── secciones → draft (preservando imágenes previas) ───────────────────
  if (d.hero) {
    const h = d.hero;
    if (lleno(h.eyebrow)) draft.hero.eyebrow = h.eyebrow!;
    if (lleno(h.metaEst)) draft.hero.metaEst = h.metaEst!;
    if (lleno(h.title)) draft.hero.title = h.title!;
    if (lleno(h.titleAccent)) draft.hero.titleAccent = h.titleAccent!;
    if (lleno(h.sub)) draft.hero.sub = h.sub!;
    // El título del hero también nombra la experiencia (tarjetas, admin, slug).
    if (lleno(h.title)) {
      exp.title = h.title!;
      exp.titleAccent = str(h.titleAccent);
      if (lleno(h.sub)) exp.subtitle = h.sub!;
    }
  }

  if (d.experiencia) {
    const x = d.experiencia;
    if (lleno(x.title)) { draft.experiencia.title = x.title!; draft.experiencia.on = true; }
    if (lleno(x.titleAccent)) draft.experiencia.titleAccent = x.titleAccent!;
    const pts = strs(x.points);
    if (pts.length) { draft.experiencia.points = pts; draft.experiencia.on = true; }
    // mosaico: se conserva el previo (fotos = manuales)
  }

  if (d.statement && (lleno(d.statement.title) || lleno(d.statement.body))) {
    const s = d.statement;
    draft.statement = {
      ...draft.statement,
      on: true,
      eyebrowPre: lleno(s.eyebrowPre) ? s.eyebrowPre! : draft.statement.eyebrowPre,
      eyebrow: lleno(s.eyebrow) ? s.eyebrow! : draft.statement.eyebrow,
      title: lleno(s.title) ? s.title! : draft.statement.title,
      titleAccent: lleno(s.titleAccent) ? s.titleAccent! : draft.statement.titleAccent,
      body: lleno(s.body) ? s.body! : draft.statement.body,
      quote: lleno(s.quote) ? s.quote! : draft.statement.quote,
      // bg se conserva
    };
  }

  if (Array.isArray(d.guides) && d.guides.length) {
    draft.guides = d.guides
      .filter((g) => lleno(g.title) || lleno(g.items) || lleno(g.paragraphs))
      .map((g, i): V2GuideDraft => {
        const previo = prevDraft.guides[i];
        const paragraphs = strs(g.paragraphs);
        const items = (g.items ?? [])
          .filter((it) => lleno(it.name))
          .map((it) => ({ name: it.name!, role: str(it.role) }));
        const g0 = previo ?? emptyGuide();
        return {
          ...g0,
          // alterna el fondo para el ritmo visual del diseño (panel/cream)
          bg: previo?.bg ?? (i % 2 === 0 ? "panel" : "cream"),
          eyebrow: lleno(g.eyebrow) ? g.eyebrow! : g0.eyebrow,
          title: lleno(g.title) ? g.title! : g0.title,
          titleAccent: lleno(g.titleAccent) ? g.titleAccent! : g0.titleAccent,
          subEyebrow: lleno(g.subEyebrow) ? g.subEyebrow! : g0.subEyebrow,
          mode: paragraphs.length ? "paragraphs" : items.length ? "items" : g0.mode,
          items: items.length ? items : g0.items,
          paragraphs: paragraphs.length ? paragraphs : g0.paragraphs,
          lead: lleno(g.lead) ? g.lead! : g0.lead,
          images: g0.images, // fotos = manuales
        };
      });
  }

  if (d.itinerario && lleno(d.itinerario.days)) {
    const it = d.itinerario;
    draft.itinerary = {
      ...draft.itinerary,
      on: true,
      title: lleno(it.title) ? it.title! : draft.itinerary.title,
      titleAccent: lleno(it.titleAccent) ? it.titleAccent! : draft.itinerary.titleAccent,
      days: (it.days ?? [])
        .filter((x) => lleno(x.lab) || lleno(x.items))
        .map((x) => {
          const items = strs(x.items).map(parseBeat);
          return { num: str(x.num), lab: str(x.lab), ttl: str(x.ttl), items: items.length ? items : [{ t: "", d: "" }] };
        }),
      // bg se conserva
    };
  }

  if (d.tariff && (lleno(d.tariff.price) || lleno(d.tariff.tier))) {
    const t = d.tariff;
    draft.tariff = {
      ...draft.tariff,
      on: true,
      title: lleno(t.title) ? t.title! : draft.tariff.title,
      titleAccent: lleno(t.titleAccent) ? t.titleAccent! : draft.tariff.titleAccent,
      lead: lleno(t.lead) ? t.lead! : draft.tariff.lead,
      tier: lleno(t.tier) ? t.tier! : draft.tariff.tier,
      price: lleno(t.price) ? t.price! : draft.tariff.price,
      priceCur: lleno(t.priceCur) ? t.priceCur! : draft.tariff.priceCur,
      availK: lleno(t.availK) ? t.availK! : draft.tariff.availK,
      availV: lleno(t.availV) ? t.availV! : draft.tariff.availV,
    };
  }

  if (d.checklist && (lleno(d.checklist.yesItems) || lleno(d.checklist.noItems))) {
    const c = d.checklist;
    draft.checklist = {
      ...draft.checklist,
      on: true,
      eyebrow: lleno(c.eyebrow) ? c.eyebrow! : draft.checklist.eyebrow,
      title: lleno(c.title) ? c.title! : draft.checklist.title,
      titleAccent: lleno(c.titleAccent) ? c.titleAccent! : draft.checklist.titleAccent,
      yesItems: strs(c.yesItems).length ? strs(c.yesItems) : draft.checklist.yesItems,
      noTitle: lleno(c.noTitle) ? c.noTitle! : draft.checklist.noTitle,
      noItems: strs(c.noItems).length ? strs(c.noItems) : draft.checklist.noItems,
      noMark: lleno(c.noMark) ? c.noMark! : draft.checklist.noMark,
    };
  }

  if (Array.isArray(d.faq)) {
    const qa = d.faq
      .filter((x) => lleno(x.q) && lleno(x.a))
      .map((x) => ({ q: x.q!, a: x.a! }));
    if (qa.length) { draft.faq = { ...draft.faq, on: true, qa }; }
  }

  if (d.packing && lleno(d.packing.items)) {
    draft.packing = {
      ...draft.packing,
      on: true,
      cap: lleno(d.packing.cap) ? d.packing.cap! : draft.packing.cap,
      items: strs(d.packing.items),
    };
  }

  if (d.dates) {
    const f = d.dates;
    if (lleno(f.title)) draft.dates.title = f.title!;
    if (lleno(f.titleAccent)) draft.dates.titleAccent = f.titleAccent!;
    if (lleno(f.cap)) draft.dates.cap = f.cap!;
    if (lleno(f.priceLine)) draft.dates.priceLine = f.priceLine!;
  }

  return { exp, draft };
}

// Salidas de la IA → filas del form. Horas por defecto: el guardado del form
// estampa T12:00Z / T23:00Z; aquí solo fecha y cupo.
export function slotsDesdeIA(
  slots: SlotIA[],
  existentes: { label: string }[],
): { label: string; start: string; end: string; cupo: string }[] {
  const yaEstan = new Set(existentes.map((s) => s.label.trim().toLowerCase()));
  return slots
    .filter((s) => s.label.trim() && /^\d{4}-\d{2}-\d{2}$/.test(s.startDate))
    .filter((s) => !yaEstan.has(s.label.trim().toLowerCase()))
    .map((s) => ({
      label: s.label.trim(),
      start: s.startDate,
      end: /^\d{4}-\d{2}-\d{2}$/.test(s.endDate) ? s.endDate : s.startDate,
      cupo: /^\d+$/.test(s.capacity.trim()) ? s.capacity.trim() : "",
    }));
}
