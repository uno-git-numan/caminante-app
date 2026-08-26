// FUSIÓN DEL DESLINDE (y la encuesta) DEL OPERADOR CON EL NUESTRO.
//
// Casi todo operador serio ya tiene su carta de deslinde: la escribió alguien
// que conoce SU terreno —el cañón, el glaciar, el buceo— y muchas veces cubre
// riesgos que nuestro documento genérico ni menciona. Descartarla y quedarnos
// con la nuestra sería tirar la mejor parte; adoptarla tal cual dejaría fuera el
// marco que protege a la plataforma. Se fusionan.
//
// LA REGLA, tal como la fijó Luis, y en este orden:
//
//   1. Si una cláusula existe en las DOS (dicen lo mismo) → se queda **la
//      suya**. Es su experiencia y su redacción; conocen su riesgo mejor que
//      nosotros, y ver su propio texto es lo que hace que la firmen sin fricción.
//   2. Si la tenemos nosotros y ellos no → **se queda la nuestra**. Nada se
//      pierde por fusionar: el resultado siempre cubre al menos lo que cubría.
//   3. Si la tienen ellos y nosotros no → **se agrega la suya**. Ahí está el
//      valor: los riesgos específicos que su oficio conoce.
//
// O sea: la fusión es una UNIÓN, nunca una intersección. El documento final no
// puede tener menos cobertura que cualquiera de los dos de entrada. Si alguna
// vez sale una lista más corta que la que entró, es un bug.
//
// ⚠️ LO QUE ESTA FUSIÓN NO HACE, a propósito: resolver CONTRADICCIONES. Si su
// carta dice «el operador provee seguro de gastos médicos» y la nuestra dice que
// no lo provee, no hay fusión posible — hay una decisión de negocio y de riesgo
// legal. Esos casos salen en `conflictos` para que una persona los lea. Un
// modelo eligiendo en silencio cuál de dos cláusulas contradictorias gana es
// exactamente la clase de ayuda que nadie pidió.
//
// El marco legal genérico (secciones E–J de `deslinde-doc.ts`: quién es el
// Organizador, el límite de responsabilidad al monto pagado, datos personales,
// aceptación electrónica) NO entra a la fusión. No describe la actividad: define
// quién responde ante quién, y eso no lo redefine el documento de un tercero.

import { DESLINDE_MAESTRO } from "@/lib/legal/deslinde-maestro";
import type { Clausula } from "@/lib/legal/clausulas";
import type { ArchivoEntrada } from "@/lib/ai/prellenar";

const MODEL = "claude-opus-4-8";
const API = "https://api.anthropic.com/v1/messages";

export type SeccionEncuesta = { key: string; label: string; icon?: string; prompt?: string };

export type ResultadoFusion = {
  clausulas: Clausula[];
  secciones: SeccionEncuesta[];
  /** Qué hizo, en prosa corta y legible. */
  notas: string;
  /** Contradicciones entre su carta y la nuestra. Las resuelve una persona. */
  conflictos: string[];
};

