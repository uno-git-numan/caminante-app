"use server";

import { puedeEditarSlug } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// LECTURA de las salidas de una experiencia para el panel.
//
// Aquí vivía `saveExperienceSlots`, el alta/edición de fechas DESDE EL
// FORMULARIO de la experiencia. Se eliminó el 26 ago 2026 junto con su sección:
// la experiencia es la PLANTILLA atemporal y la salida es la instancia que se
// vende, así que las fechas se dan de alta como salidas (`crearSalida` en
// lib/admin/eventos-actions.ts) y no como renglones de un formulario.
//
// Aquella función cerraba «lo que no venga en la lista», y esa regla se vuelve
// destructiva en cuanto existe una segunda puerta de alta: una salida creada
// fuera del formulario moría en silencio al siguiente guardado de la
// experiencia. Se quitó la puerta y con ella el candado. No se deja el código
// muerto «por si acaso» — dos caminos para lo mismo terminan divergiendo.

export type AdminSlot = {
  id: string;
  label: string;
  startsAt: string;
  endsAt: string | null;
  capacity: number | null;
  priceMxn: number | null;
  status: string;
  visibility: string; // 'public' | 'private' (privada = grupo con link cerrado)
  // AQUI ESTABA `seatsTaken` Y NO LO LEIA NADIE. Salia de la columna
  // `seats` + `_taken`, que llevaba meses desfasada —6 de 14 salidas
  // equivocadas el 23 sep 2026— porque solo la movia el registro y no la venta
  // self-serve. Cuantos van se cuenta desde `reservations`
  // (`fetchSlotAvailability`), que es lo que ve el viajero. Devolver el otro
  // numero era ofrecer la mentira a quien se le ocurriera usarla. Ver la 0065.
};

async function experienceIdBySlug(
  sb: ReturnType<typeof createSupabaseAdminClient>,
  slug: string,
): Promise<string | null> {
  const { data } = await sb.from("experiences").select("id").eq("slug", slug).maybeSingle();
  return (data?.id as string) ?? null;
}

// Salidas existentes de una experiencia (para precargar la sección "Fechas & cupo").
export async function fetchSlotsForAdmin(slug: string): Promise<AdminSlot[]> {
  // La casa, o el operador dueño de ESA experiencia.
  if (!(await puedeEditarSlug(slug))) return [];
  const sb = createSupabaseAdminClient();
  const expId = await experienceIdBySlug(sb, slug);
  if (!expId) return [];
  const { data } = await sb
    .from("experience_slots")
    .select("id, label, starts_at, ends_at, capacity_total, price_mxn, status, visibility")
    .eq("experience_id", expId)
    .order("starts_at", { ascending: true });
  return (data ?? []).map((s) => {
    const r = s as Record<string, unknown>;
    return {
      id: r.id as string,
      label: (r.label as string) ?? "",
      startsAt: (r.starts_at as string) ?? "",
      endsAt: (r.ends_at as string) ?? null,
      capacity: (r.capacity_total as number) ?? null,
      priceMxn: (r.price_mxn as number) ?? null,
      status: (r.status as string) ?? "open",
      visibility: (r.visibility as string) ?? "public",
    };
  });
}
