// "Solicita una fecha" — un viajero pide abrir una fecha nueva de una
// experiencia publicada (grupo privado con link, o salida abierta). La
// solicitud cae en slot_requests y el admin la aprueba desde el panel.
// Diseño: Claude Design jul 2026 (.sol-*), ruta inmersiva (topbar propio).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { fetchPrefillForUser } from "@/lib/registration/queries";
import { BRAND_MARK } from "@/lib/experiences/brand-svg";
import type { Experience } from "@/lib/experiences/types";
import SolicitarForm from "./SolicitarForm";
import { SOL_CSS } from "./sol-css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Solicita una fecha · Caminante" };
}

const ERRORES: Record<string, string> = {
  datos: "Nos falta tu nombre, correo o WhatsApp — revísalos e inténtalo de nuevo.",
  fecha: "Cuéntanos cuándo: elige una fecha o escribe una nota (“fechas flexibles” cuenta).",
  personas: "Tu grupo es más chico que el mínimo de esta experiencia.",
  guardar: "No pudimos guardar tu solicitud. Inténtalo de nuevo en un momento.",
};

export default async function SolicitarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { slug } = await params;
  const { ok, error } = await searchParams;

  const sb = createSupabaseAdminClient();
  const { data: row } = await sb
    .from("experiences")
    .select("data, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!row?.data || row.status !== "published") notFound();
  const e = row.data as Experience;

  const titulo =
    [e.title, e.titleAccent].filter(Boolean).join(" ").trim() || e.docTitle || "Experiencia Caminante";
  const heroBlock = e.page?.blocks?.find((b) => b.type === "hero");
  const heroUrl = (heroBlock && "bg" in heroBlock ? heroBlock.bg.url : "") || e.heroImageUrl || "";
  const minPeople = Math.max(1, e.minPeople ?? 1);
  const volver = `/caminante/experiencias/${slug}`;

  // Prellenado con sesión (mismo patrón que el registro).
  const user = await getCurrentUser().catch(() => null);
  const pre = user ? await fetchPrefillForUser(user.id).catch(() => null) : null;
  const prefill = {
    nombre: pre?.fullName ?? "",
    correo: pre?.email ?? user?.email ?? "",
    whatsapp: pre?.phone ?? "",
  };

  const errMsg = error ? (ERRORES[error] ?? ERRORES.guardar) : null;

  return (
    <div className="sol">
      <style dangerouslySetInnerHTML={{ __html: SOL_CSS }} />

      <header className="sol-hero">
        <div className="sol-ph">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {heroUrl ? <img src={heroUrl} alt={titulo} /> : null}
        </div>
        <div className="sol-topbar">
          <a className="sol-logo" href="/caminante" aria-label="Caminante" dangerouslySetInnerHTML={{ __html: BRAND_MARK }} />
          <a className="sol-back" href={volver}>← Volver</a>
        </div>
        <span className="sol-eyebrow"><span className="sl">{"//"}</span> Solicita una fecha</span>
        <h1 className="sol-display">Arma tu propia <em className="sol-ac">salida.</em></h1>
        <p className="sol-sub">Dinos cuándo quieren ir y cuántos son; nosotros armamos el resto.</p>
      </header>

      <div className="sol-wrap">
        <div className="sol-card">
          {ok ? (
            <div className="sol-ok">
              <div className="sol-check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <h2 className="sol-display">Recibimos tu <em className="sol-ac">solicitud.</em></h2>
              <p>Te escribimos por WhatsApp en menos de 24 horas para armar la fecha.</p>
              <a className="sol-ghost" href={volver}>← Volver a la experiencia</a>
            </div>
          ) : (
            <>
              <div className="sol-exp">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {heroUrl ? <img src={heroUrl} alt="" /> : null}
                <div className="l">
                  <div className="k">Experiencia</div>
                  <div className="n">{titulo}</div>
                </div>
              </div>
              {errMsg ? <div className="sol-err">⚠️ {errMsg}</div> : null}
              <SolicitarForm slug={slug} minPeople={minPeople} prefill={prefill} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
