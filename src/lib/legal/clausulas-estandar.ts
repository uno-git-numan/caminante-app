// EL RESUMEN ESTÁNDAR DEL DESLINDE (D28 de legal, 19 nov 2026;
// design/legal/DESLINDE-ESTANDAR-2026-11-19.md).
//
// ⚠️ ESTE TEXTO ES DE LEGAL, NO DE CÓDIGO. Está transcrito tal cual de su
// documento y una prueba compara cada cláusula contra él: si legal cambia una
// palabra, se cambia allá primero y aquí después. Código no redacta cláusulas.
//
// Lo usa el alta rápida (lib/experiences/corta.ts): una experiencia nueva nace
// con esta lista, más las adicionales de su actividad. Las experiencias que ya
// existían conservan la suya; corregirlas es una decisión de Luis (D28 §4).
//
// Dos cláusulas tienen variante, y las dos salen de un HECHO, no de un gusto:
//   · 9 · Seguro. La regla de legal era «con seguro» en toda experiencia de
//     una operadora con convenio firmado (la póliza de accidentes era
//     obligatoria por convenio y se pedía en el expediente). Desde el 24 nov
//     2026 la plataforma ya no pide esa póliza (decisión de Luis), así que
//     hoy NADIE nace «con seguro»: el hecho lo decide `quienCrea`
//     (experiences/corta-actions.ts). El texto tiene que decir la verdad.
//   · 13 · Menores. Sale de la edad mínima de la experiencia.
//
// Una actividad que no esté en `POR_ACTIVIDAD` no tiene adicionales escritas:
// `clausulasEstandar` devuelve null y la experiencia nace con el deslinde
// apagado, hasta que legal las escriba. No se publica un deslinde a medias.
//
// ⚠️ PARACAIDISMO queda fuera A PROPÓSITO. Legal escribió su cláusula pero sin
// leer la regulación aeronáutica: esa experiencia sólo se publica con la carta
// propia de la operadora fusionada, y la fusión vive en el editor completo. En
// el alta rápida nace con el deslinde apagado y se completa allá.

import type { Clausula } from "@/lib/legal/clausulas";

/** Cláusulas 1 a 8. */
export const DE_LA_1_A_LA_8: string[] = [
  "Participas de forma libre y voluntaria y declaras, bajo protesta de decir verdad, que estás en condiciones físicas y mentales adecuadas para las actividades de esta experiencia y para el nivel de exigencia que se te informó.",
  "Informaste de manera veraz y completa tu perfil médico en el registro: padecimientos, alergias, medicamentos y restricciones. Si omites o falseas esa información, sus consecuencias son tu responsabilidad.",
  "No participarás cansado, desvelado ni bajo la influencia de alcohol o drogas.",
  "Reconoces que esta experiencia ocurre en un entorno natural no controlado y tiene riesgos que no pueden eliminarse por completo: caídas, golpes, torceduras, fracturas y cortaduras; deshidratación, insolación, golpe de calor o hipotermia; reacciones alérgicas; contacto con fauna, insectos y plantas; cambios súbitos de clima; accidentes durante los traslados; y daño o pérdida de pertenencias. Aceptas que pueden tener consecuencias graves, incluidas lesiones permanentes o la muerte.",
  "Entiendes que la experiencia puede ocurrir lejos de servicios médicos y sin señal de teléfono, y que la atención de una emergencia o una evacuación pueden tardar.",
  "Te comprometes a atender la plática de seguridad antes de iniciar, a seguir en todo momento el plan y las instrucciones de los guías, y a usar completo el equipo de seguridad que se te indique.",
  "Te comprometes a cuidar el entorno y a las personas: no dejar rastro, no extraer ni dañar flora, fauna u objetos, no alimentar ni perseguir animales, y respetar a guías, participantes y comunidades locales.",
  "Aceptas que el guía puede modificar, acortar o suspender una actividad por clima, condiciones del terreno o del agua, cierre de accesos o seguridad, y que puede impedirte continuar si tu estado o tu conducta ponen en riesgo a alguien. Un cambio por seguridad no da derecho a reembolso cuando la experiencia se presta en lo sustancial; si la salida se cancela, aplica la política de cancelación que aceptaste al pagar.",
];

/** Cláusula 9 · Seguro. Depende de un hecho: si la salida lleva póliza de accidentes. */
export const SEGURO = {
  con: "Esta salida cuenta con un seguro de accidentes contratado por el Organizador. Cubre lo que dice su póliza, con sus límites y exclusiones; lo que no cubra o exceda corre por tu cuenta. Te recomendamos contar además con un seguro propio de gastos médicos.",
  sin: "El Organizador no proporciona seguro de accidentes ni de gastos médicos a tu favor. Es tu responsabilidad contar con uno propio que cubra esta actividad. Los costos de atención médica, traslado, rescate u hospitalización corren por tu cuenta.",
} as const;

