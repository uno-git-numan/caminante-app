// FORMATEADORES PUROS del espacio del grupo. Sin imports de servidor: los
// usan componentes de cliente y de servidor por igual (ver lib/admin/formato.ts
// para el porqué de esta regla).

/** "$14,000" — para correos, WhatsApp y el panel. */
export function fmtMxn(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/** "$14.000" — el formato del sitio público móvil (pfmt del entregable). */
export function precioPub(n: number): string {
  return `$${Math.round(n).toLocaleString("de-DE")}`;
}

/** "MC" */
export function inicialesDe(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}
