// EL CATÁLOGO DE ACTIVIDADES — qué se puede operar y qué papeles pide cada cosa.
//
// Vive en código y no en la base, por la misma razón que las tasas de comisión
// viven en `comision.ts`: esto es una DEFINICIÓN, no un dato. Cambia por
// decisión del equipo, se revisa leyendo un diff, y ninguna operadora la edita.
// La base guarda lo que sí es dato —qué declaró cada quien y en qué va— y se
// une con esto por el `slug`.
//
// ⚠️ BORRADOR DEL 9 SEP 2026. Los documentos están anclados en norma mexicana
// real (RNT de SECTUR, NOM-09-TUR-2002 que acredita guías POR MODALIDAD,
// NOM-05-TUR-2003 y NOM-012-TUR para buceo), pero el equipo de Luis los va a
// corregir. Está escrito para que corregir sea editar un renglón.
// El razonamiento largo está en `design/operadores/CATALOGO-ACTIVIDADES.md`.
//
// ⚠️ NO SE PONEN CIFRAS DE VIDA ÚTIL. «Cuerdas de menos de seis años» es un
// ejemplo que dio Luis, no un dato verificado: la vida útil real depende del
// fabricante y del uso registrado. Por eso lo que se pide es la BITÁCORA DE
// VIDA del equipo, que es lo auditable, y el número exacto se fija en el anexo
// de cada actividad cuando el equipo lo confirme. Un número inventado aquí
// terminaría cobrándose en una montaña.

/** Un papel que hay que entregar. */
export type Documento = {
  slug: string;
  nombre: string;
  /** Por qué se pide. Se le muestra a la operadora: nadie junta papeles a ciegas. */
  porQue: string;
  /**
   * Si caduca. Cuando es `true`, `operator_documents.vence_at` es obligatorio
   * en la práctica: sin fecha, un papel entregado se vería válido para siempre.
   */
  vence: boolean;
  /**
   * La vigencia se escribe por AÑO, no por día (Luis, 9 nov 2026: «La vigencia
   * del INE es por año»). La INE dice «VIGENCIA 2033» y nada más; pedir día y
   * mes obligaba a inventarlos. Se guarda como el 31 de diciembre de ese año.
   */
  vencePor?: "anio";
  /** Sólo se le pide a ese tipo de persona. Sin el campo, a las dos. */
  soloPara?: "fisica" | "moral";
  /** Se ofrece pero no cuenta como pendiente: el expediente cierra sin él. */
  opcional?: boolean;
  /** El nombre cambia con el tipo de persona (la identificación de quién). */
  nombrePara?: { fisica?: string; moral?: string };
};

/** Lo que se hace en el monte, y lo que hay que probar para hacerlo. */
export type Actividad = {
  slug: string;
  nombre: string;
  /** La norma que la respalda, para poder citarla en pantalla. */
  norma?: string;
  /** Documentos propios de esta actividad. */
  documentos: Documento[];
  /**
   * Generales que esta actividad vuelve especialmente críticos. Se listan
   * DENTRO de su acordeón marcados como «ya está en Lo general» — se muestran,
   * no se vuelven a pedir. Todos los generales aplican a todas las actividades;
   * esta lista sólo decide cuáles se asoman aquí.
   */
  generalesRelevantes: string[];
};

