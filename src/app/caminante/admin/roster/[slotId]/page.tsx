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

  // TRES cuentas distintas, y cada una se dice por su nombre.
  //
  // ⚠️ Antes decía «6 personas · 6/6 con deslinde» donde había 5 lugares
  // pagados y 4 firmas. Ninguno de los dos números estaba mal: la cápsula
  // contaba LUGARES PAGADOS y el roster contaba FILAS, y el encabezado los
  // presentaba como si midieran lo mismo. Un guía que lee «6/6 con deslinde»
  // cree que tiene seis firmas y tiene cuatro.
  const enLista = roster.rows.length;
  const acompanantes = roster.rows.filter((r) => r.titular).length;
  // Filas de más de lo que se pagó: alguien capturó más participantes que
  // lugares compró. Es dinero y es una persona en el cerro; se dice, no se
  // esconde, y lo resuelve una persona — no un ajuste en la consulta.
  const deMas = enLista - roster.lugaresPagados;

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
              {roster.salidaLabel} · {formatFechaCorta(roster.startsAt)} ·{" "}
              <b>{roster.lugaresPagados}</b> {roster.lugaresPagados === 1 ? "lugar pagado" : "lugares pagados"} ·{" "}
              <b>{enLista}</b> en la lista
              {acompanantes ? (
                <>
                  {" "}
                  ({roster.titulares} {roster.titulares === 1 ? "titular" : "titulares"} + {acompanantes}{" "}
                  {acompanantes === 1 ? "acompañante" : "acompañantes"})
                </>
              ) : null}{" "}
              · <b>{roster.firmados}</b>/{roster.titulares} deslindes firmados
            </div>
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <a href={`/caminante/admin/roster/${slotId}/csv`} className="btn btn-ghost btn-sm">
              Descargar CSV
            </a>
            <PrintButton />
          </div>
        </div>

        {deMas > 0 ? (
          <div
            className="card pad"
            style={{
              marginBottom: 16,
              borderColor: "rgba(255,93,54,.35)",
              background: "rgba(255,93,54,.06)",
              fontSize: 13,
              lineHeight: 1.55,
            }}
          >
            <b>
              Hay {deMas} {deMas === 1 ? "persona" : "personas"} en la lista de más de lo pagado.
            </b>{" "}
            Se pagaron {roster.lugaresPagados}{" "}
            {roster.lugaresPagados === 1 ? "lugar" : "lugares"} y en la lista van {enLista}. Alguien
            capturó más participantes de los que compró. No lo cuadramos aquí: o se cobra el lugar
            que falta, o se corrige el número de personas de esa reserva en Salidas.
          </div>
        ) : null}

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
