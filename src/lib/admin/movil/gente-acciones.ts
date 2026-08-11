"use server";

// Las acciones de GENTE que dispara el teléfono.
//
// ⚠️ Aquí NO vive lógica de escritura. Cada función llama al MISMO núcleo que
// usa el panel de escritorio (`reservas-actions`, `encuesta-actions`,
// `feedback/resend-actions`) y solo traduce su respuesta a lo que espera
// `ui.run`: `{ok, error}`.
//
// Por qué existe esta capa: las acciones del escritorio terminan en `redirect()`
// hacia su página con banner ?ok/?error. Eso es correcto para un `<form>`, pero
// llamadas desde la app del teléfono sacarían al usuario del panel móvil y lo
// dejarían en la vista de computadora. Por eso cada operación se partió en un
// núcleo que devuelve resultado y una acción de formulario que redirige — la
// escritura sigue siendo una sola.

import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { registrarPagoEnReserva, cancelarReserva } from "@/lib/admin/reservas-actions";
import { setTestimonio } from "@/lib/admin/encuesta-actions";
import {
  recordarDeslindeATodos,
  recordarDeslindeUno,
  reenviarEncuestaATodos,
  reenviarEncuestaDeExperiencia,
} from "@/lib/feedback/resend-actions";
import { fetchRosterMovil, type RosterMovil } from "@/lib/admin/movil/gente";

type Res = { ok: boolean; error?: string };

// Un envío que falla en silencio es peor que uno que no sale: si alguno no
// pudo, se dice y se dice a quién.
function deEnvio(r: { sent: number; fails: string[] }): Res {
  if (r.fails.length === 0) return { ok: true };
  return {
    ok: false,
    error:
      r.sent > 0
        ? `Salieron ${r.sent}; fallaron ${r.fails.length}: ${r.fails.slice(0, 4).join(", ")}`
        : `No salió: ${r.fails.slice(0, 4).join(", ")}`,
  };
}

/**
 * El roster se carga al abrirlo (depende del slotId, que el shell pasa como
 * parámetro de pantalla). Lleva datos médicos, así que re-verifica admin: el
 * gate del layout no cubre una server action invocada directo.
 */
export async function cargarRoster(slotId: string): Promise<RosterMovil | null> {
  if (!(await isCurrentUserAdmin())) return null;
  return fetchRosterMovil(slotId);
}

export async function registrarPago(input: {
  reservationId: string;
  monto: number;
  metodo: string;
  fecha?: string;
}): Promise<Res> {
  const r = await registrarPagoEnReserva(input);
  return { ok: r.ok, error: r.error };
}

export async function cancelarReservaMovil(reservationId: string): Promise<Res> {
  const r = await cancelarReserva(reservationId);
  return { ok: r.ok, error: r.error };
}

export async function decidirTestimonio(id: string, decision: "approved" | "rejected"): Promise<Res> {
  const r = await setTestimonio(id, decision);
  return { ok: r.ok, error: r.error };
}

export async function recordarFirma(reservationId: string): Promise<Res> {
  return deEnvio(await recordarDeslindeUno(reservationId));
}

export async function recordarFirmaATodos(): Promise<Res> {
  return deEnvio(await recordarDeslindeATodos());
}

export async function reenviarEncuestaExperiencia(experienceId: string): Promise<Res> {
  return deEnvio(await reenviarEncuestaDeExperiencia(experienceId));
}

export async function reenviarEncuestaPendientesTodas(): Promise<Res> {
  return deEnvio(await reenviarEncuestaATodos());
}
