import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// CSD del operador (Certificado de Sello Digital del SAT).
//
// ⚠️ Es la FIRMA ELECTRÓNICA del operador. Con el .key y su contraseña se puede
// timbrar a su nombre. Por eso el bucket es privado y de vida corta, igual que
// `comprobantes` (0034) — pero aquí el riesgo es mayor: un comprobante filtrado
// expone datos; un CSD filtrado permite SUPLANTAR fiscalmente al operador.
//
// El flujo es en dos tiempos, idéntico al del comprobante: se sube y se guarda
// la RUTA del objeto (nunca una URL), y para verlo se pide una URL firmada que
// caduca en 5 minutos.
//
// ⚠️ LA CONTRASEÑA DEL CSD NO PASA POR AQUÍ Y NO SE GUARDA EN NUESTRA BASE.
// Va directo a Facturapi al crear la organización del operador. Si Facturapi la
// necesita después, se le vuelve a pedir al operador. Esta ruta solo mueve los
// dos archivos (.cer y .key); si algún día llegara una contraseña en el
// formulario, sería un bug, no una funcionalidad.

export const runtime = "nodejs";

const BUCKET = "csd";
const MAX_BYTES = 2 * 1024 * 1024; // un .cer/.key del SAT pesa unos pocos KB
const FIRMA_SEGUNDOS = 300;

// El SAT entrega `.cer` (certificado) y `.key` (llave privada). Los navegadores
// casi nunca les asignan un MIME útil, así que se valida por EXTENSIÓN — que es
// el dato confiable— y el tipo se guarda como binario opaco.
const EXTENSIONES = ["cer", "key"] as const;
type Extension = (typeof EXTENSIONES)[number];

function extensionDe(nombre: string): Extension | null {
  const ext = nombre.toLowerCase().split(".").pop() || "";
  return (EXTENSIONES as readonly string[]).includes(ext) ? (ext as Extension) : null;
}

// POST /caminante/api/admin/csd → { path, tipo }
export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const operadorId = String(form.get("operadorId") || "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  }
  if (!operadorId) {
    return NextResponse.json({ error: "Falta el operador." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Máximo 2 MB. Un CSD del SAT pesa unos pocos KB." }, { status: 400 });
  }
  const tipo = extensionDe(file.name);
  if (!tipo) {
    return NextResponse.json({ error: "Sube el .cer o el .key que te dio el SAT." }, { status: 400 });
  }

  // Nombre aleatorio y carpeta por operador. El archivo original se llama con el
  // RFC del operador (`AAAA010101AAA.cer`), y ese nombre dentro del bucket sería
  // un dato fiscal de más viajando en cada URL firmada.
  const path = `${operadorId}/${randomBytes(16).toString("hex")}.${tipo}`;

  const sb = createSupabaseAdminClient();
  const { error } = await sb.storage.from(BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: "application/octet-stream",
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ path, tipo });
}

// GET /caminante/api/admin/csd?path=… → 302 a una URL firmada de 5 minutos
export async function GET(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const path = new URL(request.url).searchParams.get("path") || "";
  // Sin `..` no se puede salir del bucket, y sin `/` inicial no se puede apuntar
  // a la raíz. Misma paranoia que el comprobante con rutas que vienen del cliente.
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
