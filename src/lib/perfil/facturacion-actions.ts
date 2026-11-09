"use server";

// Mi espacio → facturación: guardar la ficha fiscal y «Facturar» un pago.
// Mismo patrón que lib/perfil/actions.ts: redirect con ?ok / ?error.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchDatosFiscales, guardarDatosFiscales } from "@/lib/facturacion/datos-fiscales";
import { emitirCFDIDePago } from "@/lib/facturacion/emitir";

const VOLVER = "/caminante/perfil";
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function volver(ok: string | null, error?: string): never {
  revalidatePath(VOLVER);
  redirect(`${VOLVER}?${ok ? `ok=${ok}` : `error=${encodeURIComponent(error || "No se pudo guardar.")}`}#facturas`);
}

async function contactoDe(userId: string): Promise<string | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("contacts").select("id").eq("user_id", userId).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export async function guardarDatosFiscalesAction(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/caminante/login?next=%2Fcaminante%2Fperfil");
  const r = await guardarDatosFiscales(user.id, await contactoDe(user.id), {
    rfc: s(fd, "rfc"),
    razonSocial: s(fd, "razonSocial"),
    regimenFiscal: s(fd, "regimen"),
    usoCfdi: s(fd, "uso"),
    codigoPostal: s(fd, "cp"),
    email: s(fd, "email") || user.email || "",
  });
  if (!r.ok) volver(null, r.error);
  volver("fiscal");
}

/** «Facturar» un pago propio con la ficha guardada. */
export async function facturarPagoAction(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/caminante/login?next=%2Fcaminante%2Fperfil");
  const paymentId = s(fd, "paymentId");
  if (!/^[0-9a-f-]{36}$/i.test(paymentId)) volver(null, "Pago inválido.");

  const ficha = await fetchDatosFiscales(user.id);
  if (!ficha) volver(null, "Primero guarda tus datos fiscales (en Tu expediente).");

  // El pago tiene que ser de esta persona: su reserva o su contacto.
  const sb = createSupabaseAdminClient();
  const contactId = await contactoDe(user.id);
  if (!contactId) volver(null, "No encontramos tu ficha de cliente.");
  const { data: pay } = await sb.from("payments").select("id, contact_id, reservation_id").eq("id", paymentId).maybeSingle();
  if (!pay) volver(null, "No encontramos ese pago.");
  let mio = pay.contact_id === contactId;
  if (!mio && pay.reservation_id) {
    const { data: resv } = await sb.from("reservations").select("contact_id").eq("id", pay.reservation_id as string).maybeSingle();
    mio = resv?.contact_id === contactId;
  }
  if (!mio) volver(null, "Ese pago no es tuyo.");

  const r = await emitirCFDIDePago({ paymentId, receptor: ficha });
  if (!r.ok) volver(null, r.error);
  volver("factura");
}
