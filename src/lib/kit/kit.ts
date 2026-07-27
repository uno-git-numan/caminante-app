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
  | { kind: "cierre"; eyebrow: string; title: string; accent?: string; cta: string; bg: Foto }
  // ── SISTEMA EDITORIAL (serie E) ────────────────────────────────────────────
  // Segundo sistema visual: cuenta una historia en secuencia (portada → cuerpos
  // → cierre) en vez de vender con un cartel. Marca mínima, foto e idea. Los
  // textos con **negrita** se renderizan en <b> (ver inline() en KitDeck).
  | { kind: "edu-portada"; hook: string; teaser: string; bg: Foto }
  | { kind: "edu-cuerpo"; claim: string; caption?: string; src?: string; bg: Foto } // caballo de batalla
  | { kind: "edu-ficha"; nom: string; sci?: string; rows: { k: string; v: string }[]; src?: string; bg: Foto }
  | { kind: "edu-postal"; line: string; bg: Foto }
  | { kind: "edu-dcover"; h: string; t: string; index: string; bg: Foto } // portada del diccionario
  | { kind: "edu-dentry"; term: string; cat?: string; def: string; src?: string; img: Foto } // lámina de espécimen 58/42
  | { kind: "edu-retrato"; cita: string; name: string; role: string; bg: Foto };

export type Momento = "M1 · Lanzamiento" | "M2 · Venta" | "M3 · Prueba" | "E · Informativo";
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
  // Banco de fotos tipificado + ficha científica (serie E). null = sin capturar.
  photoBank: Experience["photoBank"] | null;
  ficha: Experience["ficha"] | null;
  reservarUrl: string;
  expUrl: string;
};

// ── Utilidades ────────────────────────────────────────────────────────────────
const has = (s?: string | null): s is string => !!s && s.trim().length > 0;
const clean = (s: string) => s.replace(/\*\*/g, "").replace(/\*/g, "").trim();

// Ajusta un texto a un máximo de caracteres SIN cortar palabras: si excede,
// retrocede al último espacio y agrega "…" — nunca parte una palabra a la mitad.
//
// ⚠️ 27 jul 2026: estos límites YA NO son "lo que cabe en la lámina" — son un tope de
// SEGURIDAD (por si alguien pega un párrafo entero en la ficha). Lo que cabe lo resuelve
// `autoSize()` en KitDeck, que ENCOGE la tipografía en vez de cortar el texto. Antes se
// publicó un dato de Ensenada cortado a media frase; un dato incompleto no se publica.
// Si vuelves a bajar estos números, vas a truncar contenido real otra vez.
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

// Clave de una foto = su nombre ORIGINAL, sin el prefijo de timestamp que le pone
// el subidor (`<Date.now()>-<nombre-real>.jpg`) ni el query. Así, la MISMA foto
// subida varias veces (distinto timestamp) → misma clave → se dedup como una
// sola. Sin esto salía repetida en un carrusel (galería con la misma foto 2-3x).
const SLOTS_PREFIJO = /^(flora|paisaje|comunidad|comida|gente|problemas|cielo|detalle)-/;
const fileKey = (url: string): string =>
  (url.split("?")[0].split("/").pop() || url)
    .replace(/^\d{10,}-/, "")
    // `scripts/subir-banco.mjs` guarda como `<slot>-<nombre>`: sin quitar ese prefijo, la MISMA
    // foto contaba como dos (una en la galería, otra en el banco) y salía repetida en el kit.
    .replace(SLOTS_PREFIJO, "");

