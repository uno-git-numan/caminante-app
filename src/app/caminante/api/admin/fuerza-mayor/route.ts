import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { BUCKET_FUERZA_MAYOR, rutaDeDocumentoValida } from "@/lib/cancelacion/documento";

// EL DOCUMENTO QUE ACREDITA LA FUERZA MAYOR (D24.4 de legal, 0092).
//
// La fuerza mayor quita la bonificación del 20 % y quien la invoca la prueba:
// antes de cancelar una salida por clima, cierre de la autoridad o contingencia
// se sube el reporte o el aviso. Bucket PRIVADO: se guarda la RUTA y se ve con
// una URL firmada de vida corta, igual que los comprobantes de transferencia.
//
// ⚠️ La emergencia médica del guía NO pasa por aquí: se acredita con la
// declaración de la operadora. Un parte médico es dato de salud y no se guarda.
//
// Sólo la casa: cancelar una salida y devolver es de quien recibió el dinero.

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
const FIRMA_SEGUNDOS = 300;

// POST /caminante/api/admin/fuerza-mayor → { path }
export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Máximo 10 MB." }, { status: 400 });
  if (!TIPOS.includes(file.type)) return NextResponse.json({ error: "Sube un PDF o una imagen." }, { status: 400 });

  // Nombre aleatorio: el original no aporta nada dentro del bucket.
  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
  const path = `${new Date().toISOString().slice(0, 7)}/${randomBytes(16).toString("hex")}.${ext}`;

  const sb = createSupabaseAdminClient();
  const { error } = await sb.storage.from(BUCKET_FUERZA_MAYOR).upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path });
}

// GET /caminante/api/admin/fuerza-mayor?path=… → 302 a una URL firmada
export async function GET(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const path = new URL(request.url).searchParams.get("path") || "";
  if (!rutaDeDocumentoValida(path)) return NextResponse.json({ error: "Ruta inválida." }, { status: 400 });
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb.storage.from(BUCKET_FUERZA_MAYOR).createSignedUrl(path, FIRMA_SEGUNDOS);
  if (error || !data) return NextResponse.json({ error: error?.message || "No encontrado." }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
