// LA CUOTA DE ADMISIÓN DE LA OPERADORA (11 nov 2026).
//
// Al activar Connect en LIVE, NUMAN aceptó ante Stripe el modelo B («Buyers
// will purchase from you», el de Airbnb) y con él Radar Standard: MX$20.00 por
// cada cuenta conectada. Luis: «esos 20 cóbralos de costo de primera admisión…
// lo descontamos del primer payout que les mandemos. Sí se tiene que agregar
// como cláusula» (la cláusula la redacta la sesión legal: pregunta i1 de
// design/legal/BITACORA-PARA-LEGAL.md).
//
// ── CÓMO SE DESCUENTA ───────────────────────────────────────────────────────
//
// En un cargo con destino lo que NUMAN «le manda» a la operadora es la
// TRANSFERENCIA que Stripe crea con la venta. La admisión se cobra revirtiendo
// $20 de la primera de esas transferencias (`transfers.createReversal`).
//
// ⚠️ NO SE MEZCLA CON LA COMISIÓN. Sumarla al `application_fee_amount` habría
// sido más corto y habría ensuciado tres cosas que hoy cuadran al centavo: la
// comisión congelada (`platform_fee_mxn`), lo retenido (`fee_retenido_mxn`,
// que es el total del CFDI de la comisión) y los candados del tope del 20 %.
// La admisión es un movimiento aparte, con su propia fila y su propio id de
// Stripe, y así se concilia sola.
//
// ⚠️ UNA SOLA VEZ, Y LO GARANTIZA LA BASE. `operator_admisiones` tiene una fila
// por operadora (PK). Si dos ventas se pagan en el mismo segundo, sólo una
// inserta; la otra ve la fila y no cobra.
//
// ⚠️ NUNCA TUMBA UN PAGO. Esto corre en el webhook, después de registrar la
// venta. Si algo falla, la fila queda «fallida» con el error escrito y la
// siguiente venta lo reintenta. Un pago perdido por cobrar $20 sería absurdo.

import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

/** La cuota, en pesos. Es lo que Stripe le cobra a NUMAN por cuenta conectada (Radar Standard, MX$20.00). */
export const ADMISION_MXN = 20;

/** Concepto con el que la reversión queda marcada en Stripe, para reconocerla al reintentar. */
export const CONCEPTO_ADMISION = "admision_operadora";

/** Una «pendiente» más vieja que esto se da por abandonada (el proceso murió a media reversión). */
const PENDIENTE_ABANDONADA_MS = 60 * 60 * 1000;

export type EstadoAdmision = "pendiente" | "cobrada" | "fallida";

export type FilaAdmision = {
  operator_id: string;
  monto_mxn: number | string;
  estado: EstadoAdmision;
  transfer_id: string | null;
  reversal_id: string | null;
  updated_at: string;
  cobrada_at: string | null;
};

export type ResultadoAdmision =
  | { resultado: "cobrada"; reversalId: string }
  | { resultado: "ya_cobrada" }
  /** Otra venta la está cobrando ahora mismo. */
  | { resultado: "ocupada" }
  /** La venta no trae lo necesario (no fue por Connect, o sin transferencia). */
  | { resultado: "sin_datos" }
  /** La 0078 no está aplicada: no se cobra nada y se dice. */
  | { resultado: "sin_tabla" }
  | { resultado: "fallida"; error: string };

const n = (v: unknown): number => {
  const x = typeof v === "string" ? Number(v) : (v as number);
  return typeof x === "number" && Number.isFinite(x) ? x : 0;
};

/** A centavos de Stripe, sin errores de punto flotante. */
export const centavos = (mxn: number): number => Math.round(mxn * 100);

/**
 * Lo que se le descontó de verdad. SOLO «cobrada»: una pendiente o fallida no
 * salió de su dinero, y restarla le reportaría $20 menos de lo que su banco
 * va a confirmar.
 */
export function admisionDescontada(fila: Pick<FilaAdmision, "estado" | "monto_mxn"> | null | undefined): number {
  return fila?.estado === "cobrada" ? n(fila.monto_mxn) : 0;
}

/** ¿Una «pendiente» se quedó colgada? (El proceso que la pidió murió.) */
export function pendienteAbandonada(fila: Pick<FilaAdmision, "estado" | "updated_at">, ahora: Date): boolean {
  if (fila.estado !== "pendiente") return false;
  const t = Date.parse(fila.updated_at);
  return Number.isFinite(t) && ahora.getTime() - t > PENDIENTE_ABANDONADA_MS;
}

const sinTabla = (code: string | undefined) => code === "PGRST205" || code === "42P01";

type Venta = { operatorId: string | null; paymentId: string | null; transferId: string | null };

