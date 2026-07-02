"use server";

// Acciones de la sección Reservas del dashboard.
// - Registrar PAGO MANUAL (transferencia/efectivo): así entran al sistema los
//   cobros hechos fuera de Stripe. Recalcula el estado avanzando, nunca
//   retrocede (mismo criterio RANK que finalize-reservation).
// - Cancelar reserva: SOLO cambia status (jamás delete); libera el cupo porque
//   'cancelled' no está en HOLDING_STATUSES. Los pagos quedan como historial.
// Cada acción re-verifica admin (el gate del layout no cubre invocación directa).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";

const RANK: Record<string, number> = {
  requested: 0,
  confirmed: 1,
  partially_paid: 2,
  paid: 3,
  completed: 4,
  cancelled: 99,
};

function str(fd: FormData, k: string): string {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

function volver(msg: { ok?: string; error?: string }): never {
  const q = msg.ok
    ? `ok=${encodeURIComponent(msg.ok)}`
    : `error=${encodeURIComponent(msg.error || "Algo falló.")}`;
  revalidatePath("/caminante/admin");
  revalidatePath("/caminante/admin/reservas");
  redirect(`/caminante/admin/reservas?${q}`);
}

export async function registrarPagoManualAction(fd: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) volver({ error: "Solo el admin puede hacer esto." });

  const reservationId = str(fd, "reservationId");
  const monto = Number(str(fd, "monto").replace(/[^0-9.]/g, ""));
  const metodo = str(fd, "metodo"); // transfer | cash
  const fecha = str(fd, "fecha"); // YYYY-MM-DD (opcional; default hoy)

  if (!reservationId) volver({ error: "Falta la reserva." });
  if (!Number.isFinite(monto) || monto <= 0) volver({ error: "El monto debe ser mayor a cero." });
  if (!["transfer", "cash"].includes(metodo)) volver({ error: "Método inválido." });

  const sb = createSupabaseAdminClient();
  const { data: r } = await sb
    .from("reservations")
    .select("id, contact_id, status, total_amount_mxn")
    .eq("id", reservationId)
    .maybeSingle();
  if (!r) volver({ error: "Esa reserva no existe." });
  if (r.status === "cancelled") volver({ error: "La reserva está cancelada — reactívala primero." });

  // CDMX fijo UTC-6: mediodía local para que el día no se corra en reportes.
  const paidAt = fecha ? `${fecha}T12:00:00-06:00` : new Date().toISOString();
  const { error: payErr } = await sb.from("payments").insert({
    reservation_id: reservationId,
    contact_id: r.contact_id,
    amount_mxn: monto,
    status: "paid",
    method: metodo,
    paid_at: paidAt,
  });
  if (payErr) volver({ error: payErr.message });

  // Recalcular estado (solo avanzar). Si el total era 0 (cobro fuera del
  // sistema), el total pasa a ser lo pagado — sin deudas fantasma.
  const { data: pays } = await sb
    .from("payments")
    .select("amount_mxn, status")
    .eq("reservation_id", reservationId);
  const pagado = ((pays || []) as { amount_mxn: number; status: string }[])
    .filter((p) => p.status === "paid")
    .reduce((n, p) => n + Number(p.amount_mxn || 0), 0);
  const total = Number(r.total_amount_mxn || 0);
  const target = total > 0 ? total : pagado;
  const computed = pagado >= target && target > 0 ? "paid" : "partially_paid";
  const patch: Record<string, unknown> = {};
  if ((RANK[computed] ?? 0) > (RANK[r.status as string] ?? 0)) patch.status = computed;
  if (total === 0) patch.total_amount_mxn = pagado;
  if (Object.keys(patch).length) {
    await sb.from("reservations").update(patch).eq("id", reservationId);
  }

  volver({ ok: `Pago de $${monto.toLocaleString("es-MX")} registrado.` });
}

export async function cancelarReservaAction(fd: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) volver({ error: "Solo el admin puede hacer esto." });

  const reservationId = str(fd, "reservationId");
  if (!reservationId) volver({ error: "Falta la reserva." });

  const sb = createSupabaseAdminClient();
  const { data: r } = await sb
    .from("reservations")
    .select("id, status")
    .eq("id", reservationId)
    .maybeSingle();
  if (!r) volver({ error: "Esa reserva no existe." });
  if (r.status === "completed") {
    volver({ error: "Una experiencia ya vivida no se cancela." });
  }
  if (r.status === "cancelled") volver({ ok: "La reserva ya estaba cancelada." });

  const { error } = await sb
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", reservationId);
  if (error) volver({ error: error.message });

  volver({ ok: "Reserva cancelada. El lugar quedó liberado; los pagos quedan como historial." });
}
