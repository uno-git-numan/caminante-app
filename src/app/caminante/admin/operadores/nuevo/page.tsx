// ONBOARDING de operador externo — el alta canónica (white-label v1).
// Un solo formulario por secciones (identidad → marca con preview en vivo →
// legal del deslinde → trato → experiencias) que termina en el portal
// /caminante/o/[slug] ya vestido. Curado: lo captura Luis. También sirve para
// COMPLETAR un operador existente (?op=<id>, p. ej. un embajador aprobado).
import AdminShell from "../../ui/AdminShell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { experienceTitle } from "@/lib/admin/queries";
import type { Experience } from "@/lib/experiences/types";
import OnboardingForm, { type ExpOpcion, type OperadorPrefill } from "./OnboardingForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Onboarding de operador · Admin" };

const ERRORES: Record<string, string> = {
  datos: "Falta nombre, correo o slug.",
  marca: "La marca necesita logo y dos colores hex válidos (#rrggbb).",
  slug: "Ese slug ya es de otro operador — elige otro.",
  admin: "Solo admin.",
  guardar: "No se pudo guardar. Revisa que la migración 0030 esté aplicada e inténtalo de nuevo.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; op?: string }>;
}) {
  const { ok, error, op } = await searchParams;
  const sb = createSupabaseAdminClient();

  const { data: expData } = await sb
    .from("experiences")
    .select("id, slug, status, operator_id, data")
    .order("created_at", { ascending: false });
  const experiencias: ExpOpcion[] = ((expData ?? []) as { id: string; slug: string; status: string; operator_id: string | null; data: Experience }[]).map(
    (r) => ({
      id: r.id,
      slug: r.slug,
      titulo: experienceTitle(r.data, r.slug),
      status: r.status,
      operatorId: r.operator_id,
    }),
  );

  // Modo "completar" (?op=): prefill de un operador existente (embajador
  // aprobado, alta previa a mano...). Best-effort: sin fila ⇒ modo crear.
  let prefill: OperadorPrefill | null = null;
  if (op) {
    const { data } = await sb
      .from("operators")
      .select("id, name, email, slug, instagram, branding, legal, notes")
      .eq("id", op)
      .maybeSingle();
    if (data) {
      const r = data as {
        id: string; name: string; email: string | null; slug: string | null; instagram: string | null;
        branding: { logoUrl?: string; logoDarkUrl?: string; colors?: { primary?: string; accent?: string }; poweredBy?: string } | null;
        legal: { razonSocial?: string; rfc?: string; domicilio?: string; responsable?: string } | null;
        notes: string | null;
      };
      prefill = {
        id: r.id,
        nombre: r.name,
        email: r.email ?? "",
        slug: r.slug ?? "",
        instagram: r.instagram ?? "",
        logoUrl: r.branding?.logoUrl ?? "",
        logoDarkUrl: r.branding?.logoDarkUrl ?? "",
        primary: r.branding?.colors?.primary ?? "#20211c",
        accent: r.branding?.colors?.accent ?? "#ff5d36",
        poweredBy: r.branding?.poweredBy === "visible" ? "visible" : "discreto",
        razonSocial: r.legal?.razonSocial ?? "",
        rfc: r.legal?.rfc ?? "",
        domicilio: r.legal?.domicilio ?? "",
        responsable: r.legal?.responsable ?? "",
        trato: r.notes ?? "",
      };
    }
  }

  return (
    <AdminShell active="operador">
      <div className="sec-head">
        <span className="eyebrow"><span className="sl">{"//"}</span> Onboarding de operador</span>
        <h1 className="display">Alta de un operador <em className="ac">externo.</em></h1>
        <p className="subtitle">
          El operador pone su marca; caminante pone la infraestructura. Al guardar, su portal queda
          vivo en <b>/caminante/o/&lt;slug&gt;</b> con su logo, sus colores y sus experiencias, más
          un «powered by NMN Caminante» discreto. El deslinde de sus viajes usará SU entidad legal.
          {" "}
          <b>
            Hasta aquí llega su marca por ahora: al picar una experiencia, la página de venta, el
            checkout y el deslinde se ven de Caminante.
          </b>
        </p>
      </div>

      {ok ? (
        <div className="card pad" style={{ marginBottom: 20 }}>
          <span className="chip c-paid">Operador guardado</span>
          <div className="act-row">
            <a className="btn btn-orange btn-sm" href={`/caminante/o/${ok}`} target="_blank" rel="noopener noreferrer">
              Ver su portal →
            </a>
            <a className="btn btn-glass btn-sm" href="/caminante/admin/operadores">Perfil público del operador</a>
            <a className="btn btn-ghost btn-sm" href="/caminante/admin/operadores/nuevo">Dar de alta otro</a>
          </div>
        </div>
      ) : null}
      {error ? <div className="empty" style={{ borderColor: "rgba(255,93,54,.5)", marginBottom: 20 }}>{ERRORES[error] ?? ERRORES.guardar}</div> : null}

      <OnboardingForm experiencias={experiencias} prefill={prefill} />
    </AdminShell>
  );
}
