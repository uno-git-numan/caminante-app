import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "../../ui/AdminShell";
import { fetchRoster } from "@/lib/admin/queries";
import { formatFechaCorta } from "@/lib/admin/formato";
import RosterTabla from "./RosterTabla";

export const dynamic = "force-dynamic";
export const metadata = { title: "Roster de salida · Admin — Caminante" };

// Roster para el guía en campo. Datos médicos = sensibles: SOLO admin, jamás
// fuera de esta vista. Imprimible (@media print en admin-css) + export CSV.
export default async function RosterPage({
  params,
}: {
  params: Promise<{ slotId: string }>;
}) {
  const { slotId } = await params;
  if (!/^[0-9a-fA-F-]{36}$/.test(slotId)) notFound();
  const roster = await fetchRoster(slotId);
  if (!roster) notFound();

  const firmados = roster.rows.filter((r) => r.deslinde).length;

  return (
    <AdminShell active="personas">
      <section className="sec" id="roster">
        <div className="roster-head">
          <div className="mono" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".1em" }}>
            Caminante · Roster de salida
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>
            {roster.experienciaNombre} — {roster.salidaLabel}
          </div>
        </div>

        <div className="sec-head no-print">
          <div>
            <span className="eyebrow">
              <span className="sl">{"//"}</span>{" "}
              <Link href={`/caminante/admin/eventos/${roster.experienciaSlug}`} style={{ textDecoration: "underline" }}>
                {roster.experienciaNombre}
              </Link>
            </span>
            <h1 className="display">
              Roster <em className="ac">de salida.</em>
            </h1>
            <div className="desc">
              {roster.salidaLabel} · {formatFechaCorta(roster.startsAt)} · {roster.rows.length} personas ·{" "}
              {firmados}/{roster.rows.length} con deslinde
            </div>
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <a href={`/caminante/admin/roster/${slotId}/csv`} className="btn btn-ghost btn-sm">
              Descargar CSV
            </a>
            <PrintButton />
          </div>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <RosterTabla rows={roster.rows} />
        </div>
        <p className="mut no-print" style={{ fontSize: 12, marginTop: 10 }}>
          Toca un nombre para abrir su ficha: teléfono, correo, contacto de emergencia y todo lo
          que declaró de salud. Al imprimir salen todas abiertas.
          <br />
          Datos sensibles (LFPDPPP): solo para el equipo de guías. Los acompañantes heredan el
          deslinde firmado por su titular.
        </p>
      </section>
    </AdminShell>
  );
}

// Botón de imprimir sin client component: el script del shell escucha [data-print].
function PrintButton() {
  return (
    <button className="btn btn-glass btn-sm" type="button" data-print>
      Imprimir roster
    </button>
  );
}
