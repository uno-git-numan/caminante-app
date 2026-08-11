// Adaptador: del modelo del panel (queries.ts) al que espera la app móvil.
//
// No consulta nada nuevo — reusa fetchAdminOverview para no tener dos fuentes de
// verdad de los mismos números. Si el panel de escritorio y el teléfono
// discreparan en una cifra, el bug sería imposible de explicar.

import { fetchAdminOverview, formatFechaCorta } from "@/lib/admin/queries";
import type { PanoramaData } from "@/app/caminante/admin/m/ui/Panorama";

const CDMX = "America/Mexico_City";
const diaCdmx = (d: Date | string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: CDMX, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    typeof d === "string" ? new Date(d) : d,
  );

export async function fetchPanoramaMovil(): Promise<PanoramaData> {
  const { kpis, proximas } = await fetchAdminOverview();

  // Variación contra el mes anterior: sparkMeses viene viejo → actual.
  const sp = kpis.sparkMeses || [];
  const previo = sp.length >= 2 ? sp[sp.length - 2] : 0;
  const variacion =
    previo > 0
      ? { pct: Math.round(((kpis.ingresosMes - previo) / previo) * 100), contra: "el mes pasado" }
      : null;

  // Una salida «floja» es la que va por debajo del 40% de su cupo: es la que
  // pide vender, y por eso va en naranja.
  const porSalida = proximas.slice(0, 6).map((s) => ({
    label: `${s.experienceNombre} · ${s.label || formatFechaCorta(s.startsAt)}`,
    taken: s.taken,
    capacity: s.capacity,
    flojo: s.capacity != null && s.capacity > 0 && s.taken / s.capacity < 0.4,
  }));

  const esperados = proximas.reduce((a, s) => a + s.titulares, 0);
  const firmados = proximas.reduce((a, s) => a + s.deslindes, 0);
  const faltan = proximas
    .map((s) => ({
      salida: `${s.experienceNombre} · ${s.label || formatFechaCorta(s.startsAt)}`,
      faltan: Math.max(0, s.titulares - s.deslindes),
    }))
    .filter((x) => x.faltan > 0);

  // El evento de HOY: la banda de arriba solo existe si de verdad hay salida hoy.
  const hoyIso = diaCdmx(new Date());
  const salidaHoy = proximas.find((s) => s.startsAt && diaCdmx(s.startsAt) === hoyIso);
  const hoy = salidaHoy
    ? {
        nombre: salidaHoy.experienceNombre,
        ubicacion: null,
        personas: salidaHoy.taken,
        sinFirmar: Math.max(0, salidaHoy.titulares - salidaHoy.deslindes),
        slug: salidaHoy.experienceSlug,
        slotId: salidaHoy.slotId,
      }
    : null;

  // Pendiente de cobro: lo que deben las reservas de salidas próximas. Las
  // reservas con total 0 (cobradas fuera del sistema) NO cuentan como deuda —
  // ya las excluye `deudores` en queries.ts.
  const deudores = proximas.flatMap((s) => s.detail.deudores);
  const pendienteCobro = {
    monto: deudores.reduce((a, d) => a + d.debe, 0),
    reservas: deudores.length,
  };

  return {
    ingresosMes: kpis.ingresosMes,
    historicoIng: kpis.ingresosTotal,
    mesLabel: kpis.mesLabel,
    variacion,
    porExperiencia: kpis.ingresosPorExperiencia.slice(0, 5),
    personasPorOperar: kpis.personasPorOperar,
    reservasPorEstado: kpis.reservasPorEstado,
    porSalida,
    deslindes: { firmados, esperados, faltan },
    satisfaccion: {
      prom: kpis.satisfaccion.avgStars,
      respuestas: kpis.satisfaccion.respondidas,
      dist: kpis.satisfaccion.distEstrellas,
    },
    hoy,
    pendienteCobro,
  };
}
