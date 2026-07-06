// Pre-llenado con IA del formulario de experiencia: recibe los documentos del
// operador (itinerario PDF, brochure, fotos de folletos, texto suelto) y le
// pide a Claude que devuelva la experiencia en la MISMA forma que el form
// (subset de Experience, sin URLs de imagen — las fotos las sube Luis).
//
// Salida estructurada garantizada vía output_config.format (json_schema): la
// API valida la forma antes de responder, no hay parseo frágil.
//
// Llamada por HTTP directo (sin @anthropic-ai/sdk): es UNA petición POST y así
// no agregamos dependencia; si el uso crece, migrar al SDK oficial.

const MODEL = "claude-opus-4-8";
const API = "https://api.anthropic.com/v1/messages";

export type ArchivoEntrada = {
  name: string;
  mediaType: string; // application/pdf | image/* | text/*
  base64?: string; // pdf/imagen
  text?: string; // texto plano
};

export type SlotIA = {
  label: string; // "Domingo 24 ago"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (igual a startDate si es de un día)
  capacity: string; // "17" o "" si no se sabe
};

export type PrellenadoIA = {
  data: Record<string, unknown>; // Partial<Experience> (solo texto, sin imágenes)
  slots: SlotIA[];
  notas: string; // qué no pudo llenar / qué asumió
};

// ── Esquema de salida ──────────────────────────────────────────────────────
// Espejo de los campos de TEXTO de Experience (types.ts). Sin imageUrl/heroImageUrl
// (fotos = manuales), sin slug/status/stripeLink (los maneja el form/servidor).
const s = (description?: string) => ({ type: "string", ...(description ? { description } : {}) });
const arr = (items: unknown) => ({ type: "array", items });
const obj = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

