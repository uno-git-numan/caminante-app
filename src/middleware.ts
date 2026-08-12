import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const CANONICAL_HOST = "caminante.numanhub.com";
// The stable *.vercel.app alias that always points to production. We redirect it
// to the real domain so the public site only lives on caminante.numanhub.com.
// We match this exact host (not all *.vercel.app) so preview deployments — which
// have their own unique hostnames — stay reachable for testing. NOTE: we do NOT
// gate on process.env.VERCEL_ENV; it isn't reliably populated in Edge middleware.
const PRODUCTION_VERCEL_ALIAS = "caminante-app.vercel.app";

// ⚠️ ESTE ARCHIVO VIVE EN src/ A PROPÓSITO. Estuvo en la RAÍZ del repo desde
// siempre y, con el código en `src/`, Next lo ignora **sin un solo warning**:
// nunca corrió. Su único trabajo es `updateSession`, o sea refrescar la cookie de
// Supabase en cada request; sin eso el refresh token de un usuario acaba
// caducando sin reemplazo y todo empieza a lanzar «Invalid Refresh Token:
// Refresh Token Not Found» — que fue exactamente lo que le pasó a Luis desde su
// iPhone el 11 de agosto: la home tronaba y el login no podía completarse.
// (Es el mismo gotcha que CLAUDE.md ya documentaba para OTRO middleware.)
export async function middleware(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  if (host === PRODUCTION_VERCEL_ALIAS) {
    const target = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      `https://${CANONICAL_HOST}`,
    );
    return NextResponse.redirect(target, 308);
  }

  // ⚠️ El middleware NO toca las rutas de autenticación. Ahí no hay nada que
  // refrescar —su trabajo es ESTABLECER una sesión nueva— y meterse es
  // activamente dañino: al intentar refrescar una cookie muerta, el cliente de
  // Supabase limpia su almacenamiento, y en el flujo PKCE eso se lleva el
  // `code-verifier` que `exchangeCodeForSession` necesita un instante después.
  // Síntoma exacto (11 ago 2026, en cuanto el middleware empezó a correr por
  // primera vez): «Continuar con Google» iba a Google, volvía, y el callback
  // moría con «PKCE code verifier not found in storage».
  if (request.nextUrl.pathname.startsWith("/caminante/auth/")) {
    return NextResponse.next({ request });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
