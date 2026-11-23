import { redirect } from "next/navigation";
import AdminShell from "../../ui/AdminShell";
import PaginaMas from "../../ui/PaginaMas";
import { SECCIONES_GUARDADAS_PLATAFORMA } from "../../ui/mas";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";
export const metadata = { title: "Más · Plataforma — Caminante" };

// «Más», con el sombrero de numan (la plataforma): lo que salió del menú
// esencial. Sólo la casa.
export default async function MasPlataformaPage() {
  if (!(await isCurrentUserAdmin())) redirect("/caminante/admin");
  return (
    <AdminShell active="pl-recursos">
      <PaginaMas secciones={SECCIONES_GUARDADAS_PLATAFORMA} bajada="Estas secciones de la plataforma siguen completas; sólo salieron del menú para dejar al frente a las operadoras." />
    </AdminShell>
  );
}
