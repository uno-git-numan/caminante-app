// COMPOSITOR DEL BOLETÍN — pre-llena una plantilla desde la MISMA FUENTE que
// todo lo demás del Kit (regla de Luis: un solo origen de datos):
//   · el dato asombroso + su FUENTE  → ficha científica de la experiencia
//   · el cuerpo                       → una pieza de la serie E (catálogo informativo)
//   · próximas salidas                → experience_slots reales (fecha, lugar, cupo)
//
// Si la ficha está vacía NO se inventa nada: se devuelve `faltantes` y la UI lo
// dice con todas sus letras («llena la ficha científica para armar el boletín»).
// Todo lo pre-llenado es EDITABLE antes de enviar.
import { fetchKitContext } from "@/lib/kit/queries";
import { PIEZAS_E, expName, type KitContext, type Lamina } from "@/lib/kit/kit";
import type { V2Hero } from "@/lib/experiences/types";
import type { NewsletterBody, NewsletterTemplate } from "./templates";

const SITE = "https://caminante.numanhub.com";

const has = (s?: string | null): s is string => !!s && s.trim().length > 0;
const limpio = (s?: string) => (s || "").replace(/\*\*/g, "").trim();

// Fecha de una salida en el formato del diseño: "10 AGO".
function fechaCorta(label: string): string {
  const m = label.match(/(\d{1,2})\s*(?:de\s*)?([a-záéíóúñ]{3,})/i);
  if (!m) return label.slice(0, 16).toUpperCase();
  const mes = m[2].slice(0, 3).toUpperCase();
  return `${m[1].padStart(2, "0")} ${mes}`;
}

export type ComposeResult = {
  body: NewsletterBody;
  subject: string;
  preheader: string;
  faltantes: string[]; // qué le falta a la experiencia para que el boletín valga
  fotos: string[]; // fotos disponibles (la UI deja elegir la del encabezado)
};

// Lugar de la experiencia (para la línea de salidas): meta del hero o el nombre.
function lugar(ctx: KitContext): string {
  const hero = ctx.blocks.find((b) => b.type === "hero") as V2Hero | undefined;
  return limpio(hero?.metaEst || expName(ctx.exp));
}

// Salidas abiertas REALES → filas del bloque «próximas salidas».
function salidasDe(ctx: KitContext): NonNullable<NewsletterBody["salidas"]> {
  const donde = lugar(ctx);
  return ctx.slots
    .filter((s) => has(s.label))
    .slice(0, 4)
    .map((s) => {
      const n = s.available;
      // Cupo NULL = salida sin tope (0009): no se anuncia un número inventado.
      const lugares = n === null ? "abierta" : n <= 2 ? `últimos ${n}` : `${n} lugares`;
      return { fecha: fechaCorta(s.label), lugar: donde, lugares, urgente: n !== null && n <= 2 };
    });
}

// El dato con más peso de la ficha: el que trae cifra primero (el asombro está
// en el número), y SIEMPRE con su fuente.
function datoDestacado(ctx: KitContext): { texto: string; fuente: string; n?: string } | null {
  const datos = (ctx.ficha?.datos ?? []).filter((d) => has(d.texto) && has(d.fuente));
  if (!datos.length) return null;
  const conCifra = datos.find((d) => has(d.n)) || datos.find((d) => /\d/.test(d.texto));
  const d = conCifra || datos[0];
  return { texto: limpio(d.texto), fuente: limpio(d.fuente), n: d.n };
}

// Texto de las láminas de una pieza E, para volcarlo al cuerpo del correo.
// Reusa el catálogo YA construido: el boletín no reinventa el contenido.
function piezaE(ctx: KitContext, id: string): Lamina[] | null {
  const def = PIEZAS_E.find((p) => p.id === id);
  if (!def) return null;
  const st = def.build(ctx);
  return st.estado === "lista" ? st.laminas : null;
}

// Apartados (subtítulo + párrafo) desde los cuerpos de una pieza E.
function apartadosDe(laminas: Lamina[]): { t: string; b: string }[] {
  const out: { t: string; b: string }[] = [];
  for (const l of laminas) {
    if (l.kind === "edu-cuerpo" && has(l.claim)) {
      out.push({ t: limpio(l.claim), b: limpio(l.caption || "") });
    }
  }
  return out.filter((a) => has(a.b)).slice(0, 3);
}

