import { redirect } from "next/navigation";

// El tablero de rentabilidad vive ahora dentro de «Recursos», junto a los
// ingresos. Ver el comentario de `recursos/page.tsx`.
export default function RentabilidadPage() {
  redirect("/caminante/admin/recursos");
}
