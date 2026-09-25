// EQUIPO (la casa) — quién trabaja para numan y para cada operadora (0070).
//
// Sólo la casa. Aquí Luis prende y apaga facultades y decide para quién
// trabaja cada persona. La sección de RENDIMIENTO del equipo (quién cerró qué,
// comisiones) viene aparte, con lámina de Claude Design, y sólo para
// uno@numanhub.com.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminShell from "../../ui/AdminShell";
import { getCurrentRole } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchEquipo } from "@/lib/equipo/lista";
import Equipo from "./Equipo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Equipo · numan", robots: { index: false, follow: false } };

export default async function EquipoPlataformaPage() {
  if ((await getCurrentRole()) !== "admin") redirect("/caminante/admin");
  const sb = createSupabaseAdminClient();
  const [miembros, { data: ops }] = await Promise.all([
    fetchEquipo(),
    sb.from("operators").select("id, name, estado").neq("estado", "baja").order("name"),
  ]);
  const operadoras = ((ops ?? []) as { id: string; name: string | null }[]).map((o) => ({ id: o.id, nombre: o.name || "Operadora" }));

  return (
    <AdminShell active="pl-equipo">
      <div className="sec-head">
        <div>
          <span className="eyebrow"><span className="sl">{"//"}</span> Equipo</span>
          <h1 className="display" style={{ marginTop: 10 }}>
            Quién trabaja aquí, <em className="ac">y qué puede.</em>
          </h1>
          <p className="desc">
            Empleados de numan (onboarding de operadoras) y de cada operadora (clientes, experiencias, campo).
            Un perfil puede ser de numan, de una operadora, o de las dos; tú prendes y apagas cada facultad. Lo
            que nunca: dinero, comisiones, cuentas de cobro, dispensas, accesos.
          </p>
        </div>
      </div>
      <Equipo miembros={miembros} modo={{ casa: true, operadoras }} />
    </AdminShell>
  );
}
