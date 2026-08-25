import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentRole } from "@/lib/auth/authorization";
import { rutaDeOperador } from "@/lib/auth/panel-operador";

// LA PUERTA DEL PANEL.
//
// Antes tenía un solo cerrojo (`isCurrentUserAdmin`) y detrás de él las 31
// pantallas completas. Ahora entran dos perfiles y NO ven lo mismo:
//
//   casa     → todo, como siempre.
//   operador → solo las rutas de `panel-operador.ts`, y dentro de ellas solo sus
//              filas (eso lo aplica `lib/auth/alcance.ts`, no este archivo).
//
// ⚠️ La lista blanca se evalúa contra `x-ruta`, que pone el middleware. Si la
// cabecera no llegara, `rutaDeOperador` devuelve false y el operador se va a su
// Panorama: preferimos rebotarlo de una pantalla que sí le tocaba a enseñarle
// una que no.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/caminante/login?next=/caminante/admin");
  }

  const rol = await getCurrentRole();

  if (rol !== "admin" && rol !== "operador") {
    redirect("/caminante?error=not_admin");
  }

  if (rol === "operador") {
    const ruta = (await headers()).get("x-ruta");
    if (!rutaDeOperador(ruta)) {
      redirect("/caminante/admin?aviso=solo_casa");
    }
  }

  return <>{children}</>;
}
