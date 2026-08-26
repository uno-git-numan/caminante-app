// CHECKLIST DE COMUNICACIÓN — el semáforo de insumos del Kit, calculado desde
// lo que hay AHORA en el formulario (no desde la base): así el estado cambia
// mientras Luis captura, sin guardar.
//
// Es la misma pregunta que se hacía a mano al abrir el Kit y ver 6 piezas en
// "pendiente de insumo": ¿qué me falta para que la comunicación esté lista?
// Aquí se responde ANTES, en el lugar donde se arregla.
import type { Experience } from "@/lib/experiences/types";
import { textosDeClausulas } from "@/lib/legal/clausulas";

export type ItemEstado = "ok" | "parcial" | "falta";

export type ChecklistItem = {
  id: string;
  titulo: string;
  detalle: string; // qué hay / qué falta, en concreto
  estado: ItemEstado;
  ancla: string; // #sX de la sección que lo arregla
  desbloquea: string; // qué piezas del Kit dependen de esto
};

// Los 5 slots NÚCLEO del banco (los 3 extra son opcionales y no cuentan al semáforo).
const CORE: { k: keyof NonNullable<Experience["photoBank"]>; label: string }[] = [
  { k: "flora", label: "Flora / fauna" },
  { k: "paisaje", label: "Paisaje" },
  { k: "comunidad", label: "Comunidad" },
  { k: "comida", label: "Comida" },
  { k: "gente", label: "Gente" },
];

const has = (s?: string | null): boolean => !!s && s.trim().length > 0;

export type ChecklistEntrada = {
  photoBank: Experience["photoBank"];
  ficha: Experience["ficha"];
  registration: Experience["registration"];
  feedback: Experience["feedback"];
  // Guías tal como viven en el borrador del form (bio = el "saber" de E5).
  guias: { name?: string; bio?: string }[];
  // Salidas abiertas capturadas en «Fechas & cupo».
  salidas: { date?: string }[];
};

