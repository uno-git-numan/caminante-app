// EL CFDI DE RETENCIONES E INFORMACIÓN DE PAGOS (12 nov 2026).
//
// Uno por operadora y mes, a más tardar el día 5 del mes siguiente (LISR 113-C
// II; LIVA 18-J II c). Clave de retención 26 «Servicios mediante Plataformas
// Tecnológicas», con el complemento «Servicios Plataformas Tecnológicas» 1.0.
// Reglas: design/legal/REPORTE-MENSUAL-RETENCIONES-2026-11-12.md §2.2, leídas
// del instructivo del SAT. Esquema: ServiciosPlataformasTecnologicas10.xsd
// (descargado del SAT el 12 nov 2026; tests/fixtures/sat/).
//
// Facturapi timbra con la organización de NUMAN: POST /v2/retentions con
// `complements: [<xml del complemento>]` (su OpenAPI, 11 nov 2026).
//
// ⚠️ LAS CLAVES DE CATÁLOGO NO SE ADIVINAN. Las confirmó la sesión legal del
// XLS oficial (12 nov 2026, abajo). Si alguna vuelve a null, `catalogoListo()`
// dice cuál falta y NO se emite.

const r2 = (n: number) => Math.round(n * 100) / 100;
/** Trunca a centavos (regla del SAT para montoRet). Mismo criterio que retencion.ts. */
const trunc2 = (n: number) => Math.floor(n * 100 + 1e-7) / 100;
const dec = (n: number, d = 2) => n.toFixed(d);

export type Catalogo = {
  /** c_TipoDeServ: el de nuestras experiencias. */
  tipoDeServ: string | null;
  /** c_Periodicidad (retenciones): mensual. */
  periodicidadMensual: string | null;
  /** c_TipoImpuesto (retenciones) del IVA trasladado en el complemento. */
  impuestoIva: string | null;
  /** Facturapi `tipo_pago_ret` del ISR: 03 definitivo plataformas · 04 provisional. */
  tipoPagoRetIsr: string | null;
  /** Facturapi `tipo_pago_ret` del IVA: 01 definitivo IVA. */
  tipoPagoRetIva: string | null;
  /** c_FormaPagoServ de una tarjeta PREPAGO. */
  formaPagoPrepago: string | null;
  /** De dónde salió cada clave (para el registro). */
  fuente: string;
};

/**
 * Confirmadas por la sesión legal el 12 nov 2026, leídas de los catálogos
 * oficiales del SAT (XLS del complemento Rev. E, 31/12/2025, y catálogos del
 * CFDI de retenciones 2.0). Detalle y URLs: REPORTE-MENSUAL-RETENCIONES §2.2.
 *
 *   06 «Otro tipo de servicios» · tasa ISR 2026 0.025 en c_TipoDeServ v8.0
 *   02 «Mensual» (c_Periodicidad: 01 Semanal, 02 Mensual, 03 Diario, 04 Quincenal, 05 Otro)
 *   02 IVA en el complemento (c_TipodeImpuesto: 01 ISR, 02 IVA, 03 IEPS)
 *   04 «Pago provisional ISR» POR OMISIÓN (LISR 113-A 3º). El 03 «definitivo
 *      plataformas» es sólo para la persona física que acredite haber optado
 *      (113-B); ese campo de su ficha todavía no existe.
 *   01 «Pago definitivo IVA» (la única de IVA)
 *   06 débito para una tarjeta PREPAGO (el catálogo no tiene prepago; M16)
 *
 * En `imp_retenidos.impuesto` Facturapi recibe «ISR»/«IVA» (su OpenAPI) y el
 * XML sale con 001/002 (catCFDI:c_Impuesto). Se verifica en la primera emisión
 * de prueba.
 */
export const CATALOGO: Catalogo = {
  tipoDeServ: "06",
  periodicidadMensual: "02",
  impuestoIva: "02",
  tipoPagoRetIsr: "04",
  tipoPagoRetIva: "01",
  formaPagoPrepago: "06",
  fuente: "Sesión legal, 12 nov 2026: catálogo Rev. E (31/12/2025) y catálogos del CFDI de retenciones 2.0.",
};

