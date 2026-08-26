// Endpoint de la FUSIÓN del deslinde/encuesta del operador con los nuestros.
// La regla y el porqué viven en src/lib/ai/fusionar-deslinde.ts; aquí solo entra
// el archivo, se valida y se llama.
//
// Gate re-verificado adentro: el layout del panel NO cubre route handlers.
import { NextResponse } from "next/server";
import { puedeEntrarAlPanel } from "@/lib/auth/authorization";
import { fusionarDeslinde, type SeccionEncuesta } from "@/lib/ai/fusionar-deslinde";
import { leerClausulas, type ClausulaGuardada } from "@/lib/legal/clausulas";
import type { ArchivoEntrada } from "@/lib/ai/prellenar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Leer una carta de deslinde entera y conciliarla cláusula por cláusula toma
// más que pre-llenar un formulario: el modelo tiene que comparar dos documentos.
export const maxDuration = 300;

// El mismo techo de plataforma que en /prellenar: Vercel corta el cuerpo en
// ~4.5 MB antes de que este código lo vea. Por eso la interfaz ofrece SIEMPRE la
// alternativa de pegar el texto, que además da mejor resultado.
const MAX_TOTAL_BYTES = Math.floor(4.4 * 1024 * 1024);

const TIPOS_BASE64 = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"]);

function esTexto(tipo: string, nombre: string): boolean {
  return tipo.startsWith("text/") || /\.(md|txt)$/i.test(nombre);
}

export async function POST(request: Request) {
  // ⚠️ «Puede entrar al panel», NO «es la casa». Este formulario existe para que
  // el OPERADOR dé de alta su experiencia, y su carta de deslinde es suya: si
  // aquí se pidiera `isCurrentUserAdmin()`, el único que no podría fusionar su
  // propio documento sería su dueño. Ya pasó con «Pre-llenar con IA».
  if (!(await puedeEntrarAlPanel())) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo leer el archivo. Intenta de nuevo." }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const textoPegado = String(form.get("texto") ?? "");
  const contextoExperiencia = String(form.get("contexto") ?? "");

  // El operador pudo haber subido su carta UNA vez, en el onboarding. En ese
  // caso el formulario manda su URL y la traemos aquí — no tiene por qué volver
  // a buscar el archivo cada vez que da de alta una experiencia.
  //
  // ⚠️ La URL NO viene del usuario en el sentido peligroso: el formulario la
  // recibe del servidor (la fila `operators` de su alcance). Aun así se acota a
  // nuestro propio Storage, porque el campo viaja por el cliente y ahí un
  // `docUrl` cambiado a mano convertiría este endpoint en un proxy de salida.
  const docUrl = String(form.get("docUrl") ?? "").trim();
  const archivosGuardados: ArchivoEntrada[] = [];
  if (docUrl) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (!base || !docUrl.startsWith(`${base}/storage/v1/`)) {
      return NextResponse.json({ ok: false, error: "Ese documento no está en el almacenamiento de la plataforma." }, { status: 400 });
    }
    try {
      const r = await fetch(docUrl);
      if (!r.ok) throw new Error(String(r.status));
      const tipo = r.headers.get("content-type")?.split(";")[0] || "application/pdf";
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.byteLength > MAX_TOTAL_BYTES) {
        return NextResponse.json({ ok: false, error: "El documento guardado pesa demasiado para leerlo. Pega el texto." }, { status: 413 });
      }
      const nombre = decodeURIComponent(docUrl.split("/").pop() || "deslinde");
      if (TIPOS_BASE64.has(tipo)) archivosGuardados.push({ name: nombre, mediaType: tipo, base64: buf.toString("base64") });
      else archivosGuardados.push({ name: nombre, mediaType: "text/plain", text: buf.toString("utf8") });
    } catch {
      return NextResponse.json({ ok: false, error: "No se pudo leer el documento guardado. Vuelve a subirlo." }, { status: 502 });
    }
  }

  if (!files.length && !textoPegado.trim() && !archivosGuardados.length) {
    return NextResponse.json(
      { ok: false, error: "Sube tu carta de deslinde (PDF, foto o texto) o pega su contenido." },
      { status: 400 },
    );
  }

  // Lo actual llega del formulario que el usuario tiene enfrente (puede traer
  // ediciones sin guardar). Se normaliza con el lector único, nunca a mano.
  let clausulasActuales: ClausulaGuardada[] = [];
  let seccionesActuales: SeccionEncuesta[] = [];
  try {
    const c = form.get("clausulas");
    if (typeof c === "string" && c.trim()) clausulasActuales = JSON.parse(c);
    const s = form.get("secciones");
    if (typeof s === "string" && s.trim()) seccionesActuales = JSON.parse(s);
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo leer el estado del formulario." }, { status: 400 });
  }

  let total = 0;
  const archivos: ArchivoEntrada[] = [...archivosGuardados];
  for (const f of files) {
    total += f.size;
    if (total > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El archivo pesa más de 4.4 MB y ahí corta el servidor. Lo más rápido: abre el PDF, copia el texto de tu deslinde y pégalo en el cuadro de abajo — funciona igual y la IA lee mejor el texto que las fotos del documento.",
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
        { ok: false, error: `"${f.name}" no es un formato soportado. Acepto PDF, imágenes y texto. Si es Word, expórtalo a PDF.` },
        { status: 415 },
      );
    }
  }

  const res = await fusionarDeslinde({
    archivos,
    textoPegado,
    clausulasActuales: leerClausulas(clausulasActuales),
    seccionesActuales: Array.isArray(seccionesActuales) ? seccionesActuales : [],
    contextoExperiencia: contextoExperiencia.trim() || undefined,
  });
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 502 });
  return NextResponse.json({ ok: true, ...res.result });
}
