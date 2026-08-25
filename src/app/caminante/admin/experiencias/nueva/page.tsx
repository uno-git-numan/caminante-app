import { redirect } from "next/navigation";
import { puedeEntrarAlPanel } from "@/lib/auth/authorization";
import ExperienceForm from "../ExperienceForm";

export const metadata = { title: "Crear experiencia · Admin" };

export default async function NuevaExperienciaPage() {
  // Crear está abierto a la casa Y al operador: `saveExperience` atribuye la
  // experiencia nueva a quien la crea, así que nace suya.
  if (!(await puedeEntrarAlPanel())) {
    redirect("/caminante/login?next=/caminante/admin/experiencias/nueva");
  }

  // El form es full-page (trae su propio header admin + barra de acciones).
  return <ExperienceForm />;
}
