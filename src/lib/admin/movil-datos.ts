// Adaptador: del modelo del panel (queries.ts) al que espera la app móvil.
//
// No consulta nada nuevo — reusa fetchAdminOverview para no tener dos fuentes de
// verdad de los mismos números. Si el panel de escritorio y el teléfono
// discreparan en una cifra, el bug sería imposible de explicar.

import { fetchAdminOverview, fetchDinero } from "@/lib/admin/queries";
import { formatFechaCorta } from "@/lib/admin/formato";
import { fetchRentabilidad } from "@/lib/admin/rentabilidad";
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

// ── RECURSOS (la pestaña de dinero en el teléfono) ───────────────────────
//
// La pestaña se llamaba «Dinero» y ahora es «Recursos», igual que en el panel
// de escritorio (Luis, 11 ago): es la misma pregunta —qué entra y qué sale— y
// tener dos nombres para lo mismo confunde.
//
// Reusa `fetchRentabilidad`, la MISMA fuente del escritorio. Si el teléfono y
// la computadora discreparan en una cifra, el bug sería imposible de explicar.

export type RecursosMovil = {
  mesLabel: string;
  ingresosMes: number;
  historico: number;
  pendiente: number;
  pendienteN: number;
  enRiesgo: { nombre: string; salida: string; faltan: number; utilidad: number } | null;
  experiencias: {
    nombre: string;
    ingreso: number;
    egreso: number;
    utilidad: number | null; // null = sin costear, no se inventa
    salidas: {
      slotId: string;
      label: string;
      ingreso: number;
      egreso: number;
      pagos: number;
      vendidos: number;
      cupo: number | null;
    }[];
  }[];
};

export async function fetchRecursosMovil(): Promise<RecursosMovil> {
  const [salidas, dinero] = await Promise.all([fetchRentabilidad(), fetchDinero()]);

  const m = new Map<string, typeof salidas>();
  for (const s of salidas) m.set(s.experienciaNombre, [...(m.get(s.experienciaNombre) || []), s]);

  const experiencias = [...m.entries()]
    .map(([nombre, ss]) => ({
      nombre,
      ingreso: ss.reduce((a, s) => a + s.ingreso, 0),
      egreso: ss.reduce((a, s) => a + s.proveedoresConIva, 0),
      // Sin costos no hay utilidad que enseñar: se dice, no se pone cero.
      utilidad: ss.some((s) => s.sinCostos) ? null : ss.reduce((a, s) => a + s.utilidad, 0),
      salidas: [...ss]
        .sort((a, b) => (b.startsAt || "").localeCompare(a.startsAt || ""))
        .map((s) => ({
          slotId: s.slotId,
          label: s.salidaLabel,
          ingreso: s.ingreso,
          egreso: s.proveedoresConIva,
          pagos: s.pagos.length,
          vendidos: s.vendidos,
          cupo: s.cupo,
        })),
    }))
    .sort((a, b) => b.ingreso - a.ingreso);

  // La salida más urgente: la que va abajo de su equilibrio y aún no se va.
  const hoy = diaCdmx(new Date());
  const riesgo = salidas
    .filter(
      (s) =>
        s.startsAt &&
        diaCdmx(s.startsAt) >= hoy &&
        s.equilibrio != null &&
        s.vendidos < s.equilibrio,
    )
    .sort((a, b) => (a.startsAt || "").localeCompare(b.startsAt || ""))[0];

  return {
    mesLabel: dinero.mesLabel,
    ingresosMes: dinero.ingresosMes,
    historico: dinero.ingresosTotal,
    pendiente: dinero.pendiente,
    pendienteN: dinero.pendienteN,
    enRiesgo: riesgo
      ? {
          nombre: riesgo.experienciaNombre,
          salida: riesgo.salidaLabel,
          faltan: (riesgo.equilibrio || 0) - riesgo.vendidos,
          utilidad: riesgo.utilidad,
        }
      : null,
    experiencias,
  };
}
