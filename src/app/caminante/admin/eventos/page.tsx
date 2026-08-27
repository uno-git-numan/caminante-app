import Link from "next/link";
import { redirect } from "next/navigation";
import AdminShell from "../ui/AdminShell";
import Catalogo from "./Catalogo";
import { puedeEntrarAlPanel } from "@/lib/auth/authorization";
import { fetchCatalogo } from "@/lib/admin/catalogo";
import { formatMXN } from "@/lib/admin/formato";

export const dynamic = "force-dynamic";
export const metadata = { title: "Experiencias · Admin — Caminante" };

// EXPERIENCIAS — el catálogo de productos.
//
// Aquí vive el PRODUCTO: si puede venderse, cómo se ha vendido y qué tan armado
// está. Los grupos con fecha viven en Salidas. El reparto completo, y por qué
// las solicitudes de grupo NO están aquí, en design/encuesta-v2/LIMITES.md.
//
// Diseño transcrito de design/encuesta-v2/dc/experiencias.dc.html. El entregable
// trae DOS catálogos —el del operador y el de la casa— y se diferencian en tres
// cosas: la casa ve la banda de cifras, los filtros y de quién es cada producto.
// El operador tiene una sola cartera: las tres le sobran.

const NUM = ["Cero", "Una", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve", "Diez"];
const letras = (n: number) => (n < NUM.length ? NUM[n] : String(n));
const dec = (n: number) => n.toFixed(1).replace(".", ",");

export default async function ExperienciasPage() {
  if (!(await puedeEntrarAlPanel())) redirect("/caminante/login?next=/caminante/admin/eventos");
  const { productos, esOperador, resumen } = await fetchCatalogo();

  return (
    <AdminShell active="eventos">
      <div className="sec-head">
        <div>
          <span className="eyebrow">
            <span className="sl">{"//"}</span> Experiencias
          </span>
          {esOperador ? (
            <>
              <h1 className="display" style={{ marginTop: 10 }}>
                Tu catálogo, <em className="ac">no tus grupos.</em>
              </h1>
              <p className="desc">
                Aquí vive el producto: si puede venderse, cómo se ha vendido, sus fotos y su
                comunicación. Los grupos con fecha viven en{" "}
                <Link href="/caminante/admin/salidas" style={{ textDecoration: "underline" }}>
                  Salidas
                </Link>
                .
              </p>
            </>
          ) : (
            <>
              <h1 className="display" style={{ marginTop: 10 }}>
                {letras(resumen!.total)} {resumen!.total === 1 ? "producto" : "productos"},{" "}
                <em className="ac">
                  {resumen!.operadores === 0
                    ? "todos de la casa."
                    : `${letras(resumen!.operadores).toLowerCase()} ${
                        resumen!.operadores === 1 ? "operador" : "operadores"
                      }.`}
                </em>
              </h1>
              <p className="desc">
                Ordenadas por lo que necesitan: arriba las que no pueden vender, luego las que están
                vendiendo, al final las dormidas. Los grupos con fecha viven en{" "}
                <Link href="/caminante/admin/salidas" style={{ textDecoration: "underline" }}>
                  Salidas
                </Link>
                .
              </p>
            </>
          )}
        </div>
        <Link href="/caminante/admin/experiencias/nueva" className="btn btn-orange">
          + Experiencia
        </Link>
      </div>

      {productos.length === 0 ? (
        /* El vacío del entregable: explica qué ES una experiencia, porque quien
           llega aquí sin ninguna todavía no lo sabe. */
        <div className="empty" style={{ padding: "44px 24px" }}>
          <b
            style={{
              display: "block",
              fontSize: 18,
              fontWeight: 400,
              color: "var(--charcoal)",
              marginBottom: 8,
            }}
          >
            Todavía no hay experiencias.
          </b>
          <p style={{ maxWidth: "44ch", margin: "0 auto", lineHeight: 1.6 }}>
            Una experiencia es la plantilla que se repite: su lugar, su itinerario, su precio y sus
            fotos. Las fechas vienen después, en Salidas.
          </p>
          <div className="act-row" style={{ justifyContent: "center", marginTop: 20 }}>
            <Link href="/caminante/admin/experiencias/nueva" className="btn btn-orange">
              + Experiencia
            </Link>
          </div>
        </div>
      ) : (
        <Catalogo productos={productos} esOperador={esOperador}>
          {resumen ? (
            <div className="kpis" style={{ marginBottom: 24 }}>
              <div className="kpi card">
                <div className="k-lbl">Ingresos de la plataforma</div>
                <div className="k-val">{formatMXN(resumen.ingresos)}</div>
                <div className="k-sub">
                  De <b>{resumen.vendieron}</b>{" "}
                  {resumen.vendieron === 1 ? "experiencia que ha vendido" : "experiencias que han vendido"}
                  {resumen.operadores ? (
                    <>
                      {" · "}
                      <b>{resumen.operadores}</b>{" "}
                      {resumen.operadores === 1 ? "operador" : "operadores"}
                    </>
                  ) : null}
                </div>
              </div>

              {/* El candado que bloquea publicar Y cobrar. Se dice con nombre y
                  apellido: «1 de 5» sin decir cuál obliga a buscarla. */}
              <div
                className="kpi card"
                style={resumen.frenadas.length ? { borderColor: "rgba(255,93,54,.34)" } : undefined}
              >
                <div className="k-lbl">No pueden vender</div>
                <div
                  className="k-val"
                  style={resumen.frenadas.length ? { color: "var(--orange)" } : undefined}
                >
                  {resumen.frenadas.length}
                  <span className="u"> de {resumen.publicadas} publicadas</span>
                </div>
                <div className="k-sub">
                  {resumen.frenadas.length
                    ? resumen.frenadas.join(" · ")
                    : "Todas las publicadas pueden cobrar."}
                </div>
              </div>

              <div className="kpi card">
                <div className="k-lbl">Armadura completa</div>
                <div className="k-val">
                  {resumen.completas.length}
                  <span className="u"> de {resumen.total}</span>
                </div>
                <div className="k-sub">
                  {resumen.completas.length === 0
                    ? "Ninguna tiene las cinco dimensiones todavía."
                    : resumen.completas.length === 1
                      ? `Solo ${resumen.completas[0]} tiene las cinco dimensiones.`
                      : `${resumen.completas.join(" · ")} tienen las cinco dimensiones.`}
                </div>
              </div>

              {/* ⚠️ El promedio NUNCA sin su denominador, y el denominador son
                  DOS: cuántas respondieron y cuántas fueron invitadas. */}
              <div className="kpi card">
                <div className="k-lbl">Estrellas de la casa</div>
                <div className="k-val">
                  {resumen.stars != null ? dec(resumen.stars) : "—"}
                  {resumen.stars != null ? (
                    <span
                      className="st"
                      style={{
                        fontFamily: "'Geist',system-ui,sans-serif",
                        fontSize: 18,
                        color: "var(--orange)",
                        letterSpacing: "1px",
                      }}
                    >
                      {" ★"}
                    </span>
                  ) : null}
                </div>
                <div className="k-sub">
                  {resumen.respuestas ? (
                    <>
                      Promedio de <b>{resumen.respuestas}</b>{" "}
                      {resumen.respuestas === 1 ? "respuesta" : "respuestas"} de{" "}
                      <b>{resumen.invitadas}</b> {resumen.invitadas === 1 ? "viajero" : "viajeros"}
                    </>
                  ) : (
                    "Nadie ha respondido la encuesta todavía."
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <div className="exleg">
            <span className="f">
              <i />
              Dimensión completa
            </span>
            <span className="h">
              <i />A medias
            </span>
            <span className="n">
              <i />
              Falta
            </span>
            <span style={{ marginLeft: "auto", color: "var(--ink-soft)" }}>
              La armadura son cinco cosas: fotos, ficha científica, saber de los guías, deslinde y
              encuesta.
            </span>
          </div>
        </Catalogo>
      )}
    </AdminShell>
  );
}