export function catalogoListo(c: Catalogo = CATALOGO): { ok: true } | { ok: false; faltan: string[] } {
  const faltan = (Object.keys(c) as (keyof Catalogo)[]).filter((k) => k !== "fuente" && !c[k]);
  return faltan.length ? { ok: false, faltan } : { ok: true };
}

/** c_FormaPagoServ (complemento) desde `payments.medio_pago`. Lista legible del XLS, por la sesión legal. */
export function formaPagoServ(medio: string | null | undefined, c: Catalogo = CATALOGO): string | null {
  switch ((medio ?? "").trim()) {
    case "card:credit":
      return "03"; // Tarjeta de crédito
    case "card:debit":
      return "06"; // Tarjeta de débito
    case "card:prepaid":
      return c.formaPagoPrepago;
    case "oxxo":
      return "01"; // Efectivo
    case "customer_balance":
      return "02"; // Transferencia (SPEI a la cuenta de Stripe)
    default:
      return null; // sin dato: no se adivina
  }
}

/** El medio de pago tal como lo dice Stripe, para guardarlo en `payments.medio_pago`. */
export function medioDeStripe(pmd: { type?: string; card?: { funding?: string | null } | null } | null | undefined): string | null {
  if (!pmd?.type) return null;
  if (pmd.type === "card") return `card:${pmd.card?.funding || "unknown"}`;
  return pmd.type;
}

export type ServicioParaCfdi = {
  paymentId: string;
  /** Fecha del cobro, YYYY-MM-DD en hora CDMX. */
  fecha: string;
  /** Precio del servicio sin IVA (ya neto de devoluciones antes del corte). */
  base: number;
  /** Comisión de NUMAN sin IVA. */
  comision: number | null;
  medio: string | null;
};

export type MontosSat = {
  numServ: number;
  /** Σ PrecioServSinIVA = montoTotOperacion = montoTotGrav. */
  montoOperacion: number;
  /** Σ Importe de IVA trasladado (Base × 0.16 por venta). */
  ivaTrasladado: number;
  /** montoRet del ISR: montoOperacion × tasa, TRUNCADO. */
  isr: number;
  /** montoRet del IVA: ivaTrasladado × 50 %, TRUNCADO. */
  iva: number;
  /** TotalIVATrasladado − TotalIVARetenido. */
  difIva: number;
  /** Σ comisión sin IVA. */
  comision: number;
};

/** Los montos del comprobante con la regla del SAT (legal §2.2). */
export function montosSegunSat(servicios: ServicioParaCfdi[], tasas: { isr: number; iva: number }): MontosSat {
  const montoOperacion = r2(servicios.reduce((n, s) => n + s.base, 0));
  const ivaTrasladado = r2(servicios.reduce((n, s) => n + r2(s.base * 0.16), 0));
  const isr = trunc2(montoOperacion * tasas.isr);
  const iva = trunc2(ivaTrasladado * tasas.iva);
  return {
    numServ: servicios.length,
    montoOperacion,
    ivaTrasladado,
    isr,
    iva,
    difIva: r2(ivaTrasladado - iva),
    comision: r2(servicios.reduce((n, s) => n + (s.comision ?? 0), 0)),
  };
}

const NS = "http://www.sat.gob.mx/esquemas/retencionpago/1/PlataformasTecnologicas10";
export const NAMESPACE_COMPLEMENTO = {
  prefix: "plataformasTecnologicas",
  uri: NS,
  schema_location: `${NS}/ServiciosPlataformasTecnologicas10.xsd`,
};

const attr = (o: Record<string, string | null | undefined>) =>
  Object.entries(o)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}="${String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")}"`)
    .join(" ");

export type ComplementoArmado = { ok: true; xml: string; montos: MontosSat } | { ok: false; porque: string };

