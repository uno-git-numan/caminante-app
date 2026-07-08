"use server";

// Acciones admin de facturación. Cada una re-verifica isCurrentUserAdmin() (el
// gate del layout NO cubre server actions invocadas directo).
import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { enviarCFDIPorCorreo, facturacionActiva } from "@/lib/facturacion/facturapi";

// Reenvía por correo un CFDI ya timbrado (Facturapi adjunta XML+PDF).
export async function reenviarCFDI(formData: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  if (!facturacionActiva()) return;
  const invoiceId = String(formData.get("invoiceId") ?? "").trim();
  if (!invoiceId) return;

  const sb = createSupabaseAdminClient();
  const { data: inv } = await sb
    .from("cfdi_invoices")
    .select("facturapi_id, email, status")
    .eq("id", invoiceId)
    .maybeSingle();
  if (inv?.status === "stamped" && inv.facturapi_id) {
    await enviarCFDIPorCorreo(inv.facturapi_id as string, (inv.email as string) || undefined);
  }
  revalidatePath("/caminante/admin/facturacion");
}
