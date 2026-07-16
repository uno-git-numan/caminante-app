// PUBLICADOR a Instagram (Content Publishing API con Instagram Login).
//
// Flujo por post: se crea un "container" con la URL PÚBLICA de la imagen y se
// publica. Carrusel = un container hijo por imagen (is_carousel_item) + un
// container padre CAROUSEL + publish. Story = container media_type=STORIES.
// Todo va contra graph.instagram.com con el token largo de social_accounts.
//
// ⚠️ Instagram NO recibe bytes: exige una URL pública de la imagen. Por eso el
// cliente sube el PNG al bucket público (experiences/uploads) y aquí solo se pasa
// la URL. El token es SECRETO: se lee con el service-role, jamás llega al cliente.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const GRAPH = "https://graph.instagram.com";
function ver(): string {
  return process.env.IG_GRAPH_VERSION || "v21.0";
}

export type AccountWithToken = {
  id: string;
  igUserId: string;
  token: string;
  username: string | null;
  expiresAt: string | null;
};

// Cuenta conectada de la plataforma CON su token (solo server / service-role).
// La UI usa fetchConnectedAccount (sin token); esto es solo para publicar.
export async function fetchAccountWithToken(provider = "instagram"): Promise<AccountWithToken | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("social_accounts")
    .select("id, ig_user_id, access_token, username, token_expires_at")
    .eq("provider", provider)
    .is("operator_id", null)
    .eq("status", "connected")
    .maybeSingle();
  const r = data as
    | { id: string; ig_user_id: string | null; access_token: string | null; username: string | null; token_expires_at: string | null }
    | null;
  if (!r || !r.access_token || !r.ig_user_id) return null;
  return { id: r.id, igUserId: r.ig_user_id, token: r.access_token, username: r.username, expiresAt: r.token_expires_at };
}

type GraphOk = { ok: true; id: string };
type GraphErr = { ok: false; error: string };

async function graphPost(path: string, params: Record<string, string>): Promise<GraphOk | GraphErr> {
  try {
    const res = await fetch(`${GRAPH}/${ver()}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.id) {
      return { ok: false, error: json?.error?.message || json?.error?.error_user_msg || `HTTP ${res.status}` };
    }
    return { ok: true, id: String(json.id) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Espera a que el container esté FINISHED (imágenes suelen estarlo al instante;
// carruseles a veces tardan). Best-effort: si no confirma, se intenta publicar igual.
async function waitReady(containerId: string, token: string, tries = 5): Promise<void> {
  for (let i = 0; i < tries; i++) {
    try {
      const p = new URLSearchParams({ fields: "status_code", access_token: token });
      const res = await fetch(`${GRAPH}/${ver()}/${containerId}?${p.toString()}`);
      const json = await res.json().catch(() => ({}));
      const code = json?.status_code;
      if (code === "FINISHED") return;
      if (code === "ERROR" || code === "EXPIRED") return;
    } catch {
      /* reintenta */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

async function publishContainer(igUserId: string, creationId: string, token: string): Promise<GraphOk | GraphErr> {
  return graphPost(`${igUserId}/media_publish`, { creation_id: creationId, access_token: token });
}

async function fetchPermalink(mediaId: string, token: string): Promise<string | undefined> {
  try {
    const p = new URLSearchParams({ fields: "permalink", access_token: token });
    const res = await fetch(`${GRAPH}/${ver()}/${mediaId}?${p.toString()}`);
    const json = await res.json().catch(() => ({}));
    return typeof json?.permalink === "string" ? json.permalink : undefined;
  } catch {
    return undefined;
  }
}

export type PublishInput = { format: "post" | "story"; imageUrls: string[]; caption?: string };
export type PublishResult = { ok: true; mediaId: string; permalink?: string } | { ok: false; error: string };

// Publica AHORA en la cuenta conectada de la plataforma.
export async function publishToInstagram(input: PublishInput): Promise<PublishResult> {
  const acct = await fetchAccountWithToken("instagram");
  if (!acct) return { ok: false, error: "No hay una cuenta de Instagram conectada (conéctala en el Kit)." };
  const { igUserId, token } = acct;
  const urls = (input.imageUrls || []).filter(Boolean);
  if (!urls.length) return { ok: false, error: "No hay imágenes para publicar." };
  const caption = input.caption || "";

  // ── STORY: cada lámina es una story independiente (IG no hace carrusel en story).
  if (input.format === "story") {
    let first = "";
    for (const url of urls) {
      const c = await graphPost(`${igUserId}/media`, { image_url: url, media_type: "STORIES", access_token: token });
      if (!c.ok) return c;
      await waitReady(c.id, token);
      const pub = await publishContainer(igUserId, c.id, token);
      if (!pub.ok) return pub;
      if (!first) first = pub.id;
    }
    return { ok: true, mediaId: first, permalink: await fetchPermalink(first, token) };
  }

  // ── POST de una sola imagen.
  if (urls.length === 1) {
    const c = await graphPost(`${igUserId}/media`, { image_url: urls[0], caption, access_token: token });
    if (!c.ok) return c;
    await waitReady(c.id, token);
    const pub = await publishContainer(igUserId, c.id, token);
    if (!pub.ok) return pub;
    return { ok: true, mediaId: pub.id, permalink: await fetchPermalink(pub.id, token) };
  }

  // ── CARRUSEL (2..10 imágenes).
  const children: string[] = [];
  for (const url of urls.slice(0, 10)) {
    const c = await graphPost(`${igUserId}/media`, { image_url: url, is_carousel_item: "true", access_token: token });
    if (!c.ok) return c;
    children.push(c.id);
  }
  const parent = await graphPost(`${igUserId}/media`, {
    media_type: "CAROUSEL",
    children: children.join(","),
    caption,
    access_token: token,
  });
  if (!parent.ok) return parent;
  await waitReady(parent.id, token);
  const pub = await publishContainer(igUserId, parent.id, token);
  if (!pub.ok) return pub;
  return { ok: true, mediaId: pub.id, permalink: await fetchPermalink(pub.id, token) };
}
