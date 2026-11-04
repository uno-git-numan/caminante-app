import "server-only";

// LO QUE LA PÁGINA DE PAGO NECESITA SABER de una reserva, por su token.
// Lee con el service-role (la reserva no es pública: el token ES la llave).
// Nunca expone datos médicos ni el motivo del precio especial: eso es interno.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchOperatorContactoForExperience } from "@/lib/operators/public";
import { HOLDING_STATUSES } from "@/lib/experiences/availability";
import type { Experience } from "@/lib/experiences/types";

export type PagoVista = {
  token: string;
  reservationId: string;
  estado: "pendiente" | "pagada" | "cancelada" | "cerrada";
  slug: string;
  experiencia: string;
  imagen: string | null;
  deslindeActivo: boolean;
  salida: string | null;
  fechaLarga: string | null;
  pila: string | null;
  email: string | null;
  personas: number;
  montoMxn: number;
  listaMxn: number | null;
  contacto: { whatsapp: string | null; email: string | null };
};

const cdmx = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", ...o }).format(new Date(iso));

function fechaLargaDe(inicio: string, fin: string | null): string {
  const d1 = cdmx(inicio, { weekday: "long", day: "numeric", month: "long" });
  if (!fin || cdmx(fin, { day: "numeric", month: "numeric" }) === cdmx(inicio, { day: "numeric", month: "numeric" })) return d1;
  return `${cdmx(inicio, { weekday: "long", day: "numeric" })} al ${cdmx(fin, { weekday: "long", day: "numeric", month: "long" })}`;
}

export async function fetchPagoPorToken(token: string): Promise<PagoVista | null> {
  const sb = createSupabaseAdminClient();
  const { data: r } = await sb
    .from("reservations")
    .select("id, status, num_people, amount_due_mxn, total_amount_mxn, precio_lista_mxn, experience_id, slot_id, contact_id")
    .eq("pago_token", token)
    .maybeSingle();
  if (!r) return null;

  const [{ data: exp }, { data: slot }, { data: contacto }, { data: pagos }, operadora] = await Promise.all([
    sb.from("experiences").select("slug, data").eq("id", r.experience_id as string).maybeSingle(),
    r.slot_id
      ? sb.from("experience_slots").select("label, starts_at, ends_at, status").eq("id", r.slot_id as string).maybeSingle()
      : Promise.resolve({ data: null as { label: string | null; starts_at: string; ends_at: string | null; status: string } | null }),
    sb.from("contacts").select("full_name, email").eq("id", r.contact_id as string).maybeSingle(),
    sb.from("payments").select("amount_mxn, status").eq("reservation_id", r.id as string),
    fetchOperatorContactoForExperience(r.experience_id as string),
  ]);
  if (!exp) return null;
  const data = (exp.data ?? null) as Partial<Experience> | null;
  const monto = Number(r.amount_due_mxn ?? r.total_amount_mxn ?? 0);
  const pagado = ((pagos ?? []) as { amount_mxn: number | null; status: string }[])
    .filter((p) => p.status === "paid")
    .reduce((n, p) => n + Number(p.amount_mxn || 0), 0);

  let estado: PagoVista["estado"] = "pendiente";
  const status = String(r.status);
  if (status === "cancelled") estado = "cancelada";
  else if (status === "paid" || status === "completed" || (HOLDING_STATUSES as readonly string[]).includes(status) && pagado > 0 && pagado >= monto)
    estado = "pagada";
  else if (slot && slot.status !== "open") estado = "cerrada";

  const nombre = ((contacto?.full_name as string | null) ?? "").trim();
  return {
    token,
    reservationId: r.id as string,
    estado,
    slug: exp.slug as string,
    experiencia: data?.cardTitle || [data?.title, data?.titleAccent].filter(Boolean).join(" ").trim().replace(/[.\s]+$/, "") || (exp.slug as string),
    imagen: data?.heroImageUrl || null,
    deslindeActivo: !!data?.registration?.active,
    salida: (slot?.label as string | null) ?? null,
    fechaLarga: slot?.starts_at ? fechaLargaDe(slot.starts_at as string, (slot.ends_at as string | null) ?? null) : null,
    pila: nombre ? nombre.split(/\s+/)[0] : null,
    email: (contacto?.email as string | null) ?? null,
    personas: Math.max(1, Number(r.num_people) || 1),
    montoMxn: monto,
    listaMxn: r.precio_lista_mxn != null && Number(r.precio_lista_mxn) > monto ? Number(r.precio_lista_mxn) : null,
    contacto: {
      whatsapp: operadora?.whatsapp ?? "+525512020565",
      email: operadora?.email ?? "uno@numanhub.com",
    },
  };
}
