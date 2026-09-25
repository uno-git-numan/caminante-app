// PONERSE UN SOMBRERO — la ruta que escribe la cookie de la pastilla.
//
// Existe porque un <Link> no puede escribir una cookie. Es un GET que cambia
// estado, que en general es mala idea; aquí es una PREFERENCIA DE VISTA sin
// consecuencias —no crea, no borra, no manda nada— y el precio de la
// alternativa (un <form> con POST por cada chip) es una pastilla que deja de
// ser una pastilla.
//
// ⚠️ SÓLO LA CASA, Y SÓLO OPERADORAS PROPIAS. Ponerse el sombrero de Nomádika
// no le daría a la casa nada que no tenga ya —la casa lo ve todo— pero volvería
// esta cookie un «elegir a quién mirar», que es exactamente lo contrario de
// para qué se construyó: existe para DEJAR de ver la operación ajena.

import { NextResponse } from "next/server";
import { getCurrentRole } from "@/lib/auth/authorization";
import { COOKIE_SOMBRERO, operadorasPropias } from "@/lib/auth/sombrero";
import { alcanceActual, equipoDelAlcance } from "@/lib/auth/alcance";

const PANEL = "https://caminante.numanhub.com/caminante/admin";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const destino = new URL("/caminante/admin", req.url);

  // ⚠️ UNA PRECARGA NO CAMBIA NADA. Esto ya pasó, en producción: la pastilla
  // usaba `<Link>`, que precarga al pasar el mouse, y la precarga ejecutaba
  // este handler — la cookie se iba a Kéntro mientras la pantalla seguía
  // diciendo Caminante. El sombrero puesto y el sombrero escrito, distintos,
  // que es lo único que este diseño no se podía permitir.
  //
  // La pastilla ya usa `<a>` pelado, así que hoy nada lo precarga. Este candado
  // se queda igual: es la clase de efecto que no debe depender de que el
  // llamador se porte bien, porque quien ponga un `<Link>` aquí el mes que
  // viene no va a saber nada de esto.
  const h = req.headers;
  if (h.get("next-router-prefetch") || h.get("rsc") || h.get("purpose") === "prefetch" || h.get("sec-purpose")?.includes("prefetch")) {
    return new NextResponse(null, { status: 204 });
  }

  const rol = await getCurrentRole();
  if (rol !== "admin" && rol !== "equipo") {
    return NextResponse.redirect(destino);
  }

  const { slug } = await params;
  // La casa elige entre las propias; el equipo (0070) entre las SUYAS. Ninguno
  // puede escribir el slug de otra: rebota con el sombrero que ya traía.
  const opciones =
    rol === "admin" ? await operadorasPropias() : (equipoDelAlcance(await alcanceActual())?.operadoras ?? []);
  const elegida = opciones.find((o) => o.slug === slug);
  // Un slug que no es de una operadora propia no cambia nada y no explota:
  // rebota al panel con el sombrero que ya traía.
  if (!elegida?.slug) return NextResponse.redirect(destino);

  const res = NextResponse.redirect(destino);
  res.cookies.set(COOKIE_SOMBRERO, elegida.slug, {
    httpOnly: true,
    sameSite: "lax",
    secure: destino.protocol === "https:" || PANEL.startsWith("https:"),
    path: "/",
    // Un año. Es una preferencia, no una sesión: que caduque sola sólo
    // conseguiría devolverte en silencio al sombrero por omisión.
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
