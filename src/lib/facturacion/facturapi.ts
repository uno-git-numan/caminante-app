// Cliente de Facturapi (PAC) — sin SDK, fetch directo a su REST v2.
//
// DOS llaves, dos papeles:
//   · La llave de USUARIO (`FACTURAPI_USER_KEY`, sk_user_…) administra
//     ORGANIZACIONES: crearlas, mandar datos fiscales, subir el CSD, sacar sus
//     llaves. Una organización por emisor: NUMAN HUB, DRUIDAS, cada operadora.
//   · La llave de una ORGANIZACIÓN (sk_live_… / sk_test_…) emite: facturas,
//     egresos, factura global. Viene de `lib/facturacion/emisor.ts`, que sabe
//     de quién es la venta.
//
// El flujo (MAPA-FACTURACION.md §0.9, desde el 17 nov 2026): cada pago manda
// NUESTRO comprobante; si el cliente pide factura → CFDI de ingreso a su RFC;
// lo que nadie facturó al cerrar el mes → FACTURA GLOBAL a público en general,
// armada aquí con un concepto por pago. NO se usan los recibos (E-Receipts) de
// Facturapi: son un producto aparte de $599/mes por organización. El CSD nunca
// pasa por aquí más que en la subida: lo guarda Facturapi y sella con él.
//
// Precios al público INCLUYEN IVA 16% → `tax_included: true` y Facturapi
// desglosa. Método PUE (se paga antes del viaje).

import { interruptorClientes } from "@/lib/facturacion/corte";

const API = "https://www.facturapi.io/v2";

// Clave de Producto/Servicio SAT por defecto para una experiencia:
// 90121501 «Servicios de organización de excursiones» (Anexo 20 v4.0). Antes
// era 90121500, que es la FAMILIA «Agentes de viajes», no un servicio. Cada
// experiencia puede traer la suya en `data.fiscal.claveProdServ`; la de la
// comisión de plataforma (Fase 3) es 80141628. Ver MAPA-FACTURACION.md §0.4.
export const CLAVE_PROD_SERV_EXPERIENCIA = process.env.FACTURAPI_CLAVE_PROD_SERV || "90121501";
const CLAVE_UNIDAD = process.env.FACTURAPI_CLAVE_UNIDAD || "E48"; // Unidad de servicio
// Forma de pago default: 04 = Tarjeta (Stripe). Transferencia = 03, efectivo = 01.
const FORMA_PAGO_DEFAULT = process.env.FACTURAPI_FORMA_PAGO || "04";

/**
 * ¿Hay llave de la casa? Basta para el CFDI de retenciones a las operadoras y
 * nada más. Para todo lo de CLIENTES (comprobantes, autofactura, global) se pregunta
 * `facturacionClientesActiva()` — ver lib/facturacion/corte.ts.
 */
export function facturacionActiva(): boolean {
  return !!process.env.FACTURAPI_SECRET_KEY;
}
/** Comprobantes, autofactura y global a clientes: la llave Y el interruptor `FACTURACION_CLIENTES=1`. */
export function facturacionClientesActiva(): boolean {
  return facturacionActiva() && interruptorClientes();
}
/** ¿Podemos administrar organizaciones de operadoras? */
export function organizacionesActivas(): boolean {
  return !!process.env.FACTURAPI_USER_KEY;
}
/** Llave de la organización de la CASA (NUMAN HUB hoy; DRUIDAS cuando exista). */
export function llaveDeLaCasa(): string {
  const key = process.env.FACTURAPI_SECRET_KEY;
  if (!key) throw new Error("FACTURAPI_SECRET_KEY no configurada");
  return key;
}
/** Sandbox mientras la llave de la casa sea de prueba: las organizaciones usan su llave Test. */
export const modoPrueba = () => (process.env.FACTURAPI_SECRET_KEY || "").startsWith("sk_test_");

type Json = Record<string, unknown>;

