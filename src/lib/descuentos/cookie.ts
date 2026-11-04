// LA COOKIE DEL CÓDIGO DE DESCUENTO. Sin "server-only": la escribe el
// middleware (Edge) y la lee /reservar. Guarda sólo el código en mayúsculas;
// quién lo valida y contra qué salida es `resolverCodigo`, nunca esto.
export const CODIGO_COOKIE = "caminante_codigo";
export const OPCIONES_CODIGO = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/caminante",
  maxAge: 30 * 24 * 60 * 60,
};
