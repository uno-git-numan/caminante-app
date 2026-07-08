import { notFound, redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchSlotsForAdmin } from "@/lib/experiences/slots-admin";
import type { Experience } from "@/lib/experiences/types";
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
  if (!(await isCurrentUserAdmin())) {
    redirect(`/caminante/login?next=/caminante/admin/experiencias/${slug}`);
  }

  const sb = createSupabaseAdminClient();
  const { data: row } = await sb
    .from("experiences")
    .select("data")
    .eq("slug", slug)
    .maybeSingle();
  if (!row?.data) notFound();

  // SOLO salidas ABIERTAS: el form edita las fechas vigentes. Las cerradas/
  // canceladas se operan en el dashboard (Reabrir) — si entraran aquí como
  // filas, cada guardado las re-abriría (bug de las fechas que "resucitaban").
  const slots = (await fetchSlotsForAdmin(slug)).filter((s) => s.status === "open");

  return (
    <ExperienceForm
      initial={row.data as Experience}
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
