// Notificación a Luis cuando cae una reserva. Tres vías en cascada, todas
// best-effort (JAMÁS rompen el webhook/flujo que las dispara):
//   1. WhatsApp texto libre (bot, ventana de 24h abierta si Luis le ha escrito).
//   2. WhatsApp template `nueva_reserva` (UTILITY, es_MX) si la ventana cerró.
//   3. Correo vía Resend — SIEMPRE se manda (respaldo con el detalle completo).
//
// Reusa el cliente del bot (src/lib/whatsapp/client.ts): mismas creds de Meta
// (número de prueba, destinatarios permitidos incluyen al admin).
// Overrides por env: WHATSAPP_ADMIN_TO, WHATSAPP_ADMIN_TEMPLATE.

import { sendText, sendTemplate, whatsappConfigured } from "@/lib/whatsapp/client";

const ADMIN_EMAIL = "uno@numanhub.com";
const FROM = "Caminante <caminante@numanhub.com>";
const ADMIN_WHATSAPP_DEFAULT = "+525512020565";
const PANEL = "https://caminante.numanhub.com/caminante/admin/reservas";

export type NuevaReservaInfo = {
  cliente: string;
  experiencia: string;
  salida: string;
  personas: number;
  montoMxn: number; // 0 = sin pago (reserva confirmada por registro)
  metodo: string; // "Stripe (pago web)" | "Registro con deslinde (sin pago aún)" | …
  canal: string; // web | whatsapp | admin
};

function fmt(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

async function mandarCorreo(info: NuevaReservaInfo): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const monto = info.montoMxn > 0 ? fmt(info.montoMxn) : "sin pago aún";
  const subject = `Nueva reserva · ${info.experiencia} — ${info.cliente} (${info.personas}p, ${monto})`;
  const fila = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px;color:#637154;font-size:13px;">${k}</td><td style="padding:6px 12px;font-size:14px;font-weight:600;color:#20211c;">${v}</td></tr>`;
  const html = `<body style="margin:0;background:#fbfbf7;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid rgba(32,33,28,.13);border-radius:16px;overflow:hidden;">
<div style="background:#20392b;color:#fff;padding:16px 20px;font-size:13px;letter-spacing:.18em;text-transform:uppercase;">Caminante · Nueva reserva</div>
<table style="width:100%;border-collapse:collapse;">
${fila("Cliente", info.cliente)}
${fila("Experiencia", info.experiencia)}
${fila("Salida", info.salida)}
${fila("Personas", String(info.personas))}
${fila("Monto", monto)}
${fila("Pago", info.metodo)}
${fila("Canal", info.canal)}
</table>
<div style="padding:14px 20px 20px;"><a href="${PANEL}" style="display:inline-block;background:#ff5d36;color:#fff;text-decoration:none;border-radius:999px;padding:10px 22px;font-size:14px;font-weight:600;">Ver en el panel</a></div>
</div></body>`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "User-Agent": "caminante-notify/1.0", // Resend tras Cloudflare: sin UA → 403
      Accept: "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [ADMIN_EMAIL], subject, html }),
  });
}

async function mandarWhatsApp(info: NuevaReservaInfo): Promise<void> {
  if (!whatsappConfigured()) return; // sin creds de Meta — el correo cubre
  const to = process.env.WHATSAPP_ADMIN_TO || ADMIN_WHATSAPP_DEFAULT;
  const monto = info.montoMxn > 0 ? fmt(info.montoMxn) : "sin pago aún";

  // 1º texto libre (solo entrega dentro de la ventana de 24h del admin con el bot)
  const texto =
    `🌿 *Nueva reserva* — ${info.experiencia}\n` +
    `${info.cliente} · ${info.salida}\n` +
    `${info.personas} persona(s) · ${monto} · ${info.metodo}\n\n` +
    PANEL;
  const libre = await sendText(to, texto);
  if (libre.ok) return;

  // 2º ventana cerrada (o texto rechazado) → template UTILITY `nueva_reserva`
  // (es_MX, 3 variables: cliente / experiencia·salida / detalle). Si aún no está
  // aprobado, falla en silencio: el correo respalda.
  const template = process.env.WHATSAPP_ADMIN_TEMPLATE || "nueva_reserva";
  await sendTemplate(to, template, "es_MX", [
    {
      type: "body",
      parameters: [
        info.cliente,
        `${info.experiencia} · ${info.salida}`,
        `${info.personas} persona(s) · ${monto} · ${info.metodo}`,
      ].map((text) => ({ type: "text", text: text || "—" })),
    },
  ]);
}

