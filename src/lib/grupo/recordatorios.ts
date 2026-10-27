import "server-only";

// LOS AVISOS DIARIOS DEL ESPACIO DEL GRUPO (cron recordatorio-grupo, 9am CDMX).
//
//   · «Faltan 3 días»: a quien entró y no ha apartado, cuando la fecha límite
//     está a DIAS_RECORDATORIO. Una sola vez (grupo_lugares.recordatorio_at).
//   · «Se abrió un lugar»: con cupo libre, al primero de la lista de espera que
//     no haya sido avisado (avisado_lugar_at). Uno por salida por día: si no
//     aparta, mañana le toca al siguiente.
//   · «No se juntó el mínimo»: a la operadora, el día después de la fecha
//     límite, si los apartados no llegan al mínimo. Una vez (aviso_minimo_at).
//
// Todo best-effort y por salida: un fallo en una no detiene las demás.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cdmxDay } from "@/lib/admin/formato";
import { fetchEspacio } from "@/lib/grupo/espacio";
import { avisarLugarLibre, avisarMinimoNoAlcanzado, recordarLugar } from "@/lib/grupo/mensajes";

export const DIAS_RECORDATORIO = 3;

export async function correrRecordatoriosDelGrupo(): Promise<{ salidas: number; recordatorios: number; lugaresLibres: number; minimos: number; errores: string[] }> {
  const sb = createSupabaseAdminClient();
  const hoy = cdmxDay(new Date());
  const { data: slots } = await sb
    .from("experience_slots")
    .select("id, access_token, status, fecha_limite, minimo, aviso_minimo_at, starts_at")
    .eq("visibility", "private")
    .neq("status", "cancelled")
    .gte("starts_at", new Date(Date.now() - 86400000).toISOString());
  const filas = (slots ?? []) as { id: string; access_token: string | null; status: string; fecha_limite: string | null; minimo: number | null; aviso_minimo_at: string | null; starts_at: string }[];

  let recordatorios = 0;
  let lugaresLibres = 0;
  let minimos = 0;
  const errores: string[] = [];
  const ahora = new Date().toISOString();

  for (const s of filas) {
    if (!s.access_token) continue;
    try {
      const e = await fetchEspacio(s.access_token);
      if (!e) continue;

      // 1 · Faltan N días para la fecha límite.
      if (e.status === "open" && e.diasParaLimite === DIAS_RECORDATORIO) {
        const { data: lugares } = await sb
          .from("grupo_lugares")
          .select("id, contact_id")
          .eq("slot_id", s.id)
          .is("recordatorio_at", null);
        for (const l of (lugares ?? []) as { id: string; contact_id: string }[]) {
          const p = e.personas.find((x) => x.lugarId === l.id);
          if (!p || p.estado !== "entro" || p.listaEspera) continue;
          const r = await recordarLugar(e, l.contact_id, DIAS_RECORDATORIO);
          if (r.correo || r.whatsapp) {
            await sb.from("grupo_lugares").update({ recordatorio_at: ahora, updated_at: ahora }).eq("id", l.id);
            recordatorios++;
          }
        }
      }

      // 2 · Se abrió un lugar: el primero de la lista de espera.
      if (e.status === "open" && e.disponibles != null && e.disponibles > 0 && !e.yaViajaron) {
        const { data: espera } = await sb
          .from("grupo_lugares")
          .select("id, contact_id")
          .eq("slot_id", s.id)
          .not("lista_espera_at", "is", null)
          .is("avisado_lugar_at", null)
          .order("lista_espera_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        const w = espera as { id: string; contact_id: string } | null;
        const p = w ? e.personas.find((x) => x.lugarId === w.id) : null;
        if (w && p && p.estado === "entro") {
          const r = await avisarLugarLibre(e, w.contact_id);
          if (r.correo || r.whatsapp) {
            await sb.from("grupo_lugares").update({ avisado_lugar_at: ahora, updated_at: ahora }).eq("id", w.id);
            lugaresLibres++;
          }
        }
      }

      // 3 · Venció sin el mínimo: a la operadora, una vez.
      if (e.vencidaSinMinimo && !s.aviso_minimo_at && e.fechaLimite && e.fechaLimite < hoy) {
        const ok = await avisarMinimoNoAlcanzado(e);
        if (ok) {
          await sb.from("experience_slots").update({ aviso_minimo_at: ahora, updated_at: ahora }).eq("id", s.id);
          minimos++;
        }
      }
    } catch (err) {
      errores.push(`${s.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return { salidas: filas.length, recordatorios, lugaresLibres, minimos, errores };
}