const SISTEMA = `Eres abogado especialista en documentos de responsabilidad para experiencias de aventura y naturaleza en México, trabajando para Caminante (plataforma de NUMAN HUB, S.A. de C.V.).

Un OPERADOR externo va a vender su experiencia por la plataforma. Ya trae su propia carta de deslinde —y a veces su propia encuesta de satisfacción— y nosotros tenemos las nuestras. Tu trabajo es FUSIONARLAS en una sola lista de cláusulas-resumen.

REGLA DE FUSIÓN (obligatoria, en este orden):
1. Cláusula que existe en AMBOS documentos (cubren el mismo riesgo o la misma obligación, aunque estén redactadas distinto): CONSERVA LA DEL OPERADOR, con su redacción. Origen: "operador". Si la suya cubre lo mismo pero le falta un matiz importante de la nuestra, incorpora ese matiz a la redacción de ellos y marca origen "fusion".
2. Cláusula que solo tenemos NOSOTROS: consérvala tal cual. Origen: "casa".
3. Cláusula que solo tienen ELLOS: agrégala. Origen: "operador".

La lista resultante es una UNIÓN. NUNCA debe cubrir menos que cualquiera de los dos documentos de entrada. No consolides dos riesgos distintos en una sola viñeta para acortar la lista.

OBLIGATORIA vs OPCIONAL — marca cada cláusula:
- obligatoria = true para todo lo que el participante debe aceptar para poder participar: declaraciones bajo protesta de decir verdad, reconocimiento de riesgos, compromisos de conducta y seguridad, seguro propio a su cargo, liberación de responsabilidad, tratamiento de datos personales necesarios para operar, aceptación electrónica.
- obligatoria = false SOLO para lo que el documento plantea como una ELECCIÓN real del participante, donde decir que no NO le impide participar: autorización de uso de imagen, recibir comunicaciones o boletín, compartir testimonio. Si dudas, va como obligatoria.

CONFLICTOS — repórtalos en "conflictos", NO los resuelvas:
- Cláusulas de los dos documentos que se CONTRADICEN (ej. su carta afirma que el operador provee seguro de gastos médicos y la nuestra declara que no se provee; o límites de responsabilidad distintos; o una jurisdicción distinta).
- Cláusulas suyas que le imponen obligaciones a Caminante/NUMAN HUB, o que nombran a otra empresa como el organizador responsable.
- Cláusulas suyas que parezcan contrarias a la ley mexicana aplicable o a la LFPDPPP.
Describe cada conflicto en una frase clara, en español, diciendo qué dice cada documento. No elijas ganador.

REDACCIÓN de cada cláusula-resumen: una idea por viñeta, corta, clara, trato de "tú", sin jerga legal innecesaria. Esto es lo que el participante lee antes de firmar; el documento completo se enlaza aparte. No pongas RFC ni nombres fiscales en las viñetas. Sin emojis.

ENCUESTA: si el operador subió su encuesta de satisfacción, fusiona sus categorías con las nuestras con la MISMA regla (misma categoría en ambos → la suya; solo nuestra → se queda; solo suya → se agrega). Cada categoría lleva key en kebab-case, label corto y un emoji en icon. Si no subió encuesta, devuelve la lista de categorías actuales sin cambios.

Si los documentos que te dan no son un deslinde ni una encuesta (por ejemplo, es solo el itinerario), NO inventes cláusulas: devuelve las actuales sin cambios y dilo en "notas".`;

type Bloque =
  | { type: "document"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "text"; text: string };

function bloquesDe(archivos: ArchivoEntrada[]): Bloque[] {
  const out: Bloque[] = [];
  for (const a of archivos) {
    if (a.mediaType === "application/pdf" && a.base64) {
      out.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: a.base64 } });
    } else if (a.mediaType.startsWith("image/") && a.base64) {
      out.push({ type: "image", source: { type: "base64", media_type: a.mediaType, data: a.base64 } });
    } else if (a.text) {
      out.push({ type: "text", text: `--- Documento del operador: ${a.name} ---\n${a.text}` });
    }
  }
  return out;
}

