import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import ExperienceForm from "../ExperienceForm";

export const metadata = { title: "Crear experiencia · Admin" };

export default async function NuevaExperienciaPage() {
  if (!(await isCurrentUserAdmin())) {
    redirect("/caminante/login?next=/caminante/admin/experiencias/nueva");
  }

  // El form es full-page (trae su propio header admin + barra de acciones).
  return <ExperienceForm />;
}
