// Slug de estado ↔ nombre canónico. El slug alimenta la ruta /caminante/destinos/[estado].
// "Baja California Sur" → "baja-california-sur", "Estado de México" → "estado-de-mexico".
import { ESTADOS, type EstadoMX } from "@/lib/experiences/estados";

export function slugifyEstado(estado: string): string {
  return estado
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// slug → estado canónico (solo estados reales; "Otro" no tiene destino).
export function estadoFromSlug(slug: string): EstadoMX | null {
  const s = slugifyEstado(slug);
  const match = ESTADOS.find((e) => e !== "Otro" && slugifyEstado(e) === s);
  return (match as EstadoMX) ?? null;
}
