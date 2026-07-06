// Borrador v2 (V2Draft): el estado que edita el formulario para autorar el
// diseño bespoke (ensenada/hongos). Es "secciones fijas opcionales": un objeto
// con campos nombrados por sección (más un repetidor de guías) que se convierte
// en el arreglo ordenado `page.blocks` al guardar. Así el form no manipula una
// unión discriminada; edita campos planos y `buildBlocks` arma el orden canónico
// y omite las secciones vacías.
//
//   form (V2Draft)  ──buildBlocks──►  PageV2.blocks  ──ExperienceTemplateV2──►  página
//   página (edición) ──draftFromBlocks──►  V2Draft
//   IA (prellenar)  ──►  Partial<V2Draft>  ──►  merge en el draft
//
// Orden canónico de secciones (igual que ensenada/hongos):
//   hero · experiencia · statement? · guías* · itinerario · tariff · checklist ·
//   faq? · packing · dates · closing

import type {
  Experience,
  PageV2,
  PageBlock,
  V2Image,
  V2Split,
} from "./types";

export type V2GuideDraft = {
  frame: "xp" | "allies"; // xp = mosaico; allies = una foto
  bg: "cream" | "panel";
  eyebrow: string;
  title: string;
  titleAccent: string;
  subEyebrow: string; // sub-eyebrow naranja (perfil de guía)
  mode: "items" | "paragraphs"; // lista con viñetas vs párrafos de perfil
  items: { name: string; role: string }[];
  paragraphs: string[];
  lead: string; // nota final opcional
  side: "left" | "right"; // lado de la foto/mosaico
  images: V2Image[]; // 1 (photo) o 3–4 (mosaic)
};

export type V2Draft = {
  hero: {
    eyebrow: string;
    metaEst: string;
    title: string;
    titleAccent: string;
    sub: string;
    bg: V2Image;
  };
  experiencia: {
    on: boolean;
    eyebrow: string;
    title: string;
    titleAccent: string;
    points: string[];
    mosaic: V2Image[]; // 3 (con big) o 4
  };
  statement: {
    on: boolean;
    eyebrowPre: string;
    eyebrow: string;
    title: string;
    titleAccent: string;
    body: string;
    quote: string;
    bg: V2Image;
  };
  guides: V2GuideDraft[]; // repetidor (Nanae, comunidad, variedades, aliados…)
  itinerary: {
    on: boolean;
    eyebrow: string;
    title: string;
    titleAccent: string;
    bg: V2Image;
    days: { num: string; lab: string; ttl: string; items: string[] }[];
  };
  tariff: {
    on: boolean;
    eyebrow: string;
    title: string;
    titleAccent: string;
    lead: string;
    tier: string;
    price: string;
    priceCur: string;
    availK: string;
    availV: string;
  };
  checklist: {
    on: boolean;
    eyebrow: string;
    title: string;
    titleAccent: string;
    yesTitle: string;
    yesItems: string[];
    noTitle: string;
    noItems: string[];
    noMark: string;
  };
  faq: {
    on: boolean;
    eyebrow: string;
    bg: V2Image;
    qa: { q: string; a: string }[];
  };
  packing: {
    on: boolean;
    eyebrow: string;
    title: string;
    titleAccent: string;
    cap: string;
    items: string[];
    photo: V2Image;
  };
  dates: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    cap: string;
    priceLine: string;
  };
  closing: {
    on: boolean;
    eyebrow: string;
    title: string;
    titleAccent: string;
    bg: V2Image;
    contacts: { lbl: string; val: string }[];
  };
};

const img = (): V2Image => ({ url: "", alt: "" });
const has = (s: string | undefined) => !!(s && s.trim());
const cleanImgs = (arr: V2Image[]) => arr.filter((i) => has(i.url));

// Contactos por defecto del cierre, a partir de los datos de marca de la experiencia.
function defaultContacts(exp?: Partial<Experience>): { lbl: string; val: string }[] {
  const wa = exp?.whatsapp
    ? "+" + exp.whatsapp.replace(/[^\d]/g, "").replace(/^(\d{2})(\d{2})(\d{4})(\d{4})$/, "$1 $2 $3 $4")
    : "";
  return [
    { lbl: "WhatsApp", val: wa || "+52 55 1202 0565" },
    { lbl: "Email", val: exp?.email || "uno@numanhub.com" },
    { lbl: "Instagram", val: exp?.instagram ? "@" + exp.instagram.replace(/^@/, "") : "@somos.caminante" },
  ];
}

