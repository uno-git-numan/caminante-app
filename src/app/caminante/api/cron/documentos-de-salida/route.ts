import { NextResponse } from "next/server";
import { salidasPorAvisar } from "@/lib/operadores/para-salir";
import { emailFaltaParaSalir } from "@/lib/operadores/emails";
import { notifyFaltaParaSalir } from "@/lib/notifications/notify-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cron (Vercel, diario): los documentos que una salida necesita para
// realizarse (convenio v3.5, Anexo B: pólizas, credencial del guía y permisos
// se entregan antes de la primera salida). A 14, 7, 3 y 1 día de cada salida de
// una operadora a la que le falte algo, se le avisa a ella y a la casa.
//
// ⚠️ DIARIO, NO CADA HORA: los umbrales se calculan por día, y con una sola
// corrida al día cada umbral avisa una vez sin guardar estado. Si se corriera
// cada hora mandaría veinticuatro correos iguales.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const avisos = await salidasPorAvisar();
    let enviados = 0;
    for (const a of avisos) {
      const r = await Promise.allSettled([
        a.email ? emailFaltaParaSalir(a.email, null, a) : Promise.resolve(false),
        notifyFaltaParaSalir(a),
      ]);
      for (const x of r) if (x.status === "rejected") console.error("documentos-de-salida:", x.reason);
      enviados += 1;
    }
    return NextResponse.json({ ok: true, salidas: avisos.length, enviados });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
