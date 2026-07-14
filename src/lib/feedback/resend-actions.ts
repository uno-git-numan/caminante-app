"use server";

// Reenvío de correos desde el panel de admin. Cada action re-verifica admin.
// Los envíos en lote acumulan enviados/fallidos y REDIRIGEN con un mensaje
// (banner ?ok / ?error en la página de encuesta), para que un envío fallido no
// pase desapercibido. sendViaResend ya reintenta ante rate limit/5xx; además
// espaciamos un poco cada envío para no topar el límite de Resend (~2/seg).
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resendSurveyEmail } from "@/lib/feedback/send";
import { fetchDeslindesPendientes } from "@/lib/registration/pending";
import { notifyDeslindePendiente } from "@/lib/notifications/notify-customer";

const SITE = "https://caminante.numanhub.com";
const PANEL = "/caminante/admin/encuesta";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Construye el mensaje de resultado y redirige al panel con banner ok/error.
function volver(sent: number, fails: string[], noun: string): never {
  const failed = fails.length;
  const plural = sent === 1 ? noun : `${noun}s`;
  const msg =
    failed === 0
      ? `Reenvié ${sent} ${plural} ✓`
      : `Reenvié ${sent} · fallaron ${failed}: ${fails.slice(0, 8).join(", ")}${fails.length > 8 ? "…" : ""}. Intenta de nuevo con los que faltan.`;
  revalidatePath(PANEL);
  redirect(`${PANEL}?${failed ? "error" : "ok"}=${encodeURIComponent(msg)}`);
}

// ── Encuestas ───────────────────────────────────────────────────────────────

// Reenvía la encuesta de UNA persona pendiente (por feedback id).
export async function reenviarEncuesta(formData: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const id = String(formData.get("feedbackId") ?? "").trim();
  const ok = id ? await resendSurveyEmail(id) : false;
  volver(ok ? 1 : 0, ok ? [] : ["ese correo"], "encuesta");
}

async function loteEncuesta(ids: { id: string; email: string | null }[]): Promise<never> {
  let sent = 0;
  const fails: string[] = [];
  for (const it of ids) {
    const ok = await resendSurveyEmail(it.id);
    if (ok) sent++;
    else fails.push(it.email || "(sin correo)");
    await sleep(500);
  }
  volver(sent, fails, "encuesta");
}

// Reenvía la encuesta a TODOS los pendientes de una experiencia.
export async function reenviarEncuestaPendientes(formData: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const experienceId = String(formData.get("experienceId") ?? "").trim();
  if (!experienceId) volver(0, [], "encuesta");
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("experience_feedback")
    .select("id, contacts(email)")
    .eq("experience_id", experienceId)
    .neq("status", "submitted");
  const ids = (data ?? []).map((r) => ({
    id: r.id as string,
    email: (r.contacts as unknown as { email?: string } | null)?.email ?? null,
  }));
  await loteEncuesta(ids);
}

// Reenvía la encuesta a TODOS los pendientes de TODAS las experiencias.
export async function reenviarEncuestaTodos(): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("experience_feedback")
    .select("id, contacts(email)")
    .neq("status", "submitted");
  const ids = (data ?? []).map((r) => ({
    id: r.id as string,
    email: (r.contacts as unknown as { email?: string } | null)?.email ?? null,
  }));
  await loteEncuesta(ids);
}

// ── Deslindes ─────────────────────────────────────────────────────────────

async function enviarDeslinde(p: { email: string | null; nombre: string; experiencia: string; slug: string; reservationId: string }): Promise<boolean> {
  if (!p.email) return false;
  return notifyDeslindePendiente({
    email: p.email,
    nombre: p.nombre,
    experiencia: p.experiencia,
    deslindeUrl: `${SITE}/caminante/registro/${p.slug}?reserva=${p.reservationId}`,
  });
}

// Reenvía el recordatorio de deslinde de UNA reserva pendiente.
export async function reenviarDeslinde(formData: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const reservationId = String(formData.get("reservationId") ?? "").trim();
  const pend = (await fetchDeslindesPendientes()).find((p) => p.reservationId === reservationId);
  const ok = pend ? await enviarDeslinde(pend) : false;
  volver(ok ? 1 : 0, ok ? [] : ["ese correo"], "recordatorio");
}

// Reenvía el recordatorio a TODOS los deslindes pendientes.
export async function reenviarDeslindesTodos(): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  let sent = 0;
  const fails: string[] = [];
  for (const p of await fetchDeslindesPendientes()) {
    const ok = await enviarDeslinde(p);
    if (ok) sent++;
    else fails.push(p.email || p.nombre || "(sin correo)");
    await sleep(500);
  }
  volver(sent, fails, "recordatorio");
}
