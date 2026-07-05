// Vista previa SOLO-ADMIN de una experiencia en CUALQUIER estado (borrador o
// publicada): renderiza exactamente la misma plantilla que la página pública,
// con un listón arriba que recuerda que es preview. El público jamás la ve —
// además del gate del layout, se re-verifica admin aquí (regla del proyecto).
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Experience } from "@/lib/experiences/types";
import ExperienceTemplate from "../../../experiencias/[slug]/ExperienceTemplate";

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
    .select("data, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!row?.data) notFound();

  const e = row.data as Experience;
  const esBorrador = row.status !== "published";

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
      <ExperienceTemplate experience={e} />
    </div>
  );
}
