"use server";

import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Experience } from "./types";

export type SaveResult =
  | { ok: true; slug: string; status: Experience["status"] }
  // code "slug_exists": el slug ya existe y NO es el que se está editando →
  // guardar lo sobrescribiría. El form pide confirmación y reintenta con
  // allowOverwrite. Cualquier otro fallo va sin code.
  | { ok: false; error: string; code?: "slug_exists" };

export type SaveOpts = {
  // El slug que se está editando legítimamente (modo edición). Guardar sobre
  // ESE mismo slug no es colisión. En modo crear = null → cualquier slug
  // existente es colisión.
  expectedSlug?: string | null;
  // Confirmado por el admin: sobrescribir la experiencia existente.
  allowOverwrite?: boolean;
};

export async function saveExperience(
  exp: Experience,
  opts: SaveOpts = {},
): Promise<SaveResult> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "No autorizado. Inicia sesión como admin." };
  }
  const slug = (exp.slug || "").trim();
  if (!slug) {
    return { ok: false, error: "Falta el identificador (slug)." };
  }
  if (!exp.title?.trim() && !exp.titleAccent?.trim()) {
    return { ok: false, error: "Falta el título de la experiencia." };
  }

  const sb = createSupabaseAdminClient();

  // Guarda anti-sobrescritura: si el slug ya existe (en CUALQUIER estado — por
  // eso el cliente admin, no fetchExperienceBySlug que filtra published) y no
  // es el que se edita, bloquear hasta que el admin confirme.
  if (!opts.allowOverwrite && slug !== (opts.expectedSlug ?? null)) {
    const { data: existente } = await sb
      .from("experiences")
      .select("slug, status")
      .eq("slug", slug)
      .maybeSingle();
    if (existente) {
      const est = existente.status === "published" ? "publicada" : "en borrador";
      return {
        ok: false,
        code: "slug_exists",
        error: `Ya existe una experiencia ${est} con el identificador «${slug}». Guardar la sobrescribiría por completo.`,
      };
    }
  }

  const row = { slug, status: exp.status, data: { ...exp, slug } };
  const { error } = await sb.from("experiences").upsert(row, { onConflict: "slug" });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, slug, status: exp.status };
}
