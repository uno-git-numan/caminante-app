"use server";

// EL BOTÓN DE REEMBOLSO — devolver dinero desde Caminante, sin abrir Stripe.
//
// Dos caminos, misma mecánica:
//   · Una persona se baja  → `reembolsarPersona`
//   · Se cae la salida     → `cancelarSalidaYReembolsar` (todos + cerrar la fecha)
//
// ⚠️ EL ORDEN IMPORTA Y NO ES CAPRICHO. Aquí NO se cancela la reserva ni se
// manda el correo: solo se apunta la intención en `reembolsos` y se le pide a
// Stripe la devolución. Cancelar y avisar ocurre cuando Stripe CONFIRMA, en el
// webhook (`finalizeRefund`). Si se hiciera al revés, un refund rechazado
// —tarjeta expirada, disputa abierta, saldo insuficiente— dejaría a la persona
// con un correo que dice «te devolvimos tu dinero» y un lugar liberado que
// nadie devolvió. El aviso tiene que ir detrás del dinero, no delante.
//
// ⚠️ SOLO LA CASA. El dinero sale de la cuenta de NUMAN HUB, no de la del
// operador. Un operador puede ver su salida y perseguir firmas; devolver
// dinero es de quien lo recibió.

import { revalidatePath } from "next/cache";
import { alcanceActual, esOperador } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripeServerClient, toStripeAmount } from "@/lib/payments/stripe";
import { cerrarDesdeStripe, marcarCerradoSinCargo } from "@/lib/payments/refunds";
import { admisionDevuelta } from "@/lib/operadores/admision";
import {
  baseDelCaso,
  esFuerzaMayor,
  proponerReembolso,
  type CausaCancelacion,
  type PropuestaReembolso,
  type ReglaReembolso,
} from "@/lib/cancelacion/politica";
import { crearBonificaciones } from "@/lib/cancelacion/bonificaciones";
import { documentoDeFuerzaMayor } from "@/lib/cancelacion/documento";
import { clausulaDeReserva, puedeCancelarPorCupo } from "@/lib/cancelacion/cupo-minimo";
import { avisarCancelacionPorCupo, COLS_CLAUSULA, ESTADOS_PAGADOS, paraClausula, type FilaDeSalida } from "@/lib/cancelacion/cupo-servidor";
import { fechaConAnio, type ClausulaMinimo } from "@/lib/cancelacion/politica";

export type ResultadoReembolso =
  | { ok: true; reembolsados: number; monto: number; avisos: string[] }
  | { ok: false; error: string };

type PagoVivo = {
  id: string;
  reservation_id: string | null;
  amount_mxn: number;
  /** Lo que YA se devolvió de este pago, sumando parciales (0063). */
  refunded_mxn: number;
  provider_ref: string | null;
  method: string | null;
  /** Por dónde entró (0061). Decide cómo se deshace. */
  canal_cobro: string | null;
  /**
   * ¿Se cobró con la transferencia ya neta (modelo Airbnb, 11 nov 2026)? Esos
   * pagos no tienen application_fee: pedir `refund_application_fee` no aplica.
   */
  transferenciaNeta: boolean;
};

/** Lo que todavía se le puede devolver a este pago. */
const porDevolver = (p: PagoVivo): number =>
  Math.round((p.amount_mxn - (p.refunded_mxn || 0)) * 100) / 100;

/**
 * Los pagos que TODAVÍA se pueden devolver de estas reservas.
 *
 * Filtra por `status='paid'` (un reembolsado no se reembolsa otra vez) y exige
 * `provider_ref`: sin el PaymentIntent no hay nada que pedirle a Stripe. Los
 * cobros por transferencia entran aquí sin `provider_ref` a propósito — se
 * devuelven por el banco, y decirlo es mejor que fallar en silencio.
 */
