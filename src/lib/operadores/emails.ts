// Correos del FUNNEL DE OPERADORES.
//
// ⚠️ REUSAN EL ARMAZÓN QUE YA EXISTE, a propósito. Claude Design no entregó un
// HTML de correo para este funnel, y NO se le pidió: el cascarón de
// `lib/embajadores/emails.ts` ya sobrevivió Gmail y Apple Mail de verdad (el
// remitente «Luis · Caminante» que saca los correos de Promociones, el sello a
// 4× para que no se vea desvaído, y el aplanado de tablas que arregló el corte
// en iPhone). Diseñar uno nuevo sería un segundo sistema de correo divergiendo
// del primero, y las lecciones caras habría que volver a aprenderlas.
//
// Lo único propio es el rótulo del encabezado y el copy.

import { sendViaResend } from "@/lib/email/resend";
import { CDMX, enPalabras } from "@/lib/fecha/zona";
import { pdfDeTerminos, type DatosTerminos } from "./terminos-pdf";

const SITE = "https://caminante.numanhub.com";
const ADMIN_EMAIL = "uno@numanhub.com";

const CREMA = "#fbfbf7";
const LAGOON = "#3e4836";
const ARENA = "#d4cec6";
const OLIVO = "#776f67";
const NARANJA = "#ff5d36";

const firstName = (full: string | null): string => {
  if (!full) return "hola";
  const n = full.trim().split(/\s+/)[0] || "hola";
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
};

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function shell(inner: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:${CREMA};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREMA};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border:1px solid ${ARENA};border-radius:18px;overflow:hidden;">
<tr><td style="padding:32px 36px 8px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="font-size:12px;letter-spacing:3px;color:${OLIVO};text-transform:uppercase;">Caminante &middot; Operadores</div></td></tr>
${inner}
<tr><td style="padding:14px 36px 30px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="border-top:1px solid ${ARENA};padding-top:18px;font-size:13px;line-height:1.6;color:${OLIVO};">¿Dudas? Responde este correo y te contestamos.</div></td></tr>
</table>
<div style="max-width:540px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:${OLIVO};padding:18px 8px;">Caminante by NUMAN &middot; uno@numanhub.com</div>
</td></tr></table></body></html>`;
}

const p = (t: string) =>
  `<tr><td style="padding:0 36px 8px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"><p style="margin:0 0 10px;font-size:16px;line-height:1.6;color:${LAGOON};">${t}</p></td></tr>`;
const h1 = (t: string) =>
  `<tr><td style="padding:16px 36px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"><h1 style="margin:0 0 14px;font-size:26px;line-height:1.25;color:${LAGOON};font-weight:600;">${t}</h1></td></tr>`;
/** Botón grande. Debajo SIEMPRE va la liga en texto plano: si el botón no carga
 *  —cliente que bloquea estilos, modo texto— el correo sigue sirviendo. */
const boton = (texto: string, url: string) =>
  `<tr><td style="padding:10px 36px 4px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<a href="${url}" style="display:inline-block;background:${NARANJA};color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 26px;border-radius:999px;">${texto}</a>
</td></tr>
<tr><td style="padding:6px 36px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="font-size:12px;line-height:1.6;color:${OLIVO};word-break:break-all;">O copia esta liga: ${url}</div></td></tr>`;

const enviar = (to: string, subject: string, html: string, text: string) =>
  sendViaResend(to, subject, html, { ua: "caminante-operadores/1.0", text });

