import "server-only";

// EMITE EL CFDI DE RETENCIONES DE UNA OPERADORA PARA UN MES (12 nov 2026).
//
// Con la organización de NUMAN en Facturapi (NUMAN es la retenedora). El cuerpo
// lo arma cfdi-retenciones.ts (puro, con pruebas, validado contra el XSD del
// SAT); aquí sólo se lee, se aparta el lugar, se timbra y se envía.
//
// ⚠️ TRES CANDADOS antes de llamar al PAC:
//   1. `facturacionActiva()`: sin la llave de NUMAN en Facturapi no hay con qué.
//   2. `catalogoListo()`: las claves del catálogo las confirma la sesión legal.
//   3. Un solo comprobante VIVO por operadora y mes (índice de la 0082): dos
//      clics, o el cron y un clic, no timbran dos.
//
// El `timbrado_at` es el CORTE del reporte: lo que se devuelva después ya no
// toca el mes (legal §3). Por eso el comprobante se arma con el reporte del
// momento de emitir.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { clienteFacturapi, facturacionActiva, llaveDeLaCasa } from "@/lib/facturacion/facturapi";
import { catalogoListo, CATALOGO, payloadRetencion, xmlComplemento } from "./cfdi-retenciones";
import { TASAS_POR_EJERCICIO } from "./retencion";
import { reporteRetenciones } from "./reporte-retenciones-server";

export type ResultadoEmision =
  | { ok: true; uuid: string; enviadoA: string | null }
  | { ok: false; error: string; yaEstaba?: boolean };

/** ¿Se puede emitir hoy? Dice por qué no, en palabras de la pantalla. */
export function puedeEmitir(): { ok: true } | { ok: false; porque: string } {
  if (!facturacionActiva()) return { ok: false, porque: "Falta la llave de NUMAN en Facturapi (FACTURAPI_SECRET_KEY)." };
  const c = catalogoListo();
  if (!c.ok) return { ok: false, porque: `Faltan claves del catálogo del SAT por confirmar con la sesión legal: ${c.faltan.join(", ")}.` };
  return { ok: true };
}

