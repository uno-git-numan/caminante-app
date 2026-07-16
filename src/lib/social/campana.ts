// Calendario de la CAMPAÑA por experiencia (canon del playbook, sección 3).
// Dos anclas:
//   · M1 (P1–P3, anuncio) cuelga de la fecha de LANZAMIENTO (hoy, cuando se agenda).
//   · M2 (P4–P6, venta) cuelga de la fecha de SALIDA (T-menos).
// P7 (cupo) la dispara el cron de cupo; M3 (P8–P10) va DESPUÉS del viaje (necesita
// material real) → no entra aquí.
//
// Casos que resuelve el pase de compresión+espaciado:
//   · Salida < 28 días: las fechas de M2 caen en el pasado → se comprimen a partir de
//     mañana, 1 pieza por día, en orden del canon (nada se pierde ni se encima).
//   · Salida a 4 meses: M1 sale pronto (el anuncio/"ya viene"); M2 arranca solo a D-28.
//   · Sin fecha de salida conocida: M2 usa un fallback relativo al lanzamiento.

const DAY = 86400000;

// Orden canónico y elegibilidad (P7 y M3 quedan fuera de la programación automática).
export const CAMPAIGN_ORDER = ["P1", "P2", "P3", "P4", "P5", "P6"] as const;

// M1: días DESPUÉS del lanzamiento (hoy).
const LAUNCH_OFFSET: Record<string, number> = { P1: 0, P2: 4, P3: 7 };
// M2: días ANTES de la salida.
const DEP_OFFSET: Record<string, number> = { P4: 28, P5: 21, P6: 14 };
// M2 sin fecha de salida: días después del lanzamiento (fallback).
const FALLBACK_OFFSET: Record<string, number> = { P4: 12, P5: 18, P6: 24 };

export function esElegibleCampana(pieceId: string): boolean {
  return (CAMPAIGN_ORDER as readonly string[]).includes(pieceId);
}

// Normaliza una fecha al día que le toca, a las 08:00 UTC (≈02:00 CDMX): así el
// cron diario de publicación (más tarde ese día) la toma sí o sí.
function atPublishHour(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 8, 0, 0));
}

export type CampaignSlot = { pieceId: string; date: Date };

// Calcula la fecha de publicación de cada pieza elegible. Garantiza: orden del canon,
// nunca antes de mañana, y ≥1 día entre piezas (nunca 2 el mismo día).
export function computeCampaignSchedule(
  pieceIds: string[],
  opts: { now: Date; departure: Date | null },
): CampaignSlot[] {
  const now = opts.now;
  const dep = opts.departure;
  const tomorrow = new Date(now.getTime() + DAY);

  const items = pieceIds
    .filter(esElegibleCampana)
    .map((id) => {
      let ideal: Date;
      if (id in LAUNCH_OFFSET) {
        ideal = new Date(now.getTime() + LAUNCH_OFFSET[id] * DAY);
      } else if (dep) {
        ideal = new Date(dep.getTime() - DEP_OFFSET[id] * DAY);
      } else {
        ideal = new Date(now.getTime() + FALLBACK_OFFSET[id] * DAY);
      }
      return { id, rank: (CAMPAIGN_ORDER as readonly string[]).indexOf(id), ideal };
    })
    .sort((a, b) => a.rank - b.rank);

  const out: CampaignSlot[] = [];
  let cursor: Date | null = null;
  for (const it of items) {
    let d = it.ideal.getTime() < tomorrow.getTime() ? tomorrow : it.ideal;
    d = atPublishHour(d);
    if (cursor && d.getTime() <= cursor.getTime()) {
      d = atPublishHour(new Date(cursor.getTime() + DAY));
    }
    out.push({ pieceId: it.id, date: d });
    cursor = d;
  }
  return out;
}
