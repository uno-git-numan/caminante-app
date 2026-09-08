// El header y el nav de la ruta inmersiva de Recursos.
//
// Vive aparte porque ahora lo usan DOS páginas (la escalera y el cotizador). El
// comentario de `page.tsx` ya avisaba del riesgo: cuando este nav estuvo
// duplicado a mano se quedó sin Comunicación ni Solicitudes y esas pestañas
// dejaron de alcanzarse desde aquí. Con una segunda página, duplicarlo otra vez
// era garantizar la repetición.

import Link from "next/link";
import { ADMIN_NAV, ADMIN_NAV_OPERADOR, PERSON_ICON } from "../ui/nav";

const G1 =
  '<g class="g1"><path d="M14.64,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64S0,96.44,0,104.52s6.56,14.64,14.64,14.64"/><path d="M102.08,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M91.72,114.57L4.29,27.44C-1.43,21.73-1.43,12.46,4.29,6.74c5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
const G2 =
  '<g class="g2"><path d="M218.65,2.3c-8.09,0-14.64,6.56-14.64,14.64s6.56,14.64,14.64,14.64,14.64-6.56,14.64-14.64-6.56-14.64-14.64-14.64"/><path d="M276.91,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/><path d="M189.47,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/></g>';
const G3 =
  '<g class="g3"><path d="M335.23,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M422.67,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M412.31,114.57l-87.43-87.13c-5.72-5.72-5.72-14.99,0-20.71,5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
export const MARK = `<svg viewBox="0 0 437.31 121.74" role="img" aria-label="Caminante">${G1}${G2}${G3}</svg>`;

export default function Encabezado() {
  return (
    <header className="ahead">
      <div className="top">
        <div className="brand">
          <span className="logo" dangerouslySetInnerHTML={{ __html: MARK }} aria-label="Caminante" />
          <span className="mode">Modo admin</span>
        </div>
        <div className="qa">
          {/* «Pagos» era la pestaña «Reservas» del nav. Se mudó aquí porque
              una reserva es dinero cobrado, no una persona: la persona está
              en Comunidad y el pago está en Recursos, que es donde ya vivían
              el ledger, los payouts y la facturación. */}
          <Link className="btn btn-glass btn-sm" href="/caminante/admin/pagos">
            Pagos
          </Link>
          <Link className="btn btn-glass btn-sm" href="/caminante/admin/facturacion">
            Facturación CFDI
          </Link>
        </div>
      </div>
      <nav className="nav">
        {ADMIN_NAV.map((it) =>
          it.key === "recursos" ? (
            <Link key={it.key} href={it.href!} className="on">
              {it.label}
            </Link>
          ) : (
            <Link key={it.key} href={it.href!}>
              {it.label}
            </Link>
          ),
        )}
        <Link
          href={ADMIN_NAV_OPERADOR.href!}
          style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}
          title="Perfil del operador"
        >
          <span
            style={{ display: "inline-flex", alignItems: "center" }}
            dangerouslySetInnerHTML={{ __html: PERSON_ICON }}
          />
          {ADMIN_NAV_OPERADOR.label}
        </Link>
      </nav>
    </header>
  );
}
