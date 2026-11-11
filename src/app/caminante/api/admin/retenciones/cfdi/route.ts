// Descarga el PDF o el XML de un CFDI de retenciones ya timbrado. Sólo la casa.
//   ?id=<cfdi_retenciones.id>&formato=pdf|xml
import { NextResponse } from "next/server";
import { getCurrentRole } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { clienteFacturapi, llaveDeLaCasa } from "@/lib/facturacion/facturapi";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if ((await getCurrentRole()) !== "admin") return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const formato = url.searchParams.get("formato") === "xml" ? "xml" : "pdf";
  const { data } = await createSupabaseAdminClient()
    .from("cfdi_retenciones")
    .select("facturapi_id, uuid, mes, estado")
    .eq("id", id)
    .maybeSingle();
  const c = data as { facturapi_id: string | null; uuid: string | null; mes: string; estado: string } | null;
  if (!c?.facturapi_id || c.estado !== "timbrado") return NextResponse.json({ error: "No hay CFDI timbrado con ese id." }, { status: 404 });
  const archivo = await clienteFacturapi(llaveDeLaCasa()).descargarRetencion(c.facturapi_id, formato);
  return new NextResponse(archivo, {
    headers: {
      "Content-Type": formato === "xml" ? "application/xml" : "application/pdf",
      "Content-Disposition": `attachment; filename="retencion-${c.mes}-${c.uuid}.${formato}"`,
      "Cache-Control": "no-store",
    },
  });
}
