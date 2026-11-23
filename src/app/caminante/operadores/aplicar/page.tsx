// Aplicación de operador + su confirmación. Transcripción de las pantallas 2 y
// 3 de `design/operadores/dc/`.
//
// Las dos viven en la MISMA ruta y se eligen por query param, como el resto de
// los formularios públicos del sitio (`?ok=1` / `?error=…`): la página es
// dinámica y no hay revalidatePath que las coordine.

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { OPA_CSS } from "@/lib/operadores/opa-css";
import { OPA_OK_CSS } from "@/lib/operadores/opa-ok-css";
import { COOKIE_ALTA, DESTINO_ALTA } from "@/lib/operadores/alta-directa";
import { llamadaObligatoria } from "@/lib/operadores/llamada";
import { signUpWithPassword } from "@/lib/auth/actions";
import OpaAplicar from "./OpaAplicar";

export const metadata: Metadata = {
  title: "Caminante · Aplica como operador",
  robots: { index: false }, // la que se indexa es la landing, no el formulario
};

export const dynamic = "force-dynamic";

const IMG = "/landing/assets/img";

const ERRORES: Record<string, string> = {
  datos: "Falta algún dato de contacto. Revisa el paso 1.",
  operacion: "Cuéntanos más de lo que operas: la descripción necesita al menos 140 caracteres. Revisa el paso 2.",
  seguridad: "Faltan las respuestas de seguridad. Revisa el paso 3.",
  compromisos: "Hay que aceptar los tres compromisos para enviar la solicitud.",
  guardar: "No pudimos guardar tu solicitud. Inténtalo de nuevo en un momento.",
};

export default async function AplicarOperadorPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; aprobada?: string }>;
}) {
  const { ok, error, aprobada } = await searchParams;
  // El correo del paso 1, que la acción dejó en una cookie de una hora para no
  // volver a pedirlo (ni ponerlo en la URL). Sin cookie, el campo se teclea.
  const correoDeAlta = ok && aprobada ? (await cookies()).get(COOKIE_ALTA)?.value ?? "" : "";

  // 3 · Confirmación
  if (ok) {
    return (
      <div className="opa">
        <style dangerouslySetInnerHTML={{ __html: OPA_CSS }} />
        <style dangerouslySetInnerHTML={{ __html: OPA_OK_CSS }} />
        <section className="opa-ok">
          <div className="opa-ph"><img src={`${IMG}/bosque-niebla.jpg`} alt="Bosque con niebla" /></div>
          <img className="lg" src="/landing/assets/logos/caminante-logo-white.svg" alt="Caminante" />
          <div className="in">
            <span className="opa-eyb neg"><i>{"//"}</i> {aprobada ? "Tu panel está listo" : "Solicitud recibida"}</span>
            <h1 className="opa-h1" style={{ margin: "14px 0 14px", fontSize: "clamp(34px,7.4vw,60px)" }}>
              {aprobada ? <>Ya estás <em>adentro.</em></> : <>Recibimos <em>tu solicitud.</em></>}
            </h1>
            <p className="opa-lead neg">
              {aprobada
                ? "No hay que esperar a nadie. Ponle una contraseña a tu cuenta y entras a poner tu marca y armar tu primera experiencia."
                : "Te llegó una copia al correo que nos diste. La leemos completa antes de escribirte: no es un acuse automático y luego silencio."}
            </p>
            {aprobada ? (
              // DEL FORMULARIO AL PANEL, SIN ESCALAS (23 nov 2026). Sin llamada
              // obligatoria (llamada.ts) la solicitud se aprueba al llegar, y
              // aquí mismo crea su cuenta: antes esta pantalla decía «te llegó
              // un correo» y la mandaba a buscarlo. La cuenta nace confirmada y
              // con sesión (`signUpWithPassword`), y `/entrar` la lleva a Mi
              // alta porque su correo ya es de operadora.
              <>
                <form
                  action={signUpWithPassword}
                  style={{ background: "#fff", borderRadius: 18, padding: "8px 18px 18px", marginTop: 22, maxWidth: 460, textAlign: "left", color: "var(--opa-charcoal)" }}
                >
                  <input type="hidden" name="next" value={DESTINO_ALTA} />
                  <div className="opa-fld">
                    <label htmlFor="alta-correo">Tu correo</label>
                    <input
                      id="alta-correo"
                      name="email"
                      type="email"
                      required
                      defaultValue={correoDeAlta}
                      readOnly={!!correoDeAlta}
                      autoComplete="username"
                      placeholder="El mismo con el que aplicaste"
                    />
                  </div>
                  <div className="opa-fld" style={{ paddingTop: 0 }}>
                    <label htmlFor="alta-clave">Elige una contraseña</label>
                    <input id="alta-clave" name="password" type="password" required minLength={8} autoComplete="new-password" autoFocus />
                    <p className="help">Mínimo 8 caracteres. Con ella y tu correo entras siempre a tu panel.</p>
                  </div>
                  <button className="opa-btn accent wide" type="submit" style={{ width: "100%" }}>Entrar a mi panel</button>
                </form>
                <div className="opa-oknext">
                  <div className="r"><span className="k">Ahora</span><div><b>Pones tu marca y armas tu experiencia</b><p>Tu logo, tus colores y tu primera experiencia. Al guardarla ves tu página como la verá tu cliente. Es libre: no pide papeles ni firma.</p></div></div>
                  <div className="r"><span className="k">Después</span><div><b>Dos documentos, una firma y tu cuenta de cobro</b><p>Con eso publicas y vendes: tu constancia fiscal, tu identificación, el convenio y la cuenta donde recibes tu dinero. Tu comisión es fija: 8 % si tú traes al cliente y 12 % si te lo traemos nosotros.</p></div></div>
                </div>
              </>
            ) : (
            <div className="opa-oknext">
              <div className="r"><span className="k">Ahora</span><div><b>La leemos</b><p>Nos importan tres respuestas: seguro, primeros auxilios y cómo manejaste un incidente.</p></div></div>
              <div className="r"><span className="k">En días</span><div><b>Te escribimos para agendar 30 minutos</b><p>Si encajas, buscamos fecha para la llamada. Si por ahora no, también te lo decimos, y por qué.</p></div></div>
              <div className="r"><span className="k">Después</span><div><b>Entras a tu panel y armas tu experiencia</b><p>Primero lo tuyo: tu marca y tu página. Los documentos, la firma y tu cuenta de cobro vienen al final. Tu comisión es fija: 8 % si tú traes al cliente y 12 % si te lo traemos nosotros.</p></div></div>
            </div>
            )}
            <div className="cta" style={{ marginTop: 26 }}>
              <a className="opa-btn glass" href="/caminante/operadores">Volver al sitio</a>
              <p className="opa-fine neg">
                {aprobada ? "También te llegó un correo con la liga, por si prefieres entrar después. ¿Dudas?" : "¿Algo que agregar antes de la llamada?"}{" "}
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
        <OpaAplicar duplicada={error === "duplicada"} entraSola={!llamadaObligatoria()} />
      </div>
    </div>
  );
}