/** El XML del complemento, con su raíz y su namespace (Facturapi lo inserta tal cual). */
export function xmlComplemento(
  servicios: ServicioParaCfdi[],
  tasas: { isr: number; iva: number },
  c: Catalogo = CATALOGO,
): ComplementoArmado {
  const listo = catalogoListo(c);
  if (!listo.ok) return { ok: false, porque: `Faltan claves de catálogo: ${listo.faltan.join(", ")}.` };
  if (!servicios.length) return { ok: false, porque: "No hay ventas que reportar en el mes." };
  const sinForma = servicios.filter((s) => !formaPagoServ(s.medio, c));
  if (sinForma.length) {
    return { ok: false, porque: `${sinForma.length} venta(s) sin forma de pago conocida (${sinForma.map((s) => s.paymentId).join(", ")}).` };
  }
  const sinComision = servicios.filter((s) => !(s.comision && s.comision > 0));
  if (sinComision.length) {
    // ComisionDelServicio/@Importe es obligatorio y > 0 (legal §2.2).
    return { ok: false, porque: `${sinComision.length} venta(s) sin comisión congelada.` };
  }
  const m = montosSegunSat(servicios, tasas);
  const detalles = servicios
    .map((s) => {
      const ivaImporte = r2(s.base * 0.16);
      const pct = Math.min(1, Math.max(0.001, Math.round(((s.comision as number) / s.base) * 1000) / 1000));
      return (
        `<plataformasTecnologicas:DetallesDelServicio ${attr({
          FormaPagoServ: formaPagoServ(s.medio, c),
          TipoDeServ: c.tipoDeServ,
          FechaServ: s.fecha,
          PrecioServSinIVA: dec(s.base),
        })}>` +
        `<plataformasTecnologicas:ImpuestosTrasladadosdelServicio ${attr({
          Base: dec(s.base),
          Impuesto: c.impuestoIva,
          TipoFactor: "Tasa",
          TasaCuota: "0.160000",
          Importe: dec(ivaImporte),
        })}/>` +
        `<plataformasTecnologicas:ComisionDelServicio ${attr({
          Base: dec(s.base),
          Porcentaje: dec(pct, 3),
          Importe: dec(s.comision as number),
        })}/>` +
        `</plataformasTecnologicas:DetallesDelServicio>`
      );
    })
    .join("");
  const xml =
    `<plataformasTecnologicas:ServiciosPlataformasTecnologicas xmlns:plataformasTecnologicas="${NS}" ${attr({
      Version: "1.0",
      Periodicidad: c.periodicidadMensual,
      NumServ: String(m.numServ),
      MonTotServSIVA: dec(m.montoOperacion),
      TotalIVATrasladado: dec(m.ivaTrasladado),
      TotalIVARetenido: dec(m.iva),
      TotalISRRetenido: dec(m.isr),
      DifIVAEntregadoPrestServ: dec(m.difIva),
      MonTotalporUsoPlataforma: dec(m.comision),
    })}>` +
    `<plataformasTecnologicas:Servicios>${detalles}</plataformasTecnologicas:Servicios>` +
    `</plataformasTecnologicas:ServiciosPlataformasTecnologicas>`;
  return { ok: true, xml, montos: m };
}

export type ReceptorRetencion = { rfc: string; razonSocial: string; regimen: string; cp: string; email: string | null };

/** El cuerpo de POST /v2/retentions (OpenAPI de Facturapi). */
export function payloadRetencion(
  mes: string,
  receptor: ReceptorRetencion,
  complemento: { xml: string; montos: MontosSat },
  c: Catalogo = CATALOGO,
  idempotencyKey?: string,
) {
  const [ejerc, mm] = mes.split("-").map(Number);
  const m = complemento.montos;
  return {
    customer: {
      legal_name: receptor.razonSocial,
      tax_id: receptor.rfc,
      tax_system: receptor.regimen,
      address: { zip: receptor.cp },
      ...(receptor.email ? { email: receptor.email } : {}),
    },
    cve_retenc: "26",
    periodo: { mes_ini: mm, mes_fin: mm, ejerc },
    totales: {
      monto_tot_operacion: m.montoOperacion,
      monto_tot_grav: m.montoOperacion,
      monto_tot_exent: 0,
      monto_tot_ret: r2(m.isr + m.iva),
      imp_retenidos: [
        { impuesto: "ISR", base_ret: m.montoOperacion, monto_ret: m.isr, tipo_pago_ret: c.tipoPagoRetIsr },
        { impuesto: "IVA", base_ret: m.ivaTrasladado, monto_ret: m.iva, tipo_pago_ret: c.tipoPagoRetIva },
      ],
    },
    complements: [complemento.xml],
    namespaces: [NAMESPACE_COMPLEMENTO],
    external_id: `${mes}:${receptor.rfc}`,
    ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
  };
}
