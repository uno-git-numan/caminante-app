// Correo de confirmación de compra AL CLIENTE (canal web). Es el "comprobante"
// que la pantalla de éxito promete: experiencia, salida, personas, monto, y el
// CTA "Firma tu deslinde" cuando el deslinde está activo. Espejo del único
// correo brandeado a cliente que ya existía (la encuesta, feedback/send.ts).
// Best-effort: jamás tira el webhook — quien lo llama hace catch/allSettled.

import { sendViaResend } from "@/lib/email/resend";

// Marca (misma paleta del correo de encuesta)
const CREMA = "#fbfbf7";
const LAGOON = "#3e4836";
const ARENA = "#d4cec6";
const OLIVO = "#776f67";

const firstName = (full: string | null): string => {
  if (!full) return "caminante";
  const n = full.trim().split(/\s+/)[0] || "caminante";
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
};

const money = (n: number) =>
  "$" + Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 0 });

// Reintenta ante rate limit/5xx (ver @/lib/email/resend). text = versión en
// texto plano (multipart → mejor deliverability). Estos correos son
// transaccionales (compra/deslinde) → SIN List-Unsubscribe (deben llegar).
// fromName "Luis · Caminante" (no "Caminante" a secas): los correos que
// parecen 1:1 caen más seguido en Principal que en Promociones/spam — mismo
// criterio aplicado al boletín (20 jul).
const sendResend = (to: string, subject: string, html: string, text?: string) =>
  sendViaResend(to, subject, html, { ua: "caminante-confirmacion/1.0", text, fromName: "Luis · Caminante" });

export type ConfirmacionCompraInfo = {
  email: string;
  nombre: string | null;
  experiencia: string;
  salida: string; // slot label, o "" si no hay
  personas: number;
  montoMxn: number;
  tierLabel?: string; // nivel (habitación compartida/sencilla…), opcional
  deslindeUrl?: string | null; // solo si el deslinde de la experiencia está activo
};

function fila(k: string, v: string): string {
  return `<tr>
<td style="padding:7px 0;font-size:13px;color:${OLIVO};white-space:nowrap;vertical-align:top;">${k}</td>
<td align="right" style="padding:7px 0 7px 18px;font-size:14px;color:${LAGOON};font-weight:600;">${v}</td></tr>`;
}

