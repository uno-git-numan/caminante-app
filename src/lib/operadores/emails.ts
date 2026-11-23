// Correos del FUNNEL DE OPERADORES.
//
// ⚠️ EL MARCO NO VIVE AQUÍ: está en `lib/email/plantilla.ts`, compartido con
// los correos de embajadores. Hasta el 23 sep 2026 cada módulo traía su propia
// copia del mismo cascarón, y la consecuencia no fue teórica — se arregló en
// uno la divergencia entre el HTML y el texto plano y el otro se quedó con el
// bug intacto. Dos copias del mismo marco es aprender cada lección dos veces.
//
// Lo propio de este archivo es el rótulo y el copy.

import { sendViaResend } from "@/lib/email/resend";
import {
  type Bloque,
  boton,
  esc,
  h1,
  LAGOON,
  marco,
  p,
  parrafosDe,
  saludo,
} from "@/lib/email/plantilla";
import { CDMX, enPalabras } from "@/lib/fecha/zona";
import { pdfDeTerminos, type DatosTerminos } from "./terminos-pdf";

const SITE = "https://caminante.numanhub.com";
const ADMIN_EMAIL = "uno@numanhub.com";

const shell = (bloques: Bloque[]) => marco("Operadores", bloques);

const enviar = (to: string, subject: string, correo: { html: string; texto: string }) =>
  sendViaResend(to, subject, correo.html, { ua: "caminante-operadores/1.0", text: correo.texto });

// 1 · Confirmación a quien acaba de aplicar.
export async function emailConfirmacionOperador(to: string, responsable: string | null): Promise<boolean> {
  const n = saludo(responsable);
  const correo = shell([
    h1(`Recibimos tu solicitud${n}.`),
    p("Gracias por querer operar con nosotros. El programa es curado: leemos cada solicitud con calma, sobre todo el paso de cómo cuidas a la gente."),
    p("Si hace clic, te escribimos para agendar una llamada de 30 minutos. Ahí resolvemos tus dudas y te decimos con claridad qué existe hoy en la plataforma y qué está en camino."),
    p("Si no es por ahora, también te lo decimos — no dejamos a nadie en visto."),
  ]);
  return enviar(to, "Recibimos tu solicitud para operar con Caminante", correo);
}

// A una salida tuya le faltan documentos (convenio v3.5, Anexo B; 23 nov 2026).
// Las pólizas, la credencial del guía y los permisos ya no detienen la venta:
// se entregan antes de la primera salida, y este correo es el que lo recuerda.
// Sale a 14, 7, 3 y 1 día (`lib/operadores/para-salir.ts`).
export async function emailFaltaParaSalir(
  to: string,
  responsable: string | null,
  i: { experiencia: string; salida: string; dias: number; faltan: string[] },
): Promise<boolean> {
  const n = saludo(responsable);
  const cuando = i.dias <= 0 ? "es hoy" : i.dias === 1 ? "es mañana" : `es en ${i.dias} días`;
  const correo = shell([
    h1(`A tu salida le faltan documentos${n}.`),
    p(`<b>${esc(i.experiencia)}</b>${i.salida ? ` · ${esc(i.salida)}` : ""} ${cuando}, y en tu expediente todavía falta:`),
    p(i.faltan.map((f) => `· ${esc(f)}`).join("<br>")),
    p("Estos documentos se entregan <b>antes de que inicie la salida</b>: sin ellos la salida no se realiza. Subirlos toma unos minutos y los revisamos el mismo día."),
    boton("Subirlos en mi expediente", `${SITE}/caminante/admin/mi-alta/expediente`),
    p("Si ya los tienes y algo no te deja subirlos, respóndenos a este correo y lo resolvemos contigo."),
  ]);
  return enviar(to, `Faltan documentos para tu salida · ${i.experiencia}`, correo);
}

