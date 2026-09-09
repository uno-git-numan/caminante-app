import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Ver un documento del expediente, con URL firmada de vida corta.
//
// Mismo patrón que `comprobante`: el bucket es PRIVADO y aquí hay
// identificaciones oficiales, actas constitutivas y pólizas. Nunca una URL
// pública ni una ruta adivinable.

export const runtime = "nodejs";
const BUCKET = "expedientes";
const FIRMA_SEGUNDOS = 300;

export async function GET(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const path = new URL(request.url).searchParams.get("path") || "";
  // Sin `..` no se sale del bucket; sin `/` inicial no se apunta a la raíz.
  if (!path || path.includes("..") || path.startsWith("/")) {
    return NextResponse.json({ error: "Ruta inválida." }, { status: 400 });
  }
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, FIRMA_SEGUNDOS);
  if (error || !data) return NextResponse.json({ error: "No se pudo abrir." }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