// Draft en blanco (con andamiaje mínimo por sección para que el admin solo llene).
export function emptyV2Draft(exp?: Partial<Experience>): V2Draft {
  return {
    hero: { eyebrow: "", metaEst: "", title: "", titleAccent: "", sub: "", bg: img() },
    experiencia: { on: true, eyebrow: "La experiencia", title: "", titleAccent: "", points: ["", "", ""], mosaic: [] },
    statement: { on: false, eyebrowPre: "", eyebrow: "", title: "", titleAccent: "", body: "", quote: "", bg: img() },
    guides: [],
    itinerary: { on: true, eyebrow: "Itinerario", title: "", titleAccent: "", bg: img(), days: [] },
    tariff: { on: true, eyebrow: "Inversión", title: "", titleAccent: "", lead: "", tier: "", price: "", priceCur: "MXN · todo incluido", availK: "Cupo", availV: "" },
    checklist: { on: true, eyebrow: "Qué incluye", title: "Lo que", titleAccent: "va contigo.", yesTitle: "Incluye", yesItems: [], noTitle: "No incluye", noItems: [], noMark: "−" },
    faq: { on: false, eyebrow: "Preguntas frecuentes", bg: img(), qa: [] },
    packing: { on: true, eyebrow: "La mochila", title: "Qué llevar.", titleAccent: "", cap: "", items: [], photo: img() },
    dates: { eyebrow: "Próximas fechas", title: "Elige tu", titleAccent: "salida.", cap: "", priceLine: "" },
    closing: { on: true, eyebrow: "Reserva tu lugar", title: "Nos vemos.", titleAccent: "", bg: img(), contacts: defaultContacts(exp) },
  };
}

// Guía en blanco para el repetidor.
export function emptyGuide(): V2GuideDraft {
  return {
    frame: "allies", bg: "panel", eyebrow: "", title: "", titleAccent: "", subEyebrow: "",
    mode: "items", items: [{ name: "", role: "" }], paragraphs: [""], lead: "", side: "right", images: [img()],
  };
}

