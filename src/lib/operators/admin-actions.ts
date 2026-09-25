"use server";

// Edición del perfil público del operador desde el panel. Cada action
// re-verifica isCurrentUserAdmin() (el gate del layout no cubre actions directas).
import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { operadoraObjetivo } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cleanAdjust, type TeamMember } from "@/lib/operators/public";
import { slugLibre } from "@/lib/operators/slug";

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
  const parseAdjust = (k: string) => {
    try { return cleanAdjust(JSON.parse(String(formData.get(k) ?? "null"))); } catch { return null; }
  };
  const photoAdjust = photoUrl ? parseAdjust("photoAdjust") : null;
  const heroAdjust = heroPhotoUrl ? parseAdjust("heroAdjust") : null;

  // Equipo: llega como JSON (el form lo arma); se sanea server-side.
  let team: TeamMember[] = [];
  try {
    const raw = JSON.parse(String(formData.get("team") ?? "[]")) as Partial<TeamMember>[];
    team = (Array.isArray(raw) ? raw : [])
      .map((t) => {
        const pu = String(t?.photoUrl ?? "").trim().slice(0, 500);
        return {
          name: String(t?.name ?? "").trim().slice(0, 80),
          role: String(t?.role ?? "").trim().slice(0, 120),
          quote: String(t?.quote ?? "").trim().slice(0, 200),
          photoUrl: pu,
          adjust: pu ? cleanAdjust((t as { adjust?: unknown }).adjust) : null,
        };
      })
      .filter((t) => t.name);
  } catch {
    return { ok: false, error: "El equipo no se pudo leer. Intenta de nuevo." };
  }

  const sb = createSupabaseAdminClient();

  // Rescate de los operadores que nacieron sin dirección pública (todos los
  // creados al aprobar una aplicación antes del 11 ago: nada asignaba `slug`).
  // Se le pone una la PRIMERA vez que se guarda su perfil, nunca después: la
  // URL ya se compartió y renombrarla rompe links vivos. Ver operators/slug.ts.
  const { data: actual } = await sb.from("operators").select("slug").eq("id", id).maybeSingle();
  const patch: Record<string, unknown> = {
    name, bio, instagram,
    photo_url: photoUrl, photo_adjust: photoAdjust,
    hero_photo_url: heroPhotoUrl, hero_adjust: heroAdjust,
    team,
  };
  if (!(actual as { slug: string | null } | null)?.slug) {
    const nuevo = await slugLibre(sb, name);
    if (nuevo) patch.slug = nuevo;
  }

  const { data, error } = await sb
    .from("operators")
    .update(patch)
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

  // Sin slug no hay página que publicar: el perfil quedaría marcado como
  // público y aun así invisible (el chip «Operada por» filtra por slug, y
  // /caminante/operador/ sin nada abajo no existe). Es mejor decirlo que
  // fingir que se publicó.
  if (publicar) {
    const { data: op } = await sb.from("operators").select("slug").eq("id", id).maybeSingle();
    if (!(op as { slug: string | null } | null)?.slug) {
      return { ok: false, error: "Guarda el perfil primero: sin eso no tiene dirección pública." };
    }
  }

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

/**
 * «Tu página» desde Mi perfil (lámina «Panel Operadora»): la bio y el
 * Instagram, que son de la operadora y los edita ella. Sólo esas dos columnas:
 * `saveOperatorProfile` escribe el perfil ENTERO (fotos, encuadres, equipo) y
 * llamarla con dos campos borraría lo demás. Las fotos y el equipo siguen en
 * el editor de la casa.
 *
 * Gate: la casa sobre cualquiera, la operadora sólo sobre sí misma (la misma
 * regla que subir un documento), no `isCurrentUserAdmin` como el resto de
 * este archivo, porque aquí quien escribe es la operadora.
 */
export async function guardarMiPagina(
  operadorId: string,
  bio: string,
  instagram: string,
): Promise<OperadorSaveResult> {
  const id = await operadoraObjetivo((operadorId ?? "").trim() || null);
  if (!id || id !== (operadorId ?? "").trim()) return { ok: false, error: "No autorizado." };
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("operators")
    .update({
      bio: bio.trim().slice(0, 1200) || null,
      instagram: instagram.trim().replace(/^@/, "").slice(0, 60) || null,
    })
    .eq("id", id)
    .select("slug")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  const slug = (data as { slug?: string | null } | null)?.slug;
  if (slug) revalidar(slug);
  revalidatePath("/caminante/admin/mi-alta");
  return { ok: true };
}
