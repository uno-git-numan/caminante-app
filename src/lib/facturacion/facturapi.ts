// Cliente de Facturapi (PAC) — sin SDK, fetch directo a su REST v2.
// Timbra el CFDI 4.0 de INGRESO de NUMAN HUB. El CSD (sello) NO vive aquí: se
// sube UNA vez a la organización de Facturapi (solo Luis); nosotros solo mandamos
// los datos y Facturapi sella con ese CSD. La llave secreta (sk_test_… / sk_live…)
// vive en env (Vercel la pega Luis; .env.local la pega Claude cuando Luis la da).
//
// Precios al público INCLUYEN IVA 16% → mandamos price con tax_included:true y
// Facturapi desglosa subtotal/IVA. Método PUE (pago en una exhibición, ya pagado).

const API = "https://www.facturapi.io/v2";

// Clave de Producto/Servicio SAT por defecto para una experiencia:
// 90121501 «Servicios de organización de excursiones» (Anexo 20 v4.0). Antes era
// 90121500, que es la FAMILIA «Agentes de viajes», no un servicio. Cada
// experiencia puede traer la suya en `data.fiscal.claveProdServ`; la de la
// comisión de plataforma (Fase 3) es 80141628. Ver MAPA-FACTURACION.md §0.4.
export const CLAVE_PROD_SERV_EXPERIENCIA = process.env.FACTURAPI_CLAVE_PROD_SERV || "90121501";
const CLAVE_UNIDAD = process.env.FACTURAPI_CLAVE_UNIDAD || "E48"; // Unidad de servicio
// Forma de pago default: 04 = Tarjeta (Stripe). Transferencia = 03, efectivo = 01.
const FORMA_PAGO_DEFAULT = process.env.FACTURAPI_FORMA_PAGO || "04";

export function facturacionActiva(): boolean {
  return !!process.env.FACTURAPI_SECRET_KEY;
}

function auth(): string {
  const key = process.env.FACTURAPI_SECRET_KEY;
  if (!key) throw new Error("FACTURAPI_SECRET_KEY no configurada");
  // Facturapi = HTTP Basic con la llave como usuario y password vacío.
  return "Basic " + Buffer.from(`${key}:`).toString("base64");
}

export type ReceptorFiscal = {
  rfc: string;
  razonSocial: string;
  regimenFiscal: string; // c_RegimenFiscal
  usoCfdi: string; // c_UsoCFDI
  codigoPostal: string;
  email: string;
};

export type FacturaTimbrada = {
  id: string; // id interno de Facturapi
  uuid: string; // folio fiscal SAT
  total: number;
  subtotal: number;
  iva: number;
};

/** Una línea del CFDI. Los precios INCLUYEN IVA (así se cobran); Facturapi desglosa. */
export type Concepto = {
  descripcion: string;
  cantidad: number;
  /** Precio unitario CON IVA, en MXN. */
  precioUnitarioConIva: number;
  /** Descuento total de la línea CON IVA (p. ej. un código de descuento). */
  descuentoConIva?: number;
  claveProdServ?: string;
};

// Crea y timbra un CFDI de ingreso con uno o varios conceptos (viaje por
// persona, cada complemento con su clave, el descuento como `discount`).
export async function crearFacturaIngreso(input: {
  receptor: ReceptorFiscal;
  conceptos: Concepto[];
  /** c_FormaPago: 04 tarjeta · 03 transferencia · 01 efectivo. */
  formaPago?: string;
}): Promise<FacturaTimbrada> {
  const { receptor, conceptos } = input;
  if (!conceptos.length) throw new Error("La factura no tiene conceptos.");
  const totalConIva = conceptos.reduce((n, c) => n + c.cantidad * c.precioUnitarioConIva - (c.descuentoConIva ?? 0), 0);

  const body = {
    customer: {
      legal_name: receptor.razonSocial.trim(),
      tax_id: receptor.rfc.trim().toUpperCase(),
      tax_system: receptor.regimenFiscal.trim(),
      email: receptor.email.trim(),
      address: { zip: receptor.codigoPostal.trim() },
    },
    items: conceptos.map((c) => ({
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
    })),
    use: receptor.usoCfdi.trim(),
    payment_form: input.formaPago || FORMA_PAGO_DEFAULT,
    payment_method: "PUE",
  };

  const res = await fetch(`${API}/invoices`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => null)) as
    | { id?: string; uuid?: string; total?: number; message?: string }
    | null;

  if (!res.ok || !json?.id || !json?.uuid) {
    // Facturapi manda un `message` legible (ej. "El RFC no es válido").
    throw new Error(json?.message || `Facturapi HTTP ${res.status}`);
  }

  const total = typeof json.total === "number" ? json.total : totalConIva;
  const subtotal = Number((total / 1.16).toFixed(2));
  const iva = Number((total - subtotal).toFixed(2));
  return { id: json.id, uuid: json.uuid, total, subtotal, iva };
}

// Baja el XML o el PDF timbrado (para archivarlo en Storage / La Caja).
export async function descargarCFDI(facturapiId: string, formato: "xml" | "pdf"): Promise<ArrayBuffer> {
  const res = await fetch(`${API}/invoices/${facturapiId}/${formato}`, {
    headers: { Authorization: auth() },
  });
  if (!res.ok) throw new Error(`No se pudo bajar el ${formato.toUpperCase()} (HTTP ${res.status})`);
  return res.arrayBuffer();
}

// Envía el CFDI por correo al receptor (Facturapi lo manda con XML+PDF adjuntos).
export async function enviarCFDIPorCorreo(facturapiId: string, email?: string): Promise<void> {
  await fetch(`${API}/invoices/${facturapiId}/email`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify(email ? { email } : {}),
  }).catch(() => {});
}