/**
 * Cobra la admisión si a esta operadora todavía no se le ha cobrado.
 * Se llama después de registrar una venta por Connect. Nunca lanza.
 */
export async function cobrarAdmisionSiToca(
  sb: SupabaseClient,
  stripe: Pick<Stripe, "transfers">,
  venta: Venta,
  ahora: Date = new Date(),
): Promise<ResultadoAdmision> {
  const { operatorId, paymentId, transferId } = venta;
  if (!operatorId || !transferId) return { resultado: "sin_datos" };

  try {
    const { data, error } = await sb
      .from("operator_admisiones")
      .select("operator_id, monto_mxn, estado, transfer_id, reversal_id, updated_at, cobrada_at")
      .eq("operator_id", operatorId)
      .maybeSingle();
    if (error) {
      if (sinTabla(error.code)) return { resultado: "sin_tabla" };
      return { resultado: "fallida", error: error.message };
    }
    const fila = data as FilaAdmision | null;
    if (fila?.estado === "cobrada") return { resultado: "ya_cobrada" };

    const marca = { updated_at: ahora.toISOString() };
    let monto = ADMISION_MXN;

    if (!fila) {
      // Primera vez: la PK decide quién cobra.
      const { error: insErr } = await sb.from("operator_admisiones").insert({
        operator_id: operatorId,
        monto_mxn: ADMISION_MXN,
        estado: "pendiente",
        payment_id: paymentId,
        transfer_id: transferId,
        ...marca,
      });
      if (insErr) {
        if (insErr.code === "23505") return { resultado: "ocupada" };
        if (sinTabla(insErr.code)) return { resultado: "sin_tabla" };
        return { resultado: "fallida", error: insErr.message };
      }
    } else {
      monto = n(fila.monto_mxn) || ADMISION_MXN;
      const abandonada = pendienteAbandonada(fila, ahora);
      if (fila.estado === "pendiente" && !abandonada) return { resultado: "ocupada" };

      // Una pendiente abandonada pudo haber llegado a Stripe antes de morir.
      // Antes de pedir otra, se busca la que quizá ya existe: cobrar dos veces
      // por un proceso que se cayó sería peor que no cobrar.
      if (abandonada && fila.transfer_id) {
        const previa = await reversionExistente(stripe, fila.transfer_id);
        if (previa) {
          await sb
            .from("operator_admisiones")
            .update({ estado: "cobrada", reversal_id: previa, cobrada_at: ahora.toISOString(), error: null, ...marca })
            .eq("operator_id", operatorId);
          return { resultado: "ya_cobrada" };
        }
      }

      // Reclamar el reintento con una condición sobre el estado que se leyó:
      // si otra venta ya lo reclamó, no se afecta ninguna fila y ésta se va.
      const { data: reclamada, error: updErr } = await sb
        .from("operator_admisiones")
        .update({ estado: "pendiente", payment_id: paymentId, transfer_id: transferId, error: null, ...marca })
        .eq("operator_id", operatorId)
        .eq("estado", fila.estado)
        .eq("updated_at", fila.updated_at)
        .select("operator_id");
      if (updErr) return { resultado: "fallida", error: updErr.message };
      if (!reclamada || reclamada.length === 0) return { resultado: "ocupada" };
    }

    try {
      const rev = await stripe.transfers.createReversal(
        transferId,
        {
          amount: centavos(monto),
          description: "Cuota de admisión Caminante (una sola vez)",
          metadata: { concepto: CONCEPTO_ADMISION, operator_id: operatorId, payment_id: paymentId ?? "" },
        },
        { idempotencyKey: `admision-${operatorId}-${transferId}` },
      );
      await sb
        .from("operator_admisiones")
        .update({ estado: "cobrada", reversal_id: rev.id, cobrada_at: ahora.toISOString(), error: null, ...marca })
        .eq("operator_id", operatorId);
      return { resultado: "cobrada", reversalId: rev.id };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await sb
        .from("operator_admisiones")
        .update({ estado: "fallida", error: msg.slice(0, 500), ...marca })
        .eq("operator_id", operatorId);
      return { resultado: "fallida", error: msg };
    }
  } catch (e) {
    return { resultado: "fallida", error: e instanceof Error ? e.message : String(e) };
  }
}

/** ¿Esta transferencia ya trae una reversión de admisión? Devuelve su id. */
async function reversionExistente(stripe: Pick<Stripe, "transfers">, transferId: string): Promise<string | null> {
  try {
    const lista = await stripe.transfers.listReversals(transferId, { limit: 100 });
    const hallada = lista.data.find((r) => r.metadata?.concepto === CONCEPTO_ADMISION);
    return hallada?.id ?? null;
  } catch {
    return null;
  }
}
