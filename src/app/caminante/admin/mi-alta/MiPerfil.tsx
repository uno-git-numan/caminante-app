// MI PERFIL — en lo que se convierte «Mi alta» cuando el alta cierra.
//
// Transcrito de la lámina «Panel Operadora» (recurso 84eeb090 · `Perfil`):
// la cabecera con iniciales, las actividades que puede ofrecer, «Tu
// operación», «Seguridad» y «Tu página». La lámina lo dice en su nota calma:
// «Esto no lo llenaste dos veces. Lo que sigue sale de tu solicitud y de tu
// expediente, y se actualiza solo.» Por eso aquí NO hay formularios: cada
// renglón sale de donde ya vive (solicitud, expediente, fila fiscal, perfil
// público) y lo editable manda a su editor, que es uno solo.
//
// Las pastillas dicen qué ve el viajero (Público), qué es sólo de la casa
// (Interno) y qué no se cambia desde aquí (No editable): el RFC y la comisión
// van en el convenio y necesitan uno nuevo.

import Link from "next/link";
import type { MiAlta as Datos } from "@/lib/operadores/mi-alta";
import type { DocEnPantalla } from "@/lib/operadores/expediente";
import { ANTIGUEDAD, PRIMEROS, TIPOS, etiqueta } from "@/lib/operadores/solicitud-opciones";
import { CDMX, diaEnPalabras } from "@/lib/fecha/zona";
import MiPagina from "./MiPagina";

const PUB = <span className="pill pub">Público</span>;
const INT = <span className="pill int">Interno</span>;
const LOCK = <span className="pill lock">No editable</span>;

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: CDMX });

function Renglon({ k, v, p }: { k: string; v: React.ReactNode; p: React.ReactNode }) {
  return (
    <div className="pfr">
      <span className="k">{k}</span>
      <span className="v">{v ?? "—"}</span>
      <span className="t">{p}</span>
    </div>
  );
}

/** Lo que dice un documento de Lo general en «Seguridad»: vigencia, cargado, o sin cargar. */
function vigencia(d: DocEnPantalla | null): string {
  if (!d || d.estado === "falta") return "Sin cargar";
  if (d.venceAt) {
    const vencido = (d.diasParaVencer ?? 0) < 0;
    return (vencido ? "Vencida el " : "Vigente hasta el ") + diaEnPalabras(d.venceAt);
  }
  return d.subidoAt ? `Cargado el ${fecha(d.subidoAt)}` : "Cargado";
}

