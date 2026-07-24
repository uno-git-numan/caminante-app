// Operador — edición del PERFIL PÚBLICO desde el panel (como si fuera una
// página): identidad, bio, fotos, equipo (foto+vocación+quote), con Guardar /
// Publicar–Borrador / Vista previa. La página pública se alimenta 1:1 de esto.
import AdminShell from "../ui/AdminShell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cleanAdjust, type TeamMember } from "@/lib/operators/public";
import OperadorForm from "./OperadorForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Operador · Admin" };

type Row = {
  id: string;
  name: string;
  slug: string | null;
  bio: string | null;
  photo_url: string | null;
  photo_adjust: unknown;
  hero_photo_url: string | null;
  hero_adjust: unknown;
  instagram: string | null;
  team: TeamMember[] | null;
  is_public: boolean;
};

export default async function OperadoresAdminPage() {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("operators")
    .select("id, name, slug, bio, photo_url, photo_adjust, hero_photo_url, hero_adjust, instagram, team, is_public")
    .eq("active", true)
    .order("created_at");
  const rows = (data ?? []) as Row[];

  return (
    <AdminShell active="operador">
      <div className="sec-head">
        <span className="eyebrow"><span className="sl">{"//"}</span> Operador</span>
        <a className="btn btn-orange btn-sm" href="/caminante/admin/operadores/nuevo" style={{ marginLeft: "auto" }}>
          + Onboarding de operador
        </a>
        <h1 className="display">Perfil público del operador</h1>
        <p className="subtitle">
          Esto es lo que ve la gente al picar <b>“Operada por”</b> en una experiencia. Edítalo como una
          página: guarda, revisa la vista previa y publica cuando esté listo. Las métricas (salidas,
          viajeros, satisfacción) NO se editan — se calculan solas de las ventas y encuestas.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="empty">No hay operadores activos.</div>
      ) : (
        rows.map((r) => (
          <OperadorForm
            key={r.id}
            operador={{
              id: r.id,
              name: r.name,
              slug: r.slug ?? "",
              bio: r.bio ?? "",
              photoUrl: r.photo_url ?? "",
              photoAdjust: cleanAdjust(r.photo_adjust),
              heroPhotoUrl: r.hero_photo_url ?? "",
              heroAdjust: cleanAdjust(r.hero_adjust),
              instagram: r.instagram ?? "",
              team: Array.isArray(r.team) ? r.team : [],
              isPublic: r.is_public,
            }}
          />
        ))
      )}
    </AdminShell>
  );
}
