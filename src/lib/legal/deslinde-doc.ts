// Ensamblador del DESLINDE por experiencia, data-driven. El marco legal genérico
// (E–J del documento maestro) es igual para toda experiencia y NO depende del
// entorno (mar, bosque, montaña); lo ESPECÍFICO entra por las cláusulas-resumen
// que el admin cura en la experiencia (declaraciones, riesgos, compromisos). Así
// el deslinde se genera SOLO al activar el registro — sin PDF manual ni URLs.
import type { Experience, V2Hero } from "@/lib/experiences/types";

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
};

// Devuelve el documento listo para renderizar, o null si el registro no está
// activo o no tiene cláusulas (entonces no hay deslinde que mostrar).
export function buildDeslinde(exp: Experience | null | undefined): DeslindeDoc | null {
  const reg = exp?.registration;
  const clausulas = (reg?.waiverClauses ?? []).map((c) => (c || "").trim()).filter(Boolean);
  if (!exp || !reg?.active || clausulas.length === 0) return null;
  const ubic = (exp.cardPloc || (exp as unknown as { estado?: string }).estado || "").toString().trim();
  return {
    titulo: "Carta de Responsabilidad Compartida y Deslinde de Responsabilidad",
    experiencia: nombreExp(exp),
    ubicacion: ubic,
    version: reg.waiverVersion?.trim() || "v1",
    clausulas,
    secciones: SECCIONES_GENERICAS,
  };
}