// 2 · Aviso interno. Trae las señales de riesgo arriba: son lo que se lee primero.
export async function emailAvisoAdminOperador(i: {
  nombreOperadora: string;
  responsable: string;
  email: string;
  whatsapp: string;
  ciudadEstado: string;
  tipo: string;
  seguro: string;
  primerosAuxilios: string;
  ratioGuias: string;
}): Promise<boolean> {
  const correo = shell([
    h1("Solicitud de operador nueva"),
    p(`<b>${esc(i.nombreOperadora)}</b> — ${esc(i.responsable)} · ${esc(i.ciudadEstado)}`),
    p(`Seguro: <b>${esc(i.seguro)}</b> · Primeros auxilios: <b>${esc(i.primerosAuxilios)}</b> · Guías: ${esc(i.ratioGuias)}`),
    p(`${esc(i.email)} · ${esc(i.whatsapp)} · Opera: ${esc(i.tipo)}`),
    boton("Abrir en Solicitudes", `${SITE}/caminante/admin/comunidad`),
  ]);
  return enviar(ADMIN_EMAIL, `Solicitud de operador · ${i.nombreOperadora}`, correo);
}

// 3 · Invitación a la llamada.
//
// ANTES este correo mandaba la agenda de Google para que la persona eligiera
// hueco. Se cambió el 8 sep 2026: ahora la cita se acuerda por WhatsApp y aquí
// se CONFIRMA una fecha concreta con su liga. Un correo que dice «elige tu
// horario» cuando la hora ya está acordada obliga a la otra persona a adivinar
// cuál de las dos cosas es verdad.
//
// ⚠️ La hora se imprime SIEMPRE en la zona de quien va a la llamada, y se dice
// cuál es. «9:00» sin zona es una promesa a medias.

