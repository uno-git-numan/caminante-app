import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureContactLink } from "@/lib/crm/contacts";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") ?? "/caminante";

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
