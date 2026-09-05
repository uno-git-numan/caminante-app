"use server";

// MANDAR LA ENCUESTA A MANO.
//
// ⚠️ EXISTE PORQUE UN SISTEMA CUYO ÚNICO DISPARADOR ES UN CRON ES FRÁGIL, y esa
// fragilidad ya costó: la salida de Hacienda y hongos (Ago 29-30) terminó y a
// NADIE le llegó la encuesta. El cron de encuestas nunca corrió — `vercel.json`
// declara SIETE crons y el plan es Hobby, que permite UNO. Vercel se queda con
// el primero y los demás no existen; el de encuestas es el segundo de la lista.
//
// El síntoma fue el de siempre con esto: silencio. Nadie recibió nada y el panel
// decía «0 de 0» sin que nada gritara. Un botón no arregla el cron, pero le
// quita al cron el monopolio de que la encuesta salga.
//
// Reusa `runSurveyDispatch` tal cual: el mismo gate de «el día que acaba más
// uno, 19:30 de la ciudad de cada quien», la misma idempotencia. Apretarlo dos
// veces no manda dos correos.

import { revalidatePath } from "next/cache";
import { alcanceActual } from "@/lib/auth/alcance";
import { runSurveyDispatch } from "./send";

export async function dispararEncuestasAhora(): Promise<
  { ok: true; mensaje: string } | { ok: false; error: string }
> {
  const alcance = await alcanceActual();
  if (!alcance) return { ok: false, error: "No autorizado. Inicia sesión." };

  try {
    const r = await runSurveyDispatch();
    revalidatePath("/caminante/admin/salidas");
    const partes = [
      `${r.invited} ${r.invited === 1 ? "encuesta enviada" : "encuestas enviadas"}`,
      `${r.dueSlots} ${r.dueSlots === 1 ? "salida revisada" : "salidas revisadas"}`,
    ];
    // Que «no mandé nada» diga POR QUÉ. Un cero sin explicación es lo que dejó
    // pasar tres días sin que nadie notara que la encuesta no había salido.
    if (r.esperandoSuHora) partes.push(`${r.esperandoSuHora} esperan a que den las 19:30 en su ciudad`);
    if (r.skipped) partes.push(`${r.skipped} ya la tenían`);
    if (r.errors) partes.push(`${r.errors} fallaron`);
    return { ok: true, mensaje: partes.join(" · ") };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
