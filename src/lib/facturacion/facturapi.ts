// Cliente de Facturapi (PAC) — sin SDK, fetch directo a su REST v2.
//
// DOS llaves, dos papeles:
//   · La llave de USUARIO (`FACTURAPI_USER_KEY`, sk_user_…) administra
//     ORGANIZACIONES: crearlas, mandar datos fiscales, subir el CSD, sacar sus
//     llaves. Una organización por emisor: NUMAN HUB, DRUIDAS, cada operadora.
//   · La llave de una ORGANIZACIÓN (sk_live_… / sk_test_…) emite: recibos,
//     facturas, factura global. Viene de `lib/facturacion/emisor.ts`, que sabe
//     de quién es la venta.
//
// El flujo es el de «recibos» de Facturapi (MAPA-FACTURACION.md §0.9): cada
// pago → RECIBO (nota de venta con PDF); si el cliente pide factura → el recibo
// se FACTURA a su RFC; lo que quede abierto al cerrar el mes → FACTURA GLOBAL
// a público en general. El CSD nunca pasa por aquí más que en la subida: lo
// guarda Facturapi y sella con él.
//
// Precios al público INCLUYEN IVA 16% → `tax_included: true` y Facturapi
// desglosa. Método PUE (se paga antes del viaje).

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

/** ¿Hay con qué emitir? La llave de la casa (su organización) o la de usuario. */
export function facturacionActiva(): boolean {
  return !!process.env.FACTURAPI_SECRET_KEY;
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
};

export type FacturaTimbrada = {
  id: string; // id interno de Facturapi
  uuid: string; // folio fiscal SAT
  total: number;
  subtotal: number;
  iva: number;
};

export type Recibo = {
  id: string;
  key: string;
  status: "open" | "canceled" | "invoiced_to_customer" | "invoiced_globally";
  total: number;
  expiresAt: string;
  selfInvoiceUrl: string | null;
  invoice: string | null;
};

