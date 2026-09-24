import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentRole } from "@/lib/auth/authorization";
import { rutaDeOperador } from "@/lib/auth/panel-operador";
import { rebotaDelAlta } from "@/lib/operadores/nav-alta-servidor";

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

  const ruta = (await headers()).get("x-ruta");
  if (rol === "operador") {
    if (!rutaDeOperador(ruta)) {
      redirect("/caminante/admin?aviso=solo_casa");
    }
  }

  // EL ALTA CIERRA SECCIONES (lámina v5, Luis 24 sep 2026): mientras la
  // operadora no la termine, las seis secciones rebotan a Mi alta — también
  // escribiendo la URL. Aplica igual a la casa con el sombrero de una operadora
  // en su alta. Esto cubre la carga completa; la navegación con clics la cubre
  // la cabecera, porque Next no vuelve a correr este layout entre páginas.
  if (await rebotaDelAlta(ruta)) {
    redirect("/caminante/admin/mi-alta");
  }

  return <>{children}</>;
}
