// LA MARCA, EN LA FICHA DEL OPERADOR.
//
// Hasta el 24 sep 2026 la marca white-label no aparecía en esta sección: aquí
// se editaban el convenio y el perfil público —foto, bio, equipo— y los colores
// con los que se visten el portal, la reserva y el deslinde de esa operadora no
// se veían por ningún lado. Sólo existían dos puertas: un aviso en «Mi alta»
// que desaparecía en cuanto la marca quedaba completa, y «Capturarla por ella»
// en Comunidad. O sea: quien no la capturó al aplicar no tenía dónde verla, y
// quien sí la capturó no tenía dónde cambiarla.
//
// ⚠️ ESTO MUESTRA, NO EDITA. El editor de la marca es UNO —
// `mi-alta/marca` (la casa entra con `?operadora=<id>`)— y aquí sólo se enseña
// lo que hay con su liga. Un segundo formulario para la misma columna es
// exactamente lo que la 0038 fue a deshacer con el RFC: dos capturas del mismo
// hecho que un día divergen.

import Link from "next/link";
import type { OperatorBranding } from "@/lib/operators/branding";
import { faltanDeMarca, marcaLista } from "@/lib/operators/marca";

function Muestra({ hex, rotulo }: { hex: string; rotulo: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <span
        aria-hidden
        style={{
          width: 30,
          height: 30,
          flex: "0 0 auto",
          borderRadius: 8,
          background: hex,
          border: "1px solid var(--line)",
        }}
      />
      <span>
        <span className="mut" style={{ display: "block", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 700 }}>
          {rotulo}
        </span>
        <span className="mono" style={{ fontSize: 12.5 }}>{hex}</span>
      </span>
    </span>
  );
}

export default function MarcaResumen({
  id,
  nombre,
  slug,
  branding,
  esLaCasa,
}: {
  id: string;
  nombre: string;
  slug: string | null;
  branding: OperatorBranding | null;
  esLaCasa: boolean;
}) {
  const editar = `/caminante/admin/mi-alta/marca?operadora=${encodeURIComponent(id)}`;
  const completa = marcaLista(branding);
  const faltan = faltanDeMarca(branding);

  return (
    <div className="card pad" style={{ marginBottom: 24 }}>
      <span className="subtitle" style={{ margin: 0 }}>
        Marca white-label · {nombre}
      </span>
      <p className="mut" style={{ fontSize: 12.5, margin: "4px 0 14px" }}>
        Con qué colores y qué logo se ven <b>su</b> portal, su ficha, la reserva y el deslinde de sus
        clientes. Son dos colores: el resto se deriva de ellos.
      </p>

      {/* ⚠️ LA CASA NO SE VISTE A SÍ MISMA. Caminante ES el tema base, así que
          darle branding a la operadora propia no la vestiría de nada nuevo: la
          pintaría encima de sí misma. Se dice en vez de ofrecer un editor que
          no tendría efecto. */}
      {esLaCasa ? (
        <div className="verdict casa" style={{ marginBottom: 0 }}>
          <span className="n">{"//"}</span>
          <span className="g">
            <b>La casa no se viste: la casa es el vestido.</b>
            <span>
              Caminante es el tema base del que parten todas las marcas. Esta operadora no lleva
              white-label.
            </span>
          </span>
        </div>
      ) : completa ? (
        <>
          <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
            <Muestra hex={branding!.colors.primary} rotulo="Principal" />
            <Muestra hex={branding!.colors.accent} rotulo="Acento" />
            {branding!.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding!.logoUrl}
                alt={`Logo de ${nombre}`}
                style={{
                  height: 38,
                  maxWidth: 190,
                  objectFit: "contain",
                  background: "#fff",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  padding: "4px 8px",
                }}
              />
            ) : null}
          </div>

          {/* Completa para VESTIR no es completa del todo: sin logo su portal
              sigue mostrando el sello de Caminante. Se dice sin alarmar. */}
          {faltan.length ? (
            <p className="mut" style={{ fontSize: 12.5, margin: "12px 0 0" }}>
              Le falta el <b>{faltan.join(", ")}</b>: sus superficies ya se visten con sus colores,
              pero donde iría su logo sigue el sello de Caminante.
            </p>
          ) : null}

          <p style={{ margin: "14px 0 0", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn btn-ghost btn-sm" href={editar}>
              Editar su marca
            </Link>
            {slug ? (
              <Link className="btn btn-ghost btn-sm" href={`/caminante/o/${slug}`}>
                Ver su portal
              </Link>
            ) : null}
          </p>
        </>
      ) : (
        <div className="verdict no" style={{ marginBottom: 0 }}>
          <span className="n">{"//"}</span>
          <span className="g">
            <b>Sin marca: le falta {faltan.join(", ")}</b>
            <span>
              Mientras tanto, su portal y la reserva de sus clientes se ven de Caminante con su
              nombre. No bloquea vender —no es candado— y por eso nadie se entera hasta que lo ve.
            </span>
            <span style={{ marginTop: 8 }}>
              <Link href={editar}>Capturar su marca</Link>
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