// ── LO GENERAL ───────────────────────────────────────────────────────────────
// Se pide UNA vez y sirve para todas las actividades. En la base son las filas
// con `actividad IS NULL`.
//
// ⚠️ 9 NOV 2026 · LA LISTA LA CORRIGIÓ LUIS haciendo el alta de una operadora
// en vivo. Lo que salió y por qué:
//   · Acta constitutiva: ya no es forzosa. Sólo se OFRECE a personas morales, y
//     a las físicas ni se les enseña (antes se le pedía a todas).
//   · Certificado de primeros auxilios: viene implícito en la credencial de guía
//     de SECTUR (NOM-09), que ya se pide por actividad.
//   · Protocolo de emergencia, inventario del botiquín y bitácora de incidentes:
//     en vez de tres archivos, la operadora DECLARA en el anexo de cada
//     actividad que lleva el botiquín completo para esa actividad
//     (`subconvenio-doc.ts`, cláusula del botiquín).
//   · Póliza de gastos médicos del personal: fuera. La de participantes queda,
//     y se llama como se contrata: póliza colectiva de accidentes y enfermedades.
// Las filas viejas de lo que salió NO se borran: son papeles que una operadora
// subió y la casa no los tira sin preguntar. El expediente ya no las cuenta.
export const GENERALES: Documento[] = [
  { slug: "rnt", nombre: "Registro Nacional de Turismo (SECTUR) vigente",
    porQue: "Es lo que habilita legalmente a operar como prestador de servicios turísticos. Se tramita gratis en rnt.sectur.gob.mx.", vence: true },
  { slug: "id-responsable", nombre: "Identificación oficial",
    nombrePara: { fisica: "Tu identificación oficial", moral: "Identificación oficial del representante legal" },
    porQue: "INE por los dos lados o pasaporte. Es de quien firma el convenio.", vence: true, vencePor: "anio" },
  { slug: "id-operacion", nombre: "Identificación de quien opera en campo",
    porQue: "Sólo si es otra persona. Muchas veces quien administra no es quien opera ni quien tramitó los permisos: necesitamos saber quién es cada uno.",
    vence: true, vencePor: "anio", opcional: true },
  { slug: "acta-constitutiva", nombre: "Acta constitutiva y poder del representante",
    porQue: "Opcional. Prueba que quien firma puede obligar a la empresa; si la tienes a la mano, súbela.",
    vence: false, soloPara: "moral", opcional: true },
  { slug: "csf", nombre: "Constancia de Situación Fiscal",
    porQue: "No vence. La leemos al subirla para revisar que sea reciente y que sus datos coincidan con los tuyos.", vence: false },
  { slug: "poliza-rc", nombre: "Póliza de responsabilidad civil vigente",
    porQue: "Cubre los daños que la operación pueda causar a terceros. Sirve la anual o la que se contrata por integrante por día de salida: lo que importa es que cubra a todos, todos los días.", vence: true },
  { slug: "poliza-gm", nombre: "Póliza colectiva de seguro de accidentes y enfermedades",
    porQue: "Cubre a quienes viajan contigo. Tiene que estar emitida por una aseguradora autorizada: con la póliza verificamos con ella que estás asegurado.", vence: true },
];

/** Los generales que le tocan a un tipo de persona. Sin tipo, todos los que no dependen de él. */
export function generalesPara(tipo: "fisica" | "moral" | null): Documento[] {
  return GENERALES.filter((d) => !d.soloPara || d.soloPara === tipo).map((d) => ({
    ...d,
    nombre: (tipo && d.nombrePara?.[tipo]) || d.nombre,
  }));
}

// ── LAS ACTIVIDADES ──────────────────────────────────────────────────────────
// La credencial NOM-09 es POR MODALIDAD: acreditarse en senderismo no acredita
// para buceo. Por eso cada actividad pide la suya y no hay una sola credencial
// que sirva para todo.
const NOM09 = "NOM-09-TUR-2002";
const cred = (modalidad: string): Documento => ({
  slug: `nom09-${modalidad}`,
  nombre: `Credencial de guía SECTUR (NOM-09) · ${modalidad}`,
  porQue: `Acredita al guía en esta modalidad específica, primeros auxilios incluidos. Una credencial de otra modalidad no sirve aquí.`,
  vence: true,
});
const bitacoraEpp: Documento = {
  slug: "bitacora-epp",
  nombre: "Bitácora de vida del equipo de protección",
  porQue: "Cuerdas, arneses y cascos con fecha de fabricación y de primer uso. Es lo que permite saber si el equipo sigue siendo confiable.",
  vence: false,
};

