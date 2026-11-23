// LO QUE VIVE DETRÁS DE «MÁS» (23 nov 2026).
//
// El menú de la casa se quedó con lo de todos los días (ver `nav.ts`). Estas
// son las secciones que salieron del frente: siguen enteras en su ruta, y la
// página «Más» las lista con una línea que dice para qué sirve cada una.
//
// Una prueba comprueba que TODA sección que estaba en el menú esté al frente o
// aquí: sacar algo del menú sin listarlo sería perderlo.

export type SeccionGuardada = { nombre: string; href: string; paraQue: string };

/** Con el sombrero de una operadora (Caminante, Kéntro). */
export const SECCIONES_GUARDADAS: SeccionGuardada[] = [
  { nombre: "Panorama", href: "/caminante/admin", paraQue: "El tablero general: ocupación, dinero del mes y lo que pide atención." },
  { nombre: "Comunidad", href: "/caminante/admin/comunidad", paraQue: "Tus clientes, el tablero de seguimiento y las solicitudes de fecha." },
  { nombre: "Comunicación", href: "/caminante/admin/comunicacion", paraQue: "El kit de piezas de cada experiencia, las redes y el boletín." },
  { nombre: "Recursos", href: "/caminante/admin/recursos", paraQue: "Rentabilidad, cotizador, proveedores y facturación." },
];

/** Con el sombrero de numan (la plataforma). */
export const SECCIONES_GUARDADAS_PLATAFORMA: SeccionGuardada[] = [
  { nombre: "Panorama", href: "/caminante/admin/plataforma", paraQue: "El tablero de la plataforma: ventas, comisión y operadoras." },
  { nombre: "Experiencias", href: "/caminante/admin/plataforma/experiencias", paraQue: "El catálogo de todas las operadoras, por estado de vida." },
  { nombre: "Recursos", href: "/caminante/admin/plataforma/recursos", paraQue: "Liquidaciones a las operadoras, retenciones y costos." },
  { nombre: "Equipo", href: "/caminante/admin/plataforma/equipo", paraQue: "Quién trabaja para numan y para cada operadora, y qué puede hacer." },
];
