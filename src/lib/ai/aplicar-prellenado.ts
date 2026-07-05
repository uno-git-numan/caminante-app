// Fusiona el resultado del pre-llenado con IA sobre el estado del formulario.
// Regla: la IA solo escribe donde trae contenido — JAMÁS pisa con vacío algo
// que el admin ya capturó. Las fotos nunca vienen de la IA: al asignar listas
// que llevan imageUrl (lenses/vivir/aliados) se preservan las del estado previo.
//
// Normalización de categorías cerradas (cinturón + tirantes sobre el enum del
// esquema): estado → uno de ESTADOS exacto; key de las caras → las 4 canónicas;
// moneda → canónica. Los campos de patrón puro (caraNo, context.no, vivir.num,
// itinerario.dno) NO los pide la IA — se estampan por índice aquí.

import type {
  Experience,
  Lens,
  LensKey,
  VivirItem,
  Ally,
  ContextItem,
  Day,
} from "@/lib/experiences/types";
import type { SlotIA } from "./prellenar";
import { ESTADOS } from "@/lib/experiences/estados";

function lleno(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

const pad = (i: number) => String(i + 1).padStart(2, "0");

// ── Normalizadores de categoría cerrada ─────────────────────────────────────
function base(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .replace(/[.\-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Alias comunes → estado canónico. Cubre variantes que la IA o Luis podrían
// escribir aunque el enum del esquema ya empuja al valor correcto.
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
function normalizarEstado(raw: string): string {
  const b = base(raw);
  if (!b) return "";
  const directo = ESTADOS.find((e) => base(e) === b);
  if (directo) return directo;
  if (ALIAS_ESTADO[b]) return ALIAS_ESTADO[b];
  return "";
}

const KEYS_VALIDAS: LensKey[] = ["naturaleza", "conservacion", "comunidades", "problemas"];
function normalizarLensKey(raw: string | undefined, fallbackIndex: number): LensKey {
  const b = base(raw ?? "");
  const directo = KEYS_VALIDAS.find((k) => k === b);
  if (directo) return directo;
  if (b.startsWith("natur")) return "naturaleza";
  if (b.startsWith("conserv")) return "conservacion";
  if (b.startsWith("comunid") || b.startsWith("communit")) return "comunidades";
  if (b.startsWith("problem")) return "problemas";
  return KEYS_VALIDAS[fallbackIndex] ?? "naturaleza";
}

function normalizarMoneda(raw: string | undefined): string {
  const b = base(raw ?? "");
  if (b.includes("usd") || b.includes("dolar") || b.includes("dollar")) {
    return "USD · por persona";
  }
  return "MXN · por persona"; // default de la marca
}

// Campos de Experience que la IA puede llenar tal cual (texto/estructura simple).
// NO incluye estado (se normaliza), ni context/itinerario/lenses/vivir (se
// estampan por índice / preservan fotos abajo).
const DIRECTOS = [
  "title", "titleAccent", "subtitle", "brandSmall", "docTitle", "edgeLabel",
  "vol", "coords", "cardTitle", "cardPloc", "cardHook",
  "contextTitle", "contextTitleAccent", "contextLead",
  "carasIntro", "vivirTitle", "vivirTitleAccent", "vivirLead", "expIntro",
  "aliadosLead", "itinerarioLead", "impactoBody", "impactoLabel",
  "paqueteLead", "incluye", "noIncluye", "mochilaLead", "mochila", "mochilaNote",
  "practicoLead", "cancelacion", "faq", "reservaNote",
] as const;

export function aplicarPrellenado(
  prev: Experience,
  raw: Record<string, unknown>,
): Experience {
  const d = raw as Partial<Experience> & {
    priceTiers?: { label: string; amount: string }[];
    waiverClauses?: string[];
    feedbackLocationLabel?: string;
    feedbackSections?: { key: string; label: string; icon?: string; prompt?: string }[];
  };
  const next: Experience = { ...prev };

  for (const k of DIRECTOS) {
    const v = d[k];
    if (lleno(v)) {
      (next as Record<string, unknown>)[k] = v;
    }
  }

  // Estado: normalizar a un valor de ESTADOS o dejar el previo si no hay match.
  if (lleno(d.estado)) {
    const norm = normalizarEstado(d.estado as string);
    if (norm) next.estado = norm; // sin match confiable → conserva lo previo
  }

  // Contexto: estampar 'no' por índice ('01', '02', …).
  if (lleno(d.context)) {
    next.context = (d.context as ContextItem[]).map((c, i) => ({ ...c, no: pad(i) }));
  }

  // Itinerario: estampar 'dno' por índice ('Día 01', …).
  if (lleno(d.itinerario)) {
    next.itinerario = (d.itinerario as Day[]).map((day, i) => ({
      ...day,
      dno: `Día ${pad(i)}`,
    }));
  }

  // Caras: estampar caraNo + normalizar key + orden fijo; preservar fotos.
  if (lleno(d.lenses)) {
    next.lenses = (d.lenses as Lens[]).map((l, i) => ({
      ...l,
      key: normalizarLensKey(l.key, i),
      caraNo: `Cara ${pad(i)}`,
      imageUrl: prev.lenses?.[i]?.imageUrl ?? "",
      imageAlt: prev.lenses?.[i]?.imageAlt ?? l.title,
    }));
  }

  // Vivir: estampar num por índice; preservar fotos.
  if (lleno(d.vivir)) {
    next.vivir = (d.vivir as VivirItem[]).map((v, i) => ({
      ...v,
      num: pad(i),
      imageUrl: prev.vivir?.[i]?.imageUrl ?? "",
      imageAlt: prev.vivir?.[i]?.imageAlt ?? v.title,
    }));
  }

  if (lleno(d.aliados)) {
    next.aliados = (d.aliados as Ally[]).map((a, i) => ({
      ...a,
      imageUrl: prev.aliados?.[i]?.imageUrl,
    }));
  }

  // Precio: por campo, sin pisar con vacío; moneda siempre canónica.
  if (d.price && (lleno(d.price.amount) || lleno(d.price.desc))) {
    const b = prev.price ?? { amount: "", currency: "MXN · por persona", desc: "" };
    next.price = {
      amount: lleno(d.price.amount) ? d.price.amount : b.amount,
      currency: lleno(d.price.currency) ? normalizarMoneda(d.price.currency) : b.currency,
      desc: lleno(d.price.desc) ? d.price.desc : b.desc,
    };
  }

  // Niveles de precio (display; el cobro se afina en el checkout). Solo filas
  // con label y monto.
  if (lleno(d.priceTiers)) {
    const tiers = (d.priceTiers as { label: string; amount: string }[])
      .filter((t) => lleno(t.label) && lleno(t.amount))
      .map((t) => ({ label: t.label.trim(), amount: t.amount.trim() }));
    if (tiers.length) next.priceTiers = tiers;
  }

  if (d.datesBadge && (lleno(d.datesBadge.big) || lleno(d.datesBadge.rest))) {
    next.datesBadge = {
      label: lleno(d.datesBadge.label) ? d.datesBadge.label : "Próximas salidas",
      big: d.datesBadge.big,
      rest: d.datesBadge.rest,
    };
  }

  // Deslinde: solo el resumen de cláusulas. active/versión/doc los decide Luis.
  if (lleno(d.waiverClauses)) {
    const reg = prev.registration ?? {
      active: false,
      waiverVersion: "v1",
      waiverDocUrl: "",
      waiverClauses: [],
    };
    next.registration = { ...reg, waiverClauses: d.waiverClauses! };
  }

  // Encuesta: locación + secciones del desglose. active la decide Luis.
  if (lleno(d.feedbackLocationLabel) || lleno(d.feedbackSections)) {
    const fb = prev.feedback ?? {
      active: false,
      version: "v1",
      locationLabel: "",
      npsEnabled: true,
      sections: [],
      testimonialPrompt: "",
    };
    next.feedback = {
      ...fb,
      locationLabel: lleno(d.feedbackLocationLabel) ? d.feedbackLocationLabel! : fb.locationLabel,
      sections: lleno(d.feedbackSections) ? d.feedbackSections! : fb.sections,
    };
  }

  return next;
}

// Salidas de la IA → filas del form (datetime-local). Horas por defecto 08:00 y
// 18:00 — el admin las ajusta; lo que importa es que la fecha quede correcta.
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
      start: `${s.startDate}T08:00`,
      end: /^\d{4}-\d{2}-\d{2}$/.test(s.endDate) ? `${s.endDate}T18:00` : `${s.startDate}T18:00`,
      cupo: /^\d+$/.test(s.capacity.trim()) ? s.capacity.trim() : "",
    }));
}
