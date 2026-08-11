import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Comprobantes de transferencia.
//
// ⚠️ Bucket PRIVADO a propósito. El bucket `experiences` (donde van las fotos de
// las experiencias) es público, y un comprobante bancario trae el nombre del
// cliente, el monto y a veces dígitos de cuenta. Eso no puede quedar detrás de
// una URL adivinable y eterna.
//
// Por eso el flujo es en dos tiempos: se sube y se guarda la RUTA del objeto
// (nunca una URL), y para verlo el admin pide una URL firmada de vida corta.

export const runtime = "nodejs";

const BUCKET = "comprobantes";
const MAX_BYTES = 10 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
const FIRMA_SEGUNDOS = 300;

// POST /caminante/api/admin/comprobante → { path }
export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Máximo 10 MB." }, { status: 400 });
  }
  const tipo = file.type || "image/jpeg";
  if (!TIPOS.includes(tipo)) {
    return NextResponse.json({ error: "Sube una imagen o un PDF." }, { status: 400 });
  }

  // Nombre aleatorio: el archivo original suele llamarse "IMG_1234" o traer el
  // nombre del cliente, y ninguno de los dos aporta nada dentro del bucket.
  const ext = tipo === "application/pdf" ? "pdf" : (tipo.split("/")[1] || "jpg");
  const hoy = new Date().toISOString().slice(0, 7); // YYYY-MM
  const path = `${hoy}/${randomBytes(16).toString("hex")}.${ext}`;

  const sb = createSupabaseAdminClient();
  const { error } = await sb.storage.from(BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: tipo,
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ path });
}

// GET /caminante/api/admin/comprobante?path=… → 302 a una URL firmada
export async function GET(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const path = new URL(request.url).searchParams.get("path") || "";
  // Sin `..` no se puede salir del bucket, y sin `/` inicial no se puede apuntar
  // a la raíz. Es la misma paranoia de siempre con rutas que vienen del cliente.
  if (!path || path.includes("..") || path.startsWith("/")) {
    return NextResponse.json({ error: "Ruta inválida." }, { status: 400 });
  }

  const sb = createSupabaseAdminClient();
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, FIRMA_SEGUNDOS);
  if (error || !data) {
    return NextResponse.json({ error: error?.message || "No encontrado." }, { status: 404 });
  }
  return NextResponse.redirect(data.signedUrl);
}
