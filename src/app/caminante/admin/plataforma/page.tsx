import { redirect } from "next/navigation";
import AdminShell from "../ui/AdminShell";
import { getCurrentRole } from "@/lib/auth/authorization";
import { formatMXN } from "@/lib/admin/formato";
import { fetchPanoramaPlataforma } from "@/lib/plataforma/panorama";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panorama · Caminante plataforma" };

// PANORAMA DE LA PLATAFORMA — el sombrero Caminante.
//
// Diseño de design/plataforma/dc/plataforma.dc.html, sección #panorama.
//
// Toda la pantalla existe para una sola distinción: lo que CORRE por la
// plataforma no es lo que la casa GANA. Por eso las dos cifras no se apilan ni
// se ponen en tarjetas iguales — una está apagada y tachada como «no es
// ingreso», la otra es la única en naranja. Si alguien lee el GMV como ingreso,
// la pantalla falló, y ninguna nota al pie lo arregla.
//
// ⚠️ El copy sale de los datos, no está escrito a mano. En el entregable decía
// «los 49 pesos de reserva» y para cuando lo transcribí ya eran 52: los números
// se mueven cada día que alguien compra. Una frase con una cifra cosida a mano
// nace con fecha de caducidad y nadie la revisa nunca.

export default async function PanoramaPlataformaPage() {
  // Esto es de la casa y de nadie más. Un operador externo no administra la
  // plataforma: administra lo suyo, y su panel es el otro sombrero.
  if ((await getCurrentRole()) !== "admin") redirect("/caminante/admin");

  const d = await fetchPanoramaPlataforma();
  const { historico } = d.gmv;
  const arranque = d.primerArranque
    ? new Date(d.primerArranque).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        timeZone: "America/Mexico_City",
      })
    : null;

  // «Kéntro y Nomádika» — en lista natural, sin la coma de Oxford.
  const nombres = d.operadoras.nombres;
  const listaNombres =
    nombres.length === 0
      ? null
      : nombres.length === 1
        ? nombres[0]
        : `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;

  return (
    <AdminShell active="pl-panorama">
      <div className="sec">
        <div className="sec-head">
          <div>
            <span className="eyebrow">
              <span className="sl">{"//"}</span> Panorama
            </span>
            <h2 className="display" style={{ marginTop: 10 }}>
              Dos cifras que no son <em className="ac">la misma cosa.</em>
            </h2>
            <p className="desc">
              Lo que corre por la plataforma es de los operadores. Lo mío es la comisión. La
              diferencia entre esas dos cifras es el negocio entero.
            </p>
          </div>
        </div>

        <div className="mnyrow">
          <div className="mny thru">
            <span className="lb">Corrió por la plataforma</span>
            <span className="n">{formatMXN(historico.monto)}</span>
            <p className="sub">
              En <b>{historico.reservas} reservas</b>. Es dinero de los operadores: entra, se les
              paga y sale.
            </p>
            <span className="nope">No es ingreso de Caminante</span>
          </div>
          <div className="mny mine">
            <span className="lb">Me tocó a mí · comisión devengada</span>
            <span className="n">{formatMXN(d.comision.devengada)}</span>
            <p className="sub">
              Esto es lo único que Caminante gana.{" "}
              {d.ningunaExternaHaVendido ? (
                <>
                  Hoy es cero porque las {historico.reservas} reservas son <b>de la casa</b> —que se
                  vende a sí misma y retiene el 100%— y <b>ningún operador externo</b> ha vendido
                  todavía su primera reserva.
                </>
              ) : (
                <>
                  Sale de lo que vendieron los operadores externos, con el porcentaje que se congeló
                  en cada venta.
                </>
              )}
            </p>
            <span className="yes">Ingreso de Caminante</span>
          </div>
        </div>
        {d.ningunaExternaHaVendido ? (
          <p className="mnybridge">
            <s>{"//"}</s>
            <span>
              De cada peso que corrió, me tocaron <b>{formatMXN(0)}</b>: las {historico.reservas}{" "}
              reservas son de la casa, y la casa no se cobra comisión a sí misma. La comisión sólo
              aparece cuando vende un operador externo, y ninguno ha vendido todavía.
            </span>
          </p>
        ) : null}

        <p className="xh4" style={{ marginTop: 30 }}>
          El estado de hoy
        </p>
        <div className="kpis">
          <div className="card kpi">
            <span className="k-lbl">Operadores externos</span>
            <span className="k-val">{d.operadoras.externas}</span>
            <p className="k-sub">
              {listaNombres ? `${listaNombres}.` : "Todavía no hay ninguno dado de alta."}
            </p>
            <p className="zl">
              <s>{"//"}</s>
              <span>Ninguno puede vender todavía: les faltan candados.</span>
            </p>
          </div>
          <div className="card kpi">
            <span className="k-lbl">Vendiendo este mes</span>
            <span className="k-val">{d.operadoras.vendiendoEsteMes}</span>
            <p className="k-sub">
              {d.operadoras.vendiendoEsteMes === 0
                ? `Ningún operador externo tiene ventas atribuidas en ${d.mesEnCurso.split(" ")[0]}.`
                : `Operadores con ventas atribuidas en ${d.mesEnCurso.split(" ")[0]}.`}
            </p>
            <p className="zl">
              <s>{"//"}</s>
              <span>
                Para que este cero se mueva hace falta una experiencia publicada{" "}
                <b>a nombre del operador</b>.
              </span>
            </p>
          </div>
          <div className="card kpi">
            <span className="k-lbl">Comisión por cobrar</span>
            <span className="k-val">{formatMXN(d.comision.porCobrar)}</span>
            <p className="k-sub">
              {d.comision.porCobrar === 0
                ? "Nada devengado, nada por cobrar, ningún CFDI pendiente."
                : "Devengada y todavía sin cobrar a la operadora."}
            </p>
            <p className="zl">
              <s>{"//"}</s>
              <span>
                {arranque
                  ? `La primera comisión se devenga con la primera reserva posterior al ${arranque}.`
                  : "Ninguna operadora tiene fecha de arranque: sin ella no se devenga comisión."}
              </span>
            </p>
          </div>
          <div className="card kpi">
            <span className="k-lbl">Solicitudes esperando respuesta</span>
            <span className="k-val">{d.solicitudesEsperando}</span>
            <p className="k-sub">
              {d.solicitudesEsperando === 0
                ? "La bandeja está limpia. Nadie lleva esperando."
                : "Hay quien lleva esperando una respuesta."}
            </p>
            <p className="zl">
              <s>{"//"}</s>
              <span>
                Las solicitudes nuevas caen en <b>01 Llegó</b>, en el pipeline.
              </span>
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
