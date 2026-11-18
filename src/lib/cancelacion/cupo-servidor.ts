import "server-only";

// LA CLÁUSULA DE CUPO MÍNIMO, DEL LADO DEL SERVIDOR (D26 de legal, §7.5 y §7.6).
//
// Aquí vive lo que toca la base y manda correos; las reglas (cuándo está
// activa, el piso de fechas, el candado) son puras y están en cupo-minimo.ts.
//
//   · LUGARES PAGADOS: los de reservas con un pago confirmado. Un lugar
//     apartado sin pago no cuenta.
//   · CONFIRMAR: la confirma una persona (casa u operadora) o se confirma sola
//     al llegar la fecha con el mínimo cubierto. Se avisa a todo el grupo. Una
//     salida confirmada ya no se cancela por cupo.
//   · EL DÍA LÍMITE OBLIGA A DECIDIR: esa mañana se le avisa a la casa; si el
//     día termina sin confirmar ni cancelar, la salida queda confirmada sola.
//     Al cliente se le prometió una respuesta ese día.
//   · AVISO DE CANCELACIÓN POR CUPO: sale al cancelar, a todas las reservas
//     con pago, sin esperar al procesador. La hora queda en la salida: es la
//     prueba de que se avisó en plazo. La confirmación de cada devolución
//     sigue su correo de siempre.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { experienceTitle } from "@/lib/admin/queries";
import { clausulaDeReserva, clausulaDeSalida, pisoDeConfirmacion, type SalidaParaClausula } from "@/lib/cancelacion/cupo-minimo";
import { fechaConAnio, ymdCdmx, type ClausulaMinimo } from "@/lib/cancelacion/politica";
import { sendViaResend } from "@/lib/email/resend";
import { h1, marco, p, saludo } from "@/lib/email/plantilla";
import { notifyConfirmacionPorVencer } from "@/lib/notifications/notify-admin";
import type { Experience } from "@/lib/experiences/types";

/** Los estados de una reserva con pago confirmado (anticipo incluido). */
export const ESTADOS_PAGADOS = ["partially_paid", "paid", "completed"] as const;

export const COLS_CLAUSULA = "id, experience_id, label, starts_at, ends_at, status, minimo, confirmacion_limite, confirmada_at";

export type FilaDeSalida = {
  id: string;
  experience_id: string;
  label: string | null;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  minimo: number | null;
  confirmacion_limite: string | null;
  confirmada_at: string | null;
};

export const paraClausula = (s: FilaDeSalida): SalidaParaClausula => ({
  minimo: s.minimo,
  confirmacionLimite: s.confirmacion_limite,
  startsAt: s.starts_at,
  endsAt: s.ends_at,
  confirmadaAt: s.confirmada_at,
  status: s.status,
});

/**
 * La cláusula ACTIVA de cada salida pedida (las que no la tienen no vienen en
 * el mapa). Es la puerta por la que el sitio público y el cobro la leen.
 *
 * ⚠️ Consulta aparte y tolerante, a propósito: si las columnas no existen (el
 * código salió antes que la 0093) el resultado es «ninguna tiene cláusula» y
 * la venta sigue igual que antes, en vez de tumbar reservar y el cobro.
 */
export async function clausulasActivas(sb: SupabaseClient, slotIds: string[], ahora: Date = new Date()): Promise<Map<string, ClausulaMinimo>> {
  const out = new Map<string, ClausulaMinimo>();
  if (!slotIds.length) return out;
  const { data, error } = await sb.from("experience_slots").select(COLS_CLAUSULA).in("id", slotIds);
  if (error) return out;
  for (const s of (data ?? []) as FilaDeSalida[]) {
    const e = clausulaDeSalida(paraClausula(s), ahora);
    if (e.activa) out.set(s.id, e.clausula);
  }
  return out;
}

type ReservaPagada = { id: string; contact_id: string; num_people: number | null; clausula_minimo: number | null; clausula_limite: string | null };

async function reservasPagadas(sb: SupabaseClient, slotId: string): Promise<ReservaPagada[]> {
  const { data } = await sb
    .from("reservations")
    .select("id, contact_id, num_people, clausula_minimo, clausula_limite")
    .eq("slot_id", slotId)
    .in("status", [...ESTADOS_PAGADOS]);
  return (data ?? []) as ReservaPagada[];
}

/** Cuántos lugares pagados tiene la salida. */
export async function lugaresPagados(sb: SupabaseClient, slotId: string): Promise<number> {
  return (await reservasPagadas(sb, slotId)).reduce((n, r) => n + (Number(r.num_people) || 1), 0);
}

