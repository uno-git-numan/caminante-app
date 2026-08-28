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

// 3 · Invitación a la llamada. La liga es la AGENDA DE GOOGLE de Luis: la
// persona elige su hueco y Google crea el evento con su Meet e invita a los dos.
// Así no hay que agendar a mano ni pegar links de vuelta.
export async function emailInvitacionLlamada(
  to: string,
  responsable: string | null,
  agendaUrl: string,
  mensaje: string,
): Promise<boolean> {
  const n = firstName(responsable);
  const cuerpo = mensaje.trim()
    ? mensaje.trim().split(/\n{2,}/).map((t) => p(esc(t).replace(/\n/g, "<br>"))).join("")
    : p("Nos interesó tu solicitud y queremos conocerte. Son 30 minutos por Google Meet: nos cuentas cómo operas, cerramos números y te decimos con claridad qué existe hoy y qué está en camino.");
  const html = shell(
    h1(`Vamos a platicar, ${n}.`) +
      cuerpo +
      boton("Elegir mi horario", agendaUrl) +
      p("Al elegir tu hueco, Google nos manda la invitación con el enlace de la videollamada a los dos."),
  );
  const text = `Vamos a platicar, ${n}.\n\nSon 30 minutos por Google Meet. Elige el horario que te acomode:\n${agendaUrl}\n\nCaminante by NUMAN · uno@numanhub.com`;
  return enviar(to, "Agendemos 30 minutos · Caminante", html, text);
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
