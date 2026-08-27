"use client";

// EL CATÁLOGO — las tarjetas y sus filtros.
//
// Transcrito de design/encuesta-v2/dc/experiencias.dc.html: la fila `.filters`
// y la reja `.excat`. Es cliente porque los filtros son del ojo de quien mira,
// no del servidor: cambiar de orden no debería recargar la pantalla ni perder
// el scroll.
//
// ⚠️ Los cuatro controles FILTRAN DE VERDAD. Un selector que no hace nada es
// peor que no tenerlo: promete una capacidad que no existe, y ya nos pasó con
// el selector de operador vacío en la ficha.

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Producto } from "@/lib/admin/catalogo";
import { formatMXN } from "@/lib/admin/formato";

const dec = (n: number) => n.toFixed(1).replace(".", ",");

function Tarjeta({ p }: { p: Producto }) {
  const borrador = p.status !== "published";
  return (
    <Link className="card exc" href={`/caminante/admin/eventos/${p.slug}`}>
      <div className="ph">
        {p.foto ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={p.foto} alt={p.fotoAlt} />
        ) : null}
        <div className="tp">
          <span className={`chip ${borrador ? "c-draft" : "c-pub"}`}>
            <span className="cd" />
            {borrador ? "Borrador" : "Publicada"}
          </span>
        </div>
      </div>
      <div className="bd">
        <h3>{p.nombre}</h3>
        {/* De quién es. Va bajo el título y no como chip sobre la foto: ahí
            compite con el estado, que es lo que urge leer. */}
        {p.operador ? <p className="op">{p.operador}</p> : null}

        {/* El semáforo de venta. `listaParaPublicar` es candado duro del sistema
            —bloquea publicar Y cobrar— y hasta hoy solo te enterabas al
            intentar publicar. Aquí lo dice la tarjeta. */}
        {borrador ? (
          <p className="exsem dorm">
            <s>·</s>
            <span>En borrador, todavía no se vende</span>
          </p>
        ) : p.puedeVender ? (
          <p className="exsem si">
            <s>✓</s>
            <span>Lista para vender</span>
          </p>
        ) : (
          <p className="exsem no">
            <s>⚠</s>
            <span>No vende: {p.faltaParaVender.join(" ")}</span>
          </p>
        )}

        <div className="ex3">
          <div>
            <div className={`v${p.ingresos ? "" : " mut"}`}>{p.ingresos ? formatMXN(p.ingresos) : "—"}</div>
            <div className="l">Ingresos</div>
          </div>
          <div>
            <div className={`v${p.clientes ? "" : " mut"}`}>{p.clientes || "—"}</div>
            <div className="l">Clientes</div>
          </div>
          <div>
            {/* ⚠️ El promedio NUNCA sin su denominador. */}
            <div className={`v${p.stars != null ? "" : " mut"}`}>{p.stars != null ? dec(p.stars) : "—"}</div>
            <div className="l">Estrellas</div>
            <div className="d">
              {p.respuestas} de {p.invitadas}
            </div>
          </div>
        </div>

        <div className="exarm">
          <div className="hd">
            <span className="t">Armadura</span>
            <span className="fr">
              {p.armada} de {p.dimensiones.length}
            </span>
          </div>
          <div className="exdims">
            {p.dimensiones.map((d) => (
              <span
                key={d.id}
                className={`exd ${d.estado === "ok" ? "full" : d.estado === "parcial" ? "half" : "none"}`}
              >
                <i />
                {d.titulo}
              </span>
            ))}
          </div>
        </div>

        <p className="excal">
          <s>{"//"}</s>
          <span>
            {p.calendario}
            {p.proximaLabel ? (
              <>
                {" · "}
                <b>{p.proximaLabel}</b>
              </>
            ) : null}
          </span>
        </p>
      </div>
    </Link>
  );
}

export default function Catalogo({
  productos,
  esOperador,
  children,
}: {
  productos: Producto[];
  esOperador: boolean;
  /** La banda de cifras y la leyenda, ya renderizadas en el servidor. Van
   *  ENTRE los filtros y la reja, como en el entregable. */
  children: React.ReactNode;
}) {
  const [busca, setBusca] = useState("");
  const [op, setOp] = useState("");
  const [estado, setEstado] = useState("");
  const [orden, setOrden] = useState("necesitan");

  const operadores = useMemo(
    () => [...new Set(productos.map((p) => p.operador).filter((x): x is string => !!x))].sort(),
    [productos],
  );

  const vista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const out = productos.filter(
      (p) =>
        (!q || p.nombre.toLowerCase().includes(q)) &&
        (!op || p.operador === op) &&
        (!estado || (estado === "published" ? p.status === "published" : p.status !== "published")),
    );
    // `productos` YA viene ordenado «por lo que necesitan» desde el servidor:
    // ese orden es una respuesta y no se recalcula aquí.
    if (orden === "ingresos") return [...out].sort((a, b) => b.ingresos - a.ingresos);
    if (orden === "alfa") return [...out].sort((a, b) => a.nombre.localeCompare(b.nombre));
    return out;
  }, [productos, busca, op, estado, orden]);

  return (
    <>
      {/* El entregable dibuja los filtros solo en el catálogo de la casa: el
          operador ve su propia cartera y no tiene entre qué escoger. */}
      {esOperador ? null : (
      <div className="filters">
        <input
          type="search"
          placeholder="Buscar experiencia"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        {operadores.length > 1 ? (
          <select value={op} onChange={(e) => setOp(e.target.value)}>
            <option value="">Todos los operadores</option>
            {operadores.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : null}
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="published">Publicadas</option>
          <option value="draft">Borrador</option>
        </select>
        <select value={orden} onChange={(e) => setOrden(e.target.value)}>
          <option value="necesitan">Orden: por lo que necesitan</option>
          <option value="ingresos">Por ingresos</option>
          <option value="alfa">Alfabético</option>
        </select>
      </div>
      )}

      {children}

      {vista.length === 0 ? (
        <div className="empty">Ninguna experiencia cumple con esos filtros.</div>
      ) : (
        <div className="excat">
          {vista.map((p) => (
            <Tarjeta key={p.id} p={p} />
          ))}
        </div>
      )}
    </>
  );
}
