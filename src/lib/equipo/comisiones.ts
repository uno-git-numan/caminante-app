// LAS COMISIONES DEL EQUIPO (F3) — puro, sin servidor, para pantallas y pruebas.
//
// Decidido con Luis (25 sep 2026), todo en porcentaje, sobre cobrado sin IVA
// neto de devoluciones, corte mensual el día 5:
//   · numan: 10% de la comisión que numan cobra a cada operadora atribuida,
//     MIENTRAS la persona la tenga en su cartera (el libro dice quién la tenía
//     el día del pago: `titularEn`). Al salir, la cola pasa a quien la reciba.
//   · Caminante: 3% de lo cobrado sin IVA de sus lugares (`payments.vendedor_id`)
//     por GRUPO CERRADO: la salida ya ocurrió. Antes de eso está «por devengar».
//   · +1% de los clientes de sus embajadores 12 meses: NO se calcula todavía.
//     No existe el dato de qué cliente llegó por qué embajador; inventarlo
//     sería inventar dinero.
//
// ⚠️ LAS DEVOLUCIONES. `payments.refunded_mxn` no tiene fecha, así que una
// devolución resta DEL PAGO QUE DEVOLVIÓ, en el mes de ese pago, aunque el mes
// ya hubiera cerrado. La comisión sigue a lo que el cliente acabó pagando —la
// misma regla que `netoDelPago` (liquidaciones) y que Stripe aplica solo—. Si
// un día se registra la fecha de la devolución, esto cambia a «resta en el mes
// en que pasa» y el mes cerrado se vuelve foto.
//
// ⚠️ LO PAGADO. No hay registro de lo que se le ha pagado a cada persona (no
// existe la tabla). Aquí sale `null`, y la pantalla dice «sin registro», nunca
// $0: cero sería afirmar que no se le ha pagado.

import { IVA } from "@/lib/operadores/comision";
import { titularEn, type FilaLibro } from "@/lib/equipo/atribucion-reglas";

/** Las cinco etapas de una operadora en la pestaña de Rendimiento. Viven aquí (puro) porque la pantalla es de navegador. */
export type EtapaOperadora = "llamada" | "expediente" | "firmar" | "armando" | "vendiendo";
export const ETAPAS_OPERADORA: [EtapaOperadora, string][] = [["llamada", "Llamada"], ["expediente", "Expediente"], ["firmar", "Por firmar"], ["armando", "Armando"], ["vendiendo", "Vendiendo"]];

export const PCT_NUMAN = 0.1;
export const PCT_CAMINANTE = 0.03;
const r2 = (n: number) => Math.round(n * 100) / 100;

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export type Mes = { k: string; t: string; m: string; corte: string; curso: boolean; desde: string; hasta: string };

/** «2026-09» → [1 sep 00:00 CDMX, 1 oct 00:00 CDMX) en ISO. CDMX no cambia de horario desde 2022: UTC−6 fijo. */
export function rangoMes(k: string): { desde: string; hasta: string } {
  const [y, m] = k.split("-").map(Number);
  const ini = new Date(Date.UTC(y, m - 1, 1, 6, 0, 0));
  const fin = new Date(Date.UTC(y, m, 1, 6, 0, 0));
  return { desde: ini.toISOString(), hasta: fin.toISOString() };
}