// Best-effort total: los errores se tragan con log — una notificación caída
// jamás debe tirar un webhook de pago.
export async function notifyNuevaReserva(info: NuevaReservaInfo): Promise<void> {
  const resultados = await Promise.allSettled([mandarCorreo(info), mandarWhatsApp(info)]);
  for (const r of resultados) {
    if (r.status === "rejected") {
      console.error("notifyNuevaReserva:", r.reason);
    }
  }
}

// ── Solicitud de fecha nueva (slot_requests) ─────────────────────────────────
// Misma cascada best-effort que las reservas: WhatsApp texto libre → template
// (reusa `nueva_reserva` con variables genéricas — sin esperar otra aprobación
// de Meta) → correo Resend SIEMPRE.

const PANEL_SOLICITUDES = "https://caminante.numanhub.com/caminante/admin/solicitudes";

export type SolicitudFechaInfo = {
  cliente: string;
  whatsapp: string;
  experiencia: string;
  fecha: string; // "12 dic 2026" o "flexible: <nota>"
  personas: number;
  tipo: "privado" | "abierto";
  nota?: string;
};

async function correoSolicitud(info: SolicitudFechaInfo): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const subject = `Solicitud de fecha · ${info.experiencia} — ${info.cliente} (${info.personas}p, grupo ${info.tipo})`;
  const fila = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px;color:#637154;font-size:13px;">${k}</td><td style="padding:6px 12px;font-size:14px;font-weight:600;color:#20211c;">${v}</td></tr>`;
  const html = `<body style="margin:0;background:#fbfbf7;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid rgba(32,33,28,.13);border-radius:16px;overflow:hidden;">
<div style="background:#20392b;color:#fff;padding:16px 20px;font-size:13px;letter-spacing:.18em;text-transform:uppercase;">Caminante · Solicitud de fecha</div>
<table style="width:100%;border-collapse:collapse;">
${fila("Cliente", info.cliente)}
${fila("WhatsApp", info.whatsapp || "—")}
${fila("Experiencia", info.experiencia)}
${fila("Fecha deseada", info.fecha)}
${fila("Personas", String(info.personas))}
${fila("Tipo de grupo", info.tipo)}
${info.nota ? fila("Nota", info.nota) : ""}
</table>
<div style="padding:14px 20px 20px;"><a href="${PANEL_SOLICITUDES}" style="display:inline-block;background:#ff5d36;color:#fff;text-decoration:none;border-radius:999px;padding:10px 22px;font-size:14px;font-weight:600;">Ver solicitudes</a></div>
</div></body>`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "User-Agent": "caminante-notify/1.0",
      Accept: "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [ADMIN_EMAIL], subject, html }),
  });
}

async function whatsappSolicitud(info: SolicitudFechaInfo): Promise<void> {
  if (!whatsappConfigured()) return;
  const to = process.env.WHATSAPP_ADMIN_TO || ADMIN_WHATSAPP_DEFAULT;
  const texto =
    `🗓️ *Solicitud de fecha* — ${info.experiencia}\n` +
    `${info.cliente} (${info.whatsapp || "sin WA"})\n` +
    `${info.fecha} · ${info.personas} persona(s) · grupo ${info.tipo}\n` +
    (info.nota ? `“${info.nota}”\n` : "") +
    `\n${PANEL_SOLICITUDES}`;
  const libre = await sendText(to, texto);
  if (libre.ok) return;
  const template = process.env.WHATSAPP_ADMIN_TEMPLATE || "nueva_reserva";
  await sendTemplate(to, template, "es_MX", [
    {
      type: "body",
      parameters: [
        info.cliente,
        `${info.experiencia} · ${info.fecha}`,
        `${info.personas} persona(s) · grupo ${info.tipo} · SOLICITUD de fecha`,
      ].map((text) => ({ type: "text", text: text || "—" })),
    },
  ]);
}

export async function notifySolicitudFecha(info: SolicitudFechaInfo): Promise<void> {
  const resultados = await Promise.allSettled([correoSolicitud(info), whatsappSolicitud(info)]);
  for (const r of resultados) {
    if (r.status === "rejected") console.error("notifySolicitudFecha:", r.reason);
  }
}
