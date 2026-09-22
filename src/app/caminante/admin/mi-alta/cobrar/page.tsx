// COBRAR — Stripe Connect, CSD y datos fiscales, desde el lado de la operadora.
//
// Es el MISMO panel que la casa usa en `/admin/operadores/cobros`, con una sola
// fila: la suya. Esa página lo decía desde el 18 ago («cuando la F3.2 aterrice,
// esto se mueve tal cual a la superficie del operador»); la F3.2 aterrizó y
// esto no se movió, así que dos de los seis candados —CSD y Connect— apuntaban
// a una pantalla que la operadora no podía abrir. Un candado con dueño pero sin
// puerta es un reproche.
//
// Las acciones (`pedirLinkStripe`, `guardarCsd`, `guardarFiscales`) ya
// aceptaban a la operadora sobre sí misma; lo que faltaba era la puerta.
// La casa entra POR una operadora con `?operadora=<id>`.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminShell from "../../ui/AdminShell";
import { MI_ALTA_CSS } from "../../ui/mi-alta-css";
import { fetchMiAlta } from "@/lib/operadores/mi-alta";
import { nombreDeOperadora } from "@/lib/operadores/expediente";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { COLUMNAS_GATE, operadorListo, type OperadorParaGate } from "@/lib/operators/listo-para-vender";
import CobrosPanel from "../../operadores/cobros/CobrosPanel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Cobrar · Caminante",
  robots: { index: false, follow: false },
};

type Row = OperadorParaGate & {
  id: string;
  name: string;
  email: string | null;
  stripe_payouts_enabled: boolean | null;
  stripe_requirements: unknown;
  stripe_onboarded_at: string | null;
};

export default async function CobrarPage({
  searchParams,
}: {
  searchParams: Promise<{ operadora?: string }>;
}) {
  const alta = await fetchMiAlta();
  if (!alta) redirect("/caminante/admin");
  const q = await searchParams;

  let operatorId: string;
  let porOtra: { id: string; nombre: string } | null = null;
  if (alta.operadora?.esLaCasa) {
    const pedida = (q.operadora ?? "").trim();
    const nombre = pedida ? await nombreDeOperadora(pedida) : null;
    if (!pedida || !nombre) redirect("/caminante/admin/operadores/cobros");
    operatorId = pedida;
    porOtra = { id: pedida, nombre };
  } else {
    const propia = alta.operadora?.id;
    if (!propia) redirect("/caminante/admin/mi-alta");
    operatorId = propia;
  }

  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("operators")
    .select(`id,name,email,stripe_payouts_enabled,stripe_requirements,stripe_onboarded_at,csd_subido_at,${COLUMNAS_GATE}`)
    .eq("id", operatorId)
    .maybeSingle();
  const r = data as Row | null;
  if (!r) redirect("/caminante/admin/mi-alta");

  return (
    <AdminShell active="panorama">
      <style dangerouslySetInnerHTML={{ __html: MI_ALTA_CSS }} />
      <div className="sec-head" style={{ marginBottom: 18 }}>
        <div>
          <span className="eyebrow">
            <span className="sl">{"//"}</span> {porOtra ? `Cobros de ${porOtra.nombre}` : "Paso 04 · Cobrar"}
          </span>
          <h2 className="display" style={{ fontSize: 30, marginTop: 8 }}>
            Tu cuenta de cobro <em className="ac">y tus datos fiscales.</em>
          </h2>
          <p className="desc">
            Conecta tu cuenta de Stripe para que el dinero de tus ventas entre <b>a tu nombre</b> y
            Caminante retenga sólo su comisión. Tus datos fiscales y tu CSD son para que tú le factures
            a tu cliente. Mientras esto no esté completo, tus experiencias no cobran por aquí.
          </p>
          <p className="desc" style={{ marginTop: 10 }}>
            {porOtra ? (
              <Link href="/caminante/admin/plataforma/comunidad">Volver a Comunidad</Link>
            ) : (
              <Link href="/caminante/admin/mi-alta">Volver a Mi alta</Link>
            )}
          </p>
        </div>
      </div>
      <CobrosPanel
        operador={{
          id: r.id,
          nombre: r.name,
          email: r.email ?? "",
          stripeAccountId: r.stripe_account_id ?? null,
          chargesEnabled: Boolean(r.stripe_charges_enabled),
          payoutsEnabled: Boolean(r.stripe_payouts_enabled),
          onboardedAt: r.stripe_onboarded_at ?? null,
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
    </AdminShell>
  );
}

// Lo que Stripe todavía pide, TAL CUAL. Mismo lector que en la página de la
// casa: si Stripe pide un documento, la operadora tiene que leer cuál.
function pendientesDe(req: unknown): string[] {
  const r = (req ?? {}) as { past_due?: string[]; currently_due?: string[] };
  return [...new Set([...(r.past_due ?? []), ...(r.currently_due ?? [])])];
}
