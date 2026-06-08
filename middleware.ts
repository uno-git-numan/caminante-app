import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const CANONICAL_HOST = "caminante.numanhub.com";

export async function middleware(request: NextRequest) {
  // Canonical domain enforcement: in production, anyone landing on a *.vercel.app
  // host (the project alias or a per-deploy URL) is 308-redirected to the real
  // domain. Previews (VERCEL_ENV=preview) and local dev are left untouched so
  // testing still works. caminante.numanhub.com never matches → no redirect loop.
  if (process.env.VERCEL_ENV === "production") {
    const host =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
    if (host !== CANONICAL_HOST && host.endsWith(".vercel.app")) {
      const target = new URL(
        request.nextUrl.pathname + request.nextUrl.search,
        `https://${CANONICAL_HOST}`,
      );
      return NextResponse.redirect(target, 308);
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
