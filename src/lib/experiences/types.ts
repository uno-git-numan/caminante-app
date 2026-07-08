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

// =====================================================================
// DISEÑO v2 — modelo por bloques del diseño bespoke (ensenada/hongos)
// ---------------------------------------------------------------------
// Las páginas de ensenada y hongos eran HTML estático. Este modelo las
// vuelve data-driven SIN cambiar su apariencia: un arreglo ordenado de
// bloques tipados que ExperienceTemplateV2 renderiza 1:1 contra el CSS
// bespoke (template-v2-css.ts). Cada nueva experiencia con design:"v2"
// se ve igual. Los bloques NO llevan fechas/cupo/secnum: las fechas salen
// de /api/availability y los secnum se auto-numeran en la plantilla.
// =====================================================================

// Un eyebrow "// texto" o, con `pre`, "pre // texto" (usado en el bloque medi).
export type V2Image = { url: string; alt?: string; pos?: string; big?: boolean };
export type V2Action = {
  label: string;
  href: string;
  variant: "glass" | "orange" | "outline-d" | "green" | "outline";
  arrow?: boolean;
};

// HERO (foto full-bleed, título + acento, subtítulo, CTAs)
export type V2Hero = {
  type: "hero";
  eyebrow: string; // "Recolección de hongos · Edo. de México"
  metaEst?: string; // "Bosque de Xalatlaco"
  title: string; // "El bosque"
  titleAccent?: string; // "de Xalatlaco." (naranja itálica)
  sub?: string;
  bg: V2Image;
  actions?: V2Action[]; // default: "Ver próximas fechas" + "La experiencia"
};

// SPLIT — sección de 2 columnas (texto + media). Cubre EXPERIENCIA,
// perfil de guía (Nanae), COMUNIDAD, VARIEDADES y ALIADOS.
// frame "xp" = mosaico/columna de texto angosta; "allies" = una foto/texto ancho.
export type V2Split = {
  type: "split";
  frame: "xp" | "allies"; // define proporciones de columnas
  bg: "cream" | "panel";
  anchor?: string; // id de ancla (experiencia → id="experiencia")
  eyebrow: string;
  title: string;
  titleAccent?: string;
  subEyebrow?: string; // sub-eyebrow naranja (Nanae: "Micóloga · autora…")
  points?: string[]; // lista .pt (experiencia)
  items?: { name: string; role?: string }[]; // lista .ally con punto naranja
  paragraphs?: string[]; // párrafos .lead (perfil de guía); admite *itálica*
  lead?: string; // nota .lead final (comunidad/variedades)
  media: {
    kind: "photo" | "mosaic";
    side: "left" | "right"; // orden de la columna de media
    images: V2Image[]; // photo → 1; mosaic → 3 (con big) o 4
    rows?: string; // grid-template-rows del mosaico (variedades usa "200px 200px")
  };
};

// STATEMENT — bloque oscuro a sangre (.medi): declaración + cita.
export type V2Statement = {
  type: "statement";
  eyebrowPre?: string; // "Naturaleza" (antes del //)
  eyebrow: string; // "el método Caminante"
  title: string;
  titleAccent?: string;
  body?: string;
  quote?: string;
  bg: V2Image;
};

// ITINERARY — bloque oscuro (.itin) con tarjetas de días/fases.
export type V2Itinerary = {
  type: "itinerary";
  eyebrow: string;
  title: string;
  titleAccent?: string;
  bg: V2Image;
  days: {
    num?: string; // .dnum "01" (ensenada) — opcional
    lab: string; // .dlab "Jueves · Llegada" / "Amanecer"
    ttl?: string; // .dttl "Encuentro" (hongos) — opcional
    items: string[]; // <li>; admite **negrita**
  }[];
};

// TARIFF — bloque .invest con tarjeta de tarifa.
export type V2Tariff = {
  type: "tariff";
  eyebrow: string;
  title: string;
  titleAccent?: string;
  lead?: string;
  tier: string; // "Camping · Tienda frente al mar"
  price: string; // "$18,560"
  priceCur?: string; // "MXN · todo incluido"
  availK?: string; // "IVA incluido" / "Cupo"
  availV?: string; // "16 lugares" / "17 personas"
};

// CHECKLIST — bloque .incl (incluye / no incluye · buenas prácticas).
export type V2Checklist = {
  type: "checklist";
  eyebrow: string;
  title: string;
  titleAccent?: string;
  yesTitle: string; // "Incluye"
  yesItems: string[];
  yesMark?: string; // default "+"
  noTitle: string; // "No incluye" / "Buenas prácticas"
  noItems: string[];
  noMark?: string; // default "−"
};

// FAQ — bloque .faq (glasscard sobre foto). Sin secnum.
export type V2Faq = {
  type: "faq";
  eyebrow: string;
  bg: V2Image;
  qa: { q: string; a: string }[];
};

// PACKING — bloque .pack-sec (mochila: checklist con casillas + foto).
export type V2Packing = {
  type: "packing";
  eyebrow: string;
  title: string;
  titleAccent?: string;
  cap?: string;
  items: string[];
  photo: V2Image;
};

// DATES — bloque .fechas. Las tarjetas se llenan desde /api/availability
// (label + "Quedan N lugares"); aquí solo el copy que las rodea.
export type V2Dates = {
  type: "dates";
  eyebrow: string;
  title: string;
  titleAccent?: string;
  cap?: string;
  priceLine?: string; // "**$2,550 MXN** · todo incluido · cupo 17 personas"
};

// CLOSING — bloque .close (glasscard con contacto + CTAs).
export type V2Closing = {
  type: "closing";
  eyebrow: string;
  title: string;
  titleAccent?: string;
  bg: V2Image;
  contacts: { lbl: string; val: string }[];
  actions?: V2Action[];
};

export type PageBlock =
  | V2Hero
  | V2Split
  | V2Statement
  | V2Itinerary
  | V2Tariff
  | V2Checklist
  | V2Faq
  | V2Packing
  | V2Dates
  | V2Closing;

export type PageV2 = {
  docTitle?: string; // <title> del documento
  blocks: PageBlock[];
  // Logos de colaboradores/aliados (marcas): se muestran como tira en el hero
  // y como banda cerca de la sección de guías. El PDF los hereda de la página.
  collaborators?: { name: string; logoUrl: string }[];
};

export type Experience = {
  // identity / status
  slug: string;
  status: "draft" | "published";
  estado?: string; // estado de MX (dropdown del form) — liga experiencia ↔ página de destino

  // === Diseño v2 (bespoke ensenada/hongos, data-driven) ===
  // Si `design === "v2"`, la página pública y la vista previa se renderizan
  // con ExperienceTemplateV2 desde `page.blocks` (el template legacy de las
  // 4 caras/contexto/impacto se ignora). Las experiencias viejas sin este
  // campo siguen con el template legacy.
  design?: "v2";
  page?: PageV2;

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
  // Niveles de precio opcionales (ej. Habitación compartida / sencilla). `price`
  // es el precio base/"desde"; `priceTiers` lista los montos por persona de cada
  // nivel. Se muestran en la página; el cobro del nivel elegido se resuelve en el
  // checkout (server-side, por índice — nunca desde el cliente).
  priceTiers?: { label: string; amount: string }[];
  // Mínimo de personas para que la experiencia salga (informa y valida el form
  // de "Solicitar nueva fecha"; vacío = se puede solicitar desde 1 persona).
  minPeople?: number;
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