const items = (conceptos: Concepto[]) =>
  conceptos.map((c) => ({
    quantity: c.cantidad,
    ...(c.descuentoConIva && c.descuentoConIva > 0 ? { discount: Number(c.descuentoConIva.toFixed(2)) } : {}),
    product: {
      description: c.descripcion,
      product_key: c.claveProdServ || CLAVE_PROD_SERV_EXPERIENCIA,
      unit_key: CLAVE_UNIDAD,
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

function recibo(json: Json): Recibo {
  return {
    id: String(json.id),
    key: String(json.key ?? ""),
    status: (json.status as Recibo["status"]) ?? "open",
    total: Number(json.total ?? 0),
    expiresAt: String(json.expires_at ?? ""),
    selfInvoiceUrl: (json.self_invoice_url as string | undefined) ?? null,
    invoice: (json.invoice as string | null | undefined) ?? null,
  };
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

    /** Recibo (nota de venta) de un pago. `idempotencyKey` = id del pago: dos webhooks no hacen dos recibos. */
    async crearRecibo(input: { conceptos: Concepto[]; formaPago?: string; fecha?: string; idempotencyKey: string }): Promise<Recibo> {
      if (!input.conceptos.length) throw new Error("El recibo no tiene conceptos.");
      const json = await llamar<Json>(key, "POST", "/receipts", {
        items: items(input.conceptos),
        payment_form: input.formaPago || FORMA_PAGO_DEFAULT,
        ...(input.fecha ? { date: input.fecha } : {}),
        idempotency_key: input.idempotencyKey,
      });
      return recibo(json);
    },

    async leerRecibo(receiptId: string): Promise<Recibo> {
      return recibo(await llamar<Json>(key, "GET", `/receipts/${receiptId}`));
    },

    /** El cliente pidió factura: el recibo se factura a su RFC. */
    async facturarRecibo(receiptId: string, receptor: ReceptorFiscal, totalEsperado: number): Promise<FacturaTimbrada> {
      const json = await llamar<{ id?: string; uuid?: string; total?: number }>(key, "POST", `/receipts/${receiptId}/invoice`, {
        customer: customer(receptor),
        use: receptor.usoCfdi.trim(),
      });
      return desglose(json, totalEsperado);
    },

    /** Manda el recibo (PDF + botón de facturar) con la plantilla de Facturapi. */
    async enviarReciboPorCorreo(receiptId: string, email: string): Promise<void> {
      await llamar(key, "POST", `/receipts/${receiptId}/email`, { email });
    },

    descargarReciboPDF: (receiptId: string) => bajar(key, `/receipts/${receiptId}/pdf`, "el PDF del recibo"),

    /** Factura global del periodo: todos los recibos `open` entre `desde` y `hasta` (ISO). null si no había ninguno. */
    async facturaGlobal(input: { desde: string; hasta: string; periodicidad: "day" | "week" | "fortnight" | "month" | "two_months"; mes: string; anio: number }): Promise<FacturaTimbrada | null> {
      const json = await llamar<{ id?: string; uuid?: string; total?: number } | null>(key, "POST", "/receipts/global-invoice", {
        from: input.desde,
        to: input.hasta,
        periodicity: input.periodicidad,
        months: input.mes,
        year: input.anio,
        limit_to_max_receipts: true,
      });
      if (!json || !json.id) return null;
      return desglose(json, Number(json.total ?? 0));
    },

    /** Recibos de un periodo con cierto estado (para cuadrar la global contra `payments`). */
    async listarRecibos(q: { desde: string; hasta: string; status: Recibo["status"]; limit?: number }): Promise<Recibo[]> {
      const params = new URLSearchParams({ "date[gte]": q.desde, "date[lte]": q.hasta, status: q.status, limit: String(q.limit ?? 50) });
      const json = await llamar<{ data?: Json[] }>(key, "GET", `/receipts?${params}`);
      return (json.data ?? []).map(recibo);
    },

    descargarCFDI: (facturapiId: string, formato: "xml" | "pdf") => bajar(key, `/invoices/${facturapiId}/${formato}`, `el ${formato.toUpperCase()}`),

    async enviarCFDIPorCorreo(facturapiId: string, email?: string): Promise<void> {
      await llamar(key, "POST", `/invoices/${facturapiId}/email`, email ? { email } : {}).catch(() => {});
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

  /** Sube el CSD. La contraseña viaja a Facturapi y no se guarda en ningún lado nuestro. */
  async subirCSD(orgId: string, cer: Blob, key: Blob, password: string): Promise<void> {
    const fd = new FormData();
    fd.set("cer", cer, "csd.cer");
    fd.set("key", key, "csd.key");
    fd.set("password", password);
    await llamar(llaveUsuario(), "PUT", `/organizations/${orgId}/certificate`, fd);
  },

  /** Recibos: la global se arma por mes y el recibo se puede facturar hasta el último día del periodo. */
  async configurarRecibos(orgId: string): Promise<void> {
    await llamar(llaveUsuario(), "PUT", `/organizations/${orgId}/receipts`, {
      periodicity: "month",
      duration_days: 0,
    });
  },

  llaveTest: (orgId: string) => llamar<string>(llaveUsuario(), "GET", `/organizations/${orgId}/apikeys/test`),

  /** La Live sólo se ve COMPLETA al crearla: hay que guardarla cifrada en ese momento. */
  crearLlaveLive: (orgId: string) => llamar<string>(llaveUsuario(), "POST", `/organizations/${orgId}/apikeys/live`),

  async leer(orgId: string): Promise<{ certificado: boolean; legal: boolean; manifiesto: boolean }> {
    const json = await llamar<{ certificate?: { has_certificate?: boolean }; legal?: { tax_id?: string }; manifest?: { signed?: boolean } }>(
      llaveUsuario(),
      "GET",
      `/organizations/${orgId}`,
    );
    return {
      certificado: !!json.certificate?.has_certificate,
      legal: !!json.legal?.tax_id,
      manifiesto: !!json.manifest?.signed,
    };
  },
};
