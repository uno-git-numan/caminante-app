"use server";

// Edición del perfil público del operador desde el panel. Cada action
// re-verifica isCurrentUserAdmin() (el gate del layout no cubre actions directas).
import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TeamMember } from "@/lib/operators/public";

export type OperadorSaveResult = { ok: boolean; error?: string };

function revalidar(slug: string) {
  revalidatePath("/caminante/admin/operadores");
  revalidatePath(`/caminante/operador/${slug}`);
}

// Guarda el contenido del perfil (NO toca is_public — publicar es aparte).
export async function saveOperatorProfile(formData: FormData): Promise<OperadorSaveResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "No autorizado." };
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Falta el operador." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "El nombre no puede quedar vacío." };
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const instagram = String(formData.get("instagram") ?? "").trim().replace(/^@/, "") || null;
  const photoUrl = String(formData.get("photoUrl") ?? "").trim() || null;
  const heroPhotoUrl = String(formData.get("heroPhotoUrl") ?? "").trim() || null;

  // Equipo: llega como JSON (el form lo arma); se sanea server-side.
  let team: TeamMember[] = [];
  try {
    const raw = JSON.parse(String(formData.get("team") ?? "[]")) as Partial<TeamMember>[];
    team = (Array.isArray(raw) ? raw : [])
      .map((t) => ({
        name: String(t?.name ?? "").trim().slice(0, 80),
        role: String(t?.role ?? "").trim().slice(0, 120),
        quote: String(t?.quote ?? "").trim().slice(0, 200),
        photoUrl: String(t?.photoUrl ?? "").trim().slice(0, 500),
      }))
      .filter((t) => t.name);
  } catch {
    return { ok: false, error: "El equipo no se pudo leer. Intenta de nuevo." };
  }

  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("operators")
    .update({ name, bio, instagram, photo_url: photoUrl, hero_photo_url: heroPhotoUrl, team })
    .eq("id", id)
    .select("slug")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidar((data?.slug as string) ?? "");
  return { ok: true };
}

// Publicar / pasar a borrador (el switch de visibilidad del perfil).
export async function setOperatorPublic(formData: FormData): Promise<OperadorSaveResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "No autorizado." };
  const id = String(formData.get("id") ?? "").trim();
  const publicar = String(formData.get("publicar") ?? "") === "1";
  if (!id) return { ok: false, error: "Falta el operador." };
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("operators")
    .update({ is_public: publicar })
    .eq("id", id)
    .select("slug")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidar((data?.slug as string) ?? "");
  return { ok: true };
}
