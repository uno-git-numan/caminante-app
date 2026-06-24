import { notFound } from "next/navigation";
import { fetchFeedbackByToken } from "@/lib/feedback/queries";
import FeedbackForm from "./FeedbackForm";

export const dynamic = "force-dynamic";

// Encuesta de satisfacción, acceso por token (sin login). El link llega por
// correo/WhatsApp. Si el token no existe → 404. Si ya respondió, igual puede
// volver a entrar (corregir); el server action sobreescribe.
export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ctx = await fetchFeedbackByToken(token);
  if (!ctx) notFound();

  return (
    <main style={{ background: "#F5F0E8", minHeight: "100vh" }}>
      <FeedbackForm ctx={ctx} />
    </main>
  );
}
