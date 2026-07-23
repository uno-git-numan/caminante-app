// PROGRAMA DE EMBAJADORES — página pública + aplicación curada.
// Guion: el deck oficial (~/numan-pitch/deck-embajadores). ⚠️ SIN cifras de
// ganancias/tablas de dinero (regla de Luis: no hardcodear números del deck en
// la web sin su confirmación); el "30% de la utilidad neta" sí va — es la
// definición del programa. Ruta inmersiva (topbar propio, regreso visible:
// regla app-first). Diseño .emb-* (paleta de la casa + glass sobre foto).
import type { Metadata } from "next";
import { BRAND_MARK } from "@/lib/experiences/brand-svg";
import EmbForm from "./EmbForm";
import { EMB_CSS } from "./emb-css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Programa de embajadores · Caminante",
  description:
    "Vende viajes. Gana el 30% de la utilidad. Viaja gratis. Tú tienes la comunidad; nosotros las experiencias, la plataforma y la operación.",
};

// Fotos oficiales del deck de embajadores, subidas al bucket público (23 jul).
const BUCKET = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/experiences/embajadores`;

const ERRORES: Record<string, string> = {
  datos: "Nos falta tu nombre, correo o WhatsApp — revísalos e inténtalo de nuevo.",
  perfil: "Cuéntanos cuál es tu perfil: creador, agencia o líder de comunidad.",
  links: "Comparte al menos un link de tus redes o comunidad con su tamaño de audiencia.",
  duplicada: "Ya tenemos una aplicación tuya en revisión — te escribimos pronto, no hace falta otra.",
  guardar: "No pudimos guardar tu aplicación. Inténtalo de nuevo en un momento.",
};

export default async function EmbajadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const errMsg = error ? (ERRORES[error] ?? ERRORES.guardar) : null;

  return (
    <div className="emb">
      <style dangerouslySetInnerHTML={{ __html: EMB_CSS }} />

      {/* ===== HERO ===== */}
      <header className="emb-hero">
        <div className="emb-ph">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${BUCKET}/delfines-brinco.jpg`} alt="Delfines en Baja California Sur" />
        </div>
        <div className="emb-topbar">
          <a className="emb-logo" href="/caminante" aria-label="Caminante" dangerouslySetInnerHTML={{ __html: BRAND_MARK }} />
          <a className="emb-back" href="/caminante">← Volver a Caminante</a>
        </div>
        <span className="emb-eyebrow"><span className="sl">{"//"}</span> Programa de embajadores</span>
        <h1 className="emb-display">Vende viajes.<br />Gana el 30%.<br /><em className="emb-ac">Viaja gratis.</em></h1>
        <p className="emb-sub">
          Tú tienes la comunidad. Nosotros tenemos las experiencias, la plataforma y la operación.
          Juntos: viajes inolvidables que te pagan.
        </p>
        <a className="emb-cta" href="#aplicar">Aplica al programa</a>
      </header>

      <div className="emb-wrap">
        {/* ===== TÚ / NOSOTROS ===== */}
        <section className="emb-sec">
          <span className="emb-eyebrow"><span className="sl">{"//"}</span> Qué es un embajador</span>
          <h2 className="emb-display">Tú vendes. <em className="emb-ac">Nosotros operamos todo.</em></h2>
          <div className="emb-duo">
            <div className="emb-col na">
              <div className="k">Lo que haces tú</div>
              <ul>
                <li>Eliges una experiencia del catálogo — ya está costeada, armada y dada de alta.</li>
                <li>La compartes con tu comunidad con el kit oficial: fotos, piezas y captions listos.</li>
                <li>Llenas tu salida — tu gente reserva y paga en línea, directo en la plataforma.</li>
              </ul>
            </div>
            <div className="emb-col ve">
              <div className="k">Lo que hacemos nosotros</div>
              <ul>
                <li>Cobros, facturación, deslinde legal y seguros — todo en plataforma.</li>
                <li>La operación completa del viaje: guías, logística, seguridad, comida, fotógrafo.</li>
                <li>Página web de tu salida, links de pago y la comunicación con cada viajero.</li>
              </ul>
            </div>
          </div>
          <p className="emb-lead" style={{ marginTop: 26 }}>
            No necesitas ser agencia: <strong>necesitas comunidad.</strong>
          </p>
        </section>

        {/* ===== 4 PASOS ===== */}
        <section className="emb-sec">
          <span className="emb-eyebrow"><span className="sl">{"//"}</span> Cómo funciona</span>
          <h2 className="emb-display">Cuatro pasos.</h2>
          <div className="emb-steps">
            <div className="emb-step">
              <div className="n">01</div>
              <div className="t">Elige y agenda</div>
              <p>Escoges experiencia y fecha del calendario. Esa salida queda bloqueada como tuya.</p>
            </div>
            <div className="emb-step">
              <div className="n">02</div>
              <div className="t">Comparte</div>
              <p>Publicas con el kit oficial. Tu comunidad reserva con tu link — cada venta queda atribuida a ti, congelada en el sistema.</p>
            </div>
            <div className="emb-step">
              <div className="n">03</div>
              <div className="t">Lidera tu salida</div>
              <p>El viaje ya está armado: tú lo vives gratis liderando a tu grupo. ¿Prefieres solo vender? Tu comisión no cambia.</p>
            </div>
            <div className="emb-step">
              <div className="n na">04</div>
              <div className="t">Cobra</div>
              <p>A los 7 días del regreso recibes tu 30% de la utilidad del viaje por transferencia, con el desglose completo.</p>
            </div>
          </div>
          <p className="emb-lead" style={{ marginTop: 24 }}>
            Transparencia total: la utilidad se calcula con la hoja de costeo de cada experiencia — la ves antes de vender.
          </p>
        </section>
      </div>

      {/* ===== LO QUE RECIBES (banda con glass) ===== */}
      <section className="emb-band">
        <div className="emb-wrap">
          <span className="emb-eyebrow"><span className="sl">{"//"}</span> Además de tu comisión</span>
          <h2 className="emb-display">Viajas gratis — <em className="emb-ac">y con todo resuelto.</em></h2>
          <div className="emb-band-grid">
            <div className="emb-glass">
              <div className="k">Tu lugar, gratis</div>
              <p>Lideras tu salida con tu grupo y tu lugar va por cuenta de caminante — el viaje ya está armado, tú lo vives con tu comunidad.</p>
            </div>
            <div className="emb-glass">
              <div className="k">Kit de venta completo</div>
              <p>Página web de tu salida, fotos profesionales, piezas para redes con captions listos, links de pago — todo generado por la plataforma.</p>
            </div>
            <div className="emb-glass">
              <div className="k">Fotos de tu viaje</div>
              <p>Fotógrafo en cada salida: tú y tu comunidad reciben el paquete de fotos de alta calidad — contenido para tu propia audiencia.</p>
            </div>
          </div>
        </div>
        <div className="emb-ph">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${BUCKET}/team-panga.jpg`} alt="Equipo Caminante en panga" />
        </div>
      </section>

      <div className="emb-wrap">
        {/* ===== PERFIL ===== */}
        <section className="emb-sec">
          <span className="emb-eyebrow"><span className="sl">{"//"}</span> El perfil</span>
          <h2 className="emb-display">¿Eres tú?</h2>
          <div className="emb-perfiles">
            <div className="emb-perfil">
              <div className="k">Creadores</div>
              <p>Tienes audiencia que confía en ti — outdoor, bienestar, viajes, fotografía — y quieres monetizarla con algo real, no con códigos de descuento.</p>
            </div>
            <div className="emb-perfil">
              <div className="k">Agencias individuales</div>
              <p>Ya organizas viajes para tu cartera y quieres experiencias premium listas para vender, sin cargar la operación.</p>
            </div>
            <div className="emb-perfil">
              <div className="k">Líderes de comunidad</div>
              <p>Corredores, buzos, escaladores, empresas con equipos — juntas gente que quiere vivir cosas juntas.</p>
            </div>
          </div>
          <div className="emb-nota">
            <strong>Lo único que pedimos:</strong> comunidad propia real, cuidado por tu gente, y jugar con las reglas de la plataforma. Nosotros ponemos todo lo demás.
          </div>
        </section>

        {/* ===== REGLAS CLARAS ===== */}
        <section className="emb-sec">
          <span className="emb-eyebrow"><span className="sl">{"//"}</span> Las reglas, claras desde el día uno</span>
          <div className="emb-reglas">
            <div className="emb-regla"><span><b>Comisión:</b> 30% de la utilidad neta del viaje, calculada con la hoja de costeo de la experiencia — la ves antes de vender.</span></div>
            <div className="emb-regla"><span><b>Pago:</b> transferencia dentro de los 7 días posteriores al regreso del grupo, con desglose completo.</span></div>
            <div className="emb-regla"><span><b>Ventas por la plataforma:</b> todo cobro pasa por los links oficiales (Stripe). Sin efectivo — así tu atribución queda congelada y protegida.</span></div>
            <div className="emb-regla"><span><b>Modalidad:</b> lideras tú el viaje con tu grupo (ya armado y respaldado por caminante), o solo vendes y caminante lo opera. Se define por experiencia en el convenio.</span></div>
            <div className="emb-regla"><span><b>Legal:</b> cada viajero firma deslinde y perfil médico en la plataforma antes de viajar — sin excepciones.</span></div>
            <div className="emb-regla"><span><b>Selección:</b> el programa es curado — aplicas, platicamos 30 minutos, y si hace clic firmamos convenio.</span></div>
          </div>
        </section>

        {/* ===== APLICACIÓN ===== */}
        <section className="emb-formsec" id="aplicar">
          <div style={{ textAlign: "center" }}>
            <span className="emb-eyebrow"><span className="sl">{"//"}</span> Únete</span>
            <h2 className="emb-display" style={{ margin: "14px auto 0", maxWidth: "18ch" }}>
              Tu comunidad ya quiere vivir esto. <em className="emb-ac">Tráela.</em>
            </h2>
            <p className="emb-lead" style={{ margin: "14px auto 0", maxWidth: "48ch" }}>
              Aplica al programa, platicamos 30 minutos, eliges tu primera experiencia y agendamos tu salida.
              El programa es curado: pocas manos, bien elegidas.
            </p>
          </div>

          <div className="emb-card">
            {ok ? (
              <div className="emb-ok">
                <div className="emb-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <h2 className="emb-display">Recibimos tu <em className="emb-ac">aplicación.</em></h2>
                <p>Te mandamos un correo de confirmación. Leemos cada aplicación con calma — si tu perfil hace clic, te escribimos para agendar la llamada.</p>
                <a className="emb-ghost" href="/caminante">← Volver a Caminante</a>
              </div>
            ) : (
              <>
                {errMsg ? <div className="emb-err">{errMsg}</div> : null}
                <EmbForm />
              </>
            )}
          </div>
        </section>
      </div>

      <footer className="emb-foot">Caminante by NUMAN · @somos.caminante · uno@numanhub.com</footer>
    </div>
  );
}
