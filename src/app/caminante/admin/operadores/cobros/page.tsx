// Cobros del operador — onboarding de Stripe Connect (carril A2).
//
// ⚠️ DESVIACIÓN DEL PLAN, a propósito. El plan pone estas pantallas en
// `/caminante/operador/cobros`. Dos razones para traerlas al panel:
//
//   1. `/caminante/operador/[slug]` YA existe y es el perfil PÚBLICO del
//      operador. Un segmento estático `cobros` le ganaría al dinámico y dejaría
//      inalcanzable a cualquier operador cuyo slug fuera "cobros".
//   2. El acceso con alcance de operador es la F3.2 del plan y todavía no
//      existe: hoy aprobar a un operador lo vuelve admin. Colgar aquí una
//      pantalla "del operador" sin ese modelo sería fingir un aislamiento que no
//      hay.
//
// La F3.2 aterrizó el 24 ago y esto NO se movió: durante un mes la operadora
// no pudo conectar su propia cuenta ni subir su CSD, y dos de sus seis
// candados apuntaban a una pantalla que no podía abrir. Desde el 22 sep 2026
// vive también en `/caminante/admin/mi-alta/cobrar` (una sola fila: la suya),
// con el MISMO `CobrosPanel`. Ésta sigue siendo la vista de la casa, con todas.
//
// La facturación desde el portal (D20) la ACTIVA la operadora desde su panel y
// ella sube su CSD, que viaja a Facturapi en memoria y no se guarda aquí (D20
// bis). Desde esta vista la casa la ve y la puede desactivar; sólo arma los
// pasos ella misma cuando la operadora es propia.

import AdminShell from "../../ui/AdminShell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { COLUMNAS_GATE, operadorListo, type OperadorParaGate } from "@/lib/operators/listo-para-vender";
import CobrosPanel from "./CobrosPanel";
import FacturacionPortal from "../../mi-alta/cobrar/FacturacionPortal";
import { consentimientoVigente, estadoPortal, type EstadoPortal } from "@/lib/facturacion/portal";
import { organizacionesActivas } from "@/lib/facturacion/facturapi";
import { cifradoActivo } from "@/lib/facturacion/crypto";
import { constanciaParaPanel, constanciasDe } from "@/lib/operadores/constancia-fiscal";
import { fiscalPrivadoParaPanel } from "@/lib/operadores/fiscal-privado";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cobros del operador · Admin" };

type Row = OperadorParaGate & {
  id: string;
  name: string;
  email: string | null;
  stripe_payouts_enabled: boolean | null;
  stripe_requirements: unknown;
  stripe_onboarded_at: string | null;
  es_la_casa: boolean | null;
  propia: boolean | null;
};

export default async function CobrosPage() {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("operators")
    .select(
      `id,name,email,es_la_casa,propia,stripe_payouts_enabled,stripe_requirements,stripe_onboarded_at,csd_subido_at,${COLUMNAS_GATE}`,
    )
    // Una suspendida SIGUE COBRANDO lo que ya vendió: cortarle el dinero de
    // viajes que sí va a operar sería quedarle mal a ella y a sus clientes.
    .neq("estado", "baja")
    .order("created_at");
  const rows = (data ?? []) as Row[];
  const constancias = await constanciasDe(rows.map((x) => x.id));
  const privados = await fiscalPrivadoParaPanel(createSupabaseAdminClient(), rows.map((x) => x.id));
  const consentimiento = await consentimientoVigente();
  const estados = new Map<string, EstadoPortal>(await Promise.all(rows.map(async (x) => [x.id, await estadoPortal(x.id)] as const)));
  const disponible = organizacionesActivas() && cifradoActivo();

  return (
    <AdminShell active="operador">
      <div className="sec-head">
        <span className="eyebrow"><span className="sl">{"//"}</span> Operador</span>
        <h1 className="display">Cobros del operador</h1>
        <p className="subtitle">
          Conectar la cuenta de Stripe de un operador para que cobre <b>a su nombre</b> y Numan
          retenga su comisión. Mientras un operador no aparezca como <b>listo para vender</b>, sus
          experiencias siguen cobrando por el camino de siempre: el dinero entra completo a NUMAN
          HUB y se le transfiere a mano.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="empty">No hay operadores activos.</div>
      ) : (
        rows.map((r) => {
          return (
            <CobrosPanel
              key={r.id}
              operador={{
                id: r.id,
                nombre: r.name,
                email: r.email ?? "",
                stripeAccountId: r.stripe_account_id ?? null,
                chargesEnabled: Boolean(r.stripe_charges_enabled),
                payoutsEnabled: Boolean(r.stripe_payouts_enabled),
                onboardedAt: r.stripe_onboarded_at ?? null,
                // Lo que Stripe todavía pide, TAL CUAL. No se traduce: si Stripe
                // pide un documento, el operador tiene que leer cuál.
                pendientes: pendientesDe(r.stripe_requirements),
                commissionPct: r.commission_pct ?? null,
                rfc: r.rfc ?? "",
                razonSocial: r.razon_social ?? "",
                regimenFiscal: r.regimen_fiscal ?? "",
                cpFiscal: r.cp_fiscal ?? "",
                tipoPersona: r.tipo_persona ?? "",
                constancia: constanciaParaPanel(constancias.get(r.id)),
                privado: privados.get(r.id) ?? null,
              }}
              faltantes={operadorListo(r).faltantes}
              facturacion={
                r.es_la_casa ? undefined : (
                  <FacturacionPortal
                    operatorId={r.id}
                    modo={r.propia ? "operadora" : "casa"}
                    disponible={disponible}
                    convenioFirmado={Boolean(r.convenio_firmado_at)}
                    consentimiento={consentimiento}
                    estado={estados.get(r.id)!}
                  />
                )
              }
            />
          );
        })
      )}
    </AdminShell>
  );
}

function pendientesDe(req: unknown): string[] {
  const r = (req ?? {}) as { past_due?: string[]; currently_due?: string[] };
  return [...new Set([...(r.past_due ?? []), ...(r.currently_due ?? [])])];
}
