// ¿LA LLAMADA ES OBLIGATORIA PARA ENTRAR?
//
// Luis, 9 nov 2026: «pon la llamada como opción al paso; por ahora sí haremos
// muchas llamadas, pero debería poder pasar libre cuando escalemos. Por ahora
// deja la llamada.»
//
// · Obligatoria (hoy, el valor por omisión): la solicitud espera a que la casa
//   la apruebe —con llamada o sin ella, la casa decide— y sólo entonces se
//   abre su panel.
// · Opcional (`ALTA_LLAMADA=opcional` en Vercel, y un redeploy: Vercel lee las
//   variables al construir): la solicitud se APRUEBA SOLA al llegar
//   (`aprobar-solicitud.ts`), su panel se abre ese minuto, y la llamada queda
//   como bienvenida que la casa puede agendar igual.
//
// Cualquier otro valor, o ninguno, es «obligatoria»: ante la duda, una persona
// mira la solicitud.
export function llamadaObligatoria(): boolean {
  return (process.env.ALTA_LLAMADA ?? "").trim().toLowerCase() !== "opcional";
}
