// Aplicación de operador + su confirmación. Transcripción de las pantallas 2 y
// 3 de `design/operadores/dc/`.
//
// Las dos viven en la MISMA ruta y se eligen por query param, como el resto de
// los formularios públicos del sitio (`?ok=1` / `?error=…`): la página es
// dinámica y no hay revalidatePath que las coordine.

import type { Metadata } from "next";
import { OPA_CSS } from "@/lib/operadores/opa-css";
import OpaAplicar from "./OpaAplicar";

export const metadata: Metadata = {
  title: "Caminante · Aplica como operador",
  robots: { index: false }, // la que se indexa es la landing, no el formulario
};

export const dynamic = "force-dynamic";

const IMG = "/landing/assets/img";

const ERRORES: Record<string, string> = {
  datos: "Falta algún dato de contacto. Revisa el paso 1.",
  operacion: "Falta describir qué operas. Revisa el paso 2.",
  seguridad: "Faltan las respuestas de seguridad. Revisa el paso 3.",
  compromisos: "Hay que aceptar los tres compromisos para enviar la solicitud.",
  guardar: "No pudimos guardar tu solicitud. Inténtalo de nuevo en un momento.",
};

export default async function AplicarOperadorPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;

  // 3 · Confirmación
  if (ok) {
    return (
      <div className="opa">
        <style dangerouslySetInnerHTML={{ __html: OPA_CSS }} />
        <section className="opa-ok">
          <div className="opa-ph"><img src={`${IMG}/bosque-niebla.jpg`} alt="Bosque con niebla" /></div>
          <img className="lg" src="/landing/assets/logos/caminante-logo-white.svg" alt="Caminante" />
          <div className="in">
            <span className="opa-eyb neg"><i>{"//"}</i> Solicitud recibida</span>
            <h1 className="opa-h1" style={{ margin: "14px 0 14px", fontSize: "clamp(34px,7.4vw,60px)" }}>
              Recibimos <em>tu solicitud.</em>
            </h1>
            <p className="opa-lead neg">
              Te llegó una copia al correo que nos diste. La leemos completa antes de escribirte: no
              es un acuse automático y luego silencio.
            </p>
            <div className="opa-oknext">
              <div className="r"><span className="k">Ahora</span><div><b>La leemos</b><p>Nos importan tres respuestas: seguro, primeros auxilios y cómo manejaste un incidente.</p></div></div>
              <div className="r"><span className="k">En días</span><div><b>Te escribimos para agendar 30 minutos</b><p>Si encajas, buscamos fecha para la llamada. Si por ahora no, también te lo decimos, y por qué.</p></div></div>
              <div className="r"><span className="k">Después</span><div><b>En la llamada se cierra la comisión</b><p>Y te decimos qué existe hoy y qué está en camino. Luego viene tu expediente.</p></div></div>
            </div>
            <div className="cta" style={{ marginTop: 26 }}>
              <a className="opa-btn glass" href="/caminante/operadores">Volver al sitio</a>
              <p className="opa-fine neg">
                ¿Algo que agregar antes de la llamada?{" "}
                <a href="mailto:uno@numanhub.com" style={{ color: "#fff", textDecoration: "underline" }}>
                  uno@numanhub.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const aviso = error && error !== "duplicada" ? ERRORES[error] ?? ERRORES.guardar : null;

  return (
    <div className="opa">
      <style dangerouslySetInnerHTML={{ __html: OPA_CSS }} />
      <div className="opa-app">
        {aviso ? (
          <div className="opa-warn" style={{ margin: "16px 20px 0" }}>
            <s>{"//"}</s><span>{aviso}</span>
          </div>
        ) : null}
        <OpaAplicar duplicada={error === "duplicada"} />
      </div>
    </div>
  );
}
