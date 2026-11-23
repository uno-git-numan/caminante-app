import { redirect } from "next/navigation";
import AdminShell from "../ui/AdminShell";
import PaginaMas from "../ui/PaginaMas";
import { SECCIONES_GUARDADAS } from "../ui/mas";
import { ligaDeEquipo } from "../ui/nav";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { sombreroPuesto } from "@/lib/auth/sombrero";

export const dynamic = "force-dynamic";
export const metadata = { title: "Más · Admin — Caminante" };

// «Más», con el sombrero de una operadora: lo que salió del menú esencial de
// la casa. Sólo la casa: el menú de una operadora externa no cambió y no trae
// esta pestaña.
export default async function MasPage() {
  if (!(await isCurrentUserAdmin())) redirect("/caminante/admin");
  // «Equipo» es el de la operadora del sombrero; la casa (Caminante) no tiene
  // equipo propio de operadora que administrar aquí.
  const puesto = await sombreroPuesto();
  const secciones = [
    ...SECCIONES_GUARDADAS,
    ...(puesto ? [{ nombre: "Equipo", href: ligaDeEquipo(puesto.id), paraQue: `La gente de ${puesto.nombre} y lo que puede hacer cada quien.` }] : []),
  ];
  return (
    <AdminShell active="recursos">
      <PaginaMas secciones={secciones} bajada="Estas secciones siguen completas; sólo salieron del menú para dejar al frente lo de todos los días." />
    </AdminShell>
  );
}
