import { reglaComisionActual } from "@/lib/auth/alcance";
import { redirect } from "next/navigation";
import { puedeEntrarAlPanel } from "@/lib/auth/authorization";
import { operadorDelAlcance } from "@/lib/admin/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ContactoDueno } from "@/lib/experiences/empty";
import ExperienceForm from "../ExperienceForm";

export const metadata = { title: "Crear experiencia · Admin" };

export default async function NuevaExperienciaPage() {
  // Crear está abierto a la casa Y al operador: `saveExperience` atribuye la
  // experiencia nueva a quien la crea, así que nace suya.
  if (!(await puedeEntrarAlPanel())) {
    redirect("/caminante/login?next=/caminante/admin/experiencias/nueva");
  }

  // Si quien crea es un operador externo, su contacto siembra el bloque de
  // cierre de la página. Sin esto la experiencia nace con el correo y el
  // Instagram de Caminante — le pasó a Nomádika, ya en producción.
  //
  // Cliente de SERVICIO a propósito: la RLS de `operators` solo expone las filas
  // `is_public = true`, y un operador recién dado de alta todavía no lo es. Es el
  // mismo gotcha que dejaba su rol en «caminante».
  let dueno: ContactoDueno | undefined;
  const operatorId = await operadorDelAlcance();
  if (operatorId) {
    const { data } = await createSupabaseAdminClient()
      .from("operators")
      .select("email, instagram, whatsapp, documentos")
      .eq("id", operatorId)
      .maybeSingle();
    if (data) {
      const docs = (data.documentos ?? {}) as {
        deslindeUrl?: string; deslindeNombre?: string; encuestaUrl?: string; encuestaNombre?: string;
      };
      dueno = {
        email: data.email ?? undefined,
        instagram: data.instagram ?? undefined,
        whatsapp: data.whatsapp ?? undefined,
        deslindeUrl: docs.deslindeUrl,
        deslindeNombre: docs.deslindeNombre,
        encuestaUrl: docs.encuestaUrl,
        encuestaNombre: docs.encuestaNombre,
      };
    }
  }

  // El form es full-page (trae su propio header admin + barra de acciones).
  const reglaComision = await reglaComisionActual();

  return <ExperienceForm dueno={dueno} reglaComision={reglaComision} />;
}
