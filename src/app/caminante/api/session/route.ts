// Sesión mínima para páginas estáticas (el landing): SOLO el rol, nada de PII.
// El landing la usa para convertir "Entrar" en "Mi espacio"/"Panel".
import { NextResponse } from "next/server";
import { getCurrentRole } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export async function GET() {
  const role = await getCurrentRole();
  return NextResponse.json(
    { role },
    { headers: { "Cache-Control": "no-store" } },
  );
}
