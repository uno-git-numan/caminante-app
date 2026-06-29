// Aviso a Luis cuando un lead escribe por WhatsApp, para que cierre en persona.
// Usa la API de Resend (RESEND_API_KEY ya está en el entorno). Si no hay key, no-op.

const FROM = "Caminante <caminante@numanhub.com>";
const TO = process.env.OPS_NOTIFY_EMAIL || "uno@numanhub.com";

export async function notifyLuis(lead: { name: string; phone: string; body: string }): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  const waLink = `https://wa.me/${lead.phone.replace(/\D/g, "")}`;
  const html =
    `<p><strong>${lead.name}</strong> escribió por WhatsApp:</p>` +
    `<blockquote>${lead.body.replace(/</g, "&lt;")}</blockquote>` +
    `<p>📱 ${lead.phone} — <a href="${waLink}">abrir chat</a></p>` +
    `<p style="color:#5F5F40;font-size:13px">El bot ya mandó un acuse. Responde tú para cerrar.</p>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: TO,
        subject: `🌊 Lead WhatsApp: ${lead.name}`,
        html,
      }),
    });
  } catch {
    // best-effort; el lead ya quedó guardado en Supabase
  }
}
