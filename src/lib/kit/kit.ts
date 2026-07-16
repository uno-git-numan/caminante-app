// KIT DE COMUNICACIÓN — el "cerebro". Convierte una experiencia (bloques v2 +
// galería de "Lo básico" + feedback + disponibilidad) en las 10 piezas canónicas
// del playbook (My Drive/CAMINANTE/playbook/00-PLAYBOOK.md), cada una como una
// lista ORDENADA de láminas tipadas. La capa visual (kit-css + KitDeck) renderiza
// cada lámina a un .slide; el export (SocialExport) lo baja a PNG 4:5 y 9:16.
//
// Regla del canon: cada pieza hace un trabajo DISTINTO; si falta su insumo
// (feedback/fotos/episodio) la pieza queda "pendiente de insumo" — NO se inventa.
// Las FOTOS salen SIEMPRE de la galería de "Lo básico" (exp.gallery) + los fondos
// de los bloques como respaldo.

import type {
  Experience,
  PageBlock,
  V2Hero,
  V2Split,
  V2Statement,
  V2Itinerary,
  V2Tariff,
  V2Checklist,
  V2Faq,
} from "@/lib/experiences/types";

// ── Láminas (unión discriminada; cada `kind` = un layout en kit-css) ──────────
export type Foto = { url: string; alt?: string };

export type Lamina =
  | { kind: "cover"; eyebrow: string; title: string; accent?: string; tag?: string; bg: Foto }
  | { kind: "fact"; n: string; label: string; source?: string; bg: Foto } // dato científico grande sobre foto
  | { kind: "foto"; line?: string; sub?: string; bg: Foto } // foto a sangre con una línea
  | { kind: "lista"; eyebrow: string; title: string; accent?: string; items: string[]; mark?: string } // panel claro con lista
  | { kind: "incluye"; eyebrow: string; title: string; accent?: string; yesT: string; yes: string[]; noT: string; no: string[]; noMark?: string }
  | { kind: "qa"; eyebrow: string; title: string; accent?: string; qa: { q: string; a: string }[]; bg: Foto }
  | { kind: "dia"; num?: string; lab: string; ttl?: string; items: string[]; headTitle?: string; headAccent?: string; bg: Foto }
  | { kind: "precio"; eyebrow: string; title: string; accent?: string; tier?: string; price: string; cur?: string; lead?: string; tiers?: { l: string; v: string }[]; bg: Foto }
  | { kind: "cupo"; experiencia: string; fecha: string; n: number; bg: Foto }
  | { kind: "cita"; quote: string; author: string; stars?: number; bg?: Foto }
  | { kind: "perfil"; name: string; role: string; cred?: string; body?: string; photo?: Foto }
  | { kind: "cierre"; eyebrow: string; title: string; accent?: string; cta: string; bg: Foto };

export type Momento = "M1 · Lanzamiento" | "M2 · Venta" | "M3 · Prueba";
export type Cara = "Biología" | "Conservación" | "Comunidades" | "Problemas" | "—";

export type PieceState =
  | { estado: "lista"; laminas: Lamina[] }
  | { estado: "pendiente"; razon: string };

export type PieceDef = {
  id: string; // "P1".."P10"
  nombre: string;
  momento: Momento;
  trabajo: string; // qué comunica (del playbook)
  cara: Cara;
  formato: string; // "Reel o carrusel", "Story"…
  cta: string; // instrucción de CTA para el caption
  build: (ctx: KitContext) => PieceState;
};

// ── Contexto que arma la query ────────────────────────────────────────────────
export type KitContext = {
  exp: Experience;
  blocks: PageBlock[];
  gallery: string[]; // fotos de "Lo básico" — banco principal
  quotes: { text: string; author: string; stars: number | null }[]; // feedback con consentimiento
  slots: { label: string; available: number | null }[]; // salidas públicas abiertas
  reservarUrl: string;
  expUrl: string;
};

// ── Utilidades ────────────────────────────────────────────────────────────────
const has = (s?: string | null): s is string => !!s && s.trim().length > 0;
const clean = (s: string) => s.replace(/\*\*/g, "").replace(/\*/g, "").trim();