async function llamar<T>(key: string, method: string, path: string, body?: Json | FormData): Promise<T> {
  const headers: Record<string, string> = { Authorization: `Bearer ${key}` };
  let payload: BodyInit | undefined;
  if (body instanceof FormData) payload = body;
  else if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${API}${path}`, { method, headers, body: payload });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) {
    const msg = (json as { message?: string } | null)?.message || `Facturapi HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

async function bajar(key: string, path: string, que: string): Promise<ArrayBuffer> {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`No se pudo bajar ${que} (HTTP ${res.status})`);
  return res.arrayBuffer();
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type ReceptorFiscal = {
  rfc: string;
  razonSocial: string;
  regimenFiscal: string; // c_RegimenFiscal
  usoCfdi: string; // c_UsoCFDI
  codigoPostal: string;
  email: string;
};

/** Una línea del comprobante. Los precios INCLUYEN IVA (así se cobran); Facturapi desglosa. */
export type Concepto = {
  descripcion: string;
  cantidad: number;
  /** Precio unitario CON IVA, en MXN. */
  precioUnitarioConIva: number;
  /** Descuento total de la línea CON IVA (p. ej. un código de descuento). */
  descuentoConIva?: number;
  claveProdServ?: string;
  /** Clave de unidad; por defecto la de servicio (E48). El egreso contra una global lleva ACT. */
  claveUnidad?: string;
  /** Número de identificación del concepto (p. ej. el folio de la operación en un egreso contra la global). */
  noIdentificacion?: string;
};

export type FacturaTimbrada = {
  id: string; // id interno de Facturapi
  uuid: string; // folio fiscal SAT
  total: number;
  subtotal: number;
  iva: number;
};

const items = (conceptos: Concepto[]) =>
  conceptos.map((c) => ({
    quantity: c.cantidad,
    ...(c.descuentoConIva && c.descuentoConIva > 0 ? { discount: Number(c.descuentoConIva.toFixed(2)) } : {}),
    product: {
      description: c.descripcion,
      product_key: c.claveProdServ || CLAVE_PROD_SERV_EXPERIENCIA,
      unit_key: c.claveUnidad || CLAVE_UNIDAD,
      ...(c.noIdentificacion ? { sku: c.noIdentificacion } : {}),
      price: Number(c.precioUnitarioConIva.toFixed(2)),
      tax_included: true,
      taxes: [{ type: "IVA", rate: 0.16, factor: "Tasa" }],
    },
  }));

const customer = (r: ReceptorFiscal) => ({
  legal_name: r.razonSocial.trim(),
  tax_id: r.rfc.trim().toUpperCase(),
  tax_system: r.regimenFiscal.trim(),
  email: r.email.trim(),
  address: { zip: r.codigoPostal.trim() },
});

function desglose(json: { id?: string; uuid?: string; total?: number }, totalEsperado: number): FacturaTimbrada {
  if (!json?.id || !json?.uuid) throw new Error("Facturapi no devolvió la factura timbrada.");
  const total = typeof json.total === "number" ? json.total : totalEsperado;
  const subtotal = Number((total / 1.16).toFixed(2));
  return { id: json.id, uuid: json.uuid, total, subtotal, iva: Number((total - subtotal).toFixed(2)) };
}

// ── Emitir, con la llave de UNA organización ─────────────────────────────────

export function clienteFacturapi(key: string) {
  return {
    /** Factura de ingreso directa (sin recibo). */
    async crearFacturaIngreso(input: { receptor: ReceptorFiscal; conceptos: Concepto[]; formaPago?: string }): Promise<FacturaTimbrada> {
      if (!input.conceptos.length) throw new Error("La factura no tiene conceptos.");
      const total = input.conceptos.reduce((n, c) => n + c.cantidad * c.precioUnitarioConIva - (c.descuentoConIva ?? 0), 0);
      const json = await llamar<{ id?: string; uuid?: string; total?: number }>(key, "POST", "/invoices", {
        customer: customer(input.receptor),
        items: items(input.conceptos),
        use: input.receptor.usoCfdi.trim(),
        payment_form: input.formaPago || FORMA_PAGO_DEFAULT,
        payment_method: "PUE",
      });
      return desglose(json, total);
    },

    /**
     * FACTURA GLOBAL a público en general, como CFDI de ingreso normal con el
     * nodo `global` (no usa recibos). Un concepto por operación, como pide la
     * guía de llenado: clave 01010101, unidad ACT, «Venta», cantidad 1 y el
     * folio de la operación como número de identificación (`sku`). El receptor
     * genérico lleva el CP del emisor (lugar de expedición), régimen 616 y uso
     * S01. `idempotencyKey` = emisor + periodo: reintentar no timbra dos.
     */
    async crearFacturaGlobal(input: {
      cpEmisor: string;
      renglones: { folio: string; netoConIva: number }[];
      formaPago: string;
      periodicidad: "day" | "week" | "fortnight" | "month" | "two_months";
      mes: string;
      anio: number;
      /** Fecha de expedición (ISO), hasta 72 h atrás: para que caiga en el mes que factura. Sin ella, ahora. */
      fecha?: string | null;
      idempotencyKey: string;
    }): Promise<FacturaTimbrada> {
      if (!input.renglones.length) throw new Error("La global no tiene operaciones.");
      const total = input.renglones.reduce((n, r) => n + r.netoConIva, 0);
      const json = await llamar<{ id?: string; uuid?: string; total?: number }>(key, "POST", "/invoices", {
        customer: { legal_name: "PUBLICO EN GENERAL", tax_id: "XAXX010101000", tax_system: "616", address: { zip: input.cpEmisor } },
        items: input.renglones.map((r) => ({
          quantity: 1,
          product: {
            description: "Venta",
            product_key: "01010101",
            unit_key: "ACT",
            sku: r.folio,
            price: Number(r.netoConIva.toFixed(2)),
            tax_included: true,
            taxes: [{ type: "IVA", rate: 0.16, factor: "Tasa" }],
          },
        })),
        use: "S01",
        payment_form: input.formaPago,
        payment_method: "PUE",
        global: { periodicity: input.periodicidad, months: input.mes, year: input.anio },
        ...(input.fecha ? { date: input.fecha } : {}),
        // La misma llave como `external_id`: si la plataforma no alcanzó a anotar
        // una global ya timbrada, así se le encuentra en Facturapi.
        external_id: input.idempotencyKey,
        idempotency_key: input.idempotencyKey,
      });
      return desglose(json, total);
    },

    descargarCFDI: (facturapiId: string, formato: "xml" | "pdf") => bajar(key, `/invoices/${facturapiId}/${formato}`, `el ${formato.toUpperCase()}`),

    async enviarCFDIPorCorreo(facturapiId: string, email?: string): Promise<void> {
      await llamar(key, "POST", `/invoices/${facturapiId}/email`, email ? { email } : {}).catch(() => {});
    },

    /**
     * CFDI de retenciones e información de pagos (POST /v2/retentions, OpenAPI de
     * Facturapi). El cuerpo lo arma `payloadRetencion` (lib/fiscal/cfdi-retenciones.ts).
     * Sin `status: "draft"` se timbra en la misma llamada.
     */
    async crearRetencion(cuerpo: Json): Promise<{ id: string; uuid: string; status: string }> {
      const json = await llamar<{ id?: string; uuid?: string | null; status?: string }>(key, "POST", "/retentions", cuerpo);
      if (!json?.id || !json.uuid) throw new Error("Facturapi no devolvió el folio de la retención.");
      return { id: json.id, uuid: json.uuid, status: json.status ?? "valid" };
    },

    descargarRetencion: (retentionId: string, formato: "xml" | "pdf") =>
      bajar(key, `/retentions/${retentionId}/${formato}`, `el ${formato.toUpperCase()} de la retención`),

    /** Manda XML y PDF al correo del receptor (o al que se diga). */
    async enviarRetencionPorCorreo(retentionId: string, email?: string): Promise<void> {
      await llamar(key, "POST", `/retentions/${retentionId}/email`, email ? { email } : {});
    },

    /**
     * CFDI de EGRESO (nota de crédito) por una devolución (D19): relacionado al
     * ingreso original con tipo de relación 01, uso G02, la forma de pago de la
     * devolución (la del cobro) y PUE. El concepto lo arma `conceptoDeEgreso`
     * (devolucion-plan.ts): contra una global, clave 84111506 con el folio de
     * la operación; contra la factura del cliente, la clave de la experiencia.
     * `receptor: null` = público en general, cuando el original fue la global;
     * entonces el CP es el del emisor (lugar de expedición).
     */
    async crearEgreso(input: {
      receptor: ReceptorFiscal | null;
      cpEmisor: string;
      conceptos: Concepto[];
      formaPago: string;
      uuidRelacionado: string;
    }): Promise<FacturaTimbrada> {
      if (!input.conceptos.length) throw new Error("El egreso no tiene conceptos.");
      const total = input.conceptos.reduce((n, c) => n + c.cantidad * c.precioUnitarioConIva - (c.descuentoConIva ?? 0), 0);
      const cliente = input.receptor
        ? customer(input.receptor)
        : { legal_name: "PUBLICO EN GENERAL", tax_id: "XAXX010101000", tax_system: "616", address: { zip: input.cpEmisor } };
      const json = await llamar<{ id?: string; uuid?: string; total?: number }>(key, "POST", "/invoices", {
        type: "E",
        customer: cliente,
        items: items(input.conceptos),
        // G02 «Devoluciones, descuentos o bonificaciones» también a público en
        // general (guía del CFDI global 4.0, Apéndice 2; D21 bis).
        use: "G02",
        payment_form: input.formaPago,
        payment_method: "PUE",
        related_documents: [{ relationship: "01", documents: [input.uuidRelacionado] }],
      });
      return desglose(json, total);
    },

    /** Cancela un CFDI. motivo: 01 con relación · 02 sin relación · 03 no se llevó a cabo · 04 nominativa en global. */
    async cancelarCFDI(facturapiId: string, motivo: "01" | "02" | "03" | "04", sustituto?: string): Promise<void> {
      const q = new URLSearchParams({ motive: motivo, ...(sustituto ? { substitution: sustituto } : {}) });
      await llamar(key, "DELETE", `/invoices/${facturapiId}?${q}`);
    },
  };
}

// ── Organizaciones, con la llave de USUARIO ──────────────────────────────────

export type DatosLegalesOrganizacion = {
  nombre: string; // nombre comercial
  razonSocial: string; // SIN régimen societario
  regimenFiscal: string;
  codigoPostal: string;
  calle?: string;
  exterior?: string;
  interior?: string;
  colonia?: string;
  ciudad?: string;
  municipio?: string;
  estado?: string;
  correoSoporte?: string;
  telefono?: string;
  sitio?: string;
};

export type EstadoOrganizacion = {
  legal: boolean;
  rfc: string | null;
  certificado: boolean;
  serie: string | null;
  venceAt: string | null; // YYYY-MM-DD
  manifiesto: boolean;
  listaParaLive: boolean;
  /** Lo que Facturapi dice que falta, en sus palabras. */
  pendientes: string[];
};

function llaveUsuario(): string {
  const key = process.env.FACTURAPI_USER_KEY;
  if (!key) throw new Error("FACTURAPI_USER_KEY no configurada");
  return key;
}

export const organizaciones = {
  async crear(nombre: string): Promise<string> {
    const json = await llamar<{ id?: string }>(llaveUsuario(), "POST", "/organizations", { name: nombre.slice(0, 100) });
    if (!json.id) throw new Error("Facturapi no devolvió la organización.");
    return json.id;
  },

  async editarLegal(orgId: string, d: DatosLegalesOrganizacion): Promise<void> {
    await llamar(llaveUsuario(), "PUT", `/organizations/${orgId}/legal`, {
      name: d.nombre.slice(0, 100),
      legal_name: d.razonSocial.slice(0, 100),
      tax_system: d.regimenFiscal,
      ...(d.sitio ? { website: d.sitio } : {}),
      ...(d.correoSoporte ? { support_email: d.correoSoporte } : {}),
      ...(d.telefono ? { phone: d.telefono } : {}),
      address: {
        zip: d.codigoPostal,
        ...(d.calle ? { street: d.calle } : {}),
        ...(d.exterior ? { exterior: d.exterior } : {}),
        ...(d.interior ? { interior: d.interior } : {}),
        ...(d.colonia ? { neighborhood: d.colonia } : {}),
        ...(d.ciudad ? { city: d.ciudad } : {}),
        ...(d.municipio ? { municipality: d.municipio } : {}),
        ...(d.estado ? { state: d.estado } : {}),
        country: "MEX",
      },
    });
  },

  /**
   * Sube el CSD. Los dos archivos y la contraseña viajan a Facturapi EN MEMORIA,
   * en la misma petición, y no se escriben en ningún lado nuestro (D20 bis).
   */
  async subirCSD(orgId: string, cer: Blob, key: Blob, password: string): Promise<void> {
    const fd = new FormData();
    fd.set("cer", cer, "csd.cer");
    fd.set("key", key, "csd.key");
    fd.set("password", password);
    await llamar(llaveUsuario(), "PUT", `/organizations/${orgId}/certificate`, fd);
  },

  llaveTest: (orgId: string) => llamar<string>(llaveUsuario(), "GET", `/organizations/${orgId}/apikeys/test`),

  /** La Live sólo se ve COMPLETA al crearla: hay que guardarla cifrada en ese momento. */
  crearLlaveLive: (orgId: string) => llamar<string>(llaveUsuario(), "POST", `/organizations/${orgId}/apikeys/live`),

  /** Da de baja el CSD de la organización (DELETE /organizations/{id}/certificate): desde ese momento no sella nada. */
  async borrarCSD(orgId: string): Promise<void> {
    await llamar(llaveUsuario(), "DELETE", `/organizations/${orgId}/certificate`);
  },

  /**
   * Lo que Facturapi dice de la organización. La carta manifiesto NO tiene un
   * campo propio en la respuesta: se sabe firmada cuando ya no aparece entre los
   * `pending_steps` (tipo `manifiesto`). Antes esto leía un `manifest.signed`
   * que el esquema de Facturapi no trae, y habría dicho «sin firmar» siempre.
   */
  async leer(orgId: string): Promise<EstadoOrganizacion> {
    const json = await llamar<{
      is_production_ready?: boolean;
      pending_steps?: { type?: string; description?: string }[];
      certificate?: { has_certificate?: boolean; serial_number?: string; expires_at?: string };
      legal?: { tax_id?: string };
    }>(llaveUsuario(), "GET", `/organizations/${orgId}`);
    const pendientes = (json.pending_steps ?? []).map((p) => String(p.type ?? ""));
    return {
      legal: !!json.legal?.tax_id,
      rfc: json.legal?.tax_id ?? null,
      certificado: !!json.certificate?.has_certificate,
      serie: json.certificate?.serial_number ?? null,
      venceAt: json.certificate?.expires_at ? String(json.certificate.expires_at).slice(0, 10) : null,
      manifiesto: !pendientes.includes("manifiesto"),
      listaParaLive: !!json.is_production_ready,
      pendientes: (json.pending_steps ?? []).map((p) => String(p.description ?? p.type ?? "")),
    };
  },
};
