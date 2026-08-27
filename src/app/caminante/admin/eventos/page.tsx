import Link from "next/link";
import { redirect } from "next/navigation";
import AdminShell from "../ui/AdminShell";
import { puedeEntrarAlPanel } from "@/lib/auth/authorization";
import { fetchCatalogo, type Producto } from "@/lib/admin/catalogo";
import { formatMXN } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Experiencias · Admin — Caminante" };

// EXPERIENCIAS — el catálogo de productos.
//
// Aquí vive el PRODUCTO: si puede venderse, cómo se ha vendido y qué tan armado
// está. Los grupos con fecha viven en Salidas. El reparto completo, y por qué
// las solicitudes de grupo NO están aquí, en design/encuesta-v2/LIMITES.md.
//
// Diseño transcrito de design/encuesta-v2/dc/experiencias.dc.html.

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
            {borrador ? null : <span className="cd" />}
            {borrador ? "Borrador" : "Publicada"}
          </span>
          {p.operador ? <span className="chip c-draft">{p.operador}</span> : null}
        </div>
      </div>
      <div className="bd">
        <h3>{p.nombre}</h3>

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

export default async function ExperienciasPage() {
  if (!(await puedeEntrarAlPanel())) redirect("/caminante/login?next=/caminante/admin/eventos");
  const { productos, esOperador } = await fetchCatalogo();

  const frenadas = productos.filter((p) => p.status === "published" && !p.puedeVender).length;

  return (
    <AdminShell active="eventos">
      <div className="sec-head">
        <div>
          <span className="eyebrow">
            <span className="sl">{"//"}</span> Experiencias
          </span>
          <h1 className="display">
            {esOperador ? (
              <>
                Tu catálogo, <em className="ac">no tus grupos.</em>
              </>
            ) : (
              <>
                El catálogo, <em className="ac">no los grupos.</em>
              </>
            )}
          </h1>
          <div className="desc">
            Aquí vive el producto: si puede venderse, cómo se ha vendido y qué tan armado está. Los
            grupos con fecha viven en{" "}
            <Link href="/caminante/admin/salidas" style={{ textDecoration: "underline" }}>
              Salidas
            </Link>
            .
          </div>
        </div>
        <Link href="/caminante/admin/experiencias/nueva" className="btn btn-orange">
          + Crear experiencia
        </Link>
      </div>

      {/* El orden ya es una respuesta: arriba lo frenado. Si algo está frenado
          conviene decirlo con palabras, no solo con la posición. */}
      {frenadas ? (
        <p className="mut" style={{ fontSize: 13, marginBottom: 18 }}>
          {frenadas === 1
            ? "Una experiencia publicada no puede vender todavía; está arriba."
            : `${frenadas} experiencias publicadas no pueden vender todavía; están arriba.`}
        </p>
      ) : null}

      <div className="exleg">
        <span className="f">
          <i />
          Completa
        </span>
        <span className="h">
          <i />A medias
        </span>
        <span className="n">
          <i />
          Falta
        </span>
        <span style={{ marginLeft: "auto", color: "var(--ink-soft)" }}>
          La armadura son cinco cosas: fotos, ficha científica, saber de los guías, deslinde y encuesta.
        </span>
      </div>

      {productos.length === 0 ? (
        <div className="empty">
          Aún no hay experiencias.{" "}
          <Link href="/caminante/admin/experiencias/nueva" style={{ textDecoration: "underline" }}>
            Crea la primera
          </Link>
          .
        </div>
      ) : (
        <div className="excat">
          {productos.map((p) => (
            <Tarjeta key={p.id} p={p} />
          ))}
        </div>
      )}
    </AdminShell>
  );
}