export default function MiPerfil({ datos, porOtra }: { datos: Datos; porOtra: string | null }) {
  const op = datos.operadora;
  const e = datos.expediente;
  const s = datos.solicitud?.enviada ?? null;
  const liga = (ruta: string) => (porOtra ? `${ruta}?operadora=${encodeURIComponent(porOtra)}` : ruta);
  const general = (slug: string) => e?.generales.find((d) => d.slug === slug) ?? null;
  const vendiendo = datos.estado === "listo";

  const comision =
    op?.comisionPct !== null && op?.comisionPct !== undefined
      ? `${op.comisionPct}%${op.comisionDesde ? ` · desde el ${diaEnPalabras(op.comisionDesde)}` : ""}`
      : null;

  return (
    <div>
      <div className="pfhero">
        <span className="ava">{op?.iniciales ?? "—"}</span>
        <span className="nm">
          <b>{op?.nombre ?? "—"}</b>
          <span>
            Operadora externa
            {s?.ciudadEstado ? ` · ${s.ciudadEstado}` : ""}
            {comision ? ` · comisión ${comision}` : ""}
          </span>
        </span>
        <span>
          {vendiendo ? (
            <span className="chip c-paid"><span className="cd" />Vendiendo</span>
          ) : (
            <span className="chip c-sol"><span className="cd" />Alta en curso</span>
          )}
        </span>
      </div>

      <p className="calm" style={{ marginTop: 14 }}>
        <s>{"//"}</s>
        <span className="g">
          <b>Esto no lo llenaste dos veces</b>
          <span>
            Lo que sigue sale de tu solicitud y de tu expediente, y se actualiza solo. Lo público es lo
            que el viajero lee en tu página antes de reservar.
          </span>
        </span>
      </p>

      <p className="xh4" style={{ marginTop: 26 }}>Actividades que puedes ofrecer</p>
      <div className="pactv">
        {(e?.actividades ?? []).map((a) => {
          const aprob = a.estado === "aprobada";
          const txt =
            a.estado === "aprobada"
              ? "Aparece en tu página y puedes crear experiencias de esta actividad."
              : a.estado === "en_revision"
                ? "Entregaste todo y la estamos revisando. Mientras tanto no aparece en tu página."
                : a.estado === "suspendida"
                  ? (a.motivo ?? "Suspendida.")
                  : `Faltan ${a.faltan} ${a.faltan === 1 ? "documento" : "documentos"}. Se resuelve en tu expediente.`;
          return (
            <div key={a.slug} className={"pact " + (aprob ? "aprob" : "pend")}>
              <div className="hd">
                <b>{a.nombre}</b>
                <span className="rt">
                  <span className={"chip " + (aprob ? "c-paid" : "c-full")}>
                    <span className="cd" />
                    {a.estado === "aprobada" ? "Aprobada" : a.estado === "en_revision" ? "En revisión" : a.estado === "suspendida" ? "Suspendida" : "Incompleta"}
                  </span>
                </span>
              </div>
              <p>{txt}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 11, alignItems: "center" }}>
                {aprob ? PUB : INT}
                <span className="pill lock">Lo aprobamos nosotros</span>
                {!aprob ? (
                  <Link href={liga("/caminante/admin/mi-alta/expediente")} style={{ fontSize: 12 }}>
                    Ir al expediente
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
        {!e?.actividades.length ? <div className="empty">Todavía no declaras ninguna actividad.</div> : null}
      </div>

      <p className="xh4" style={{ marginTop: 26 }}>Tu operación</p>
      <div className="pf">
        <Renglon k="Ciudad" v={s?.ciudadEstado ?? null} p={PUB} />
        <Renglon k="Tipo de operación" v={s?.tipo ? etiqueta(TIPOS, s.tipo) : null} p={PUB} />
        <Renglon k="Antigüedad" v={s?.antiguedad ? etiqueta(ANTIGUEDAD, s.antiguedad) : null} p={PUB} />
        <Renglon k="Salidas al año" v={s?.salidasAno ?? null} p={INT} />
        <Renglon k="Personas por salida" v={s?.personasSalida ?? null} p={PUB} />
        <Renglon k="Razón social" v={datos.fiscal.razonSocial} p={<>{INT}{LOCK}</>} />
        <Renglon k="RFC" v={datos.fiscal.rfc} p={<>{INT}{LOCK}</>} />
        <Renglon k="Comisión" v={comision} p={<>{INT}{LOCK}</>} />
      </div>

      <p className="xh4" style={{ marginTop: 26 }}>Seguridad</p>
      <div className="pf">
        <Renglon k="Responsabilidad civil" v={vigencia(general("poliza-rc"))} p={PUB} />
        <Renglon k="Primeros auxilios" v={general("primeros-auxilios")?.estado !== "falta" ? vigencia(general("primeros-auxilios")) : s?.primeros ? etiqueta(PRIMEROS, s.primeros) : "Sin cargar"} p={PUB} />
        <Renglon k="Ratio de guías" v={s?.ratioGuias ?? null} p={PUB} />
        <Renglon k="Protocolo de emergencia" v={vigencia(general("protocolo-emergencia"))} p={INT} />
      </div>
      <p className="gnhint" style={{ maxWidth: "74ch" }}>
        Tu RFC y tu comisión no se cambian desde aquí: van en el convenio y necesitan uno nuevo.
      </p>

      <p className="xh4" style={{ marginTop: 26 }}>Tu página</p>
      {op ? <MiPagina operadorId={op.id} bio={datos.perfilPublico.bio ?? ""} instagram={datos.perfilPublico.instagram ?? ""} porOtra={porOtra} /> : null}
      <div className="pf" style={{ marginTop: 10 }}>
        <Renglon k="Equipo" v={datos.perfilPublico.equipo.length ? datos.perfilPublico.equipo.join(", ") : null} p={PUB} />
        <Renglon
          k="Tu página"
          v={
            datos.perfilPublico.publico && datos.perfilPublico.slug ? (
              <a href={`/caminante/operador/${datos.perfilPublico.slug}`} target="_blank" rel="noopener">
                caminante.numanhub.com/caminante/operador/{datos.perfilPublico.slug}
              </a>
            ) : (
              "Todavía no está publicada"
            )
          }
          p={PUB}
        />
      </div>
      <p className="gnhint" style={{ maxWidth: "74ch" }}>
        {/* Las fotos y el equipo (con foto y cita) viven en el editor de la casa
            (OperadorForm); la marca —logo y colores— en el suyo. No se duplican. */}
        Tus colores y tu logo se editan en <Link href={liga("/caminante/admin/mi-alta/marca")}>tu marca</Link>.
        Las fotos y el equipo los cargamos nosotros por ahora: mándanoslos y aparecen aquí.
      </p>
    </div>
  );
}
