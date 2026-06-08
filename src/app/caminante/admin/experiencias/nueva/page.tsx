import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import ExperienceForm from "../ExperienceForm";

export const metadata = { title: "Crear experiencia · Admin" };

export default async function NuevaExperienciaPage() {
  if (!(await isCurrentUserAdmin())) {
    redirect("/caminante/login?next=/caminante/admin/experiencias/nueva");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-light text-lagoon">
        Crear <span className="font-semibold text-dune">experiencia</span>
      </h1>
      <p className="mt-2 text-sm text-olive">
        Llena el template y las cuatro caras. Guarda como borrador o publica — la página,
        las tarjetas del landing y el calendario se generan solos.
      </p>
      <div className="mt-8">
        <ExperienceForm />
      </div>
    </div>
  );
}
