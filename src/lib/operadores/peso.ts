// EL PESO DE UN ARCHIVO, EN PALABRAS — puro y sin servidor.
//
// Vive aparte de `expediente.ts` a propósito: ese módulo es `server-only`
// (abre Supabase) y el renglón de documento es un componente CLIENTE. Una
// función pura dentro de un módulo de servidor arrastra al cliente hasta la
// llave de servicio y Next tumba el build nombrando sólo al módulo del fondo.
// El invariante «Ningún componente cliente alcanza el servidor» lo cazó el
// 25 sep 2026 con la función recién puesta en expediente.ts; el build de
// Vercel la habría tumbado. Por eso vive aquí.

/** «1,2 MB» o «340 KB», como lo escribe la lámina «Panel Operadora». */
export function pesoEnPalabras(b: number): string {
  return b >= 1048576
    ? (b / 1048576).toFixed(1).replace(".", ",") + " MB"
    : Math.max(1, Math.round(b / 1024)) + " KB";
}
