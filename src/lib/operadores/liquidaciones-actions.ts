"use server";

// REGISTRAR UNA LIQUIDACIÓN — el dinero ya salió, aquí se escribe.
//
// ⚠️ ESTO NO TRANSFIERE NADA. Luis mueve el dinero por el banco; esta acción
// sólo apunta que se movió, con qué referencia y qué pagos cubre. Es la regla
// de la casa: Claude calcula, concilia y prepara; las transferencias las hace
// él. Una pantalla que dijera «Pagar» prometería algo que no hace.
//
// ⚠️ Y SÓLO LA CASA. El dinero sale de la cuenta de Caminante: una operadora no
// puede declararse pagada a sí misma.

import { revalidatePath } from "next/cache";
import { alcanceActual, esOperador } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saldosDeOperadoras } from "./liquidaciones";

const RUTA = "/caminante/admin/plataforma/recursos/liquidaciones";

export type ResultadoLiquidacion =
  | { ok: true; monto: number; pagos: number }
  | { ok: false; error: string };

async function soloLaCasa(): Promise<{ ok: true; quien: string | null } | { ok: false; error: string }> {
  const alcance = await alcanceActual();
  if (!alcance) return { ok: false, error: "No autorizado. Inicia sesión." };
  if (esOperador(alcance)) {
    return { ok: false, error: "Las liquidaciones las registra Caminante: el dinero sale de su cuenta." };
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return { ok: true, quien: data.user?.email ?? null };
}

/**
 * Apunta una transferencia ya hecha, y qué pagos salda.
 *
 * `pagos` son los `payment_id` que cubre. Se exige la lista en vez de tomar
 * «todo lo pendiente»: si el día de la transferencia entró una venta nueva, un
 * «todo» silencioso la marcaría pagada sin haberla pagado.
 */
export async function registrarLiquidacion(entrada: {
  operatorId: string;
  montoMxn: number;
  pagadoEl: string;
  metodo?: "transferencia" | "efectivo" | "otro";
  referencia?: string | null;
  notas?: string | null;
  pagos: string[];
  /**
   * Por qué la transferencia difiere de lo que saldan esos cobros.
   *
   * ⚠️ SIN ESTO, UNA DIFERENCIA NO SE REGISTRA. Es la pieza que faltaba cuando
   * la primera liquidación real no cuadró: Luis había acordado menos comisión
   * con Nomádika por ser su primera experiencia, así que le transfirió $1,328.33
   * más de lo calculado. Las dos salidas malas eran reescribir la comisión
   * congelada —que es inmutable a propósito (0032)— o forzar el monto en
   * silencio. La buena es ésta: se registra la diferencia y se dice por qué.
   */
  diferenciaMotivo?: string | null;
}): Promise<ResultadoLiquidacion> {
  const auth = await soloLaCasa();
  if (!auth.ok) return auth;

  const monto = Math.round((entrada.montoMxn || 0) * 100) / 100;
  if (!(monto > 0)) return { ok: false, error: "El monto tiene que ser mayor que cero." };
  if (!entrada.pagadoEl?.trim()) {
    return { ok: false, error: "Falta la fecha en que se movió el dinero." };
  }
  if (!entrada.pagos.length) {
    return { ok: false, error: "Elige qué pagos cubre esta transferencia." };
  }

  // ⚠️ SE VUELVE A DERIVAR EL PENDIENTE, no se le cree al formulario. Entre que
  // la pantalla se dibujó y alguien dio clic pudo llegar un reembolso, o otra
  // pestaña pudo liquidar los mismos pagos. Lo que el navegador manda es una
  // intención; lo que se escribe se calcula aquí.
  const [saldo] = await saldosDeOperadoras(entrada.operatorId);
  if (!saldo) return { ok: false, error: "No encontramos a esa operadora." };

  const disponibles = new Map(saldo.pendientes.map((p) => [p.paymentId, p.netoMxn]));
  const ajenos = entrada.pagos.filter((id) => !disponibles.has(id));
  if (ajenos.length) {
    return {
      ok: false,
      error: `${ajenos.length} de los pagos que elegiste ya no están pendientes —alguien los liquidó o se devolvieron mientras tenías la pantalla abierta—. Vuelve a cargarla.`,
    };
  }

  const neto = Math.round(entrada.pagos.reduce((a, id) => a + (disponibles.get(id) ?? 0), 0) * 100) / 100;

  // ⚠️ SI EL MONTO NO CUADRA, NO SE AJUSTA Y NO SE CALLA: SE DECLARA.
  //
  // El monto puede diferir legítimamente de lo calculado —una comisión menor
  // acordada, un adelanto, una retención— y la primera liquidación real fue
  // justo uno de esos casos. Lo que no puede pasar es que difiera en silencio:
  // un monto que no corresponde a lo que salda, registrado sin explicación, es
  // un descuadre que aparece meses después conciliando.
  //
  // Así que la diferencia se acepta con su motivo y sin él no. La base lo exige
  // igual (check `liquidacion_diferencia_explicada`, 0067), para que no dependa
  // de que esta acción sea el único camino.
  const diferencia = Math.round((monto - neto) * 100) / 100;
  const motivo = entrada.diferenciaMotivo?.trim() ?? "";
  if (Math.abs(diferencia) > 0.01 && motivo.length < 10) {
    return {
      ok: false,
      error: `Esos cobros saldan $${neto.toLocaleString("es-MX", { minimumFractionDigits: 2 })} y la transferencia fue de $${monto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}: una diferencia de $${Math.abs(diferencia).toLocaleString("es-MX", { minimumFractionDigits: 2 })}. Se puede registrar, pero hay que decir por qué —una comisión menor acordada, un adelanto, un ajuste—. Sin motivo no queda constancia de si fue un acuerdo o un dedazo.`,
    };
  }

  const sb = createSupabaseAdminClient();
  const { data: liq, error } = await sb
    .from("operator_liquidaciones")
    .insert({
      operator_id: entrada.operatorId,
      monto_mxn: monto,
      metodo: entrada.metodo ?? "transferencia",
      referencia: entrada.referencia?.trim() || null,
      pagado_el: entrada.pagadoEl,
      notas: entrada.notas?.trim() || null,
      diferencia_mxn: Math.abs(diferencia) > 0.01 ? diferencia : 0,
      diferencia_motivo: Math.abs(diferencia) > 0.01 ? motivo : null,
      registrado_por: auth.quien,
    })
    .select("id")
    .single();
  if (error || !liq) {
    // 23505 = la referencia bancaria ya está registrada (índice único, 0066).
    return {
      ok: false,
      error:
        error?.code === "23505"
          ? "Esa referencia bancaria ya está registrada: la transferencia ya se había apuntado."
          : `No se pudo registrar: ${error?.message ?? "error desconocido"}`,
    };
  }
  const liquidacionId = (liq as { id: string }).id;

  // Los vínculos van DESPUÉS y con su neto congelado. Si alguno choca contra el
  // índice único —otra pestaña ganó la carrera— se deshace la liquidación
  // entera: media liquidación es peor que ninguna, porque el monto diría una
  // cosa y los pagos otra.
  const { error: errVinc } = await sb.from("operator_liquidacion_pagos").insert(
    entrada.pagos.map((id) => ({
      liquidacion_id: liquidacionId,
      payment_id: id,
      neto_mxn: disponibles.get(id) ?? 0,
    })),
  );
  if (errVinc) {
    await sb.from("operator_liquidaciones").delete().eq("id", liquidacionId);
    return {
      ok: false,
      error:
        errVinc.code === "23505"
          ? "Alguno de esos pagos se liquidó hace un instante desde otra pantalla. No se registró nada; vuelve a cargar."
          : `No se pudo ligar los pagos: ${errVinc.message}`,
    };
  }

  revalidatePath(RUTA);
  return { ok: true, monto, pagos: entrada.pagos.length };
}

/**
 * Cancela una liquidación capturada mal.
 *
 * No se borra: se cancela con motivo, y el trigger de la 0066 libera sus pagos
 * para que se puedan volver a liquidar.
 */
export async function cancelarLiquidacion(
  liquidacionId: string,
  motivo: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await soloLaCasa();
  if (!auth.ok) return auth;
  if (!motivo.trim()) {
    return { ok: false, error: "Di por qué se cancela: sin motivo, en un mes nadie sabrá qué pasó." };
  }
  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("operator_liquidaciones")
    .update({
      cancelada_at: new Date().toISOString(),
      cancelada_por: auth.quien ?? "la casa",
      cancelada_motivo: motivo.trim().slice(0, 500),
    })
    .eq("id", liquidacionId)
    .is("cancelada_at", null);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  return { ok: true };
}
