// Flyer para REDES SOCIALES de una experiencia. Reusa el MISMO deck que el PDF y,
// en vez de imprimir, exporta cada slide a PNG. Dos formatos por `?f`:
//   post  (default) → 4:5 = 1080×1350 (posts del feed de Instagram) · deck social.
//   story           → 9:16 = 1080×1920 (Stories/Reels) · deck vertical completo.
// Solo-admin.
import { notFound, redirect } from "next/navigation";
import { puedeEditarSlug } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Experience } from "@/lib/experiences/types";
import { fetchOpenSlotsForTemplate } from "@/lib/experiences/availability";
import { deckCss, DECK_GLASS_SCRIPT } from "@/lib/experiences/deck-css";
import ExperienceDeck from "../../../experiencias/[slug]/ExperienceDeck";
import SocialExport from "./SocialExport";

export const dynamic = "force-dynamic";
export const metadata = { title: "Flyer para redes · Admin" };

export default async function SocialPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ f?: string }>;
}) {
  // Solo sobre SU experiencia (la casa, sobre cualquiera).
  if (!(await puedeEditarSlug((await params).slug))) redirect("/caminante/entrar");
  const { slug } = await params;
  const formato = (await searchParams).f === "story" ? "story" : "post";
  const social = formato === "post"; // post = 4:5 (social); story = 9:16 (vertical completo)

  const sb = createSupabaseAdminClient();
  const { data: row } = await sb.from("experiences").select("id, data").eq("slug", slug).maybeSingle();
  if (!row?.data) notFound();
  const e = row.data as Experience;
  if (e.design !== "v2" || !e.page?.blocks?.length) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 560 }}>
        <h1 style={{ fontSize: 20, marginBottom: 10 }}>Aún no se puede generar el flyer</h1>
        <p style={{ color: "#555", lineHeight: 1.6 }}>
          Esta experiencia todavía usa el diseño anterior. Guárdala en el formulario nuevo (queda
          en diseño v2) y el flyer se generará solo.
        </p>
      </div>
    );
  }
  const slots = await fetchOpenSlotsForTemplate((row as { id: string }).id, { includePrivate: true });
  const titulo = [e.title, e.titleAccent].filter(Boolean).join(" ").trim() || e.docTitle || "Flyer";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: deckCss("v", { social }) }} />
      {/* Regla app-first: camino de vuelta visible (nunca depender del back del navegador) */}
      <a
        href={`/caminante/admin/kit/${slug}`}
        style={{ position: "fixed", top: 14, left: 14, zIndex: 60, background: "rgba(32,33,28,.82)", color: "#fff", borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: '"Geist",system-ui,sans-serif', backdropFilter: "blur(6px)" }}
      >
        ← Volver al kit
      </a>
      <ExperienceDeck experience={e} slots={slots} orient="v" social={social} />
      <script dangerouslySetInnerHTML={{ __html: DECK_GLASS_SCRIPT }} />
      <SocialExport titulo={titulo} formato={formato} />
      <div style={{ height: 70 }} />
    </>
  );
}
