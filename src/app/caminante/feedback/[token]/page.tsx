import { notFound } from "next/navigation";
import { fetchFeedbackByToken } from "@/lib/feedback/queries";
import { fetchOperatorTheme } from "@/lib/operators/branding";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import WhiteLabelStyles, { wlDoc } from "../../ui/wl/WhiteLabelStyles";
import FeedbackForm from "./FeedbackForm";

export const dynamic = "force-dynamic";

// Encuesta de satisfacción, acceso por token (sin login). El link llega por
// correo/WhatsApp. Si el token no existe → 404. Si ya respondió, igual puede
// volver a entrar (corregir); el server action sobreescribe.
export default async function FeedbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const { token } = await params;
  const { s } = await searchParams;
  const ctx = await fetchFeedbackByToken(token);
  if (!ctx) notFound();

  // ⚠️ LA ENCUESTA SE VISTE DE QUIEN OPERÓ EL VIAJE. Quien la contesta acaba de
  // caminar con ELLA; recibir una encuesta con la cara de otra marca se siente
  // de otro y baja la respuesta. `FeedbackForm` ya usa el vocabulario del tema
  // —--olive, --orange, --cream, --sand…— así que no hace falta puente: basta
  // con ponerle la clase y el <style>.
  //
  // La casa no se viste de sí misma: `fetchOperatorTheme` devuelve su fila sin
  // colores, `marcaLista` da false y `wlDoc` no pone nada.
  const tema = await fetchOperatorTheme(ctx.operatorId);
  const esLaCasa = await (async () => {
    if (!ctx.operatorId) return true;
    const sb = createSupabaseAdminClient();
    const { data } = await sb.from("operators").select("es_la_casa").eq("id", ctx.operatorId).maybeSingle();
    return (data as { es_la_casa: boolean | null } | null)?.es_la_casa === true;
  })();
  const vestir = esLaCasa ? null : tema;

  // Estrella tocada en el correo: ?s=1..5 → pre-rellena la calificación general.
  const n = Number(s);
  const initialStars = Number.isFinite(n) && n >= 1 && n <= 5 ? Math.round(n) : 0;

  return (
    <main
      className={wlDoc(vestir)}
      style={{ background: "var(--cream, #F5F0E8)", minHeight: "100vh" }}
    >
      <WhiteLabelStyles theme={vestir} />
      <FeedbackForm ctx={ctx} initialStars={initialStars} />
    </main>
  );
}
