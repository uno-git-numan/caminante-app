import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAuthClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureContactLink } from "@/lib/crm/contacts";
import { roleForClient } from "@/lib/auth/authorization";
import { destinoPorRol } from "@/lib/auth/destino";

// Callback del flujo OAuth (PKCE) — p.ej. "Iniciar con Google". El proveedor
// regresa con ?code=…; lo intercambiamos por sesión con el cliente SSR (que tiene
// el code_verifier en cookie) y ramificamos por rol. El magic link / signup por
// correo usan ?token_hash= y viven en /auth/confirm (verifyOtp).
function safeNext(raw: string | null, requestUrl: string): string {
  const fallback = "/caminante";
  if (!raw) return fallback;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const target = new URL(raw);
    const origin = new URL(requestUrl);
    if (target.host === origin.host || target.host === "caminante.numanhub.com") {
      return target.pathname + target.search;
    }
  } catch {
    // raw no es URL válida
  }
  return fallback;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"), request.url);
  const oauthError = url.searchParams.get("error_description") || url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/caminante/login?error=${encodeURIComponent(oauthError)}`, request.url),
    );
  }
  if (!code) {
    return NextResponse.redirect(new URL("/caminante/login?error=missing_code", request.url));
  }

  // ⚠️ AQUÍ NO SE LIMPIAN COOKIES. En el flujo PKCE el navegador trae el
  // `code-verifier` que este canje necesita, y cualquier manoseo del almacén de
  // cookies puede llevárselo: eso produjo «PKCE code verifier not found in
  // storage» el 11 ago. La sesión vieja no estorba —`exchangeCodeForSession` la
  // reemplaza— y si estuviera podrida, el middleware ya la limpió en la
  // navegación anterior. En `confirm` (liga mágica) sí se limpia: ese flujo no
  // usa verificador.

  const supabase = await createSupabaseAuthClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/caminante/login?error=${encodeURIComponent(error.message)}`, request.url),
    );
  }

  // Liga user↔contact del CRM (silencioso: el login nunca falla por esto).
  try {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await ensureContactLink(createSupabaseAdminClient(), data.user);
    }
  } catch {
    // sin service-role o sin red, el login sigue
  }

  let dest = next;
  if (next === "/caminante") {
    const role = await roleForClient(supabase);
    dest = destinoPorRol(role);
  }

  return NextResponse.redirect(new URL(dest, request.url));
}
