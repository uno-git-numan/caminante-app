// "Accesos" se fundió en Solicitudes (Solicitud operador + Solicitud cliente).
// Este redirect mantiene vivos los links viejos (correos de notifyAccesoOperador).
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AccesosRedirect() {
  redirect("/caminante/admin/comunidad");
}
