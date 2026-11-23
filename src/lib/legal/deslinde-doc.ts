// Ensamblador del DESLINDE por experiencia, data-driven. El marco legal genérico
// (E–J del documento maestro) es igual para toda experiencia y NO depende del
// entorno (mar, bosque, montaña); lo ESPECÍFICO entra por las cláusulas-resumen
// que el admin cura en la experiencia (declaraciones, riesgos, compromisos). Así
// el deslinde se genera SOLO al activar el registro — sin PDF manual ni URLs.
import type { Experience, V2Hero } from "@/lib/experiences/types";
import { textosDeClausulas } from "@/lib/legal/clausulas";
import { SEGURO } from "@/lib/legal/clausulas-estandar";

export const ENTIDAD = {
  razonSocial: "NUMAN HUB, S.A. de C.V.",
  marca: "Caminante",
  rfc: "NHU250826CS8",
  domicilio:
    "Calle Prado Norte 525, Int. 204, Lomas de Chapultepec I Sección, Miguel Hidalgo, C.P. 11000, Ciudad de México",
  rnt: "En trámite",
  contacto: "uno@numanhub.com",
  whatsapp: "+52 55 1202 0565",
};

// Secciones GENÉRICAS del marco legal (E–J del maestro), redactadas sin sesgo de
// entorno. Fieles al documento legal; lo específico va en las cláusulas.
export const SECCIONES_GENERICAS: { titulo: string; paras: string[] }[] = [
  {
    titulo: "Seguro y gastos médicos",
    paras: [
      "El Organizador NO proporciona seguro de gastos médicos, accidentes personales ni de vida para esta experiencia. El participante declara entender que:",
      "1. Es su responsabilidad exclusiva contar con un seguro propio de gastos médicos y/o accidentes personales que cubra actividades al aire libre. El Organizador lo recomienda enfáticamente.",
      "2. En caso de emergencia médica, autoriza al Organizador a gestionar en su nombre la atención médica necesaria, incluyendo traslado y hospitalización.",
      "3. Todos los costos de atención médica, evacuación, traslado u hospitalización serán cubiertos por el participante o sus familiares.",
    ],
  },
  {
    titulo: "Deslinde de responsabilidad",
    paras: [
      "Con pleno conocimiento de los riesgos descritos, el participante libera al Organizador — NUMAN HUB, S.A. de C.V., su equipo, guías, colaboradores, proveedores y representantes — de toda responsabilidad civil o administrativa derivada de cualquier incidente, accidente, lesión, enfermedad, daño o pérdida que pudiera sufrir durante la experiencia, incluyendo el traslado hacia y desde el punto de encuentro, SALVO en casos de dolo o negligencia grave comprobada del Organizador, conforme a la legislación mexicana.",
      "La responsabilidad total del Organizador se limita, en cualquier caso, al monto pagado por el participante por esta experiencia. El Organizador no responde por daños indirectos, consecuentes o punitivos, ni por pérdida o robo de pertenencias.",
    ],
  },
  {
    titulo: "Uso de imagen",
    paras: [
      "Según lo seleccionado en el formulario de registro, el participante autoriza —o no— al Organizador a captar y usar fotografías y video donde aparezca, con fines promocionales, editoriales y de redes sociales de Caminante y Numan, sin límite de tiempo ni territorio y sin compensación económica. Quien no desee aparecer en material promocional lo indica en el registro; el Organizador hará esfuerzos razonables por excluirle, sin poder garantizar exclusión total dado el carácter grupal.",
    ],
  },
  {
    titulo: "Menores de edad (si aplica)",
    paras: [
      "El padre, madre o tutor identificado en el formulario de registro declara respecto del menor registrado que: (1) autoriza su participación en la experiencia; (2) las declaraciones y compromisos aplican al menor bajo su responsabilidad; (3) acepta el deslinde en su nombre; (4) el perfil médico del menor proporcionado en el registro es veraz y completo, incluyendo las dosis de medicamentos indicadas por su médico; (5) el menor permanecerá bajo su supervisión durante toda la experiencia, incluyendo las actividades de mayor riesgo.",
    ],
  },
  {
    titulo: "Datos personales",
    paras: [
      "Los datos recabados en el registro (incluyendo datos de salud, que son datos personales sensibles) serán tratados por NUMAN HUB, S.A. de C.V. únicamente para: gestionar la participación en la experiencia, garantizar la seguridad del participante, contactar en caso de emergencia y, solo con consentimiento expreso, enviar información de futuras experiencias. No se comparten con terceros salvo los estrictamente necesarios para la operación (transporte, alimentación, guías) o requerimiento legal. Derechos ARCO: uno@numanhub.com. (Conforme a la LFPDPPP.)",
    ],
  },
  {
    titulo: "Aceptación",
    paras: [
      "Al marcar la casilla de aceptación y escribir su nombre completo en el formulario de registro, el participante manifiesta que leyó, comprendió y acepta íntegramente esta Carta de Responsabilidad Compartida y Deslinde de Responsabilidad, y que dicha aceptación electrónica tiene plenos efectos como expresión de su consentimiento (artículos 1803 y 1834 bis del Código Civil Federal y 89 y siguientes del Código de Comercio sobre mensajes de datos). Nombre completo (firma): el capturado en el formulario. Fecha: la del registro electrónico (timestamp del formulario).",
    ],
  },
];