// ── V2Draft → page.blocks (orden canónico; omite secciones vacías) ──────────
export function buildBlocks(d: V2Draft): PageBlock[] {
  const blocks: PageBlock[] = [];

  // hero (siempre; es la portada)
  blocks.push({
    type: "hero",
    eyebrow: d.hero.eyebrow,
    ...(has(d.hero.metaEst) ? { metaEst: d.hero.metaEst } : {}),
    title: d.hero.title,
    ...(has(d.hero.titleAccent) ? { titleAccent: d.hero.titleAccent } : {}),
    ...(has(d.hero.sub) ? { sub: d.hero.sub } : {}),
    bg: d.hero.bg,
  });

  // experiencia
  const points = d.experiencia.points.filter((p) => has(p));
  if (d.experiencia.on && (has(d.experiencia.title) || points.length)) {
    const mosaic = cleanImgs(d.experiencia.mosaic).map((im, i) => (i === 0 && cleanImgs(d.experiencia.mosaic).length === 3 ? { ...im, big: true } : im));
    blocks.push({
      type: "split",
      frame: "xp",
      bg: "cream",
      anchor: "experiencia",
      eyebrow: d.experiencia.eyebrow || "La experiencia",
      title: d.experiencia.title,
      ...(has(d.experiencia.titleAccent) ? { titleAccent: d.experiencia.titleAccent } : {}),
      ...(points.length ? { points } : {}),
      media: { kind: "mosaic", side: "right", images: mosaic },
    });
  }

  // statement (opcional)
  if (d.statement.on && (has(d.statement.title) || has(d.statement.body))) {
    blocks.push({
      type: "statement",
      ...(has(d.statement.eyebrowPre) ? { eyebrowPre: d.statement.eyebrowPre } : {}),
      eyebrow: d.statement.eyebrow,
      title: d.statement.title,
      ...(has(d.statement.titleAccent) ? { titleAccent: d.statement.titleAccent } : {}),
      ...(has(d.statement.body) ? { body: d.statement.body } : {}),
      ...(has(d.statement.quote) ? { quote: d.statement.quote } : {}),
      bg: d.statement.bg,
    });
  }

  // guías (repetidor)
  for (const g of d.guides) {
    const items = g.items.filter((it) => has(it.name)).map((it) => ({ name: it.name, ...(has(it.role) ? { role: it.role } : {}) }));
    const paragraphs = g.paragraphs.filter((p) => has(p));
    if (!has(g.title) && !items.length && !paragraphs.length) continue;
    const images = cleanImgs(g.images).map((im, i) => (g.frame === "xp" && i === 0 && cleanImgs(g.images).length === 3 ? { ...im, big: true } : im));
    const split: V2Split = {
      type: "split",
      frame: g.frame,
      bg: g.bg,
      eyebrow: g.eyebrow,
      title: g.title,
      ...(has(g.titleAccent) ? { titleAccent: g.titleAccent } : {}),
      ...(has(g.subEyebrow) ? { subEyebrow: g.subEyebrow } : {}),
      ...(g.mode === "items" && items.length ? { items } : {}),
      ...(g.mode === "paragraphs" && paragraphs.length ? { paragraphs } : {}),
      ...(has(g.lead) ? { lead: g.lead } : {}),
      media: {
        kind: g.frame === "xp" ? "mosaic" : "photo",
        side: g.side,
        images,
        ...(g.frame === "xp" && images.length === 4 ? { rows: "200px 200px" } : {}),
      },
    };
    blocks.push(split);
  }

  // itinerario
  const days = d.itinerary.days
    .filter((x) => has(x.lab) || x.items.some((i) => has(i)))
    .map((x) => ({
      ...(has(x.num) ? { num: x.num } : {}),
      lab: x.lab,
      ...(has(x.ttl) ? { ttl: x.ttl } : {}),
      items: x.items.filter((i) => has(i)),
    }));
  if (d.itinerary.on && days.length) {
    blocks.push({
      type: "itinerary",
      eyebrow: d.itinerary.eyebrow || "Itinerario",
      title: d.itinerary.title,
      ...(has(d.itinerary.titleAccent) ? { titleAccent: d.itinerary.titleAccent } : {}),
      bg: d.itinerary.bg,
      days,
    });
  }

  // tariff
  if (d.tariff.on && (has(d.tariff.price) || has(d.tariff.tier))) {
    blocks.push({
      type: "tariff",
      eyebrow: d.tariff.eyebrow || "Inversión",
      title: d.tariff.title,
      ...(has(d.tariff.titleAccent) ? { titleAccent: d.tariff.titleAccent } : {}),
      ...(has(d.tariff.lead) ? { lead: d.tariff.lead } : {}),
      tier: d.tariff.tier,
      price: d.tariff.price,
      ...(has(d.tariff.priceCur) ? { priceCur: d.tariff.priceCur } : {}),
      ...(has(d.tariff.availK) ? { availK: d.tariff.availK } : {}),
      ...(has(d.tariff.availV) ? { availV: d.tariff.availV } : {}),
    });
  }

  // checklist
  const yesItems = d.checklist.yesItems.filter((i) => has(i));
  const noItems = d.checklist.noItems.filter((i) => has(i));
  if (d.checklist.on && (yesItems.length || noItems.length)) {
    blocks.push({
      type: "checklist",
      eyebrow: d.checklist.eyebrow || "Qué incluye",
      title: d.checklist.title,
      ...(has(d.checklist.titleAccent) ? { titleAccent: d.checklist.titleAccent } : {}),
      yesTitle: d.checklist.yesTitle || "Incluye",
      yesItems,
      noTitle: d.checklist.noTitle || "No incluye",
      noItems,
      ...(has(d.checklist.noMark) ? { noMark: d.checklist.noMark } : {}),
    });
  }

  // faq (opcional)
  const qa = d.faq.qa.filter((x) => has(x.q) || has(x.a));
  if (d.faq.on && qa.length) {
    blocks.push({ type: "faq", eyebrow: d.faq.eyebrow || "Preguntas frecuentes", bg: d.faq.bg, qa });
  }

  // packing
  const packItems = d.packing.items.filter((i) => has(i));
  if (d.packing.on && packItems.length) {
    blocks.push({
      type: "packing",
      eyebrow: d.packing.eyebrow || "La mochila",
      title: d.packing.title || "Qué llevar.",
      ...(has(d.packing.titleAccent) ? { titleAccent: d.packing.titleAccent } : {}),
      ...(has(d.packing.cap) ? { cap: d.packing.cap } : {}),
      items: packItems,
      photo: d.packing.photo,
    });
  }

  // dates (siempre; las tarjetas salen de las salidas en vivo)
  blocks.push({
    type: "dates",
    eyebrow: d.dates.eyebrow || "Próximas fechas",
    title: d.dates.title,
    ...(has(d.dates.titleAccent) ? { titleAccent: d.dates.titleAccent } : {}),
    ...(has(d.dates.cap) ? { cap: d.dates.cap } : {}),
    ...(has(d.dates.priceLine) ? { priceLine: d.dates.priceLine } : {}),
  });

  // closing
  if (d.closing.on) {
    blocks.push({
      type: "closing",
      eyebrow: d.closing.eyebrow || "Reserva tu lugar",
      title: d.closing.title,
      ...(has(d.closing.titleAccent) ? { titleAccent: d.closing.titleAccent } : {}),
      bg: d.closing.bg,
      contacts: d.closing.contacts.filter((c) => has(c.val)),
    });
  }

  return blocks;
}

