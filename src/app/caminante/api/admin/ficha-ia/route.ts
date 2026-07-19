// Endpoint de la FICHA CIENTÍFICA con IA (solo admin): recibe las guías/papers
// del admin y devuelve la ficha extraída (ver src/lib/ai/ficha-ia.ts). Calcado
// de api/admin/prellenar. Gate re-verificado adentro — el layout del admin NO
// cubre route handlers.
import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import type { ArchivoEntrada } from "@/lib/ai/prellenar";
import { extraerFicha } from "@/lib/ai/ficha-ia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// La extracción de una ficha toma ~1–2 min con PDFs con fotos.
export const maxDuration = 300;

// Vercel rechaza bodies de ~4.5 MB — límite propio con mensaje claro.
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;

const TIPOS_BASE64 = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"]);

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

  if (!files.length && !notas.trim()) {
    return NextResponse.json(
      { ok: false, error: "Sube un documento (PDF/imagen) o pega el texto con los datos." },
      { status: 400 },
    );
  }
  if (!files.length) {
    const res = await extraerFicha([{ name: "notas.txt", mediaType: "text/plain", text: notas.trim() }], "");
    if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 502 });
    return NextResponse.json({ ok: true, ...res.result });
  }

  let total = 0;
  const archivos: ArchivoEntrada[] = [];
  for (const f of files) {
    total += f.size;
    if (total > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Los archivos pesan más de 4 MB en total. Comprime el PDF o divide en tandas." },
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
        { ok: false, error: `"${f.name}" no es un formato soportado. Acepto PDF, imágenes (PNG/JPG/WebP) y texto.` },
        { status: 415 },
      );
    }
  }

  const res = await extraerFicha(archivos, notas);
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 502 });
  return NextResponse.json({ ok: true, ...res.result });
}
