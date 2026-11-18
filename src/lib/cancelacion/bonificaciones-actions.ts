"use server";

// REGISTRAR QUE UNA BONIFICACIÓN YA SE PAGÓ (D23 §5).
//
// La transferencia la hace Luis desde su banco; aquí sólo se captura lo que
// prueba que se hizo: fecha, importe, últimos 4 dígitos de la cuenta destino y
// clave de rastreo. La cuenta completa del cliente no se pide ni se guarda.
// Sólo la casa: el dinero sale de su cuenta.

import { revalidatePath } from "next/cache";
import { alcanceActual, esOperador } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function registrarPagoBonificacion(
  id: string,
  i: { fecha: string; monto: number; ultimos4: string; claveRastreo: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const alcance = await alcanceActual();
  if (!alcance) return { ok: false, error: "No autorizado. Inicia sesión." };
  if (esOperador(alcance)) return { ok: false, error: "Las bonificaciones las paga Caminante: el dinero sale de su cuenta." };

  const fecha = (i.fecha || "").trim();
  const hoy = new Date(Date.now() - 6 * 3600_000).toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { ok: false, error: "Pon la fecha de la transferencia." };
  if (fecha > hoy) return { ok: false, error: "La fecha de la transferencia no puede ser futura." };
  const ultimos4 = (i.ultimos4 || "").trim();
  if (!/^\d{4}$/.test(ultimos4)) return { ok: false, error: "Pon sólo los últimos 4 dígitos de la cuenta a la que transferiste." };
  const clave = (i.claveRastreo || "").trim();
  if (!clave) return { ok: false, error: "Pon la clave de rastreo de la transferencia." };
  const monto = Math.round(Number(i.monto) * 100) / 100;
  if (!(monto > 0)) return { ok: false, error: "Pon el importe transferido." };

  const sb = createSupabaseAdminClient();
  const { data: b } = await sb.from("bonificaciones").select("id, monto_mxn, estado").eq("id", id).maybeSingle();
  if (!b) return { ok: false, error: "No se encontró esa bonificación." };
  if (b.estado !== "por-pagar") return { ok: false, error: "Esa bonificación ya está registrada como pagada." };
  // La ley fija el 20 % como mínimo (LFPC 92 Ter): se puede pagar más, no menos.
  if (monto < Number(b.monto_mxn) - 0.01) {
    return { ok: false, error: `La bonificación es de $${Number(b.monto_mxn).toLocaleString("es-MX")} como mínimo; el importe capturado es menor.` };
  }

  const supabase = await createSupabaseServerClient();
  const { data: u } = await supabase.auth.getUser();
  const { data: hecha, error } = await sb
    .from("bonificaciones")
    .update({
      estado: "pagada",
      pagada_el: fecha,
      pagado_real_mxn: monto,
      cuenta_ultimos4: ultimos4,
      clave_rastreo: clave,
      registrada_por: u.user?.id ?? null,
      registrada_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("estado", "por-pagar")
    .select("id");
  if (error) return { ok: false, error: `No se pudo registrar: ${error.message}` };
  if (!hecha?.length) return { ok: false, error: "Esa bonificación ya está registrada como pagada." };

  revalidatePath("/caminante/admin/pagos");
  return { ok: true };
}
