// Emisor server-side de Meta Conversions API (CAPI). Fuente única para mandar
// eventos de conversión a Meta desde el servidor — inmune a bloqueadores de
// anuncios / iOS ITP / rechazo de cookies, y captura ventas que no tienen
// navegador (pago por WhatsApp → Stripe hosted → webhook). Calcado del patrón
// de whatsapp/client.ts: cfg()/post() best-effort, NUNCA lanza (jamás tira el webhook).
//
// Privacidad (LFPDPPP): user_data = SOLO identificadores comerciales hasheados
// (email, teléfono, nombre, external_id=contact UUID) + fbp/fbc (no se hashean).
// JAMÁS datos médicos, y nada de esto va a Notion.
//
// Dedup con el pixel del navegador vía event_id (= Stripe PaymentIntent id en Purchase):
// si el mismo evento llega por navegador y por servidor, Meta lo cuenta una sola vez.

import crypto from "node:crypto";
import { normalizeEmail } from "@/lib/crm/contacts";

// El id del pixel también vive literal en layout.tsx / los HTML estáticos.
const PIXEL_ID_FALLBACK = "1510394930300051";

function cfg() {
  const pixelId =
    process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || PIXEL_ID_FALLBACK;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  const version = process.env.META_GRAPH_VERSION || "v21.0";
  const testCode = process.env.META_TEST_EVENT_CODE || undefined;
  if (!token) {
    return { ok: false as const, error: "Falta META_CAPI_ACCESS_TOKEN" };
  }
  return { ok: true as const, pixelId, token, version, testCode };
}

// ¿Está cableado el CAPI? Si es false, todo hace no-op (el pago se registra igual).
export function capiConfigured(): boolean {
  return cfg().ok;
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// Teléfono para Meta: SOLO dígitos, CON lada país, SIN "+". Reusa la lógica de
// replyNumber (MX legacy móvil 521→52) y antepone 52 a un número local de 10 dígitos.
function normalizePhoneForMeta(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("521") && digits.length === 13) digits = "52" + digits.slice(3);
  if (digits.length === 10) digits = "52" + digits; // 10 dígitos pelones = MX local
  return digits;
}

export type CapiUserData = {
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
  externalId?: string | null; // contact UUID (se hashea igual)
  fbp?: string | null; // cookie _fbp — NO se hashea
  fbc?: string | null; // cookie _fbc — NO se hashea
  clientIp?: string | null;
  userAgent?: string | null;
};

export type CapiCustomData = {
  value?: number;
  currency?: string;
  contentIds?: string[];
  contentType?: string;
  contentName?: string;
  numItems?: number;
};

// Construye user_data para Meta: PII hasheada con SHA-256 (email/tel/nombre/external_id),
// fbp/fbc/ip/ua en claro (así los espera Meta). Solo incluye lo que hay.
function buildUserData(u: CapiUserData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const email = u.email ? normalizeEmail(u.email) : "";
  if (email) out.em = [sha256(email)];
  const phone = normalizePhoneForMeta(u.phone);
  if (phone) out.ph = [sha256(phone)];
  if (u.fullName) {
    const name = u.fullName.trim().toLowerCase();
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts[0]) out.fn = [sha256(parts[0])];
    if (parts.length > 1) out.ln = [sha256(parts.slice(1).join(" "))];
  }
  if (u.externalId) out.external_id = [sha256(String(u.externalId).trim().toLowerCase())];
  if (u.fbp) out.fbp = u.fbp;
  if (u.fbc) out.fbc = u.fbc;
  if (u.clientIp) out.client_ip_address = u.clientIp;
  if (u.userAgent) out.client_user_agent = u.userAgent;
  return out;
}

export type CapiResult = { ok: true } | { ok: false; error: string };

export type CapiActionSource =
  | "website"
  | "chat"
  | "system_generated"
  | "physical_store"
  | "email"
  | "app"
  | "phone_call"
  | "other";

export async function sendCapiEvent(params: {
  eventName: string;
  eventId?: string;
  eventTime?: number; // unix seconds; default: ahora
  actionSource?: CapiActionSource;
  eventSourceUrl?: string;
  userData: CapiUserData;
  customData?: CapiCustomData;
}): Promise<CapiResult> {
  const c = cfg();
  if (!c.ok) return { ok: false, error: c.error };
  try {
    const custom: Record<string, unknown> = {};
    if (params.customData) {
      const d = params.customData;
      if (d.value != null) custom.value = d.value;
      if (d.currency) custom.currency = d.currency;
      if (d.contentIds?.length) custom.content_ids = d.contentIds;
      if (d.contentType) custom.content_type = d.contentType;
      if (d.contentName) custom.content_name = d.contentName;
      if (d.numItems != null) custom.num_items = d.numItems;
    }

    const event: Record<string, unknown> = {
      event_name: params.eventName,
      event_time: params.eventTime ?? Math.floor(Date.now() / 1000),
      action_source: params.actionSource ?? "website",
      user_data: buildUserData(params.userData),
    };
    if (params.eventId) event.event_id = params.eventId;
    if (params.eventSourceUrl) event.event_source_url = params.eventSourceUrl;
    if (Object.keys(custom).length) event.custom_data = custom;

    const body: Record<string, unknown> = { data: [event] };
    if (c.testCode) body.test_event_code = c.testCode;

    const res = await fetch(
      `https://graph.facebook.com/${c.version}/${c.pixelId}/events?access_token=${encodeURIComponent(c.token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const json = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true };
    return { ok: false, error: json?.error?.message || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Conveniencia para Purchase (la señal de dinero). eventId = Stripe PaymentIntent id.
export async function capiPurchase(params: {
  eventId: string;
  value: number;
  currency?: string;
  contentIds?: string[];
  numItems?: number;
  userData: CapiUserData;
  eventSourceUrl?: string;
  actionSource?: CapiActionSource;
}): Promise<CapiResult> {
  return sendCapiEvent({
    eventName: "Purchase",
    eventId: params.eventId,
    actionSource: params.actionSource ?? "website",
    eventSourceUrl: params.eventSourceUrl,
    userData: params.userData,
    customData: {
      value: params.value,
      currency: params.currency ?? "MXN",
      contentIds: params.contentIds,
      contentType: params.contentIds?.length ? "product" : undefined,
      numItems: params.numItems,
    },
  });
}
