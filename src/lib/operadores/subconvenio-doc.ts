import "server-only";

// EL TEXTO DEL ANEXO POR ACTIVIDAD — se ARMA, no se escribe.
//
// El convenio general vive en la base (`operator_agreement_versions.texto`)
// porque es UNO y lo redacta un abogado. Los anexos son dieciséis y su parte
// variable ya existe en otro lado: el catálogo de actividades, que es la misma
// fuente de la que sale el expediente que el Operador ve en pantalla.
//
// ⚠️ POR QUÉ NO SE ESCRIBEN A MANO. Dieciséis documentos redactados aparte se
// separan del catálogo el día que alguien agregue un requisito y olvide el .md.
// Y no falla ruidosamente: le firma al Operador un anexo que pide papeles
// distintos de los que la pantalla le pide. Nadie lo nota hasta que hay un
// accidente y un abogado compara los dos textos. Generándolo, contradecirse es
// imposible.
//
// El marco —lo que NO cambia entre actividades— sí está escrito a mano, aquí
// abajo, y su versión humana vive en `design/operadores/ANEXO-ACTIVIDAD.md`.

import { requisitosDe, nombreDeActividad, ACTIVIDADES, type Documento } from "./actividades";

/** Sube cuando cambia el MARCO. La versión del anexo es `${MARCO}.${catálogo}`. */
export const MARCO_ANEXO = "v1";

const lista = (docs: readonly Documento[]): string =>
  docs
    // Sin sangría: esto se convierte en un documento firmado, y tres espacios
    // antes de un «1.» convierten la lista en un bloque de código en algunos
    // renderizadores. Que se vea distinto de lo que se firmó es justo lo que no
    // puede pasar.
    .map((d, i) => `${i + 1}. **${d.nombre}** — ${d.porQue} ${d.vence ? "Debe estar vigente; se entrega con su fecha de vencimiento." : "No caduca; se actualiza cuando cambie."}`)
    .join("\n");

/**
 * El texto íntegro del anexo de una actividad, listo para mostrarse y firmarse.
 *
 * Lo que se firma es ESTE string: su sha-256 es el que se guarda. Cambiar una
 * coma de aquí cambia el hash, y por eso una versión ya firmada nunca se
 * reescribe — se publica otra.
 */
export function textoDelAnexo(actividad: string): string | null {
  if (!ACTIVIDADES.some((a) => a.slug === actividad)) return null;
  const nombre = nombreDeActividad(actividad);
  const req = requisitosDe(actividad);
  const norma = ACTIVIDADES.find((a) => a.slug === actividad)!.norma;
  const generales = req.generales.map((g) => g.nombre).join(", ");

  return `# Anexo por actividad — ${nombre}
del Convenio de operación en la plataforma Caminante

**Primera. Objeto.** Este anexo precisa, para la actividad de ${nombre.toLowerCase()} y sólo para ella, lo que el Operador debe acreditar y mantener vigente para publicarla y venderla en la plataforma. Forma parte integrante del Convenio (Cláusula Sexta, «Anexos por actividad»).

**Segunda. Norma aplicable.** ${
    norma
      ? `${norma}, además de las normas oficiales mexicanas y disposiciones que resulten aplicables a la actividad.`
      : "Esta actividad no tiene una norma oficial mexicana específica que la regule. Aplican las normas oficiales y disposiciones generales que resulten aplicables, y las obligaciones de la Cláusula Sexta del Convenio."
  } El Operador declara conocerlas y cumplirlas.

**Tercera. Expediente de la actividad.** El Operador entregará y mantendrá vigentes los documentos siguientes. Cada uno se revisa uno por uno; ninguno se da por bueno por antigüedad ni por confianza.

${lista(req.propios)}

**Cuarta. Del expediente general.** Además, esta actividad vuelve críticos los siguientes documentos generales, que se entregan una sola vez y sirven para todas las actividades del Operador: ${generales || "ninguno en particular"}.

**Quinta. Vigencias.** Un documento vencido **no cuenta como entregado**. La plataforma avisa a 30 y a 7 días. Vencido un documento indispensable, esta actividad se suspende hasta regularizarlo: las salidas ya vendidas se operan y se honran, y lo que se detiene es publicar y vender lo nuevo.

**Sexta. Alcance.** Este anexo no autoriza ninguna otra actividad. Ofrecer una distinta exige su propio anexo y su propio expediente.

**Séptima. Responsabilidad.** Nada en este anexo traslada a Caminante la operación, la seguridad ni el cumplimiento de la actividad, que son y siguen siendo responsabilidad exclusiva del Operador (Convenio, Cláusulas Primera y Novena).

**Octava. Vigencia.** Este anexo entra en vigor al suscribirse y dura lo que dure el Convenio. Se versiona y se vuelve a firmar con el mismo procedimiento y los mismos plazos que el Convenio (Cláusula Décima segunda) y con la misma firma electrónica (Cláusula Décima sexta).
`;
}

/**
 * La versión del anexo de una actividad.
 *
 * ⚠️ NO ES UN CONTADOR A MANO. Se compone del marco más una huella corta del
 * catálogo de ESA actividad, así que agregar un documento cambia la versión
 * sola. Si dependiera de que alguien se acuerde de subirla, el día que cambie
 * un requisito los Operadores quedarían firmados a un texto viejo y el sistema
 * diría que están al corriente.
 */
export function versionDelAnexo(actividad: string): string | null {
  const req = requisitosDe(actividad);
  if (!ACTIVIDADES.some((a) => a.slug === actividad)) return null;
  // La huella es de los SLUGS y de si vencen: lo que cambia la obligación. Una
  // corrección de redacción del `porQue` no obliga a refirmar a nadie.
  const huella = req.propios.map((d) => `${d.slug}${d.vence ? "!" : ""}`).join(",");
  let h = 0;
  for (let i = 0; i < huella.length; i++) h = (h * 31 + huella.charCodeAt(i)) >>> 0;
  return `${MARCO_ANEXO}.${h.toString(36)}`;
}