async function pagosDe(
  sb: ReturnType<typeof createSupabaseAdminClient>,
  reservationIds: string[],
): Promise<PagoVivo[]> {
  if (!reservationIds.length) return [];
  const { data } = await sb
    .from("payments")
    .select("id, reservation_id, amount_mxn, refunded_mxn, provider_ref, method, status, canal_cobro, isr_retenido_mxn")
    .in("reservation_id", reservationIds)
    .eq("status", "paid");
  return ((data ?? []) as (PagoVivo & { status: string; isr_retenido_mxn: number | null })[]).map((p) => ({
    id: p.id,
    reservation_id: p.reservation_id,
    amount_mxn: Number(p.amount_mxn || 0),
    refunded_mxn: Number(p.refunded_mxn || 0),
    provider_ref: p.provider_ref,
    method: p.method,
    canal_cobro: p.canal_cobro ?? "casa",
    transferenciaNeta: p.isr_retenido_mxn != null,
  }));
}

/** Pide a Stripe la devolución y deja la fila del libro. Devuelve el aviso si algo no se pudo. */
async function devolver(
  sb: ReturnType<typeof createSupabaseAdminClient>,
  pago: PagoVivo,
  ctx: {
    slotId: string | null;
    motivo: string;
    origen: "persona" | "salida";
    quien: string | null;
    /**
     * Cuánto devolver. Sin él, todo lo que quede.
     *
     * ⚠️ NO SE PARTE EL REPARTO A MANO. En un cargo con destino basta pedirle a
     * Stripe el parcial con `reverse_transfer` y `refund_application_fee`: él
     * reparte en proporción, en las dos patas. Medido el 23 sep 2026 sobre una
     * venta de $1,750 con $350 de comisión — un refund de $875 devolvió $175 de
     * comisión y bajó $700 del saldo de la operadora. Calcularlo aquí sería
     * duplicar una regla que ya vive donde se ejecuta.
     */
    monto?: number;
    /**
     * Lo que propuso la calculadora (D23) y cuándo se recibió el aviso. Se
     * guarda en la fila: si la casa devolvió otra cosa, queda a la vista
     * contra el motivo que escribió. `pct` se aplica a lo vivo de ESTE cobro.
     */
    calculo?: { avisoAt: string; regla: ReglaReembolso; pct: number } | null;
  },
): Promise<{ monto: number; aviso: string | null }> {
  const restante = porDevolver(pago);
  if (restante <= 0) return { monto: 0, aviso: null };

  // Sin monto, todo lo que queda. Con monto, nunca más de lo que queda: pedir
  // de más lo rechazaría Stripe, pero para entonces el libro ya diría otra cosa.
  const pedido = ctx.monto == null ? restante : Math.round(ctx.monto * 100) / 100;
  if (pedido <= 0) return { monto: 0, aviso: "El monto a devolver tiene que ser mayor que cero." };
  if (pedido > restante) {
    return {
      monto: 0,
      aviso: `De ese cobro sólo quedan $${restante.toLocaleString("es-MX")} por devolver y se pidieron $${pedido.toLocaleString("es-MX")}.`,
    };
  }
  if (!pago.provider_ref || pago.method !== "stripe") {
    return {
      monto: 0,
      aviso: `Un cobro de $${pago.amount_mxn.toLocaleString("es-MX")} no pasó por Stripe (${pago.method ?? "sin método"}): devuélvelo por el banco.`,
    };
  }

  // La fila va ANTES del cargo a Stripe. Si el proceso se muere justo después
  // de devolver el dinero, el libro ya sabe que se pidió; al revés, el dinero
  // se habría ido sin dejar rastro.
  const { data: fila, error: errFila } = await sb
    .from("reembolsos")
    .insert({
      payment_id: pago.id,
      reservation_id: pago.reservation_id,
      slot_id: ctx.slotId,
      monto_mxn: pedido,
      motivo: ctx.motivo || null,
      origen: ctx.origen,
      cancela_reserva: true,
      solicitado_por: ctx.quien,
      ...(ctx.calculo
        ? {
            aviso_at: ctx.calculo.avisoAt,
            regla: ctx.calculo.regla,
            propuesto_mxn: Math.round(restante * ctx.calculo.pct) / 100,
          }
        : {}),
    })
    .select("id")
    .single();
  if (errFila) {
    // 23505 = el índice parcial `reembolsos_un_vivo_por_pago`: ya hay uno vivo.
    const yaHay = errFila.code === "23505";
    return {
      monto: 0,
      aviso: yaHay
        ? "Ese pago ya tiene un reembolso en curso. No se pidió otro."
        : `No se pudo abrir el reembolso: ${errFila.message}`,
    };
  }

  try {
    const stripe = getStripeServerClient();
    // ⚠️ UN COBRO POR CONNECT SE DESHACE ENTERO O NO SE DESHACE.
    //
    // En un cargo con destino el dinero ya se partió en dos: la mayor parte se
    // transfirió a la cuenta de la operadora y la comisión se quedó en Numan.
    // Un refund pelón devuelve al cliente desde la cuenta de Numan y deja lo
    // demás donde está: la operadora se queda con el dinero de un viaje que no
    // pasó, y Numan con una comisión sobre una venta que se deshizo — y además
    // paga la devolución de su bolsa.
    //
    //   · `reverse_transfer` jala de vuelta lo transferido.
    //   · `refund_application_fee` devuelve la comisión, en proporción a lo
    //     reembolsado. Va junto: quedarse la comisión de una venta cancelada es
    //     cobrar por un servicio que no se prestó.
    //
    // Los dos son inertes en un cobro de la casa, pero no se mandan igual: un
    // parámetro que no aplica es una pregunta abierta para quien lea esto en un
    // año. Se mandan sólo donde significan algo.
    const porConnect = pago.canal_cobro === "connect";
    const refund = await stripe.refunds.create({
      payment_intent: pago.provider_ref,
      amount: toStripeAmount(pedido),
      // Con la transferencia ya neta (desde el 11 nov 2026) no hay comisión
      // de aplicación que devolver: `reverse_transfer` revierte en proporción
      // lo transferido y lo que Numan se quedó (comisión + retención) queda en
      // proporción también. Medido en test: $875 de $1,750 revirtió $620.80.
      ...(porConnect
        ? pago.transferenciaNeta
          ? { reverse_transfer: true }
          : { reverse_transfer: true, refund_application_fee: true }
        : {}),
      metadata: { origen: "caminante", reembolso_id: fila.id as string, canal: pago.canal_cobro ?? "casa" },
    });
    await sb.from("reembolsos").update({ stripe_refund_id: refund.id }).eq("id", fila.id);

    // ⚠️ NO SE ESPERA AL WEBHOOK SI STRIPE YA CONTESTÓ. Una devolución a tarjeta
    // vuelve `succeeded` en esta misma llamada: eso ES la confirmación, y con
    // ella ya se puede cancelar la reserva, liberar el lugar y mandar el correo.
    //
    // Colgarlo del evento `charge.refunded` costó caro el 3 sep: el endpoint de
    // Stripe no lo tenía suscrito, el dinero salió y el panel se quedó diciendo
    // «reembolso en curso» sin nada que lo destrabara. El webhook sigue, pero
    // como RED, no como único camino.
    if (refund.status === "succeeded") {
      const chargeId = typeof refund.charge === "string" ? refund.charge : refund.charge?.id;
      if (chargeId) await cerrarDesdeStripe(sb, chargeId, pago.id);
      else await marcarCerradoSinCargo(sb, pago.id);
    }
    // La venta que pagó la cuota de admisión se devolvió COMPLETA: Stripe ya le
    // regresó esos $20 al revertir lo que quedaba de la transferencia (medido
    // en test). Se vuelve a cobrar en su siguiente venta.
    if (porConnect && pedido >= restante) {
      await admisionDevuelta(sb, pago.id).catch(() => {});
    }
    return { monto: pedido, aviso: null };
  } catch (e) {
    // El reembolso queda 'fallido' Y CON EL MOTIVO. Así el libro dice por qué
    // esa persona no recibió su dinero, en vez de callarse.
    await sb
      .from("reembolsos")
      .update({ estado: "fallido", error: (e as Error).message })
      .eq("id", fila.id);
    return { monto: 0, aviso: `Stripe rechazó la devolución: ${(e as Error).message}` };
  }
}

