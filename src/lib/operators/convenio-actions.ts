"use server";

// Convenio y datos fiscales del operador.
//
// Es lo que faltaba para poder cerrar un alta de verdad: las columnas
// `commission_pct` y `legal` existían en la base desde la 0016/0030, pero no
// había dónde capturarlas. Sin ellas no se le puede facturar al operador, ni él
// a nosotros, ni el panel puede calcular su neto.
//
// ⚠️ `commission_pct` es el % que RETIENE LA PLATAFORMA por venta, y se congela
// en cada reserva al momento de vender (0016). Cambiarlo aquí NO reescribe las
// ventas pasadas — a propósito: lo cobrado se acordó con el % de ese día.
// Aplica de aquí en adelante.
//
// ⚠️ Vacío ≠ cero. Dejarlo en blanco significa «todavía no se acuerda» y el
// panel muestra «por definir» y se niega a proponer un neto. Ponerlo en 0
// significa «no cobramos comisión», que es una afirmación distinta y explícita.

import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ConvenioResult = { ok: boolean; error?: string };

/**
 * Lo que va en `operators.legal`: la entidad que RESPONDE por el viaje en el
 * deslinde.
 *
 * ⚠️ SIN `rfc` ni `razonSocial` desde la 0038. Esos son del EMISOR del CFDI y
 * viven en las columnas planas (`rfc`, `razon_social`, junto con el régimen y el
 * CP fiscal, que el jsonb nunca tuvo y sin los cuales no se puede timbrar).
 * Tenerlos en dos casas ya costó: Kéntro tenía su RFC aquí y las planas en NULL,
 * así que `operadorListo` lo reportaba como faltante estando capturado.
 *
 * ⚠️ Desde el 9 nov 2026 este formulario YA NO los escribe: salen de la
 * constancia que confirmó el SAT (`fiscal-de-csf.ts`). Escribirlos aquí, con
 * un campo vacío convertido en NULL, borraba lo que la constancia llenó.
 */
export type OperadorLegal = {
  domicilio: string;
  responsable: string;
};

const txt = (fd: FormData, k: string, max = 300) => String(fd.get(k) ?? "").trim().slice(0, max);

export async function saveOperatorConvenio(formData: FormData): Promise<ConvenioResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "No autorizado." };
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Falta el operador." };

  const crudo = String(formData.get("commissionPct") ?? "").trim();
  let commissionPct: number | null = null;
  if (crudo !== "") {
    const n = Number(crudo);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      return { ok: false, error: "La comisión va entre 0 y 100." };
    }
    commissionPct = n;
  }

  const legal: OperadorLegal = {
    domicilio: txt(formData, "domicilio", 400),
    responsable: txt(formData, "responsable", 160),
  };
  const todoVacio = !legal.domicilio && !legal.responsable;

  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("operators")
    .update({
      commission_pct: commissionPct,
      legal: todoVacio ? null : legal,
    })
    .eq("id", id)
    .select("slug")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/caminante/admin/operadores");
  revalidatePath("/caminante/admin/recursos");
  revalidatePath(`/caminante/operador/${(data?.slug as string) ?? ""}`);
  return { ok: true };
}
