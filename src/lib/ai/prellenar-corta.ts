// LA IA LEE EL FLYER PARA EL ALTA RÁPIDA (23 nov 2026).
//
// Hermana corta de `prellenar.ts`. Aquélla redacta la página entera (134
// campos, uno a tres minutos, sin salida estructurada porque su esquema no
// cabe); ésta saca los 16 datos que pide el alta rápida, con salida
// estructurada y poco razonamiento: es una lectura, no una redacción.
//
// Devuelve texto crudo. Quien decide qué entra al formulario es
// `lib/experiences/prellenado-corta.ts`, que es puro y tiene sus pruebas.

import { ACTIVIDADES } from "@/lib/operadores/actividades";
import { EXIGENCIA } from "@/lib/experiences/corta";
import type { CortaDeIA } from "@/lib/experiences/prellenado-corta";
import { API_IA, MODELO_IA, type ArchivoEntrada } from "./prellenar";

const s = (description: string) => ({ type: "string", description });
const lista = (description: string) => ({ type: "array", items: { type: "string" }, description });

const CAMPOS = {
  titulo: s("Nombre de la experiencia como lo pone el material. Sin fecha, sin precio."),
  lugar: s("Dónde es, como se le diría a un invitado: 'Paso de Cortés, Amecameca'."),
  estado: s("Nombre oficial del estado de la República, p. ej. 'Estado de México'. Vacío si no se sabe."),
  actividad: { type: "string", enum: [...ACTIVIDADES.map((a) => a.slug), ""], description: "Slug de la actividad PRINCIPAL, de la lista del system. Vacío si ninguna aplica con claridad." },
  descripcion: s("Uno o dos párrafos (separados por una línea en blanco) con lo que el material cuenta: qué se hace y qué se ve. Sin fechas, precios, cupos ni temporada."),
  incluye: lista("Qué incluye, una cosa por elemento, corta. Lista vacía si el material no lo dice."),
  noIncluye: lista("Qué NO incluye, una cosa por elemento. Lista vacía si el material no lo dice."),
  horaInicio: s("Hora en que empieza, HH:MM en 24 horas. Vacío si no viene."),
  horaTermino: s("Hora en que termina (en viajes de varios días, la del último día), HH:MM. Vacío si no viene."),
  exigencia: { type: "string", enum: [...Object.keys(EXIGENCIA), ""], description: "Qué tanto exige. Sólo si el material lo dice o lo deja inequívoco; si no, vacío." },
  edadMinima: s("Edad mínima en años, sólo dígitos. Vacío si el material no la menciona."),
  precio: s("Precio por persona en pesos mexicanos, sólo dígitos. Si hay varios, el más bajo. Vacío si no viene o si está en otra moneda."),
  cupo: s("Cuántas personas caben, sólo dígitos. Vacío si no viene."),
  fechaInicio: s("Primera salida futura, AAAA-MM-DD. Vacío si el material no trae fecha."),
  fechaFin: s("Último día de esa salida, AAAA-MM-DD. Vacío si es de un solo día."),
  puntoEncuentro: s("Dónde se reúne el grupo para esa salida. Vacío si no viene."),
  notas: s("Una o dos frases: qué no encontraste y qué supusiste (p. ej. cuál precio tomaste si había varios)."),
};

const ESQUEMA = {
  type: "object",
  properties: CAMPOS,
  required: Object.keys(CAMPOS),
  additionalProperties: false,
};