// Banco de fotos: galería de "Lo básico" primero; luego los fondos de los bloques
// (hero, statement, itinerario, faq, mosaicos) como respaldo. Dedup POR ARCHIVO.
function photoPool(ctx: KitContext): Foto[] {
  const out: Foto[] = [];
  const seen = new Set<string>();
  const add = (url?: string, alt?: string) => {
    if (!has(url)) return;
    const k = fileKey(url!);
    if (seen.has(k)) return;
    seen.add(k);
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
// Banco de fotos TIPIFICADO (photoBank): fotos por tipo de contenido.
type BankKey = keyof NonNullable<Experience["photoBank"]>;
const BANK_KEYS: BankKey[] = ["flora", "paisaje", "comunidad", "comida", "gente", "problemas", "cielo", "detalle"];
function bankPhotos(ctx: KitContext, keys: BankKey[]): Foto[] {
  const pb = ctx.photoBank ?? {};
  const out: Foto[] = [];
  for (const k of keys) for (const u of pb[k] ?? []) if (has(u)) out.push({ url: u });
  return out;
}

// Banco de fotos BARAJADO por pieza (salt = id de la pieza) → cada pieza usa un
// orden propio. PRIORIDAD: slots tipificados pedidos (`categorias`) → resto del
// banco → galería + fondos de bloques (compat: sin banco, funciona como hoy).
// `exclude` = URLs a sacar (p.ej. la foto que ya usa la portada). Dedupe por
// nombre original de archivo, conservando la prioridad.
function poolFor(
  ctx: KitContext,
  salt: string,
  opts: { exclude?: (string | undefined)[]; categorias?: BankKey[] } = {},
): Foto[] {
  const ex = new Set((opts.exclude ?? []).filter(has).map((u) => fileKey(u!)));
  const seed = `${ctx.exp.slug || "x"}·${salt}`;
  const cats = opts.categorias ?? [];
  const prioridad = shuffle(bankPhotos(ctx, cats), seed);
  const resto = shuffle(bankPhotos(ctx, BANK_KEYS.filter((k) => !cats.includes(k))), `${seed}·resto`);
  const base = shuffle(photoPool(ctx), `${seed}·base`);
  const seen = new Set<string>();
  const out: Foto[] = [];
  for (const f of [...prioridad, ...resto, ...base]) {
    const k = fileKey(f.url);
    if (ex.has(k) || seen.has(k)) continue;
    seen.add(k);
    out.push(f);
  }
  return out;
}
// ── REGISTRO GLOBAL DE PORTADAS (fix 26 jul 2026) ────────────────────────────
// BUG que corrige: cada pieza barajaba su pool por separado y tomaba `pool[0]`,
// así que nada impedía que dos piezas sacaran la MISMA portada — en el feed real
// salieron 3 posts distintos con la misma foto de portada. Con bancos chicos la
// colisión es casi segura, no mala suerte.
//
// Ahora las portadas de TODAS las piezas se reparten UNA sola vez por kit, en
// orden fijo y determinista: cada pieza recibe la primera foto de SU pool que
// ninguna otra haya tomado ya. Las portadas FIJAS (el hero de P1, el fondo del
// itinerario de P4) se reservan primero para que nadie más las pise.
// Si el banco se agota, se permite repetir (mejor una repetida que una vacía)
// pero eso solo pasa con menos fotos que piezas.
const ORDEN_PORTADAS = ["P1", "P4", "P2", "P3", "P5", "P6", "P7", "P8", "P9", "P10"];

const _portadas = new WeakMap<object, Map<string, Foto>>();
function repartoPortadas(ctx: KitContext): Map<string, Foto> {
  const hit = _portadas.get(ctx as object);
  if (hit) return hit;
  const m = new Map<string, Foto>();
  const usadas = new Set<string>();
  const reservar = (f?: Foto) => { if (f?.url) usadas.add(fileKey(f.url)); return f; };

  // 1) portadas fijas por diseño (no se eligen del pool)
  const itin = block(ctx.blocks, "itinerary") as V2Itinerary | undefined;
  const fijas: Record<string, Foto | undefined> = {
    P1: heroBg(ctx),
    P4: itin?.bg?.url ? { url: itin.bg.url } : undefined,
  };
  // 2) reparto: la primera foto LIBRE del pool de cada pieza
  for (const id of ORDEN_PORTADAS) {
    const fija = fijas[id];
    if (fija?.url) { m.set(id, reservar(fija)!); continue; }
    const pool = poolFor(ctx, id);
    const libre = pool.find((f) => !usadas.has(fileKey(f.url)));
    const elegida = libre ?? pool[0] ?? heroBg(ctx);
    m.set(id, reservar(elegida)!);
  }
  _portadas.set(ctx as object, m);
  return m;
}
// Portada de una pieza, ÚNICA en todo el kit. `pool` queda como respaldo por si
// la pieza no está en el reparto.
function coverBg(ctx: KitContext, pool: Foto[], pieceId?: string): Foto {
  if (pieceId) {
    const f = repartoPortadas(ctx).get(pieceId);
    if (f?.url) return f;
  }
  return pool.length ? pool[0] : heroBg(ctx);
}
// Las portadas ya tomadas por las piezas promocionales — la serie E las evita
// para que tampoco se repitan entre los dos sistemas.
function portadasUsadas(ctx: KitContext): Set<string> {
  return new Set([...repartoPortadas(ctx).values()].filter((f) => f?.url).map((f) => fileKey(f.url)));
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
      const pool = poolFor(ctx, "P1", { exclude: [heroBg(ctx).url] }); // la portada usa el hero → fuera del cuerpo
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
        { kind: "cover", eyebrow: "El mundo", title: expName(ctx.exp), accent: "por dentro.", bg: coverBg(ctx, pool, "P2") },
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
        { kind: "cover", eyebrow: "Quiénes te llevan", title: "La gente", accent: "de la sierra.", bg: coverBg(ctx, pool, "P3") },
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
      const itin = block(ctx.blocks, "itinerary") as V2Itinerary | undefined;
      const pool = poolFor(ctx, "P4", { exclude: [itin?.bg?.url] }); // la portada usa el fondo del itinerario → fuera del cuerpo
      const days = itin?.days ?? [];
      if (days.length === 0) return { estado: "pendiente", razon: "Falta el itinerario de la experiencia." };
      const laminas: Lamina[] = [
        { kind: "cover", eyebrow: clean(itin?.eyebrow || "Itinerario"), title: clean(itin?.title || "Así"), accent: clean(itin?.titleAccent || "se vive."), bg: coverBg(ctx, pool, "P4") },
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
      const ch = block(ctx.blocks, "checklist") as V2Checklist | undefined;
      const faq = block(ctx.blocks, "faq") as V2Faq | undefined;
      const pool = poolFor(ctx, "P5", { exclude: [faq?.bg?.url] }); // la lámina de FAQ usa el fondo del FAQ → fuera del resto
      const yes = ch?.yesItems?.filter(has) ?? [];
      const no = ch?.noItems?.filter(has) ?? [];
      const qa = (faq?.qa ?? []).filter((x) => has(x.q)).slice(0, 3);
      if (yes.length === 0 && qa.length === 0) return { estado: "pendiente", razon: "Falta «Incluye/No incluye» o FAQ en la experiencia." };
      const laminas: Lamina[] = [
        { kind: "cover", eyebrow: "Sin letra chica", title: "Todo", accent: "claro.", bg: coverBg(ctx, pool, "P5") },
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
        { kind: "cover", eyebrow: "La inversión", title: "Lo que", accent: "sostiene.", bg: coverBg(ctx, pool, "P6") },
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
      const pool = poolFor(ctx, "P7");
      // La 1ª lámina usa la portada asignada en el reparto global (si no, chocaba con otra pieza).
      const portada = coverBg(ctx, pool, "P7");
      const laminas: Lamina[] = abiertas.map((s, i) => ({ kind: "cupo", experiencia: expName(ctx.exp), fecha: s.label, n: s.available as number, bg: i === 0 ? portada : (pool.length ? pick(pool, i) : heroBg(ctx)) }));
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
        { kind: "cover", eyebrow: "Testimonios", title: "Lo que", accent: "dijeron.", bg: coverBg(ctx, pool, "P8") },
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
      // Dedup por nombre original (la galería puede traer la misma foto 2-3x con
      // distinto timestamp) para que el carrusel no repita.
      const seenG = new Set<string>();
      const uniq = ctx.gallery.filter((u) => { const k = fileKey(u); if (seenG.has(k)) return false; seenG.add(k); return true; });
      if (uniq.length < 3) return { estado: "pendiente", razon: "Faltan fotos del viaje en la galería de «Lo básico» (mín. 3)." };
      const fotos = shuffle(uniq.map((u) => ({ url: u })), `${ctx.exp.slug || "x"}·P9`);
      const laminas: Lamina[] = [
        { kind: "cover", eyebrow: "Así se vivió", title: expName(ctx.exp), accent: "pasó.", bg: coverBg(ctx, fotos, "P9") },
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

// ── SERIE E · Catálogo informativo ───────────────────────────────────────────
// Piezas educativas ATEMPORALES (no venden; construyen autoridad). Materia
// prima: la FICHA CIENTÍFICA (datos con fuente, jamás inventados) + el banco de
// fotos tipificado. El MAPEO A LÁMINAS de cada pieza vive aislado en su función
// laminasEx() con kinds EXISTENTES provisionales — los kinds definitivos
// (especie, dato-grande, glosario, postal) llegan de Claude Design y se
// intercambian ahí sin tocar los builders.

const FALTA_FICHA = "Falta la ficha científica — llénala en el formulario (sección «Ficha científica»)";

function fichaDatos(ctx: KitContext, cara?: string): { n?: string; texto: string; fuente: string; cara?: string }[] {
  return (ctx.ficha?.datos ?? []).filter(
    (d) => has(d.texto) && has(d.fuente) && (cara === undefined || (d.cara || "") === cara),
  );
}

// Lugar en corto (para ganchos y firmas): el meta del hero ("Edo. de México") o
// el nombre de la experiencia. Nunca inventado.
function lugarCorto(ctx: KitContext): string {
  const hero = block(ctx.blocks, "hero") as V2Hero | undefined;
  return clean(hero?.metaEst || expName(ctx.exp));
}

// ── Sistema EDITORIAL (serie E) — REDISEÑO 21 jul (5 principios de Luis) ───────
// P1 la foto NUNCA contradice el texto · P3 nada de medias piezas · P4 la marca
// susurra · P5 nada se repite DENTRO de un post.
//
// P5 — REGLA DE REÚSO (22 jul, decisión de Luis): una foto SÍ puede aparecer en
// varios posts; lo prohibido es que se repita dentro del MISMO post. Antes el
// registro era global y marcaba la foto como quemada para siempre: con bancos
// chicos, la primera pieza se llevaba todas y las demás quedaban "pendientes"
// aunque la ficha estuviera completa. Ahora el ledger CUENTA usos y siempre
// entrega la foto MENOS USADA del slot → nadie repite hasta que todas dieron
// una vuelta, nadie va a la tercera hasta que todas llevan dos. Se reparte el
// desgaste solo, sin tope arbitrario: repetir sí, quemar no.
const NEUTRO: BankKey[] = ["paisaje", "cielo"]; // ÚNICO fondo válido detrás de ciencia

// Repartidor con el alcance de UNA pieza (lo que ve cada build*).
type EduTaker = {
  take: (cats: BankKey[]) => Foto | null;
  takePref: (pref: Foto | undefined, cats: BankKey[]) => Foto | null;
  // Portada: además de repartir parejo, evita reusar una foto que YA fue portada
  // de otra pieza — la portada es lo que se ve en el feed sin abrir el carrusel.
  cover: (cats: BankKey[]) => Foto | null;
};
type EduLedger = { scope: (pieceId: string) => EduTaker };

// Registro de fotos del kit. Orden determinista por slug (thumbnail y PNG
// exportado coinciden): ante empate de usos gana el primero del barajado.
function makeLedger(ctx: KitContext): EduLedger {
  const slug = ctx.exp.slug || "x";
  const bySlot: Partial<Record<BankKey, Foto[]>> = {};
  for (const k of BANK_KEYS) bySlot[k] = shuffle(bankPhotos(ctx, [k]), `${slug}·${k}`);
  const usos = new Map<string, number>(); // veces que se usó cada foto en TODO el kit
  // Arranca con las portadas que YA tomaron las piezas promocionales: así una portada
  // de la serie E nunca repite la de un post promocional (fix 26 jul 2026).
  const portadas = new Set<string>(portadasUsadas(ctx));
  const veces = (k: string) => usos.get(k) ?? 0;

  return {
    scope(_pieceId: string): EduTaker {
      const enPieza = new Set<string>(); // REGLA DURA: nunca dos veces en el mismo post
      const elegir = (cats: BankKey[], esPortada: boolean): Foto | null => {
        let mejor: Foto | null = null;
        let mejorPeso = Infinity;
        for (const c of cats)
          for (const f of bySlot[c] ?? []) {
            const k = fileKey(f.url);
            if (enPieza.has(k)) continue;
            // Repetir una PORTADA es lo peor que puede pasar (es lo que se ve en el feed sin
            // abrir el post), así que domina cualquier otra consideración: una foto que ya fue
            // portada solo se vuelve a elegir como portada si TODAS lo fueron. Después de eso,
            // se reparte parejo por número de usos.
            const peso = (esPortada && portadas.has(k) ? 1000 : 0) + veces(k) * 2;
            if (peso < mejorPeso) {
              mejor = f;
              mejorPeso = peso;
            }
          }
        if (!mejor) return null;
        const k = fileKey(mejor.url);
        enPieza.add(k);
        usos.set(k, veces(k) + 1);
        if (esPortada) portadas.add(k);
        return mejor;
      };
      return {
        take: (cats) => elegir(cats, false),
        cover: (cats) => elegir(cats, true),
        takePref(pref, cats) {
          if (pref?.url) {
            const k = fileKey(pref.url);
            if (!enPieza.has(k)) {
              enPieza.add(k);
              usos.set(k, veces(k) + 1);
              return pref;
            }
          }
          return elegir(cats, false);
        },
      };
    },
  };
}
// Toma hasta n fotos DISTINTAS ENTRE SÍ de las categorías dadas (una pieza).
function tomar(led: EduTaker, cats: BankKey[], n: number): Foto[] {
  const out: Foto[] = [];
  for (let i = 0; i < n; i++) {
    const f = led.take(cats);
    if (!f) break;
    out.push(f);
  }
  return out;
}
const PENDIENTE_PAISAJE =
  "Esta pieza necesita más fotos DISTINTAS de paisaje: una foto puede repetirse entre posts, pero nunca dos veces dentro del mismo post — sube más al Banco de fotos (slots «Paisaje»/«Cielo»). Nunca ponemos una foto que contradiga el texto.";

// Portada editorial: gancho + teaser + flecha (el fondo lo asigna el ledger).
function eduPortada(hook: string, teaser: string, bg: Foto): Lamina {
  return { kind: "edu-portada", hook: fit(hook, 200), teaser: fit(teaser, 140), bg };
}

// Un dato → lámina de cuerpo: la primera oración es el CLAIM (grande, itálica),
// el resto el caption. Si el dato trae cifra (`n`), encabeza el claim.
function datoACuerpo(d: { n?: string; texto: string; fuente: string }, bg: Foto): Lamina {
  const t = clean(d.texto);
  const corte = t.search(/\.\s+/);
  const primera = corte > 0 ? t.slice(0, corte + 1) : t;
  const resto = corte > 0 ? t.slice(corte + 2).trim() : "";
  return {
    kind: "edu-cuerpo",
    claim: fit(has(d.n) ? `${d.n} · ${primera}` : primera, 300),
    caption: has(resto) ? fit(resto, 420) : undefined,
    src: `Fuente: ${clean(d.fuente)}`,
    bg,
  };
}

// E1 · Ficha de especie (el sujeto ES la especie → foto del slot «flora»).
// Las filas k/v salen del dato: si el texto trae "Clave: valor" se parte ahí.
function buildE1(ctx: KitContext, led: EduTaker): PieceState {
  const esp = (ctx.ficha?.especies ?? []).filter((e) => has(e.comun)).slice(0, 6);
  if (!esp.length) return { estado: "pendiente", razon: `${FALTA_FICHA} → Especies.` };
  const fichas: Lamina[] = [];
  for (const e of esp) {
    const bg = led.take(["flora"]) ?? led.take(NEUTRO);
    if (!bg) break;
    const datos = (e.datos ?? []).filter((x) => has(x.texto) && has(x.fuente)).slice(0, 4);
    fichas.push({
      kind: "edu-ficha",
      nom: clean(e.comun),
      sci: has(e.cientifico) ? clean(e.cientifico!) : undefined,
      rows: datos.map((d, j) => {
        const t = clean(d.texto);
        const sep = t.indexOf(":");
        return sep > 0 && sep <= 22
          ? { k: t.slice(0, sep).trim(), v: fit(t.slice(sep + 1), 200) }
          : { k: `Dato ${String(j + 1).padStart(2, "0")}`, v: fit(t, 200) };
      }),
      src: datos[0] ? `Fuente: ${clean(datos[0].fuente)}` : undefined,
      bg,
    });
  }
  const portada = led.cover(["flora"]) ?? led.cover(NEUTRO);
  if (!portada || fichas.length < 2) return { estado: "pendiente", razon: PENDIENTE_PAISAJE };
  return {
    estado: "lista",
    laminas: [eduPortada(`Quién vive en **${lugarCorto(ctx)}**`, `${fichas.length} ${fichas.length === 1 ? "especie" : "especies"} de este lugar.`, portada), ...fichas],
  };
}

// E2 · El dato → portada + cuerpos (cada dato con su fuente). Fondo NEUTRO.
function buildE2(ctx: KitContext, led: EduTaker): PieceState {
  const datos = fichaDatos(ctx).slice(0, 7);
  if (!datos.length) return { estado: "pendiente", razon: `${FALTA_FICHA} → Datos del lugar.` };
  const cuerpos: Lamina[] = [];
  for (const d of datos) {
    const bg = led.take(NEUTRO);
    if (!bg) break;
    cuerpos.push(datoACuerpo(d, bg));
  }
  const portada = led.cover(NEUTRO);
  if (!portada || cuerpos.length < 2) return { estado: "pendiente", razon: PENDIENTE_PAISAJE };
  return { estado: "lista", laminas: [eduPortada(`${cuerpos.length} datos del **${lugarCorto(ctx)}**`, "Cada uno con su fuente.", portada), ...cuerpos] };
}

// E3 · Diccionario → portada macro + láminas de espécimen. Fondo NEUTRO (el
// glosario es ciencia: va sobre el paisaje del lugar, jamás sobre un interior).
function buildE3(ctx: KitContext, led: EduTaker): PieceState {
  const glo = (ctx.ficha?.glosario ?? []).filter((g) => has(g.termino) && has(g.def)).slice(0, 8);
  if (!glo.length) return { estado: "pendiente", razon: `${FALTA_FICHA} → Glosario.` };
  const entries: Lamina[] = [];
  for (const g of glo) {
    const img = led.take(NEUTRO);
    if (!img) break;
    entries.push({ kind: "edu-dentry", term: clean(g.termino), def: fit(g.def, 420), img });
  }
  const portada = led.cover(NEUTRO);
  if (!portada || entries.length < 2) return { estado: "pendiente", razon: PENDIENTE_PAISAJE };
  const index = glo.slice(0, entries.length).map((g) => clean(g.termino).toUpperCase()).join(" · ");
  return { estado: "lista", laminas: [{ kind: "edu-dcover", h: "Diccionario básico de", t: lugarCorto(ctx), index, bg: portada }, ...entries] };
}

// E4 · La temporada → requiere ≥3 épocas (que cuente el AÑO, no una estación
// suelta). Fondo NEUTRO.
function buildE4(ctx: KitContext, led: EduTaker): PieceState {
  const tem = (ctx.ficha?.temporada ?? []).filter((t) => has(t.epoca) && has(t.fenomeno)).slice(0, 6);
  if (!tem.length) return { estado: "pendiente", razon: `${FALTA_FICHA} → Temporada.` };
  if (tem.length < 3) return { estado: "pendiente", razon: "La temporada necesita al menos 3 épocas para contar el año completo — complétala en la ficha (sección «Temporada»)." };
  const cuerpos: Lamina[] = [];
  for (const t of tem) {
    const bg = led.take(NEUTRO);
    if (!bg) break;
    cuerpos.push({ kind: "edu-cuerpo", claim: fit(clean(t.epoca), 140), caption: fit(clean(t.fenomeno), 420), src: has(t.fuente) ? `Fuente: ${clean(t.fuente!)}` : undefined, bg });
  }
  const portada = led.cover(NEUTRO);
  if (!portada || cuerpos.length < 3) return { estado: "pendiente", razon: PENDIENTE_PAISAJE };
  return { estado: "lista", laminas: [eduPortada(`El calendario de **${lugarCorto(ctx)}**`, "La naturaleza manda las fechas.", portada), ...cuerpos] };
}

// Quién puede protagonizar un RETRATO de E5: solo perfiles con saber real
// escrito (bio o credencial). `guias()` también devuelve items sueltos de los
// splits (en hongos, VARIEDADES) — sin este filtro salían como personas.
function retratables(ctx: KitContext): Extract<Lamina, { kind: "perfil" }>[] {
  return guias(ctx).filter((p) => has(p.name) && (has(p.body) || has(p.cred)));
}

// E5 · Quien sabe sabe → retratos de PERSONAS (slots gente/comunidad; el sujeto
// ES la persona). La cita es la BIO REAL del guía, jamás inventada.
function buildE5(ctx: KitContext, led: EduTaker): PieceState {
  const perfiles = retratables(ctx).slice(0, 6);
  if (!perfiles.length) return { estado: "pendiente", razon: "Faltan biografías de guías/comunidad: el retrato necesita su saber escrito, no solo el nombre (sección «Guías y aliados» de la experiencia)." };
  const retratos: Lamina[] = [];
  for (const p of perfiles) {
    const bg = led.takePref(p.photo?.url ? p.photo : undefined, ["gente", "comunidad"]);
    if (!bg) break;
    retratos.push({ kind: "edu-retrato", cita: fit(clean(p.body || p.cred || ""), 420), name: p.name, role: clean(p.role || (p.body ? p.cred || "" : "")), bg });
  }
  const portada = led.cover(["gente", "comunidad"]) ?? led.cover(NEUTRO);
  if (!portada || retratos.length < 2) return { estado: "pendiente", razon: "Faltan fotos de GENTE/COMUNIDAD únicas para los retratos — sube más al Banco de fotos (slots «Gente»/«Comunidad»)." };
  return { estado: "lista", laminas: [eduPortada("Quiénes **leen** este lugar", "El mapa no trae este conocimiento.", portada), ...retratos] };
}

// E6 · La conexión → datos de conservación (fondo NEUTRO). Necesita ≥2 datos
// con cara «Conservación» — una sola lámina no se publica.
function buildE6(ctx: KitContext, led: EduTaker): PieceState {
  const datos = fichaDatos(ctx, "conservacion").slice(0, 5);
  if (datos.length < 2) return { estado: "pendiente", razon: `${FALTA_FICHA} → al menos 2 datos con cara «Conservación».` };
  const cuerpos: Lamina[] = [];
  for (const d of datos) {
    const bg = led.take(NEUTRO);
    if (!bg) break;
    cuerpos.push(datoACuerpo(d, bg));
  }
  const portada = led.cover(NEUTRO);
  if (!portada || cuerpos.length < 2) return { estado: "pendiente", razon: PENDIENTE_PAISAJE };
  return { estado: "lista", laminas: [eduPortada("Caminar también **conserva**", `Lo que sostiene ${lugarCorto(ctx)}.`, portada), ...cuerpos] };
}

// E8 · Postales — 4–6 láminas, cada una FOTO DISTINTA (paisaje/gente/detalle) +
// una línea corta tipo título de película. Sin dato, sin fuente, sin CTA.
function buildE8(ctx: KitContext, led: EduTaker): PieceState {
  const hero = block(ctx.blocks, "hero") as V2Hero | undefined;
  const st = block(ctx.blocks, "statement") as V2Statement | undefined;
  const primera = (s: string) => {
    const t = clean(s);
    const c = t.search(/\.\s+/);
    return c > 0 ? t.slice(0, c + 1) : t;
  };
  const seen = new Set<string>();
  const lineas: string[] = [];
  for (const raw of [hero?.title, hero?.sub, st?.title, st?.body, expName(ctx.exp)]) {
    if (!has(raw)) continue;
    const l = primera(raw!);
    const sig = l.toLowerCase().replace(/[^a-z0-9áéíóúñ]/g, "");
    if (l.length > 0 && l.length <= 80 && sig && !seen.has(sig)) {
      seen.add(sig);
      lineas.push(l);
    }
  }
  if (!lineas.length) lineas.push(expName(ctx.exp));
  // La 1ª lámina de la postal es la portada del post → pasa por cover() para no repetir
  // ninguna otra portada del kit; el resto son cuerpo y usan el reparto normal.
  const POSTAL: BankKey[] = ["paisaje", "gente", "detalle"];
  const fotos = [led.cover(POSTAL), ...tomar(led, POSTAL, 5)].filter((f): f is Foto => !!f?.url);
  if (!fotos.length) fotos.push(coverBg(ctx, photoPool(ctx)));
  const laminas: Lamina[] = fotos.map((bg, i) => ({ kind: "edu-postal", line: fit(lineas[i % lineas.length], 160), bg }));
  return { estado: "lista", laminas };
}

// Construye TODA la serie E con un registro de fotos COMPARTIDO. El orden de
// REPARTO (no el de display) da el pool NEUTRO primero a la ciencia (E4 estrella
// → E2 → E3 → E6), luego E1 (flora), E5 (gente/comunidad) y las postales E8 al
// final. Memoizado por ctx (cada pieza pregunta por su id).
const _serieE = new WeakMap<object, Record<string, PieceState>>();
function buildSerieE(ctx: KitContext): Record<string, PieceState> {
  const hit = _serieE.get(ctx as object);
  if (hit) return hit;
  const led = makeLedger(ctx);
  const out: Record<string, PieceState> = {};
  out.E4 = buildE4(ctx, led.scope("E4"));
  out.E2 = buildE2(ctx, led.scope("E2"));
  out.E3 = buildE3(ctx, led.scope("E3"));
  out.E6 = buildE6(ctx, led.scope("E6"));
  out.E1 = buildE1(ctx, led.scope("E1"));
  out.E5 = buildE5(ctx, led.scope("E5"));
  out.E8 = buildE8(ctx, led.scope("E8"));
  _serieE.set(ctx as object, out);
  return out;
}

// Serie E — REDISEÑO 21 jul: E7 «Lo incómodo» ELIMINADA (P4). Cada `build`
// delega al constructor coordinado `buildSerieE` (registro de fotos compartido);
// el orden de display es E1..E6, E8, el de reparto de fotos vive en buildSerieE.
export const PIEZAS_E: PieceDef[] = [
  {
    id: "E1",
    nombre: "Ficha de especie",
    momento: "E · Informativo",
    trabajo: "Autoridad: una especie del lugar, con datos y fuente. Educa, no vende.",
    cara: "Biología",
    formato: "Carrusel editorial · portada + fichas",
    cta: "Suave: «Guarda esta ficha» / link en bio.",
    build: (ctx) => buildSerieE(ctx).E1,
  },
  {
    id: "E2",
    nombre: "El dato",
    momento: "E · Informativo",
    trabajo: "Un dato duro del lugar con su fuente — el asombro está en la cifra.",
    cara: "Biología",
    formato: "Carrusel editorial · portada + datos",
    cta: "Suave: «Guárdalo» / link en bio.",
    build: (ctx) => buildSerieE(ctx).E2,
  },
  {
    id: "E3",
    nombre: "Diccionario visual",
    momento: "E · Informativo",
    trabajo: "Términos del ecosistema explicados en simple — vocabulario para mirar mejor.",
    cara: "Biología",
    formato: "Diccionario · portada macro + láminas de espécimen",
    cta: "«Guárdalo para el viaje».",
    build: (ctx) => buildSerieE(ctx).E3,
  },
  {
    id: "E4",
    nombre: "La temporada",
    momento: "E · Informativo",
    trabajo: "Qué pasa en el ecosistema según la época — la naturaleza manda el calendario.",
    cara: "Biología",
    formato: "Carrusel editorial · portada + épocas (año completo)",
    cta: "Suave: «La temporada manda» / link en bio.",
    build: (ctx) => buildSerieE(ctx).E4,
  },
  {
    id: "E5",
    nombre: "Quien sabe sabe",
    momento: "E · Informativo",
    trabajo: "El conocimiento local como autoridad — guías y comunidad, sin vender nada.",
    cara: "Comunidades",
    formato: "Carrusel editorial · retratos con saber local",
    cta: "NINGUNO — esta pieza construye respeto, no vende.",
    build: (ctx) => buildSerieE(ctx).E5,
  },
  {
    id: "E6",
    nombre: "La conexión",
    momento: "E · Informativo",
    trabajo: "Cómo caminar este lugar lo conserva — el vínculo turismo→conservación con datos.",
    cara: "Conservación",
    formato: "Carrusel editorial · portada + datos",
    cta: "Suave: link en bio.",
    build: (ctx) => buildSerieE(ctx).E6,
  },
  {
    id: "E8",
    nombre: "Postal",
    momento: "E · Informativo",
    trabajo: "Fotos que respiran + una línea. Presencia pura de marca, cero fricción.",
    cara: "—",
    formato: "Postales · 4–6 láminas, solo foto y una línea",
    cta: "Ninguno o link en bio.",
    build: (ctx) => buildSerieE(ctx).E8,
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
