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

// `cierre` (la pregunta al lector) y `porques` llegaron con la integración de
// 04-FORMULAS.md §1/§6 — OPCIONALES para no romper los captions ya guardados en
// experiences.data.kitCaptions, que no los traen.
export type KitCaption = {
  hook: string;
  caption: string;
  cierre?: string; // pregunta directa al lector — nace del 3er porqué (§6)
  porques?: { safe: string; real: string; raw: string }; // nota interna, NO se publica
  trigger?: string; // palabra-comentario (§2/§3) — SOLO P4–P6 y E4
  hashtags: string[];
  cta: string;
};

// Piezas que llevan palabra-trigger (04-FORMULAS.md §2/§3): solo las de VENTA y
// la de temporada. Jamás en lanzamiento (P1–P3 no venden) ni en las
// informativas puras (E1–E3, E5–E8 no piden nada).
const CON_TRIGGER = new Set(["P4", "P5", "P6", "E4"]);
export type KitCaptions = Record<string, KitCaption>;

const clean = (s?: string) => (s || "").replace(/\*\*/g, "").replace(/\*/g, "").trim();
const has = (s?: string) => !!s && s.trim().length > 0;

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

ANATOMÍA DEL CAPTION (04-FORMULAS.md §1 — fórmula fija): párrafos CORTOS separados por línea en blanco: (1) GANCHO ≤90 caracteres, jamás "Te contamos sobre…" ni "Conoce…"; (2) CONTEXTO: por qué importa / de dónde viene; (3) TENSIÓN o DATO: el giro, la cifra dura, lo que casi nadie sabe; (4) PROFUNDIZACIÓN opcional: el detalle que premia a quien sigue leyendo; (5) CIERRE con PREGUNTA directa al lector — SIEMPRE, en TODOS los captions sin excepción (ahí viven los comentarios). Los párrafos 2–4 van en "caption"; la pregunta va SOLA en "cierre".

LOS 3 PORQUÉS (04-FORMULAS.md §6 — OBLIGADO antes de escribir el cierre): todo caption tiene 3 profundidades: safe (el dato) → real (lo que implica) → raw (lo que te hace sentir / la verdad incómoda). Los promedio se quedan en safe; los mejores llegan a raw. ANTES de escribir la pregunta, baja tres porqués desde el dato de la pieza y escríbelos en "porques".
Ejemplo del manual: dato "en agosto caen hasta 85 meteoros por hora" → ¿por qué importa? los cielos oscuros donde se ven están desapareciendo → ¿por qué? la luz de las ciudades borró las estrellas para el 80% de nosotros → ¿por qué me toca? "¿Cuántos estaremos mirando cuando suceda?" ← ESE es el cierre.
LA PREGUNTA DEL CIERRE SALE SIEMPRE DEL TERCER PORQUÉ (raw), NUNCA DEL PRIMERO: existencial/personal («¿cuántos de nosotros estaremos mirando cuando suceda?») gana sobre técnica («¿sabías este dato?»). Caso verificado: 7.8K likes con pregunta existencial vs ~1.2K con dato solo. Los porqués son NOTA INTERNA de trabajo (no se publican): escríbelos igual, siempre.

CTA por momento: M1 (lanzamiento) = awareness, "link en bio"; M2 (venta) = a reservar; M3 (prueba) = próximas fechas / reservar; E (informativo) = suave («Guárdalo», «link en bio») o NINGUNO (deja "cta" vacío si la pieza lo pide). El CTA va DESPUÉS del cierre y jamás lo sustituye: aunque la pieza no lleve CTA, la pregunta va.

PALABRA-TRIGGER (04-FORMULAS.md §2/§3): cada comentario con la palabra = un lead + señal masiva para el algoritmo. Formato: «Comenta PALABRA y te mando las fechas» (o el itinerario / la guía). Reglas: palabra CORTA, UNA sola, en MAYÚSCULAS, ligada al tema del lugar (HONGO, VOLCÁN, BARRANCA, BALLENA); la promesa se cumple EN EL DM, no en el link ("te mando…", nunca "link en bio"). SOLO en las piezas que te marque con [LLEVA TRIGGER] — en las demás deja "trigger" vacío: el lanzamiento no vende y las informativas puras no piden nada. Escribe en "trigger" la línea completa lista para publicar.

SERIE E (catálogo informativo): piezas educativas ATEMPORALES — enseñan, no venden. Tono de guía de campo con belleza; el dato manda. JAMÁS vender duro ni mencionar precio/fechas/cupo. Puedes citar la fuente ABREVIADA entre paréntesis al final de una frase, ej. "(Guía de hongos, p. 12)". En E5 (comunidades) y E7 (problemas): sin CTA; respeto y honestidad, cero drama.

