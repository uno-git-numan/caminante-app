import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureContactLink } from "@/lib/crm/contacts";

// `next` puede venir como ruta interna ("/caminante/perfil") o como URL absoluta
// del MISMO origen (el template del correo pasa {{ .RedirectTo }} absoluto).
// Cualquier otro origen cae a /caminante — nunca redirigimos fuera del sitio.
function safeNext(raw: string | null, requestUrl: string): string {
  const fallback = "/caminante";
  if (!raw) return fallback;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const target = new URL(raw);
    const origin = new URL(requestUrl);
    // mismo host del request, o el host canónico (un link generado en prod
    // puede abrirse vía preview/localhost — el path interno sigue siendo válido)
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
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(url.searchParams.get("next"), request.url);

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/caminante/login?error=missing_token", request.url));
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(new URL(`/caminante/login?error=${encodeURIComponent(error.message)}`, request.url));
  }

  // Liga el user recién logueado con su contact del CRM (por correo, solo si el
  // contact no está ligado a nadie). El login JAMÁS debe fallar por esto.
  try {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await ensureContactLink(createSupabaseAdminClient(), data.user);
    }
  } catch {
    // silencioso a propósito: sin service-role o sin red, el login sigue
  }

  return NextResponse.redirect(new URL(next, request.url));
}
