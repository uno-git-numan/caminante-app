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
import { rebotaDelAlta } from "@/lib/operadores/nav-alta-servidor";
import { esTelefono } from "@/lib/ui/dispositivo";

export const dynamic = "force-dynamic";

export async function GET() {
  const role = await getCurrentRole();
  const ua = (await headers()).get("user-agent") ?? "";
  // ⚠️ UN SOLO destino, calculado en lib/auth/destino.ts. Aquí había dos `if` y
  // un redirect al login de último renglón: el operador no entraba en ninguno de
  // los dos y caía al login — el bucle del 25 ago. Un `switch` exhaustivo en un
  // solo archivo hace imposible repetirlo.
  let destino = destinoPorRol(role, { telefono: esTelefono(ua) });

  // ⚠️ LA OPERADORA EN SU ALTA VA DIRECTO A «MI ALTA», SIN REBOTE (23 nov 2026).
  // Su destino por rol es el Panorama, que mientras no termina el alta está
  // cerrado y la rebota a Mi alta desde el layout. En una carga completa eso
  // son dos 307 y nadie lo nota; pero al crear la cuenta o iniciar sesión se
  // llega aquí con una navegación SIN recarga, y un rebote del layout a media
  // navegación deja el documento VACÍO: título «Mi alta», cuerpo en blanco,
  // hasta recargar. Le pasó a Luis con la operadora de prueba, y le habría
  // pasado a cualquier operadora nueva en su primer minuto. Preguntar aquí lo
  // mismo que pregunta el layout (`rebotaDelAlta`) evita el segundo salto.
  if ((role === "operador" || role === "equipo") && (await rebotaDelAlta(destino))) {
    destino = "/caminante/admin/mi-alta";
  }

  redirect(destino);
}