/** Las copias de la cláusula que guardaron las reservas pagadas de la salida (para el candado de §7.4). */
export async function copiasDeClausula(sb: SupabaseClient, slotId: string): Promise<ClausulaMinimo[]> {
  return (await reservasPagadas(sb, slotId)).map(clausulaDeReserva).filter((c): c is ClausulaMinimo => c !== null);
}

async function tituloDe(sb: SupabaseClient, experienceId: string): Promise<string> {
  const { data: exp } = await sb.from("experiences").select("slug, data").eq("id", experienceId).maybeSingle();
  return experienceTitle((exp?.data ?? null) as Partial<Experience> | null, (exp?.slug as string) ?? "");
}

async function correosDe(sb: SupabaseClient, reservas: ReservaPagada[]): Promise<{ reservationId: string; email: string; nombre: string | null }[]> {
  const ids = [...new Set(reservas.map((r) => r.contact_id))];
  if (!ids.length) return [];
  const { data } = await sb.from("contacts").select("id, email, full_name").in("id", ids);
  const porId = new Map(((data ?? []) as { id: string; email: string | null; full_name: string | null }[]).map((c) => [c.id, c]));
  return reservas
    .map((r) => ({ reservationId: r.id, email: (porId.get(r.contact_id)?.email ?? "").trim(), nombre: porId.get(r.contact_id)?.full_name ?? null }))
    .filter((x) => x.email);
}

/**
 * Confirma que la salida sale y avisa al grupo. `quien` = la persona que
 * confirma; null = se confirmó sola al llegar la fecha con el mínimo cubierto.
 * Idempotente: una salida ya confirmada no se vuelve a avisar.
 */
export async function confirmarSalida(
  sb: SupabaseClient,
  slotId: string,
  quien: string | null,
): Promise<{ ok: true; ya: boolean; avisados: number } | { ok: false; error: string }> {
  const { data } = await sb.from("experience_slots").select(COLS_CLAUSULA).eq("id", slotId).maybeSingle();
  const slot = data as FilaDeSalida | null;
  if (!slot) return { ok: false, error: "Esa salida no existe." };
  if (slot.status === "cancelled") return { ok: false, error: "Esa salida está cancelada." };
  if (slot.confirmada_at) return { ok: true, ya: true, avisados: 0 };

  // `is null` en el filtro: si dos corridas llegan a la vez, sólo una confirma y avisa.
  const { data: hecha, error } = await sb
    .from("experience_slots")
    .update({ confirmada_at: new Date().toISOString(), confirmada_por: quien })
    .eq("id", slotId)
    .is("confirmada_at", null)
    .select("id");
  if (error) return { ok: false, error: `No se pudo confirmar: ${error.message}` };
  if (!hecha?.length) return { ok: true, ya: true, avisados: 0 };

  const titulo = await tituloDe(sb, slot.experience_id);
  const viaje = `${titulo}${slot.label ? ` · ${slot.label}` : ""}`;
  let avisados = 0;
  for (const c of await correosDe(sb, await reservasPagadas(sb, slotId))) {
    const { html, texto } = marco("Tu salida está confirmada", [
      h1("Tu salida está confirmada"),
      p(`Hola${saludo(c.nombre)}. <b>${viaje}</b> ya juntó su grupo: la salida se hace.`),
      p("Desde ahora ya puedes comprar con tranquilidad tus vuelos o tu transporte. Unos días antes te mandamos los detalles del punto de encuentro."),
    ]);
    if (await sendViaResend(c.email, `Tu salida está confirmada · ${titulo}`, html, { ua: "caminante-confirmacion/1.0", text: texto })) avisados += 1;
  }
  return { ok: true, ya: false, avisados };
}

/**
 * El aviso de cancelación por cupo mínimo, con el texto de legal (§7.6). Sale
 * AL CANCELAR, a todas las reservas con pago, sin esperar al procesador: lo
 * que cuenta para el plazo es la hora del aviso. No promete una devolución ya
 * hecha («hoy mismo pedimos la devolución… y te avisamos en cuanto quede
 * hecha»); la confirmación de cada devolución sigue su correo de siempre.
 *
 * A quien NO trae la cláusula (reservó antes de que existiera) no se le dice
 * «como te lo dijimos antes de pagar», porque no es cierto: su aviso lleva el
 * mismo texto sin esa frase, y su bonificación se le anuncia en el correo de
 * la devolución.
 */
