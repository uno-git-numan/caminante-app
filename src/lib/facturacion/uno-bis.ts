// El párrafo «1 bis» de la Décima tercera del convenio (v3.3): las condiciones
// de la facturación desde el portal que la operadora acepta al activarla (D20).
// Puro a propósito: lo prueba tests/unit contra el firmable publicado.

/** El párrafo del §1 bis tal como está en un convenio. null si esa versión no lo trae. */
export function parrafoUnoBis(textoConvenio: string): string | null {
  const linea = textoConvenio.split("\n").find((l) => l.trim().startsWith("**1 bis"));
  return linea ? linea.trim() : null;
}
