import "server-only";

// EL PAGO Y EL LUGAR. Un cobro del espacio del grupo trae en su metadata qué
// lugar propio aparta (`lugar_id`) y a quiénes cubre (`cubre_lugares`). Aquí se
// ligan a la reserva que acaba de nacer y las tarjetas del CRM de los cubiertos
// caen en Pagado, igual que la del que pagó (tarjetaPagada sólo conoce al
// pagador). Best-effort: lo llama el webhook y un fallo aquí jamás tumba un pago.

import { tarjetaPagada } from "@/lib/comunidad/automatico";

type Sb = Parameters<typeof tarjetaPagada>[0];

export async function lugaresPagados(
  sb: Sb,
  i: { lugarId: string | null; cubre: string[]; reservationId: string; experienceId: string; slotId: string | null },
): Promise<void> {
  if (!i.lugarId && !i.cubre.length) return;
  try {
    const ahora = new Date().toISOString();
    if (i.lugarId) {
      await sb
        .from("grupo_lugares")
        .update({ reservation_id: i.reservationId, pagado_por: null, updated_at: ahora })
        .eq("id", i.lugarId);
    }
    if (i.cubre.length) {
      await sb
        .from("grupo_lugares")
        .update({ reservation_id: i.reservationId, pagado_por: i.lugarId, updated_at: ahora })
        .in("id", i.cubre)
        .is("reservation_id", null);
      const { data: cubiertos } = await sb.from("grupo_lugares").select("contact_id").in("id", i.cubre);
      for (const c of (cubiertos ?? []) as { contact_id: string }[]) {
        await tarjetaPagada(sb, {
          contactId: c.contact_id,
          experienceId: i.experienceId,
          reservationId: i.reservationId,
          slotId: i.slotId,
        });
      }
    }
  } catch (e) {
    console.error("lugaresPagados:", e);
  }
}
