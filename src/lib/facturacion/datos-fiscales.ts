import "server-only";

// LA FICHA FISCAL DEL CLIENTE (0075): una por cuenta, editable, y lo que
// «Facturar» usa sin volver a teclear. Cada CFDI congela su copia en
// cfdi_invoices, así que editarla después no reescribe ninguna factura.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validarReceptor } from "@/lib/facturacion/emitir";
import type { ReceptorFiscal } from "@/lib/facturacion/facturapi";

export type DatosFiscales = ReceptorFiscal & { id: string; updatedAt: string };

export async function fetchDatosFiscales(userId: string): Promise<DatosFiscales | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("datos_fiscales")
    .select("id, rfc, razon_social, regimen_fiscal, uso_cfdi, codigo_postal, email, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    rfc: data.rfc as string,
    razonSocial: data.razon_social as string,
    regimenFiscal: data.regimen_fiscal as string,
    usoCfdi: data.uso_cfdi as string,
    codigoPostal: data.codigo_postal as string,
    email: data.email as string,
    updatedAt: data.updated_at as string,
  };
}

/** Valida con los catálogos del SAT y guarda (upsert por cuenta). */
export async function guardarDatosFiscales(
  userId: string,
  contactId: string | null,
  input: ReceptorFiscal,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const r: ReceptorFiscal = {
    rfc: input.rfc.trim().toUpperCase(),
    razonSocial: input.razonSocial.trim().slice(0, 254),
    regimenFiscal: input.regimenFiscal.trim(),
    usoCfdi: input.usoCfdi.trim() || "G03",
    codigoPostal: input.codigoPostal.trim(),
    email: input.email.trim().toLowerCase(),
  };
  const malo = validarReceptor(r);
  if (malo) return { ok: false, error: malo };
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("datos_fiscales").upsert(
    {
      user_id: userId,
      contact_id: contactId,
      rfc: r.rfc,
      razon_social: r.razonSocial,
      regimen_fiscal: r.regimenFiscal,
      uso_cfdi: r.usoCfdi,
      codigo_postal: r.codigoPostal,
      email: r.email,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
