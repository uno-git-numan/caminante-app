import "server-only";

import { fetchEspacio, ligaDelEspacio } from "@/lib/grupo/espacio";
import type { ResumenDelEspacio } from "@/lib/grupo/resumen";

/** Los resúmenes de varias salidas privadas, por id de salida. Las que no existen o están canceladas no vienen. */
export async function resumenesDeEspacios(tokens: string[]): Promise<Map<string, ResumenDelEspacio>> {
  const unicos = Array.from(new Set(tokens.filter(Boolean)));
  const espacios = await Promise.all(unicos.map((t) => fetchEspacio(t)));
  const out = new Map<string, ResumenDelEspacio>();
  for (const e of espacios) {
    if (!e) continue;
    out.set(e.slotId, {
      slotId: e.slotId,
      token: e.token,
      liga: ligaDelEspacio(e.token),
      anfitrion: e.anfitrion?.nombre || null,
      anfitrionContactId: e.anfitrion?.contactId ?? null,
      pidioEl: e.pidioEl,
      fechaLimite: e.fechaLimite,
      minimo: e.minimo,
      cupo: e.cupo,
      apartados: e.apartados,
      entraron: e.entraron,
      pagaron: e.pagaron,
      gente: e.personas.map((p) => ({
        lugarId: p.lugarId,
        contactId: p.contactId,
        nombre: p.nombre,
        iniciales: p.iniciales,
        estado: p.estado,
        anfitrion: p.anfitrion,
        pagadoPor: p.pagadoPor,
        lugaresPagados: p.lugaresPagados,
        listaEspera: p.listaEspera,
        entroEl: p.entroEl,
      })),
    });
  }
  return out;
}