/** Cláusulas 10 a 12. */
export const DE_LA_10_A_LA_12: string[] = [
  "En una emergencia, autorizas al Organizador a gestionar en tu nombre la atención médica, el traslado y la evacuación que hagan falta, y a avisar al contacto de emergencia que diste en el registro.",
  "Asumes los riesgos inherentes que aquí se describen y liberas al Organizador y a Caminante (NUMAN HUB, S.A. de C.V.), a sus guías, colaboradores y proveedores, de responsabilidad por los daños que deriven de esos riesgos, de tu estado de salud, de tu propia conducta o de no seguir las instrucciones. Esta liberación no alcanza los daños causados por dolo, por negligencia de los guías o por equipo inadecuado, de los que el Organizador responde conforme a la ley.",
  "Tratándose de daños patrimoniales, como pérdida, robo o deterioro de pertenencias, gastos de viaje o conexiones perdidas, la responsabilidad del Organizador y de Caminante se limita al monto que pagaste por esta experiencia. Este límite no aplica a daños a tu persona.",
];

/** Cláusula 13 · Menores. Sale de la edad mínima de la experiencia. */
export const MENORES = {
  /** Edad mínima menor de 18. */
  admite: "Si registras a una persona menor de edad, declaras ser su madre, padre o tutor, autorizas su participación, aceptas esta carta en su nombre y te comprometes a acompañarla y supervisarla durante toda la experiencia.",
  /** Edad mínima de 18 o más. */
  soloAdultos: "Declaras ser mayor de 18 años. Esta experiencia no admite participantes menores de edad.",
} as const;

/** Cláusulas 14 a 16. */
export const DE_LA_14_A_LA_16: string[] = [
  "Tus datos personales los trata NUMAN HUB, S.A. de C.V. conforme a su Aviso de Privacidad, para gestionar tu participación, cuidar tu seguridad y contactar a quien señalaste en caso de emergencia. Puedes ejercer tus derechos en caminante@numanhub.com.",
  "De manera específica y por separado, consientes que tus datos de salud (padecimientos, alergias, medicamentos y restricciones alimentarias) se traten y se compartan con el Organizador y sus guías, con la única finalidad de cuidar tu seguridad durante la experiencia y atenderte en una emergencia. Se suprimen al concluir la salida, salvo obligación legal de conservarlos.",
  "Leíste y aceptas íntegramente esta Carta de Responsabilidad Compartida y Deslinde. Marcar la casilla y escribir tu nombre completo en el registro es tu firma y tiene plenos efectos legales como tu consentimiento.",
];

/** Las dos que el participante ELIGE: van marcadas como opcionales. */
export const OPCIONALES: string[] = [
  "Decides si autorizas que se capten y usen fotografías y video donde aparezcas, con fines promocionales y editoriales del Organizador, de Caminante y de Numan. Negarte no te impide participar; por el carácter grupal no puede garantizarse tu exclusión total.",
  "Decides si quieres recibir información sobre futuras experiencias.",
];

const BUCEO =
  "Bucearás con equipo autónomo. Aceptas los riesgos de barotrauma, de enfermedad por descompresión, de narcosis, de falla del equipo y de ahogamiento. Declaras que tu certificación de buceo está vigente y que informaste con verdad tu nivel, la fecha de tu última inmersión y tu estado de salud para bucear. Te comprometes a respetar el plan de inmersión, a tu compañero y el tiempo de espera antes de volar que indique el guía.";

