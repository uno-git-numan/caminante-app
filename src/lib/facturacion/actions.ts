"use server";

// Autofactura PÚBLICA: emite el CFDI de un pago ya cobrado para quien compró sin
// cuenta. Segura sin login: solo actúa sobre un paymentId cuyo token firmado
// coincide (lo genera la pantalla de éxito o el lookup correo+monto). Quien tiene
// cuenta factura desde Mi espacio con su ficha guardada
// (lib/perfil/facturacion-actions.ts). Las dos puertas timbran por el mismo
// núcleo, lib/facturacion/emitir.ts.

import { redirect } from "next/navigation";
import { tokenValido } from "@/lib/facturacion/token";
import { facturacionActiva } from "@/lib/facturacion/facturapi";
import { emitirCFDIDePago } from "@/lib/facturacion/emitir";

function volver(paymentId: string, token: string, error: string): never {
  redirect(
    `/caminante/facturacion?p=${encodeURIComponent(paymentId)}&t=${encodeURIComponent(
      token,
    )}&error=${encodeURIComponent(error)}`,
  );
}

export async function emitirCFDI(formData: FormData): Promise<void> {
  const paymentId = String(formData.get("paymentId") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();

  // 0 · El token debe corresponder a este pago (prueba de titularidad).
  if (!paymentId || !tokenValido(paymentId, token)) {
    redirect("/caminante/facturacion?error=sesion");
  }
  if (!facturacionActiva()) volver(paymentId, token, "La facturación aún no está disponible.");

  // 1 · El núcleo valida la ficha con los catálogos, arma los conceptos, timbra,
  //     archiva y manda el correo (lib/facturacion/emitir.ts).
  const r = await emitirCFDIDePago({
    paymentId,
    receptor: {
      rfc: String(formData.get("rfc") ?? ""),
      razonSocial: String(formData.get("razonSocial") ?? ""),
      regimenFiscal: String(formData.get("regimen") ?? ""),
      usoCfdi: String(formData.get("uso") ?? ""),
      codigoPostal: String(formData.get("cp") ?? ""),
      email: String(formData.get("email") ?? ""),
    },
  });
  if (!r.ok) volver(paymentId, token, r.error);

  redirect(`/caminante/facturacion?p=${encodeURIComponent(paymentId)}&t=${encodeURIComponent(token)}&ok=1`);
}
