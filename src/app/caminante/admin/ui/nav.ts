// La lista del nav del panel, en UN solo lugar.
//
// Vivía dentro de AdminShell, y el tablero financiero (que es inmersivo y trae
// su propio header) la repetía a mano. Las dos derivaron: la copia del tablero
// se quedó sin «Comunicación» ni «Solicitudes», y «Rentabilidad» existía solo
// en la copia — por eso la página no se podía encontrar desde el resto del
// panel. Un nav duplicado siempre termina así.

export type AdminSection =
  | "panorama"
  | "eventos"
  | "comunicacion"
  | "solicitudes"
  | "reservas"
  | "personas"
  | "recursos"
  | "operador"
  | "encuesta";

export type AdminNavItem = { key: AdminSection; label: string; href?: string; soon?: boolean };

// «Accesos» se fundió en Solicitudes y «Facturación» vive dentro de Recursos.
// «Operador» se renderiza aparte, a la derecha, con ícono de perfil.
export const ADMIN_NAV: AdminNavItem[] = [
  { key: "panorama", label: "Panorama", href: "/caminante/admin" },
  { key: "eventos", label: "Eventos", href: "/caminante/admin/eventos" },
  { key: "comunicacion", label: "Comunicación", href: "/caminante/admin/comunicacion" },
  { key: "solicitudes", label: "Solicitudes", href: "/caminante/admin/solicitudes" },
  { key: "reservas", label: "Reservas", href: "/caminante/admin/reservas" },
  { key: "personas", label: "Personas", href: "/caminante/admin/personas" },
  // Antes eran DOS: «Dinero» (lo que entró) y «Rentabilidad» (cuánto es tuyo).
  // Dos páginas que hablan de lo mismo se leen como redundancia y obligan a
  // saltar entre ellas para cerrar una cuenta. Ahora es una sola.
  { key: "recursos", label: "Recursos", href: "/caminante/admin/recursos" },
  { key: "encuesta", label: "Encuesta", href: "/caminante/admin/encuesta" },
];
