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
// El paso del CSD guarda los DOS archivos que entrega el SAT (.cer y .key), cada
// uno en su columna desde la 0038. Lo que NO pasa por aquí es su contraseña: va
// directo a Facturapi al crear la organización del operador (A3) y no se
// persiste de nuestro lado.

import AdminShell from "../../ui/AdminShell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { COLUMNAS_GATE, operadorListo, type OperadorParaGate } from "@/lib/operators/listo-para-vender";
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
};

export default async function CobrosPage() {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("operators")
    .select(
      `id,name,email,stripe_payouts_enabled,stripe_requirements,stripe_onboarded_at,csd_subido_at,${COLUMNAS_GATE}`,
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
                csdCerPath: r.csd_cer_path ?? null,
                csdKeyPath: r.csd_key_path ?? null,
                csdVenceAt: r.csd_vence_at ?? null,
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
