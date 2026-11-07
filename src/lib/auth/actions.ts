"use server";

import { headers, cookies } from "next/headers";
import { destinoPorRol } from "@/lib/auth/destino";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAuthClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseOtpClient } from "@/lib/supabase/otp";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendViaResend } from "@/lib/email/resend";
import { boton, h1, marco, p as parrafo, saludo } from "@/lib/email/plantilla";
import { getCurrentUser } from "@/lib/auth/session";
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
  // ⚠️ Cliente SIN PKCE a propósito (lib/supabase/otp.ts): la liga tiene que
  // abrir desde el Mail del teléfono, la app de Gmail o Safari, no sólo desde
  // el navegador que la pidió.
  const supabase = createSupabaseOtpClient();

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

  // ⚠️ El cliente que IGNORA la sesión entrante (7 nov 2026). Con una sesión
  // muerta en la cookie, el cliente normal intenta refrescarla, falla y llama
  // `_removeSession`, que en auth-js ≥2.1 borra TAMBIÉN el `code-verifier` y
  // manda SIGNED_OUT: cualquier login que corra en ese mismo request pelea con
  // esa limpieza. Luis desde su iPhone: «Continuar con Google» moría con «PKCE
  // code verifier not found» mientras los logs decían «Invalid Refresh Token».
  const supabase = await createSupabaseAuthClient();
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
  const nombre = typeof formData.get("nombre") === "string" ? String(formData.get("nombre")).trim().slice(0, 120) : "";
  const next = parseNext(formData);
  const volver = (error: string) => redirect(`/caminante/signup?tipo=viajero&error=${encodeURIComponent(error)}&next=${encodeURIComponent(next)}`);

  if (!email) volver("invalid_email");
  if (password.length < 8) volver("weak_password");

  // La cuenta nace CONFIRMADA y con sesión en este mismo request (7 nov 2026).
  // Antes `auth.signUp` mandaba un correo de confirmación cuyo link era PKCE:
  // abierto desde Mail/Gmail en el teléfono —otro navegador— moría, y la
  // persona se quedaba sin cuenta y sin poder pagar.
  const admin = createSupabaseAdminClient();
  const creado = await admin.auth.admin.createUser({
    email: email as string,
    password,
    email_confirm: true,
    user_metadata: nombre ? { full_name: nombre } : {},
  });
  if (creado.error) {
    if (/already|exists|registered/i.test(creado.error.message)) volver("User already registered");
    console.error("signUpWithPassword createUser:", creado.error.message);
    volver(creado.error.message);
  }

  const supabase = await createSupabaseAuthClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email as string, password });
  if (error) volver(error.message);

  redirect(await postAuthDestination(supabase, next));
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
  // Ignora la sesión entrante a propósito: ver signInWithPassword. Aquí es
  // donde la sesión muerta se llevaba el code-verifier recién puesto.
  const supabase = await createSupabaseAuthClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/caminante/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error || !data?.url) return { error: error?.message ?? "No se pudo abrir Google." };
  return { url: data.url };
}

/**
 * «Continuar con Apple» — mismo mecanismo que Google. Sólo se ofrece cuando
 * `NEXT_PUBLIC_AUTH_APPLE=1` (el proveedor hay que darlo de alta en Supabase
 * con la cuenta de Apple Developer de Luis; un botón sin proveedor detrás es un
 * control muerto). Nació con el espacio del grupo, 27 oct 2026.
 */
export async function signInWithApple(formData: FormData): Promise<GoogleOAuthInicio> {
  const next = parseNext(formData);
  const origin = await getOrigin();
  const supabase = await createSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: { redirectTo: `${origin}/caminante/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data?.url) return { error: error?.message ?? "No se pudo abrir Apple." };
  return { url: data.url };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/caminante");
}

/**
 * «Crear o cambiar contraseña» (7 nov 2026, Luis: «dame un usuario y
 * contraseña»). La contraseña la teclea la persona, nunca la casa: se le manda
 * una liga de recuperación y ella la define en /caminante/cuenta/contrasena.
 *
 * La liga sale de `auth.admin.generateLink({ type: "recovery" })` y la manda
 * Resend con NUESTRO confirm (`?token_hash=…&type=recovery`): no es PKCE, abre
 * desde cualquier dispositivo. El template de Supabase para recovery no está
 * personalizado y el suyo por defecto manda a `/auth/v1/verify` con los tokens
 * en el hash (#access_token), que el servidor no ve.
 *
 * Si el correo no tiene cuenta, se contesta igual que si la tuviera: la pantalla
 * no revela quién está registrado.
 */
export async function pedirLigaDeContrasena(formData: FormData) {
  const email = parseEmail(formData);
  const next = parseNext(formData);
  if (!email) redirect(`/caminante/login/contrasena?error=invalid_email&next=${encodeURIComponent(next)}`);

  const origin = await getOrigin();
  const admin = createSupabaseAdminClient();
  const liga = await admin.auth.admin.generateLink({ type: "recovery", email });
  const tokenHash = liga.data?.properties?.hashed_token;
  if (!liga.error && tokenHash) {
    const destino = `/caminante/cuenta/contrasena?next=${encodeURIComponent(next)}`;
    const url = `${origin}/caminante/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=recovery&next=${encodeURIComponent(destino)}`;
    const nombre = (liga.data.user?.user_metadata?.full_name as string | undefined) ?? null;
    const { html, texto } = marco("Tu contraseña", [
      h1("Crea tu contraseña"),
      parrafo(`Hola${saludo(nombre)}. Toca el botón, escribe la contraseña que quieras y listo: con ella entras a Caminante desde cualquier dispositivo.`),
      boton("Crear mi contraseña", url),
      parrafo("La liga vale una hora y funciona una sola vez. Si no la pediste tú, ignora este correo."),
    ]);
    await sendViaResend(email, "Crea tu contraseña · Caminante", html, { ua: "caminante-auth/1.0", text: texto });
  } else if (liga.error && !/not found|no user/i.test(liga.error.message)) {
    console.error("pedirLigaDeContrasena:", liga.error.message);
  }
  redirect(`/caminante/login/contrasena?sent=1&email=${encodeURIComponent(email)}`);
}

/** Con sesión (por la liga de arriba, o ya adentro): guarda la contraseña nueva. */
export async function definirContrasena(formData: FormData) {
  const next = parseNext(formData);
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const otra = typeof formData.get("password2") === "string" ? String(formData.get("password2")) : "";
  const volver = (error: string) => redirect(`/caminante/cuenta/contrasena?error=${encodeURIComponent(error)}&next=${encodeURIComponent(next)}`);
  const user = await getCurrentUser();
  if (!user) redirect(`/caminante/login?next=${encodeURIComponent(`/caminante/cuenta/contrasena?next=${encodeURIComponent(next)}`)}`);
  if (password.length < 8) volver("corta");
  if (password !== otra) volver("distintas");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) volver(/same password|different from the old/i.test(error.message) ? "misma" : error.message);
  redirect(next && next !== "/caminante" ? next : await postAuthDestination(supabase, "/caminante"));
}
