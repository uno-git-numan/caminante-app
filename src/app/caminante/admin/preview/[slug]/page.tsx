// Vista previa SOLO-ADMIN de una experiencia en CUALQUIER estado (borrador o
// publicada): renderiza exactamente la misma plantilla que la página pública,
// con un listón arriba que recuerda que es preview. El público jamás la ve —
// además del gate del layout, se re-verifica admin aquí (regla del proyecto).
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Experience } from "@/lib/experiences/types";
import { fetchOpenSlotsForTemplate } from "@/lib/experiences/availability";
import ExperienceTemplate from "../../../experiencias/[slug]/ExperienceTemplate";
import ExperienceTemplateV2 from "../../../experiencias/[slug]/ExperienceTemplateV2";

export const dynamic = "force-dynamic";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!(await isCurrentUserAdmin())) redirect("/caminante/entrar");

  const { slug } = await params;
  const sb = createSupabaseAdminClient();
  const { data: row } = await sb
    .from("experiences")
    .select("id, data, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!row?.data) notFound();

  const e = row.data as Experience;
  const esBorrador = row.status !== "published";
  // Diseño v2: mismas fechas en vivo que la página pública (funciona con borradores).
  const slots =
    e.design === "v2"
      ? await fetchOpenSlotsForTemplate((row as { id: string }).id)
      : [];

  return (
    <div>
      <div
        style={{
          position: "sticky", top: 0, zIndex: 200, display: "flex",
          alignItems: "center", justifyContent: "center", gap: 14,
          padding: "10px 16px", background: "#20392b", color: "#fbfbf7",
          fontSize: 13, fontFamily: "system-ui, sans-serif", flexWrap: "wrap",
        }}
      >
        <span>
          👁️ Vista previa {esBorrador ? "del BORRADOR" : "(ya publicada)"} — así la verá el
          viajero{esBorrador ? " cuando la publiques. Solo tú puedes ver esta página." : "."}
        </span>
        <Link
          href={`/caminante/admin/experiencias/${slug}`}
          style={{
            color: "#fbfbf7", border: "1px solid rgba(251,251,247,.4)",
            borderRadius: 999, padding: "3px 14px", textDecoration: "none",
          }}
        >
          Seguir editando
        </Link>
      </div>
      {e.design === "v2" ? (
        <ExperienceTemplateV2 experience={e} slots={slots} />
      ) : (
        <ExperienceTemplate experience={e} />
      )}
    </div>
  );
}
