// El correo que avisa un reembolso.
//
// REUSA el armazón de `lib/operadores/emails.ts` a propósito — mismo criterio
// que ahí: ese cascarón ya sobrevivió Gmail y Apple Mail de verdad (remitente
// «Luis · Caminante» que lo saca de Promociones, tablas aplanadas para que no
// se corte en iPhone). Un segundo sistema de correo volvería a aprender las
// mismas lecciones caras.
//
// ⚠️ Sale SOLO cuando Stripe ya confirmó. Un correo que dice «te devolvimos tu
// dinero» antes de que el dinero se mueva es una promesa que no controlamos.

import { sendViaResend } from "@/lib/email/resend";

const CREMA = "#fbfbf7";
const LAGOON = "#3e4836";
const ARENA = "#d4cec6";
const OLIVO = "#776f67";

const firstName = (full: string | null): string => {
  if (!full) return "hola";
  const n = full.trim().split(/\s+/)[0] || "hola";
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
};

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const pesos = (n: number): string => "$" + Math.round(n).toLocaleString("es-MX");

function shell(inner: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:${CREMA};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREMA};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border:1px solid ${ARENA};border-radius:18px;overflow:hidden;">
<tr><td style="padding:32px 36px 8px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="font-size:12px;letter-spacing:3px;color:${OLIVO};text-transform:uppercase;">Caminante</div></td></tr>
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

/**
 * @param cancelada true = se cayó la salida entera. El motivo cambia el tono:
 *   quien se dio de baja ya sabe por qué; a quien le cancelaron el viaje hay
 *   que decírselo, no dejarlo deducirlo de un movimiento en su tarjeta.
 */
export async function emailReembolso(i: {
  to: string;
  nombre: string | null;
  experiencia: string;
  salida: string;
  monto: number;
  cancelada: boolean;
}): Promise<boolean> {
  const n = firstName(i.nombre);
  const viaje = `${esc(i.experiencia)}${i.salida ? ` · ${esc(i.salida)}` : ""}`;
  const titulo = i.cancelada ? `${n}, cancelamos esta salida.` : `${n}, tu reembolso va en camino.`;
  const primera = i.cancelada
    ? `Tuvimos que cancelar <b>${viaje}</b>. Sentimos mucho el cambio de planes — no es una decisión que tomemos a la ligera.`
    : `Cancelamos tu lugar en <b>${viaje}</b> y te devolvimos lo que pagaste.`;

  const html = shell(
    h1(titulo) +
      p(primera) +
      p(`Te reembolsamos <b>${pesos(i.monto)} MXN</b> por la misma tarjeta con la que pagaste. Tu banco suele tardar entre 5 y 10 días hábiles en reflejarlo; nosotros ya lo soltamos.`) +
      p(
        i.cancelada
          ? "Si quieres, te avisamos en cuanto abramos una fecha nueva. Nos encantaría caminar contigo."
          : "Si esto fue un error o quieres volver a apartar tu lugar, respóndenos y lo resolvemos.",
      ),
  );
  const text = `${titulo}\n\n${i.cancelada ? `Tuvimos que cancelar ${i.experiencia}${i.salida ? ` · ${i.salida}` : ""}.` : `Cancelamos tu lugar en ${i.experiencia}${i.salida ? ` · ${i.salida}` : ""} y te devolvimos lo que pagaste.`}\n\nReembolso: ${pesos(i.monto)} MXN, por la misma tarjeta. Tu banco suele tardar entre 5 y 10 días hábiles.\n\nCaminante by NUMAN · uno@numanhub.com`;

  return sendViaResend(i.to, i.cancelada ? "Cancelamos tu salida y te reembolsamos" : "Tu reembolso de Caminante", html, {
    ua: "caminante-reembolsos/1.0",
    text,
  });
}