// ── EL MARCO CORREGIDO (D28 de legal, §3) ───────────────────────────────────
//
// El marco de arriba repite en largo lo que la lista resume, y dice dos cosas
// que para una operadora con convenio serían falsas: que organiza NUMAN HUB y
// que no se proporciona seguro. El corregido:
//   a) nombra en el encabezado a quien de verdad vende (`QuienOrganiza`);
//   b) su sección de seguro sigue la variante de la cláusula 9;
//   c) «Deslinde de responsabilidad» pasa a «Asunción de riesgos y
//      responsabilidad»: se asumen los riesgos inherentes, y la liberación no
//      alcanza el dolo, la negligencia de los guías ni el equipo inadecuado.
//
// ⚠️ RIGE SÓLO PARA EXPERIENCIAS NUEVAS (`registration.marco === 2`, que pone
// el alta rápida). Las publicadas conservan el marco con el que se firmaron;
// pasarlas al corregido es una decisión de Luis y pide versión nueva del
// deslinde (D28 §4). Los textos son de legal, transcritos.

const SEGURO_CON = {
  titulo: "Seguro y gastos médicos",
  paras: [
    "Esta salida cuenta con un seguro de accidentes contratado por el Organizador. Su cobertura, sus límites y sus exclusiones son los de la póliza, que el Organizador exhibe a quien la pida. Lo que la póliza no cubra o exceda corre por cuenta del participante. En una emergencia, el participante autoriza al Organizador a gestionar en su nombre la atención médica, el traslado y la evacuación necesarios.",
  ],
};

/** «Sin seguro: el texto de hoy, sin la palabra "enfáticamente"». */
const SEGURO_SIN = {
  titulo: "Seguro y gastos médicos",
  paras: SECCIONES_GENERICAS[0].paras.map((t) => t.replace("El Organizador lo recomienda enfáticamente.", "El Organizador lo recomienda.")),
};

const ASUNCION = {
  titulo: "Asunción de riesgos y responsabilidad",
  paras: [
    "Con pleno conocimiento de los riesgos descritos, el participante los asume y libera al Organizador y a Caminante (NUMAN HUB, S.A. de C.V.), a sus guías, colaboradores, proveedores y representantes, de responsabilidad por los daños que deriven de esos riesgos inherentes, del estado de salud del participante, de su propia conducta o de no seguir las instrucciones, incluidos los traslados hacia y desde el punto de encuentro. Esta liberación no alcanza los daños causados por dolo, por negligencia de los guías o por el uso de equipo inadecuado, de los que el Organizador responde conforme a la legislación mexicana.",
    "Tratándose de daños patrimoniales (pérdida, robo o deterioro de pertenencias, gastos de viaje, conexiones perdidas y similares), la responsabilidad del Organizador y de Caminante se limita al monto pagado por el participante por esta experiencia. Este límite no aplica a daños a la persona.",
  ],
};

/** La sección de datos personales del marco corregido (D28 §3 d): sustituye completa a la de siempre. */
const DATOS_PERSONALES_2 = {
  titulo: "Datos personales",
  paras: [
    "Los datos recabados en el registro los trata NUMAN HUB, S.A. de C.V., responsable de la plataforma Caminante, conforme a su Aviso de Privacidad, únicamente para gestionar la participación en la experiencia, cuidar la seguridad del participante, contactar a quien señaló en caso de emergencia y, sólo con su consentimiento expreso, enviarle información de futuras experiencias. Los datos de salud son datos personales sensibles: el participante consiente de manera expresa que se traten y se compartan con el Organizador y sus guías, con la única finalidad de cuidar su seguridad durante la experiencia y atenderlo en una emergencia, y se suprimen al concluir la salida, salvo obligación legal de conservarlos. Los demás datos no se comparten con terceros, salvo los estrictamente necesarios para operar la salida (transporte, alimentación, hospedaje y aseguradora) o por requerimiento legal. Derechos de acceso, rectificación, cancelación y oposición: caminante@numanhub.com.",
  ],
};

const seccion = (titulo: string) => SECCIONES_GENERICAS.find((x) => x.titulo === titulo) as { titulo: string; paras: string[] };

