"use server";

import { headers, cookies } from "next/headers";
import { destinoPorRol } from "@/lib/auth/destino";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roleForClient } from "@/lib/auth/authorization";
import { OP_INTENT_COOKIE } from "@/lib/auth/op-intent";

// Paso 1 del alta: elegir el camino "operador". Marca la intención (cookie que
// sobrevive cualquier método de login) y manda al formulario de registro. NO
// crea admin — solo la intención; el acceso real lo concede Luis aprobando.
export async function elegirOperador() {
  const jar = await cookies();
  jar.set(OP_INTENT_COOKIE, "1", { maxAge: 3600, httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/caminante/signup?tipo=operador");
}

async function getOrigin() {
  // Prefer the real request host so auth works on ANY domain
  // (caminante.numanhub.com, the vercel.app URL, localhost, future subdomains)
  // without depending on a build-time env var.
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (host) {
    const isLocal = host.includes("localhost") || host.startsWith("127.");
    const protocol = headerStore.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
    return `${protocol}://${host}`;
  }

  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

function parseNext(formData: FormData): string {
  const raw = typeof formData.get("next") === "string" ? String(formData.get("next")) : "/caminante";
  // Solo rutas internas (el confirm/callback valida origen de todos modos)
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/caminante";
}

// Destino tras autenticar: si `next` es un destino EXPLÍCITO, se respeta (la página
// destino guarda por rol si aplica — p.ej. /registro rebota a un admin). Si `next` es
// el genérico "/caminante", ramificamos por rol (lib/auth/destino.ts).
export async function postAuthDestination(
  supabase: SupabaseClient,
  next: string,
): Promise<string> {
  if (next && next !== "/caminante") return next;
  const role = await roleForClient(supabase);
  return destinoPorRol(role);
}

function parseEmail(formData: FormData) {
  const raw = formData.get("email");
  if (typeof raw !== "string") {
    return null;
  }

  const email = raw.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return null;
  }

  return email;
}

export async function sendMagicLink(formData: FormData) {
  const email = parseEmail(formData);
  if (!email) {
    redirect("/caminante/login?error=invalid_email");
  }

  const rawNext = typeof formData.get("next") === "string" ? String(formData.get("next")) : "/caminante";
  // Solo rutas internas (el confirm valida origen de todos modos)
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/caminante";
  const origin = await getOrigin();
  const supabase = await createSupabaseServerClient();

  // emailRedirectTo lleva el DESTINO FINAL (no la URL del confirm): el template
  // del correo arma el link del confirm con {{ .TokenHash }} + {{ .SiteURL }} y
  // pasa esto como ?next=. Así el link nunca depende del matching de la allowlist.
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}${next}`,
    },
  });

  if (error) {
    redirect(`/caminante/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/caminante/login?sent=1&email=${encodeURIComponent(email)}`);
}

export async function signInWithPassword(formData: FormData) {
  const email = parseEmail(formData);
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const next = parseNext(formData);

  if (!email || !password) {
    redirect(`/caminante/login?error=invalid_credentials&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/caminante/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  // El cliente ya trae sesión en este mismo request → resolvemos rol con él.
  redirect(await postAuthDestination(supabase, next));
}

export async function signUpWithPassword(formData: FormData) {
  const email = parseEmail(formData);
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const next = parseNext(formData);

  if (!email) {
    redirect(`/caminante/signup?error=invalid_email&next=${encodeURIComponent(next)}`);
  }
  if (password.length < 8) {
    redirect(`/caminante/signup?error=weak_password&next=${encodeURIComponent(next)}`);
  }

  const origin = await getOrigin();
  const supabase = await createSupabaseServerClient();

  // emailRedirectTo = destino final (igual que el magic link): el template de
  // "Confirm signup" arma el link del confirm con {{ .TokenHash }} y pasa esto como next.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}${next}` },
  });

  if (error) {
    redirect(`/caminante/signup?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  // Si la confirmación por correo está DESHABILITADA, signUp ya deja sesión → al destino.
  if (data.session) {
    redirect(await postAuthDestination(supabase, next));
  }

  // Confirmación habilitada → hay que verificar el correo antes de entrar.
  redirect(`/caminante/signup?sent=1&email=${encodeURIComponent(email)}`);
}

export type GoogleOAuthInicio = { url: string } | { error: string };

/**
 * Arranca el OAuth de Google y DEVUELVE la URL de Google; no navega.
 *
 * ⚠️ Antes esto terminaba en `redirect(data.url)`. Un `redirect()` a una URL de
 * OTRO origen desde una server action no hace navegación dura: Next se la manda
 * al router del cliente, que intenta seguirla y no puede (es cross-origin). El
 * POST respondía 303, el navegador lo abortaba (`net::ERR_ABORTED`) y la página
 * se quedaba exactamente igual. Síntoma reportado desde un iPhone: «le pico al
 * botón, algo carga, y ahí queda». Nunca llegaba a Google.
 *
 * Devolver la URL y dejar que el botón haga `location.assign()` sí es una
 * navegación dura del documento, que es lo que un flujo OAuth necesita.
 *
 * Lo que NO cambia: el OAuth se sigue iniciando EN EL SERVIDOR, para que el
 * code_verifier (PKCE) quede como cookie del adaptador SSR y el callback lo
 * encuentre al hacer exchangeCodeForSession. Iniciarlo en el navegador lo
 * guardaba donde el servidor no lo veía («PKCE code verifier not found»).
 */
export async function signInWithGoogle(formData: FormData): Promise<GoogleOAuthInicio> {
  const next = parseNext(formData);
  const origin = await getOrigin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/caminante/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error || !data?.url) return { error: error?.message ?? "No se pudo abrir Google." };
  return { url: data.url };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/caminante");
}
