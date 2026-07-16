// OAuth de "Instagram API with Instagram Login" (Business Login) — NO Facebook
// Login, NO requiere página de FB. Flujo: authorize → code → token corto → token
// largo (~60 días) → ig_user_id + username. Una sola fuente (patrón cfg()/post()
// de whatsapp/client.ts). El publicador (a futuro) reusa el token que esto guarda.
//
// ⚠️ IMPORTANTE (doc Meta 2024+): en Instagram Login el `client_id` de authorize
// es el **Instagram App ID** (App Dashboard → Instagram → API setup with Instagram
// login → Business login settings), que NO es el Meta App ID. Igual el secret es
// el **Instagram App Secret**. Por eso cfg() lee vars propias de Instagram y cae a
// las de Meta solo como respaldo.

import crypto from "crypto";

// Permisos: perfil básico + publicar contenido. (Nombres vigentes 2024+.)
export const IG_SCOPES = ["instagram_business_basic", "instagram_business_content_publish"] as const;

const AUTHORIZE = "https://www.instagram.com/oauth/authorize";
const SHORT_TOKEN = "https://api.instagram.com/oauth/access_token";
const GRAPH = "https://graph.instagram.com";

// El redirect_uri DEBE coincidir EXACTO con el registrado en la app de Meta. Se
// fija al dominio canónico (no al host de la request) para que valga igual desde
// preview o producción: el callback cae en producción y escribe en la BD compartida.
function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://caminante.numanhub.com").replace(/\/$/, "");
}
export function redirectUri(): string {
  return `${siteUrl()}/caminante/api/redes/instagram/callback`;
}

type Cfg =
  | { ok: true; appId: string; appSecret: string }
  | { ok: false; error: string };

export function cfg(): Cfg {
  const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    return { ok: false, error: "Faltan NEXT_PUBLIC_INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET (o los META_ de respaldo)" };
  }
  return { ok: true, appId, appSecret };
}

export function instagramConfigured(): boolean {
  return cfg().ok;
}

// ── CSRF state firmado ────────────────────────────────────────────────────────
// state = base64url(payload).hmac  — el payload lleva un nonce, el timestamp y la
// ruta de regreso. Se firma con la service-role (siempre presente en el server);
// el callback verifica firma + frescura (10 min). Nunca confiar en un state sin firma.
function stateSecret(): string {
  return process.env.SOCIAL_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "caminante-fallback";
}
function b64url(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url");
}
export function signState(returnTo: string): string {
  const payload = JSON.stringify({ n: crypto.randomBytes(8).toString("hex"), t: Date.now(), r: returnTo });
  const body = b64url(payload);
  const mac = crypto.createHmac("sha256", stateSecret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}
export function verifyState(state: string | null): { ok: boolean; returnTo?: string } {
  if (!state || !state.includes(".")) return { ok: false };
  const [body, mac] = state.split(".");
  const expected = crypto.createHmac("sha256", stateSecret()).update(body).digest("base64url");
  // timingSafeEqual exige el mismo largo → comparar largos primero.
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) {
    return { ok: false };
  }
  try {
    const { t, r } = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { t: number; r?: string };
    if (typeof t !== "number" || Date.now() - t > 10 * 60 * 1000) return { ok: false }; // 10 min
    return { ok: true, returnTo: typeof r === "string" ? r : undefined };
  } catch {
    return { ok: false };
  }
}

// ── URL de autorización ───────────────────────────────────────────────────────
export function authorizeUrl(state: string): { ok: true; url: string } | { ok: false; error: string } {
  const c = cfg();
  if (!c.ok) return c;
  const p = new URLSearchParams({
    client_id: c.appId,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: IG_SCOPES.join(","),
    state,
  });
  return { ok: true, url: `${AUTHORIZE}?${p.toString()}` };
}

// ── Intercambios de token ─────────────────────────────────────────────────────
export type ShortToken = { accessToken: string; userId: string; permissions?: string[] };

export async function exchangeCode(code: string): Promise<{ ok: true; data: ShortToken } | { ok: false; error: string }> {
  const c = cfg();
  if (!c.ok) return c;
  try {
    const body = new URLSearchParams({
      client_id: c.appId,
      client_secret: c.appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri(),
      code: code.replace(/#_$/, ""), // Meta a veces agrega '#_' al final del code
    });
    const res = await fetch(SHORT_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = await res.json();
    if (!res.ok || !json?.access_token) return { ok: false, error: json?.error_message || json?.error?.message || `HTTP ${res.status}` };
    return {
      ok: true,
      data: {
        accessToken: json.access_token as string,
        userId: String(json.user_id ?? ""),
        permissions: Array.isArray(json.permissions) ? json.permissions : undefined,
      },
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export type LongToken = { accessToken: string; expiresInSec: number };

export async function exchangeLongLived(shortToken: string): Promise<{ ok: true; data: LongToken } | { ok: false; error: string }> {
  const c = cfg();
  if (!c.ok) return c;
  try {
    const p = new URLSearchParams({ grant_type: "ig_exchange_token", client_secret: c.appSecret, access_token: shortToken });
    const res = await fetch(`${GRAPH}/access_token?${p.toString()}`);
    const json = await res.json();
    if (!res.ok || !json?.access_token) return { ok: false, error: json?.error?.message || `HTTP ${res.status}` };
    return { ok: true, data: { accessToken: json.access_token as string, expiresInSec: Number(json.expires_in ?? 5184000) } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Refresca un long-lived (debe tener ≥24h de vida y no estar expirado). Devuelve
// uno nuevo con ~60 días más.
export async function refreshLongLived(token: string): Promise<{ ok: true; data: LongToken } | { ok: false; error: string }> {
  try {
    const p = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: token });
    const res = await fetch(`${GRAPH}/refresh_access_token?${p.toString()}`);
    const json = await res.json();
    if (!res.ok || !json?.access_token) return { ok: false, error: json?.error?.message || `HTTP ${res.status}` };
    return { ok: true, data: { accessToken: json.access_token as string, expiresInSec: Number(json.expires_in ?? 5184000) } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Perfil (id de la cuenta IG + username) con el token ya obtenido.
export async function fetchProfile(token: string): Promise<{ ok: true; igUserId: string; username: string } | { ok: false; error: string }> {
  try {
    const p = new URLSearchParams({ fields: "user_id,username", access_token: token });
    const res = await fetch(`${GRAPH}/me?${p.toString()}`);
    const json = await res.json();
    if (!res.ok || (!json?.user_id && !json?.username)) return { ok: false, error: json?.error?.message || `HTTP ${res.status}` };
    return { ok: true, igUserId: String(json.user_id ?? ""), username: String(json.username ?? "") };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
