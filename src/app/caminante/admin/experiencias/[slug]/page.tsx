import { notFound, redirect } from "next/navigation";
import { puedeEditarSlug } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchSlotsForAdmin } from "@/lib/experiences/slots-admin";
import type { Experience } from "@/lib/experiences/types";
import { leerComplementos } from "@/lib/experiences/complementos-actions";
import { reglaComisionActual } from "@/lib/auth/alcance";
import ExperienceForm from "../ExperienceForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar experiencia · Admin" };

// Modo EDICIÓN del formulario de experiencia: contenido + fechas y cupo en un
// solo lugar (el dashboard de eventos enlaza aquí — ahí solo se opera:
// cerrar/reabrir, operador, publicar). Lee el row directo (incluye drafts).
export default async function EditarExperienciaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Editar la ficha de una experiencia ajena: no. `puedeEditarSlug` dice que sí
  // a la casa siempre y al operador solo sobre lo suyo.
  if (!(await puedeEditarSlug(slug))) {
    redirect(`/caminante/login?next=/caminante/admin/experiencias/${slug}`);
  }

  const sb = createSupabaseAdminClient();
  const { data: row } = await sb
    .from("experiences")
    .select("data")
    .eq("slug", slug)
    .maybeSingle();
  if (!row?.data) notFound();

  // SOLO salidas ABIERTAS y PÚBLICAS: el form edita las fechas vigentes de la
  // web. Las cerradas/canceladas se operan en el dashboard (Reabrir) — si
  // entraran aquí como filas, cada guardado las re-abriría (bug de las fechas
  // que "resucitaban"). Las PRIVADAS (grupos con link) se crean/operan desde
  // Solicitudes/Eventos y no deben mezclarse con las fechas públicas.
  const slots = (await fetchSlotsForAdmin(slug)).filter(
    (s) => s.status === "open" && s.visibility === "public",
  );

  const complementos = await leerComplementos(slug);
  const reglaComision = await reglaComisionActual();

  return (
    <ExperienceForm
      initial={row.data as Experience}
      initialComplementos={complementos}
      reglaComision={reglaComision}
      initialSlots={slots.map((s) => ({
        id: s.id,
        label: s.label,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        capacity: s.capacity,
      }))}
    />
  );
}