// ── page.blocks → V2Draft (para editar una experiencia v2 existente) ────────
export function draftFromBlocks(page: PageV2 | undefined, exp?: Partial<Experience>): V2Draft {
  const d = emptyV2Draft(exp);
  if (!page?.blocks?.length) return d;
  const guides: V2GuideDraft[] = [];

  for (const b of page.blocks) {
    switch (b.type) {
      case "hero":
        d.hero = { eyebrow: b.eyebrow, metaEst: b.metaEst || "", title: b.title, titleAccent: b.titleAccent || "", sub: b.sub || "", bg: b.bg };
        break;
      case "split":
        if (b.anchor === "experiencia" || (b.frame === "xp" && b.points)) {
          d.experiencia = { on: true, eyebrow: b.eyebrow, title: b.title, titleAccent: b.titleAccent || "", points: b.points ?? [], mosaic: b.media.images };
        } else {
          guides.push({
            frame: b.frame,
            bg: b.bg,
            eyebrow: b.eyebrow,
            title: b.title,
            titleAccent: b.titleAccent || "",
            subEyebrow: b.subEyebrow || "",
            mode: b.paragraphs ? "paragraphs" : "items",
            items: (b.items ?? []).map((it) => ({ name: it.name, role: it.role || "" })),
            paragraphs: b.paragraphs ?? [""],
            lead: b.lead || "",
            side: b.media.side,
            images: b.media.images,
          });
        }
        break;
      case "statement":
        d.statement = { on: true, eyebrowPre: b.eyebrowPre || "", eyebrow: b.eyebrow, title: b.title, titleAccent: b.titleAccent || "", body: b.body || "", quote: b.quote || "", bg: b.bg };
        break;
      case "itinerary":
        d.itinerary = { on: true, eyebrow: b.eyebrow, title: b.title, titleAccent: b.titleAccent || "", bg: b.bg, days: b.days.map((x) => ({ num: x.num || "", lab: x.lab, ttl: x.ttl || "", items: x.items })) };
        break;
      case "tariff":
        d.tariff = { on: true, eyebrow: b.eyebrow, title: b.title, titleAccent: b.titleAccent || "", lead: b.lead || "", tier: b.tier, price: b.price, priceCur: b.priceCur || "", availK: b.availK || "", availV: b.availV || "" };
        break;
      case "checklist":
        d.checklist = { on: true, eyebrow: b.eyebrow, title: b.title, titleAccent: b.titleAccent || "", yesTitle: b.yesTitle, yesItems: b.yesItems, noTitle: b.noTitle, noItems: b.noItems, noMark: b.noMark || "−" };
        break;
      case "faq":
        d.faq = { on: true, eyebrow: b.eyebrow, bg: b.bg, qa: b.qa };
        break;
      case "packing":
        d.packing = { on: true, eyebrow: b.eyebrow, title: b.title, titleAccent: b.titleAccent || "", cap: b.cap || "", items: b.items, photo: b.photo };
        break;
      case "dates":
        d.dates = { eyebrow: b.eyebrow, title: b.title, titleAccent: b.titleAccent || "", cap: b.cap || "", priceLine: b.priceLine || "" };
        break;
      case "closing":
        d.closing = { on: true, eyebrow: b.eyebrow, title: b.title, titleAccent: b.titleAccent || "", bg: b.bg, contacts: b.contacts };
        break;
    }
  }
  d.guides = guides;
  return d;
}
