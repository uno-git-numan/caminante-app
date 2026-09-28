// EQUIPO (la casa) — quién trabaja para numan y para cada operadora (0070).
//
// Sólo la casa. Aquí Luis prende y apaga facultades y decide para quién
// trabaja cada persona. La pantalla es la lámina «Equipo» de Claude Design
// (design/equipo/dc/Equipo.html); RENDIMIENTO (quién cerró qué, comisiones)
// es una pestaña que sólo ve uno@numanhub.com (F3, lib/equipo/rendimiento.ts).

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminShell from "../../ui/AdminShell";
import { getCurrentRole, correoEnSesion } from "@/lib/auth/authorization";
import { fetchRendimiento } from "@/lib/equipo/rendimiento";
import { operadorasPropias } from "@/lib/auth/sombrero";
import { fetchEquipo } from "@/lib/equipo/lista";
import { MI_ALTA_CSS } from "../../ui/mi-alta-css";
import { EQUIPO_CSS } from "../../ui/equipo-css";
import Equipo from "./Equipo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Equipo · numan", robots: { index: false, follow: false } };

export default async function EquipoPlataformaPage() {
  if ((await getCurrentRole()) !== "admin") redirect("/caminante/admin");
  // RENDIMIENTO ES DE UNA SOLA PERSONA. La casa entera ve quién trabaja aquí;
  // lo que cada quien devenga sólo lo ve uno@numanhub.com. Otro admin no ve
  // la pestaña, ni un hueco donde iría.
  const dueno = (await correoEnSesion()) === "uno@numanhub.com";
  const [miembros, ops, rendimiento] = await Promise.all([
    fetchEquipo(),
    // Sólo las PROPIAS (Caminante, Kéntro): numan da de alta a su gente y a la
    // de Druidas; a una externa (Nomádika) le da de alta su dueña, desde su
    // panel. Ni como opción.
    operadorasPropias(),
    dueno ? fetchRendimiento() : Promise.resolve(null),
  ]);
  const operadoras = ops.map((o) => ({ id: o.id, nombre: o.nombre }));

  return (
    <AdminShell active="pl-equipo">
      <style dangerouslySetInnerHTML={{ __html: MI_ALTA_CSS + EQUIPO_CSS }} />
      <Equipo miembros={miembros} modo={{ casa: true, operadoras }} rendimiento={rendimiento} />
    </AdminShell>
  );
}