export async function composeNewsletter(
  slug: string,
  template: NewsletterTemplate,
): Promise<ComposeResult | null> {
  const ctx = await fetchKitContext(slug);
  if (!ctx) return null;

  const faltantes: string[] = [];
  const nombre = expName(ctx.exp);
  const donde = lugar(ctx);
  const hero = ctx.blocks.find((b) => b.type === "hero") as V2Hero | undefined;
  const dato = datoDestacado(ctx);
  const salidas = salidasDe(ctx);

  // Fotos disponibles: banco tipificado + galería + fondos (mismo pool del Kit).
  const fotos = [
    ...Object.values(ctx.photoBank ?? {}).flat(),
    ...ctx.gallery,
    hero?.bg?.url,
  ].filter((u): u is string => has(u));

  if (!dato) faltantes.push("La ficha científica no tiene datos con fuente — sin eso el boletín no tiene su dato asombroso.");
  if (!salidas.length) faltantes.push("No hay salidas abiertas: el bloque de próximas fechas saldrá vacío.");
  if (!fotos.length) faltantes.push("No hay fotos: el correo saldrá sin imagen de encabezado.");

  const heroUrl = fotos[0];
  const base: NewsletterBody = {
    heroUrl,
    salidas,
    ctaUrl: `${SITE}/caminante/experiencias/${slug}`,
    ctaTexto: "Ver todas las salidas",
  };

  let body: NewsletterBody;
  let subject: string;
  let preheader: string;

  switch (template) {
    case "carta": {
      const laminas = piezaE(ctx, "E2") || piezaE(ctx, "E6") || [];
      if (!laminas.length) faltantes.push("La serie E no tiene piezas listas: el cuerpo de la carta va vacío.");
      body = {
        ...base,
        kicker: "LA CARTA",
        titulo: limpio(hero?.sub || nombre),
        saludo: "Hola, caminante:",
        intro: limpio((ctx.blocks.find((b) => b.type === "statement") as { body?: string } | undefined)?.body || ""),
        apartados: apartadosDe(laminas),
        dato: dato ? { texto: dato.texto, fuente: dato.fuente } : undefined,
        pregunta: "",
        cierre: "Responde este correo y cuéntanos — leemos cada respuesta.",
      };
      subject = limpio(hero?.sub || nombre).slice(0, 80);
      preheader = `Una carta desde ${donde}.`;
      break;
    }
    case "dato": {
      body = {
        ...base,
        kicker: "UN DATO",
        numero: dato
          ? {
              n: dato.n || "",
              frase: dato.texto,
              parrafos: [],
              fuente: dato.fuente,
            }
          : undefined,
        pregunta: "",
        cierre: "Responde este correo con lo primero que pensaste. Nos gusta leerlos.",
      };
      subject = dato?.n ? `${dato.n} — el dato de ${donde}` : `El dato de ${donde}`;
      preheader = "Se lee en 40 segundos.";
      break;
    }
    case "guia": {
      // La guía de campo sale de las ESPECIES de la ficha (nombre + datos), o
      // del glosario si no hay especies capturadas.
      const especies = (ctx.ficha?.especies ?? []).filter((e) => has(e.comun)).slice(0, 3);
      const glosario = (ctx.ficha?.glosario ?? []).filter((g) => has(g.termino) && has(g.def)).slice(0, 3);
      const fichas = especies.length
        ? especies.map((e, i) => ({
            nombre: limpio(e.comun),
            alias: has(e.cientifico) ? limpio(e.cientifico!) : undefined,
            texto: limpio((e.datos ?? []).find((d) => has(d.texto))?.texto || ""),
            fotoUrl: fotos[i + 1],
          }))
        : glosario.map((g, i) => ({ nombre: limpio(g.termino), texto: limpio(g.def), fotoUrl: fotos[i + 1] }));
      if (!fichas.length) faltantes.push("La ficha científica no tiene especies ni glosario — la guía de campo se arma con eso.");
      body = {
        ...base,
        kicker: "GUÍA DE CAMPO",
        titulo: `Guía de campo de **${donde}**`,
        intro: "Guarda esta guía. Nada se recolecta sin un guía: se observa, se fotografía, se deja donde está.",
        fichas,
        dato: dato ? { texto: dato.texto, fuente: dato.fuente } : undefined,
        pregunta: "",
        cierre: "Respóndenos con tu foto y lo sumamos a la próxima guía.",
      };
      subject = `Guía de campo: ${donde}`;
      preheader = "Nombre, seña y por qué importan. Para guardar y reenviar.";
      break;
    }
    case "vivio": {
      const quote = ctx.quotes[0];
      if (!quote) faltantes.push("No hay testimonios aprobados con consentimiento — «Así se vivió» los usa como voz del grupo.");
      const proxima = ctx.slots[0];
      body = {
        ...base,
        kicker: "ASÍ SE VIVIÓ",
        titulo: limpio(hero?.sub || nombre),
        intro: "",
        galeria: fotos.slice(1, 4),
        testimonio: quote ? { texto: limpio(quote.text), autor: `${quote.author}, del grupo` } : undefined,
        dato: dato ? { texto: dato.texto, fuente: dato.fuente } : undefined,
        salidaDestacada: proxima
          ? {
              titulo: `${nombre} · ${proxima.label}`,
              detalle: `${donde}${proxima.available !== null ? ` · quedan ${proxima.available} lugares` : ""}`,
              url: `${SITE}/caminante/experiencias/${slug}`,
            }
          : undefined,
        salidas: [], // esta plantilla usa la salida destacada, no la lista
        pregunta: "",
        cierre: "Responde este correo — te contamos cómo es un día completo.",
      };
      subject = `Así se vivió: ${nombre}`;
      preheader = "Fotos, una voz del grupo y la próxima fecha.";
      break;
    }
  }

  return { body, subject, preheader, faltantes, fotos };
}