/** «2026-09» del instante dado, en CDMX. */
export function claveMes(iso: string | Date): string {
  const d = new Date(new Date(iso).getTime() - 6 * 3600_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Los meses desde `primero` (clave) hasta el mes en curso, con su corte (día 5 del siguiente). */
export function mesesDesde(primero: string | null, hoy: Date = new Date()): Mes[] {
  const actual = claveMes(hoy);
  const ini = primero && primero < actual ? primero : actual;
  const out: Mes[] = [];
  let [y, m] = ini.split("-").map(Number);
  for (let i = 0; i < 36; i++) {
    const k = `${y}-${String(m).padStart(2, "0")}`;
    const sig = m === 12 ? [y + 1, 1] : [y, m + 1];
    out.push({
      k,
      t: `${cap(MESES[m - 1])} de ${y}`,
      m: MESES[m - 1],
      corte: `5 de ${MESES[sig[1] - 1]}`,
      curso: k === actual,
      ...rangoMes(k),
    });
    if (k === actual) break;
    [y, m] = sig;
  }
  return out;
}

export type PagoParaComision = {
  id: string;
  paid_at: string;
  amount_mxn: number;
  refunded_mxn: number;
  platform_fee_mxn: number | null;
  operator_id: string | null;
  vendedor_id: string | null;
  /** La salida de la reserva; null si la reserva no tenía fecha. */
  slot_starts_at: string | null;
  num_people: number;
  etiqueta: string;
};

/** Lo que el cliente acabó pagando, y la comisión de numan en la misma proporción. */
export function netoDe(p: { amount_mxn: number; refunded_mxn: number; platform_fee_mxn: number | null }) {
  const cobrado = Number(p.amount_mxn) || 0;
  const devuelto = Math.min(Number(p.refunded_mxn) || 0, cobrado);
  const sequedo = cobrado - devuelto;
  const fee = cobrado > 0 ? r2(((Number(p.platform_fee_mxn) || 0) * sequedo) / cobrado) : 0;
  return { sequedo, sinIva: r2(sequedo / (1 + IVA)), fee, devuelto };
}

export type LineaCuenta = { fecha: string; texto: string; monto: number };

/**
 * numan: por cada pago del mes con comisión de plataforma, el 10% para quien
 * tenía la operadora el día del pago. Devuelve por persona: lo que generan sus
 * operadoras (sin IVA), lo devengado y las líneas del estado de cuenta.
 */
export function comisionNuman(pagos: PagoParaComision[], libro: FilaLibro[], mes: Mes) {
  const out = new Map<string, { genera: number; dev: number; cuenta: LineaCuenta[] }>();
  for (const p of pagos) {
    if (!p.operator_id || p.paid_at < mes.desde || p.paid_at >= mes.hasta) continue;
    const quien = titularEn(libro, "operadora", p.operator_id, p.paid_at);
    if (!quien) continue;
    const n = netoDe(p);
    if (!n.fee && !n.devuelto) continue;
    const f = out.get(quien) ?? { genera: 0, dev: 0, cuenta: [] };
    f.genera = r2(f.genera + n.fee);
    f.dev = r2(f.dev + r2(n.fee * PCT_NUMAN));
    const bruto = Number(p.platform_fee_mxn) || 0;
    f.cuenta.push({ fecha: p.paid_at, texto: `${p.etiqueta} · 1 venta`, monto: r2(bruto * PCT_NUMAN) });
    if (n.devuelto > 0) f.cuenta.push({ fecha: p.paid_at, texto: `${p.etiqueta} · devolución`, monto: -r2((bruto - n.fee) * PCT_NUMAN) });
    out.set(quien, f);
  }
  return out;
}

/**
 * Caminante: por cada pago con vendedor, el 3% de lo cobrado sin IVA. Devengado
 * si la salida ya ocurrió (grupo cerrado) EN ESE MES; por devengar si la salida
 * todavía no llega. Un pago sin salida (reserva sin fecha) no devenga: no hay
 * grupo que cerrar, y se dice.
 */
export function comisionCaminante(pagos: PagoParaComision[], mes: Mes, ahora: Date = new Date()) {
  const out = new Map<string, { lugares: number; monto: number; dev: number; porDev: number; sinFecha: number; cuenta: LineaCuenta[] }>();
  const hoy = ahora.toISOString();
  for (const p of pagos) {
    if (!p.vendedor_id) continue;
    const f = out.get(p.vendedor_id) ?? { lugares: 0, monto: 0, dev: 0, porDev: 0, sinFecha: 0, cuenta: [] };
    const n = netoDe(p);
    const enMes = p.paid_at >= mes.desde && p.paid_at < mes.hasta;
    // Lo vendido se cuenta en el mes en que se cobró; lo devengado, en el mes en que salió el grupo.
    if (enMes) {
      f.lugares += n.sequedo > 0 ? Number(p.num_people) || 0 : 0;
      f.monto = r2(f.monto + n.sinIva);
    }
    const com = r2(n.sinIva * PCT_CAMINANTE);
    if (!p.slot_starts_at) {
      if (enMes) f.sinFecha = r2(f.sinFecha + com);
    } else if (p.slot_starts_at <= hoy && p.slot_starts_at >= mes.desde && p.slot_starts_at < mes.hasta) {
      f.dev = r2(f.dev + com);
      f.cuenta.push({ fecha: p.slot_starts_at, texto: `${p.etiqueta} · ${p.num_people} × grupo cerrado`, monto: r2((Number(p.amount_mxn) / (1 + IVA)) * PCT_CAMINANTE) });
      if (n.devuelto > 0) f.cuenta.push({ fecha: p.slot_starts_at, texto: `${p.etiqueta} · devolución`, monto: -r2((n.devuelto / (1 + IVA)) * PCT_CAMINANTE) });
    } else if (p.slot_starts_at > hoy && mes.curso) {
      f.porDev = r2(f.porDev + com);
    }
    out.set(p.vendedor_id, f);
  }
  return out;
}

/** NPS clásico: % promotores (9-10) − % detractores (0-6). Null sin respuestas. */
export function npsDe(notas: (number | null | undefined)[]): number | null {
  const v = notas.filter((n): n is number => typeof n === "number");
  if (!v.length) return null;
  const pro = v.filter((n) => n >= 9).length, det = v.filter((n) => n <= 6).length;
  return Math.round(((pro - det) / v.length) * 100);
}

/** Caídas agrupadas por motivo, de más a menos. */
export function caidasPorMotivo(motivos: (string | null | undefined)[]): [string, number][] {
  const m = new Map<string, number>();
  for (const x of motivos) {
    const k = (x ?? "").trim() || "Sin motivo";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
