// Lecturas del boletín para la UI del Kit. Tolerante a que 0028 aún no esté
// aplicada: si la tabla no existe, la sección se muestra vacía en vez de tumbar
// la página del Kit entera (misma defensa que usa el kit con los testimonios).
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { NewsletterBody, NewsletterTemplate } from "./templates";

export type NewsletterRow = {
  id: string;
  experience_slug: string | null;
  template: NewsletterTemplate;
  subject: string;
  preheader: string;
  body: NewsletterBody;
  status: "draft" | "sent";
  sent_at: string | null;
  recipients_count: number | null;
  created_at: string;
};

export type BoletinData = {
  tablaLista: boolean; // false = falta aplicar la migración 0028
  borrador: NewsletterRow | null;
  enviados: NewsletterRow[];
};

export async function fetchBoletin(slug: string): Promise<BoletinData> {
  try {
    const sb = createSupabaseAdminClient();
    const { data, error } = await sb
      .from("newsletters")
      .select("id, experience_slug, template, subject, preheader, body, status, sent_at, recipients_count, created_at")
      .eq("experience_slug", slug)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return { tablaLista: false, borrador: null, enviados: [] };
    const filas = (data ?? []) as NewsletterRow[];
    return {
      tablaLista: true,
      borrador: filas.find((f) => f.status === "draft") ?? null,
      enviados: filas.filter((f) => f.status === "sent"),
    };
  } catch {
    return { tablaLista: false, borrador: null, enviados: [] };
  }
}
