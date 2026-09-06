"use server";

// LA PRUEBA QUE NO PUEDE TOCAR A UNA CLIENTA.
//
// ⚠️ ESTO EXISTE POR UN ERROR CONCRETO, NO POR PRUDENCIA ABSTRACTA. El 5 sep,
// probando el envío de la encuesta, se apretó «Reenviar» en el renglón
// equivocado del panel y una clienta real recibió DOS correos duplicados. La
// única forma de probar el correo era dispararle a alguien de verdad: el
// sistema no ofrecía otra, así que el accidente estaba disponible.
//
// La regla que queda: **para probar, nunca se usa la fila de un cliente.** Esta
// acción manda SIEMPRE al correo de quien tiene la sesión abierta, sobre una
// fila propia que se crea y se borra en el acto. No hay parámetro de
// destinatario — no se puede equivocar de persona porque no se puede elegir.

import { alcanceActual } from "@/lib/auth/alcance";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { findOrCreateContact } from "@/lib/crm/contacts";
import { resendSurveyEmail } from "./send";

export async function mandarmeUnaPrueba(
  experienceId: string,
): Promise<{ ok: true; a: string } | { ok: false; error: string }> {
  if (!(await alcanceActual())) return { ok: false, error: "No autorizado." };

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const correo = data.user?.email;
  if (!correo) return { ok: false, error: "Tu sesión no trae correo." };

  const sb = createSupabaseAdminClient();
  const { data: exp } = await sb
    .from("experiences")
    .select("id, data")
    .eq("id", experienceId)
    .maybeSingle();
  if (!exp) return { ok: false, error: "No se encontró la experiencia." };
  const fb = (exp.data as { feedback?: { locationLabel?: string; version?: string } } | null)?.feedback;

  // Contacto propio, por el MISMO helper que usa el registro y la encuesta
  // abierta. Un `upsert` por correo no funciona —`contacts.email` no tiene
  // índice único, y esa es la razón de que exista esta cascada— y además abriría
  // un segundo criterio de identidad en el CRM, que es justo lo que no se hace.
  const yo = await findOrCreateContact(sb, {
    email: correo,
    fullName: "Prueba interna",
    source: "prueba-interna",
  });
  if (!yo.ok) return { ok: false, error: `No se pudo preparar el contacto: ${yo.error}` };

  const { data: fila } = await sb
    .from("experience_feedback")
    .insert({
      contact_id: yo.contact.id as string,
      experience_id: exp.id as string,
      slot_id: null, // ⚠️ sin salida: NO cuenta en los números de ninguna cápsula
      status: "invited",
      source: "email",
      location_label: fb?.locationLabel ?? null,
      feedback_version: fb?.version || "v1",
    })
    .select("id")
    .single();
  if (!fila) return { ok: false, error: "No se pudo crear la prueba." };

  const ok = await resendSurveyEmail(fila.id as string);

  // Se borra pase lo que pase: una prueba no deja rastro en los pendientes. El
  // link del correo deja de servir, y está bien — lo que se prueba es que el
  // correo llega y cómo se ve.
  await sb.from("experience_feedback").delete().eq("id", fila.id);

  return ok
    ? { ok: true, a: correo }
    : { ok: false, error: "Resend no aceptó el correo. Revisa la llave o el dominio." };
}
