// The data contract for a Caminante experience.
// This single shape drives: the dynamic page template, the Supabase row (content JSONB),
// and the "Crear experiencia" admin form. Add a field here → it flows everywhere.

export type LensKey = "naturaleza" | "conservacion" | "comunidades" | "problemas";

export type Fact = { n: string; l: string };

export type Lens = {
  key: LensKey;
  caraNo: string; // "Cara 01"
  label: string; // "Naturaleza"
  title: string;
  body: string; // plain text; **bold** and *italic* allowed via simple markup
  facts: Fact[];
  imageUrl: string;
  imageAlt?: string;
};

export type ContextItem = { no: string; title: string; sub: string; body: string };

export type VivirItem = {
  num: string;
  pill: string;
  title: string;
  body: string;
  imageUrl: string;
  imageAlt?: string;
};

export type Ally = {
  role: string;
  name: string;
  body: string;
  peopleLabel: string;
  people: string;
  imageUrl?: string; // foto del aliado (diseño nuevo del form) — opcional
};

// Bloque libre extra del form nuevo (meditaciones, comunidad, "qué vas a encontrar"…)
export type FreeBlock = { title: string; body: string; imageUrl: string };

export type Beat = { t: string; d: string };
export type Day = { dno: string; dname: string; beats: Beat[] };

export type GearItem = { text: string; req?: string; must?: boolean };
export type GearCategory = { title: string; items: GearItem[] };

export type Faq = { q: string; a: string };

export type HeroMeta = { k: string; v: string };
export type CancelRow = { label: string; val: string };

export type Experience = {
  // identity / status
  slug: string;
  status: "draft" | "published";
  estado?: string; // estado de MX (dropdown del form) — liga experiencia ↔ página de destino

  // masthead
  vol: string; // "Vol. 07 · Junio 2026"
  coords: string; // "23°59′N · 109°50′W"
  edgeLabel: string; // "Caminante · Ocean Safari 2026"
  brandSmall: string; // "Ocean Safari"
  docTitle: string; // <title>

  // hero
  title: string; // "OCEAN"
  titleAccent: string; // "safari." (rendered italic / dune)
  subtitle: string;
  heroImageUrl: string;
  heroImageAlt?: string;
  heroMeta?: HeroMeta[];

  // contact / commerce
  whatsapp: string; // E.164 digits for wa.me, e.g. "525512020565"
  email: string;
  instagram: string; // handle without @
  price?: { amount: string; currency: string; desc: string };
  stripeLink?: string | null; // generated later

  // registro nativo (deslinde + firma en /caminante/registro/[slug])
  // El texto legal vive en el Google Doc del sistema legal (Drive); aquí solo
  // la versión vigente, el link y el resumen de cláusulas que el form muestra.
  registration?: {
    active: boolean;
    waiverVersion: string; // "v1" — sube cuando el deslinde cambia (re-firma)
    waiverDocUrl: string;
    waiverClauses: string[]; // resumen que se lista antes del checkbox
  };

  // encuesta de satisfacción (post-experiencia, /caminante/feedback/[token]).
  // Lo común (pulso, NPS, testimonio, abiertas) es plantilla; lo que VARÍA por
  // experiencia son las `sections` del desglose. Ver src/lib/feedback/types.ts.
  feedback?: {
    active: boolean;
    version: string; // "v1"
    locationLabel: string; // "Ensenada de Muertos, BCS" — referencia por LOCACIÓN
    npsEnabled: boolean;
    // secciones del desglose opcional (⭐ + comentario) — cambian por experiencia
    sections: { key: string; label: string; icon?: string; prompt?: string }[];
    testimonialPrompt?: string; // placeholder del cuadro de testimonio
  };

  // card / calendar metadata (for the landing grid and the calendar)
  cardTitle?: string; // defaults to subtitle
  cardPloc?: string; // "Baja California Sur · Junio 2026"
  cardHook?: string; // one-liner; defaults to subtitle
  startDate?: string | null; // ISO date for calendar ordering, optional

  // === Campos del form nuevo (Claude Design) — TODOS opcionales ===
  // jsonb schemaless: el template legacy no los usa; las páginas nuevas son estáticas.
  gallery?: string[]; // galería de fotos (sección "Lo básico")
  expIntro?: string; // "La experiencia" — intro (diseño nuevo)
  expImage?: string; // "La experiencia" — foto (diseño nuevo)
  bloques?: FreeBlock[]; // "Bloques libres extra" (secciones específicas a la experiencia)

  // CAP 01 — contexto
  contextTag: string; // "Capítulo 01 · El Contexto"
  contextTitle: string;
  contextTitleAccent: string;
  contextLead: string;
  contextBandImageUrl: string;
  contextBandCaption: string;
  context?: ContextItem[];

  // Cuatro caras
  carasTitle: string; // "Cada experiencia Caminante"
  carasTitleAccent: string; // "tiene cuatro lentes."
  carasIntro: string;
  lenses?: Lens[];

  // CAP 02 — experiencia
  vivirTag: string;
  vivirTitle: string;
  vivirTitleAccent: string;
  vivirLead: string;
  vivir?: VivirItem[];

  // CAP 03 — aliados
  aliadosTag: string;
  aliadosTitle: string;
  aliadosTitleAccent: string;
  aliadosLead: string;
  aliados?: Ally[];

  // CAP 04 — itinerario
  itinerarioTag: string;
  itinerarioTitle: string;
  itinerarioLead: string;
  itinerario?: Day[];

  // CAP 05 — impacto
  impactoTag: string;
  impactoTitle: string;
  impactoTitleAccent: string;
  impactoBody?: string[];
  impactoLabel: string;
  impactoImageUrl: string;
  impactoImageAlt?: string;

  // CAP 06 — paquete
  paqueteTag: string;
  paqueteTitle: string;
  paqueteTitleAccent: string;
  paqueteLead: string;
  incluye?: string[];
  noIncluye?: string[];

  // CAP 07 — mochila
  mochilaTag: string;
  mochilaTitle: string;
  mochilaTitleAccent: string;
  mochilaLead: string;
  mochila?: GearCategory[];
  mochilaNote: string;

  // CAP 08 — práctico
  practicoTag: string;
  practicoTitle: string;
  practicoTitleAccent: string;
  practicoLead: string;
  cancelacion?: CancelRow[];
  faq?: Faq[];

  // CAP 09 — reserva
  reservaTag: string;
  reservaTitle: string;
  reservaTitleAccent: string;
  reservaImageUrl: string;
  reservaImageAlt?: string;
  datesBadge?: { label: string; big: string; rest: string };
  reservaNote: string;
  metaNote?: string[];

  // footer
  footerBrand: string;
  footerSmall: string;
  footerRight: string;
};
