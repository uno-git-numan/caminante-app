// Envío de correo por la API de Resend, con REINTENTO. Fuente única para todos
// los correos a cliente (encuesta, confirmación, deslinde). Antes cada módulo
// tenía su propio sendResend sin reintento: en envíos EN LOTE, los que topaban
// el rate limit de Resend (~2/seg → 429) se caían EN SILENCIO. Ahora reintenta
// ante 429 y 5xx con backoff, respetando Retry-After.
const FROM = "Caminante <caminante@numanhub.com>";
const REPLY_TO = "uno@numanhub.com";
// El dominio de envío es siempre caminante@numanhub.com (el verificado en
// Resend, DMARC-safe); solo el NOMBRE visible cambia por tipo de correo.
const DIR = "caminante@numanhub.com";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  // text = versión en texto plano (multipart → mejor deliverability, menos spam).
  // listUnsubscribeUrl = baja de un clic (List-Unsubscribe + One-Click, RFC 8058);
  // los correos en lote la llevan → Gmail/Yahoo los premian.
  // fromName = nombre visible del remitente (default "Caminante"). El boletín lo
  // firma "Luis" para que se lea 1:1 y caiga en Principal; los comprobantes y
  // deslindes se quedan con la marca — NO tocar su default.
  opts: { ua?: string; text?: string; listUnsubscribeUrl?: string; fromName?: string } = {},
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to || !to.includes("@")) return false;
  const from = opts.fromName ? `${opts.fromName} <${DIR}>` : FROM;
  const payload: Record<string, unknown> = { from, to: [to], reply_to: REPLY_TO, subject, html };
  if (opts.text) payload.text = opts.text;
  if (opts.listUnsubscribeUrl) {
    payload.headers = {
      "List-Unsubscribe": `<${opts.listUnsubscribeUrl}>, <mailto:${REPLY_TO}?subject=Baja>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  }
  const body = JSON.stringify(payload);
  const headers = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "User-Agent": opts.ua || "caminante/1.0", // Resend tras Cloudflare: sin UA → 403/1010
    Accept: "application/json",
  };
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch("https://api.resend.com/emails", { method: "POST", headers, body });
      if (r.status === 200 || r.status === 201) return true;
      // 429 (rate limit) o 5xx → esperar y reintentar
      if (r.status === 429 || r.status >= 500) {
        const ra = Number(r.headers.get("retry-after"));
        await sleep(ra > 0 ? ra * 1000 : 700 * (attempt + 1));
        continue;
      }
      return false; // 4xx no recuperable (correo inválido, etc.)
    } catch {
      await sleep(700 * (attempt + 1));
    }
  }
  return false;
}
