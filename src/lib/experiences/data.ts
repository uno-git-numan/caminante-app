import type { Experience } from "./types";

// Temporary in-code source. Step 2 swaps this for Supabase queries — the shape stays identical.
const PHOTO = "/experiencias/ensenada-de-muertos/assets/photos";

const ensenada: Experience = {
  slug: "ensenada-de-muertos",
  status: "published",

  vol: "Vol. 07 · Junio 2026",
  coords: "23°59′N · 109°50′W",
  edgeLabel: "Caminante · Ocean Safari 2026",
  brandSmall: "Ocean Safari",
  docTitle: "Caminante · Ocean Safari — Ensenada de Muertos",

  title: "OCEAN",
  titleAccent: "safari.",
  subtitle: "Ensenada de Muertos · Viaje con la ciencia",
  heroImageUrl: `${PHOTO}/b.jpg`,
  heroImageAlt:
    "Aleta dorsal de una orca emergiendo entre la bruma del Mar de Cortés",
  heroMeta: [
    { k: "Dos fechas", v: "Junio 12–15\nó 18–21" },
    { k: "Duración", v: "4 días · 3 noches\nCampamento frente al mar" },
    { k: "Lugar", v: "Ensenada de Muertos\nBaja California Sur" },
    { k: "Cupo limitado", v: "Máx. 13 participantes\n+ 3 operadores" },
  ],

  whatsapp: "525512020565",
  email: "uno@numanhub.com",
  instagram: "somos.caminante",
  price: {
    amount: "$16,000",
    currency: "MXN · por persona",
    desc: "Incluye transporte en BCS, hospedaje, alimentación completa, dos días de Ocean Safari, equipo, acompañamiento científico y donación a Orgcas A.C.",
  },
  stripeLink: null,

  cardTitle: "Ensenada de Muertos · Ocean Safari",
  cardPloc: "Baja California Sur · Junio 2026",
  cardHook: "Viaje con la ciencia de orcas en el Mar de Cortés.",
  startDate: "2026-06-12",

  contextTag: "Capítulo 01 · El Contexto",
  contextTitle: "La historia detrás del",
  contextTitleAccent: "Mar de Cortés.",
  contextLead:
    "Cuatro días aprendiendo de biólogos marinos y de la comunidad pesquera de Agua Amarga. Una invitación a ser parte de un proyecto de conservación marina.",
  contextBandImageUrl: `${PHOTO}/dji0175.jpg`,
  contextBandCaption: "Donde el desierto toca el mar · Ensenada de Muertos, BCS",
  context: [
    {
      no: "01",
      title: "Agua Amarga",
      sub: "De tiburoneros a guardianes del mar.",
      body: "Comunidad pesquera del Pacífico, en Baja California Sur. Durante generaciones vivieron de la pesca de tiburón. Hoy, a través del eco-turismo y la conservación, la Cooperativa Tiburón se transformó: de cazadores a protectores del océano.",
    },
    {
      no: "02",
      title: "Dos Mares",
      sub: "Un área marina protegida en proceso de creación.",
      body: "Orgcas A.C. y Oregon State University proponen una Reserva de la Biósfera que conecte el Pacífico con el Mar de Cortés. Para diseñar los polígonos hace falta rastrear las rutas migratorias de orcas, ballenas y tiburones.",
    },
    {
      no: "03",
      title: "La investigación",
      sub: "Viaje con la ciencia de orcas.",
      body: "En febrero de 2025, el primer viaje con la ciencia de orcas en la historia de México. En junio de 2026, los biólogos regresan a rastrear orcas y sus presas. Esos datos fundamentarán la propuesta de Dos Mares.",
    },
    {
      no: "04",
      title: "Caminante",
      sub: "No es observación pasiva. Es inmersión.",
      body: "UABCS, Oregon State University, Orgcas, y la Cooperativa Tiburón invitan a Caminante a vivir esta historia desde dentro. Aprendes directo de los científicos y los pescadores, convives con quienes hacen el trabajo, y contribuyes a la causa.",
    },
  ],

  carasTitle: "Cada experiencia Caminante",
  carasTitleAccent: "tiene cuatro lentes.",
  carasIntro:
    "Una forma de leer este lugar. Naturaleza, conservación, comunidades y problemas: cuatro miradas sobre el mismo mar. Elige un lente para enfocar.",
  lenses: [
    {
      key: "naturaleza",
      caraNo: "Cara 01",
      label: "Naturaleza",
      title: "La ciencia viva del lugar.",
      body: "El Mar de Cortés es el único santuario del mundo con **nueve especies de grandes ballenas**. La ballena azul y la de aleta son los dos animales más grandes que han existido. Las orcas son depredadores ápice que moldean el ecosistema por depredación y por el “paisaje del miedo”. En junio: rayas móbula munkiana, lobos marinos, delfines, tortugas, jorobada y azul.",
      facts: [
        { n: "9", l: "especies de grandes ballenas" },
        { n: "900", l: "especies de peces" },
        { n: "2,000", l: "especies de invertebrados" },
      ],
      imageUrl: `${PHOTO}/dji0179.jpg`,
      imageAlt: "Vista aérea de un arrecife en aguas turquesa del Mar de Cortés",
    },
    {
      key: "conservacion",
      caraNo: "Cara 02",
      label: "Conservación",
      title: "La protección que se está construyendo.",
      body: "“Dos Mares” es la Reserva de la Biósfera propuesta que conectaría el Pacífico con el Mar de Cortés. La región concentra el **70–75% de la captura pesquera del país**. Impulsada por Orgcas, DEPESCA y Beta Diversidad, con apoyo de Pew Bertarelli, Patagonia, Wyss y Blue Marine Foundation. Siete años de socialización, 553+ cartas de apoyo de 4,000+ pescadores: por primera vez las voces locales se reflejan en el programa de manejo.",
      facts: [
        { n: "553+", l: "cartas de apoyo de pescadores" },
        { n: "2025", l: "1er marcaje satelital de orcas en México · 3 orcas · 650 millas · 6 semanas" },
        { n: "8 tags", l: "en junio 2026 para mapear rutas migratorias" },
      ],
      imageUrl: `${PHOTO}/d.jpg`,
      imageAlt: "Orcas avistadas entre la niebla, datos para la propuesta Dos Mares",
    },
    {
      key: "comunidades",
      caraNo: "Cara 03",
      label: "Comunidades",
      title: "La gente del lugar y su vínculo con el mar.",
      body: "Agua Amarga: de tiburoneros a guardianes del mar. La Cooperativa Tiburón capitanea las pangas — **Félix Rochin, Tobías Lucero, Salvador Ríos**. Conocimiento intergeneracional que ningún laboratorio puede sustituir. La reserva beneficiaría a 11,000 pescadores ribereños y sus familias.",
      facts: [
        { n: "11,000", l: "pescadores ribereños beneficiados" },
        { n: "3", l: "capitanes de la Cooperativa Tiburón" },
      ],
      imageUrl: `${PHOTO}/dsc03001.jpg`,
      imageAlt: "Panga de la Cooperativa Tiburón navegando al amanecer",
    },
    {
      key: "problemas",
      caraNo: "Cara 04",
      label: "Problemas",
      title: "Lo que pelea contra la conservación.",
      body: "México tiene 39 Áreas Marinas Protegidas, pero permite pesca industrial en 35 — el **95% de la Zona Económica Exclusiva**. Hasta el 80% de las pesquerías están sobreexplotadas. La pesca industrial es apenas el 0.08% del PIB. *“Lo que un barco industrial captura en una noche equivale a lo que una comunidad costera captura en un año.”* Amenazas: pesca industrial, minería submarina, turismo no regulado, gas Saguaro, cruceros, desaladoras, crimen organizado.",
      facts: [
        { n: "95%", l: "de la ZEE con pesca industrial permitida" },
        { n: "80%", l: "de las pesquerías sobreexplotadas" },
        { n: "0.08%", l: "del PIB es la pesca industrial" },
      ],
      imageUrl: `${PHOTO}/dsc01754.jpg`,
      imageAlt: "Cardumen disperso en aguas oscuras, símbolo de la presión sobre el ecosistema",
    },
  ],

  vivirTag: "Capítulo 02 · La Experiencia",
  vivirTitle: "Lo que vas a",
  vivirTitleAccent: "vivir.",
  vivirLead: "Cinco encuentros diseñados para conectarte con el mar, la ciencia y la comunidad.",
  vivir: [
    {
      num: "01",
      pill: "2 días · Panga",
      title: "Ocean Safari en panga.",
      body: "Dos días completos navegando el Mar de Cortés con capitanes de la comunidad de Agua Amarga. Snorkel con lobos marinos, avistamiento de rayas móbula, delfines, tortugas y otras especies según las condiciones del día.",
      imageUrl: `${PHOTO}/dji223.jpg`,
      imageAlt: "Panga navegando sobre aguas cristalinas, vista aérea",
    },
    {
      num: "02",
      pill: "Ciencia · A bordo",
      title: "Aprendizaje con biólogos marinos.",
      body: "Sesiones con investigadores de Oregon State University y UABCS. Briefing sobre la fauna del Mar de Cortés, el proyecto Dos Mares, y contexto educativo en tiempo real durante los encuentros con fauna.",
      imageUrl: `${PHOTO}/a.jpg`,
      imageAlt: "Orca emergiendo al amanecer, contexto científico a bordo",
    },
    {
      num: "03",
      pill: "Cultura · Cooperativa",
      title: "Convivencia con la comunidad pesquera.",
      body: "Conoce la historia de Agua Amarga y escucha de primera mano cómo los ex-tiburoneros se convirtieron en guardianes del mar. Cooperativa Tiburón, en su propio territorio.",
      imageUrl: `${PHOTO}/dji0178.jpg`,
      imageAlt: "Litoral de Baja California Sur al atardecer, territorio de Agua Amarga",
    },
    {
      num: "04",
      pill: "3 noches · BCS",
      title: "Campamento frente al mar.",
      body: "Tres noches en Ensenada de Muertos, tiendas de campaña equipadas, fogatas y cenas bajo las estrellas. Todo el equipo de campamento incluido.",
      imageUrl: `${PHOTO}/dsc08722.jpg`,
      imageAlt: "Cholla del desierto con la luna saliendo al anochecer",
    },
    {
      num: "05",
      pill: "Diario · Amanecer",
      title: "Prácticas NUMAN.",
      body: "Meditación y breathwork opcionales cada amanecer, frente al mar. Un anclaje silencioso antes de salir a navegar.",
      imageUrl: `${PHOTO}/dsc6947.jpg`,
      imageAlt: "Amanecer sobre el desierto y las montañas de Baja",
    },
  ],

  aliadosTag: "Capítulo 03 · Los Aliados",
  aliadosTitle: "Quiénes nos",
  aliadosTitleAccent: "acompañan.",
  aliadosLead: "Cuatro organizaciones trabajando juntas en el campo. Tú vas con ellas.",
  aliados: [
    {
      role: "01 / ONG de conservación",
      name: "Orgcas A.C.",
      body: "Organización no gubernamental dedicada a la conservación marina. Lidera la propuesta de la Reserva de la Biósfera Dos Mares y coordina el trabajo de campo con las comunidades pesqueras y los equipos científicos.",
      peopleLabel: "Coordinadoras",
      people: "Fernanda Porfiria Gómez · Carolina Márquez",
    },
    {
      role: "02 / Investigación científica",
      name: "Oregon State University.",
      body: "Biólogos y científicos especializados en biología marina y mamíferos marinos. Responsables del viaje con la ciencia de orcas y del análisis de rutas migratorias en el Mar de Cortés.",
      peopleLabel: "Investigadores principales",
      people: "Dr. Joshua Stewart · Dr. Bob Pitman",
    },
    {
      role: "03 / Academia",
      name: "UABCS.",
      body: "Universidad Autónoma de Baja California Sur. Investigación local sobre fauna marina, contexto regional y vinculación con instituciones internacionales en el proyecto Dos Mares.",
      peopleLabel: "Investigadores",
      people: "Dr. Jorge Urban · Dra. Lorena Viloria",
    },
    {
      role: "04 / Comunidad pesquera",
      name: "Cooperativa Tiburón.",
      body: "Conocimiento empírico. Ex-tiburoneros convertidos en guías y guardianes del mar. Capitanean las pangas del Ocean Safari y aportan el conocimiento intergeneracional del Mar de Cortés que ningún laboratorio puede sustituir.",
      peopleLabel: "Capitanes · Agua Amarga",
      people: "Félix Rochin · Tobías Lucero · Salvador Ríos",
    },
  ],

  itinerarioTag: "Capítulo 04 · Plan de Viaje",
  itinerarioTitle: "Itinerario.",
  itinerarioLead:
    "Cuatro días, tres noches. Dos fechas disponibles en junio de 2026: del viernes 12 al lunes 15, o del jueves 18 al domingo 21.",
  itinerario: [
    {
      dno: "Día 01",
      dname: "Llegada · Briefing",
      beats: [
        { t: "Mediodía", d: "Punto de encuentro en La Paz. Participantes llegan por su cuenta." },
        { t: "Tarde", d: "Transporte La Paz → Ensenada de Muertos. Campamento ya montado." },
        { t: "Atardecer", d: "Sesión introductoria. Briefing con biólogos marinos y contexto del proyecto Dos Mares." },
        { t: "Noche", d: "Cena y fogata." },
      ],
    },
    {
      dno: "Día 02",
      dname: "Ocean Safari I",
      beats: [
        { t: "Amanecer", d: "Meditación y breathwork. Práctica NUMAN." },
        { t: "07:00 AM", d: "Salida en panga. Ocean Safari día 1." },
        { t: "Mañana – Tarde", d: "Navegación, snorkel, encuentros con fauna marina. Biólogo a bordo." },
        { t: "Mediodía", d: "Parada en playa, ceviche fresco y botana." },
        { t: "Atardecer · Noche", d: "Regreso al campamento. Cena, fogata, descanso." },
      ],
    },
    {
      dno: "Día 03",
      dname: "Ocean Safari II",
      beats: [
        { t: "Amanecer", d: "Meditación y breathwork. Práctica NUMAN." },
        { t: "Temprano", d: "Ocean Safari día 2. Mismo formato, diferentes encuentros." },
        { t: "Mediodía", d: "Parada en playa, ceviche fresco y botana." },
        { t: "Atardecer", d: "Regreso al campamento." },
        { t: "Noche", d: "Última cena grupal. Fogata de cierre." },
      ],
    },
    {
      dno: "Día 04",
      dname: "Cierre · Regreso",
      beats: [
        { t: "Amanecer", d: "Meditación y breathwork de cierre. Práctica NUMAN." },
        { t: "Mañana", d: "Desayuno en campamento." },
        { t: "Mañana", d: "Transporte Ensenada de Muertos → La Paz. Despedida." },
      ],
    },
  ],

  impactoTag: "Capítulo 05 · El Impacto",
  impactoTitle: "Tu participación es",
  impactoTitleAccent: "conservación directa.",
  impactoBody: [
    "Un porcentaje del costo de tu viaje se destina directamente a Orgcas A.C. para apoyar la investigación y conservación del proyecto Dos Mares.",
    "Al participar, no solo vives una experiencia: contribuyes activamente a la protección de uno de los ecosistemas marinos más importantes del planeta.",
  ],
  impactoLabel: "Proyecto Dos Mares · Mar de Cortés",
  impactoImageUrl: `${PHOTO}/e.jpg`,
  impactoImageAlt: "Orcas distantes entre la bruma del Mar de Cortés",

  paqueteTag: "Capítulo 06 · El Paquete",
  paqueteTitle: "Qué incluye",
  paqueteTitleAccent: "& qué no.",
  paqueteLead: "Todo lo necesario para vivir el viaje. Lo demás corre por tu cuenta.",
  incluye: [
    "Transporte en BCS: La Paz → Ensenada de Muertos → La Paz.",
    "3 noches en campamento frente al mar (tienda, colchoneta, sleeping bag).",
    "Alimentación completa: cena del jueves al desayuno del domingo. Desayunos a bordo, ceviche en playa, cenas en campamento.",
    "2 días completos de Ocean Safari en panga con capitanes de Agua Amarga.",
    "Acompañamiento científico de biólogos de Oregon State University y UABCS.",
    "Convivencia con la Cooperativa Tiburón de Agua Amarga.",
    "Equipo de snorkel completo (visor, snorkel, aletas).",
    "Equipo de campamento completo.",
    "Meditación y breathwork diarios al amanecer.",
    "Fotos y contenido del viaje.",
    "Donación a Orgcas A.C. para conservación.",
    "Fogatas nocturnas.",
  ],
  noIncluye: [
    "Vuelos a La Paz.",
    "Comida del jueves en La Paz (antes del transporte).",
    "Bebidas alcohólicas.",
    "Snacks personales adicionales.",
    "Propinas para guías, capitanes o staff.",
    "Seguro de viaje personal.",
    "Protector solar, artículos de higiene y efectos personales.",
    "Upgrade a tienda individual (si aplica).",
    "Cualquier gasto fuera del itinerario.",
  ],

  mochilaTag: "Capítulo 07 · Tu Mochila",
  mochilaTitle: "Equipo",
  mochilaTitleAccent: "recomendado.",
  mochilaLead:
    "Empaca ligero. El equipo de snorkel y campamento ya está cubierto. Esto es lo personal. Los ítems marcados en naranja son obligatorios.",
  mochila: [
    {
      title: "Agua & Sol",
      items: [
        { text: "Traje de baño", req: "2 recomendados" },
        { text: "Protector solar reef-safe", req: "Obligatorio · biodegradable", must: true },
        { text: "Rash guard o playera de lycra" },
        { text: "Sandalias acuáticas o huaraches de agua" },
        { text: "Toalla de microfibra" },
        { text: "Botella de agua reusable", req: "Mínimo 1 litro" },
      ],
    },
    {
      title: "Ropa & Protección",
      items: [
        { text: "Ropa ligera de secado rápido" },
        { text: "Chamarra ligera o sudadera", req: "Para las noches" },
        { text: "Gorra o sombrero" },
        { text: "Lentes de sol", req: "Con correa para la panga" },
        { text: "Mochila pequeña o dry bag", req: "Para la panga" },
        { text: "Linterna frontal" },
      ],
    },
    {
      title: "Personal",
      items: [
        { text: "Artículos de higiene personal" },
        { text: "Repelente de insectos" },
        { text: "Medicamentos personales", req: "Si aplica" },
      ],
    },
  ],
  mochilaNote:
    "El protector solar reef-safe biodegradable es obligatorio para snorkel. Cualquier otro tipo daña los corales y el ecosistema marino.",

  practicoTag: "Capítulo 08 · Lo Práctico",
  practicoTitle: "Costos & preguntas",
  practicoTitleAccent: "frecuentes.",
  practicoLead: "Lo que necesitas saber antes de reservar tu lugar.",
  cancelacion: [
    { label: "Más de 30 días antes", val: "Sin costo" },
    { label: "15 a 29 días antes", val: "50%" },
    { label: "0 a 14 días antes", val: "100%" },
  ],
  faq: [
    { q: "¿Necesito saber nadar?", a: "Sí, se requiere nivel básico de nado para snorkel. Los guías están capacitados, pero no es una experiencia diseñada para no nadadores." },
    { q: "¿Qué fauna vamos a ver?", a: "Depende del día y las condiciones del mar. En junio: rayas mobula, lobos marinos, delfines, tortugas, ballena jorobada, ballena azul. Los biólogos buscan los mejores encuentros según condiciones." },
    { q: "¿Voy a participar en el viaje con la ciencia de orcas?", a: "No directamente. El viaje con la ciencia es trabajo científico especializado. Vas a aprender del proceso, convivir con los investigadores, y entender el proyecto de primera mano." },
    { q: "¿Qué es Dos Mares?", a: "Un proyecto de Orgcas A.C. para crear una Reserva de la Biósfera que conecte el Pacífico con el Mar de Cortés, protegiendo rutas migratorias de especies clave." },
    { q: "¿Cuántas personas van?", a: "Máximo 13 participantes + 3 operadores." },
    { q: "¿Qué pasa si no se junta el grupo?", a: "Reembolso completo o transferencia a otra experiencia Caminante." },
    { q: "¿Y si el clima no permite salir al mar?", a: "Se ajusta el itinerario priorizando seguridad. Los capitanes y el equipo deciden con criterio local." },
    { q: "¿Necesito llevar equipo de snorkel o campamento?", a: "No, todo está incluido." },
    { q: "¿Cómo llego?", a: "Cada participante llega por su cuenta a La Paz, BCS. Transporte terrestre La Paz ↔ Ensenada de Muertos incluido." },
  ],

  reservaTag: "Capítulo 09 · Reserva tu lugar",
  reservaTitle: "Nos vemos",
  reservaTitleAccent: "en el mar.",
  reservaImageUrl: `${PHOTO}/dji0178.jpg`,
  reservaImageAlt: "Litoral de Baja California Sur al atardecer",
  datesBadge: { label: "Junio 2026", big: "12–15", rest: "ó 18–21" },
  reservaNote:
    "Cupo limitado a 13 participantes. Reserva tu lugar escribiendo a uno@numanhub.com o por WhatsApp al 55 1202 0565. Te confirmamos disponibilidad y compartimos el proceso de pago.",
  metaNote: ["Respuesta en 24 hrs", "De 9:00 a 19:00 CST"],

  footerBrand: "Caminante · Ocean Safari 2026",
  footerSmall: "Vol. 07 · Junio 2026 · 23°59′N · 109°50′W",
  footerRight:
    "Operado en colaboración con Orgcas A.C., Oregon State University, UABCS y la Cooperativa Tiburón de Agua Amarga. Un porcentaje del costo se destina a conservación marina.",
};

const EXPERIENCES: Record<string, Experience> = {
  [ensenada.slug]: ensenada,
};

export function getExperienceBySlug(slug: string): Experience | null {
  return EXPERIENCES[slug] ?? null;
}

export function getAllExperiences(): Experience[] {
  return Object.values(EXPERIENCES);
}
