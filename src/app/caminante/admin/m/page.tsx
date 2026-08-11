import { fetchPanoramaMovil, fetchRecursosMovil } from "@/lib/admin/movil-datos";
import MovilApp from "./ui/MovilApp";

// El panel en el teléfono. Panorama y Recursos ya con datos reales; Eventos,
// Gente y Más llegan después y mientras tanto cada una dice qué falta y manda
// al panel de escritorio, que sí las tiene.

export const dynamic = "force-dynamic";

export default async function AdminMovilPage() {
  const [panorama, recursos] = await Promise.all([fetchPanoramaMovil(), fetchRecursosMovil()]);
  return <MovilApp panorama={panorama} recursos={recursos} />;
}
