// EQUIPO (la casa) — quién trabaja para numan y para cada operadora (0070).
//
// Sólo la casa. Aquí Luis prende y apaga facultades y decide para quién
// trabaja cada persona. La pantalla es la lámina «Equipo» de Claude Design
// (design/equipo/dc/Equipo.html); la sección de RENDIMIENTO (quién cerró qué,
// comisiones) espera la atribución (0071+) y sólo la verá uno@numanhub.com.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminShell from "../../ui/AdminShell";
import { getCurrentRole } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchEquipo } from "@/lib/equipo/lista";
import { MI_ALTA_CSS } from "../../ui/mi-alta-css";
import { EQUIPO_CSS } from "../../ui/equipo-css";
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
      <style dangerouslySetInnerHTML={{ __html: MI_ALTA_CSS + EQUIPO_CSS }} />
      <Equipo miembros={miembros} modo={{ casa: true, operadoras }} />
    </AdminShell>
  );
}
