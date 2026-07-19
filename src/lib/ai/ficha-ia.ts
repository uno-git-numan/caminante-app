// Extracción con IA de la FICHA CIENTÍFICA (serie E del kit) desde los PDFs /
// imágenes / texto del admin. Calcada del patrón de prellenar.ts: HTTP directo
// a la API, esquema espejo de Experience.ficha en el system (mismo camino
// probado del pre-llenado; la gramática compilada de salidas estructuradas ya
// nos falló con esquemas en este repo — "compiled grammar is too large", 5 jul),
// parseo tolerante. REGLA DURA: fuente OBLIGATORIA por dato (nombre del
// documento y página si es visible); un dato sin fuente en los documentos NO se
// incluye. Faltantes → arrays vacíos. JAMÁS se inventa.
import type { ArchivoEntrada } from "@/lib/ai/prellenar";
import type { Experience } from "@/lib/experiences/types";

const MODEL = "claude-opus-4-8";
const API = "https://api.anthropic.com/v1/messages";

export type FichaIA = NonNullable<Experience["ficha"]> & { notas?: string };

// Esquema espejo de Experience.ficha — viaja en el system (ver nota arriba).
const ESQUEMA = {
  type: "object",
  additionalProperties: false,
  required: ["especies", "datos", "glosario", "temporada", "notas"],
  properties: {
    especies: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["comun", "cientifico", "datos"],
        properties: {
          comun: { type: "string", description: "nombre común de la especie" },
          cientifico: { type: "string", description: "nombre científico (vacío si no aparece en los documentos)" },
          datos: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["texto", "fuente"],
              properties: {
                texto: { type: "string", description: "un dato verificable sobre la especie, 1 frase" },
                fuente: { type: "string", description: "OBLIGATORIA: nombre del documento y página, ej. 'Guía de hongos.pdf, p. 12'" },
              },
            },
          },
        },
      },
    },
    datos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["n", "texto", "fuente", "cara"],
        properties: {
          n: { type: "string", description: "la cifra sola si el dato la tiene (ej. '900', '3,600 m'); vacío si no" },
          texto: { type: "string", description: "el dato en 1 frase (sin la cifra si va en n)" },
          fuente: { type: "string", description: "OBLIGATORIA: documento y página" },
          cara: { type: "string", enum: ["biologia", "conservacion", "comunidades", "problemas", ""], description: "cara del dato" },
        },
      },
    },
    glosario: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["termino", "def"],
        properties: {
          termino: { type: "string" },
          def: { type: "string", description: "definición breve en voz de marca, 1-2 frases" },
        },
      },
    },
    temporada: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["epoca", "fenomeno", "fuente"],
        properties: {
          epoca: { type: "string", description: "ej. 'Julio–septiembre'" },
          fenomeno: { type: "string", description: "qué pasa en el ecosistema en esa época" },
          fuente: { type: "string", description: "documento y página; vacío solo si el fenómeno es de conocimiento general evidente en los docs" },
        },
      },
    },
    notas: { type: "string", description: "qué NO pudiste extraer o qué requiere revisión del admin" },
  },
};

const SISTEMA = `Eres el biólogo-editor de Caminante (experiencias en naturaleza con ciencia real, México). Extraes la FICHA CIENTÍFICA de una experiencia a partir de los documentos del admin (guías de campo, papers, folletos, notas).

Voz "científico-poeta": dato preciso, redacción limpia, sin adornos vacíos. Español mexicano. SIN emojis.

REGLAS DURAS:
1. FUENTE OBLIGATORIA: cada dato (en especies.datos, datos y temporada) lleva su fuente = nombre del documento + página si es visible (ej. "Guía de hongos.pdf, p. 12"). Si un dato NO tiene respaldo en los documentos, NO lo incluyas.
2. JAMÁS INVENTES: nombres científicos, cifras, temporadas o definiciones que no estén en los documentos. Lo que falte → arreglo vacío y repórtalo en "notas".
3. NO copies párrafos: extrae y redacta cada dato en 1 frase propia, fiel al documento.
4. Glosario: solo términos que un viajero no experto no conocería y que aparecen en los documentos.
5. VOCABULARIO PROHIBIDO: meditación, mindfulness, yoga, wellness, terapia, sanar, energía (mística), vibras, "mágico", superlativos vacíos.`;

type BloqueContenido =
  | { type: "document"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "text"; text: string };

export async function extraerFicha(
  archivos: ArchivoEntrada[],
  notasUsuario: string,
): Promise<{ ok: true; result: FichaIA } | { ok: false; error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "Falta configurar ANTHROPIC_API_KEY (Vercel y .env.local)." };

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
      `Extrae la ficha científica de la experiencia a partir de estos documentos.` +
      (notasUsuario.trim() ? `\n\nIndicaciones del admin:\n${notasUsuario.trim()}` : ""),
  });

  let res: Response;
  try {
    res = await fetch(API, {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 12000,
        thinking: { type: "adaptive" },
        output_config: { effort: "medium" },
        system:
          SISTEMA +
          "\n\nRESPONDE ÚNICAMENTE con un objeto JSON válido — sin markdown, sin ```, sin texto antes ni después — que cumpla EXACTAMENTE este JSON Schema (todas las claves presentes; lo que no sepas va como arreglo vacío):\n" +
          JSON.stringify(ESQUEMA),
        messages: [{ role: "user", content: bloques }],
      }),
    });
  } catch (e) {
    return { ok: false, error: `No se pudo llamar a la IA: ${(e as Error).message}` };
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json?.error?.message || `HTTP ${res.status}`;
    return { ok: false, error: `La IA no pudo procesar los documentos: ${msg}` };
  }
  if (json?.stop_reason === "refusal") {
    return { ok: false, error: "La IA declinó procesar estos documentos. Intenta con otros archivos." };
  }

  const texto = (json?.content || []).find((b: { type: string; text?: string }) => b.type === "text")?.text as
    | string
    | undefined;
  if (!texto) return { ok: false, error: "La IA no devolvió contenido. Intenta de nuevo." };

  const ini = texto.indexOf("{");
  const fin = texto.lastIndexOf("}");
  if (ini === -1 || fin <= ini) return { ok: false, error: "La respuesta de la IA no se pudo leer. Intenta de nuevo." };
  try {
    const p = JSON.parse(texto.slice(ini, fin + 1)) as FichaIA;
    return {
      ok: true,
      result: {
        especies: Array.isArray(p.especies) ? p.especies : [],
        datos: Array.isArray(p.datos) ? p.datos : [],
        glosario: Array.isArray(p.glosario) ? p.glosario : [],
        temporada: Array.isArray(p.temporada) ? p.temporada : [],
        notas: typeof p.notas === "string" ? p.notas : "",
      },
    };
  } catch {
    return { ok: false, error: "La respuesta de la IA no se pudo leer. Intenta de nuevo." };
  }
}
