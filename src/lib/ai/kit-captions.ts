// Genera los captions del KIT DE COMUNICACIÓN en voz de marca ("científico-poeta"),
// siguiendo el playbook (00-PLAYBOOK.md). UNA sola llamada a la API devuelve el
// caption de TODAS las piezas listas (hook + caption + hashtags + CTA por pieza).
// Reusa el patrón de prellenar.ts (HTTP directo, esquema en el system, parseo
// tolerante). CERO datos inventados: si falta un dato, se omite.
import type { Experience, PageBlock, V2Hero, V2Statement, V2Tariff, V2Itinerary, V2Split } from "@/lib/experiences/types";
import type { PieceDef, KitContext } from "@/lib/kit/kit";
import { expName } from "@/lib/kit/kit";

const MODEL = "claude-opus-4-8";
const API = "https://api.anthropic.com/v1/messages";

export type KitCaption = { hook: string; caption: string; hashtags: string[]; cta: string };
export type KitCaptions = Record<string, KitCaption>;

const clean = (s?: string) => (s || "").replace(/\*\*/g, "").replace(/\*/g, "").trim();

// Resumen compacto de la experiencia (materia prima para los captions).
function resumen(ctx: KitContext): string {
  const b = ctx.blocks;
  const hero = b.find((x) => x.type === "hero") as V2Hero | undefined;
  const st = b.find((x) => x.type === "statement") as V2Statement | undefined;
  const tf = b.find((x) => x.type === "tariff") as V2Tariff | undefined;
  const it = b.find((x) => x.type === "itinerary") as V2Itinerary | undefined;
  const xp = (b.filter((x) => x.type === "split") as V2Split[]).find((s) => s.anchor === "experiencia");
  const lines: string[] = [];
  lines.push(`Experiencia: ${expName(ctx.exp)} (${clean(hero?.eyebrow)})`);
  if (ctx.exp.estado) lines.push(`Estado: ${ctx.exp.estado}`);
  if (hero?.metaEst) lines.push(`Lugar: ${clean(hero.metaEst)}`);
  if (hero?.sub) lines.push(`Subtítulo: ${clean(hero.sub)}`);
  if (xp?.points?.length) lines.push(`La experiencia en 3 puntos:\n- ${xp.points.map(clean).join("\n- ")}`);
  if (st?.body) lines.push(`Declaración: ${clean(st.body)}`);
  if (tf?.price) lines.push(`Precio: ${clean(tf.price)} ${clean(tf.priceCur)}`.trim());
  else if (ctx.exp.price?.amount) lines.push(`Precio: $${clean(ctx.exp.price.amount)} ${clean(ctx.exp.price.currency)}`.trim());
  if (it?.days?.length) lines.push(`Itinerario: ${it.days.length} ${it.days.length === 1 ? "jornada" : "bloques/días"}`);
  if (ctx.quotes.length) lines.push(`Testimonios disponibles: ${ctx.quotes.length}`);
  return lines.join("\n");
}

const SISTEMA = `Eres el redactor de redes de Caminante (experiencias en naturaleza con ciencia real, México). Voz "científico-poeta": dato preciso + belleza; el protagonista es el LUGAR y la ciencia, no el narrador. Español mexicano, trato de "tú", SIN emojis.

REGLA DE UNA FRASE: si una frase no tiene un dato concreto (metros, especies, km, grados, %) o un hecho verificable, no la escribas.

VOCABULARIO PROHIBIDO (jamás): meditación, mindfulness, yoga, wellness, terapia, sanar/sanación, energía (mística), vibra(s), conexión espiritual, gurú, "experiencia mágica/transformadora", superlativos vacíos.
PREFERIDO: ciencia, fisiología, paisaje, especie, ecosistema, conservación, comunidad, expedición, caminante, cuerpo, cifras concretas.

Cada pieza tiene un trabajo DISTINTO (te lo doy). El caption debe hacer SU trabajo — no repetir el de otra pieza. NO inventes datos (precios, fechas, cupos, especies); usa SOLO lo que te doy en el resumen. Si falta un dato, omítelo.

HASHTAGS (5–8 en total): SIEMPRE #Caminante #NaturalezaMexicana #TurismoDeConservación; agrega 1–2 por cara (Biología: #BiodiversidadMexicana #CienciaEnCampo · Conservación: #Conservación #ÁreasNaturalesProtegidas · Comunidades: #ComunidadesLocales #TurismoRegenerativo · Problemas: sin hashtag) y 1–3 por destino según el estado (BCS: #MarDeCortés #BajaCaliforniaSur #Ballenas · Estado de México: #BosquesDeMéxico #Hongos #Xalatlaco · Chihuahua: #BarrancasDelCobre #SierraTarahumara · Volcanes/Iztaccíhuatl: #VolcanesDeMéxico #Iztaccíhuatl). Nunca 30 genéricos.

CTA por momento: M1 (lanzamiento) = awareness, "link en bio"; M2 (venta) = a reservar; M3 (prueba) = próximas fechas / reservar; E (informativo) = suave («Guárdalo», «link en bio») o NINGUNO (deja "cta" vacío si la pieza lo pide).

SERIE E (catálogo informativo): piezas educativas ATEMPORALES — enseñan, no venden. Tono de guía de campo con belleza; el dato manda. JAMÁS vender duro ni mencionar precio/fechas/cupo. Puedes citar la fuente ABREVIADA entre paréntesis al final de una frase, ej. "(Guía de hongos, p. 12)". En E5 (comunidades) y E7 (problemas): sin CTA; respeto y honestidad, cero drama.

Para cada pieza devuelve: "hook" (primera línea que frena el scroll, ≤90 caracteres), "caption" (2–4 frases, el cuerpo, SIN hashtags), "hashtags" (arreglo de 5–8, cada uno con #), "cta" (la llamada a la acción, una línea).`;

