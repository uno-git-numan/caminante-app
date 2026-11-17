"use server";

// LAS ACCIONES DE «FACTURACIÓN DESDE EL PORTAL» (D20).
//
// ⚠️ QUIÉN PUEDE QUÉ. Activar y subir el CSD lo hace LA OPERADORA, desde su
// sesión: el convenio dice que ella acepta y que ella carga su certificado
// (Décima tercera §1 bis, ii). La casa NO activa ni sube por una operadora
// externa. La única excepción es una operadora PROPIA (`operators.propia`,
// 0069), donde la casa ES la operadora. Desactivar sí lo puede hacer la casa:
// al terminar el convenio, o por instrucción de ella.
//
// ⚠️ EL CSD NO TOCA DISCO (D20 bis). `subirCsdAction` recibe los dos archivos y
// la contraseña en el FormData y los reenvía a Facturapi en la misma petición;
// no se loguean, no se suben al bucket y no se devuelven.

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { operadorDelAlcance } from "@/lib/admin/queries";
import { correoEnSesion, isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { activarFacturacionPortal, desactivarFacturacionPortal } from "@/lib/facturacion/portal";
import { conectarCsdFacturapi, sincronizarManifiesto } from "@/lib/facturacion/organizacion";

export type ResPortal = { ok: true; mensaje?: string } | { ok: false; error: string };

const MAX_BYTES = 64 * 1024; // un .cer o .key del SAT pesa 1–2 KB

async function rastro() {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return { ip: fwd ? fwd.split(",")[0].trim() : h.get("x-real-ip"), userAgent: h.get("user-agent") };
}

/** ¿Actúa como la operadora sobre `operatorId`? Ella misma, o la casa sobre una operadora propia. */
async function comoOperadora(operatorId: string): Promise<boolean> {
  if (!operatorId) return false;
  const propio = await operadorDelAlcance();
  if (propio) return propio === operatorId;
  if (!(await isCurrentUserAdmin())) return false;
  const { data } = await createSupabaseAdminClient().from("operators").select("propia").eq("id", operatorId).maybeSingle();
  return Boolean((data as { propia?: boolean } | null)?.propia);
}

function revalidar() {
  revalidatePath("/caminante/admin/mi-alta/cobrar");
  revalidatePath("/caminante/admin/operadores/cobros");
}

export async function activarFacturacionAction(fd: FormData): Promise<ResPortal> {
  const operatorId = String(fd.get("operatorId") ?? "").trim();
  if (!(await comoOperadora(operatorId))) return { ok: false, error: "Sólo la operadora activa su facturación, desde su panel." };
  const r = await activarFacturacionPortal({
    operatorId,
    version: String(fd.get("version") ?? ""),
    hashMostrado: String(fd.get("hash") ?? ""),
    aceptado: fd.get("aceptado") === "on",
    nombre: String(fd.get("nombre") ?? ""),
    email: (await correoEnSesion()) ?? "",
    ...(await rastro()),
  });
  if (r.ok) revalidar();
  return r;
}

export async function subirCsdAction(fd: FormData): Promise<ResPortal> {
  const operatorId = String(fd.get("operatorId") ?? "").trim();
  if (!(await comoOperadora(operatorId))) return { ok: false, error: "Sólo la operadora sube su CSD, desde su panel." };
  const cer = fd.get("cer");
  const key = fd.get("key");
  const password = String(fd.get("password") ?? "");
  if (!(cer instanceof File) || !(key instanceof File) || !cer.size || !key.size) return { ok: false, error: "Hacen falta los dos archivos: el .cer y el .key." };
  if (!cer.name.toLowerCase().endsWith(".cer") || !key.name.toLowerCase().endsWith(".key")) return { ok: false, error: "El certificado termina en .cer y la llave privada en .key." };
  if (cer.size > MAX_BYTES || key.size > MAX_BYTES) return { ok: false, error: "Esos archivos son demasiado grandes para ser un CSD del SAT." };
  const r = await conectarCsdFacturapi(operatorId, cer, key, password);
  if (!r.ok) return { ok: false, error: r.error };
  revalidar();
  return { ok: true, mensaje: "Tu certificado quedó en Facturapi." };
}

export async function verificarManifiestoAction(operatorId: string): Promise<ResPortal> {
  const id = (operatorId ?? "").trim();
  if (!(await comoOperadora(id)) && !(await isCurrentUserAdmin())) return { ok: false, error: "No autorizado." };
  const r = await sincronizarManifiesto(id);
  if (!r.ok) return r;
  revalidar();
  return r.firmada
    ? { ok: true, mensaje: "Facturapi ya tiene tu carta manifiesto firmada." }
    : { ok: false, error: "Facturapi todavía no ve la carta firmada. Si ya la firmaste, espera un minuto y vuelve a verificar." };
}

export async function desactivarFacturacionAction(fd: FormData): Promise<ResPortal> {
  const operatorId = String(fd.get("operatorId") ?? "").trim();
  const ella = await comoOperadora(operatorId);
  const casa = !ella && (await isCurrentUserAdmin());
  if (!ella && !casa) return { ok: false, error: "No autorizado." };
  const r = await desactivarFacturacionPortal({
    operatorId,
    rol: ella ? "operadora" : "casa",
    motivo: String(fd.get("motivo") ?? ""),
    nombre: String(fd.get("nombre") ?? "") || null,
    email: (await correoEnSesion()) ?? "",
    ...(await rastro()),
  });
  if (!r.ok) return r;
  revalidar();
  return { ok: true, mensaje: r.bajaCsd ? "Facturación desactivada y certificado dado de baja en Facturapi." : "Facturación desactivada." };
}
