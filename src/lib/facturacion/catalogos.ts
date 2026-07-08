// Catálogos SAT (CFDI 4.0) para el formulario de autofactura + validación
// server-side. Subconjunto práctico: lo que un cliente de experiencias suele
// necesitar. Facturapi valida contra el catálogo completo del SAT y regresa el
// error exacto si algo no cuadra (régimen×uso, RFC×razón social, CP) — aquí solo
// filtramos lo evidente para dar buenos mensajes antes de gastar un timbre.

export type Regimen = { clave: string; label: string; persona: "fisica" | "moral" | "ambos" };

// c_RegimenFiscal — los vigentes más comunes. `persona` filtra el dropdown por
// la longitud del RFC (12 = moral, 13 = física).
export const REGIMENES: Regimen[] = [
  { clave: "605", label: "605 · Sueldos y salarios e ingresos asimilados", persona: "fisica" },
  { clave: "606", label: "606 · Arrendamiento", persona: "fisica" },
  { clave: "608", label: "608 · Demás ingresos", persona: "fisica" },
  { clave: "611", label: "611 · Ingresos por dividendos (socios y accionistas)", persona: "fisica" },
  { clave: "612", label: "612 · Personas físicas con actividades empresariales y profesionales", persona: "fisica" },
  { clave: "614", label: "614 · Ingresos por intereses", persona: "fisica" },
  { clave: "616", label: "616 · Sin obligaciones fiscales", persona: "fisica" },
  { clave: "621", label: "621 · Incorporación fiscal", persona: "fisica" },
  { clave: "625", label: "625 · Actividades empresariales con ingresos por plataformas tecnológicas", persona: "fisica" },
  { clave: "626", label: "626 · Régimen Simplificado de Confianza (RESICO)", persona: "ambos" },
  { clave: "601", label: "601 · General de Ley Personas Morales", persona: "moral" },
  { clave: "603", label: "603 · Personas Morales con Fines no Lucrativos", persona: "moral" },
  { clave: "610", label: "610 · Residentes en el extranjero sin establecimiento permanente", persona: "ambos" },
  { clave: "620", label: "620 · Sociedades Cooperativas de Producción", persona: "moral" },
  { clave: "622", label: "622 · Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras", persona: "moral" },
  { clave: "623", label: "623 · Opcional para Grupos de Sociedades", persona: "moral" },
  { clave: "624", label: "624 · Coordinados", persona: "moral" },
];

export type UsoCfdi = { clave: string; label: string };

// c_UsoCFDI — los usos que aplican a un gasto por una experiencia. G03 (gastos
// en general) es el default sensato; S01 para quien no le da efectos fiscales.
export const USOS_CFDI: UsoCfdi[] = [
  { clave: "G03", label: "G03 · Gastos en general" },
  { clave: "G01", label: "G01 · Adquisición de mercancías" },
  { clave: "I08", label: "I08 · Otra maquinaria y equipo" },
  { clave: "D10", label: "D10 · Pagos por servicios educativos (colegiaturas)" },
  { clave: "CP01", label: "CP01 · Pagos" },
  { clave: "S01", label: "S01 · Sin efectos fiscales" },
];

export const USO_CFDI_DEFAULT = "G03";
export const RFC_GENERICO = "XAXX010101000"; // público en general

// RFC: 12 caracteres = persona moral, 13 = persona física. Homoclave incluida.
const RFC_MORAL = /^[A-ZÑ&]{3}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$/;
const RFC_FISICA = /^[A-ZÑ&]{4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$/;

export function tipoPersonaDeRfc(rfcRaw: string): "fisica" | "moral" | null {
  const rfc = rfcRaw.trim().toUpperCase();
  if (rfc === RFC_GENERICO) return null; // genérico: no aplica autofactura individual
  if (RFC_MORAL.test(rfc)) return "moral";
  if (RFC_FISICA.test(rfc)) return "fisica";
  return null;
}

export function esRfcValido(rfc: string): boolean {
  return tipoPersonaDeRfc(rfc) !== null;
}

export function esCpValido(cp: string): boolean {
  return /^[0-9]{5}$/.test(cp.trim());
}

// Valida que un régimen exista y sea compatible con el tipo de persona del RFC.
export function regimenCompatible(rfc: string, regimen: string): boolean {
  const tipo = tipoPersonaDeRfc(rfc);
  const r = REGIMENES.find((x) => x.clave === regimen.trim());
  if (!tipo || !r) return false;
  return r.persona === "ambos" || r.persona === tipo;
}

export function usoCfdiValido(uso: string): boolean {
  return USOS_CFDI.some((u) => u.clave === uso.trim());
}
