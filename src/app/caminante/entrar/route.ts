// Punto de entrada ÚNICO por rol: todos los botones "Entrar" apuntan aquí.
// Sin sesión → login (con next de regreso aquí, para rutear al autenticar).
// Con sesión → admin al panel, caminante a su perfil.
import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export async function GET() {
  const role = await getCurrentRole();
  if (role === "admin") redirect("/caminante/admin");
  if (role === "caminante") redirect("/caminante/perfil");
  redirect("/caminante/login?next=/caminante/entrar");
}