export async function avisarCancelacionPorCupo(
  sb: SupabaseClient,
  slot: FilaDeSalida,
  i: { clausula: ClausulaMinimo; pagados: number },
): Promise<{ avisados: number; sinCorreo: number }> {
  const pagadas = await reservasPagadas(sb, slot.id);
  const traeClausula = new Set(pagadas.filter((r) => clausulaDeReserva(r) !== null).map((r) => r.id));
  const titulo = await tituloDe(sb, slot.experience_id);
  const viaje = `${titulo}${slot.label ? ` · ${slot.label}` : ""}`;
  const destinos = await correosDe(sb, pagadas);
  let avisados = 0;
  for (const c of destinos) {
    const { html, texto } = marco("Tu salida no se juntó", [
      h1("Tu salida no se juntó"),
      p(
        `Hola${saludo(c.nombre)}. Para <b>${viaje}</b> hacían falta ${i.clausula.minimo} personas y al ${fechaConAnio(i.clausula.limite)} éramos ${i.pagados}. ${traeClausula.has(c.reservationId) ? "Como te lo dijimos antes de pagar, la" : "La"} salida se cancela.`,
      ),
      p("Hoy mismo pedimos la devolución del <b>100 %</b> de lo que pagaste, a la misma forma de pago, y te avisamos en cuanto quede hecha. Si quieres, te ayudamos a pasarte a otra fecha."),
    ]);
    if (await sendViaResend(c.email, `Tu salida no se juntó · ${titulo}`, html, { ua: "caminante-cupo-minimo/1.0", text: texto })) avisados += 1;
  }
  return { avisados, sinCorreo: pagadas.length - avisados };
}

/**
 * Lo que corre el cron cada hora (§7.5):
 *   · Llegó la fecha de confirmación con el mínimo cubierto → la salida se
 *     confirma sola y se avisa al grupo.
 *   · TERMINÓ el día de la fecha sin confirmar ni cancelar → la salida queda
 *     confirmada y se avisa al grupo, aunque no se haya juntado el mínimo: al
 *     cliente se le prometió una respuesta ese día, y desde entonces cancelar
 *     ya es atribuible a quien opera.
 *   · Sin el mínimo, se le avisa a la casa la víspera y otra vez la mañana del
 *     día límite, para que confirme o cancele en plazo.
 */
export async function revisarConfirmaciones(ahora: Date = new Date()): Promise<{ confirmadas: number; avisos: number; errores: string[] }> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("experience_slots")
    .select(`${COLS_CLAUSULA}, aviso_confirmacion_at`)
    .not("minimo", "is", null)
    .not("confirmacion_limite", "is", null)
    .is("confirmada_at", null)
    .neq("status", "cancelled")
    .gte("starts_at", ahora.toISOString());
  // Antes de la 0093 la columna no existe: no hay nada que revisar.
  if (error) return { confirmadas: 0, avisos: 0, errores: [] };

  const hoy = ymdCdmx(ahora);
  const manana = ymdCdmx(new Date(ahora.getTime() + 86_400_000));
  let confirmadas = 0;
  let avisos = 0;
  const errores: string[] = [];
  for (const s of (data ?? []) as (FilaDeSalida & { aviso_confirmacion_at: string | null })[]) {
    try {
      const limite = String(s.confirmacion_limite).slice(0, 10);
      const pagados = await lugaresPagados(sb, s.id);
      const seJunto = pagados >= (s.minimo as number);
      // ¿La cláusula se le enseñó a alguien? Sólo si la fecha respeta el piso y
      // el mínimo es de dos o más. Si no, a nadie se le prometió una respuesta
      // ese día: el sistema no confirma por su cuenta ni apura a la casa.
      const prometida = (s.minimo as number) >= 2 && !!s.starts_at && limite <= pisoDeConfirmacion(s.starts_at, s.ends_at).ultimoDia;
      // Con el mínimo cubierto, desde el día límite; sin él, cuando ese día ya terminó.
      if ((seJunto && hoy >= limite) || (prometida && hoy > limite)) {
        const r = await confirmarSalida(sb, s.id, null);
        if (r.ok && !r.ya) confirmadas += 1;
        else if (!r.ok) errores.push(`${s.id.slice(0, 8)}: ${r.error}`);
        continue;
      }
      if (seJunto || !prometida) continue;
      // La víspera (una vez) y la mañana del día límite (aunque ya se haya avisado la víspera).
      const avisado = s.aviso_confirmacion_at ? ymdCdmx(s.aviso_confirmacion_at) : null;
      const toca = (limite === manana && !avisado) || (limite === hoy && (!avisado || avisado < hoy));
      if (toca) {
        await notifyConfirmacionPorVencer({
          experiencia: await tituloDe(sb, s.experience_id),
          salida: s.label ?? "",
          minimo: s.minimo as number,
          pagados,
          limite,
          esHoy: limite === hoy,
        });
        await sb.from("experience_slots").update({ aviso_confirmacion_at: ahora.toISOString() }).eq("id", s.id);
        avisos += 1;
      }
    } catch (e) {
      errores.push(`${s.id.slice(0, 8)}: ${(e as Error).message}`);
    }
  }
  return { confirmadas, avisos, errores };
}
