// Endpoint del pre-llenado con IA (solo admin): recibe los documentos del
// operador y devuelve la experiencia pre-llenada (ver src/lib/ai/prellenar.ts).
// Gate re-verificado adentro — el layout del admin NO cubre route handlers.
import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { prellenarExperiencia, type ArchivoEntrada } from "@/lib/ai/prellenar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// La redacción completa del form toma ~1.5–3 min (≈4-5k tokens de salida).
// Con 60s Vercel cortaba la función a la mitad ("No hubo respuesta").
export const maxDuration = 300;

// ⚠️ ESTE LÍMITE NO ES NUESTRO: Vercel corta el cuerpo de la petición en ~4.5 MB
// antes de que el código lo vea. Subirlo más alto no sirve de nada — el archivo
// se rechazaría igual, pero con un 413 crudo de la plataforma en vez de un
// mensaje que explique qué hacer. 4.4 MB es pegarse al techo dejando margen
// para los límites del multipart.
//
// La salida de verdad es no mandar el archivo por aquí: subirlo directo a
// Storage desde el navegador y pasarle la ruta a este endpoint. Mientras tanto,
// PEGAR EL TEXTO funciona sin tocar el límite y da mejor resultado — un
// itinerario en texto pesa kilobytes y la IA no tiene que leer fotos.
const MAX_TOTAL_BYTES = Math.floor(4.4 * 1024 * 1024);

const TIPOS_BASE64 = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

function esTexto(tipo: string, nombre: string): boolean {
  return tipo.startsWith("text/") || /\.(md|txt)$/i.test(nombre);
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudieron leer los archivos. Intenta de nuevo." },
      { status: 400 },
    );
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const notas = String(form.get("notas") ?? "");

  // Vale con documentos O con texto pegado en indicaciones.
  if (!files.length && !notas.trim()) {
    return NextResponse.json(
      { ok: false, error: "Sube un documento (PDF/imagen) o pega el texto del itinerario." },
      { status: 400 },
    );
  }
  // Solo-texto: el texto pegado ES el contenido → mándalo como documento.
  if (!files.length) {
    const res = await prellenarExperiencia(
      [{ name: "notas.txt", mediaType: "text/plain", text: notas.trim() }],
      "",
    );
    if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 502 });
    return NextResponse.json({ ok: true, ...res.result });
  }

  let total = 0;
  const archivos: ArchivoEntrada[] = [];
  for (const f of files) {
    total += f.size;
    if (total > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El archivo pesa más de 4.4 MB y ahí corta el servidor — no es algo que puedas rodear subiéndolo otra vez. " +
            "Lo más rápido: abre el PDF, copia el texto y pégalo abajo en «Indicaciones». " +
            "Funciona sin subir nada y la IA lee mejor el texto que las fotos del PDF. " +
            "Si prefieres el archivo, expórtalo comprimido (en Vista Previa del Mac: Archivo → Exportar → Cuarzo «Reducir tamaño»).",
        },
        { status: 413 },
      );
    }

    const tipo = f.type || "";
    if (TIPOS_BASE64.has(tipo)) {
      const buf = Buffer.from(await f.arrayBuffer());
      archivos.push({ name: f.name, mediaType: tipo, base64: buf.toString("base64") });
    } else if (esTexto(tipo, f.name)) {
      archivos.push({ name: f.name, mediaType: "text/plain", text: await f.text() });
    } else {
      return NextResponse.json(
        {
          ok: false,
          error: `"${f.name}" no es un formato soportado. Acepto PDF, imágenes (PNG/JPG/WebP) y texto. Si es Word, expórtalo a PDF.`,
        },
        { status: 415 },
      );
    }
  }

  const res = await prellenarExperiencia(archivos, notas);
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, ...res.result });
}
