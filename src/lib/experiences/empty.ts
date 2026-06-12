import type { Experience, LensKey } from "./types";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const LENS_LABEL: Record<LensKey, string> = {
  naturaleza: "Naturaleza",
  conservacion: "Conservación",
  comunidades: "Comunidades",
  problemas: "Problemas",
};

// A blank experience with the fixed scaffolding pre-filled (chapter tags, the four
// fixed lenses, standard boilerplate) so the form only asks for the specific content.
export function emptyExperience(): Experience {
  const lensKeys: LensKey[] = ["naturaleza", "conservacion", "comunidades", "problemas"];
  return {
    slug: "",
    status: "draft",

    vol: "",
    coords: "",
    edgeLabel: "",
    brandSmall: "",
    docTitle: "",

    title: "",
    titleAccent: "",
    subtitle: "",
    heroImageUrl: "",
    heroImageAlt: "",
    heroMeta: [
      { k: "Fechas", v: "" },
      { k: "Duración", v: "" },
      { k: "Lugar", v: "" },
      { k: "Cupo limitado", v: "" },
    ],

    whatsapp: "525512020565",
    email: "uno@numanhub.com",
    instagram: "somos.caminante",
    price: { amount: "", currency: "MXN · por persona", desc: "" },
    stripeLink: null,

    registration: {
      active: false,
      waiverVersion: "v1",
      waiverDocUrl: "",
      waiverClauses: [""],
    },

    contextTag: "Capítulo 01 · El Contexto",
    contextTitle: "",
    contextTitleAccent: "",
    contextLead: "",
    contextBandImageUrl: "",
    contextBandCaption: "",
    context: [
      { no: "01", title: "", sub: "", body: "" },
      { no: "02", title: "", sub: "", body: "" },
      { no: "03", title: "", sub: "", body: "" },
      { no: "04", title: "", sub: "", body: "" },
    ],

    carasTitle: "Cada experiencia Caminante",
    carasTitleAccent: "tiene cuatro lentes.",
    carasIntro:
      "Una forma de leer este lugar. Naturaleza, conservación, comunidades y problemas: cuatro miradas sobre el mismo lugar. Elige un lente para enfocar.",
    lenses: lensKeys.map((key, i) => ({
      key,
      caraNo: `Cara 0${i + 1}`,
      label: LENS_LABEL[key],
      title: "",
      body: "",
      facts: [{ n: "", l: "" }],
      imageUrl: "",
      imageAlt: "",
    })),

    vivirTag: "Capítulo 02 · La Experiencia",
    vivirTitle: "Lo que vas a",
    vivirTitleAccent: "vivir.",
    vivirLead: "",
    vivir: [{ num: "01", pill: "", title: "", body: "", imageUrl: "", imageAlt: "" }],

    aliadosTag: "Capítulo 03 · Los Aliados",
    aliadosTitle: "Quiénes nos",
    aliadosTitleAccent: "acompañan.",
    aliadosLead: "",
    aliados: [{ role: "", name: "", body: "", peopleLabel: "", people: "" }],

    itinerarioTag: "Capítulo 04 · Plan de Viaje",
    itinerarioTitle: "Itinerario.",
    itinerarioLead: "",
    itinerario: [{ dno: "Día 01", dname: "", beats: [{ t: "", d: "" }] }],

    impactoTag: "Capítulo 05 · El Impacto",
    impactoTitle: "Tu participación es",
    impactoTitleAccent: "conservación directa.",
    impactoBody: [""],
    impactoLabel: "",
    impactoImageUrl: "",
    impactoImageAlt: "",

    paqueteTag: "Capítulo 06 · El Paquete",
    paqueteTitle: "Qué incluye",
    paqueteTitleAccent: "& qué no.",
    paqueteLead: "Todo lo necesario para vivir el viaje. Lo demás corre por tu cuenta.",
    incluye: [""],
    noIncluye: [""],

    mochilaTag: "Capítulo 07 · Tu Mochila",
    mochilaTitle: "Equipo",
    mochilaTitleAccent: "recomendado.",
    mochilaLead: "Empaca ligero. Esto es lo personal. Los ítems marcados en naranja son obligatorios.",
    mochila: [{ title: "", items: [{ text: "", req: "", must: false }] }],
    mochilaNote: "",

    practicoTag: "Capítulo 08 · Lo Práctico",
    practicoTitle: "Costos & preguntas",
    practicoTitleAccent: "frecuentes.",
    practicoLead: "Lo que necesitas saber antes de reservar tu lugar.",
    cancelacion: [
      { label: "Más de 30 días antes", val: "Sin costo" },
      { label: "15 a 29 días antes", val: "50%" },
      { label: "0 a 14 días antes", val: "100%" },
    ],
    faq: [{ q: "", a: "" }],

    reservaTag: "Capítulo 09 · Reserva tu lugar",
    reservaTitle: "Nos vemos",
    reservaTitleAccent: "en el camino.",
    reservaImageUrl: "",
    reservaImageAlt: "",
    datesBadge: { label: "", big: "", rest: "" },
    reservaNote: "",
    metaNote: ["Respuesta en 24 hrs", "De 9:00 a 19:00 CST"],

    footerBrand: "",
    footerSmall: "",
    footerRight: "",
  };
}
