import Link from "next/link";
import AdminNav from "./AdminNav";
import { fetchAdminOverview, formatMXN, formatFechaCorta } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

const notices: Record<string, string> = {
  admin_no_registro:
    "Estás en modo admin. El registro y la reserva de experiencias son para viajeros — usa una cuenta de caminante si quieres probar ese flujo.",
};

const estadoLabels: Record<string, string> = {
  requested: "Solicitadas",
  confirmed: "Confirmadas",
  partially_paid: "Anticipo",
  paid: "Pagadas",
  completed: "Completadas",
  cancelled: "Canceladas",
};

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-sand bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-olive">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-lagoon">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-olive">{sub}</p> : null}
    </div>
  );
}

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const noticeText = notice ? notices[notice] : null;
  const { kpis, proximas } = await fetchAdminOverview();

  const estados = Object.entries(kpis.reservasPorEstado)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${(estadoLabels[k] || k).toLowerCase()}`)
    .join(" · ");
  const sat = kpis.satisfaccion;

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-10">
      <p className="text-[10px] uppercase tracking-[0.25em] text-olive">Modo admin</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-lagoon">Panorama</h1>
      <p className="mt-2 text-sm text-olive">
        Tus eventos, tu gente y tu dinero — en vivo desde la base.
      </p>

      {noticeText ? (
        <div className="mt-6 rounded-xl border border-dune/40 bg-dune/10 p-4 text-sm text-lagoon">
          {noticeText}
        </div>
      ) : null}

      <div className="mt-6">
        <AdminNav active="panorama" />
      </div>

      {/* KPIs */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label={`Ingresos · ${kpis.mesLabel}`}
          value={formatMXN(kpis.ingresosMes)}
          sub={`Histórico: ${formatMXN(kpis.ingresosTotal)}`}
        />
        <Kpi
          label="Personas apuntadas"
          value={String(kpis.personasApuntadas)}
          sub={estados || "Sin reservas aún"}
        />
        <Kpi
          label="Deslindes firmados"
          value={String(kpis.deslindesFirmados)}
        />
        <Kpi
          label="Satisfacción"
          value={sat.avgStars != null ? `${sat.avgStars} ★` : "—"}
          sub={
            sat.respondidas
              ? `NPS ${sat.avgNps ?? "—"} · ${sat.respondidas}/${sat.invitadas} respuestas`
              : "Sin respuestas aún"
          }
        />
      </div>

      {/* Próximas salidas */}
      <div className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-olive">
          Próximas salidas
        </h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-sand bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-sand text-[11px] uppercase tracking-wider text-olive">
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Experiencia</th>
                <th className="px-4 py-3 font-semibold">Salida</th>
                <th className="px-4 py-3 font-semibold">Ocupación</th>
                <th className="px-4 py-3 font-semibold">Ingresos</th>
                <th className="px-4 py-3 font-semibold">Deslindes</th>
              </tr>
            </thead>
            <tbody>
              {proximas.map((s) => (
                <tr key={s.slotId} className="border-b border-sand/60 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-lagoon">
                    {formatFechaCorta(s.startsAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-lagoon">{s.experienceNombre}</span>
                    {s.experienceStatus !== "published" ? (
                      <span className="ml-2 rounded-full border border-sand px-2 py-0.5 text-[10px] uppercase tracking-wider text-olive">
                        borrador
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-olive">
                    {s.label}
                    {s.slotStatus !== "open" ? (
                      <span className="ml-2 rounded-full bg-sand/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-olive">
                        {s.slotStatus === "closed" ? "cerrada" : s.slotStatus}
                      </span>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {s.capacity === null ? (
                      <span className="text-olive">{s.taken} · sin tope</span>
                    ) : (
                      <span className={s.available === 0 ? "font-semibold text-orange-700" : "text-lagoon"}>
                        {s.taken}/{s.capacity}
                        <span className="ml-1 text-xs text-olive">
                          {s.available === 0 ? "· llena" : `· quedan ${s.available}`}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-lagoon">
                    {s.ingresos ? formatMXN(s.ingresos) : "—"}
                  </td>
                  <td className="px-4 py-3 text-lagoon">{s.deslindes}</td>
                </tr>
              ))}
              {proximas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-olive">
                    No hay salidas programadas. Crea una desde{" "}
                    <Link href="/caminante/admin/experiencias/nueva" className="underline">
                      la experiencia
                    </Link>
                    .
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-olive">
          Ocupación = personas de reservas confirmadas/pagadas. Ingresos = pagos registrados de esa
          salida (los cobros hechos fuera del sistema aún no aparecen; se podrán capturar como pago
          manual en la sección Reservas).
        </p>
      </div>
    </section>
  );
}
