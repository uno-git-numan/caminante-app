import { NextResponse } from "next/server";
import { operadoraObjetivo } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Ver un documento del expediente, con URL firmada de vida corta.
//
// Mismo patrón que `comprobante`: el bucket es PRIVADO y aquí hay
// identificaciones oficiales, actas constitutivas y pólizas. Nunca una URL
// pública ni una ruta adivinable.
//
// ⚠️ LA DUEÑA TAMBIÉN PUEDE VERLO (desde el 25 sep 2026). Exigía admin, así
// que la operadora no podía abrir el papel que ella misma subió. La ruta del
// objeto empieza con el id de la operadora (`subirDocumento`), y ese id se
// compara contra la sesión con la MISMA regla que subir: la casa sobre
// cualquiera, la operadora sólo sobre sí misma.

export const runtime = "nodejs";
const BUCKET = "expedientes";
const FIRMA_SEGUNDOS = 300;

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path") || "";
  // Sin `..` no se sale del bucket; sin `/` inicial no se apunta a la raíz.
  if (!path || path.includes("..") || path.startsWith("/")) {
    return NextResponse.json({ error: "Ruta inválida." }, { status: 400 });
  }
  const dueno = path.split("/")[0];
  if (!dueno || (await operadoraObjetivo(dueno)) !== dueno) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, FIRMA_SEGUNDOS);
  if (error || !data) return NextResponse.json({ error: "No se pudo abrir." }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