Para cada pieza devuelve: "hook" (primera línea que frena el scroll, ≤90 caracteres), "caption" (2–4 frases, el cuerpo SIN la pregunta y SIN hashtags), "porques" ({"safe","real","raw"}: los tres porqués, una línea cada uno), "cierre" (la pregunta directa al lector que sale del porqué raw, una sola línea terminada en "?"), "trigger" (la línea de palabra-comentario SOLO si la pieza va marcada [LLEVA TRIGGER]; si no, ""), "hashtags" (arreglo de 5–8, cada uno con #), "cta" (la llamada a la acción, una línea; vacío si la pieza no lleva).`;

export async function generateKitCaptions(
  ctx: KitContext,
  piezasListas: PieceDef[],
): Promise<{ ok: true; captions: KitCaptions } | { ok: false; error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "Falta ANTHROPIC_API_KEY." };
  if (!piezasListas.length) return { ok: true, captions: {} };

  const piezasTxt = piezasListas
    .map(
      (p) =>
        `- ${p.id} "${p.nombre}" [${p.momento}] cara:${p.cara} · trabajo: ${p.trabajo} · CTA sugerido: ${p.cta}` +
        (CON_TRIGGER.has(p.id) ? " · [LLEVA TRIGGER]" : ""),
    )
    .join("\n");
  const user =
    `RESUMEN DE LA EXPERIENCIA:\n${resumen(ctx)}\n\n` +
    `Link de la experiencia (bio): ${ctx.expUrl}\nLink de reserva: ${ctx.reservarUrl}\n\n` +
    `PIEZAS A REDACTAR (una entrada por id en el JSON):\n${piezasTxt}\n\n` +
    `Devuelve SOLO un objeto JSON: {"captions":{"P1":{"hook":"…","caption":"…","porques":{"safe":"…","real":"…","raw":"…"},"cierre":"¿…?","hashtags":["#…"],"cta":"…"}, …}} con una clave por cada id de arriba.`;

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
      const p = c?.porques;
      const porques =
        has(p?.safe) || has(p?.real) || has(p?.raw)
          ? { safe: clean(p?.safe || ""), real: clean(p?.real || ""), raw: clean(p?.raw || "") }
          : undefined;
      out[id] = {
        hook: clean(c?.hook),
        caption: clean(c?.caption),
        // El cierre-pregunta es obligatorio (§1) pero no lo fabricamos: si la IA
        // no lo devolvió, se queda vacío y se ve el hueco al revisar.
        cierre: has(c?.cierre) ? clean(c!.cierre!) : undefined,
        porques,
        // Guarda dura: aunque la IA se despiste, el trigger SOLO existe en las
        // piezas que lo permiten (§3: nunca en lanzamiento ni en informativas).
        trigger: CON_TRIGGER.has(id) && has(c?.trigger) ? clean(c!.trigger!) : undefined,
        hashtags: Array.isArray(c?.hashtags) ? c.hashtags.map((h) => String(h).trim()).filter(Boolean).slice(0, 8) : [],
        cta: clean(c?.cta),
      };
    }
    return { ok: true, captions: out };
  } catch {
    return { ok: false, error: "No se pudo leer la respuesta de la IA." };
  }
}

// Texto listo para copiar, en el orden del §1: gancho → cuerpo → PREGUNTA →
// CTA → trigger → hashtags. Los 3 porqués son nota de trabajo interna: JAMÁS
// se publican.
export function captionToText(c: KitCaption): string {
  const bloques = [c.hook, c.caption, c.cierre, c.cta, c.trigger].map((x) => (x || "").trim()).filter(Boolean);
  const body = bloques.join("\n\n");
  return c.hashtags.length ? `${body}\n\n${c.hashtags.join(" ")}` : body;
}

// La PALABRA que hay que vigilar en los comentarios, extraída de la línea de
// trigger («Comenta HONGO y te mando las fechas» → "HONGO"). §3 la exige CORTA,
// UNA sola y en MAYÚSCULAS, así que se reconoce sola dentro de la frase.
export function palabraTrigger(c?: KitCaption): string | null {
  if (!c?.trigger) return null;
  const m = c.trigger.match(/\b[A-ZÁÉÍÓÚÜÑ]{3,15}\b/);
  return m ? m[0] : null;
}

// Extrae los campos de Experience que kit-captions necesita (para tipar el save).
export type ExperienceForCaptions = Pick<Experience, "estado" | "price"> & { page?: { blocks?: PageBlock[] } };
