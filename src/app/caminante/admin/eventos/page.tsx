import Link from "next/link";
import AdminShell from "../ui/AdminShell";
import { fetchEventos, formatMXN } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Eventos · Admin — Caminante" };

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const eventos = await fetchEventos();
  const { ok } = await searchParams;

  return (
    <AdminShell active="eventos">
      <section className="sec">
        {ok ? (
          <div className="glass pad" style={{ marginBottom: 18, fontSize: 13.5, color: "var(--olive-d)" }}>
            {ok}
          </div>
        ) : null}
        <div className="sec-head">
          <div>
            <span className="eyebrow">
              <span className="sl">{"//"}</span> Eventos
            </span>
            <h1 className="display">
              Tus <em className="ac">experiencias.</em>
            </h1>
            <div className="desc">Toca una para gestionar sus salidas, cupos y operador.</div>
          </div>
          <Link href="/caminante/admin/experiencias/nueva" className="btn btn-orange btn-sm">
            + Nueva experiencia
          </Link>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Experiencia</th>
                  <th>Estado</th>
                  <th>Operador</th>
                  <th className="num">Salidas abiertas</th>
                  <th>Próxima</th>
                  <th className="num">Personas</th>
                  <th className="right">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link
                        href={`/caminante/admin/eventos/${e.slug}`}
                        style={{ fontWeight: 500, textDecoration: "underline" }}
                      >
                        {e.nombre}
                      </Link>
                    </td>
                    <td>
                      {e.status === "published" ? (
                        <span className="chip c-pub">
                          <span className="cd" style={{ background: "var(--olive)" }} />
                          Publicada
                        </span>
                      ) : (
                        <span className="chip c-draft">Borrador</span>
                      )}
                    </td>
                    <td className={e.operadorNombre ? "" : "mut"}>
                      {e.operadorNombre || "Sin operador"}
                    </td>
                    <td className="num">{e.salidasAbiertas}</td>
                    <td className="mut">{e.proximaLabel || "—"}</td>
                    <td className="num">{e.personas}</td>
                    <td className="num right">{e.ingresos ? formatMXN(e.ingresos) : "—"}</td>
                  </tr>
                ))}
                {eventos.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty" style={{ border: 0 }}>
                        Aún no hay experiencias. Crea la primera.
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