const ESQUEMA = obj({
  data: obj({
    // ── metadatos de la experiencia ──
    // estado: SIN enum (los 33 valores inflaban la gramática compilada y la API
    // la rechaza por tamaño). La descripción empuja al nombre oficial y
    // normalizarEstado (aplicar-prellenado) corrige variantes o deja vacío.
    estado: s("Nombre completo oficial del estado, p.ej. 'Estado de México', 'Baja California Sur'"),
    cardTitle: s("Nombre corto de la experiencia para la tarjeta del home, p.ej. 'Recolección de Hongos'"),
    cardPloc: s("'Estado · Mes Año'"),
    cardHook: s("Gancho de una línea para la tarjeta del landing"),
    // comercio. price = precio base/'desde'. Si hay varios niveles (tipo de
    // habitación, categoría), lístalos en priceTiers y usa el MÁS BAJO como amount.
    price: obj({
      amount: s("Solo el número del precio base/más bajo, p.ej. '11,500'"),
      currency: { type: "string", enum: ["MXN · por persona", "USD · por persona"], description: "Moneda" },
      desc: s("Qué cubre el precio, una línea"),
    }),
    priceTiers: arr(obj({
      label: s("Nombre del nivel, p.ej. 'Habitación compartida'"),
      amount: s("Solo el número, p.ej. '15,000'"),
    })),
    // ── PORTADA (hero a sangre con foto) ──
    hero: obj({
      eyebrow: s("'Tipo de experiencia · Lugar', p.ej. 'Recolección de hongos · Edo. de México'"),
      metaEst: s("Referencia geográfica corta, p.ej. 'Bosque de Xalatlaco', 'Mar de Cortés'"),
      title: s("Título del hero SIN el remate, p.ej. 'El bosque', 'Ensenada'"),
      titleAccent: s("Remate en itálica naranja, con punto final, p.ej. 'de Xalatlaco.', 'de Muertos.'"),
      sub: s("Subtítulo de 1-2 líneas que sitúe la experiencia, evocador"),
    }),
    // ── LA EXPERIENCIA (resumen en 3 puntos) ──
    experiencia: obj({
      title: s("p.ej. 'Un día', 'Dos días'"),
      titleAccent: s("p.ej. 'en el bosque.', 'en el mar.'"),
      points: arr(s("EXACTAMENTE 3 puntos que resuman la experiencia, una línea cada uno")),
    }),
    // ── BLOQUE DESTACADO (declaración sobre foto oscura, método Caminante) ──
    statement: obj({
      eyebrowPre: s("Texto antes del separador, p.ej. 'Naturaleza', 'Meditaciones Numan'"),
      eyebrow: s("Texto después del separador, p.ej. 'el método Caminante'"),
      title: s("Frase-declaración, p.ej. 'Pon las manos'"),
      titleAccent: s("Remate itálico, p.ej. 'en la tierra.'"),
      body: s("2-3 líneas sobre la dimensión interior/método de la experiencia"),
      quote: s("Cita corta entre comillas tipográficas, si aplica"),
    }),
    // ── GUÍAS Y ALIADOS (una sección por guía/comunidad/grupo) ──
    guides: arr(obj({
      eyebrow: s("p.ej. 'Quién te guía', 'La comunidad', 'Aliados'"),
      title: s(),
      titleAccent: s(),
      subEyebrow: s("Credencial corta en naranja, p.ej. 'Micóloga · autora de …' — solo para perfiles de persona"),
      items: arr(obj({ name: s("Nombre"), role: s("Rol/qué aporta, corto") })),
      paragraphs: arr(s("Párrafos de perfil (solo si es UNA persona con bio; si es lista de aliados usa items)")),
      lead: s("Nota final opcional de la sección"),
    })),
    // ── ITINERARIO (tarjetas glass sobre foto oscura) ──
    itinerario: obj({
      title: s("p.ej. 'Un domingo', 'Cuatro'"),
      titleAccent: s("p.ej. 'completo.', 'días.'"),
      days: arr(obj({
        num: s("'01', '02'… solo si el viaje es de varios días; si es de UN día, cadena vacía"),
        lab: s("Etiqueta naranja: día ('Jueves · Llegada') o momento ('Amanecer')"),
        ttl: s("Título corto del bloque, p.ej. 'Encuentro' — solo experiencias de un día"),
        items: arr(s("Momentos; para horas usa **negrita**, p.ej. '**6:30** Meditación'")),
      })),
    }),
    // ── INVERSIÓN (tarjeta de tarifa) ──
    tariff: obj({
      title: s("p.ej. 'Un día,', 'Todo incluido.'"),
      titleAccent: s("p.ej. 'todo incluido.', 'Una sola tarifa.'"),
      lead: s("2 líneas sobre qué cubre la tarifa"),
      tier: s("Etiqueta del plan, p.ej. 'Camping · Tienda frente al mar'"),
      price: s("Precio CON signo y comas, p.ej. '$18,560'"),
      priceCur: s("p.ej. 'MXN · todo incluido'"),
      availK: s("Etiqueta del dato de la tarjeta, p.ej. 'Cupo', 'IVA incluido'"),
      availV: s("Valor, p.ej. '17 personas', '16 lugares'"),
    }),
    // ── INCLUYE / NO INCLUYE (o buenas prácticas) ──
    checklist: obj({
      eyebrow: s("p.ej. 'Qué incluye', 'Antes de venir'"),
      title: s("p.ej. 'Lo que'"),
      titleAccent: s("p.ej. 'va contigo.'"),
      yesItems: arr(s("Qué incluye, una línea cada uno")),
      noTitle: s("'No incluye' o 'Buenas prácticas' según el material"),
      noItems: arr(s()),
      noMark: s("'−' para no-incluye, '·' para buenas prácticas"),
    }),
    // ── FAQ (opcional) ──
    faq: arr(obj({ q: s(), a: s() })),
    // ── MOCHILA (qué llevar) ──
    packing: obj({
      cap: s("Una línea, p.ej. 'Lo esencial para un día de montaña, lluvia y lodo.'"),
      items: arr(s("Cosas que traer, cortas, una por línea")),
    }),
    // ── PRÓXIMAS FECHAS (solo el copy; las tarjetas salen de la BD) ──
    dates: obj({
      title: s("p.ej. 'Elige tu'"),
      titleAccent: s("p.ej. 'domingo.', 'salida.'"),
      cap: s("p.ej. 'Mismo bosque, misma jornada — elige tu salida.'"),
      priceLine: s("p.ej. '**$2,550 MXN** · todo incluido · cupo 17 personas'"),
    }),
    // ── deslinde + encuesta ──
    waiverClauses: arr(s("Resumen de cláusulas del deslinde, una línea cada una")),
    feedbackLocationLabel: s("'Lugar, Estado' para la encuesta"),
    feedbackSections: arr(obj({ key: s("kebab-case"), label: s(), icon: s("UN emoji que represente la sección, p.ej. '🍄', '🥾', '🍳'"), prompt: s() })),
  }),
  slots: arr(obj({
    label: s("Como se muestra al cliente, p.ej. 'Domingo 24 ago' o 'Ago 14–17'"),
    startDate: s("YYYY-MM-DD"),
    endDate: s("YYYY-MM-DD, igual al inicio si es de un día"),
    capacity: s("número de cupos o cadena vacía"),
  })),
  notas: s("Qué NO pudiste llenar por falta de información y qué asumiste. Breve, en español."),
});

