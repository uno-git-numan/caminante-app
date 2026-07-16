// Contratos de la encuesta de satisfacción (/caminante/feedback/[token]).
// La invitación nace al enviarse (con token); el usuario responde sin login.

// Una sección del desglose opcional — VARÍA por experiencia (se define en
// Experience.feedback.sections). Ocean Safari ≠ un volcán.
export type FeedbackSection = {
  key: string; // "vida_marina", "guias", ...
  label: string; // "Los encuentros con el mar vivo"
  icon?: string; // "🐋"
  prompt?: string; // ayuda corta opcional
};

// Lo que la página necesita para renderizarse, resuelto desde el token server-side.
export type FeedbackContext = {
  token: string;
  status: "invited" | "submitted";
  firstName: string; // saludo
  locationLabel: string; // "Ensenada de Muertos, BCS" — por LOCACIÓN, no fecha
  experienceTitle: string;
  npsEnabled: boolean;
  sections: FeedbackSection[];
  testimonialPrompt: string;
  voiceSub: string; // subtítulo del paso testimonio (data-driven por experiencia)
  feedbackVersion: string;
};

// Copys ATEMPORALES por defecto (sirven a cualquier entorno: mar, bosque, montaña…).
// Cada experiencia puede sobreescribirlos en su config de encuesta (emailIntro/voiceSub).
export const DEFAULT_EMAIL_INTRO =
  "La experiencia ya quedó atrás, pero algo de ella se queda contigo. Antes de que se difumine, cuéntanos cómo te fuiste.";
export const DEFAULT_VOICE_SUB = "Lo que te llevas, dicho con tu voz.";

// Calificación de una sección del desglose.
export type SectionRating = {
  stars: number; // 1–5
  comment?: string;
};

// El payload que manda el cliente al responder.
export type FeedbackInput = {
  token: string;
  // pulso (todos)
  overallStars: number; // 1–5
  nps: number | null; // 0–10
  // desglose (opcional) — key de sección → calificación
  sectionRatings: Record<string, SectionRating>;
  // abiertas
  lovedText: string;
  improveText: string;
  expectedGapText: string;
  rebookInterest: boolean;
  // testimonio publicable (SOLO con iniciales si autoriza)
  testimonialText: string;
  testimonialStars: number | null;
  testimonialConsent: boolean; // permiso de publicar (con iniciales)
  photoConsent: boolean;
};

export type FeedbackResult =
  | { ok: true; alreadySubmitted: boolean }
  | { ok: false; error: string };