/** Las adicionales de cada actividad (slug de `lib/operadores/actividades.ts`). */
export const POR_ACTIVIDAD: Record<string, string[]> = {
  senderismo: [
    "Caminarás por terreno irregular y con desnivel. Aceptas el riesgo de caídas y de extraviarte si te separas, y te comprometes a no salir del sendero ni separarte del grupo sin avisar al guía.",
  ],
  "alta-montana": [
    "Subirás a gran altitud. Aceptas los riesgos del mal de montaña y sus formas graves, del frío extremo, la hipotermia y las congelaciones, de la caída de rocas y de las tormentas eléctricas. Declaras no tener una condición cardiaca o respiratoria que no hayas informado. Aceptas que el guía puede ordenar el regreso antes de la cumbre: la cumbre no está garantizada.",
  ],
  campamento: [
    "Pasarás la noche a la intemperie o en instalaciones sin servicios. Aceptas los riesgos del frío nocturno, del fuego y de la fauna, y te comprometes a seguir las reglas de fogata y de manejo de alimentos y residuos que indique el guía.",
  ],
  escalada: [
    "Escalarás en roca. Aceptas los riesgos de caída desde altura, de golpes contra la pared, de caída de piedras y del uso incorrecto del equipo. Te comprometes a usar casco y arnés en todo momento, a no soltarte del aseguramiento y a que el guía revise tu equipo antes de cada maniobra.",
  ],
  rappel: [
    "Descenderás con cuerda. Aceptas los riesgos de caída desde altura, de golpes contra la pared, de caída de piedras y del uso incorrecto del equipo. Te comprometes a usar casco y arnés en todo momento, a no soltarte del aseguramiento y a que el guía revise tu equipo antes de cada descenso.",
  ],
  canonismo: [
    "Descenderás un cañón con agua. Aceptas los riesgos de las corrientes, los saltos y las pozas de agua fría, de los resbalones y golpes sobre roca, de la hipotermia y de las crecidas súbitas. Declaraste tu nivel real de nado en el registro y te comprometes a no saltar ni deslizarte sin la indicación del guía.",
  ],
  rafting: [
    "Descenderás un río en balsa. Aceptas los riesgos de volcadura, de nadar en aguas rápidas, de golpes contra rocas y de quedar atrapado bajo el agua. Declaraste tu nivel real de nado en el registro y te comprometes a llevar chaleco y casco puestos todo el tiempo que estés en el río.",
  ],
  kayak: [
    "Remarás en mar o lago. Aceptas los riesgos de volcadura, del viento, las corrientes y las mareas, y de la hipotermia por inmersión. Declaraste tu nivel real de nado en el registro y te comprometes a llevar el chaleco puesto y a no alejarte del grupo.",
  ],
  snorkel: [
    "Nadarás en aguas abiertas. Aceptas los riesgos de ahogamiento, de las corrientes y el oleaje, del contacto con fauna marina, del mareo y los golpes en la embarcación y de la exposición prolongada al sol. Declaraste tu nivel real de nado en el registro, usarás el equipo de flotación cuando se te indique, no tocarás ni perseguirás a la fauna y no consumirás alcohol antes de entrar al agua ni de navegar.",
  ],
  buceo: [BUCEO],
  "buceo-cavernas": [
    BUCEO,
    "Bucearás en un ambiente cerrado. Aceptas el riesgo de desorientación y de no poder subir directo a la superficie. Te comprometes a no rebasar los límites que marque el guía ni soltar la línea guía.",
  ],
  cabalgata: [
    "Montarás a caballo. Aceptas que es un animal de reacciones imprevisibles y los riesgos de caídas, patadas y mordidas. Informaste tu peso y tu experiencia montando, y te comprometes a usar el casco cuando se te indique y a no adelantar ni separarte de la fila.",
  ],
  micologia: [
    "Recolectarás hongos silvestres con fines educativos. Entiendes que hay especies tóxicas y mortales: no consumirás ni te llevarás ningún hongo sin la validación expresa de los guías especialistas, y sólo comerás los alimentos preparados por el equipo. Informaste tus alergias alimentarias en el registro.",
  ],
  espeleismo: [
    "Entrarás a una cueva. Aceptas los riesgos de la oscuridad y los espacios cerrados, de resbalones, caídas y caída de rocas, de la hipotermia, de las crecidas de agua por lluvia, del aire viciado y de enfermedades por hongos del guano. Informaste si padeces claustrofobia o una condición respiratoria. Te comprometes a llevar el casco y la luz puestos en todo momento y a no separarte del grupo.",
  ],
  "ciclismo-montana": [
    "Rodarás en bicicleta por terreno de montaña. Aceptas los riesgos de caídas a velocidad, de golpes contra piedras, árboles y otros ciclistas, de fallas mecánicas y de los vehículos en tramos compartidos. Informaste con verdad tu nivel y tu experiencia. Te comprometes a llevar el casco puesto, a revisar tu bicicleta con el guía antes de salir, a controlar tu velocidad y a no rebasar al guía.",
  ],
  "observacion-naturaleza": [
    "Observarás fauna en su hábitat. Entiendes que los animales silvestres son impredecibles y que el avistamiento no está garantizado: no verlos no da derecho a reembolso. Te comprometes a guardar la distancia y el silencio que indique el guía, a no usar flash ni reproducir sonidos para atraerlos, y a no alimentarlos ni tocarlos.",
  ],
};

/** ¿Legal ya escribió el deslinde de esta actividad? */
export const tieneDeslindeEstandar = (actividad: string | null | undefined): boolean => !!actividad && actividad in POR_ACTIVIDAD;

/**
 * La lista completa para una experiencia nueva, o null si su actividad todavía
 * no tiene adicionales escritas por legal (entonces el deslinde nace apagado).
 *
 * Orden: las ocho primeras, las de la actividad (son riesgos y compromisos, y
 * van con ellos), seguro, emergencia y responsabilidad, menores, datos y
 * aceptación —que cierra la lista—, y al final lo que el participante elige.
 */
export function clausulasEstandar(i: { actividad: string | null | undefined; edadMinima: number; conSeguro: boolean }): Clausula[] | null {
  if (!tieneDeslindeEstandar(i.actividad)) return null;
  const obligatorias = [
    ...DE_LA_1_A_LA_8,
    ...POR_ACTIVIDAD[i.actividad as string],
    i.conSeguro ? SEGURO.con : SEGURO.sin,
    ...DE_LA_10_A_LA_12,
    i.edadMinima < 18 ? MENORES.admite : MENORES.soloAdultos,
    ...DE_LA_14_A_LA_16,
  ];
  return [
    ...obligatorias.map((texto): Clausula => ({ texto, obligatoria: true, origen: "casa" })),
    ...OPCIONALES.map((texto): Clausula => ({ texto, obligatoria: false, origen: "casa" })),
  ];
}
