import { fetchPanoramaMovil, fetchRecursosMovil } from "@/lib/admin/movil-datos";
import { fetchEventosMovil } from "@/lib/admin/movil/eventos";
import { fetchGenteMovil } from "@/lib/admin/movil/gente";
import { fetchMasMovil } from "@/lib/admin/movil/mas";
import MovilApp from "./ui/MovilApp";

// El panel en el teléfono: las cinco pestañas con datos reales.
//
// ⚠️ Las cinco cargas van en paralelo y CADA UNA reusa las consultas del
// escritorio (queries.ts, rentabilidad.ts). Si el teléfono y la computadora
// discreparan en una cifra el bug sería imposible de explicar, así que no hay
// consultas propias para los mismos números.
//
// Lo que NO se precarga: el Kit de una experiencia y el perfil de un operador.
// Serían decenas de consultas y 160+ builds de pieza en cada carga del panel
// para algo que casi nunca se mira; esas dos pantallas piden sus datos al
// abrirse (`cargarKitMovil` / `cargarOperadorMovil` en lib/admin/movil/mas.ts).

export const dynamic = "force-dynamic";

export default async function AdminMovilPage() {
  const [panorama, recursos, eventos, gente, mas] = await Promise.all([
    fetchPanoramaMovil(),
    fetchRecursosMovil(),
    fetchEventosMovil(),
    fetchGenteMovil(),
    fetchMasMovil(),
  ]);
  return (
    <MovilApp
      panorama={panorama}
      recursos={recursos}
      eventos={eventos}
      gente={gente}
      mas={mas}
    />
  );
}
