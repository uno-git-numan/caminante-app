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
// Cuando la F3.2 aterrice, esto se mueve tal cual a la superficie del operador.
//
// ⚠️ El paso «Sube tu CSD» NO está aquí todavía, y no es un olvido: `csd_path`
// es UNA columna y el SAT entrega DOS archivos (.cer y .key), los dos
// necesarios para timbrar. Guardar solo uno dejaría el expediente inservible y
// resolverlo con una convención de nombres sería justo el parche que no se hace.
// Necesita una migración chica y va con A3, que es donde Facturapi lo consume.
// El semáforo de abajo ya lo reporta como faltante — no se puede vender sin él.

import AdminShell from "../../ui/AdminShell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { COLUMNAS_GATE, operadorListo, type OperadorParaGate } from "@/lib/operators/listo-para-vender";
import type { OperadorLegal } from "@/lib/operators/convenio-actions";
import CobrosPanel from "./CobrosPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cobros del operador · Admin" };

type Row = OperadorParaGate & {
  id: string;
  name: string;
  email: string | null;
  stripe_payouts_enabled: boolean | null;
  stripe_requirements: unknown;
  stripe_onboarded_at: string | null;
  legal: unknown;
};

export default async function CobrosPage() {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("operators")
    .select(
      `id,name,email,legal,stripe_payouts_enabled,stripe_requirements,stripe_onboarded_at,${COLUMNAS_GATE}`,
    )
    .eq("active", true)
    .order("created_at");
  const rows = (data ?? []) as Row[];

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
          const legal = (r.legal as OperadorLegal | null) ?? null;
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
                // Pre-llenado desde el jsonb del convenio para no teclear dos
                // veces lo mismo (ver el comentario en `guardarFiscales`).
                rfcConvenio: legal?.rfc ?? "",
                razonSocialConvenio: legal?.razonSocial ?? "",
              }}
              faltantes={operadorListo(r).faltantes}
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
