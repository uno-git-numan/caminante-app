"use server";

// Acciones del PUBLICADOR (invocadas desde el Kit). Cada una RE-VERIFICA admin
// (el gate del layout no cubre server actions llamadas directo). Reciben las URLs
// públicas de los PNG ya subidos por el cliente + el caption de marca.

import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { publishToInstagram } from "@/lib/social/publish";
import { recordPost, schedulePost, cancelScheduledPost } from "@/lib/social/posts";

async function adminEmail(): Promise<string | null> {
  try {
    const u = await getCurrentUser();
    return u?.email ?? null;
  } catch {
    return null;
  }
}

export type PublishActionResult = { ok: boolean; error?: string; permalink?: string };

type PieceInput = {
  slug: string;
  pieceId: string;
  format: "post" | "story";
  caption?: string;
  imageUrls: string[];
};

// Publica AHORA una pieza del kit en Instagram y registra el resultado.
export async function publicarPieza(input: PieceInput): Promise<PublishActionResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "No autorizado." };
  const urls = (input.imageUrls || []).filter(Boolean);
  if (!urls.length) return { ok: false, error: "No hay imágenes generadas para publicar." };

  const email = await adminEmail();
  const res = await publishToInstagram({ format: input.format, imageUrls: urls, caption: input.caption });

  await recordPost({
    experienceSlug: input.slug,
    pieceId: input.pieceId,
    format: input.format,
    caption: input.caption ?? null,
    imageUrls: urls,
    createdBy: email,
    status: res.ok ? "published" : "failed",
    igMediaId: res.ok ? res.mediaId : null,
    igPermalink: res.ok ? res.permalink ?? null : null,
    error: res.ok ? null : res.error,
  });

  return res.ok ? { ok: true, permalink: res.permalink } : { ok: false, error: res.error };
}

// Programa una pieza para publicarse en una fecha (el cron la publica cuando vence).
export async function programarPieza(input: PieceInput & { scheduledAt: string }): Promise<PublishActionResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "No autorizado." };
  const urls = (input.imageUrls || []).filter(Boolean);
  if (!urls.length) return { ok: false, error: "No hay imágenes generadas para programar." };
  const when = new Date(input.scheduledAt);
  if (isNaN(when.getTime())) return { ok: false, error: "Fecha inválida." };

  const email = await adminEmail();
  await schedulePost({
    experienceSlug: input.slug,
    pieceId: input.pieceId,
    format: input.format,
    caption: input.caption ?? null,
    imageUrls: urls,
    createdBy: email,
    scheduledAt: when.toISOString(),
  });
  revalidatePath("/caminante/admin/social-cola");
  return { ok: true };
}

// Cancela una publicación programada.
export async function cancelarPost(id: string): Promise<PublishActionResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "No autorizado." };
  await cancelScheduledPost(id);
  revalidatePath("/caminante/admin/social-cola");
  return { ok: true };
}

// Versión para <form> (lee el id del FormData) — usada por el panel de la cola.
export async function cancelarPostForm(formData: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const id = formData.get("id");
  if (typeof id === "string" && id) await cancelScheduledPost(id);
  revalidatePath("/caminante/admin/social-cola");
}