const SISTEMA = `Lees el flyer, el itinerario o el texto de una operadora de turismo de naturaleza en México y llenas un formulario corto para dar de alta su experiencia.

REGLAS
1. Sólo lo que el material DICE. Lo que no esté, cadena vacía o lista vacía. No inventes precios, horarios, edades, cupos, fechas ni lugares, y no completes con lo que «suele ser».
2. Escribe en español claro, con las palabras del material. Nada de signos de admiración de anuncio ni frases de venta que el material no traiga.
3. La descripción no lleva fechas, precios, número de lugares ni temporada: eso va en sus propios campos.
4. Precio: por persona, en pesos. Si el material trae varios (por habitación, por categoría), usa el más bajo y dilo en notas. Si está en dólares u otra moneda, déjalo vacío y dilo en notas.
5. Fechas: sólo la PRIMERA salida que todavía no ocurre. Si el material no trae año, usa el de la próxima vez que caiga esa fecha contando desde hoy, y dilo en notas.
6. Exigencia, sólo si el material lo dice o lo deja inequívoco:
${Object.entries(EXIGENCIA).map(([k, v]) => `   - ${k}: ${v.detalle}`).join("\n")}
7. Actividad: el slug de la lista que describa la actividad PRINCIPAL. Si ninguna aplica con claridad, vacío.
${ACTIVIDADES.map((a) => `   - ${a.slug}: ${a.nombre}`).join("\n")}`;

type Bloque =
  | { type: "document"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "text"; text: string };

const hoyEnMexico = () =>
  new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City" });

async function pedir(apiKey: string, bloques: Bloque[], conFormato: boolean) {
  return fetch(API_IA, {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODELO_IA,
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      output_config: conFormato ? { effort: "low", format: { type: "json_schema", schema: ESQUEMA } } : { effort: "low" },
      system: conFormato
        ? SISTEMA
        : `${SISTEMA}\n\nRESPONDE ÚNICAMENTE con un objeto JSON válido, sin markdown ni texto alrededor, que cumpla este JSON Schema:\n${JSON.stringify(ESQUEMA)}`,
      messages: [{ role: "user", content: bloques }],
    }),
  });
}

export async function prellenarCorta(
  archivos: ArchivoEntrada[],
  textoPegado: string,
): Promise<{ ok: true; campos: CortaDeIA } | { ok: false; error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "El llenado con tu flyer no está disponible en este momento. Llena el formulario a mano." };

  const bloques: Bloque[] = [];
  for (const a of archivos) {
    if (a.mediaType === "application/pdf" && a.base64) {
      bloques.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: a.base64 } });
    } else if (a.mediaType.startsWith("image/") && a.base64) {
      bloques.push({ type: "image", source: { type: "base64", media_type: a.mediaType, data: a.base64 } });
    } else if (a.text) {
      bloques.push({ type: "text", text: `--- ${a.name} ---\n${a.text}` });
    }
  }
  if (textoPegado.trim()) bloques.push({ type: "text", text: `--- Texto de la operadora ---\n${textoPegado.trim()}` });
  bloques.push({ type: "text", text: `Llena el formulario con este material. Hoy es ${hoyEnMexico()}.` });

  // Primero con salida estructurada. Si la API rechaza el formato (400), se
  // reintenta UNA vez con el esquema en el system y parseo tolerante, igual
  // que el pre-llenado largo: un formulario que no se llena solo no puede ser
  // peor que uno que nunca ofreció llenarse.
  let res = await pedir(apiKey, bloques, true);
  if (res.status === 400) res = await pedir(apiKey, bloques, false);

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    console.error("prellenarCorta:", res.status, json?.error?.message);
    return { ok: false, error: "No pudimos leer tu material. Inténtalo de nuevo o llena el formulario a mano." };
  }
  if (json?.stop_reason === "refusal") {
    return { ok: false, error: "No pudimos leer ese archivo. Prueba con otro, o pega el texto." };
  }
  const texto = (json?.content || []).find((b: { type: string; text?: string }) => b.type === "text")?.text as string | undefined;
  const ini = texto?.indexOf("{") ?? -1;
  const fin = texto?.lastIndexOf("}") ?? -1;
  if (!texto || ini === -1 || fin <= ini) return { ok: false, error: "No pudimos leer tu material. Inténtalo de nuevo." };
  try {
    return { ok: true, campos: JSON.parse(texto.slice(ini, fin + 1)) as CortaDeIA };
  } catch {
    return { ok: false, error: "No pudimos leer tu material. Inténtalo de nuevo." };
  }
}
