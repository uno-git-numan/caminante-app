import { alcanceActual, esOperador } from "@/lib/auth/alcance";
import { reglaComisionDeOperador } from "@/lib/operadores/regla";
import { redirect } from "next/navigation";
import { puedeEntrarAlPanel } from "@/lib/auth/authorization";
import { operadorDelAlcance } from "@/lib/admin/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ContactoDueno } from "@/lib/experiences/empty";
import { experienciasCopiables } from "@/lib/experiences/copiar";
import ExperienceForm from "../ExperienceForm";
import AltaRapida from "../AltaRapida";
import { candadoDeAlta } from "@/lib/operadores/nav-alta-servidor";

export const metadata = { title: "Crear experiencia · Admin" };

export default async function NuevaExperienciaPage({ searchParams }: { searchParams: Promise<{ completo?: string }> }) {
  // Crear está abierto a la casa Y al operador: `saveExperience` atribuye la
  // experiencia nueva a quien la crea, así que nace suya.
  if (!(await puedeEntrarAlPanel())) {
    redirect("/caminante/login?next=/caminante/admin/experiencias/nueva");
  }

  // LA PUERTA POR DEFECTO ES EL ALTA RÁPIDA (19 nov 2026): lo esencial para
  // vender, en una pantalla. El editor completo —17 secciones— sigue aquí
  // mismo con `?completo=1`, y es también a donde se llega con «Agregar más
  // detalle» sobre una experiencia ya creada. Misma ruta a propósito: todas
  // las ligas que ya apuntan a /experiencias/nueva (el panel, Mi alta, el
  // correo de bienvenida, la lista blanca de la operadora) caen en lo simple.
  if ((await searchParams).completo !== "1") {
    // La casa tiene que decir de quién es la experiencia; una operadora no,
    // la suya nace suya. La lista es de TODAS las vigentes —la casa actúa por
    // cualquiera— y no trae ninguna elegida: tomarla del sombrero es justo lo
    // que el invariante #22 prohíbe en este archivo.
    let operadoras: { id: string; nombre: string }[] | undefined;
    if (!(await operadorDelAlcance())) {
      const { data } = await createSupabaseAdminClient().from("operators").select("id, name, estado").order("created_at");
      operadoras = ((data ?? []) as { id: string; name: string | null; estado: string | null }[])
        .filter((o) => o.estado !== "baja")
        .map((o) => ({ id: o.id, nombre: o.name || "Operadora" }));
    }
    // ¿La crea una operadora que sigue en su alta? Entonces el Panorama y
    // Salidas le están cerrados: el formulario la regresa a Mi alta y, al
    // guardar, le ofrece ver su página y continuar (no «Ir a Salidas»).
    const candado = operadoras ? null : await candadoDeAlta();
    return <AltaRapida operadoras={operadoras} enAlta={!!candado && candado.estado !== "abierto"} />;
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
  // Una experiencia nueva nace atribuida a quien la crea (ver saveExperience),
  // así que su regla es la de esa operadora. Si la crea la casa, la escala.
  const alc = await alcanceActual();
  const reglaComision = await reglaComisionDeOperador(esOperador(alc) ? alc.operatorId : null);

  // De cuáles se puede partir. Se resuelve AQUÍ, en el servidor y con el
  // alcance de quien mira: la casa ve todas, la operadora sólo las suyas.
  const copiables = await experienciasCopiables();

  return <ExperienceForm dueno={dueno} reglaComision={reglaComision} copiables={copiables} />;
}
