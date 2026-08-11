"use client";

// MÁS · raíz — transcrita de `ScrMas` (design/admin-movil/adm-screens-c.jsx).
// Es el menú de la pestaña: cuatro destinos y la salida.
//
// Diferencias con el entregable, ambas de integración:
//   · El badge de Solicitudes es el conteo REAL de lo pendiente (fechas +
//     accesos de operador + aplicaciones de embajador), el mismo que el badge
//     de la pestaña.
//   · «Salir» no es un toast: es el `signOut` de verdad, en un <form>, igual
//     que el botón Salir del panel de escritorio (AdminShell).
//   · Se cae el «v3.0» del pie: no existe tal número de versión.

import { signOut } from "@/lib/auth/actions";
import type { MasMovil } from "@/lib/admin/movil/mas";
import type { Nav } from "./AppShell";
import { Gap, Head } from "./kit";

export default function Mas({ d, nav }: { d: MasMovil; nav: Nav }) {
  return (
    <div className="adm-screen">
      <Head eyebrow="Más" title="Todo lo <em>demás.</em>" />
      <div className="adm-pad">
        <div className="adm-card adm-menu">
          <button className="mrow" onClick={() => nav.push("comunicacion")}>
            <span className="mi">CO</span>
            <span className="grow">
              Comunicación<small>cola de redes · kits por experiencia</small>
            </span>
            <span className="go">›</span>
          </button>
          <button className="mrow" onClick={() => nav.push("solicitudes")}>
            <span className="mi">SO</span>
            <span className="grow">
              Solicitudes<small>fechas · acceso de operador · embajadores</small>
            </span>
            {d.pendientes > 0 ? <span className="nbd">{d.pendientes}</span> : <span className="go">›</span>}
          </button>
          <button className="mrow" onClick={() => nav.push("operador")}>
            <span className="mi">OP</span>
            <span className="grow">
              Operador<small>perfil público</small>
            </span>
            <span className="go">›</span>
          </button>
          <button className="mrow" onClick={() => nav.push("cobro")}>
            <span className="mi">$</span>
            <span className="grow">
              Generar cobro<small>link de pago por WhatsApp</small>
            </span>
            <span className="go">›</span>
          </button>
          <form action={signOut}>
            <button className="mrow out" type="submit">
              <span className="mi" style={{ background: "rgba(255,93,54,.1)", color: "var(--orange)" }}>
                SA
              </span>
              <span className="grow">Salir</span>
            </button>
          </form>
        </div>
        <Gap />
        <p className="adm-mut" style={{ fontSize: 11.5, textAlign: "center", lineHeight: 1.6 }}>
          CAMINANTE · Modo admin
          <br />
          Numan Hub S.A. de C.V.
        </p>
      </div>
    </div>
  );
}
