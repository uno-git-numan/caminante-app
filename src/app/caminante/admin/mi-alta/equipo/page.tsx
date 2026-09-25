// TU EQUIPO (la operadora) — «como una agencia de viajes» (Luis, 25 sep 2026).
//
// La operadora da de alta a su gente desde su propio panel: sólo para ella y
// sólo con facultades de operadora (clientes, armar, campo). La casa entra POR
// una operadora con `?operadora=`, como en el expediente. Un EMPLEADO de la
// operadora no llega aquí (lista blanca): el equipo no se administra solo.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminShell from "../../ui/AdminShell";
import { MI_ALTA_CSS } from "../../ui/mi-alta-css";
import { alcanceActual, esOperador } from "@/lib/auth/alcance";
import { nombreDeOperadora } from "@/lib/operadores/expediente";
import { fetchEquipo } from "@/lib/equipo/lista";
import Equipo from "../../plataforma/equipo/Equipo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tu equipo · Caminante", robots: { index: false, follow: false } };

export default async function EquipoOperadoraPage({ searchParams }: { searchParams: Promise<{ operadora?: string }> }) {
  const a = await alcanceActual();
  const q = await searchParams;
  let operatorId: string;
  let nombre: string;
  let porOtra = false;
  if (a?.tipo === "casa") {
    const pedida = (q.operadora ?? "").trim();
    const n = pedida ? await nombreDeOperadora(pedida) : null;
    if (!pedida || !n) redirect("/caminante/admin/plataforma/equipo");
    operatorId = pedida;
    nombre = n;
    porOtra = true;
  } else if (esOperador(a) && !a.equipo) {
    operatorId = a.operatorId;
    nombre = a.nombre;
  } else {
    redirect("/caminante/admin");
  }

  const miembros = await fetchEquipo(operatorId);

  return (
    <AdminShell active="panorama">
      <style dangerouslySetInnerHTML={{ __html: MI_ALTA_CSS }} />
      <div className="sec-head" style={{ marginBottom: 18 }}>
        <div>
          <span className="eyebrow"><span className="sl">{"//"}</span> {porOtra ? `Equipo de ${nombre}` : "Tu equipo"}</span>
          <h2 className="display" style={{ fontSize: 30, marginTop: 8 }}>
            Quien trabaja contigo <em className="ac">entra con su correo.</em>
          </h2>
          <p className="desc">
            Ve y hace sólo lo que le prendas: clientes, experiencias, campo. Tus cobros, tus devoluciones y tu
            convenio siguen siendo tuyos.
          </p>
          <p className="desc" style={{ marginTop: 10 }}>
            <Link href={porOtra ? `/caminante/admin/mi-alta?operadora=${encodeURIComponent(operatorId)}` : "/caminante/admin/mi-alta"}>
              Volver a {porOtra ? "su alta" : "Mi alta"}
            </Link>
          </p>
        </div>
      </div>
      <Equipo miembros={miembros} modo={{ casa: false, operatorId, nombre }} />
    </AdminShell>
  );
}