// Ajusta un texto a un máximo de caracteres SIN cortar palabras: si excede,
// retrocede al último espacio y agrega "…" — nunca parte una palabra a la mitad.
// El límite es generoso (la lámina tiene aire de sobra); casi nunca dispara.
function fit(s: string, max: number): string {
  const t = clean(s);
  if (t.length <= max) return t;
  const sp = t.slice(0, max + 1).lastIndexOf(" ");
  const base = sp > 0 ? t.slice(0, sp) : t.slice(0, max);
  return base.replace(/[\s.,;:!?¿¡"'—–-]+$/, "") + "…";
}

function block<T extends PageBlock["type"]>(blocks: PageBlock[], type: T): Extract<PageBlock, { type: T }> | undefined {
  return blocks.find((b) => b.type === type) as Extract<PageBlock, { type: T }> | undefined;
}
function blocksOf<T extends PageBlock["type"]>(blocks: PageBlock[], type: T): Extract<PageBlock, { type: T }>[] {
  return blocks.filter((b) => b.type === type) as Extract<PageBlock, { type: T }>[];
}

// Banco de fotos: galería de "Lo básico" primero; luego los fondos de los bloques
// (hero, statement, itinerario, faq, mosaicos) como respaldo. Dedup, sin vacíos.
function photoPool(ctx: KitContext): Foto[] {
  const out: Foto[] = [];
  const seen = new Set<string>();
  const add = (url?: string, alt?: string) => {
    if (!has(url) || seen.has(url!)) return;
    seen.add(url!);
    out.push({ url: url!, alt });
  };
  ctx.gallery.forEach((u) => add(u));
  const hero = block(ctx.blocks, "hero") as V2Hero | undefined;
  add(hero?.bg?.url, hero?.bg?.alt);
  for (const s of blocksOf(ctx.blocks, "split") as V2Split[]) s.media?.images?.forEach((im) => add(im.url, im.alt));
  add((block(ctx.blocks, "statement") as V2Statement | undefined)?.bg?.url);
  add((block(ctx.blocks, "itinerary") as V2Itinerary | undefined)?.bg?.url);
  add((block(ctx.blocks, "faq") as V2Faq | undefined)?.bg?.url);
  return out;
}
// Toma la n-ésima foto del banco (cíclico) — así cada lámina tiene fondo.
const pick = (pool: Foto[], i: number): Foto => pool.length ? pool[i % pool.length] : { url: "" };

// PRNG determinista (mulberry32 sembrado por un hash del string) → barajado
// REPRODUCIBLE: el mismo slug+pieza da SIEMPRE el mismo orden (thumbnail y PNG
// exportado coinciden; no re-baraja en cada carga), pero cada pieza recibe un
// orden DISTINTO → dejan de repetirse las mismas fotos entre posts.
function hashStr(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function shuffle<T>(arr: T[], seed: string): T[] {
  let a = hashStr(seed) || 1;
  const rnd = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
// Banco de fotos BARAJADO por pieza (salt = id de la pieza) → cada pieza usa un
// orden propio y se aprovecha TODA la galería, no sólo las primeras subidas.
function poolFor(ctx: KitContext, salt: string): Foto[] {
  return shuffle(photoPool(ctx), `${ctx.exp.slug || "x"}·${salt}`);
}
// Portada de una pieza: primera foto de su banco barajado (varía entre piezas),
// con el hero como respaldo si el banco viene vacío.
function coverBg(ctx: KitContext, pool: Foto[]): Foto {
  return pool.length ? pool[0] : heroBg(ctx);
}

function heroBg(ctx: KitContext): Foto {
  const hero = block(ctx.blocks, "hero") as V2Hero | undefined;
  if (hero?.bg?.url) return { url: hero.bg.url, alt: hero.bg.alt };
  return pick(photoPool(ctx), 0);
}

// Nombre corto de la experiencia (para captions/portadas).
export function expName(exp: Experience): string {
  const hero = (exp.page?.blocks?.find((b) => b.type === "hero") as V2Hero | undefined);
  const t = [hero?.title, hero?.titleAccent].filter(Boolean).join(" ").trim();
  return clean(t || exp.cardTitle || exp.page?.docTitle || exp.slug);
}
const eyebrowExp = (exp: Experience) =>
  clean((exp.page?.blocks?.find((b) => b.type === "hero") as V2Hero | undefined)?.eyebrow || exp.cardTitle || "Caminante");

// ── Las 10 piezas ─────────────────────────────────────────────────────────────
export const PIEZAS: PieceDef[] = [
  // ============ M1 · LANZAMIENTO ============
  {
    id: "P1",
    nombre: "Anuncio",
    momento: "M1 · Lanzamiento",
    trabajo: "«Existe esto y es distinto». Hook, no información.",
    cara: "—",
    formato: "Reel o carrusel",
    cta: "Fechas abiertas · link en bio (a la página de la experiencia).",
    build: (ctx) => {
      const pool = poolFor(ctx, "P1");
      const hero = block(ctx.blocks, "hero") as V2Hero | undefined;
      const st = block(ctx.blocks, "statement") as V2Statement | undefined;
      const laminas: Lamina[] = [
        { kind: "cover", eyebrow: eyebrowExp(ctx.exp), title: clean(hero?.title || expName(ctx.exp)), accent: clean(hero?.titleAccent || ""), tag: has(hero?.sub) ? clean(hero!.sub!) : undefined, bg: heroBg(ctx) },
      ];
      const hook = clean(hero?.sub || st?.body || st?.title || "");
      if (has(hook)) laminas.push({ kind: "foto", line: hook, bg: pick(pool, 1) });
      laminas.push({ kind: "cierre", eyebrow: "Fechas abiertas", title: "Camina", accent: "con nosotros.", cta: "Link en bio", bg: pick(pool, 2) });
      return { estado: "lista", laminas };
    },
  },
  {
    id: "P2",
    nombre: "El mundo",
    momento: "M1 · Lanzamiento",
    trabajo: "Asombro por el LUGAR: por qué importa este ecosistema.",
    cara: "Biología",
    formato: "Carrusel 5–7 láminas",
    cta: "Última lámina: «Caminamos ahí. Link en bio.» (sin venta).",
    build: (ctx) => {
      const pool = poolFor(ctx, "P2");
      const datos = mundoDatos(ctx);
      if (datos.length < 2) return { estado: "pendiente", razon: "Faltan datos del lugar (llena «La experiencia» / «Bloque destacado» con cifras del ecosistema)." };
      const laminas: Lamina[] = [
        { kind: "cover", eyebrow: "El mundo", title: expName(ctx.exp), accent: "por dentro.", bg: coverBg(ctx, pool) },
      ];
      datos.slice(0, 5).forEach((d, i) => {
        if (d.n) laminas.push({ kind: "fact", n: d.n, label: d.label, source: d.source, bg: pick(pool, i + 1) });
        else laminas.push({ kind: "foto", line: d.label, bg: pick(pool, i + 1) });
      });
      laminas.push({ kind: "cierre", eyebrow: "Caminamos ahí", title: "Este lugar", accent: "existe.", cta: "Link en bio", bg: pick(pool, 6) });
      return { estado: "lista", laminas };
    },
  },
  {
    id: "P3",
    nombre: "Quiénes te llevan",
    momento: "M1 · Lanzamiento",
    trabajo: "Confianza: caras y credenciales reales.",
    cara: "Comunidades",
    formato: "Carrusel 4–6 láminas",
    cta: "Suave: «Pregúntanos lo que quieras por DM».",
    build: (ctx) => {
      const pool = poolFor(ctx, "P3");
      const perfiles = guias(ctx);
      if (perfiles.length === 0) return { estado: "pendiente", razon: "Faltan guías/aliados (llena la sección «Guías y aliados» de la experiencia)." };
      const laminas: Lamina[] = [
        { kind: "cover", eyebrow: "Quiénes te llevan", title: "La gente", accent: "de la sierra.", bg: coverBg(ctx, pool) },
      ];
      perfiles.slice(0, 5).forEach((p, i) => laminas.push({ ...p, photo: p.photo ?? pick(pool, i + 1) }));
      laminas.push({ kind: "cierre", eyebrow: "Pregúntanos", title: "Estamos", accent: "para eso.", cta: "DM abierto", bg: pick(pool, 6) });
      return { estado: "lista", laminas };
    },
  },
  // ============ M2 · VENTA ============
  {
    id: "P4",
    nombre: "Así se vive",
    momento: "M2 · Venta",
    trabajo: "Que el prospecto SE PROYECTE en el viaje, hora por hora.",
    cara: "—",
    formato: "Carrusel 5–8 láminas",
    cta: "Fechas y lugares en el link.",
    build: (ctx) => {
      const pool = poolFor(ctx, "P4");
      const itin = block(ctx.blocks, "itinerary") as V2Itinerary | undefined;
      const days = itin?.days ?? [];
      if (days.length === 0) return { estado: "pendiente", razon: "Falta el itinerario de la experiencia." };
      const laminas: Lamina[] = [
        { kind: "cover", eyebrow: clean(itin?.eyebrow || "Itinerario"), title: clean(itin?.title || "Así"), accent: clean(itin?.titleAccent || "se vive."), bg: itin?.bg?.url ? { url: itin.bg.url } : coverBg(ctx, pool) },
      ];
      days.forEach((d, i) =>
        laminas.push({ kind: "dia", num: has(d.num) ? d.num : undefined, lab: clean(d.lab), ttl: has(d.ttl) ? clean(d.ttl!) : undefined, items: d.items.map((x) => x), bg: pick(pool, i + 1) }),
      );
      laminas.push({ kind: "cierre", eyebrow: "Elige tu salida", title: "Fechas y lugares", accent: "en el link.", cta: "Reserva", bg: pick(pool, days.length + 1) });
      return { estado: "lista", laminas };
    },
  },
  {
    id: "P5",
    nombre: "Sin letra chica",
    momento: "M2 · Venta",
    trabajo: "Matar objeciones. La transparencia ES el argumento de venta.",
    cara: "—",
    formato: "Carrusel 4–6 láminas",
    cta: "¿Otra duda? DM y te contestamos hoy.",
    build: (ctx) => {
      const pool = poolFor(ctx, "P5");
      const ch = block(ctx.blocks, "checklist") as V2Checklist | undefined;
      const faq = block(ctx.blocks, "faq") as V2Faq | undefined;
      const yes = ch?.yesItems?.filter(has) ?? [];
      const no = ch?.noItems?.filter(has) ?? [];
      const qa = (faq?.qa ?? []).filter((x) => has(x.q)).slice(0, 3);
      if (yes.length === 0 && qa.length === 0) return { estado: "pendiente", razon: "Falta «Incluye/No incluye» o FAQ en la experiencia." };
      const laminas: Lamina[] = [
        { kind: "cover", eyebrow: "Sin letra chica", title: "Todo", accent: "claro.", bg: coverBg(ctx, pool) },
      ];
      if (yes.length || no.length)
        laminas.push({ kind: "incluye", eyebrow: clean(ch?.eyebrow || "Qué incluye"), title: clean(ch?.title || "Lo que"), accent: clean(ch?.titleAccent || "va contigo."), yesT: clean(ch?.yesTitle || "Incluye"), yes, noT: clean(ch?.noTitle || "No incluye"), no, noMark: ch?.noMark });
      if (qa.length) laminas.push({ kind: "qa", eyebrow: "Preguntas frecuentes", title: "Lo que", accent: "más preguntan.", qa: qa.map((x) => ({ q: clean(x.q), a: clean(x.a) })), bg: faq?.bg?.url ? { url: faq.bg.url } : pick(pool, 1) });
      laminas.push({ kind: "cierre", eyebrow: "¿Otra duda?", title: "Te contestamos", accent: "hoy.", cta: "DM abierto", bg: pick(pool, 2) });
      return { estado: "lista", laminas };
    },
  },
  {
    id: "P6",
    nombre: "La inversión",
    momento: "M2 · Venta",
    trabajo: "El precio con ancla de valor. NUNCA una tabla pelona.",
    cara: "—",
    formato: "Post o carrusel de 3",
    cta: "Reserva en el link (directo a /reservar).",
    build: (ctx) => {
      const pool = poolFor(ctx, "P6");
      const tf = block(ctx.blocks, "tariff") as V2Tariff | undefined;
      const price = clean(tf?.price || ctx.exp.price?.amount || "");
      if (!has(price)) return { estado: "pendiente", razon: "Falta el precio (sección «Inversión» de la experiencia)." };
      const tiers = (ctx.exp.priceTiers ?? []).filter((t) => has(t.amount)).map((t) => ({ l: t.label, v: t.amount.startsWith("$") ? t.amount : `$${t.amount}` }));
      const laminas: Lamina[] = [
        { kind: "cover", eyebrow: "La inversión", title: "Lo que", accent: "sostiene.", bg: coverBg(ctx, pool) },
        { kind: "precio", eyebrow: clean(tf?.eyebrow || "Inversión"), title: clean(tf?.title || "Una tarifa"), accent: clean(tf?.titleAccent || "honesta."), tier: has(tf?.tier) ? clean(tf!.tier) : undefined, price: price.startsWith("$") ? price : `$${price}`, cur: clean(tf?.priceCur || ctx.exp.price?.currency || "MXN · por persona"), lead: has(tf?.lead) ? clean(tf!.lead!) : clean(ctx.exp.price?.desc || ""), tiers: tiers.length ? tiers : undefined, bg: pick(pool, 1) },
        { kind: "cierre", eyebrow: "Aparta tu lugar", title: "Reserva", accent: "en el link.", cta: "Reservar", bg: pick(pool, 2) },
      ];
      return { estado: "lista", laminas };
    },
  },
  {
    id: "P7",
    nombre: "Cupo honesto",
    momento: "M2 · Venta",
    trabajo: "«Quedan N lugares» — verdad literal de la base de datos. Automática.",
    cara: "—",
    formato: "Story (auto ≤5)",
    cta: "Link sticker → /reservar.",
    build: (ctx) => {
      const abiertas = ctx.slots.filter((s) => typeof s.available === "number" && s.available! > 0);
      if (abiertas.length === 0) return { estado: "pendiente", razon: "No hay salidas públicas con lugares (o el cupo es ilimitado)." };
      const bg = heroBg(ctx);
      const laminas: Lamina[] = abiertas.map((s) => ({ kind: "cupo", experiencia: expName(ctx.exp), fecha: s.label, n: s.available as number, bg }));
      return { estado: "lista", laminas };
    },
  },
  // ============ M3 · PRUEBA ============
  {
    id: "P8",
    nombre: "Testimonios",
    momento: "M3 · Prueba",
    trabajo: "Prueba social: voces reales, no la nuestra.",
    cara: "—",
    formato: "Carrusel 4–6 láminas",
    cta: "Próximas fechas en el link.",
    build: (ctx) => {
      if (ctx.quotes.length === 0) return { estado: "pendiente", razon: "Aún no hay testimonios con consentimiento en la encuesta post-viaje." };
      const pool = poolFor(ctx, "P8");
      const laminas: Lamina[] = [
        { kind: "cover", eyebrow: "Testimonios", title: "Lo que", accent: "dijeron.", bg: coverBg(ctx, pool) },
      ];
      ctx.quotes.slice(0, 6).forEach((q, i) => laminas.push({ kind: "cita", quote: clean(q.text), author: q.author, stars: q.stars ?? undefined, bg: pick(pool, i + 1) }));
      laminas.push({ kind: "cierre", eyebrow: "Próximas fechas", title: "Tu turno", accent: "sigue.", cta: "Reserva", bg: pick(pool, 7) });
      return { estado: "lista", laminas };
    },
  },
  {
    id: "P9",
    nombre: "Así se vivió",
    momento: "M3 · Prueba",
    trabajo: "FOMO honesto del viaje que acaba de pasar.",
    cara: "—",
    formato: "Reel o carrusel",
    cta: "La próxima salida es [fecha].",
    build: (ctx) => {
      if (ctx.gallery.length < 3) return { estado: "pendiente", razon: "Faltan fotos del viaje en la galería de «Lo básico» (mín. 3)." };
      const fotos = shuffle(ctx.gallery.map((u) => ({ url: u })), `${ctx.exp.slug || "x"}·P9`);
      const laminas: Lamina[] = [
        { kind: "cover", eyebrow: "Así se vivió", title: expName(ctx.exp), accent: "pasó.", bg: fotos[0] },
      ];
      fotos.slice(1, 7).forEach((f) => laminas.push({ kind: "foto", bg: f }));
      laminas.push({ kind: "cierre", eyebrow: "La próxima salida", title: "Te esperamos", accent: "a ti.", cta: "Reserva", bg: fotos[fotos.length - 1] });
      return { estado: "lista", laminas };
    },
  },
  {
    id: "P10",
    nombre: "La ciencia que vimos",
    momento: "M3 · Prueba",
    trabajo: "Autoridad: 1 cara profundizada con lo que pasó en el viaje.",
    cara: "Biología",
    formato: "Carrusel 5–7 láminas",
    cta: "Ninguno o suave (construye marca, no vende).",
    build: () => ({ estado: "pendiente", razon: "Requiere el episodio de La Fábrica del viaje (transcripción + datos con fuente). Se activa cuando exista." }),
  },
];

// ── Extractores de datos ──────────────────────────────────────────────────────
// Datos del lugar para P2: puntos de "La experiencia" + el statement. Detecta si
// una línea trae una cifra (metros, especies, km, %…) → se muestra como dato grande.
function mundoDatos(ctx: KitContext): { n: string; label: string; source?: string }[] {
  const out: { n: string; label: string; source?: string }[] = [];
  const exp = block(ctx.blocks, "split") as V2Split | undefined;
  const points = (blocksOf(ctx.blocks, "split").find((s) => s.anchor === "experiencia")?.points) ?? exp?.points ?? [];
  const st = block(ctx.blocks, "statement") as V2Statement | undefined;
  const lines = [...points.map(clean), ...(has(st?.body) ? [clean(st!.body!)] : [])].filter(has);
  for (const line of lines) {
    const m = line.match(/(\d[\d.,]*\s?(?:mil|millones|m|km|°|%|especies|metros|años)?\b\+?)/i);
    if (m) {
      const n = m[1].trim();
      const label = line.replace(m[1], "").replace(/^[\s—·,:-]+/, "").trim() || line;
      out.push({ n, label: fit(label, 130) }); // dato: número grande + etiqueta corta
    } else {
      out.push({ n: "", label: fit(line, 220) }); // frase sobre foto: cabe holgado
    }
  }
  return out;
}

// Guías/aliados para P3: perfiles de las secciones split de guías (paragraphs =
// persona con bio; items = lista de aliados) + operador. Cada uno → lámina perfil.
function guias(ctx: KitContext): Extract<Lamina, { kind: "perfil" }>[] {
  const out: Extract<Lamina, { kind: "perfil" }>[] = [];
  const splits = blocksOf(ctx.blocks, "split").filter((s) => s.anchor !== "experiencia");
  for (const s of splits) {
    const photo = s.media?.images?.[0]?.url ? { url: s.media.images[0].url } : undefined;
    if (s.paragraphs?.some(has)) {
      out.push({ kind: "perfil", name: clean([s.title, s.titleAccent].filter(Boolean).join(" ")), role: clean(s.eyebrow || ""), cred: has(s.subEyebrow) ? clean(s.subEyebrow!) : undefined, body: clean((s.paragraphs.find(has) as string) || ""), photo });
    } else if (s.items?.length) {
      // Varios items comparten UNA sola foto del split → si se la damos a todos,
      // salen láminas repetidas. La dejamos sin foto: P3 le asigna a cada una una
      // foto DISTINTA del banco barajado (p.photo ?? pick).
      for (const it of s.items.filter((i) => has(i.name))) out.push({ kind: "perfil", name: clean(it.name), role: clean(it.role || s.eyebrow || "") });
    }
  }
  return out;
}
