"use server";

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roleForClient } from "@/lib/auth/authorization";

// Cookie que marca "esta persona pidió cuenta de OPERADOR". Sobrevive el
// round-trip de cualquier método de login (Google/contraseña/enlace); al
// aterrizar en /bienvenida se registra la SOLICITUD (nunca otorga admin). El
// acceso real lo concede Luis aprobando en el panel (whitelist is_active=true).
export const OP_INTENT_COOKIE = "cam_op_intent";

// Paso 1 del alta: elegir el camino "operador". Marca la intención y manda al
// formulario de registro. NO crea admin — solo la intención.
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
// el genérico "/caminante", ramificamos por rol: admin → panel admin, caminante → perfil.
export async function postAuthDestination(
  supabase: SupabaseClient,
  next: string,
): Promise<string> {
  if (next && next !== "/caminante") return next;
  const role = await roleForClient(supabase);
  return role === "admin" ? "/caminante/admin" : "/caminante/perfil";
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

export async function signInWithGoogle(formData: FormData) {
  const next = parseNext(formData);
  const origin = await getOrigin();
  const supabase = await createSupabaseServerClient();

  // Iniciamos el OAuth EN EL SERVIDOR: así el code_verifier (PKCE) se guarda como
  // cookie vía el adaptador SSR, y el callback (también server) lo encuentra al hacer
  // exchangeCodeForSession. Iniciarlo en el browser lo guardaba donde el server no lo veía
  // ("PKCE code verifier not found in storage").
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/caminante/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error || !data?.url) {
    redirect(
      `/caminante/login?error=${encodeURIComponent(error?.message ?? "oauth_error")}&next=${encodeURIComponent(next)}`,
    );
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/caminante");
}
