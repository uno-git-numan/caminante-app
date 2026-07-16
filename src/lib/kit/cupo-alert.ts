// P7 «Cupo honesto» AUTOMÁTICA — lógica del cron.
//
// Recorre las salidas PÚBLICAS y ABIERTAS de experiencias PUBLICADAS, calcula el
// cupo restante EN VIVO (capacidad − Σ reservas que apartan) y, cuando cae a
// ≤ umbral, avisa a Luis/Roberta para que publiquen la story P7 del kit.
//
// Anti-spam (columnas de 0024): guarda por salida el último "quedan N" avisado.
//   avisar ⇔ available ∈ (0, umbral]  Y  (cupo_alert_available IS NULL O available < cupo_alert_available)
// → solo reavisa cuando BAJA (5→3→1), nunca el mismo número dos veces. Si el cupo
// vuelve a subir por encima del umbral, RE-ARMA (cupo_alert_available = NULL).
//
// Seguro de desplegar ANTES de aplicar 0024: si las columnas no existen (42703)
// termina con {ok:false, pendingMigration:true} sin tocar nada.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { HOLDING_STATUSES } from "@/lib/experiences/availability";
import { notifyCupoHonesto } from "@/lib/notifications/notify-admin";
import type { Experience } from "@/lib/experiences/types";
import { expName } from "@/lib/kit/kit";

const THRESHOLD = Number(process.env.CUPO_ALERT_THRESHOLD || 5);

type SlotRow = {
  id: string;
  experience_id: string;
  label: string | null;
  capacity_total: number | null;
  cupo_alert_available: number | null;
};

export type CupoAlertResult = {
  ok: boolean;
  pendingMigration?: boolean;
  threshold: number;
  scanned: number; // salidas con tope evaluadas
  notified: { slug: string; salidas: { label: string; quedan: number }[] }[];
  rearmed: number; // salidas que volvieron a subir → re-armadas
};

export async function runCupoAlert(): Promise<CupoAlertResult> {
  const sb = createSupabaseAdminClient();

  // 1. Experiencias PUBLICADAS → id → {slug, exp}
  const { data: exps } = await sb
    .from("experiences")
    .select("id, slug, status, data")
    .eq("status", "published");
  const expById = new Map<string, { slug: string; exp: Experience }>();
  for (const e of exps || []) {
    const row = e as { id: string; slug: string; data: Experience };
    expById.set(row.id, { slug: row.slug, exp: row.data });
  }
  const expIds = [...expById.keys()];
  if (expIds.length === 0) {
    return { ok: true, threshold: THRESHOLD, scanned: 0, notified: [], rearmed: 0 };
  }

  // 2. Salidas abiertas, públicas y CON TOPE de esas experiencias (incluye el flag de aviso)
  const { data: slots, error } = await sb
    .from("experience_slots")
    .select("id, experience_id, label, capacity_total, cupo_alert_available")
    .in("experience_id", expIds)
    .eq("status", "open")
    .eq("visibility", "public")
    .not("capacity_total", "is", null);

  if (error) {
    // 42703 = columna inexistente → la migración 0024 aún no está aplicada.
    if ((error as { code?: string }).code === "42703") {
      return { ok: false, pendingMigration: true, threshold: THRESHOLD, scanned: 0, notified: [], rearmed: 0 };
    }
    throw new Error(error.message);
  }

  const slotRows = (slots || []) as SlotRow[];
  if (slotRows.length === 0) {
    return { ok: true, threshold: THRESHOLD, scanned: 0, notified: [], rearmed: 0 };
  }

  // 3. Reservas que APARTAN, por salida
  const { data: resv } = await sb
    .from("reservations")
    .select("slot_id, num_people, status")
    .in("experience_id", expIds)
    .in("status", HOLDING_STATUSES);
  const taken = new Map<string, number>();
  for (const r of resv || []) {
    const sid = (r as { slot_id: string | null }).slot_id;
    if (sid) taken.set(sid, (taken.get(sid) || 0) + (((r as { num_people: number }).num_people) || 0));
  }

  // 4. Evaluar cada salida; agrupar avisos por experiencia
  const nowIso = new Date().toISOString();
  const porExp = new Map<string, { salidas: { label: string; quedan: number }[]; slotIds: { id: string; available: number }[] }>();
  const rearmIds: string[] = [];

  for (const s of slotRows) {
    const cap = s.capacity_total as number;
    const available = Math.max(0, cap - (taken.get(s.id) || 0));

    if (available > THRESHOLD) {
      // Volvió a haber lugares por encima del umbral → re-armar si estaba avisado.
      if (s.cupo_alert_available !== null) rearmIds.push(s.id);
      continue;
    }
    if (available <= 0) continue; // agotada: no hay "quedan N" que anunciar

    const yaAvisado = s.cupo_alert_available;
    const debeAvisar = yaAvisado === null || available < yaAvisado;
    if (!debeAvisar) continue;

    const meta = expById.get(s.experience_id);
    if (!meta) continue;
    const g = porExp.get(s.experience_id) || { salidas: [], slotIds: [] };
    g.salidas.push({ label: s.label || "Salida", quedan: available });
    g.slotIds.push({ id: s.id, available });
    porExp.set(s.experience_id, g);
  }

  // 5. Re-armar salidas que subieron (best-effort)
  if (rearmIds.length) {
    await sb.from("experience_slots").update({ cupo_alert_available: null, cupo_alert_at: nowIso }).in("id", rearmIds);
  }

  // 6. Notificar por experiencia y marcar el flag (solo si el aviso no truena)
  const notified: CupoAlertResult["notified"] = [];
  for (const [expId, g] of porExp) {
    const meta = expById.get(expId)!;
    try {
      await notifyCupoHonesto({ experiencia: expName(meta.exp), slug: meta.slug, salidas: g.salidas });
      // Marcar cada salida con el N avisado (evita el re-aviso del mismo número).
      await Promise.all(
        g.slotIds.map((x) =>
          sb.from("experience_slots").update({ cupo_alert_available: x.available, cupo_alert_at: nowIso }).eq("id", x.id),
        ),
      );
      notified.push({ slug: meta.slug, salidas: g.salidas });
    } catch (e) {
      // Si el aviso falla, NO marcamos el flag → se reintenta mañana.
      console.error("runCupoAlert notify:", meta.slug, e);
    }
  }

  return { ok: true, threshold: THRESHOLD, scanned: slotRows.length, notified, rearmed: rearmIds.length };
}
