"use server";

// Botones de «Retenciones del mes». Sólo la casa: emitir un CFDI de retenciones
// es hablarle al SAT a nombre de NUMAN.

import { revalidatePath } from "next/cache";
import { getCurrentRole } from "@/lib/auth/authorization";
import { emitirRetencion, emitirRetencionesDelMes } from "./emitir-retenciones";
import { MES_VALIDO } from "./reporte-retenciones-server";

const RUTA = "/caminante/admin/plataforma/retenciones";

export async function emitirRetencionAction(mes: string, operatorId: string): Promise<{ ok: boolean; mensaje: string }> {
  if ((await getCurrentRole()) !== "admin") return { ok: false, mensaje: "No autorizado." };
  if (!MES_VALIDO.test(mes)) return { ok: false, mensaje: "Mes inválido." };
  const r = await emitirRetencion(mes, operatorId);
  revalidatePath(RUTA);
  return r.ok
    ? { ok: true, mensaje: `Timbrado: ${r.uuid}${r.enviadoA ? ` · enviado a ${r.enviadoA}` : " · sin correo para enviarlo"}` }
    : { ok: false, mensaje: r.error };
}

export async function emitirTodosAction(mes: string): Promise<{ ok: boolean; mensaje: string }> {
  if ((await getCurrentRole()) !== "admin") return { ok: false, mensaje: "No autorizado." };
  if (!MES_VALIDO.test(mes)) return { ok: false, mensaje: "Mes inválido." };
  const r = await emitirRetencionesDelMes(mes);
  revalidatePath(RUTA);
  const bien = r.filter((x) => x.resultado.ok).length;
  const mal = r.filter((x) => !x.resultado.ok);
  return {
    ok: mal.length === 0,
    mensaje: r.length
      ? `${bien} timbrado(s)${mal.length ? ` · ${mal.length} con error: ${mal.map((x) => (x.resultado.ok ? "" : x.resultado.error)).join(" | ")}` : ""}`
      : "No había nada que emitir.",
  };
}
