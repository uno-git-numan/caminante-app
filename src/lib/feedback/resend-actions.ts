"use server";

// Reenvío de correos desde el panel de admin. Cada action re-verifica admin.
// Los envíos en lote acumulan enviados/fallidos y REDIRIGEN con un mensaje
// (banner ?ok / ?error en la página de encuesta), para que un envío fallido no
// pase desapercibido. sendViaResend ya reintenta ante rate limit/5xx; además
// espaciamos un poco cada envío para no topar el límite de Resend (~2/seg).
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { puedeEntrarAlPanel } from "@/lib/auth/authorization";
import { puedeEditarExperiencia } from "@/lib/auth/alcance";
import { operadorDelAlcance } from "@/lib/admin/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resendSurveyEmail } from "@/lib/feedback/send";
import { fetchDeslindesPendientes } from "@/lib/registration/pending";
import { notifyDeslindePendiente } from "@/lib/notifications/notify-customer";

const SITE = "https://caminante.numanhub.com";
const PANEL = "/caminante/admin/encuesta";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Cada envío vive como NÚCLEO (devuelve cuántos salieron y cuáles fallaron) más
// una acción de formulario que redirige con banner. El panel de escritorio
// necesita el redirect; la app del teléfono llama el núcleo desde JS y un
// redirect la sacaría del panel móvil. La lógica de envío no se duplica.

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
export async function reenviarEncuestaUna(feedbackId: string): Promise<{ sent: number; fails: string[] }> {
  if (!(await puedeEntrarAlPanel())) return { sent: 0, fails: ["no autorizado"] };
  const id = (feedbackId || "").trim();
  if (!id) return { sent: 0, fails: ["ese correo"] };

  // El id es de una RESPUESTA y llega en un input oculto: hay que leer de qué
  // experiencia es antes de mandar nada. Es la unica de este archivo que no
  // podia apoyarse en una lista ya podada.
  const sb = createSupabaseAdminClient();
  const { data: fb } = await sb
    .from("experience_feedback")
    .select("experience_id")
    .eq("id", id)
    .maybeSingle();
  if (!fb) return { sent: 0, fails: ["ese correo"] };
  if (!(await puedeEditarExperiencia((fb as { experience_id: string }).experience_id))) {
    return { sent: 0, fails: ["no autorizado"] };
  }

  const ok = await resendSurveyEmail(id);
  return { sent: ok ? 1 : 0, fails: ok ? [] : ["ese correo"] };
}

export async function reenviarEncuesta(formData: FormData): Promise<void> {
  if (!(await puedeEntrarAlPanel())) return;
  const r = await reenviarEncuestaUna(String(formData.get("feedbackId") ?? ""));
  volver(r.sent, r.fails, "encuesta");
}

async function loteEncuesta(ids: { id: string; email: string | null }[]): Promise<{ sent: number; fails: string[] }> {
  let sent = 0;
  const fails: string[] = [];
  for (const it of ids) {
    const ok = await resendSurveyEmail(it.id);
    if (ok) sent++;
    else fails.push(it.email || "(sin correo)");
    await sleep(500);
  }
  return { sent, fails };
}

// Pendientes de una experiencia; sin `experienceId`, de TODAS.
async function pendientesEncuesta(experienceId?: string) {
  const sb = createSupabaseAdminClient();
  let q = sb.from("experience_feedback").select("id, contacts(email)").neq("status", "submitted");
  if (experienceId) q = q.eq("experience_id", experienceId);
  // ⚠️ Sin `experienceId` esto es «TODAS las experiencias». Para un operador,
  // «todas» son las suyas — si no, un clic en «Reenviar a todos» le escribiría
  // a los clientes de la casa desde su panel.
  const operatorId = await operadorDelAlcance();
  if (operatorId && !experienceId) {
    const { data: mias } = await sb.from("experiences").select("id").eq("operator_id", operatorId);
    const ids = ((mias ?? []) as { id: string }[]).map((e) => e.id);
    if (!ids.length) return [];
    q = q.in("experience_id", ids);
  }
  const { data } = await q;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    email: (r.contacts as unknown as { email?: string } | null)?.email ?? null,
  }));
}

// Reenvía la encuesta a TODOS los pendientes de una experiencia.
export async function reenviarEncuestaDeExperiencia(experienceId: string): Promise<{ sent: number; fails: string[] }> {
  const id = (experienceId || "").trim();
  if (!id) return { sent: 0, fails: [] };
  // El id viaja en un input oculto: se comprueba contra la base.
  if (!(await puedeEditarExperiencia(id))) return { sent: 0, fails: ["no autorizado"] };
  return loteEncuesta(await pendientesEncuesta(id));
}

export async function reenviarEncuestaPendientes(formData: FormData): Promise<void> {
  if (!(await puedeEntrarAlPanel())) return;
  const r = await reenviarEncuestaDeExperiencia(String(formData.get("experienceId") ?? ""));
  volver(r.sent, r.fails, "encuesta");
}

// Reenvía la encuesta a TODOS los pendientes de TODAS las experiencias.
export async function reenviarEncuestaATodos(): Promise<{ sent: number; fails: string[] }> {
  if (!(await puedeEntrarAlPanel())) return { sent: 0, fails: ["no autorizado"] };
  return loteEncuesta(await pendientesEncuesta());
}

export async function reenviarEncuestaTodos(): Promise<void> {
  if (!(await puedeEntrarAlPanel())) return;
  const r = await reenviarEncuestaATodos();
  volver(r.sent, r.fails, "encuesta");
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
export async function recordarDeslindeUno(reservationId: string): Promise<{ sent: number; fails: string[] }> {
  // ⚠️ Basta con «puede entrar al panel» porque el alcance ya está aplicado
  // AGUAS ARRIBA: `fetchDeslindesPendientes` solo devuelve pendientes de las
  // experiencias de quien pregunta, y si el id no está en esa lista, `find`
  // devuelve undefined y no se manda nada. El operador recuerda a SU gente.
  if (!(await puedeEntrarAlPanel())) return { sent: 0, fails: ["no autorizado"] };
  const id = (reservationId || "").trim();
  const pend = (await fetchDeslindesPendientes()).find((p) => p.reservationId === id);
  const ok = pend ? await enviarDeslinde(pend) : false;
  return { sent: ok ? 1 : 0, fails: ok ? [] : ["ese correo"] };
}

export async function reenviarDeslinde(formData: FormData): Promise<void> {
  if (!(await puedeEntrarAlPanel())) return;
  const r = await recordarDeslindeUno(String(formData.get("reservationId") ?? ""));
  volver(r.sent, r.fails, "recordatorio");
}

// Reenvía el recordatorio a TODOS los deslindes pendientes.
export async function recordarDeslindeATodos(): Promise<{ sent: number; fails: string[] }> {
  // Igual que arriba: «todos» son los de SU lista, no los de la plataforma.
  if (!(await puedeEntrarAlPanel())) return { sent: 0, fails: ["no autorizado"] };
  let sent = 0;
  const fails: string[] = [];
  for (const p of await fetchDeslindesPendientes()) {
    const ok = await enviarDeslinde(p);
    if (ok) sent++;
    else fails.push(p.email || p.nombre || "(sin correo)");
    await sleep(500);
  }
  return { sent, fails };
}

export async function reenviarDeslindesTodos(): Promise<void> {
  if (!(await puedeEntrarAlPanel())) return;
  const r = await recordarDeslindeATodos();
  volver(r.sent, r.fails, "recordatorio");
}