/** Las secciones del marco corregido, con la variante de seguro que le toca a la experiencia. */
export function seccionesDelMarco2(conSeguro: boolean): { titulo: string; paras: string[] }[] {
  const imagen = seccion("Uso de imagen");
  return [
    conSeguro ? SEGURO_CON : SEGURO_SIN,
    ASUNCION,
    { titulo: imagen.titulo, paras: imagen.paras.map((t) => t.replace("de Caminante y Numan", "del Organizador, Caminante y Numan")) },
    seccion("Menores de edad (si aplica)"),
    DATOS_PERSONALES_2,
    seccion("Aceptación"),
  ];
}

/**
 * Quién responde frente al participante (D22): la casa; una operadora con
 * convenio firmado, que vende a nombre propio; o una operadora sin convenio,
 * donde vende NUMAN y ella opera en campo.
 */
export type QuienOrganiza =
  | { tipo: "casa" }
  | { tipo: "operadora"; nombre: string; rfc: string | null }
  | { tipo: "sin-convenio"; nombre: string };

/** El renglón «Organiza» del encabezado y, si aplica, el de «Opera en campo». */
export function renglonesDeQuienOrganiza(q: QuienOrganiza): { organiza: string; operaEnCampo: string | null } {
  if (q.tipo === "operadora") {
    return {
      organiza: `${q.nombre}${q.rfc ? `, RFC ${q.rfc}` : ""}, a través de la plataforma Caminante, de NUMAN HUB, S.A. de C.V. (en adelante “el Organizador”).`,
      operaEnCampo: null,
    };
  }
  return {
    organiza: "NUMAN HUB, S.A. de C.V., bajo la marca Caminante (en adelante “el Organizador”).",
    operaEnCampo: q.tipo === "sin-convenio" ? q.nombre : null,
  };
}

function nombreExp(exp: Experience): string {
  const hero = exp.page?.blocks?.find((b) => b.type === "hero") as V2Hero | undefined;
  const t = [hero?.title, hero?.titleAccent].filter(Boolean).join(" ").trim();
  return (t || exp.cardTitle || exp.slug || "Experiencia").replace(/\*\*/g, "").trim();
}

export type DeslindeDoc = {
  titulo: string;
  experiencia: string;
  ubicacion: string;
  version: string;
  clausulas: string[];
  secciones: { titulo: string; paras: string[] }[];
  /** 2 = el marco corregido de D28: el encabezado nombra a quien vende. Sin él, el de siempre. */
  marco?: 2;
};

// Devuelve el documento listo para renderizar, o null si el registro no está
// activo o no tiene cláusulas (entonces no hay deslinde que mostrar).
export function buildDeslinde(exp: Experience | null | undefined): DeslindeDoc | null {
  const reg = exp?.registration;
  const clausulas = textosDeClausulas(reg?.waiverClauses);
  if (!exp || !reg?.active || clausulas.length === 0) return null;
  const ubic = (exp.cardPloc || (exp as unknown as { estado?: string }).estado || "").toString().trim();
  // El CONTACTO BASE va como sección propia del documento, no como una viñeta
  // más: es lo que alguien busca cuando algo salió mal, y en ese momento no va a
  // leer la lista entera. Solo aparece si está capturado — un teléfono a medias
  // en un deslinde es peor que ninguno.
  const base = exp.baseContact;
  const contactoBase =
    base && (base.nombre?.trim() || base.telefono?.trim())
      ? [
          {
            titulo: "Contacto durante la experiencia",
            paras: [
              `Durante la salida, la persona de contacto que NO participa en ella y permanece localizable es ${[base.nombre?.trim(), base.rol?.trim() ? `(${base.rol.trim()})` : ""].filter(Boolean).join(" ")}${base.telefono?.trim() ? `, teléfono ${base.telefono.trim()}` : ""}. Tiene el itinerario y la lista de participantes, y es a quien pueden llamar los familiares del participante en caso de emergencia.`,
            ],
          },
        ]
      : [];

  // El marco corregido sólo en las experiencias que nacieron con él. La
  // variante de seguro se lee de la propia lista: la sección y la cláusula 9
  // no pueden decir cosas distintas.
  const marco2 = reg.marco === 2;
  return {
    titulo: "Carta de Responsabilidad Compartida y Deslinde de Responsabilidad",
    experiencia: nombreExp(exp),
    ubicacion: ubic,
    version: reg.waiverVersion?.trim() || "v1",
    clausulas,
    secciones: [...contactoBase, ...(marco2 ? seccionesDelMarco2(clausulas.includes(SEGURO.con)) : SECCIONES_GENERICAS)],
    ...(marco2 ? { marco: 2 as const } : {}),
  };
}
