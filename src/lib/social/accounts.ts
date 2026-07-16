// Capa de datos de social_accounts (0025). SIEMPRE con el service-role: el token
// es secreto (RLS bloqueada). A la UI solo se devuelve una vista SIN token.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { refreshLongLived } from "@/lib/social/instagram";

export type SocialAccount = {
  id: string;
  provider: string;
  igUserId: string | null;
  username: string | null;
  tokenExpiresAt: string | null;
  scopes: string[] | null;
  status: "connected" | "expired" | "revoked";
  connectedBy: string | null;
  updatedAt: string;
};

type Row = {
  id: string;
  provider: string;
  ig_user_id: string | null;
  username: string | null;
  access_token: string | null;
  token_expires_at: string | null;
  scopes: string[] | null;
  status: SocialAccount["status"];
  connected_by: string | null;
  updated_at: string;
};

// Vista pública (SIN token) para la UI.
function toPublic(r: Row): SocialAccount {
  return {
    id: r.id,
    provider: r.provider,
    igUserId: r.ig_user_id,
    username: r.username,
    tokenExpiresAt: r.token_expires_at,
    scopes: r.scopes,
    status: r.status,
    connectedBy: r.connected_by,
    updatedAt: r.updated_at,
  };
}

const SELECT_PUBLIC = "id, provider, ig_user_id, username, token_expires_at, scopes, status, connected_by, updated_at";

// Cuenta CONECTADA de la plataforma (operator_id NULL) para un proveedor.
export async function fetchConnectedAccount(provider = "instagram"): Promise<SocialAccount | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("social_accounts")
    .select(SELECT_PUBLIC)
    .eq("provider", provider)
    .is("operator_id", null)
    .eq("status", "connected")
    .maybeSingle();
  return data ? toPublic(data as Row) : null;
}

// Guarda/actualiza la cuenta de la plataforma tras un OAuth exitoso. App-level
// upsert (solo el service-role escribe → sin carrera real): si ya hay una fila
// conectada para (provider, operador NULL), la ACTUALIZA (reconectar = reemplaza);
// si no, inserta. "Cambiar cuenta" pasa por aquí y sobreescribe la misma fila.
export async function upsertConnectedAccount(input: {
  provider?: string;
  igUserId: string;
  username: string;
  accessToken: string;
  expiresInSec: number;
  scopes: string[];
  connectedBy?: string | null;
}): Promise<void> {
  const sb = createSupabaseAdminClient();
  const provider = input.provider ?? "instagram";
  const expiresAt = new Date(Date.now() + input.expiresInSec * 1000).toISOString();
  const patch = {
    provider,
    ig_user_id: input.igUserId,
    username: input.username,
    access_token: input.accessToken,
    token_expires_at: expiresAt,
    scopes: input.scopes,
    status: "connected" as const,
    connected_by: input.connectedBy ?? null,
    operator_id: null,
  };
  const { data: existing } = await sb
    .from("social_accounts")
    .select("id")
    .eq("provider", provider)
    .is("operator_id", null)
    .eq("status", "connected")
    .maybeSingle();
  if (existing?.id) {
    await sb.from("social_accounts").update(patch).eq("id", (existing as { id: string }).id);
  } else {
    await sb.from("social_accounts").insert(patch);
  }
}

// Desconectar = borra la fila (limpia el token del sistema).
export async function disconnectAccount(id: string): Promise<void> {
  const sb = createSupabaseAdminClient();
  await sb.from("social_accounts").delete().eq("id", id);
}

// Refresca los long-lived tokens que están por vencer (default: < 10 días).
// Marca 'expired' si el refresh falla. Best-effort; devuelve un resumen.
export async function refreshExpiringTokens(withinDays = 10): Promise<{ checked: number; refreshed: number; expired: number }> {
  const sb = createSupabaseAdminClient();
  const cutoff = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await sb
    .from("social_accounts")
    .select("id, access_token, token_expires_at")
    .eq("status", "connected")
    .not("access_token", "is", null)
    .lt("token_expires_at", cutoff);
  const rows = (data || []) as { id: string; access_token: string; token_expires_at: string | null }[];
  let refreshed = 0;
  let expired = 0;
  for (const r of rows) {
    const res = await refreshLongLived(r.access_token);
    if (res.ok) {
      await sb
        .from("social_accounts")
        .update({ access_token: res.data.accessToken, token_expires_at: new Date(Date.now() + res.data.expiresInSec * 1000).toISOString() })
        .eq("id", r.id);
      refreshed++;
    } else {
      await sb.from("social_accounts").update({ status: "expired" }).eq("id", r.id);
      expired++;
    }
  }
  return { checked: rows.length, refreshed, expired };
}
