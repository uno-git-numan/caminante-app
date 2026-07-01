"use server";

import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Experience } from "./types";

export type SaveResult =
  | { ok: true; slug: string; status: Experience["status"] }
  | { ok: false; error: string };

export async function saveExperience(exp: Experience): Promise<SaveResult> {
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
  const row = { slug, status: exp.status, data: { ...exp, slug } };
  const { error } = await sb.from("experiences").upsert(row, { onConflict: "slug" });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, slug, status: exp.status };
}