// 1 · Confirmación a quien acaba de aplicar.
export async function emailConfirmacionOperador(to: string, responsable: string | null): Promise<boolean> {
  const n = firstName(responsable);
  const html = shell(
    h1(`Recibimos tu solicitud, ${n}.`) +
      p("Gracias por querer operar con nosotros. El programa es curado: leemos cada solicitud con calma, sobre todo el paso de cómo cuidas a la gente.") +
      p("Si hace clic, te escribimos para agendar una llamada de 30 minutos. Ahí cerramos números y te decimos con claridad qué existe hoy en la plataforma y qué está en camino.") +
      p("Si no es por ahora, también te lo decimos — no dejamos a nadie en visto."),
  );
  const text = `Recibimos tu solicitud, ${n}.\n\nEl programa es curado: leemos cada solicitud con calma, sobre todo el paso de cómo cuidas a la gente.\n\nSi hace clic, te escribimos para agendar 30 minutos.\n\nCaminante by NUMAN · uno@numanhub.com`;
  return enviar(to, "Recibimos tu solicitud para operar con Caminante", html, text);
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
  const html = shell(
    h1("Solicitud de operador nueva") +
      p(`<b>${esc(i.nombreOperadora)}</b> — ${esc(i.responsable)} · ${esc(i.ciudadEstado)}`) +
      p(`Seguro: <b>${esc(i.seguro)}</b> · Primeros auxilios: <b>${esc(i.primerosAuxilios)}</b> · Guías: ${esc(i.ratioGuias)}`) +
      p(`${esc(i.email)} · ${esc(i.whatsapp)} · Opera: ${esc(i.tipo)}`) +
      boton("Abrir en Solicitudes", `${SITE}/caminante/admin/comunidad`),
  );
  const text = `Solicitud de operador: ${i.nombreOperadora} (${i.responsable}, ${i.ciudadEstado})\nSeguro: ${i.seguro} · Primeros auxilios: ${i.primerosAuxilios} · Guías: ${i.ratioGuias}\n${i.email} · ${i.whatsapp}\n${SITE}/caminante/admin/comunidad`;
  return enviar(ADMIN_EMAIL, `Solicitud de operador · ${i.nombreOperadora}`, html, text);
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
function ics(i: {
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
  const n = firstName(responsable);
  const cuandoTxt = enPalabras(cuando, CDMX);
  const cuerpo = mensaje.trim()
    ? mensaje.trim().split(/\n{2,}/).map((t) => p(esc(t).replace(/\n/g, "<br>"))).join("")
    : p("Son 30 minutos por video: nos cuentas cómo operas, cerramos números y te decimos con claridad qué existe hoy en la plataforma y qué está en camino.");
  const html = shell(
    h1(`Nos vemos el ${esc(cuandoTxt)}, ${n}.`) +
      p(`<b>${esc(cuandoTxt)}</b>, hora del centro de México. Te adjuntamos el evento para que se meta a tu calendario.`) +
      cuerpo +
      boton("Entrar a la llamada", meetUrl) +
      p("Va adjunto un <b>resumen de términos</b> de dos páginas: la tabla de comisiones con tus propios números, qué te vamos a pedir y cómo se te paga. <b>Léelo antes y anota tus dudas</b> — la llamada rinde mucho más si llegas con las preguntas escritas. No es el convenio: ese es otro documento y se firma después.") +
      p("La liga también vive en tu panel, en «Mi alta»: si borras este correo, la llamada no se pierde. Si esa hora no te queda, respóndenos y la movemos."),
  );
  const text = `Nos vemos el ${cuandoTxt}, ${n}.\n\n${cuandoTxt}, hora del centro de México.\nSon 30 minutos por video.\n\nLiga: ${meetUrl}\n\nVa adjunto un resumen de términos de dos páginas. Léelo antes y anota tus dudas. No es el convenio.\n\nSi esa hora no te queda, responde este correo y la movemos.\n\nCaminante by NUMAN · uno@numanhub.com`;

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

  return sendViaResend(to, `Tu llamada con Caminante · ${cuandoTxt}`, html, {
    ua: "caminante-operadores/1.0",
    text,
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

// 4 · Petición de expediente (link privado con token).
export async function emailPedirExpediente(
  to: string,
  responsable: string | null,
  url: string,
  cuantos: number,
  mensaje: string,
): Promise<boolean> {
  const n = firstName(responsable);
  const cuerpo = mensaje.trim()
    ? mensaje.trim().split(/\n{2,}/).map((t) => p(esc(t).replace(/\n/g, "<br>"))).join("")
    : p(`Para darte de alta necesitamos ${cuantos} documentos. Se suben en un link privado; se guarda solo y puedes volver cuando quieras.`);
  const html = shell(
    h1(`Tu expediente, ${n}.`) +
      cuerpo +
      boton("Subir mis documentos", url) +
      p("Si algo te falta o está en trámite, dilo ahí mismo: varios se resuelven. La liga vence en 30 días."),
  );
  const text = `Tu expediente, ${n}.\n\nNecesitamos ${cuantos} documentos. Súbelos aquí:\n${url}\n\nSi algo falta o está en trámite, dilo ahí mismo. La liga vence en 30 días.\n\nCaminante by NUMAN · uno@numanhub.com`;
  return enviar(to, "Tus documentos para operar con Caminante", html, text);
}

// 5 · Bienvenida (al APROBAR).
export async function emailBienvenidaOperador(to: string, responsable: string | null): Promise<boolean> {
  const n = firstName(responsable);
  const html = shell(
    h1(`Bienvenida, ${n}.`) +
      p("Tu operadora ya está dada de alta. Vamos a armar tu primera experiencia juntos y su primera salida va acompañada.") +
      p("Te escribimos por WhatsApp para agendar el alta: marca, colores y tus experiencias.") +
      boton("Entrar a la plataforma", `${SITE}/caminante/entrar`),
  );
  const text = `Bienvenida, ${n}.\n\nTu operadora ya está dada de alta. Armamos tu primera experiencia juntos y su primera salida va acompañada.\n\n${SITE}/caminante/entrar\n\nCaminante by NUMAN · uno@numanhub.com`;
  return enviar(to, "Bienvenida a Caminante", html, text);
}

// 6 · «Por ahora no», amable y con la puerta abierta.
export async function emailRechazoOperador(to: string, responsable: string | null): Promise<boolean> {
  const n = firstName(responsable);
  const html = shell(
    h1(`Gracias por escribirnos, ${n}.`) +
      p("Por ahora no vamos a avanzar con tu solicitud. No es un juicio sobre tu trabajo: el programa es chico y curado, y este año estamos cuidando mucho con quién y a qué ritmo crecemos.") +
      p("Si cambia algo de lo que te faltaba —el seguro, las certificaciones, los permisos— vuelve a aplicar. Lo leemos otra vez con gusto."),
  );
  const text = `Gracias por escribirnos, ${n}.\n\nPor ahora no vamos a avanzar con tu solicitud. El programa es chico y curado.\n\nSi cambia algo de lo que faltaba, vuelve a aplicar: lo leemos otra vez con gusto.\n\nCaminante by NUMAN · uno@numanhub.com`;
  return enviar(to, "Sobre tu solicitud para operar con Caminante", html, text);
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
  const n = firstName(responsable);
  const a = esc(actividad.toLowerCase());
  const html = shell(
    h1(`Tu expediente de ${a} está aprobado, ${n}.`) +
      p(`Ya puedes publicar y vender experiencias de ${a}. Lo revisamos documento por documento: de esto depende que nadie se lastime en una montaña, y por eso tarda.`) +
      p("Tus otras actividades siguen su propio camino — que una esté a medias no detiene a las demás.") +
      boton("Armar mi experiencia", `${SITE}/caminante/admin/experiencias/nueva`),
  );
  const text = `Tu expediente de ${actividad.toLowerCase()} está aprobado, ${n}.\n\nYa puedes publicar y vender experiencias de esa actividad.\n\n${SITE}/caminante/admin/experiencias/nueva\n\nCaminante by NUMAN · uno@numanhub.com`;
  return enviar(to, `Tu expediente de ${actividad.toLowerCase()} está aprobado`, html, text);
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
  const n = firstName(responsable);
  const html = shell(
    h1(`Una cosa de tu expediente, ${n}.`) +
      p(`<b>${esc(que)}</b> necesita corrección:`) +
      p(esc(motivo)) +
      p("Lo demás que ya subiste se queda como está. Cuando lo reemplaces, lo volvemos a revisar.") +
      boton("Ir a mi expediente", `${SITE}/caminante/admin/mi-alta/expediente`),
  );
  const text = `Una cosa de tu expediente, ${n}.\n\n${que} necesita corrección: ${motivo}\n\nLo demás se queda como está. Reemplázalo y lo revisamos otra vez:\n${SITE}/caminante/admin/mi-alta/expediente\n\nCaminante by NUMAN · uno@numanhub.com`;
  return enviar(to, "Un documento de tu expediente necesita corrección", html, text);
}

// 9 · Stripe la habilitó: su cuenta ya cobra.
export async function emailStripeListo(to: string, responsable: string | null): Promise<boolean> {
  const n = firstName(responsable);
  const html = shell(
    h1(`Tu cuenta ya puede cobrar, ${n}.`) +
      p("Stripe terminó de verificarte. A partir de ahora el dinero de tus ventas entra <b>a tu cuenta</b>, y Caminante retiene sólo su comisión.") +
      p("Si Stripe te vuelve a pedir algo más adelante —un documento que vence, una revisión— te avisamos igual: tu panel siempre dice lo que Stripe dice, no lo que nosotros creemos.") +
      boton("Ver mi cuenta de cobro", `${SITE}/caminante/admin/mi-alta/cobrar`),
  );
  const text = `Tu cuenta ya puede cobrar, ${n}.\n\nStripe terminó de verificarte: el dinero de tus ventas entra a tu cuenta y Caminante retiene sólo su comisión.\n\n${SITE}/caminante/admin/mi-alta/cobrar\n\nCaminante by NUMAN · uno@numanhub.com`;
  return enviar(to, "Tu cuenta de Stripe ya está lista", html, text);
}

/**
 * Cuándo aplica el convenio, dicho una sola vez.
 *
 * Vive aparte porque la misma frase va en el HTML y en el texto plano, y
 * escribirla dos veces es cómo una de las dos se queda vieja. Además es la que
 * decide si esto suena a urgencia o a aviso: decir «hasta que firmes no
 * vendes» cuando faltan treinta días es asustar de gratis.
 */
export function fraseDeVigencia(dias: number): string {
  if (dias <= 0) {
    return "Ya está vigente: hasta que lo firmes, tus experiencias no pueden publicarse ni cobrar.";
  }
  return `Entra en vigor en ${dias} ${dias === 1 ? "día" : "días"}. Hasta entonces sigues vendiendo normal; después de esa fecha hace falta la firma.`;
}

// 10 · El convenio ya se puede firmar.
//
// ⚠️ ES EL ÚNICO CANDADO QUE ELLA NO PUEDE EMPUJAR SOLA. Los otros cinco
// dependen de que suba algo, complete algo o Stripe la verifique; éste depende
// de que la casa publique un texto. Mientras no hay texto, su panel le dice
// «La casa no ha publicado el convenio» y no hay nada que hacer — así que el
// día que sí lo hay, enterarse no puede depender de que se le ocurra entrar.
//
// Dos formas, porque no piden lo mismo (`convenio.ts`, DIAS_DE_AVISO = 30):
//   · Ya exigible → hasta que firme no vende. Se dice sin rodeos.
//   · Por venir   → tiene días. Se dice cuántos y desde cuándo aplica, para que
//     nadie descubra la fecha el día que le cayó encima.
export async function emailConvenioPorFirmar(
  to: string,
  responsable: string | null,
  v: { titulo: string; version: string; dias: number },
): Promise<boolean> {
  const n = firstName(responsable);
  const url = `${SITE}/caminante/admin/mi-alta/convenio`;
  const yaAplica = v.dias <= 0;
  const cuando = fraseDeVigencia(v.dias);
  const html = shell(
    h1(`Ya puedes firmar tu convenio, ${n}.`) +
      p(`Publicamos <b>${esc(v.titulo)}</b> (${esc(v.version)}). Es el documento que pone por escrito la comisión, quién responde de qué y cómo se cobra.`) +
      p(cuando) +
      p("Léelo completo antes de aceptar. La firma queda con el sello del texto EXACTO que viste en pantalla, así que si algo te hace ruido, contéstanos este correo antes de firmar y no después.") +
      boton("Leer y firmar", url),
  );
  const text = `Ya puedes firmar tu convenio, ${n}.\n\nPublicamos ${v.titulo} (${v.version}). ${cuando}\n\nLéelo completo antes de aceptar; si algo te hace ruido, contéstanos antes de firmar.\n\n${url}\n\nCaminante by NUMAN · uno@numanhub.com`;
  return enviar(to, yaAplica ? "Tu convenio ya se puede firmar" : `Tu convenio nuevo entra en vigor en ${v.dias} días`, html, text);
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
 * Una sola función para las dos versiones —HTML y texto plano— porque la
 * primera vez esto se escribió dos veces, que es exactamente cómo una de las
 * dos se queda diciendo lo que ya no es cierto.
 */
export function fraseDelDinero(
  montoMxn: number,
  retenidoMxn: number | null,
): { html: string; texto: string } {
  if (retenidoMxn != null) {
    const cola = `El dinero entró a tu cuenta de Stripe; Caminante retuvo ${pesos(retenidoMxn)} de comisión más su IVA.`;
    return {
      html: `Se cobraron ${pesos(montoMxn)}. El dinero entró <b>a tu cuenta de Stripe</b>; Caminante retuvo ${pesos(retenidoMxn)} de comisión más su IVA.`,
      texto: `Se cobraron ${pesos(montoMxn)}. ${cola}`,
    };
  }
  const cola = "Este cobro entró por la cuenta de Caminante, así que tu parte te la transferimos — la vas a ver en tu corte.";
  return {
    html: `Se cobraron ${pesos(montoMxn)}. ${cola}`,
    texto: `Se cobraron ${pesos(montoMxn)}. ${cola}`,
  };
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
  const n = firstName(responsable);
  const gente = `${v.personas} ${v.personas === 1 ? "persona" : "personas"}`;
  const dinero = fraseDelDinero(v.montoMxn, v.retenidoMxn);
  const html = shell(
    h1(`Tu primera venta, ${n}.`) +
      p(`Alguien acaba de pagar <b>${esc(v.experiencia)}</b> para ${gente}.`) +
      p(dinero.html) +
      p("En tu panel está quién viene, su deslinde firmado y sus datos de contacto. Cuando la salida termine, la encuesta sale sola a las 24 horas.") +
      boton("Ver mi salida", `${SITE}/caminante/admin/salidas`),
  );
  const text = `Tu primera venta, ${n}.\n\nAlguien acaba de pagar ${v.experiencia} para ${gente}.\n\n${dinero.texto}\n\nEn tu panel está quién viene y su deslinde firmado.\n\n${SITE}/caminante/admin/salidas\n\nCaminante by NUMAN · uno@numanhub.com`;
  return enviar(to, "Tu primera venta en Caminante", html, text);
}
