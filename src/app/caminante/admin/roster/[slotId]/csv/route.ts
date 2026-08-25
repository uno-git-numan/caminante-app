import { NextResponse } from "next/server";
import { puedeEditarSlot } from "@/lib/auth/alcance";
import { fetchRoster } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

// Export CSV del roster (datos sensibles → solo admin).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slotId: string }> },
) {
  // ⚠️ Esta ruta EXPORTA el roster —alergias, padecimientos, teléfonos— en CSV.
  // Tiene que llevar exactamente la misma guarda que la pantalla, o sería la
  // puerta de atrás de la pantalla más sensible del panel.
  const { slotId } = await params;
  if (!(await puedeEditarSlot(slotId))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!/^[0-9a-fA-F-]{36}$/.test(slotId)) {
    return NextResponse.json({ error: "Salida inválida" }, { status: 400 });
  }
  const roster = await fetchRoster(slotId);
  if (!roster) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const esc = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lineas = [
    ["Nombre", "Edad", "Contacto de emergencia", "Alergias/condiciones/dieta", "Contrató", "Deslinde", "Viene con"].join(","),
    ...roster.rows.map((r) =>
      [
        esc(r.nombre),
        esc(r.edad),
        esc(r.emergencia),
        esc(r.condiciones),
        esc(r.adicional || ""),
        r.deslinde ? `Firmado ${r.fechaFirma || ""}`.trim() : "PENDIENTE",
        esc(r.titular || ""),
      ].join(","),
    ),
  ];
  const nombre = `roster-${roster.experienciaSlug}-${(roster.salidaLabel || "salida").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
  return new NextResponse("﻿" + lineas.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}"`,
    },
  });
}