export async function emitirRetencion(mes: string, operatorId: string): Promise<ResultadoEmision> {
  const puede = puedeEmitir();
  if (!puede.ok) return { ok: false, error: puede.porque };
  const tasas = TASAS_POR_EJERCICIO[Number(mes.slice(0, 4))];
  if (!tasas) return { ok: false, error: `No hay tasas de retención para ${mes.slice(0, 4)}.` };

  const sb = createSupabaseAdminClient();

  // Apartar el lugar ANTES de llamar al PAC.
  const { data: fila, error: eIns } = await sb
    .from("cfdi_retenciones")
    .insert({ operator_id: operatorId, mes, estado: "pendiente" })
    .select("id")
    .single();
  if (eIns) {
    if (eIns.code !== "23505") return { ok: false, error: eIns.message };
    // Ya hay uno vivo. Si quedó «pendiente» más de 15 minutos, el proceso que lo
    // apartó murió a medio timbrar: se marca fallido y se reintenta. La llave
    // de idempotencia de Facturapi (ret-<mes>-<operadora>) devuelve el MISMO
    // comprobante si el primero sí alcanzó a timbrar: no salen dos.
    const { data: vivo } = await sb
      .from("cfdi_retenciones")
      .select("id, estado, updated_at")
      .eq("operator_id", operatorId)
      .eq("mes", mes)
      .in("estado", ["pendiente", "timbrado"])
      .maybeSingle();
    const v = vivo as { id: string; estado: string; updated_at: string } | null;
    const abandonado = v?.estado === "pendiente" && Date.now() - Date.parse(v.updated_at) > 15 * 60 * 1000;
    if (!abandonado) return { ok: false, yaEstaba: true, error: "Esta operadora ya tiene su CFDI de ese mes (o se está emitiendo)." };
    await sb.from("cfdi_retenciones").update({ estado: "fallido", error: "Abandonado a medio timbrar; se reintentó.", updated_at: new Date().toISOString() }).eq("id", v!.id);
    return emitirRetencion(mes, operatorId);
  }
  const filaId = (fila as { id: string }).id;
  const fallo = async (error: string): Promise<ResultadoEmision> => {
    await sb.from("cfdi_retenciones").update({ estado: "fallido", error: error.slice(0, 800), updated_at: new Date().toISOString() }).eq("id", filaId);
    return { ok: false, error };
  };

  try {
    const rep = await reporteRetenciones(mes);
    const ventas = rep.detalle.filter((d) => d.operatorId === operatorId && d.seReporta);
    if (!ventas.length) return await fallo("La operadora no tiene ventas reportables en ese mes.");

    const { data: op } = await sb
      .from("operators")
      .select("rfc, razon_social, regimen_fiscal, cp_fiscal, email")
      .eq("id", operatorId)
      .maybeSingle();
    const o = op as { rfc: string | null; razon_social: string | null; regimen_fiscal: string | null; cp_fiscal: string | null; email: string | null } | null;
    if (!o?.rfc || !o.razon_social || !o.regimen_fiscal || !o.cp_fiscal) {
      return await fallo("Faltan sus datos fiscales (RFC, razón social, régimen o CP): salen de su constancia.");
    }

    const comp = xmlComplemento(
      ventas.map((v) => ({ paymentId: v.paymentId, fecha: fechaCdmx(v.fecha), base: v.base, comision: v.comision, medio: v.medio })),
      { isr: tasas.isr, iva: tasas.iva },
    );
    if (!comp.ok) return await fallo(comp.porque);

    const cuerpo = payloadRetencion(
      mes,
      { rfc: o.rfc, razonSocial: o.razon_social, regimen: o.regimen_fiscal, cp: o.cp_fiscal, email: o.email },
      comp,
      CATALOGO,
      `ret-${mes}-${operatorId}`,
    );
    const fa = clienteFacturapi(llaveDeLaCasa());
    const timbre = await fa.crearRetencion(cuerpo as unknown as Record<string, unknown>);
    const ahora = new Date().toISOString();
    const m = comp.montos;
    await sb
      .from("cfdi_retenciones")
      .update({
        estado: "timbrado",
        facturapi_id: timbre.id,
        uuid: timbre.uuid,
        num_servicios: m.numServ,
        monto_operacion: m.montoOperacion,
        iva_trasladado: m.ivaTrasladado,
        isr_retenido: m.isr,
        iva_retenido: m.iva,
        comision: m.comision,
        payment_ids: ventas.map((v) => v.paymentId),
        timbrado_at: ahora,
        error: null,
        updated_at: ahora,
      })
      .eq("id", filaId);

    // A la operadora, con su XML y su PDF. Si el correo falla, el CFDI ya
    // existe: se dice y se puede reenviar.
    let enviadoA: string | null = null;
    if (o.email) {
      try {
        await fa.enviarRetencionPorCorreo(timbre.id, o.email);
        enviadoA = o.email;
        await sb.from("cfdi_retenciones").update({ enviado_a: o.email, enviado_at: new Date().toISOString() }).eq("id", filaId);
      } catch (e) {
        console.error("[retenciones] timbrado pero no enviado:", e);
      }
    }
    return { ok: true, uuid: timbre.uuid, enviadoA };
  } catch (e) {
    return await fallo(e instanceof Error ? e.message : String(e));
  }
}

/** Emite los de todas las operadoras con ventas en el mes. Para el cron y el botón «Emitir todos». */
export async function emitirRetencionesDelMes(mes: string): Promise<{ operatorId: string; resultado: ResultadoEmision }[]> {
  const puede = puedeEmitir();
  if (!puede.ok) return [];
  const rep = await reporteRetenciones(mes);
  const out: { operatorId: string; resultado: ResultadoEmision }[] = [];
  for (const r of rep.renglones) {
    const ya = rep.cfdis.get(r.operatorId);
    if (ya && ya.estado === "timbrado") continue;
    out.push({ operatorId: r.operatorId, resultado: await emitirRetencion(mes, r.operatorId) });
  }
  return out;
}

/** «2026-11-05» en hora CDMX, como pide FechaServ. */
function fechaCdmx(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}
