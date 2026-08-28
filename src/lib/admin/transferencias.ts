"use server";

// Alta de una venta pagada FUERA de Stripe: transferencia o efectivo.
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
// tarjeta, para que la venta quede EXACTAMENTE igual de completa:
//   contacto (dedupe) → reserva pagada y atribuida → pago → **link del
//   deslinde** para mandarle → correo si tenemos su correo → aviso al admin.
//
// El link es el corazón del flujo (encargo de Luis, 11 ago): el admin captura
// el pago con lo poco que sabe —nombre, lugares, comprobante— y le manda a la
// persona un enlace donde ELLA se da de alta y sigue el proceso como cualquier
// otro cliente. Por eso el correo NO es obligatorio: basta el WhatsApp.
//
// Diferencia contra Stripe, a propósito: **no se escribe comisión**. Una
// transferencia no la tiene, y ponerle 0 no es lo mismo que dejarla nula — el
// tablero de rentabilidad distingue "sin Stripe" de "Stripe en cero".

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { experienceTitle } from "@/lib/admin/queries";
import { formatFechaCorta } from "@/lib/admin/formato";
import { findOrCreateContact, findOrCreateContactByPhone } from "@/lib/crm/contacts";
import { notifyConfirmacionCompra } from "@/lib/notifications/notify-customer";
import { notifyNuevaReserva } from "@/lib/notifications/notify-admin";
import type { Experience } from "@/lib/experiences/types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://caminante.numanhub.com";

export type MetodoManual = "transfer" | "cash";

export type TransferenciaInput = {
  slug: string;
  slotId: string;
  metodo: MetodoManual;
  nombre: string;
  /** Opcional: si no lo tenemos, el link se manda por WhatsApp. */
  email?: string;
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
  | {
      ok: true;
      reservationId: string;
      /** El enlace donde la persona se da de alta y firma. Es lo que se le manda. */
      deslindeUrl: string | null;
      /** Mensaje listo para pegar en WhatsApp. */
      mensaje: string;
      correoEnviado: boolean;
    }
  | { ok: false; error: string };

export async function registrarPagoManual(input: TransferenciaInput): Promise<TransferenciaResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "No autorizado." };

  const nombre = (input.nombre || "").trim();
  if (!nombre) return { ok: false, error: "Escribe el nombre de quien pagó." };
  const email = (input.email || "").trim().toLowerCase();
  const telefono = (input.telefono || "").trim();
  if (email && !email.includes("@")) return { ok: false, error: "Ese correo no se ve válido." };
  // Hace falta UN canal: sin correo ni WhatsApp no hay a dónde mandarle el link,
  // y sin link la persona no se puede dar de alta ni firmar.
  if (!email && !telefono) {
    return { ok: false, error: "Pon su correo o su WhatsApp: es por donde le llega el enlace." };
  }
  const metodo: MetodoManual = input.metodo === "cash" ? "cash" : "transfer";
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

  // Con correo, dedupe en cascada (user → correo → teléfono). Sin correo, por
  // teléfono: `contacts.email` es nullable desde la 0015 justo para esto, y así
  // el contacto que ELLA complete al firmar se funde con este, no lo duplica.
  const fuente = `${metodo === "cash" ? "efectivo" : "transferencia"} · ${input.slug}`;
  const contactRes = email
    ? await findOrCreateContact(sb, { email, fullName: nombre, phone: telefono, source: fuente })
    : await findOrCreateContactByPhone(sb, { waPhone: telefono, fullName: nombre, source: fuente });
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
    method: metodo,
    paid_at: paidAt,
    referencia,
    // Guardamos la RUTA del objeto en el bucket privado, no una URL: una URL
    // pública de un comprobante bancario sería una fuga permanente.
    comprobante_url: input.comprobantePath || null,
    // stripe_fee_mxn se queda NULL a propósito: ni la transferencia ni el
    // efectivo tuvieron comisión, y NULL ("no aplica") no es lo mismo que 0
    // ("fue gratis").
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

  const metodoTxt = metodo === "cash" ? "Efectivo" : "Transferencia";

  // El correo solo sale si tenemos correo. Si no, el link va por WhatsApp — y
  // por eso el mensaje se devuelve armado, para copiar y pegar.
  const correoEnviado = email
    ? await notifyConfirmacionCompra({
        email,
        nombre: nombre || contact.full_name || "",
        experiencia: nombreExp,
        salida: slot.label || "",
        personas,
        montoMxn: monto,
        deslindeUrl,
      }).catch(() => false)
    : false;

  await notifyNuevaReserva({
    cliente: nombre || email || telefono,
    experiencia: nombreExp,
    salida: slot.label || "",
    personas,
    montoMxn: monto,
    metodo: `${metodoTxt} (capturada en el panel)`,
    canal: metodo === "cash" ? "efectivo" : "transferencia",
  }).catch(() => undefined);

  const money = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
  const primerNombre = nombre.split(/\s+/)[0] || "";
  const mensaje = deslindeUrl
    ? `Hola${primerNombre ? " " + primerNombre : ""}, ya quedó registrado tu pago de ${money(monto)} ` +
      `para ${nombreExp}${slot.label ? ` · ${slot.label}` : ""} (${personas} ${personas === 1 ? "lugar" : "lugares"}).\n\n` +
      `Solo falta que completes tu registro y firmes el deslinde aquí:\n${deslindeUrl}\n\n` +
      `Ahí capturas tus datos y los de quien te acompañe. Cualquier duda, aquí estoy.`
    : `Hola${primerNombre ? " " + primerNombre : ""}, ya quedó registrado tu pago de ${money(monto)} ` +
      `para ${nombreExp}${slot.label ? ` · ${slot.label}` : ""} (${personas} ${personas === 1 ? "lugar" : "lugares"}).`;

  revalidatePath("/caminante/admin/pagos");
  revalidatePath("/caminante/admin/dinero");
  revalidatePath("/caminante/admin/rentabilidad");
  revalidatePath(`/caminante/admin/roster/${slot.id}`);

  return { ok: true, reservationId: reserva.id, deslindeUrl, mensaje, correoEnviado };
}
