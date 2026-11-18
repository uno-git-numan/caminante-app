// QUIÉN RESPONDE Y DÓNDE ESTÁ (D25 de legal, 18 nov 2026).
//
// Dos leyes piden que esto esté a la vista: la LFPC 76 Bis fracción III
// (domicilio físico, teléfonos y demás medios para reclamar, ANTES de celebrar
// la transacción) y la LFPDPPP 2025 art. 15 fracción I (identidad y domicilio
// del responsable en el aviso de privacidad).
//
// Siempre NUMAN, también cuando vende una operadora: la transacción se celebra
// en su plataforma y Caminante responde por la devolución frente al cliente
// (D13, convenio Quinta §5). El domicilio de la operadora NO se publica: muchas
// son personas físicas y su domicilio fiscal es su casa.
//
// ⚠️ El domicilio es el de la Constancia de Situación Fiscal (30 sep 2025) y el
// del preámbulo del convenio publicado. Si la oficina cambia, se actualiza
// primero en el SAT y luego aquí; una prueba lo compara contra el documento de
// legal para que no se desvíen.
//
// Puro y sin dependencias: lo leen pantallas de servidor y de cliente.

export const RAZON_SOCIAL_NUMAN = "NUMAN HUB, S.A. de C.V.";

export const DOMICILIO_NUMAN =
  "Prado Norte 525, interior 204, Lomas de Chapultepec I Sección, Miguel Hidalgo, C.P. 11000, Ciudad de México";

/** El contacto de Caminante para reclamaciones y aclaraciones. Aparece siempre. */
export const CONTACTO_CAMINANTE = {
  whatsapp: "+525512020565",
  email: "uno@numanhub.com",
} as const;

/** El correo del responsable de los datos personales (aviso de privacidad). */
export const CORREO_PRIVACIDAD = "caminante@numanhub.com";

export const waHref = (numero: string): string => `https://wa.me/${numero.replace(/\D/g, "")}`;

/** ¿El contacto de quien vende es distinto del de Caminante? Sólo entonces se enseña aparte. */
export function contactoPropioDe(vende: { whatsapp: string | null; email: string | null } | null): { whatsapp: string | null; email: string | null } | null {
  if (!vende) return null;
  const digitos = (n: string | null) => (n ?? "").replace(/\D/g, "");
  const whatsapp = vende.whatsapp && digitos(vende.whatsapp) !== digitos(CONTACTO_CAMINANTE.whatsapp) ? vende.whatsapp : null;
  const email = vende.email && vende.email.trim().toLowerCase() !== CONTACTO_CAMINANTE.email ? vende.email : null;
  return whatsapp || email ? { whatsapp, email } : null;
}
