import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAuthClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureContactLink } from "@/lib/crm/contacts";
import { roleForClient } from "@/lib/auth/authorization";
import { destinoPorRol } from "@/lib/auth/destino";

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

const esc = (x: string) => x.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/**
 * GET NO GASTA LA LIGA (9 nov 2026). Hotmail/Outlook (Safe Links), varios
 * antivirus y las vistas previas de las apps de correo ABREN cada liga del
 * correo antes que la persona; si este GET canjeaba el token, cuando la persona
 * tocaba «Entrar» ya estaba gastado: «Ese enlace ya venció o se usó». Le pasó a
 * Ana Malvido (hotmail.com) con la liga de contraseña: se canjeó 22 s después de
 * mandarse y la contraseña nunca se definió.
 *
 * Por eso el GET sólo enseña un botón, y el canje vive en el POST que ese botón
 * manda. Los escáneres hacen GET; no envían formularios.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = safeNext(url.searchParams.get("next"), request.url);
  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/caminante/login?error=missing_token", request.url));
  }
  const titulo = type === "recovery" ? "Crea tu contraseña" : "Entra a Caminante";
  const boton = type === "recovery" ? "Continuar" : "Entrar";
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(titulo)} · Caminante</title>
<style>body{margin:0;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#f5f0e8;color:#20211c;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}
.c{max-width:380px;width:100%;background:#fff;border:1px solid #d4c5b0;border-radius:18px;padding:32px 26px;text-align:center}
.e{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#5f5f40}h1{font-size:26px;font-weight:600;margin:10px 0 8px;color:#1e3147}
p{font-size:15px;line-height:1.55;color:#5f5f40;margin:0 0 22px}button{width:100%;border:0;border-radius:999px;background:#ff5d36;color:#fff;font-size:16px;font-weight:700;padding:16px;cursor:pointer}</style></head>
<body><form class="c" method="post" action="/caminante/auth/confirm"><div class="e">Caminante</div><h1>${esc(titulo)}</h1><p>Toca el botón para continuar.</p>
<input type="hidden" name="token_hash" value="${esc(tokenHash)}"><input type="hidden" name="type" value="${esc(type)}"><input type="hidden" name="next" value="${esc(next)}">
<button type="submit">${esc(boton)} →</button></form></body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}

/** El canje de verdad: sólo cuando una persona toca el botón. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const tokenHash = String(form.get("token_hash") ?? "");
  const type = String(form.get("type") ?? "") as EmailOtpType;
  const next = safeNext(String(form.get("next") ?? ""), request.url);

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/caminante/login?error=missing_token", request.url), 303);
  }

  // La sesión vieja NO se borra: se IGNORA. `createSupabaseAuthClient` no la lee,
  // así que no hay refresh que pueda fallar y tumbar este canje. Borrarla no
  // servía —`cookies().delete()` afecta la respuesta, no lo que `getAll()`
  // devuelve— y encima arriesgaba llevarse el `code-verifier`.

  const supabase = await createSupabaseAuthClient();

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(new URL(`/caminante/login?error=${encodeURIComponent(error.message)}`, request.url), 303);
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

  // Si `next` es el genérico "/caminante", ramificamos por rol (admin → panel,
  // caminante → su perfil). Un `next` explícito se respeta (la página guarda por rol).
  let dest = next;
  if (next === "/caminante") {
    const role = await roleForClient(supabase);
    dest = destinoPorRol(role);
  }

  return NextResponse.redirect(new URL(dest, request.url), 303);
}
