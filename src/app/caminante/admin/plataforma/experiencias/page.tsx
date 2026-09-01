import { redirect } from "next/navigation";
import AdminShell from "../../ui/AdminShell";
import { getCurrentRole } from "@/lib/auth/authorization";
import { formatMXN, formatFechaCorta } from "@/lib/admin/formato";
import { fetchCatalogo, type ExperienciaDelCatalogo, type GrupoVida } from "@/lib/plataforma/catalogo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Experiencias · Caminante plataforma" };

// EL CATÁLOGO DE LA PLATAFORMA — diseño de design/plataforma/dc/plataforma.dc.html.
//
// Ordenado por ESTADO DE VIDA y no por nombre. La razón está en el lib, pero se
// resume en el grupo 02: una experiencia publicada sin fecha futura se ve viva
// —está en el sitio, tiene histórico— y nadie puede reservarla. Ese caso no
// aparecía en ninguna pantalla del panel.

const GRUPOS: {
  clave: GrupoVida;
  num: string;
  nombre: string;
  clase: string;
  titulo: (n: number) => string;
  porque: string;
  abierto: boolean;
}[] = [
  {
    clave: "en_el_aire",
    num: "02",
    nombre: "En el aire",
    clase: "cmgrp sleep",
    titulo: (n) => `${n === 1 ? "publicada que nadie puede reservar" : "publicadas que nadie puede reservar"}`,
    porque:
      "Publicadas y sin una sola fecha futura. Se ven vivas —están en el sitio y tienen histórico— y hoy no se pueden comprar. Es dinero apagado que parece encendido: lo mismo que la 06 Dormido del pipeline, en el inventario.",
    abierto: true,
  },
  {
    clave: "agendada",
    num: "03",
    nombre: "Agendada sin publicar",
    clase: "cmgrp owe",
    titulo: (n) => (n === 1 ? "agendada sin publicar" : "agendadas sin publicar"),
    porque:
      "El error inverso: la fecha ya existe en el calendario y la experiencia sigue en borrador. Alguien va a llegar a una salida que no se puede reservar.",
    abierto: true,
  },
  {
    clave: "vendiendo",
    num: "01",
    nombre: "Vendiendo",
    clase: "cmgrp",
    titulo: (n) => (n === 1 ? "que se puede comprar hoy" : "que se pueden comprar hoy"),
    porque: "Publicadas y con fecha futura. Aquí no hay nada que hacer.",
    abierto: false,
  },
  {
    clave: "borrador",
    num: "04",
    nombre: "Borrador",
    clase: "cmgrp",
    titulo: (n) => (n === 1 ? "sin publicar y sin fechas" : "sin publicar y sin fechas"),
    porque: "Trabajo pendiente, no un problema.",
    abierto: false,
  },
];

