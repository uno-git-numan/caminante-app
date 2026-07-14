"use server";

// Reenvío de correos desde el panel de admin. Cada action re-verifica admin.
import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resendSurveyEmail } from "@/lib/feedback/send";
import { fetchDeslindesPendientes } from "@/lib/registration/pending";
import { notifyDeslindePendiente } from "@/lib/notifications/notify-customer";

const SITE = "https://caminante.numanhub.com";

// Reenvía el recordatorio de deslinde de UNA reserva pendiente.
export async function reenviarDeslinde(formData: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const reservationId = String(formData.get("reservationId") ?? "").trim();
  if (reservationId) {
    const pend = (await fetchDeslindesPendientes()).find((p) => p.reservationId === reservationId);
    if (pend?.email) {
      await notifyDeslindePendiente({
        email: pend.email,
        nombre: pend.nombre,
        experiencia: pend.experiencia,
        deslindeUrl: `${SITE}/caminante/registro/${pend.slug}?reserva=${pend.reservationId}`,
      });
    }
  }
  revalidatePath("/caminante/admin/encuesta");
}

// Reenvía el recordatorio a TODOS los deslindes pendientes.
export async function reenviarDeslindesTodos(): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  for (const p of await fetchDeslindesPendientes()) {
    if (p.email) {
      await notifyDeslindePendiente({
        email: p.email,
        nombre: p.nombre,
        experiencia: p.experiencia,
        deslindeUrl: `${SITE}/caminante/registro/${p.slug}?reserva=${p.reservationId}`,
      });
    }
  }
  revalidatePath("/caminante/admin/encuesta");
}

// Reenvía la encuesta de UNA persona pendiente (por feedback id).
export async function reenviarEncuesta(formData: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const id = String(formData.get("feedbackId") ?? "").trim();
  if (id) await resendSurveyEmail(id);
  revalidatePath("/caminante/admin/encuesta");
}

// Reenvía la encuesta a TODOS los pendientes de una experiencia.
export async function reenviarEncuestaPendientes(formData: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const experienceId = String(formData.get("experienceId") ?? "").trim();
  if (experienceId) {
    const sb = createSupabaseAdminClient();
    const { data } = await sb
      .from("experience_feedback")
      .select("id")
      .eq("experience_id", experienceId)
      .neq("status", "submitted");
    for (const r of (data ?? []) as { id: string }[]) {
      await resendSurveyEmail(r.id);
    }
  }
  revalidatePath("/caminante/admin/encuesta");
}

// Reenvía la encuesta a TODOS los pendientes de TODAS las experiencias.
export async function reenviarEncuestaTodos(): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("experience_feedback")
    .select("id")
    .neq("status", "submitted");
  for (const r of (data ?? []) as { id: string }[]) {
    await resendSurveyEmail(r.id);
  }
  revalidatePath("/caminante/admin/encuesta");
}
