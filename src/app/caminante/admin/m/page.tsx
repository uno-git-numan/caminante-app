import { fetchPanoramaMovil } from "@/lib/admin/movil-datos";
import MovilApp from "./ui/MovilApp";

// M1 · cimientos: el caparazón con sus 5 pestañas y Panorama ya con datos
// reales. Eventos, Gente, Dinero y Más llegan en las fases siguientes; mientras
// tanto cada una dice qué falta y manda al panel de escritorio, que sí las tiene.

export const dynamic = "force-dynamic";

export default async function AdminMovilPage() {
  const panorama = await fetchPanoramaMovil();
  return <MovilApp panorama={panorama} />;
}
