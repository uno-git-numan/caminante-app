// Punto de entrada ÚNICO por rol: todos los botones "Entrar" apuntan aquí.
// Sin sesión → login (con next de regreso aquí, para rutear al autenticar).
// Con sesión → admin al panel, caminante a su perfil.
//
// ⚠️ El admin en TELÉFONO va al panel-app (`/caminante/admin/m`), no al de
// escritorio. El panel móvil existía desde el 11 ago pero NADIE lo enlazaba:
// abrir el panel desde el celular daba la tabla de escritorio y Luis
// preguntó, con razón, por qué. Un solo botón, tres destinos según quién y
// desde dónde.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

/**
 * ¿Viene de un teléfono?
 *
 * ⚠️ Olfatear el user-agent está PROHIBIDO en las páginas públicas (rompería el
 * caché de Vercel: una misma URL devolvería documentos distintos). Aquí es
 * seguro y correcto: esta ruta es `force-dynamic`, no se cachea nunca, y su
 * única salida es un redirect — no hay documento que envenenar.
 */
function esTelefono(ua: string): boolean {
  // Tablets fuera a propósito: en un iPad cabe el panel de escritorio.
  return /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua);
}

export async function GET() {
  const role = await getCurrentRole();

  if (role === "admin") {
    const ua = (await headers()).get("user-agent") ?? "";
    redirect(esTelefono(ua) ? "/caminante/admin/m" : "/caminante/admin");
  }
  if (role === "caminante") redirect("/caminante/perfil");
  redirect("/caminante/login?next=/caminante/entrar");
}
