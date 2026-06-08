import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const CANONICAL_HOST = "caminante.numanhub.com";
// The stable *.vercel.app alias that always points to production. We redirect it
// to the real domain so the public site only lives on caminante.numanhub.com.
// We match this exact host (not all *.vercel.app) so preview deployments — which
// have their own unique hostnames — stay reachable for testing. NOTE: we do NOT
// gate on process.env.VERCEL_ENV; it isn't reliably populated in Edge middleware.
const PRODUCTION_VERCEL_ALIAS = "caminante-app.vercel.app";

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

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
