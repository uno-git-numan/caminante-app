"use server";

// Acciones del PUBLICADOR (invocadas desde el Kit). Cada una RE-VERIFICA admin
// (el gate del layout no cubre server actions llamadas directo). Reciben las URLs
// públicas de los PNG ya subidos por el cliente + el caption de marca.

import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchOpenSlotsForTemplate } from "@/lib/experiences/availability";
import { publishToInstagram } from "@/lib/social/publish";
import { recordPost, schedulePost, cancelScheduledPost } from "@/lib/social/posts";
import { computeCampaignSchedule } from "@/lib/social/campana";
import { fetchBusyDates } from "@/lib/social/agenda";

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

// Programa la CAMPAÑA COMPLETA de una experiencia: recibe las piezas listas (M1+M2,
// con sus imágenes ya subidas) y les calcula la fecha con el canon relativo a la
// próxima salida (dos anclas: M1 al lanzamiento, M2 a la salida) → agenda todo de un
// jalón. P7 la deja el cron de cupo; M3 se agenda después del viaje.
export async function programarCampana(input: {
  slug: string;
  pieces: { pieceId: string; format: "post" | "story"; caption?: string; imageUrls: string[] }[];
}): Promise<PublishActionResult & { scheduled?: { pieceId: string; date: string }[]; departure?: string | null }> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "No autorizado." };
  const pieces = (input.pieces || []).filter((p) => p.imageUrls?.length);
  if (!pieces.length) return { ok: false, error: "No hay piezas listas (M1/M2) para programar." };

  // Fecha de la próxima salida pública (ancla de M2). Si no hay, M2 usa fallback.
  let departure: Date | null = null;
  try {
    const sb = createSupabaseAdminClient();
    const { data: exp } = await sb.from("experiences").select("id").eq("slug", input.slug).maybeSingle();
    const expId = (exp as { id: string } | null)?.id;
    if (expId) {
      const slots = await fetchOpenSlotsForTemplate(expId);
      const now = Date.now();
      const dated = slots
        .map((s) => (s.startsAt ? new Date(s.startsAt) : null))
        .filter((d): d is Date => d !== null && !isNaN(d.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());
      departure = dated.find((d) => d.getTime() >= now) ?? dated[0] ?? null;
    }
  } catch {
    departure = null;
  }

  // Agenda GLOBAL: los días que ya ocupan otras campañas, para no encimarse.
  const busyDates = await fetchBusyDates();
  const schedule = computeCampaignSchedule(pieces.map((p) => p.pieceId), { now: new Date(), departure, busyDates });
  const byId = new Map(pieces.map((p) => [p.pieceId, p]));
  const email = await adminEmail();

  const scheduled: { pieceId: string; date: string }[] = [];
  for (const s of schedule) {
    const p = byId.get(s.pieceId);
    if (!p) continue;
    await schedulePost({
      experienceSlug: input.slug,
      pieceId: p.pieceId,
      format: p.format,
      caption: p.caption ?? null,
      imageUrls: p.imageUrls,
      createdBy: email,
      scheduledAt: s.date.toISOString(),
    });
    scheduled.push({ pieceId: p.pieceId, date: s.date.toISOString() });
  }
  revalidatePath("/caminante/admin/social-cola");
  return { ok: true, scheduled, departure: departure ? departure.toISOString() : null };
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
