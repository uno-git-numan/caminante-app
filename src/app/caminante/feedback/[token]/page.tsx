import { notFound } from "next/navigation";
import { fetchFeedbackByToken } from "@/lib/feedback/queries";
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

  // Estrella tocada en el correo: ?s=1..5 → pre-rellena la calificación general.
  const n = Number(s);
  const initialStars = Number.isFinite(n) && n >= 1 && n <= 5 ? Math.round(n) : 0;

  return (
    <main style={{ background: "#F5F0E8", minHeight: "100vh" }}>
      <FeedbackForm ctx={ctx} initialStars={initialStars} />
    </main>
  );
}
