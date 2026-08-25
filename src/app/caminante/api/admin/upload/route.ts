import { NextResponse } from "next/server";
import { puedeEntrarAlPanel } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "experiences";

export async function POST(request: Request) {
  // ⚠️ También «puede entrar al panel», no «es la casa». Sin esto un operador no
  // puede subir NI UNA foto a su experiencia: el formulario existe para que él
  // la arme, y armarla sin fotos no es armarla. El bucket es el mismo y los
  // archivos quedan bajo su experiencia, que solo él y la casa pueden editar.
  if (!(await puedeEntrarAlPanel())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Máximo 10 MB por imagen." }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const base =
    file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 40) || "img";
  const path = `uploads/${Date.now()}-${base}.${ext}`;

  const sb = createSupabaseAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