async function quienEsLaCasa(): Promise<{ ok: true; quien: string | null } | { ok: false; error: string }> {
  const alcance = await alcanceActual();
  if (!alcance) return { ok: false, error: "No autorizado. Inicia sesión." };
  // Sólo la casa. Ni una operadora ni el equipo (0070: «lo que nunca:
  // reembolsos»). Antes sólo se rechazaba al operador, y el equipo de numan
  // (alcance `equipo`) pasaba esta guarda llamando la acción directo.
  if (esOperador(alcance) || alcance.tipo !== "casa") {
    return { ok: false, error: "Los reembolsos los hace Caminante: el dinero sale de su cuenta." };
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return { ok: true, quien: data.user?.id ?? null };
}

type ReservaParaCaso = {
  id: string;
  slot_id: string | null;
  experience_id: string | null;
  created_at: string | null;
  politica_variante: string | null;
  politica_aceptada_at: string | null;
};

/** Lo que la calculadora necesita de una reserva. null = no hay con qué proponer. */
async function baseDeReserva(sb: ReturnType<typeof createSupabaseAdminClient>, resv: ReservaParaCaso) {
  const [{ data: exp }, { data: slot }, { data: primer }] = await Promise.all([
    resv.experience_id
      ? sb.from("experiences").select("data").eq("id", resv.experience_id).maybeSingle()
      : Promise.resolve({ data: null }),
    resv.slot_id
      ? sb.from("experience_slots").select("starts_at").eq("id", resv.slot_id).maybeSingle()
      : Promise.resolve({ data: null }),
    sb.from("payments").select("paid_at").eq("reservation_id", resv.id).not("paid_at", "is", null).order("paid_at", { ascending: true }).limit(1).maybeSingle(),
  ]);
  return baseDelCaso({
    politicaVariante: resv.politica_variante,
    politicaAceptadaAt: resv.politica_aceptada_at,
    varianteExperiencia: ((exp as { data?: { politicaCancelacion?: unknown } } | null)?.data ?? {}).politicaCancelacion,
    primerPagoAt: (primer as { paid_at?: string | null } | null)?.paid_at ?? null,
    reservaCreadaAt: resv.created_at,
    salidaEmpieza: (slot as { starts_at?: string | null } | null)?.starts_at ?? null,
  });
}

/** UNA persona se baja: se le devuelve lo que pagó y su lugar vuelve a la venta. */
export async function reembolsarPersona(
  reservationId: string,
  motivo: string,
  /**
   * Cuánto devolver, en pesos. Sin él, todo lo que quede del cobro.
   *
   * Existe por la Cláusula Quinta del convenio: el Operador fija su política de
   * cancelación y casi ninguna devuelve el 100% —«50% si cancelas con siete
   * días»—. Hasta el 23 sep 2026 esto sólo sabía devolver todo, así que el
   * convenio prometía algo que la caja no podía ejecutar.
   *
   * ⚠️ UN PARCIAL CANCELA LA RESERVA IGUAL. Devolver una parte es el desenlace
   * de una cancelación, no un descuento: quien recibe el 50% de vuelta ya no
   * viene, y su lugar se libera. Si algún día hace falta devolver dinero SIN
   * cancelar —una queja, un ajuste— es otra operación y necesita su propia
   * puerta; no se cuela por aquí.
   */
  montoParcial?: number,
  /**
   * Cuándo se recibió el aviso de cancelación (ISO). La política cuenta «la
   * fecha y la hora en que recibimos tu aviso», no la del clic. Sin él, ahora.
   */
  avisoAt?: string,
): Promise<ResultadoReembolso> {
  const auth = await quienEsLaCasa();
  if (!auth.ok) return { ok: false, error: auth.error };

  const sb = createSupabaseAdminClient();
  const { data: resv } = await sb
    .from("reservations")
    .select("id, slot_id, status, experience_id, created_at, politica_variante, politica_aceptada_at")
    .eq("id", reservationId)
    .maybeSingle();
  if (!resv) return { ok: false, error: "No se encontró esa reserva." };
  if (resv.status === "cancelled") return { ok: false, error: "Esa reserva ya está cancelada." };

  const pagos = await pagosDe(sb, [reservationId]);
  if (!pagos.length) {
    return { ok: false, error: "Esa reserva no tiene ningún pago vivo que devolver." };
  }
  // ── La calculadora (D23 §4) ────────────────────────────────────────────────
  // El servidor vuelve a calcular lo que la pantalla enseñó: la propuesta se
  // guarda con la devolución, y cambiarla exige el motivo por escrito.
  const aviso = avisoAt ?? new Date().toISOString();
  const tAviso = new Date(aviso).getTime();
  if (!Number.isFinite(tAviso)) return { ok: false, error: "La fecha del aviso no se entiende." };
  if (tAviso > Date.now() + 5 * 60_000) return { ok: false, error: "El aviso de cancelación no puede tener fecha futura." };
  const vivo = Math.round(pagos.reduce((s, p) => s + porDevolver(p), 0) * 100) / 100;
  let propuesta: PropuestaReembolso | null = null;
  // ¿La persona aceptó la política en línea? Si no, las ventanas son sólo
  // referencia y lo decide la casa con motivo escrito (D24.1).
  let aceptada = false;
  const avisos: string[] = [];
  try {
    const base = await baseDeReserva(sb, resv as ReservaParaCaso);
    if (base) {
      if (tAviso < new Date(base.reservadaAt).getTime()) {
        return { ok: false, error: "El aviso de cancelación no puede ser anterior a la reserva." };
      }
      aceptada = base.aceptada;
      propuesta = proponerReembolso({ ...base, avisoAt: aviso, pagado: vivo, cancela: "cliente" });
    }
  } catch (e) {
    // Año sin lista de días de descanso: no se propone nada y se dice.
    avisos.push(`No se pudo calcular la propuesta: ${(e as Error).message}`);
  }
  const pedidoTotal = montoParcial == null ? vivo : Math.round(montoParcial * 100) / 100;
  const cambiada = propuesta != null && Math.abs(pedidoTotal - propuesta.importe) > 0.01;
  if (cambiada && !motivo.trim()) {
    return {
      ok: false,
      error: `El sistema propone devolver $${propuesta!.importe.toLocaleString("es-MX")} (${propuesta!.porque}) Para devolver otra cantidad, escribe el motivo.`,
    };
  }
  // Sin regla que proponer, o con una política que la persona no aceptó en
  // línea (las ventanas y las 24 horas son contrato; el piso legal no): decide
  // la casa, y lo que decide queda escrito (D24.1).
  const soloReferencia = propuesta != null && !aceptada && propuesta.regla !== "arrepentimiento-legal" && propuesta.regla !== "operacion";
  if ((propuesta == null || soloReferencia) && !motivo.trim()) {
    return {
      ok: false,
      error:
        propuesta == null
          ? "No hay regla que proponga un monto para esta reserva: escribe el motivo de lo que decides devolver."
          : "Esta persona no aceptó la política en línea, así que la propuesta es sólo referencia: escribe el motivo de lo que decides devolver.",
    };
  }
  // Varios cobros y un parcial: sólo se sabe repartir cuando el parcial ES el
  // porcentaje de la política, que aplica igual a cada cobro.
  const porPorcentaje = montoParcial != null && pagos.length > 1 && propuesta != null && !cambiada;
  if (montoParcial != null && pagos.length > 1 && !porPorcentaje) {
    return {
      ok: false,
      error: `Esa reserva tiene ${pagos.length} cobros vivos: un monto parcial que no es el porcentaje de la política no dice de cuál. Devuélvelos completos, o hazlo uno por uno desde Stripe.`,
    };
  }

  let monto = 0;
  let n = 0;
  for (const p of pagos) {
    const r = await devolver(sb, p, {
      slotId: (resv.slot_id as string | null) ?? null,
      motivo,
      origen: "persona",
      quien: auth.quien,
      monto: porPorcentaje ? Math.round(porDevolver(p) * propuesta!.pct) / 100 : montoParcial,
      calculo: propuesta ? { avisoAt: aviso, regla: propuesta.regla, pct: propuesta.pct } : null,
    });
    if (r.aviso) avisos.push(r.aviso);
    if (r.monto > 0) { monto += r.monto; n += 1; }
  }

  revalidatePath("/caminante/admin/salidas");
  return { ok: true, reembolsados: n, monto, avisos };
}

/**
 * SE CAE LA SALIDA: se le devuelve a todos y la fecha se cierra.
 *
 * La fecha se marca `cancelled` de UNA vez, aunque un reembolso concreto haya
 * fallado: si el viaje no va, no puede seguir vendiéndose mientras se resuelve
 * a mano el cobro que no volvió. Los que fallaron salen en los avisos.
 */
export async function cancelarSalidaYReembolsar(
  slotId: string,
  motivo: string,
  /**
   * Por qué se cae (D14 y D23 §5). `imputable` = causa de quien opera: a cada
   * persona pagada se le debe además una bonificación del 20 %, que se crea
   * aquí como «por pagar». `fuerza-mayor` = no hay bonificación; el motivo
   * tiene que decir qué pasó y qué documento lo acredita.
   */
  causa: CausaCancelacion,
): Promise<ResultadoReembolso> {
  const auth = await quienEsLaCasa();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (causa?.tipo !== "imputable" && causa?.tipo !== "cupo-minimo" && !(causa?.tipo === "fuerza-mayor" && esFuerzaMayor(causa.clase))) {
    return { ok: false, error: "Di por qué se cancela la salida: por causa de quien opera, por fuerza mayor o porque no se juntó el grupo mínimo." };
  }
  // En cupo mínimo el motivo lo escribe el sistema con los números (abajo).
  if (causa.tipo !== "cupo-minimo" && !motivo.trim()) {
    return {
      ok: false,
      error:
        causa.tipo === "fuerza-mayor"
          ? causa.clase === "emergencia-guia"
            ? "Escribe la declaración de quien opera: qué pasó y por qué no hubo sustituto. Sin diagnóstico ni datos médicos."
            : "Escribe qué pasó: la autoridad o fuente, la fecha y la liga o folio del documento."
          : "Escribe el motivo de la cancelación.",
    };
  }
  // La fuerza mayor quita la bonificación, y quien la invoca la prueba: sin el
  // archivo no se registra (D24.4). La emergencia del guía es la excepción.
  let documento: string | null = null;
  if (causa.tipo === "fuerza-mayor") {
    const d = documentoDeFuerzaMayor(causa.clase, causa.documento);
    if (!d.ok) return { ok: false, error: d.error };
    documento = d.path;
  }

  const sb = createSupabaseAdminClient();
  const { data: slot } = await sb
    .from("experience_slots")
    .select("id, status")
    .eq("id", slotId)
    .maybeSingle();
  if (!slot) return { ok: false, error: "No se encontró esa salida." };

  type ResvViva = { id: string; status: string; num_people: number | null; clausula_minimo?: number | null; clausula_limite?: string | null };
  const cupo = causa.tipo === "cupo-minimo";
  const { data: resvsRaw } = await sb
    .from("reservations")
    // Las columnas de la cláusula sólo se piden cuando hacen falta (0093).
    .select(cupo ? "id, status, num_people, clausula_minimo, clausula_limite" : "id, status, num_people")
    .eq("slot_id", slotId)
    .neq("status", "cancelled");
  const vivas = (resvsRaw ?? []) as unknown as ResvViva[];
  const reservationIds = vivas.map((r) => r.id);
  const pagos = await pagosDe(sb, reservationIds);

  const avisos: string[] = [];
  const ahora = new Date().toISOString();

  // ── Cupo mínimo (D26 §7.6) ─────────────────────────────────────────────────
  // Sólo existe con la cláusula activa en la salida, menos lugares pagados que
  // el mínimo y el aviso saliendo a más tardar el día de la fecha de
  // confirmación. Fuera de eso es causa de quien opera, y aquí no se disfraza.
  let filaCupo: FilaDeSalida | null = null;
  let clausula: ClausulaMinimo | null = null;
  let pagados = 0;
  if (cupo) {
    const { data: fila } = await sb.from("experience_slots").select(COLS_CLAUSULA).eq("id", slotId).maybeSingle();
    filaCupo = fila as FilaDeSalida | null;
    if (!filaCupo) return { ok: false, error: "No se encontró esa salida." };
    pagados = vivas
      .filter((r) => (ESTADOS_PAGADOS as readonly string[]).includes(r.status))
      .reduce((n, r) => n + (Number(r.num_people) || 1), 0);
    const puede = puedeCancelarPorCupo(paraClausula(filaCupo), pagados);
    if (!puede.ok) {
      return {
        ok: false,
        error: `Esta salida no se puede cancelar por cupo mínimo: ${puede.porque} Si de todos modos se cancela por falta de grupo, es por causa de quien opera, con bonificación.`,
      };
    }
    clausula = puede.clausula;
    motivo = `No se juntó el grupo mínimo: hacían falta ${clausula.minimo} personas y hay ${pagados} ${pagados === 1 ? "lugar pagado" : "lugares pagados"}. Fecha de confirmación: ${fechaConAnio(clausula.limite)}.${motivo.trim() ? ` ${motivo.trim()}` : ""}`;
  }

  // ⚠️ LA CAUSA Y LA BONIFICACIÓN VAN ANTES DEL DINERO. Si no se pueden
  // escribir, no se devuelve nada: una salida cancelada sin su causa no deja
  // saber si se debía el 20 %, y eso no se reconstruye después.
  const { error: errCausa } = await sb
    .from("experience_slots")
    .update({
      cancelada_at: ahora,
      cancelacion_causa: causa.tipo,
      cancelacion_fuerza_mayor: causa.tipo === "fuerza-mayor" ? causa.clase : null,
      cancelacion_documento_path: documento,
      cancelacion_motivo: motivo.trim(),
      // La hora en que sale el aviso de cancelación por cupo: es la prueba de
      // que se avisó en plazo. Los correos salen en seguida, antes del dinero.
      ...(cupo ? { cancelacion_aviso_at: ahora } : {}),
    })
    .eq("id", slotId);
  if (errCausa) return { ok: false, error: `No se pudo registrar la causa de la cancelación: ${errCausa.message}. No se devolvió nada.` };

  // Con cláusula y en plazo no hay bonificación; a quien NO la trae en su
  // reserva (reservó antes de que existiera) sí se le debe, como hoy (§7.6).
  const conClausula = new Set(cupo ? vivas.filter((r) => clausulaDeReserva(r) !== null).map((r) => r.id) : []);
  if (cupo && filaCupo && clausula) {
    const a = await avisarCancelacionPorCupo(sb, filaCupo, { clausula, pagados });
    avisos.push(
      `Se le avisó por correo a ${a.avisados} ${a.avisados === 1 ? "persona" : "personas"} que la salida no se juntó.${a.sinCorreo > 0 ? ` A ${a.sinCorreo} no le salió el correo: avísale hoy por WhatsApp.` : ""}`,
    );
  }

  if (causa.tipo === "imputable" || cupo) {
    const porReserva = new Map<string, number>();
    for (const p of pagos) {
      if (!p.reservation_id || conClausula.has(p.reservation_id)) continue;
      porReserva.set(p.reservation_id, (porReserva.get(p.reservation_id) ?? 0) + porDevolver(p));
    }
    const b = await crearBonificaciones(sb, { slotId, porReserva, canceladaAt: ahora, quien: auth.quien });
    if (!b.ok) return { ok: false, error: `${b.error} No se devolvió nada.` };
    if (b.creadas > 0) {
      avisos.push(
        `Se ${b.creadas === 1 ? "creó 1 bonificación" : `crearon ${b.creadas} bonificaciones`} del 20 % por pagar ($${b.total.toLocaleString("es-MX")} en total, a más tardar el ${b.venceEl}). Están en Pagos.`,
      );
    }
  }

  let monto = 0;
  let n = 0;
  for (const p of pagos) {
    const r = await devolver(sb, p, {
      slotId,
      motivo,
      origen: "salida",
      quien: auth.quien,
      // Cancela la operación: 100 %, siempre (D23 §4, regla 1).
      calculo: { avisoAt: ahora, regla: "operacion", pct: 100 },
    });
    if (r.aviso) avisos.push(r.aviso);
    if (r.monto > 0) { monto += r.monto; n += 1; }
  }

  // Cerrar la fecha. Va después de pedir las devoluciones para no cancelar una
  // salida cuyos reembolsos ni siquiera se intentaron.
  const { error: errSlot } = await sb
    .from("experience_slots")
    .update({ status: "cancelled" })
    .eq("id", slotId);
  if (errSlot) avisos.push(`La fecha NO se pudo cerrar: ${errSlot.message}`);

  // Las reservas sin pago que devolver se cancelan aquí: nadie va a viajar y
  // esperar un webhook que nunca va a llegar las dejaría colgadas en el roster.
  const conPago = new Set(pagos.map((p) => p.reservation_id));
  const sinPago = reservationIds.filter((id) => !conPago.has(id));
  if (sinPago.length) {
    await sb.from("reservations").update({ status: "cancelled" }).in("id", sinPago);
  }

  revalidatePath("/caminante/admin/salidas");
  return { ok: true, reembolsados: n, monto, avisos };
}

/**
 * DESTRABAR un reembolso que se quedó «en curso».
 *
 * Le pregunta a Stripe por el refund y, si ya está `succeeded`, cierra lo que
 * faltaba: cancela la reserva, libera el lugar y manda el correo.
 *
 * Existe porque el webhook puede no llegar —y no llegó— y porque un movimiento
 * de dinero a medias no puede depender de que alguien note el renglón. Es
 * idempotente: si ya estaba cerrado, no vuelve a mandar el correo.
 */
export async function verificarReembolso(
  reembolsoId: string,
): Promise<{ ok: true; estado: string; mensaje: string } | { ok: false; error: string }> {
  const auth = await quienEsLaCasa();
  if (!auth.ok) return { ok: false, error: auth.error };

  const sb = createSupabaseAdminClient();
  const { data: r } = await sb
    .from("reembolsos")
    .select("id, payment_id, stripe_refund_id, estado")
    .eq("id", reembolsoId)
    .maybeSingle();
  if (!r) return { ok: false, error: "No se encontró ese reembolso." };
  if (!r.stripe_refund_id) {
    return { ok: false, error: "Ese reembolso nunca llegó a crearse en Stripe. Vuelve a pedirlo." };
  }

  let estado: string;
  let chargeId: string | null = null;
  try {
    const stripe = getStripeServerClient();
    const refund = await stripe.refunds.retrieve(r.stripe_refund_id as string);
    estado = refund.status ?? "desconocido";
    chargeId = typeof refund.charge === "string" ? refund.charge : refund.charge?.id ?? null;
  } catch (e) {
    return { ok: false, error: `No se pudo consultar Stripe: ${(e as Error).message}` };
  }

  if (estado === "succeeded") {
    if (chargeId) await cerrarDesdeStripe(sb, chargeId, r.payment_id as string);
    else await marcarCerradoSinCargo(sb, r.payment_id as string);
    revalidatePath("/caminante/admin/salidas");
    return { ok: true, estado, mensaje: "Stripe confirmó la devolución. Lugar liberado y correo enviado." };
  }
  if (estado === "failed" || estado === "canceled") {
    await sb
      .from("reembolsos")
      .update({ estado: "fallido", error: `Stripe: ${estado}` })
      .eq("id", r.id);
    revalidatePath("/caminante/admin/salidas");
    return { ok: true, estado, mensaje: `Stripe lo marcó como ${estado}: el dinero NO volvió. Hay que resolverlo a mano.` };
  }
  return { ok: true, estado, mensaje: `Stripe todavía lo tiene en «${estado}». Vuelve a verificar más tarde.` };
}