export async function generateKitCaptions(
  ctx: KitContext,
  piezasListas: PieceDef[],
): Promise<{ ok: true; captions: KitCaptions } | { ok: false; error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "Falta ANTHROPIC_API_KEY." };
  if (!piezasListas.length) return { ok: true, captions: {} };

  const piezasTxt = piezasListas
    .map((p) => `- ${p.id} "${p.nombre}" [${p.momento}] cara:${p.cara} · trabajo: ${p.trabajo} · CTA sugerido: ${p.cta}`)
    .join("\n");
  const user =
    `RESUMEN DE LA EXPERIENCIA:\n${resumen(ctx)}\n\n` +
    `Link de la experiencia (bio): ${ctx.expUrl}\nLink de reserva: ${ctx.reservarUrl}\n\n` +
    `PIEZAS A REDACTAR (una entrada por id en el JSON):\n${piezasTxt}\n\n` +
    `Devuelve SOLO un objeto JSON: {"captions":{"P1":{"hook":"…","caption":"…","hashtags":["#…"],"cta":"…"}, …}} con una clave por cada id de arriba.`;

  let res: Response;
  try {
    res = await fetch(API, {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        system: SISTEMA,
        messages: [{ role: "user", content: user }],
      }),
    });
  } catch {
    return { ok: false, error: "No se pudo conectar con la IA." };
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: json?.error?.message || `HTTP ${res.status}` };
  const texto = (json?.content || []).find((b: { type: string; text?: string }) => b.type === "text")?.text as string | undefined;
  if (!texto) return { ok: false, error: "La IA no devolvió contenido." };
  const ini = texto.indexOf("{");
  const fin = texto.lastIndexOf("}");
  if (ini === -1 || fin <= ini) return { ok: false, error: "Respuesta ilegible." };
  try {
    const parsed = JSON.parse(texto.slice(ini, fin + 1)) as { captions?: KitCaptions };
    const raw = parsed.captions || {};
    const out: KitCaptions = {};
    for (const [id, c] of Object.entries(raw)) {
      out[id] = {
        hook: clean(c?.hook),
        caption: clean(c?.caption),
        hashtags: Array.isArray(c?.hashtags) ? c.hashtags.map((h) => String(h).trim()).filter(Boolean).slice(0, 8) : [],
        cta: clean(c?.cta),
      };
    }
    return { ok: true, captions: out };
  } catch {
    return { ok: false, error: "No se pudo leer la respuesta de la IA." };
  }
}

// Texto listo para copiar (hook + caption + CTA + hashtags).
export function captionToText(c: KitCaption): string {
  const bloques = [c.hook, c.caption, c.cta].map((x) => (x || "").trim()).filter(Boolean);
  const body = bloques.join("\n\n");
  return c.hashtags.length ? `${body}\n\n${c.hashtags.join(" ")}` : body;
}

// Extrae los campos de Experience que kit-captions necesita (para tipar el save).
export type ExperienceForCaptions = Pick<Experience, "estado" | "price"> & { page?: { blocks?: PageBlock[] } };