function confirmacionHtml(info: ConfirmacionCompraInfo): string {
  const name = firstName(info.nombre);
  const filas = [
    fila("Experiencia", info.experiencia),
    info.salida ? fila("Salida", info.salida) : "",
    fila("Personas", String(info.personas)),
    info.tierLabel ? fila("Nivel", info.tierLabel) : "",
    fila("Total pagado", `${money(info.montoMxn)} MXN`),
  ].join("");

  const deslinde = info.deslindeUrl
    ? `<tr><td style="padding:6px 36px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:${LAGOON};">Falta un paso para dejar todo listo: <strong>firma tu deslinde</strong> y comparte tu perfil de seguridad antes del viaje.</p></td></tr>
<tr><td align="center" style="padding:14px 36px 8px;">
<a href="${info.deslindeUrl}" target="_blank" style="display:inline-block;background:${LAGOON};color:#fff;text-decoration:none;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;padding:14px 32px;border-radius:999px;">Firmar mi deslinde</a></td></tr>`
    : `<tr><td style="padding:6px 36px 8px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<p style="margin:0;font-size:15px;line-height:1.6;color:${LAGOON};">Te contactamos con los últimos detalles antes de la experiencia.</p></td></tr>`;

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:${CREMA};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREMA};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border:1px solid ${ARENA};border-radius:18px;overflow:hidden;">
<tr><td style="padding:32px 36px 8px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="font-size:12px;letter-spacing:3px;color:${OLIVO};text-transform:uppercase;">Caminante &middot; Naturaleza en movimiento</div></td></tr>
<tr><td style="padding:16px 36px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<h1 style="margin:0 0 14px;font-size:26px;line-height:1.25;color:${LAGOON};font-weight:600;">¡Tu lugar está apartado, ${name}!</h1>
<p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:${LAGOON};">Recibimos tu pago. Este es tu comprobante:</p></td></tr>
<tr><td style="padding:0 36px 10px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREMA};border:1px solid ${ARENA};border-radius:12px;"><tr><td style="padding:16px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${filas}</table></td></tr></table></td></tr>
${deslinde}
<tr><td style="padding:14px 36px 30px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="border-top:1px solid ${ARENA};padding-top:18px;font-size:13px;line-height:1.6;color:${OLIVO};">¿Dudas o cambios? Responde este correo y te ayudamos.</div></td></tr>
</table>
<div style="max-width:540px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:${OLIVO};padding:18px 8px;">Caminante by NUMAN &middot; uno@numanhub.com</div>
</td></tr></table></body></html>`;
}

// Manda la confirmación. Nunca lanza — devuelve false si no se pudo.
export async function notifyConfirmacionCompra(info: ConfirmacionCompraInfo): Promise<boolean> {
  try {
    if (!info.email || !info.email.includes("@")) return false;
    const subject = `Tu lugar en ${info.experiencia} está apartado`;
    const text =
      `¡Tu lugar está apartado, ${firstName(info.nombre)}!\n\nRecibimos tu pago.\n` +
      `Experiencia: ${info.experiencia}\n${info.salida ? `Salida: ${info.salida}\n` : ""}` +
      `Personas: ${info.personas}\n${info.tierLabel ? `Nivel: ${info.tierLabel}\n` : ""}` +
      `Total pagado: ${money(info.montoMxn)} MXN\n` +
      (info.deslindeUrl ? `\nFalta firmar tu deslinde: ${info.deslindeUrl}\n` : "") +
      `\n¿Dudas? Responde este correo. Caminante by NUMAN · uno@numanhub.com`;
    return await sendResend(info.email, subject, confirmacionHtml(info), text);
  } catch {
    return false;
  }
}

// Recordatorio de DESLINDE pendiente (pagó, falta firmar). Reusa sendResend.
export async function notifyDeslindePendiente(info: {
  email: string;
  nombre: string | null;
  experiencia: string;
  deslindeUrl: string;
}): Promise<boolean> {
  try {
    if (!info.email || !info.email.includes("@")) return false;
    const name = firstName(info.nombre);
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:${CREMA};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREMA};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border:1px solid ${ARENA};border-radius:18px;overflow:hidden;">
<tr><td style="padding:32px 36px 8px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="font-size:12px;letter-spacing:3px;color:${OLIVO};text-transform:uppercase;">Caminante &middot; Naturaleza en movimiento</div></td></tr>
<tr><td style="padding:16px 36px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<h1 style="margin:0 0 14px;font-size:26px;line-height:1.25;color:${LAGOON};font-weight:600;">Falta un paso, ${name}.</h1>
<p style="margin:0 0 8px;font-size:16px;line-height:1.6;color:${LAGOON};">Antes de <strong>${info.experiencia}</strong> necesitamos tu <strong>deslinde firmado</strong> y tu perfil de seguridad. Son dos minutos y quedas listo para el viaje.</p></td></tr>
<tr><td align="center" style="padding:18px 36px 30px;">
<a href="${info.deslindeUrl}" target="_blank" style="display:inline-block;background:${LAGOON};color:#fff;text-decoration:none;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;padding:14px 32px;border-radius:999px;">Firmar mi deslinde</a></td></tr>
<tr><td style="padding:0 36px 30px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="border-top:1px solid ${ARENA};padding-top:18px;font-size:13px;line-height:1.6;color:${OLIVO};">¿Dudas? Responde este correo y te ayudamos.</div></td></tr>
</table>
<div style="max-width:540px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:${OLIVO};padding:18px 8px;">Caminante by NUMAN &middot; uno@numanhub.com</div>
</td></tr></table></body></html>`;
    const text = `Falta un paso, ${name}.\n\nAntes de ${info.experiencia} necesitamos tu deslinde firmado y tu perfil de seguridad. Son dos minutos:\n${info.deslindeUrl}\n\n¿Dudas? Responde este correo. Caminante by NUMAN · uno@numanhub.com`;
    return await sendResend(info.email, `Falta tu deslinde para ${info.experiencia}`, html, text);
  } catch {
    return false;
  }
}