const SISTEMA = `Eres el editor de contenido de Caminante, la marca de experiencias en naturaleza de NUMAN (México). Tu tarea: leer los documentos del operador (itinerarios, brochures, notas) y pre-llenar la página de una experiencia en el diseño editorial de la marca.

Voz de la marca: "científico-poeta" — precisa en los datos, evocadora en el lenguaje. Trato de "tú". Español mexicano. Sin emojis en el contenido (única excepción: el campo icon de feedbackSections, que ES un emoji).

La página tiene estas secciones, en este orden: PORTADA (hero con foto a sangre) → LA EXPERIENCIA (3 puntos + mosaico) → BLOQUE DESTACADO (declaración del método sobre foto oscura, opcional) → GUÍAS Y ALIADOS (una sección por guía/comunidad/grupo) → ITINERARIO (tarjetas por día o por momento del día) → INVERSIÓN (tarjeta de tarifa) → INCLUYE/NO INCLUYE → FAQ (opcional) → MOCHILA → PRÓXIMAS FECHAS → CIERRE. Estudia el patrón de títulos: siempre "título corto" + "remate en itálica con punto final" (p.ej. "Un día" + "en el bosque.").

Reglas duras:
- USA SOLO la información de los documentos para datos duros (precios, horarios, fechas, cupos, qué incluye). No inventes datos logísticos.
- Para el copy editorial (títulos, subtítulos, leads, el bloque destacado) sí puedes redactar en voz de marca a partir de lo que los documentos cuentan del lugar.
- El copy NO debe llevar fechas ni conteos de salidas dentro de los textos (regla del sitio: las fechas viven solo en las salidas/slots). Excepciones: cardPloc y dates.priceLine/tariff (que llevan precio/cupo).
- Si un dato no aparece en los documentos, devuelve cadena vacía o lista vacía y explícalo en "notas".
- GUÍAS: si el material presenta a UNA persona con biografía, usa paragraphs (2 párrafos de perfil) + subEyebrow con su credencial; si es una lista de aliados/comunidad, usa items (name + role). Puedes devolver varias guides (p.ej. la guía principal, la comunidad, "qué vas a encontrar").
- ITINERARIO: viaje de varios días → num "01","02"… y lab "Jueves · Llegada"; experiencia de UN día → num vacío, lab = momento ("Amanecer","Mañana","Mediodía","Tarde") y ttl corto.
- PRECIOS: si el material trae varios precios (tipo de habitación, categoría, etc.), pon cada uno en priceTiers (label + monto) y usa el MÁS BAJO como price.amount. Si hay un solo precio, deja priceTiers vacío.
- FECHAS de salidas: llénalas SOLO si el documento da una fecha concreta (día y mes). Si solo dice una temporada o "por confirmar", deja slots VACÍO y dilo en notas — NO inventes una fecha.`;

type BloqueContenido =
  | { type: "document"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "text"; text: string };

export async function prellenarExperiencia(
  archivos: ArchivoEntrada[],
  notasUsuario: string,
): Promise<{ ok: true; result: PrellenadoIA } | { ok: false; error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Falta configurar ANTHROPIC_API_KEY (Vercel y .env.local)." };
  }

  const bloques: BloqueContenido[] = [];
  for (const a of archivos) {
    if (a.mediaType === "application/pdf" && a.base64) {
      bloques.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: a.base64 } });
    } else if (a.mediaType.startsWith("image/") && a.base64) {
      bloques.push({ type: "image", source: { type: "base64", media_type: a.mediaType, data: a.base64 } });
    } else if (a.text) {
      bloques.push({ type: "text", text: `--- Documento: ${a.name} ---\n${a.text}` });
    }
  }
  bloques.push({
    type: "text",
    text:
      `Pre-llena el formulario de la experiencia a partir de estos documentos.` +
      (notasUsuario.trim() ? `\n\nIndicaciones del admin:\n${notasUsuario.trim()}` : "") +
      `\n\nHoy es ${new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City" })}.`,
  });

  const res = await fetch(API, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      // NOTA: sin output_config.format — el esquema completo del form excede el
      // límite de la gramática compilada de salidas estructuradas ("compiled
      // grammar is too large", visto 5 jul). El esquema viaja en el system y el
      // parseo de abajo es tolerante; aplicar-prellenado ignora lo que falte.
      output_config: { effort: "medium" },
      system:
        SISTEMA +
        "\n\nRESPONDE ÚNICAMENTE con un objeto JSON válido — sin markdown, sin ```, sin texto antes ni después — que cumpla EXACTAMENTE este JSON Schema (todas las claves presentes; lo que no sepas va como cadena o lista vacía):\n" +
        JSON.stringify(ESQUEMA),
      messages: [{ role: "user", content: bloques }],
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json?.error?.message || `HTTP ${res.status}`;
    return { ok: false, error: `La IA no pudo procesar los documentos: ${msg}` };
  }
  if (json?.stop_reason === "refusal") {
    return { ok: false, error: "La IA declinó procesar estos documentos. Intenta con otros archivos." };
  }

  const texto = (json?.content || []).find(
    (b: { type: string; text?: string }) => b.type === "text",
  )?.text as string | undefined;
  if (!texto) return { ok: false, error: "La IA no devolvió contenido. Intenta de nuevo." };

  // Parseo tolerante: del primer "{" al último "}" (por si el modelo agrega
  // texto o cercas de markdown a pesar de la instrucción).
  const ini = texto.indexOf("{");
  const fin = texto.lastIndexOf("}");
  if (ini === -1 || fin <= ini) {
    return { ok: false, error: "La respuesta de la IA no se pudo leer. Intenta de nuevo." };
  }
  try {
    const parsed = JSON.parse(texto.slice(ini, fin + 1)) as PrellenadoIA;
    return {
      ok: true,
      result: {
        data: parsed.data ?? {},
        slots: Array.isArray(parsed.slots) ? parsed.slots : [],
        notas: typeof parsed.notas === "string" ? parsed.notas : "",
      },
    };
  } catch {
    return { ok: false, error: "La respuesta de la IA no se pudo leer. Intenta de nuevo." };
  }
}
