// Envío de correo por la API de Resend, con REINTENTO. Fuente única para todos
// los correos a cliente (encuesta, confirmación, deslinde). Antes cada módulo
// tenía su propio sendResend sin reintento: en envíos EN LOTE, los que topaban
// el rate limit de Resend (~2/seg → 429) se caían EN SILENCIO. Ahora reintenta
// ante 429 y 5xx con backoff, respetando Retry-After.
const FROM = "Caminante <caminante@numanhub.com>";
const REPLY_TO = "uno@numanhub.com";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  opts: { ua?: string } = {},
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to || !to.includes("@")) return false;
  const body = JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject, html });
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
