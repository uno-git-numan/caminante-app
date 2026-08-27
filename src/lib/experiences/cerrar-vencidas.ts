// Cierre automático de salidas cuya fecha ya pasó.
//
// Hasta hoy (11 ago 2026) nada cerraba una salida sola: quedaba `open` para
// siempre y el sitio la seguía ofreciendo. En la base había DOS salidas
// vencidas abiertas —hongos Jun 26-27 y Jul 26— y las dos consultas públicas
// (`fetchPublicAvailability` y `fetchOpenSlotsForTemplate`) filtran solo por
// `status='open'`, sin mirar la fecha. O sea: el 11 de agosto el sitio anunciaba
// como «próxima fecha» una de junio, y `createCheckout` la habría cobrado.
//
// Esto lo arregla en la FUENTE. Cerrada la salida, desaparece del sitio, del
// checkout, del picker del deslinde y del formulario de experiencia — sin tocar
// ninguno de ellos.
//
// Reglas que no son obvias:
//   · El corte es por `starts_at`, NO por `ends_at`. Una salida de Oct 8-11 no
//     se puede vender el 9 porque el grupo ya está en camino. Con `ends_at`
//     seguiría a la venta durante todo el viaje.
//   · Se cierra cuando el DÍA de salida ya pasó (en America/Mexico_City), no a
//     la hora exacta: una salida que arranca hoy a las 7am sigue vendible hoy.
//   · Solo toca `open`. `cancelled` y `closed` no se pisan, y cerrar NO borra:
//     el dashboard puede reabrir con «Reabrir» si hizo falta.
//   · Cerrar es seguro para la encuesta: `runSurveyDispatch` busca por `ends_at`
//     y por las reservas, nunca por el status de la salida. Verificado.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cdmxDay } from "@/lib/admin/formato";

export type CierreResult = {
  revisadas: number;
  cerradas: number;
  detalle: { id: string; label: string | null; startsAt: string | null }[];
};

export async function cerrarSalidasVencidas(now = new Date()): Promise<CierreResult> {
  const sb = createSupabaseAdminClient();
  const hoy = cdmxDay(now);

  const { data: slots } = await sb
    .from("experience_slots")
    .select("id, label, starts_at")
    .eq("status", "open")
    .not("starts_at", "is", null);

  const abiertas = (slots || []) as { id: string; label: string | null; starts_at: string | null }[];
  const vencidas = abiertas.filter((s) => s.starts_at && cdmxDay(s.starts_at) < hoy);

  const res: CierreResult = { revisadas: abiertas.length, cerradas: 0, detalle: [] };
  if (!vencidas.length) return res;

  // El `eq("status","open")` del update es la carrera: si alguien la reabrió o
  // canceló entre el select y el update, no se pisa su decisión.
  for (const s of vencidas) {
    const { error } = await sb
      .from("experience_slots")
      .update({ status: "closed" })
      .eq("id", s.id)
      .eq("status", "open");
    if (!error) {
      res.cerradas++;
      res.detalle.push({ id: s.id, label: s.label, startsAt: s.starts_at });
    }
  }
  return res;
}
