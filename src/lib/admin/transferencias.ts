"use server";

// Alta de una venta pagada por TRANSFERENCIA.
//
// Hasta hoy solo había tres puertas para que naciera una reserva: el checkout
// web (Stripe), `/admin/cobro` (link de pago) y el deslinde. Quien pagaba por
// transferencia simplemente **no existía** para la plataforma.
//
// Caso que lo destapó: Lorena Saravia transfirió $16,500 para Barrancas 8-oct
// el 29 de julio. Sin contacto, sin reserva, sin pago. La salida se veía en
// 4/12 cuando iba en 5/12, faltaban $16,500 de ingreso, y ella iba a viajar
// SIN DESLINDE FIRMADO. Es el caso Enyd otra vez, por otro camino.
//
// Esta acción hace lo mismo que hace el webhook cuando alguien paga con
// tarjeta, para que una venta por transferencia quede EXACTAMENTE igual de
// completa:
//   contacto (dedupe) → reserva pagada y atribuida → pago con method='transfer'
//   → correo de confirmación con el CTA del deslinde → aviso al admin.
//
// Diferencia contra Stripe, a propósito: **no se escribe comisión**. Una
// transferencia no la tiene, y ponerle 0 no es lo mismo que dejarla nula — el
// tablero de rentabilidad distingue "sin Stripe" de "Stripe en cero".

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { experienceTitle, formatFechaCorta } from "@/lib/admin/queries";
import { findOrCreateContact } from "@/lib/crm/contacts";
import { notifyConfirmacionCompra } from "@/lib/notifications/notify-customer";
import { notifyNuevaReserva } from "@/lib/notifications/notify-admin";
import type { Experience } from "@/lib/experiences/types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://caminante.numanhub.com";

export type TransferenciaInput = {
  slug: string;
  slotId: string;
  email: string;
  nombre: string;
  telefono?: string;
  personas: number;
  montoMxn: number;
  /** YYYY-MM-DD del movimiento bancario. */
  fecha: string;
  /** Referencia del banco — es la llave contra doble captura. */
  referencia?: string;
  /**
   * RUTA del comprobante dentro del bucket PRIVADO `comprobantes` (no una URL).
   * Se ve pidiendo una URL firmada a `/caminante/api/admin/comprobante`.
   */
  comprobantePath?: string;
  notas?: string;
};

export type ExperienciaConSalidas = {
  slug: string;
  nombre: string;
  salidas: { id: string; label: string; precio: number | null }[];
};

/**
 * Experiencias con sus salidas ABIERTAS, para el selector del formulario.
 *
 * Se teclea el slug a mano en `/admin/cobro` y ahí ha costado errores; aquí es
 * un desplegable porque una transferencia se captura con el estado de cuenta
 * enfrente y equivocarse de salida manda a alguien al viaje que no es.
 */
