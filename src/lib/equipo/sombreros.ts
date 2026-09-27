// LOS SOMBREROS DE ALGUIEN DEL EQUIPO — puro, sin servidor.
//
// Una persona puede ser DUEÑA de una operadora (su fila en `operators` con
// panel) y a la vez EQUIPO de otras (`staff_operadoras`). Caso real, 27 sep
// 2026: Cat es la dueña de Nomádika y Luis la quiere de equipo de Caminante,
// con el mismo correo. La pastilla le enseña las dos y decide a nombre de
// quién actúa:
//   · con el sombrero de la SUYA es dueña plena (sin facultades que la acoten);
//   · con el de otra es equipo, con lo que le prendieron.
// Por omisión trae puesta la suya: es dueña antes que empleada.

export type Sombrero = { id: string; nombre: string; slug: string | null; duena: boolean };

export function sombrerosDe(eq: {
  duena: { id: string; nombre: string; slug: string | null } | null;
  operadoras: { id: string; nombre: string; slug: string | null }[];
}): Sombrero[] {
  const otras = eq.operadoras.filter((o) => o.id !== eq.duena?.id).map((o) => ({ ...o, duena: false }));
  return eq.duena ? [{ ...eq.duena, duena: true }, ...otras] : otras;
}

/** El sombrero puesto: el de la cookie si es uno de los suyos; si no, el primero (la suya, si es dueña). */
export function elegirSombrero(opciones: Sombrero[], cookie: string | null | undefined): Sombrero | null {
  if (!opciones.length) return null;
  const pedido = (cookie ?? "").trim();
  return (pedido && opciones.find((o) => o.slug === pedido)) || opciones[0];
}
