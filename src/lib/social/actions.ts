"use server";

// Acciones del módulo "Conectar redes". Cada una RE-VERIFICA admin (el gate del
// layout no cubre server actions invocadas directo).

import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { authorizeUrl, signState } from "@/lib/social/instagram";
import { disconnectAccount } from "@/lib/social/accounts";

// Ruta interna a la que volver tras el flujo (evita open-redirect).
function safeReturn(raw: FormDataEntryValue | null): string {
  const r = typeof raw === "string" ? raw : "";
  return r.startsWith("/caminante/") ? r : "/caminante/admin/experiencias";
}

// Arranca el OAuth: firma el state (CSRF + ruta de regreso) y redirige a Meta.
export async function conectarInstagram(formData: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) redirect("/caminante/entrar");
  const returnTo = safeReturn(formData.get("returnTo"));
  const url = authorizeUrl(signState(returnTo));
  if (!url.ok) {
    redirect(`${returnTo}?redes=error&msg=${encodeURIComponent(url.error)}`);
  }
  redirect(url.url);
}

// Desconecta (borra la fila → limpia el token del sistema).
export async function desconectarInstagram(formData: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) redirect("/caminante/entrar");
  const returnTo = safeReturn(formData.get("returnTo"));
  const id = formData.get("id");
  if (typeof id === "string" && id) await disconnectAccount(id);
  redirect(`${returnTo}?redes=desconectada`);
}
