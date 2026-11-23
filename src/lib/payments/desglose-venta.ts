// EL DESGLOSE DE UNA VENTA, PARA LA OPERADORA (23 nov 2026).
//
// Convenio v3.5: «El desglose de cada venta indica su origen y la tasa
// aplicada» (Tercera §7) y Caminante entrega el desglose que permite conciliar
// (Cuarta §4). Con dos tasas —8 % si ella trajo al cliente, 12 % si lo trajo
// Caminante— la operadora tiene que poder VERIFICAR cuál se le cobró en cada
// venta. Hasta hoy su panel sólo traía totales.
//
// ⚠️ TODO SALE DE LO CONGELADO EN EL PAGO, nada se recalcula. La comisión es la
// que se guardó al cobrar (`platform_fee_mxn`); la tasa que se enseña es esa
// comisión dividida entre la base sin IVA de lo cobrado. Si mañana cambian las
// tasas, las ventas de ayer siguen diciendo lo que de verdad se les cobró.
//
// ⚠️ EL ORIGEN SE DICE SÓLO SI SE GUARDÓ. `reservations.escala_comision` lo
// escribe el cobro web desde el 23 nov de 2026; en ventas anteriores no está,
// y ahí se dice «sin registro», no se adivina.
//
// Puro: se prueba sin base.

import { IVA, sinIva } from "@/lib/operadores/comision";
import { repartoDe, type PagoParaRepartir } from "./lo-que-recibe";

export type OrigenDeVenta = "operadora" | "caminante" | "pactada" | "sin-comision" | "sin-registro";

export type VentaParaDesglose = PagoParaRepartir & {
  /** `reservations.escala_comision`: quién trajo al cliente, si se guardó. */
  escala_comision?: string | null;
  /** `reservations.commission_pct`: un porcentaje pactado, congelado en la venta. */
  commission_pct?: number | string | null;
};

export type DesgloseDeVenta = {
  /** Lo que pagó el cliente. */
  cobrado: number;
  origen: OrigenDeVenta;
  /** Cómo se le dice a ese origen en pantalla. */
  origenTexto: string;
  /** La tasa que de verdad se aplicó, en porcentaje con un decimal. `null` si no hubo comisión. */
  tasaPct: number | null;
  /** La comisión, sin IVA. */
  comision: number;
  /** El IVA de la comisión. */
  ivaComision: number;
  /** ISR + IVA retenidos para el SAT (sólo en cobros por su cuenta). */
  retenciones: number;
  /** Lo que le llega. */
  recibes: number;
};

const n = (v: unknown): number => {
  const x = typeof v === "string" ? Number(v) : (v as number);
  return typeof x === "number" && Number.isFinite(x) ? x : 0;
};
const r2 = (x: number) => Math.round(x * 100) / 100;

const TEXTO: Record<OrigenDeVenta, string> = {
  operadora: "La trajiste tú",
  caminante: "La trajo Caminante",
  pactada: "Porcentaje pactado",
  "sin-comision": "Sin comisión",
  "sin-registro": "Origen sin registro",
};

export function desgloseDeVenta(v: VentaParaDesglose): DesgloseDeVenta {
  const r = repartoDe(v);
  // La comisión sin IVA: la congelada; si sólo quedó lo retenido con IVA, se le quita.
  const comision = v.platform_fee_mxn != null ? r2(n(v.platform_fee_mxn)) : r2(r.retenido / (1 + IVA));
  const ivaComision = r2(r.retenido - comision);
  const base = sinIva(r.cobrado);

  const origen: OrigenDeVenta =
    comision <= 0
      ? "sin-comision"
      : v.escala_comision === "plataforma"
        ? "operadora"
        : v.escala_comision === "venta"
          ? "caminante"
          : v.commission_pct != null
            ? "pactada"
            : "sin-registro";

  return {
    cobrado: r.cobrado,
    origen,
    origenTexto: TEXTO[origen],
    tasaPct: comision > 0 && base > 0 ? Math.round((comision / base) * 1000) / 10 : null,
    comision,
    ivaComision: ivaComision > 0 ? ivaComision : 0,
    retenciones: r.retenciones,
    recibes: r.recibeOperadora,
  };
}
