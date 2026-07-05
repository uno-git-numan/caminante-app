// Fusiona el resultado del pre-llenado con IA sobre el estado del formulario.
// Regla: la IA solo escribe donde trae contenido — JAMÁS pisa con vacío algo
// que el admin ya capturó. Las fotos nunca vienen de la IA: al asignar listas
// que llevan imageUrl (lenses/vivir/aliados) se preservan las del estado previo.

import type { Experience, Lens, VivirItem, Ally } from "@/lib/experiences/types";
import type { SlotIA } from "./prellenar";

function lleno(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

// Campos de Experience que la IA puede llenar tal cual (solo texto/estructura).
const DIRECTOS = [
  "title", "titleAccent", "subtitle", "brandSmall", "docTitle", "edgeLabel",
  "vol", "coords", "estado", "cardTitle", "cardPloc", "cardHook",
  "contextTitle", "contextTitleAccent", "contextLead", "context",
  "carasIntro", "vivirTitle", "vivirTitleAccent", "vivirLead", "expIntro",
  "aliadosLead", "itinerarioLead", "itinerario", "impactoBody", "impactoLabel",
  "paqueteLead", "incluye", "noIncluye", "mochilaLead", "mochila", "mochilaNote",
  "practicoLead", "cancelacion", "faq", "reservaNote",
] as const;

export function aplicarPrellenado(
  prev: Experience,
  raw: Record<string, unknown>,
): Experience {
  const d = raw as Partial<Experience> & {
    waiverClauses?: string[];
    feedbackLocationLabel?: string;
    feedbackSections?: { key: string; label: string; prompt?: string }[];
  };
  const next: Experience = { ...prev };

  for (const k of DIRECTOS) {
    const v = d[k];
    if (lleno(v)) {
      (next as Record<string, unknown>)[k] = v;
    }
  }

  // Listas con imageUrl: preservar las fotos que ya estén en el form (por índice).
  if (lleno(d.lenses)) {
    next.lenses = (d.lenses as Lens[]).map((l, i) => ({
      ...l,
      imageUrl: prev.lenses?.[i]?.imageUrl ?? "",
      imageAlt: prev.lenses?.[i]?.imageAlt ?? l.title,
    }));
  }
  if (lleno(d.vivir)) {
    next.vivir = (d.vivir as VivirItem[]).map((v, i) => ({
      ...v,
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

  // Precio: por campo, sin pisar con vacío (currency conserva su default).
  if (d.price && (lleno(d.price.amount) || lleno(d.price.desc))) {
    const base = prev.price ?? { amount: "", currency: "MXN · por persona", desc: "" };
    next.price = {
      amount: lleno(d.price.amount) ? d.price.amount : base.amount,
      currency: lleno(d.price.currency) ? d.price.currency : base.currency,
      desc: lleno(d.price.desc) ? d.price.desc : base.desc,
    };
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