export async function fetchExperienciasConSalidas(): Promise<ExperienciaConSalidas[]> {
  if (!(await isCurrentUserAdmin())) return [];
  const sb = createSupabaseAdminClient();
  const [{ data: exps }, { data: slots }] = await Promise.all([
    sb.from("experiences").select("id, slug, data"),
    sb
      .from("experience_slots")
      .select("id, experience_id, label, starts_at, price_mxn, status")
      .eq("status", "open"),
  ]);

  return ((exps || []) as { id: string; slug: string; data: Partial<Experience> | null }[])
    .map((e) => ({
      slug: e.slug,
      nombre: experienceTitle(e.data, e.slug),
      salidas: ((slots || []) as {
        id: string;
        experience_id: string;
        label: string | null;
        starts_at: string | null;
        price_mxn: number | null;
      }[])
        .filter((s) => s.experience_id === e.id)
        .sort((a, b) => (a.starts_at || "").localeCompare(b.starts_at || ""))
        .map((s) => ({
          id: s.id,
          label: s.label || formatFechaCorta(s.starts_at),
          precio: s.price_mxn,
        })),
    }))
    .filter((e) => e.salidas.length)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export type TransferenciaResult =
  | { ok: true; reservationId: string; deslindeUrl: string | null; correoEnviado: boolean }
  | { ok: false; error: string };

export async function registrarTransferencia(input: TransferenciaInput): Promise<TransferenciaResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "No autorizado." };

  const email = (input.email || "").trim().toLowerCase();
  if (!email.includes("@")) return { ok: false, error: "Escribe un correo válido." };
  const personas = Math.max(1, Math.floor(input.personas || 1));
  const monto = Number(input.montoMxn);
  if (!(monto > 0)) return { ok: false, error: "El monto tiene que ser mayor a cero." };

  const sb = createSupabaseAdminClient();

  const { data: exp } = await sb
    .from("experiences")
    .select("id, slug, data, operator_id")
    .eq("slug", input.slug)
    .maybeSingle();
  if (!exp) return { ok: false, error: "No encuentro esa experiencia." };

  const { data: slot } = await sb
    .from("experience_slots")
    .select("id, label, starts_at, experience_id")
    .eq("id", input.slotId)
    .eq("experience_id", exp.id)
    .maybeSingle();
  if (!slot) return { ok: false, error: "Esa salida no es de esta experiencia." };

  // La referencia del banco es la defensa contra capturar dos veces el mismo
  // movimiento — el error más fácil de cometer conciliando a mano.
  const referencia = (input.referencia || "").trim() || null;
  if (referencia) {
    const { data: ya } = await sb
      .from("payments")
      .select("id, reservation_id")
      .eq("referencia", referencia)
      .maybeSingle();
    if (ya) return { ok: false, error: `Esa referencia (${referencia}) ya está registrada.` };
  }

  const contactRes = await findOrCreateContact(sb, {
    email,
    fullName: input.nombre,
    phone: input.telefono,
    source: `transferencia · ${input.slug}`,
  });
  if (!contactRes.ok) return { ok: false, error: contactRes.error };
  const contact = contactRes.contact;

  // Reserva PAGADA y atribuida al operador de la experiencia, igual que hace
  // finalize-selfserve con una compra web.
  const { data: reserva, error: resvErr } = await sb
    .from("reservations")
    .insert({
      experience_id: exp.id,
      slot_id: slot.id,
      contact_id: contact.id,
      num_people: personas,
      total_amount_mxn: monto,
      status: "paid",
      // `channel` = por dónde entró la venta, y su CHECK (0007) solo admite
      // web/whatsapp/email/admin. "admin" es la verdad: la capturó una persona
      // en el panel. Que fue transferencia lo dice `payments.method='transfer'`,
      // que es donde vive la forma de pago. No se inventa un canal nuevo.
      channel: "admin",
      operator_id: exp.operator_id ?? null,
      notes: input.notas || null,
    })
    .select("id")
    .single();
  if (resvErr) return { ok: false, error: resvErr.message };

  const paidAt = `${input.fecha || new Date().toISOString().slice(0, 10)}T18:00:00.000Z`;
  const { error: payErr } = await sb.from("payments").insert({
    reservation_id: reserva.id,
    contact_id: contact.id,
    amount_mxn: monto,
    status: "paid",
    method: "transfer",
    paid_at: paidAt,
    referencia,
    // Guardamos la RUTA del objeto en el bucket privado, no una URL: una URL
    // pública de un comprobante bancario sería una fuga permanente.
    comprobante_url: input.comprobantePath || null,
    // stripe_fee_mxn se queda NULL a propósito: una transferencia no tuvo
    // comisión, y NULL ("no aplica") no es lo mismo que 0 ("fue gratis").
  });
  if (payErr) {
    // La reserva ya existe pero sin pago: mejor decirlo que dejar un fantasma.
    return { ok: false, error: `Reserva creada pero el pago falló: ${payErr.message}` };
  }

  // El deslinde es la razón de ser de todo esto. Regla de la casa: nunca un
  // evento sin deslinde.
  const data = exp.data as Partial<Experience> | null;
  const deslindeUrl = data?.registration?.active
    ? `${SITE}/caminante/registro/${exp.slug}?reserva=${reserva.id}`
    : null;

  const nombreExp =
    (data?.page?.blocks?.[0] as { title?: string } | undefined)?.title || exp.slug;

  const correoEnviado = await notifyConfirmacionCompra({
    email,
    nombre: input.nombre || contact.full_name || "",
    experiencia: nombreExp,
    salida: slot.label || "",
    personas,
    montoMxn: monto,
    deslindeUrl,
  }).catch(() => false);

  await notifyNuevaReserva({
    cliente: input.nombre || email,
    experiencia: nombreExp,
    salida: slot.label || "",
    personas,
    montoMxn: monto,
    metodo: "Transferencia (capturada en el panel)",
    canal: "transferencia",
  }).catch(() => undefined);

  revalidatePath("/caminante/admin/reservas");
  revalidatePath("/caminante/admin/dinero");
  revalidatePath("/caminante/admin/rentabilidad");
  revalidatePath(`/caminante/admin/roster/${slot.id}`);

  return { ok: true, reservationId: reserva.id, deslindeUrl, correoEnviado };
}
