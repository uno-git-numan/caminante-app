// TEMP — verificación visual del deck sin gate. BORRAR antes de commitear.
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Experience } from "@/lib/experiences/types";
import { fetchOpenSlotsForTemplate } from "@/lib/experiences/availability";
import { deckCss } from "@/lib/experiences/deck-css";
import ExperienceDeck from "../../experiencias/[slug]/ExperienceDeck";

export const dynamic = "force-dynamic";

export default async function DeckCheck({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ o?: string }>;
}) {
  const { slug } = await params;
  const { o } = await searchParams;
  const orient: "h" | "v" = o === "v" ? "v" : "h";
  const sb = createSupabaseAdminClient();
  const { data: row } = await sb.from("experiences").select("id, data").eq("slug", slug).maybeSingle();
  if (!row?.data) notFound();
  const e = row.data as Experience;
  const slots = await fetchOpenSlotsForTemplate((row as { id: string }).id);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: deckCss(orient) }} />
      <ExperienceDeck experience={e} slots={slots} orient={orient} />
    </>
  );
}
