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
import { destinoPorRol } from "@/lib/auth/destino";
import { esTelefono } from "@/lib/ui/dispositivo";

export const dynamic = "force-dynamic";

export async function GET() {
  const role = await getCurrentRole();
  const ua = (await headers()).get("user-agent") ?? "";
  // ⚠️ UN SOLO destino, calculado en lib/auth/destino.ts. Aquí había dos `if` y
  // un redirect al login de último renglón: el operador no entraba en ninguno de
  // los dos y caía al login — el bucle del 25 ago. Un `switch` exhaustivo en un
  // solo archivo hace imposible repetirlo.
  redirect(destinoPorRol(role, { telefono: esTelefono(ua) }));
}
