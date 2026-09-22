// TU MARCA — la pantalla del panel donde la operadora captura logo, colores y
// «powered by». marca.ts la describía como la tercera superficie de captura
// desde agosto, y no existía: la marca sólo entraba al aplicar o cuando la
// casa daba el alta. El resultado fue que quitarles los colores semilla a
// Kéntro y a Nomádika (22 sep 2026) las dejó sin forma de ponerse los suyos.
//
// La casa entra POR una operadora con `?operadora=<id>`, igual que al
// expediente.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminShell from "../../ui/AdminShell";
import { EXPEDIENTE_CSS } from "../../ui/expediente-css";
import { MI_ALTA_CSS } from "../../ui/mi-alta-css";
import { fetchMiAlta } from "@/lib/operadores/mi-alta";
import { nombreDeOperadora } from "@/lib/operadores/expediente";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OperatorBranding } from "@/lib/operators/branding";
import Marca, { type MarcaInicial } from "./Marca";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Tu marca · Caminante",
  robots: { index: false, follow: false },
};

export default async function MarcaPage({
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
    if (!pedida || !nombre) redirect("/caminante/admin/plataforma/comunidad");
    operatorId = pedida;
    porOtra = { id: pedida, nombre };
  } else {
    const propia = alta.operadora?.id;
    if (!propia) redirect("/caminante/admin/mi-alta");
    operatorId = propia;
  }

  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("operators").select("name, slug, branding").eq("id", operatorId).maybeSingle();
  const o = (data ?? {}) as { name?: string; slug?: string | null; branding?: OperatorBranding | null };
  const b = o.branding ?? null;
  const inicial: MarcaInicial = {
    logoUrl: b?.logoUrl ?? "",
    logoDarkUrl: b?.logoDarkUrl ?? "",
    primary: b?.colors?.primary ?? "",
    accent: b?.colors?.accent ?? "",
    poweredBy: b?.poweredBy === "visible" ? "visible" : "discreto",
    footerLine: b?.footerLine ?? "",
  };

  return (
    <AdminShell active="panorama">
      <style dangerouslySetInnerHTML={{ __html: MI_ALTA_CSS + EXPEDIENTE_CSS }} />
      <div className="sec-head" style={{ marginBottom: 18 }}>
        <div>
          <span className="eyebrow">
            <span className="sl">{"//"}</span> {porOtra ? `Marca de ${porOtra.nombre}` : "Tu marca"}
          </span>
          <h2 className="display" style={{ fontSize: 30, marginTop: 8 }}>
            Dos colores, <em className="ac">y todo lo tuyo se ve tuyo.</em>
          </h2>
          <p className="desc">
            Tu portal, tu ficha, la reserva y el deslinde se visten con tu marca. Se piden dos colores
            y el resto se deriva; el logo es opcional.
            {o.slug ? (
              <>
                {" "}
                Tu portal es <Link href={`/caminante/o/${o.slug}`}>/caminante/o/{o.slug}</Link>.
              </>
            ) : null}
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
      <Marca inicial={inicial} operadora={porOtra?.id ?? null} />
    </AdminShell>
  );
}