export async function fusionarDeslinde(args: {
  archivos: ArchivoEntrada[];
  /** Texto pegado a mano (sirve cuando el PDF pesa más que el techo de Vercel). */
  textoPegado?: string;
  clausulasActuales: Clausula[];
  seccionesActuales: SeccionEncuesta[];
  /** Para adaptar riesgos: nombre y una línea de qué es la experiencia. */
  contextoExperiencia?: string;
}): Promise<{ ok: true; result: ResultadoFusion } | { ok: false; error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "Falta configurar ANTHROPIC_API_KEY (Vercel y .env.local)." };

  const bloques = bloquesDe(args.archivos);
  const pegado = (args.textoPegado || "").trim();
  if (!bloques.length && !pegado) {
    return { ok: false, error: "No hay documento que fusionar. Sube el PDF o pega el texto de tu deslinde." };
  }
  if (pegado) {
    bloques.push({ type: "text", text: `--- Documento del operador (texto pegado) ---\n${pegado}` });
  }

  bloques.push({
    type: "text",
    text:
      `Fusiona el deslinde del operador con el nuestro, siguiendo la regla del system.\n\n` +
      (args.contextoExperiencia ? `EXPERIENCIA: ${args.contextoExperiencia}\n\n` : "") +
      `=== NUESTRAS CLÁUSULAS ACTUALES (${args.clausulasActuales.length}) ===\n` +
      (args.clausulasActuales.length
        ? args.clausulasActuales
            .map((c, i) => `${i + 1}. [${c.obligatoria ? "obligatoria" : "opcional"}] ${c.texto}`)
            .join("\n")
        : "(ninguna todavía — la lista final sale solo de su documento y del marco maestro)") +
      `\n\n=== NUESTRAS CATEGORÍAS DE ENCUESTA ACTUALES (${args.seccionesActuales.length}) ===\n` +
      (args.seccionesActuales.length
        ? args.seccionesActuales.map((s) => `- ${s.icon || "◆"} ${s.label} (${s.key})`).join("\n")
        : "(ninguna todavía)") +
      `\n\n=== DOCUMENTO MAESTRO DEL DESLINDE DE CAMINANTE (referencia del marco legal) ===\n${DESLINDE_MAESTRO}\n=== FIN ===`,
  });

  const ESQUEMA = {
    type: "object",
    properties: {
      clausulas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            texto: { type: "string" },
            obligatoria: { type: "boolean" },
            origen: { type: "string", enum: ["casa", "operador", "fusion"] },
          },
          required: ["texto", "obligatoria", "origen"],
          additionalProperties: false,
        },
      },
      secciones: {
        type: "array",
        items: {
          type: "object",
          properties: { key: { type: "string" }, label: { type: "string" }, icon: { type: "string" }, prompt: { type: "string" } },
          required: ["key", "label", "icon", "prompt"],
          additionalProperties: false,
        },
      },
      notas: { type: "string" },
      conflictos: { type: "array", items: { type: "string" } },
    },
    required: ["clausulas", "secciones", "notas", "conflictos"],
    additionalProperties: false,
  };

  const res = await fetch(API, {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 12000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      system:
        SISTEMA +
        "\n\nRESPONDE ÚNICAMENTE con un objeto JSON válido — sin markdown, sin ```, sin texto antes ni después — que cumpla EXACTAMENTE este JSON Schema:\n" +
        JSON.stringify(ESQUEMA),
      messages: [{ role: "user", content: bloques }],
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, error: `La IA no pudo leer el documento: ${json?.error?.message || `HTTP ${res.status}`}` };
  }
  if (json?.stop_reason === "refusal") {
    return { ok: false, error: "La IA declinó procesar este documento. Intenta con otro archivo." };
  }

  const texto = (json?.content || []).find((b: { type: string; text?: string }) => b.type === "text")?.text as
    | string
    | undefined;
  if (!texto) return { ok: false, error: "La IA no devolvió contenido. Intenta de nuevo." };

  const ini = texto.indexOf("{");
  const fin = texto.lastIndexOf("}");
  if (ini === -1 || fin <= ini) return { ok: false, error: "La respuesta de la IA no se pudo leer. Intenta de nuevo." };

  let parsed: Partial<ResultadoFusion>;
  try {
    parsed = JSON.parse(texto.slice(ini, fin + 1));
  } catch {
    return { ok: false, error: "La respuesta de la IA no se pudo leer. Intenta de nuevo." };
  }

  const clausulas = Array.isArray(parsed.clausulas)
    ? parsed.clausulas
        .map((c) => ({
          texto: typeof c?.texto === "string" ? c.texto.trim() : "",
          obligatoria: c?.obligatoria !== false,
          origen: (["casa", "operador", "fusion"] as const).includes(c?.origen as never)
            ? (c.origen as Clausula["origen"])
            : "fusion",
        }))
        .filter((c) => c.texto)
    : [];

  // ⚠️ EL CANDADO DE LA UNIÓN. La regla dice que fusionar nunca quita cobertura,
  // así que una lista más corta que la que entró significa que el modelo
  // consolidó o descartó cláusulas nuestras — justo lo que la regla prohíbe.
  // Se rechaza en vez de guardar un deslinde con menos cobertura que el que ya
  // estaba, que es la única forma en que esto puede hacer daño de verdad.
  if (clausulas.length && clausulas.length < args.clausulasActuales.length) {
    return {
      ok: false,
      error:
        `La fusión devolvió ${clausulas.length} cláusulas y antes había ${args.clausulasActuales.length}. ` +
        `Fusionar nunca debe quitar cobertura, así que no se aplicó nada. Intenta de nuevo; si vuelve a pasar, revisa el documento a mano.`,
    };
  }
  if (!clausulas.length) {
    return { ok: false, error: "La IA no encontró cláusulas en el documento. ¿Es la carta de deslinde correcta?" };
  }

  const secciones = Array.isArray(parsed.secciones)
    ? parsed.secciones
        .map((s) => ({
          key: (s?.key || "").trim(),
          label: (s?.label || "").trim(),
          icon: (s?.icon || "").trim() || "◆",
          prompt: (s?.prompt || "").trim(),
        }))
        .filter((s) => s.label)
    : args.seccionesActuales;

  return {
    ok: true,
    result: {
      clausulas,
      secciones,
      notas: typeof parsed.notas === "string" ? parsed.notas : "",
      conflictos: Array.isArray(parsed.conflictos) ? parsed.conflictos.filter((c) => typeof c === "string" && c.trim()) : [],
    },
  };
}