export const ACTIVIDADES: Actividad[] = [
  { slug: "senderismo", nombre: "Senderismo y caminata", norma: NOM09,
    documentos: [cred("senderismo"),
      { slug: "ratio-guias", nombre: "Ratio guía / participantes declarado", porQue: "Cuánta gente lleva un guía. Define si el grupo es manejable.", vence: false },
      { slug: "comunicacion", nombre: "Medio de comunicación en zona sin señal", porQue: "Cómo se pide ayuda donde no hay teléfono.", vence: false }],
    generalesRelevantes: ["poliza-gm"] },

  { slug: "alta-montana", nombre: "Alta montaña y alpinismo", norma: NOM09,
    documentos: [cred("alta montaña"), bitacoraEpp,
      { slug: "rescate-montana", nombre: "Certificación de rescate en montaña", porQue: "A esa altura la ayuda externa tarda horas. El rescate empieza con el guía.", vence: true },
      { slug: "comunicacion-satelital", nombre: "Comunicación satelital", porQue: "Arriba no hay señal celular.", vence: false },
      { slug: "plan-aclimatacion", nombre: "Plan de aclimatación", porQue: "El mal de montaña se previene con perfil de ascenso, no con voluntad.", vence: false }],
    generalesRelevantes: ["poliza-gm", "poliza-rc"] },

  { slug: "escalada", nombre: "Escalada en roca", norma: NOM09,
    documentos: [cred("escalada"), bitacoraEpp,
      { slug: "revision-anclajes", nombre: "Revisión de anclajes fijos", porQue: "Un anclaje que lleva años puesto no es un anclaje vigente.", vence: true }],
    generalesRelevantes: ["poliza-gm"] },

  { slug: "rappel", nombre: "Rappel", norma: NOM09,
    documentos: [cred("rappel"), bitacoraEpp,
      { slug: "doble-aseguramiento", nombre: "Protocolo de doble aseguramiento", porQue: "Un solo punto de falla no puede ser el plan.", vence: false }],
    generalesRelevantes: [] },

  { slug: "canonismo", nombre: "Cañonismo", norma: NOM09,
    documentos: [cred("cañonismo"), bitacoraEpp,
      { slug: "neopreno", nombre: "Trajes de neopreno y su estado", porQue: "La hipotermia es el riesgo silencioso del cañón.", vence: false },
      { slug: "pronostico-hidrologico", nombre: "Consulta de pronóstico hidrológico el día de la salida", porQue: "Una crecida río arriba llega sin avisar. Se consulta el mismo día, no la semana anterior.", vence: false },
      { slug: "plan-escape", nombre: "Plan de escape por tramo", porQue: "Por dónde se sale si el cañón deja de ser transitable.", vence: false }],
    generalesRelevantes: ["poliza-gm"] },

  { slug: "rafting", nombre: "Descenso de ríos (rafting)", norma: NOM09,
    documentos: [cred("descenso de ríos"),
      { slug: "rescate-aguas-rapidas", nombre: "Certificación de rescate en aguas rápidas", porQue: "Rescatar en corriente no se improvisa ni se parece a nadar.", vence: true },
      { slug: "chalecos", nombre: "Chalecos salvavidas certificados y su bitácora", porQue: "La flotación se degrada con el sol y el uso.", vence: false },
      { slug: "revision-balsas", nombre: "Revisión de balsas", porQue: "Cámaras, amarres y línea de vida. Una balsa que pierde aire a medio rápido no se repara ahí.", vence: false },
      { slug: "clase-rio", nombre: "Clasificación declarada del río", porQue: "Un río clase IV no admite al mismo grupo que un clase II.", vence: false }],
    generalesRelevantes: ["poliza-gm", "poliza-rc"] },

  { slug: "kayak", nombre: "Kayak de mar o lago", norma: NOM09,
    documentos: [cred("kayak"),
      { slug: "chalecos", nombre: "Chalecos salvavidas certificados", porQue: "Con talla adecuada a cada persona: un chaleco grande de más se sale por la cabeza.", vence: false },
      { slug: "radio-vhf", nombre: "Radio VHF", porQue: "Es el canal por el que se pide ayuda en el agua.", vence: false },
      { slug: "plan-mareas", nombre: "Plan de mareas y viento", porQue: "El viento de la tarde decide si se puede volver remando.", vence: false }],
    generalesRelevantes: ["poliza-gm"] },

  // Snorkel y apnea (buceo libre): nadar con cardúmenes, marlin, móbulas o
  // ballenas desde una panga, sin tanque. Nació el 29 sep 2026 con el Sardine
  // Run de Bahía Magdalena. NO es buceo autónomo (sin tanques ni cámara
  // hiperbárica), pero sí es mar abierto desde embarcación: lo que se pide es
  // la flotación, la radio, el plan de mar y la embarcación en regla.
  { slug: "snorkel", nombre: "Snorkel y apnea (buceo libre)", norma: NOM09,
    documentos: [cred("buceo libre"),
      { slug: "flotacion", nombre: "Chalecos o equipo de flotación certificados", porQue: "En mar abierto, quien se cansa o se marea necesita flotar sin esfuerzo. Con talla para cada persona.", vence: false },
      { slug: "radio-vhf", nombre: "Radio VHF en la embarcación", porQue: "Es el canal por el que se pide ayuda en el agua.", vence: false },
      { slug: "plan-mar", nombre: "Plan de mar: clima, corrientes y punto de retorno", porQue: "El viento y la corriente deciden si se entra al agua y hasta dónde. Se consulta el mismo día, no la semana anterior.", vence: false },
      { slug: "embarcacion", nombre: "Matrícula de la embarcación y libreta de mar del capitán", porQue: "La panga y quien la lleva tienen que estar registrados ante la autoridad marítima.", vence: true },
      { slug: "protocolo-agua", nombre: "Protocolo de conteo y rescate en el agua", porQue: "Cuántos entran, cuántos salen, quién vigila desde la panga y cómo se recupera a alguien en apuros.", vence: false }],
    generalesRelevantes: ["poliza-gm"] },

  { slug: "buceo", nombre: "Buceo autónomo", norma: "NOM-05-TUR-2003 y NOM-012-TUR",
    documentos: [cred("buceo"),
      { slug: "cert-agencia", nombre: "Certificación de agencia del guía (PADI, NAUI, SSI o CMAS)", porQue: "Vigente. La NOM-05 obliga a guías con credencial reconocida.", vence: true },
      { slug: "hidrostatica-tanques", nombre: "Prueba hidrostática y visual de tanques", porQue: "Un tanque sin prueba vigente es una bomba de aire comprimido.", vence: true },
      { slug: "mantenimiento-reguladores", nombre: "Mantenimiento de reguladores y compresor", porQue: "El regulador es lo que entrega el aire. Su servicio es anual y lo hace un técnico, no el guía.", vence: true },
      { slug: "analisis-aire", nombre: "Análisis de calidad de aire", porQue: "Un compresor mal ubicado mete monóxido al tanque.", vence: true },
      { slug: "oxigeno-emergencia", nombre: "Oxígeno de emergencia", porQue: "Es el primer tratamiento de un accidente de descompresión.", vence: false },
      { slug: "camara-hiperbarica", nombre: "Plan con la cámara hiperbárica más cercana", porQue: "Dónde está, cuánto se tarda en llegar y a quién se le avisa.", vence: false },
      { slug: "seguro-buceo", nombre: "Seguro específico de buceo", porQue: "Los gastos médicos generales suelen excluir la actividad subacuática.", vence: true }],
    generalesRelevantes: ["poliza-rc", "poliza-gm"] },

  { slug: "buceo-cavernas", nombre: "Buceo en cavernas", norma: "NOM-05-TUR-2003 y NOM-012-TUR",
    documentos: [cred("buceo en cavernas"),
      { slug: "cert-cuevas", nombre: "Certificación específica de cuevas", porQue: "En caverna no existe el ascenso directo a superficie.", vence: true },
      { slug: "lineas-guia", nombre: "Líneas guía y carretes", porQue: "La línea es el único camino de vuelta si se pierde visibilidad.", vence: false },
      { slug: "regla-tercios", nombre: "Regla de tercios documentada", porQue: "Un tercio para entrar, uno para salir, uno de reserva.", vence: false }],
    generalesRelevantes: ["poliza-rc", "poliza-gm"] },

  { slug: "espeleismo", nombre: "Espeleísmo", norma: NOM09,
    documentos: [cred("espeleísmo"),
      { slug: "triple-luz", nombre: "Triple fuente de luz por persona", porQue: "Quedarse a oscuras dentro de una cueva es el escenario a evitar.", vence: false },
      bitacoraEpp,
      { slug: "permiso-predio", nombre: "Permiso del propietario o autoridad", porQue: "Casi toda cueva mexicana está en tierra ejidal o privada. Sin permiso, la salida es una invasión.", vence: true },
      { slug: "permiso-inah", nombre: "Permiso INAH si hay vestigios", porQue: "Muchas cuevas mexicanas tienen material arqueológico y entrar sin permiso es delito.", vence: true }],
    generalesRelevantes: [] },

  { slug: "ciclismo-montana", nombre: "Ciclismo de montaña", norma: NOM09,
    documentos: [cred("ciclismo de montaña"),
      { slug: "cascos", nombre: "Cascos certificados", porQue: "Con fecha de fabricación visible: el poliestireno se degrada aunque el casco se vea entero.", vence: false },
      { slug: "mantenimiento-mecanico", nombre: "Bitácora de mantenimiento mecánico", porQue: "Frenos y transmisión revisados antes de cada salida.", vence: false },
      { slug: "vehiculo-apoyo", nombre: "Vehículo de apoyo", porQue: "Para sacar a quien no pueda seguir pedaleando.", vence: false }],
    generalesRelevantes: ["poliza-gm"] },

  { slug: "cabalgata", nombre: "Cabalgata",
    documentos: [
      { slug: "veterinario", nombre: "Certificado veterinario y de herrería vigente", porQue: "Un animal lastimado o mal herrado es un riesgo para quien lo monta.", vence: true },
      { slug: "monturas", nombre: "Revisión de monturas", porQue: "Cinchas y estribos. Una cincha floja tira al jinete y lastima al animal.", vence: false },
      { slug: "cascos-jinete", nombre: "Cascos para jinetes", porQue: "La caída de caballo es la lesión más común de la actividad y casi siempre es de cabeza.", vence: false },
      { slug: "manejo-animal", nombre: "Plan de manejo animal", porQue: "Carga de trabajo, descanso y sombra de los animales.", vence: false }],
    generalesRelevantes: ["poliza-rc", "poliza-gm"] },

  { slug: "observacion-naturaleza", nombre: "Observación de naturaleza", norma: NOM09,
    documentos: [cred("turismo de naturaleza"),
      { slug: "distancias-minimas", nombre: "Distancias mínimas de aproximación", porQue: "Acercarse de más estresa a la fauna y cambia su conducta.", vence: false },
      { slug: "permiso-anp", nombre: "Permiso de área natural protegida", porQue: "Si la salida entra a un ANP.", vence: true }],
    generalesRelevantes: [] },

  { slug: "micologia", nombre: "Recolección micológica",
    documentos: [
      { slug: "guia-micologo", nombre: "Guía micólogo identificable y su respaldo académico", porQue: "La diferencia entre un hongo comestible y uno mortal la sostiene una persona con nombre.", vence: false },
      { slug: "protocolo-identificacion", nombre: "Protocolo de identificación y descarte", porQue: "Qué se hace con lo que no se identifica con certeza: se descarta.", vence: false },
      { slug: "permiso-ejido", nombre: "Permiso del ejido o propietario", porQue: "El hongo es del monte y el monte tiene dueño. También define cuánto se puede recolectar.", vence: true }],
    generalesRelevantes: [] },

  { slug: "campamento", nombre: "Campamento y pernocta",
    documentos: [
      { slug: "permiso-predio", nombre: "Permiso del predio", porQue: "Pernoctar es distinto de pasar: se pide por escrito y dice hasta cuántas personas.", vence: true },
      { slug: "residuos-agua", nombre: "Manejo de residuos y agua", porQue: "Qué entra, qué sale y de dónde se bebe.", vence: false },
      { slug: "protocolo-fogata", nombre: "Protocolo de fogata y su prohibición por temporada", porQue: "En temporada de estiaje la fogata simplemente no se enciende.", vence: false },
      { slug: "plan-nocturno", nombre: "Plan nocturno de emergencia", porQue: "Evacuar de noche no se parece a evacuar de día.", vence: false }],
    generalesRelevantes: [] },

  { slug: "paracaidismo", nombre: "Paracaidismo",
    documentos: [
      { slug: "licencia-fmp", nombre: "Licencia de la Federación Mexicana de Paracaidismo", porQue: "Acredita al instructor para saltar en tándem con alguien sin experiencia.", vence: true },
      { slug: "aeronavegabilidad", nombre: "Certificado de aeronavegabilidad AFAC de la aeronave", porQue: "El avión es parte de la actividad. Sin certificado vigente no puede volar con pasajeros.", vence: true },
      { slug: "licencia-piloto", nombre: "Licencia vigente del piloto", porQue: "Con la habilitación para la aeronave que opera y su certificado médico al día.", vence: true },
      { slug: "empacador", nombre: "Empacador certificado y bitácora del paracaídas de reserva", porQue: "La reserva es el último recurso y sólo sirve si alguien certificado la dobló y lo anotó.", vence: true },
      { slug: "seguro-paracaidismo", nombre: "Seguro específico de la actividad", porQue: "Casi todas las pólizas generales excluyen el vuelo.", vence: true }],
    generalesRelevantes: ["poliza-rc", "poliza-gm"] },
];

// ── Consultas ────────────────────────────────────────────────────────────────

const PORSLUG = new Map(ACTIVIDADES.map((a) => [a.slug, a]));
export const actividadPorSlug = (slug: string): Actividad | null => PORSLUG.get(slug) ?? null;

const GEN_PORSLUG = new Map(GENERALES.map((d) => [d.slug, d]));
export const generalPorSlug = (slug: string): Documento | null => GEN_PORSLUG.get(slug) ?? null;

/** El nombre legible de un slug, para pantallas y correos. Nunca revienta. */
export const nombreDeActividad = (slug: string): string => PORSLUG.get(slug)?.nombre ?? slug;

/**
 * Todo lo que una actividad necesita, en el orden en que se pinta: primero lo
 * suyo, luego los generales que le tocan marcados como ya cubiertos.
 */
export function requisitosDe(slug: string): {
  propios: Documento[];
  generales: Documento[];
} {
  const a = PORSLUG.get(slug);
  if (!a) return { propios: [], generales: [] };
  return {
    propios: a.documentos,
    generales: a.generalesRelevantes.map(generalPorSlug).filter((d): d is Documento => d !== null),
  };
}
