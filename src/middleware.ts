import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  ATRIB_COOKIE,
  OPCIONES_ATRIB,
  armarAtribucion,
} from "@/lib/operadores/atribucion";

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

  // ── ATRIBUCIÓN DE PRIMER TOQUE ──────────────────────────────────────────────
  // El portal del operador es un Server Component y en Next 15 esos NO pueden
  // escribir cookies. El middleware es el único lugar que puede, así que la
  // marca se pone aquí.
  //
  // PRIMER toque: si la cookie ya existe NO se toca. Quien trajo al cliente
  // primero se queda con el crédito (decisión de Luis, 13 ago) y por eso
  // tampoco se le renueva la vigencia — 60 días desde el primer contacto, no
  // desde el último.
  //
  // ⚠️ Se guarda el SLUG del operador, no su id: el middleware corre en el Edge
  // y no consulta la base. La traducción slug→id la hace quien cobra.
  // ⚠️ `x-ruta` NO es decorativo: es lo único que le dice al layout del panel en
  // qué pantalla está. Los Server Components no reciben el pathname, y sin él la
  // lista blanca del panel no puede negar por omisión — o sea, cada pantalla
  // nueva que alguien agregue mañana nacería abierta al operador externo. Con
  // esto nace cerrada.
  const cabeceras = { "x-ruta": request.nextUrl.pathname };

  const atrib = atribucionDeLaRuta(request.nextUrl.pathname);
  if (atrib && !request.cookies.get(ATRIB_COOKIE)) {
    const res = await updateSession(request, cabeceras);
    res.cookies.set(ATRIB_COOKIE, await armarAtribucion(atrib), OPCIONES_ATRIB);
    return res;
  }

  return updateSession(request, cabeceras);
}

/**
 * ¿Esta ruta pertenece a un operador? Devuelve su slug, o null.
 *
 * Hoy solo el portal `/caminante/o/<slug>`. Cuando existan más superficies del
 * operador (dominio propio, links con `?op=`), se agregan aquí — es el único
 * lugar que decide qué cuenta como "primer toque".
 */
function atribucionDeLaRuta(pathname: string): string | null {
  const m = /^\/caminante\/o\/([a-z0-9-]{1,60})(?:\/|$)/.exec(pathname);
  return m ? m[1] : null;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
