// Cliente del WhatsApp Cloud API (Graph). Una sola fuente para mandar mensajes —
// lo usan el webhook (auto-acknowledge), el cobro por WhatsApp y el bot a futuro.
// Creds del entorno: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, WHATSAPP_GRAPH_VERSION.

export type WaSendResult = { ok: true; id: string } | { ok: false; error: string };

function cfg() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const version = process.env.WHATSAPP_GRAPH_VERSION || "v21.0";
  if (!phoneNumberId || !token) {
    return { ok: false as const, error: "Faltan WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN" };
  }
  return { ok: true as const, phoneNumberId, token, version };
}

async function post(body: Record<string, unknown>): Promise<WaSendResult> {
  const c = cfg();
  if (!c.ok) return { ok: false, error: c.error };
  try {
    const res = await fetch(`https://graph.facebook.com/${c.version}/${c.phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
    });
    const json = await res.json();
    const id = json?.messages?.[0]?.id;
    if (res.ok && id) return { ok: true, id };
    return { ok: false, error: json?.error?.message || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Texto libre — SOLO válido dentro de la ventana de 24h desde el último inbound del usuario.
export function sendText(to: string, body: string): Promise<WaSendResult> {
  return post({ to, type: "text", text: { preview_url: true, body } });
}

// Template aprobado — único camino para escribir fuera de la ventana de 24h (lista fría).
export function sendTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  components?: unknown[],
): Promise<WaSendResult> {
  return post({
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components ? { components } : {}),
    },
  });
}

export function whatsappConfigured(): boolean {
  return cfg().ok;
}
