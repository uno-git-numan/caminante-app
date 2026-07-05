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
    // hero / identidad
    title: s("Título principal corto, en MAYÚSCULAS estilizadas, p.ej. 'OCEAN'"),
    titleAccent: s("Remate en itálica, minúsculas con punto, p.ej. 'safari.'"),
    subtitle: s(),
    brandSmall: s("Nombre corto de la experiencia, p.ej. 'Ocean Safari'"),
    vol: s("'Vol. NN · Mes Año' — usa el mes de la primera salida"),
    coords: s("Coordenadas del lugar, p.ej. '23°59′N · 109°50′W'"),
    // estado: SIN enum (los 33 valores inflaban la gramática compilada y la API
    // la rechaza por tamaño). La descripción empuja al nombre oficial y
    // normalizarEstado (aplicar-prellenado) corrige variantes o deja vacío.
    estado: s("Nombre completo oficial del estado, p.ej. 'Estado de México', 'Baja California Sur'"),
    // card / calendario
    cardTitle: s(),
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
    // contexto (CAP 01). 'no' NO se pide: se estampa por índice en el código.
    contextTitle: s(),
    contextTitleAccent: s(),
    contextLead: s(),
    context: arr(obj({ title: s(), sub: s(), body: s() })),
    // cuatro caras. caraNo NO se pide: se estampa por índice.
    carasIntro: s(),
    lenses: arr(obj({
      key: { type: "string", enum: ["naturaleza", "conservacion", "comunidades", "problemas"] },
      label: s(),
      title: s(),
      body: s(),
      facts: arr(obj({ n: s("dato/número"), l: s("etiqueta") })),
    })),
    // la experiencia (CAP 02). num NO se pide: se estampa por índice.
    vivirTitle: s(),
    vivirTitleAccent: s(),
    vivirLead: s(),
    expIntro: s(),
    vivir: arr(obj({ pill: s("etiqueta corta"), title: s(), body: s() })),
    // aliados (CAP 03)
    aliadosLead: s(),
    aliados: arr(obj({ role: s(), name: s(), body: s(), peopleLabel: s(), people: s() })),
    // itinerario (CAP 04). dno NO se pide: se estampa por índice ('Día 01').
    itinerarioLead: s(),
    itinerario: arr(obj({
      dname: s("nombre del día, p.ej. 'Bosque + Hacienda'"),
      beats: arr(obj({ t: s("hora, p.ej. '07:30'"), d: s("descripción") })),
    })),
    // impacto (CAP 05)
    impactoBody: arr(s()),
    impactoLabel: s(),
    // paquete (CAP 06)
    paqueteLead: s(),
    incluye: arr(s()),
    noIncluye: arr(s()),
    // mochila (CAP 07)
    mochilaLead: s(),
    mochila: arr(obj({
      title: s("categoría, p.ej. 'Ropa'"),
      items: arr(obj({ text: s(), req: s("'Indispensable' | 'Recomendado' | ''"), must: { type: "boolean" } })),
    })),
    mochilaNote: s(),
    // práctico (CAP 08)
    practicoLead: s(),
    cancelacion: arr(obj({ label: s("p.ej. '30+ días antes'"), val: s("p.ej. 'Reembolso 100%'") })),
    faq: arr(obj({ q: s(), a: s() })),
    // reserva (CAP 09)
    reservaNote: s(),
    datesBadge: obj({ label: s("'Próximas salidas'"), big: s("p.ej. 'AGO 24'"), rest: s("resto de fechas") }),
    // deslinde + encuesta
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

const SISTEMA = `Eres el editor de contenido de Caminante, la marca de experiencias en naturaleza de NUMAN (México). Tu tarea: leer los documentos del operador (itinerarios, brochures, notas) y pre-llenar el formulario de una experiencia.

Voz de la marca: "científico-poeta" — precisa en los datos, evocadora en el lenguaje. Trato de "tú". Español mexicano. Sin emojis en el contenido (única excepción: el campo icon de feedbackSections, que ES un emoji). Cada experiencia se cuenta a través de cuatro caras: Naturaleza, Conservación, Comunidades y Problemas (los retos ambientales/sociales del lugar).

Reglas duras:
- USA SOLO la información de los documentos para datos duros (precios, horarios, fechas, cupos, qué incluye). No inventes datos logísticos.
- Para el copy editorial (leads, contexto, caras) sí puedes redactar en voz de marca a partir de lo que los documentos cuentan del lugar.
- El copy NO debe llevar fechas ni conteos dentro de los textos (regla del sitio: las fechas viven solo en las salidas/slots). Excepciones: vol, cardPloc y datesBadge, que sí llevan mes/fechas.
- Si un dato no aparece en los documentos, devuelve cadena vacía o lista vacía y explícalo en "notas".
- Las 4 lenses siempre en el orden: naturaleza, conservacion, comunidades, problemas.
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