function Renglon({ e, mes }: { e: ExperienciaDelCatalogo; mes: string }) {
  const xid = `ex-${e.id.slice(0, 8)}`;
  const futuras = e.salidas.filter((s) => s.futura);
  const pasadas = e.salidas.filter((s) => !s.futura);
  return (
    <>
      <tr className="xhead" data-x={xid}>
        <td>
          <b style={{ fontWeight: 600 }}>{e.titulo}</b> <span className="chev2">▾</span>
          <small className="mut" style={{ display: "block", fontSize: 11.5, marginTop: 3 }}>
            {e.estado ?? <span className="hole">estado</span>}
            {" · "}
            {e.categorias.length ? e.categorias.join(", ") : <span className="hole">categoría</span>}
          </small>
        </td>
        <td>
          {e.operadora ? (
            <span className="opnm">
              <span className="av">{e.operadora.iniciales}</span>
              <span>
                <b>{e.operadora.nombre}</b>
                <small>{e.operadora.esLaCasa ? "mi operadora" : "operadora externa"}</small>
              </span>
            </span>
          ) : (
            <span className="hole">sin operadora</span>
          )}
        </td>
        <td>
          <span className={e.publicada ? "chip c-pub" : "chip"}>
            <span className="cd" />
            {e.publicada ? "Publicada" : "Borrador"}
          </span>
        </td>
        <td>
          {e.proximaSalida ? (
            <>
              {formatFechaCorta(e.proximaSalida.fecha)}
              <small className="mut" style={{ display: "block", fontSize: 11 }}>
                {e.salidasFuturas === 1 ? "una fecha futura" : `${e.salidasFuturas} fechas futuras`}
              </small>
            </>
          ) : (
            <>
              <span style={{ color: "var(--orange)", fontWeight: 600 }}>Ninguna</span>
              <small className="mut" style={{ display: "block", fontSize: 11 }}>
                sin una sola fecha futura
              </small>
            </>
          )}
        </td>
        <td className="num">{e.proximaSalida?.cupo ?? "—"}</td>
        <td className="num right">
          <span style={{ fontFamily: "var(--mono)" }}>{formatMXN(e.mes.vendido)}</span>
          <small className="mut" style={{ display: "block", fontSize: 11 }}>
            {e.mes.reservas} {e.mes.reservas === 1 ? "reserva" : "reservas"}
          </small>
        </td>
        <td className="num right">
          <span style={{ fontFamily: "var(--mono)" }}>{formatMXN(e.historico.vendido)}</span>
          <small className="mut" style={{ display: "block", fontSize: 11 }}>
            {e.historico.reservas} {e.historico.reservas === 1 ? "reserva" : "reservas"}
            {e.canceladas > 0 ? ` · ${e.canceladas} cancelada${e.canceladas === 1 ? "" : "s"}` : ""}
          </small>
        </td>
      </tr>
      <tr className="xdetail">
        <td colSpan={7}>
          <div className="xbody" id={xid}>
            <div className="xpad">
              {e.grupo === "en_el_aire" ? (
                <div className="verdict no">
                  <span className="n">0</span>
                  <span className="g">
                    <b>Publicada, y nadie la puede reservar</b>
                    <span>
                      Se ve viva: está publicada y lleva {e.historico.reservas} reservas pagadas con{" "}
                      {formatMXN(e.historico.vendido)} de histórico. No tiene una sola salida futura,
                      así que hoy no se puede comprar. Vendió {formatMXN(e.mes.vendido)} en {mes} y
                      nada en la pantalla lo decía.
                    </span>
                  </span>
                </div>
              ) : null}
              {e.grupo === "agendada" ? (
                <div className="verdict no">
                  <span className="n">{e.salidasFuturas}</span>
                  <span className="g">
                    <b>Tiene fecha y está en borrador</b>
                    <span>
                      La salida existe en el calendario y la experiencia no está publicada: nadie
                      puede verla ni reservarla. Aquí no hay nada que agendar — hay que publicar.
                    </span>
                  </span>
                </div>
              ) : null}

              <p className="xh4">Sus salidas</p>
              {futuras.length ? (
                futuras.map((s) => (
                  <div className="cmag" key={s.id}>
                    <span className="dy">{s.fecha ? formatFechaCorta(s.fecha) : <span className="hole">fecha</span>}</span>
                    <span className="g">
                      <b>{s.etiqueta || "Salida futura"}</b>
                      <small>
                        {s.reservas} {s.reservas === 1 ? "reserva pagada" : "reservas pagadas"} ·{" "}
                        {formatMXN(s.vendido)}
                        {s.cupo != null ? ` · cupo ${s.cupo}` : " · sin tope"}
                      </small>
                    </span>
                    <span className="rt">
                      <span className="mut">{e.publicada ? "se puede comprar" : "no publicada"}</span>
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty" style={{ marginTop: 12 }}>
                  No hay ninguna salida futura.
                  <br />
                  <span style={{ fontSize: 13 }}>
                    Mientras no tenga fecha, esta experiencia está publicada y apagada.
                  </span>
                </div>
              )}

              {pasadas.length ? (
                <div className="cmag">
                  <span className="dy">{pasadas.length}</span>
                  <span className="g">
                    <b>Salidas pasadas</b>
                    <small>
                      {pasadas.reduce((a, s) => a + s.reservas, 0)} reservas pagadas ·{" "}
                      {formatMXN(pasadas.reduce((a, s) => a + s.vendido, 0))}
                    </small>
                  </span>
                  <span className="rt">
                    <span className="mut">cerradas</span>
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

export default async function ExperienciasPlataformaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; op?: string; est?: string; cat?: string }>;
}) {
  if ((await getCurrentRole()) !== "admin") redirect("/caminante/admin");
  const { q, op, est, cat } = await searchParams;
  const d = await fetchCatalogo();

  // Los filtros se aplican con la URL y no con un componente cliente: así el
  // estado de la pantalla se puede compartir, marcar y volver a él.
  const pasa = (e: ExperienciaDelCatalogo) =>
    (!q || e.titulo.toLowerCase().includes(q.toLowerCase())) &&
    (!op || e.operadora?.nombre === op) &&
    (!est || e.estado === est) &&
    (!cat || e.categorias.includes(cat));

  const hayFiltro = Boolean(q || op || est || cat);
  const total = d.experiencias.filter(pasa).length;

  return (
    <AdminShell active="pl-experiencias">
      <div className="sec">
        <div className="sec-head">
          <div>
            <span className="eyebrow">
              <span className="sl">{"//"}</span> Experiencias
            </span>
            <h2 className="display" style={{ marginTop: 10 }}>
              No por nombre: <em className="ac">por si se puede comprar hoy.</em>
            </h2>
            <p className="desc">
              El catálogo de todas las experiencias de todas las operadoras, la casa incluida. Hoy
              son {d.experiencias.length} y algún día serán cientos, así que el orden principal es el
              estado de vida. Aquí está el volumen —lo que se mueve—; la comisión es dinero y vive en
              Recursos.
            </p>
          </div>
        </div>

        <form method="get" className="filters no-print">
          <input type="search" name="q" placeholder="Buscar por nombre" defaultValue={q || ""} />
          <select name="op" defaultValue={op || ""}>
            <option value="">Todas las operadoras</option>
            {d.operadoras.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <select name="est" defaultValue={est || ""}>
            <option value="">Todo el país</option>
            {d.estados.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select name="cat" defaultValue={cat || ""}>
            <option value="">Todas las categorías</option>
            {d.categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-glass btn-sm">
            Filtrar
          </button>
        </form>

        {hayFiltro ? (
          <p className="mut" style={{ fontSize: 12.5, marginBottom: 12 }}>
            {total} de {d.experiencias.length} con esos filtros.
          </p>
        ) : null}

        {GRUPOS.map((g) => {
          const lista = d.grupos[g.clave].filter(pasa);
          if (lista.length === 0) return null;
          const gid = `gx-${g.clave}`;
          return (
            <div className={g.clase} key={g.clave}>
              <div className={g.abierto ? "hd xhead open" : "hd xhead"} data-x={gid}>
                <span className="g">
                  <span className="ph">
                    <b>{String(lista.length).padStart(2, "0")}</b>{" "}
                    {lista.length === 1 ? "experiencia" : "experiencias"} {g.titulo(lista.length)}
                  </span>
                  <small>{g.porque}</small>
                </span>
                <span className="rt">
                  <span className="badge">
                    {g.num} · {g.nombre}
                  </span>
                  <span className="chev2">▾</span>
                </span>
              </div>
              <div className="bd">
                <div className={g.abierto ? "xbody on" : "xbody"} id={gid}>
                  <div className="in">
                    <div className="tbl-wrap card" style={{ boxShadow: "none" }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Experiencia</th>
                            <th>De quién</th>
                            <th>Estado</th>
                            <th>Próxima salida</th>
                            <th className="num">Cupo</th>
                            <th className="num right">
                              {d.mesEnCurso[0].toUpperCase() + d.mesEnCurso.slice(1)}
                            </th>
                            <th className="num right">Histórico</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lista.map((e) => (
                            <Renglon key={e.id} e={e} mes={d.mesEnCurso} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {total === 0 ? (
          <div className="empty">
            {hayFiltro
              ? "Ninguna experiencia con esos filtros."
              : "Todavía no hay ninguna experiencia en la plataforma."}
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
