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

const PANEL = "https://caminante.numanhub.com/caminante/admin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const destino = new URL("/caminante/admin", req.url);
  if ((await getCurrentRole()) !== "admin") {
    return NextResponse.redirect(destino);
  }

  const { slug } = await params;
  const propias = await operadorasPropias();
  const elegida = propias.find((o) => o.slug === slug);
  // Un slug que no es de una operadora propia no cambia nada y no explota:
  // rebota al panel con el sombrero que ya traía.
  if (!elegida) return NextResponse.redirect(destino);

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