/** El evento de calendario. Sin esto la cita vive sólo dentro del correo. */
export function ics(i: {
  uid: string; inicio: Date; minutos: number; titulo: string;
  descripcion: string; url: string; para: string;
}): string {
  const z = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const fin = new Date(i.inicio.getTime() + i.minutos * 60000);
  // Las líneas de un .ics se separan con CRLF y el texto escapa comas y saltos.
  const t = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Caminante//Operadores//ES",
    "CALSCALE:GREGORIAN", "METHOD:REQUEST", "BEGIN:VEVENT",
    `UID:${i.uid}`, `DTSTAMP:${z(new Date())}`,
    `DTSTART:${z(i.inicio)}`, `DTEND:${z(fin)}`,
    `SUMMARY:${t(i.titulo)}`, `DESCRIPTION:${t(i.descripcion)}`,
    `LOCATION:${t(i.url)}`, `URL:${i.url}`,
    `ORGANIZER;CN=Caminante:mailto:${ADMIN_EMAIL}`,
    `ATTENDEE;CN=${t(i.para)};RSVP=TRUE:mailto:${i.para}`,
    "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY",
    "DESCRIPTION:Tu llamada con Caminante es en 30 minutos", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

export async function emailInvitacionLlamada(
  to: string,
  responsable: string | null,
  meetUrl: string,
  cuando: Date,
  mensaje: string,
  solicitudId: string,
  /** Para el resumen de términos que viaja adjunto. */
  terminos: DatosTerminos,
): Promise<boolean> {
  const n = saludo(responsable);
  const cuandoTxt = enPalabras(cuando, CDMX);
  // ⚠️ AQUÍ VIVÍA LA DIVERGENCIA MÁS CARA. El mensaje escrito a mano se pintaba
  // en el HTML y NO viajaba al texto plano, que decía siempre el genérico: dos
  // correos distintos con el mismo asunto, según con qué lo abrieras.
  const cuerpo = mensaje.trim()
    ? parrafosDe(mensaje)
    : [p("Son 30 minutos por video: nos cuentas cómo operas, resolvemos tus dudas y te decimos con claridad qué existe hoy en la plataforma y qué está en camino.")];
  const correo = shell([
    h1(`Nos vemos el ${esc(cuandoTxt)}${n}.`),
    p(`<b>${esc(cuandoTxt)}</b>, hora del centro de México. Te adjuntamos el evento para que se meta a tu calendario.`),
    ...cuerpo,
    boton("Entrar a la llamada", meetUrl),
    p("Va adjunto un <b>resumen de términos</b> de dos páginas: la comisión (fija) con tus propios números, qué te vamos a pedir y cómo se te paga. <b>Léelo antes y anota tus dudas</b> — la llamada rinde mucho más si llegas con las preguntas escritas. No es el convenio: ese es otro documento y se firma después."),
    p("La liga también vive en tu panel, en «Mi alta»: si borras este correo, la llamada no se pierde. Si esa hora no te queda, respóndenos y la movemos."),
  ]);

  // ⚠️ SI EL PDF FALLA, EL CORREO SALE IGUAL. La invitación a la llamada es lo
  // que no puede perderse: alguien está esperando una hora y una liga. Un
  // adjunto que no se pudo generar es un adjunto que se manda después, no una
  // invitación que nunca llegó.
  let resumen: Uint8Array | null = null;
  try {
    resumen = await pdfDeTerminos(terminos);
  } catch (e) {
    console.error("pdfDeTerminos:", e);
  }

  const cal = ics({
    uid: `alta-${solicitudId}@caminante.numanhub.com`,
    inicio: cuando, minutos: 30,
    titulo: "Caminante · tu llamada de alta",
    descripcion: `Media hora por video para conocernos.\nLiga: ${meetUrl}`,
    url: meetUrl, para: to,
  });

  return sendViaResend(to, `Tu llamada con Caminante · ${cuandoTxt}`, correo.html, {
    ua: "caminante-operadores/1.0",
    text: correo.texto,
    attachments: [
      {
        filename: "llamada-caminante.ics",
        content: Buffer.from(cal, "utf8").toString("base64"),
        contentType: "text/calendar; method=REQUEST; charset=utf-8",
      },
      ...(resumen
        ? [{
            filename: "terminos-caminante.pdf",
            content: Buffer.from(resumen).toString("base64"),
            contentType: "application/pdf",
          }]
        : []),
    ],
  });
}

// 4 · (Petición de expediente por link con token: quitada el 9 nov 2026. La
//     ruta del link nunca existió y el expediente vive en Mi alta.)

// 5 · Bienvenida (al APROBAR).
export async function emailBienvenidaOperador(to: string, responsable: string | null): Promise<boolean> {
  const n = saludo(responsable);
  const correo = shell([
    // EL ORDEN DEL ALTA (23 nov 2026, `pasos.ts`): primero lo suyo —marca y
    // experiencia, libres—, y los papeles, la firma y la cuenta al final. Este
    // correo es el ÚNICO que sale al aprobar: antes salía además «ya puedes
    // firmar tu convenio», que el primer día pedía lo último del camino.
    h1(`Bienvenida${n}. Tu panel ya está abierto.`),
    p("Empieza por lo tuyo: <b>pon tu marca</b> —tu logo y tus colores— y <b>arma tu primera experiencia</b>. Al guardarla ves tu página tal como la verá tu cliente."),
    p("Armar es libre: no pide papeles ni firma, y no cuesta nada. Para publicar y vender te pedimos después dos documentos (tu constancia fiscal y tu identificación), la firma del convenio y la cuenta donde recibes tu dinero. Nunca nos pagas por estar: sólo una comisión por cada venta."),
    boton("Entrar a mi panel", `${SITE}/caminante/entrar`),
    p(`Entra con este mismo correo (${esc(to)}). Si todavía no tienes cuenta, en esa pantalla elige «Créala aquí»: toma un minuto.`),
    p("Si te atoras en algo, contéstanos este correo y lo resolvemos contigo."),
  ]);
  return enviar(to, "Bienvenida a Caminante", correo);
}

// 6 · «Por ahora no», amable y con la puerta abierta.
export async function emailRechazoOperador(to: string, responsable: string | null): Promise<boolean> {
  const n = saludo(responsable);
  const correo = shell([
    h1(`Gracias por escribirnos${n}.`),
    p("Por ahora no vamos a avanzar con tu solicitud. No es un juicio sobre tu trabajo: el programa es chico y curado, y este año estamos cuidando mucho con quién y a qué ritmo crecemos."),
    p("Si cambia algo de lo que te faltaba —el seguro, las certificaciones, los permisos— vuelve a aplicar. Lo leemos otra vez con gusto."),
  ]);
  return enviar(to, "Sobre tu solicitud para operar con Caminante", correo);
}

// ── El ciclo después de aprobar ──────────────────────────────────────────────
//
// Los seis de arriba cubren el EMBUDO: aplicar, llamada, expediente, alta o no.
// Después de eso el sistema se quedaba mudo, y justo ahí es donde la pelota va
// y viene: le aprobamos una actividad, le devolvemos un papel, Stripe la
// habilita. Nada de eso llegaba a su correo — tenía que entrar a adivinar. Un
// paso que avanza sin avisar es un paso que nadie ve avanzar.

// 7 · Su actividad quedó APROBADA: ya puede publicar de eso.
export async function emailActividadAprobada(
  to: string,
  responsable: string | null,
  actividad: string,
): Promise<boolean> {
  const n = saludo(responsable);
  const a = esc(actividad.toLowerCase());
  const correo = shell([
    h1(`Tu expediente de ${a} está aprobado${n}.`),
    p(`Ya puedes publicar y vender experiencias de ${a}. Lo revisamos documento por documento: de esto depende que nadie se lastime en una montaña, y por eso tarda.`),
    p("Tus otras actividades siguen su propio camino — que una esté a medias no detiene a las demás."),
    boton("Armar mi experiencia", `${SITE}/caminante/admin/experiencias/nueva`),
  ]);
  return enviar(to, `Tu expediente de ${actividad.toLowerCase()} está aprobado`, correo);
}

// 8 · Algo de su expediente necesita corrección.
//
// ⚠️ SIEMPRE CON EL MOTIVO. Un «no» mudo deja a alguien sin saber qué corregir,
// y es lo que convierte una revisión en una discusión. La base lo exige con un
// check; este correo lo repite porque es donde ella lo va a leer.
export async function emailExpedienteDevuelto(
  to: string,
  responsable: string | null,
  que: string,
  motivo: string,
): Promise<boolean> {
  const n = saludo(responsable);
  const correo = shell([
    h1(`Una cosa de tu expediente${n}.`),
    p(`<b>${esc(que)}</b> necesita corrección:`),
    p(esc(motivo)),
    p("Lo demás que ya subiste se queda como está. Cuando lo reemplaces, lo volvemos a revisar."),
    boton("Ir a mi expediente", `${SITE}/caminante/admin/mi-alta/expediente`),
  ]);
  return enviar(to, "Un documento de tu expediente necesita corrección", correo);
}

// 9 · Stripe la habilitó: su cuenta ya cobra.
export async function emailStripeListo(to: string, responsable: string | null): Promise<boolean> {
  const n = saludo(responsable);
  const correo = shell([
    h1(`Tu cuenta ya puede cobrar${n}.`),
    p("Tu cuenta de cobro quedó verificada. A partir de ahora el dinero de tus ventas entra <b>a tu cuenta</b>, y Caminante retiene sólo su comisión."),
    p("Si más adelante hace falta algo más —un documento que vence, una revisión— te avisamos igual: tu panel siempre dice el estado real de tu cuenta, no lo que nosotros creemos."),
    boton("Ver mi cuenta de cobro", `${SITE}/caminante/admin/mi-alta/cobrar`),
  ]);
  return enviar(to, "Tu cuenta de cobro ya está lista", correo);
}

/**
 * Cuándo aplica el convenio, dicho una sola vez.
 *
 * Vive aparte porque la misma frase va en el HTML y en el texto plano, y
 * escribirla dos veces es cómo una de las dos se queda vieja. Además es la que
 * decide si esto suena a urgencia o a aviso: decir «hasta que firmes no
 * vendes» cuando faltan treinta días es asustar de gratis.
 *
 * `nuncaFirmo`: quien no ha firmado NINGÚN convenio no «sigue vendiendo normal»
 * mientras llega la fecha —la puerta de publicar le pide la firma desde hoy
 * (`candados-venta.ts`)—, así que a ella no se le promete ese plazo. Tampoco se
 * le dice «ya está vigente» de un texto que todavía no lo está.
 */
export function fraseDeVigencia(dias: number, nuncaFirmo = false): string {
  if (dias <= 0) {
    return "Ya está vigente: hasta que lo firmes, tus experiencias no pueden publicarse ni cobrar.";
  }
  if (nuncaFirmo) {
    return "Hasta que lo firmes, tus experiencias no pueden publicarse ni cobrar.";
  }
  return `Entra en vigor en ${dias} ${dias === 1 ? "día" : "días"}. Hasta entonces sigues vendiendo normal; después de esa fecha hace falta la firma.`;
}

// 10 · El convenio ya se puede firmar.
//
// ⚠️ ES EL ÚNICO CANDADO QUE ELLA NO PUEDE EMPUJAR SOLA. Los otros cinco
// dependen de que suba algo, complete algo o su cuenta de cobro se verifique;
// éste depende de que la casa publique un texto. Mientras no hay texto, su
// panel le dice «La casa no ha publicado el convenio» y no hay nada que hacer —
// así que el día que sí lo hay, enterarse no puede depender de que se le
// ocurra entrar.
//
// Dos formas, porque no piden lo mismo (`convenio.ts`, DIAS_DE_AVISO = 30):
//   · Ya exigible → hasta que firme no vende. Se dice sin rodeos.
//   · Por venir   → tiene días. Se dice cuántos y desde cuándo aplica, para que
//     nadie descubra la fecha el día que le cayó encima.
//
// QUIÉN LO MANDA. Hasta el 23 nov 2026 salía al aprobar la solicitud; con el
// alta en cinco pasos el convenio es el cuarto, y pedir la firma el primer día
// contradecía el orden. Desde entonces lo manda `aviso-convenio.ts`, una vez,
// cuando se aprueba el documento que completa lo que se pide para vender
// (constancia fiscal e identificación) y la operadora no ha firmado: va con
// `documentosAprobados`, y el encabezado dice que sus documentos ya están
// aprobados y que sigue la firma.
//
// Sin `documentosAprobados` es el aviso de «publicamos un convenio». Ése sigue
// sin disparador: a quien ya firmó una versión y le publican otra, hoy sólo se
// lo dice su panel.
export async function emailConvenioPorFirmar(
  to: string,
  responsable: string | null,
  v: {
    titulo: string;
    version: string;
    dias: number;
    /** Sale porque se aprobaron sus documentos para vender y no ha firmado ningún convenio. */
    documentosAprobados?: boolean;
  },
): Promise<boolean> {
  const n = saludo(responsable);
  const url = `${SITE}/caminante/admin/mi-alta/convenio`;
  const yaAplica = v.dias <= 0;
  const docs = v.documentosAprobados === true;
  const cuando = fraseDeVigencia(v.dias, docs);
  const queEs = "el documento que pone por escrito la comisión, quién responde de qué y cómo se cobra";
  const correo = shell([
    h1(docs ? `Tus documentos ya están aprobados${n}. Sigue la firma.` : `Ya puedes firmar tu convenio${n}.`),
    docs
      ? p(`Aprobamos tu constancia fiscal y tu identificación, los dos documentos que pedimos para vender. Lo que sigue es firmar <b>${esc(v.titulo)}</b> (${esc(v.version)}): ${queEs}.`)
      : p(`Publicamos <b>${esc(v.titulo)}</b> (${esc(v.version)}). Es ${queEs}.`),
    p(cuando),
    p("Léelo completo antes de aceptar. La firma queda con el sello del texto EXACTO que viste en pantalla, así que si algo te hace ruido, contéstanos este correo antes de firmar y no después."),
    boton("Leer y firmar", url),
  ]);
  const asunto = docs
    ? "Tus documentos están aprobados: sigue la firma de tu convenio"
    : yaAplica
      ? "Tu convenio ya se puede firmar"
      : `Tu convenio nuevo entra en vigor en ${v.dias} días`;
  return enviar(to, asunto, correo);
}

const pesos = (x: number) =>
  `$${x.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * DÓNDE ESTÁ EL DINERO HOY. La frase que más cuidado pide de todo este archivo.
 *
 * Con Connect el cobro entró a la cuenta de la operadora y Caminante retuvo su
 * comisión: el dinero YA ES SUYO. Por el camino de la casa entró a la cuenta de
 * Numan y hay que transferírselo. Decir «ya es tuyo» en el segundo caso es
 * mentir sobre dónde está su dinero, y es la clase de mentira que se descubre
 * cuando ella va a buscarlo y no está.
 *
 * Devuelve UNA frase. El texto plano sale de ella sola (ver `Bloque`), así que
 * ya no hay dos versiones que puedan separarse: la primera vez esto se escribió
 * dos veces, y así es exactamente como una de las dos se queda diciendo lo que
 * ya no es cierto.
 */
export function fraseDelDinero(montoMxn: number, retenidoMxn: number | null): string {
  if (retenidoMxn != null) {
    return `Se cobraron ${pesos(montoMxn)}. El dinero entró <b>a tu cuenta de cobro</b>; Caminante retuvo ${pesos(retenidoMxn)} de comisión más su IVA.`;
  }
  return `Se cobraron ${pesos(montoMxn)}. Este cobro entró por la cuenta de Caminante, así que tu parte te la transferimos — la vas a ver en tu corte.`;
}

// 11 · Su PRIMERA venta.
//
// Es el correo que cierra el alta: hasta aquí todo fue papeles y promesas, y
// éste dice que la máquina funcionó. Va UNA sola vez, en la primera venta de la
// operadora, y nunca a la casa.
//
// ⚠️ LOS NÚMEROS NO SE ADORNAN. Si el cobro entró por Connect, el dinero ya es
// suyo y se dice cuánto retuvimos; si entró por la casa, el dinero está en la
// cuenta de Numan y se le va a transferir — decir «ya es tuyo» en ese caso
// sería mentir sobre dónde está el dinero hoy.
export async function emailPrimeraVenta(
  to: string,
  responsable: string | null,
  v: {
    experiencia: string;
    personas: number;
    montoMxn: number;
    /** Lo que Stripe retuvo (comisión + IVA). Sólo cuando el cobro fue por Connect. */
    retenidoMxn: number | null;
  },
): Promise<boolean> {
  const n = saludo(responsable);
  const gente = `${v.personas} ${v.personas === 1 ? "persona" : "personas"}`;
  const dinero = fraseDelDinero(v.montoMxn, v.retenidoMxn);
  const correo = shell([
    h1(`Tu primera venta${n}.`),
    p(`Alguien acaba de pagar <b>${esc(v.experiencia)}</b> para ${gente}.`),
    p(dinero),
    p("En tu panel está quién viene, su deslinde firmado y sus datos de contacto. Cuando la salida termine, la encuesta sale sola a las 24 horas."),
    boton("Ver mi salida", `${SITE}/caminante/admin/salidas`),
  ]);
  return enviar(to, "Tu primera venta en Caminante", correo);
}
