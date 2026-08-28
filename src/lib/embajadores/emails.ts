// Correos del PROGRAMA DE EMBAJADORES. Todos por sendViaResend (reintento
// 429/5xx, multipart, remitente "Luis · Caminante" — el default de todo correo
// a cliente). Best-effort: quien los llama no debe caerse si el correo falla.
import { sendViaResend } from "@/lib/email/resend";

const SITE = "https://caminante.numanhub.com";
const ADMIN_EMAIL = "uno@numanhub.com";

// Paleta del correo de encuesta/confirmación (la casa).
const CREMA = "#fbfbf7";
const LAGOON = "#3e4836";
const ARENA = "#d4cec6";
const OLIVO = "#776f67";

const firstName = (full: string | null): string => {
  if (!full) return "caminante";
  const n = full.trim().split(/\s+/)[0] || "caminante";
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
};

// Cascarón brandeado compartido (mismo lenguaje que notify-customer).
function shell(inner: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:${CREMA};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREMA};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border:1px solid ${ARENA};border-radius:18px;overflow:hidden;">
<tr><td style="padding:32px 36px 8px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="font-size:12px;letter-spacing:3px;color:${OLIVO};text-transform:uppercase;">Caminante &middot; Programa de embajadores</div></td></tr>
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

const enviar = (to: string, subject: string, html: string, text: string) =>
  sendViaResend(to, subject, html, { ua: "caminante-embajadores/1.0", text });

// 1 · Confirmación al aplicante (al enviar el formulario).
export async function emailConfirmacionAplicacion(to: string, nombre: string | null): Promise<boolean> {
  const n = firstName(nombre);
  const html = shell(
    h1(`Recibimos tu aplicación, ${n}.`) +
      p("Gracias por querer caminar con nosotros. El programa es curado: leemos cada aplicación con calma y con cuidado.") +
      p("Si tu perfil hace clic, te escribimos para agendar una llamada de 30 minutos y platicar. Si no por ahora, también te lo decimos — no dejamos a nadie en visto.") +
      p("Mientras tanto puedes conocer nuestras experiencias en <a href=\"" + SITE + "/caminante\" style=\"color:" + LAGOON + ";\">caminante.numanhub.com</a>."),
  );
  const text = `Recibimos tu aplicación, ${n}.\n\nGracias por querer caminar con nosotros. El programa es curado: leemos cada aplicación con calma.\n\nSi tu perfil hace clic, te escribimos para agendar una llamada de 30 minutos. Si no por ahora, también te lo decimos.\n\nCaminante by NUMAN · uno@numanhub.com`;
  return enviar(to, "Recibimos tu aplicación al programa de embajadores", html, text);
}

// 2 · Bienvenida (al APROBAR).
export async function emailBienvenidaEmbajador(to: string, nombre: string | null): Promise<boolean> {
  const n = firstName(nombre);
  const html = shell(
    h1(`Bienvenido al programa, ${n}.`) +
      p("Tu aplicación nos hizo clic. <strong>Ya eres parte del programa de embajadores de Caminante.</strong>") +
      p("El siguiente paso: te escribimos por WhatsApp para agendar una llamada de 30 minutos — ahí platicamos cómo trabaja el programa, eliges tu primera experiencia y firmamos el convenio (con la hoja de costeo a la vista, como debe ser).") +
      p("Tu comunidad ya quiere vivir esto. Tráela."),
  );
  const text = `Bienvenido al programa, ${n}.\n\nTu aplicación nos hizo clic. Ya eres parte del programa de embajadores de Caminante.\n\nSiguiente paso: te escribimos por WhatsApp para agendar una llamada de 30 minutos — ahí platicamos el programa, eliges tu primera experiencia y firmamos el convenio.\n\nCaminante by NUMAN · uno@numanhub.com`;
  return enviar(to, "Bienvenido al programa de embajadores de Caminante", html, text);
}

// 3 · "Por ahora no" (al RECHAZAR) — amable, deja la puerta abierta.
export async function emailRechazoAplicacion(to: string, nombre: string | null): Promise<boolean> {
  const n = firstName(nombre);
  const html = shell(
    h1(`Gracias por aplicar, ${n}.`) +
      p("Leímos tu aplicación con cuidado. Por ahora no vamos a avanzar — el programa arranca con muy pocas manos y estamos eligiendo perfiles que empatan con las experiencias que tenemos abiertas hoy.") +
      p("Esto no es un no definitivo: el catálogo crece y el programa también. Si tu comunidad o tu proyecto cambian, nos encantará leerte de nuevo.") +
      p("Mientras tanto, las puertas de nuestras salidas están abiertas para ti en <a href=\"" + SITE + "/caminante\" style=\"color:" + LAGOON + ";\">caminante.numanhub.com</a>."),
  );
  const text = `Gracias por aplicar, ${n}.\n\nLeímos tu aplicación con cuidado. Por ahora no vamos a avanzar — el programa arranca con muy pocas manos.\n\nNo es un no definitivo: si tu comunidad o tu proyecto cambian, nos encantará leerte de nuevo.\n\nCaminante by NUMAN · uno@numanhub.com`;
  return enviar(to, "Sobre tu aplicación al programa de embajadores", html, text);
}

// 4 · Aviso al ADMIN de aplicación nueva (para que ninguna se quede en visto).
export async function emailAvisoAdminAplicacion(info: {
  nombre: string;
  email: string;
  whatsapp: string | null;
  perfil: string;
  links: string;
}): Promise<boolean> {
  const fila = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;font-size:13px;color:${OLIVO};white-space:nowrap;vertical-align:top;">${k}</td><td style="padding:6px 0 6px 18px;font-size:14px;color:${LAGOON};">${v}</td></tr>`;
  const html = shell(
    h1("Aplicación nueva de embajador") +
      `<tr><td style="padding:0 36px 10px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREMA};border:1px solid ${ARENA};border-radius:12px;"><tr><td style="padding:14px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${fila("Nombre", info.nombre)}${fila("Correo", info.email)}${fila("WhatsApp", info.whatsapp || "—")}${fila("Perfil", info.perfil)}${fila("Redes", info.links)}</table></td></tr></table></td></tr>` +
      `<tr><td align="center" style="padding:14px 36px 8px;"><a href="${SITE}/caminante/admin/comunidad" target="_blank" style="display:inline-block;background:${LAGOON};color:#fff;text-decoration:none;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;padding:12px 28px;border-radius:999px;">Revisar en el panel</a></td></tr>`,
  );
  const text = `Aplicación nueva de embajador\n\nNombre: ${info.nombre}\nCorreo: ${info.email}\nWhatsApp: ${info.whatsapp || "—"}\nPerfil: ${info.perfil}\nRedes: ${info.links}\n\nRevisar: ${SITE}/caminante/admin/comunidad`;
  return enviar(ADMIN_EMAIL, `Embajador aplica: ${info.nombre}`, html, text);
}
