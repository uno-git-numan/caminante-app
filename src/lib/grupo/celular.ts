// EL CELULAR, normalizado. Sin "server-only": lo usan acciones, loaders y el
// mensaje de WhatsApp. (Vivía en lib/grupo/codigo.ts, que se fue el 7 nov 2026
// con la verificación por código: el celular se pide, no se verifica, hasta
// que haya número real de WhatsApp. Ver .claude/rules/experiencias.md.)

/** Celular a E.164. Diez dígitos = México. Devuelve null si no parece un celular. */
export function celularE164(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return `+52${d}`;
  if (d.length === 12 && d.startsWith("52")) return `+${d}`;
  if (d.length === 13 && d.startsWith("521")) return `+52${d.slice(3)}`; // el «1» viejo de móvil
  if (d.length >= 11 && d.length <= 15) return `+${d}`;
  return null;
}
