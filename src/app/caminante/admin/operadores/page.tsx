// Operador — edición del PERFIL PÚBLICO desde el panel (como si fuera una
// página): identidad, bio, fotos, equipo (foto+vocación+quote), con Guardar /
// Publicar–Borrador / Vista previa. La página pública se alimenta 1:1 de esto.
import AdminShell from "../ui/AdminShell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cleanAdjust, type TeamMember } from "@/lib/operators/public";
import OperadorForm from "./OperadorForm";
import ConvenioForm from "./ConvenioForm";
import MarcaResumen from "./MarcaResumen";
import type { OperatorBranding } from "@/lib/operators/branding";
import type { OperadorLegal } from "@/lib/operators/convenio-actions";

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
  commission_pct: number | null;
  legal: unknown;
  rfc: string | null;
  razon_social: string | null;
  branding: OperatorBranding | null;
  es_la_casa: boolean | null;
};

export default async function OperadoresAdminPage() {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("operators")
    .select(
      "id, name, slug, bio, photo_url, photo_adjust, hero_photo_url, hero_adjust, instagram, team, is_public, commission_pct, legal, rfc, razon_social, branding, es_la_casa",
    )
    // Se listan todas menos las dadas de baja: una suspendida sigue operando
    // lo que ya vendió y tiene que poder verse.
    .neq("estado", "baja")
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
          <div key={r.id}>
          {/* Primero el convenio (cobrar y facturar), luego su marca (cómo se
              ve lo suyo) y al final el perfil público (lo que ve el viajero en
              Caminante). Son tres momentos distintos del alta, y la marca está
              en medio porque es de las dos cosas: administrativa al capturarla,
              pública en cuanto viste una pantalla. */}
          <ConvenioForm
            id={r.id}
            nombre={r.name}
            commissionPct={r.commission_pct ?? null}
            legal={(r.legal as OperadorLegal | null) ?? null}
            rfcActual={r.rfc ?? ""}
            razonSocialActual={r.razon_social ?? ""}
          />
          <MarcaResumen
            id={r.id}
            nombre={r.name}
            slug={r.slug ?? null}
            branding={r.branding ?? null}
            esLaCasa={r.es_la_casa === true}
          />
          <OperadorForm
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
          </div>
        ))
      )}
    </AdminShell>
  );
}
