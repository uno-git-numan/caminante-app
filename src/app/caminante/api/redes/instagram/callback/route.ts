// Callback de OAuth de Instagram (Business Login). Meta redirige aquí con ?code
// (o ?error). Valida el state firmado, intercambia code → token corto → token
// largo, obtiene ig_user_id + username y guarda la cuenta. Vuelve a la ruta de
// origen con ?redes=ok|error|denegada. runtime nodejs (usa crypto + fetch).
import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { verifyState, exchangeCode, exchangeLongLived, fetchProfile, IG_SCOPES } from "@/lib/social/instagram";
import { upsertConnectedAccount } from "@/lib/social/accounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function back(base: string, params: Record<string, string>): string {
  const u = new URL(base, "https://caminante.numanhub.com");
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  // Devuelve solo path+query (mismo origen) para el redirect.
  return u.pathname + u.search;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");
  const errDesc = url.searchParams.get("error_description");

  // 1) Validar el state (CSRF + ruta de regreso). Si no valida, no confiamos en returnTo.
  const st = verifyState(state);
  const returnTo = st.ok && st.returnTo ? st.returnTo : "/caminante/admin/experiencias";
  if (!st.ok) {
    return NextResponse.redirect(origin + back("/caminante/admin/experiencias", { redes: "error", msg: "state inválido o vencido" }));
  }

  // 2) El usuario negó permisos u ocurrió un error en Meta.
  if (err) {
    return NextResponse.redirect(origin + back(returnTo, { redes: "denegada", msg: errDesc || err }));
  }
  if (!code) {
    return NextResponse.redirect(origin + back(returnTo, { redes: "error", msg: "sin code" }));
  }

  // 3) Solo un admin conecta. (La sesión viaja en la cookie del navegador.)
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.redirect(origin + back("/caminante/entrar", {}));
  }

  // 4) code → token corto → token largo (~60 días).
  const short = await exchangeCode(code);
  if (!short.ok) return NextResponse.redirect(origin + back(returnTo, { redes: "error", msg: short.error }));
  const long = await exchangeLongLived(short.data.accessToken);
  if (!long.ok) return NextResponse.redirect(origin + back(returnTo, { redes: "error", msg: long.error }));

  // 5) Perfil (id + username). Si /me no da user_id, usar el del token corto.
  const prof = await fetchProfile(long.data.accessToken);
  const igUserId = (prof.ok && prof.igUserId) || short.data.userId;
  const username = prof.ok ? prof.username : "";

  // 6) Guardar (reemplaza la cuenta de la plataforma si ya había una).
  const user = await getCurrentUser();
  try {
    await upsertConnectedAccount({
      igUserId,
      username,
      accessToken: long.data.accessToken,
      expiresInSec: long.data.expiresInSec,
      scopes: short.data.permissions?.length ? short.data.permissions : [...IG_SCOPES],
      connectedBy: user?.email ?? null,
    });
  } catch (e) {
    return NextResponse.redirect(origin + back(returnTo, { redes: "error", msg: (e as Error).message }));
  }

  return NextResponse.redirect(origin + back(returnTo, { redes: "ok", u: username || igUserId }));
}