export function evaluarChecklist(e: ChecklistEntrada): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // 1 · FOTOS POR SLOT ────────────────────────────────────────────────────────
  const pb = e.photoBank ?? {};
  const llenos = CORE.filter((c) => (pb[c.k] ?? []).some(has));
  const faltantes = CORE.filter((c) => !(pb[c.k] ?? []).some(has)).map((c) => c.label);
  items.push({
    id: "fotos",
    titulo: "Fotos por tipo",
    detalle: llenos.length
      ? `${llenos.length}/5 slots núcleo con foto${faltantes.length ? ` · faltan: ${faltantes.join(", ")}` : ""}`
      : "Ningún slot con fotos — el Kit usará la galería suelta",
    estado: llenos.length === CORE.length ? "ok" : llenos.length ? "parcial" : "falta",
    ancla: "#s1b",
    desbloquea: "Reparte la foto correcta a cada pieza (una ficha usa flora; una postal, gente)",
  });

  // 2 · FICHA CIENTÍFICA (bloque por bloque = pieza por pieza) ─────────────────
  const f = e.ficha ?? {};
  const bloques: { k: string; label: string; n: number; pieza: string }[] = [
    { k: "especies", label: "Especies", n: (f.especies ?? []).filter((x) => has(x.comun)).length, pieza: "E1" },
    { k: "datos", label: "Datos del lugar", n: (f.datos ?? []).filter((x) => has(x.texto) && has(x.fuente)).length, pieza: "E2/E6/E7" },
    { k: "glosario", label: "Glosario", n: (f.glosario ?? []).filter((x) => has(x.termino) && has(x.def)).length, pieza: "E3" },
    { k: "temporada", label: "Temporada", n: (f.temporada ?? []).filter((x) => has(x.epoca) && has(x.fenomeno)).length, pieza: "E4" },
  ];
  const conDatos = bloques.filter((b) => b.n > 0);
  items.push({
    id: "ficha",
    titulo: "Ficha científica",
    detalle: bloques.map((b) => `${b.n ? "✓" : "✗"} ${b.label}${b.n ? ` (${b.n})` : ""}`).join(" · "),
    estado: conDatos.length === bloques.length ? "ok" : conDatos.length ? "parcial" : "falta",
    ancla: "#s1c",
    desbloquea: "Serie E: E1 especies · E2/E6/E7 datos · E3 glosario · E4 temporada",
  });

  // 3 · SABER DE LOS GUÍAS (E5) ───────────────────────────────────────────────
  // El retrato de E5 cita el saber REAL de la persona: con solo el nombre no
  // hay pieza (no inventamos frases que nadie dijo).
  const conNombre = e.guias.filter((g) => has(g.name));
  const conSaber = conNombre.filter((g) => has(g.bio));
  items.push({
    id: "guias",
    titulo: "Saber de los guías",
    detalle: conSaber.length
      ? `${conSaber.length} de ${conNombre.length} con biografía escrita`
      : conNombre.length
        ? `${conNombre.length} con nombre, ninguno con biografía`
        : "Sin guías capturados",
    estado: conSaber.length >= 2 ? "ok" : conSaber.length ? "parcial" : "falta",
    ancla: "#s5",
    desbloquea: "E5 «Quien sabe sabe» y P3 «Quiénes te llevan»",
  });

  // 4 · DESLINDE (la regla dura: sin esto no se vende) ─────────────────────────
  const r = e.registration;
  const clausulas = textosDeClausulas(r?.waiverClauses).length;
  const okDeslinde = !!r?.active && clausulas > 0 && has(r?.waiverDocUrl);
  items.push({
    id: "deslinde",
    titulo: "Deslinde",
    detalle: okDeslinde
      ? `Activo · ${clausulas} cláusulas · con documento`
      : [
          r?.active ? null : "sin activar",
          clausulas ? null : "sin cláusulas",
          has(r?.waiverDocUrl) ? null : "sin documento (PDF)",
        ]
          .filter(Boolean)
          .join(" · "),
    estado: okDeslinde ? "ok" : r?.active || clausulas ? "parcial" : "falta",
    ancla: "#s15",
    desbloquea: "Publicar y COBRAR: sin deslinde completo la venta está bloqueada",
  });

  // 4b · ENCUESTA (regla dura de Luis, 3 ago: "siempre tiene que estar prendido
  // todo antes de publicar"). Se agregó tras el caso hongos: 18 personas
  // viajaron y nadie recibió encuesta porque la casilla nace apagada y nada
  // avisaba. Sin esto, una salida se opera sin medir y el único síntoma es el
  // silencio. ─────────────────────────────────────────────────────────────────
  const enc = e.feedback; // ojo: `f` ya es la ficha científica más arriba
  const catsEnc = (enc?.sections ?? []).filter((s) => has(s?.label)).length;
  const okEncuesta = !!enc?.active && catsEnc > 0 && has(enc?.locationLabel);
  items.push({
    id: "encuesta",
    titulo: "Encuesta",
    detalle: okEncuesta
      ? `Activa · ${catsEnc} categoría${catsEnc === 1 ? "" : "s"}`
      : [
          enc?.active ? null : "apagada",
          catsEnc ? null : "sin categorías",
          has(enc?.locationLabel) ? null : "sin etiqueta de locación",
        ]
          .filter(Boolean)
          .join(" · "),
    estado: okEncuesta ? "ok" : enc?.active || catsEnc ? "parcial" : "falta",
    ancla: "#s16",
    desbloquea: "Publicar: sin encuesta la salida se opera sin medir (ni testimonios)",
  });

  // 5 · SALIDAS ───────────────────────────────────────────────────────────────
  const salidas = e.salidas.filter((s) => has(s.date));
  items.push({
    id: "salidas",
    titulo: "Salidas",
    detalle: salidas.length ? `${salidas.length} fecha${salidas.length === 1 ? "" : "s"} capturada${salidas.length === 1 ? "" : "s"}` : "Sin fechas",
    estado: salidas.length ? "ok" : "falta",
    ancla: "#s14",
    desbloquea: "P4–P7 (venta y cupo) y el calendario de la campaña",
  });

  return items;
}

// Verde = todo listo para comunicar. Deslinde, ENCUESTA y salidas son duros
// (los tres bloquean publicar); los insumos de contenido pueden ir "parcial" y
// aun así hay campaña que programar.
export function listoParaComunicar(items: ChecklistItem[]): boolean {
  const duro = (id: string) => items.find((i) => i.id === id)?.estado === "ok";
  const nada = (id: string) => items.find((i) => i.id === id)?.estado === "falta";
  return duro("deslinde") && duro("encuesta") && duro("salidas") && !nada("fotos") && !nada("ficha");
}
