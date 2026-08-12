"use client";

// Vista MÓVIL de /caminante/reserva/exito — transcripción de `PubExito`
// (design/publico-movil/pub-b.jsx:60) contra el regreso real de Stripe.
//
// La ruta YA tiene escritorio: `page.tsx` renderiza los DOS marcados y el CSS
// decide cuál se ve (corte en 700px). Aquí solo vive el móvil.
//
// ⚠️ EL MOCKUP MANDA SIEMPRE AL DESLINDE (`nav.replace("deslinde")`). En
// producción el CTA solo va si `registration.active`; si no, sería un 404 — es
// el bug que ya se corrigió una vez en esta misma pantalla. Por eso el bloque
// naranja «el siguiente paso no es opcional» está condicionado, y cuando no hay
// deslinde la pantalla cierra por contacto, con el mismo copy del escritorio.
//
// Los datos de la reserva (experiencia, salida, personas, monto) salen de la
// reserva REAL resuelta desde `session_id`; si el webhook todavía no aterriza,
// la línea simplemente no se pinta. Nada se inventa.

import Link from "next/link";
import { pfmt } from "@/app/caminante/ui/pub/PubShell";

export type ExitoResumen = {
  experiencia: string;
  salida: string;
  personas: number | null;
  montoMxn: number | null;
};

export default function ExitoMovil({
  deslindeActivo,
  deslindeHref,
  facturaHref,
  resumen,
}: {
  deslindeActivo: boolean;
  deslindeHref: string;
  facturaHref: string | null;
  resumen: ExitoResumen | null;
}) {
  const linea = resumen
    ? [
        resumen.personas
          ? `${resumen.personas} persona${resumen.personas > 1 ? "s" : ""}`
          : null,
        resumen.montoMxn ? `${pfmt(resumen.montoMxn)} pagados` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div className="pub-screen" style={{ background: "var(--panel)", minHeight: "100%" }}>
      <div className="pub-headpad"></div>
      <div className="pub-state" style={{ paddingTop: 30 }}>
        <span className="ic" style={{ background: "var(--forest)", color: "#fff", fontSize: 22 }}>
          ✓
        </span>
        <h3 style={{ fontSize: 22, fontWeight: 250, letterSpacing: "-.01em" }}>
          Tu lugar está apartado.
        </h3>
        <p>
          {resumen ? (
            <>
              <b style={{ color: "var(--charcoal)" }}>
                {[resumen.experiencia, resumen.salida].filter(Boolean).join(" · ")}
              </b>
              <br />
            </>
          ) : null}
          {linea ? `${linea}. ` : ""}Te enviamos la confirmación por correo.
        </p>
      </div>

      <div style={{ padding: "0 20px" }}>
        {deslindeActivo ? (
          <div className="pub-blk" style={{ borderColor: "rgba(255,93,54,.4)", borderWidth: 1.5 }}>
            <span className="pub-lbl" style={{ color: "var(--orange)" }}>
              El siguiente paso no es opcional
            </span>
            <p style={{ fontSize: 15.5, lineHeight: 1.6 }}>
              Falta <b>firmar el deslinde</b> — sin firma no se sube a la van. Toma 3 minutos y ahí
              registras a tus acompañantes.
            </p>
            <Link className="pub-cta pub-cta-orange" style={{ marginTop: 14 }} href={deslindeHref}>
              Firmar el deslinde ahora
            </Link>
          </div>
        ) : (
          // Sin `registration.active` NO hay deslinde que firmar: el link daría
          // 404. Mismo cierre que el escritorio.
          <div className="pub-blk">
            <span className="pub-lbl">Lo que sigue</span>
            <p style={{ fontSize: 15.5, lineHeight: 1.6 }}>
              Te contactamos con los últimos detalles antes de la experiencia.
            </p>
          </div>
        )}

        {facturaHref ? (
          <Link className="pub-cta pub-cta-ghost" style={{ width: "100%", marginTop: 12 }} href={facturaHref}>
            ¿Necesitas factura? Solicítala aquí
          </Link>
        ) : null}

        {/* <a> y no <Link>: /caminante/entrar es un route handler (rutea por
            rol) y una navegación de router se queda colgada en él. */}
        <a className="pub-cta pub-cta-ghost" style={{ width: "100%", marginTop: 12 }} href="/caminante/entrar">
          Lo hago después · ir a Mi espacio
        </a>
      </div>
    </div>
  );
}
