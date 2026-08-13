// Página pública PARA OPERADORES — transcripción verbatim de
// `design/operadores/dc/Operadores 1 Landing.html` (Claude Design, 13 ago 2026).
//
// Es la puerta que faltaba: existía `/caminante/embajadores` (quien VENDE) pero
// nada explicaba el otro camino, el de quien OPERA. El funnel de operador vivía
// escondido en `/caminante/signup?tipo=operador`, sin una sola página que
// dijera qué es, qué se le pide y cómo gana.
//
// Tres cosas del entregable que se conservan a propósito:
//   · El bloque «En camino» dice a la cara lo que NO existe (correos con su
//     marca, dominio propio, kit con su marca, depósito automático). Prometerlo
//     aquí se cobraría en la primera factura.
//   · Las ocho tarjetas son de cosas que YA corren en producción hoy.
//   · Los porcentajes NO viven aquí: ver `lib/operadores/comision.ts`.

import type { Metadata } from "next";
import Script from "next/script";
import { OPA_CSS } from "@/lib/operadores/opa-css";
import { TRAMOS, HAY_TRAMOS, pctTexto } from "@/lib/operadores/comision";

export const metadata: Metadata = {
  title: "Caminante · Para operadores",
  description:
    "Tú llevas a la gente al monte, al mar o a la cueva. Caminante vende la salida, cobra, genera el deslinde, guarda los datos médicos y mide cómo te fue.",
};

const IMG = "/landing/assets/img";

export default function OperadoresPage() {
  return (
    <div className="opa">
      <style dangerouslySetInnerHTML={{ __html: OPA_CSS }} />

      <header className="opa-top" id="opa-top">
        {/*
          ⚠️ El entregable pedía `caminante-logo-white.png` y
          `caminante-logo-color.png`, que NO existen. Los reales son los SVG de
          `public/landing/assets/logos/` — blanco sobre el hero, a color cuando
          la barra se vuelve sólida al scrollear.
        */}
        <a href="/caminante" aria-label="Caminante">
          <img className="lg off" src="/landing/assets/logos/caminante-logo-white.svg" alt="Caminante" />
          <img className="lg on" src="/landing/assets/logos/caminante-logo.svg" alt="Caminante" />
        </a>
        <div className="rt">
          <a
            className="opa-btn accent"
            href="/caminante/operadores/aplicar"
            style={{ minHeight: 44, fontSize: "14.5px", padding: "0 18px" }}
          >
            Aplica como operador
          </a>
        </div>
      </header>

      {/* 1.1 Hero */}
      <section className="opa-hero">
        <div className="opa-ph">
          <img src={`${IMG}/dusk-walk.jpg`} alt="Grupo caminando al atardecer" />
        </div>
        <div className="opa-coord">24°09′ N<br />110°19′ W</div>
        <div className="in">
          <span className="opa-eyb neg"><i>{"//"}</i> Para operadores</span>
          <h1 className="opa-h1">El campo es tuyo. La <em>infraestructura, nuestra.</em></h1>
          <p className="opa-lead neg">
            Tú llevas a la gente al monte, al mar o a la cueva. Caminante vende la salida, cobra,
            genera el deslinde, guarda los datos médicos y mide cómo te fue.
          </p>
          <div className="cta">
            <a className="opa-btn accent" href="/caminante/operadores/aplicar">Aplica como operador</a>
            <p className="opa-fine neg">Programa curado. Aplicación → llamada de 30 minutos → convenio.</p>
          </div>
        </div>
      </section>

      {/* 1.2 Reparto */}
      <section className="opa-sec">
        <div className="opa-wrap">
          <span className="opa-eyb"><i>{"//"}</i> El reparto</span>
          <h2 className="opa-h2" style={{ margin: "12px 0 14px" }}>
            Tú pones el campo. <em>Nosotros, todo lo demás.</em>
          </h2>
          <p className="opa-lead">
            Ninguna plataforma puede leer un cielo que se cierra ni decidir cuándo se aborta una
            salida. Eso es tuyo. Lo demás es sistema, y el sistema lo ponemos nosotros.
          </p>
          <div className="opa-split">
            <div className="opa-col mine">
              <h4>Lo que haces tú</h4>
              <div className="opa-li"><s>{"//"}</s><div><b>Guiar</b><span>Estás ahí el día de la salida, con el grupo, tomando las decisiones que solo se toman en campo.</span></div></div>
              <div className="opa-li"><s>{"//"}</s><div><b>Conocer el lugar</b><span>Su naturaleza, su conservación, su gente y sus problemas. Las cuatro caras, no solo la actividad.</span></div></div>
              <div className="opa-li"><s>{"//"}</s><div><b>Cuidar al grupo</b><span>Seguro vigente, guías con primeros auxilios, protocolo de emergencia y cupo con criterio.</span></div></div>
            </div>
            <div className="opa-col">
              <h4>Lo que hace la plataforma</h4>
              <div className="opa-li"><s>{"//"}</s><div><b>Vender y cobrar</b><span>Tu página de experiencia, pago con tarjeta, links por WhatsApp y transferencias registradas.</span></div></div>
              <div className="opa-li"><s>{"//"}</s><div><b>Documentar</b><span>Deslinde firmado en línea antes de subirse y expediente médico de cada participante.</span></div></div>
              <div className="opa-li"><s>{"//"}</s><div><b>Comunicar y medir</b><span>Kit de piezas por experiencia, encuesta automática al volver y un panel con tu ocupación y tu dinero.</span></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* 1.3 Qué construimos */}
      <section className="opa-band">
        <div className="opa-ph"><img src={`${IMG}/hero-bcs.jpg`} alt="Costa de Baja California Sur" /></div>
        <div className="opa-wrap">
          <span className="opa-eyb neg"><i>{"//"}</i> Lo que construimos por ti</span>
          <h2 className="opa-h2" style={{ color: "#fff", margin: "12px 0 12px" }}>
            Ocho cosas que <em>ya existen.</em>
          </h2>
          <p className="opa-lead neg">
            Están funcionando hoy con las experiencias que operamos nosotros. No son promesas.
          </p>
          <div className="opa-grid">
            <article className="opa-glass"><h3>Tu página de experiencia</h3><p>Hecha con tus fotos y tu itinerario, con las cuatro caras del lugar: naturaleza, conservación, comunidades y problemas.</p></article>
            <article className="opa-glass"><h3>Cobro en línea</h3><p>Pago con tarjeta, links por WhatsApp y transferencias registradas. Cada peso, rastreado.</p></article>
            <article className="opa-glass"><h3>Deslinde legal que se genera solo</h3><p>Tus cláusulas se vuelven un documento que el cliente lee y firma en línea, antes de subirse.</p></article>
            <article className="opa-glass"><h3>Expediente médico de cada participante</h3><p>Alergias, padecimientos, contacto de emergencia. Y de quienes viajan con él.</p></article>
            <article className="opa-glass"><h3>Cupos y fechas</h3><p>Salidas públicas, salidas privadas por link y solicitudes de fecha nueva cuando alguien pide la suya.</p></article>
            <article className="opa-glass"><h3>Kit de comunicación</h3><p>Piezas listas para Instagram por cada experiencia, con textos escritos y publicación programada.</p></article>
            <article className="opa-glass"><h3>Encuesta automática</h3><p>A cada quien que viajó, 24 horas después de volver. Sabes cómo te fue sin preguntar.</p></article>
            <article className="opa-glass"><h3>Tu panel</h3><p>Ocupación por salida, lista de quién sube, dinero cobrado y lo que te toca.</p></article>
          </div>
        </div>
      </section>

      {/* 1.4 Tu marca */}
      <section className="opa-sec">
        <div className="opa-wrap">
          <div className="opa-two" style={{ alignItems: "center" }}>
            <div>
              <span className="opa-eyb"><i>{"//"}</i> Portal propio</span>
              <h2 className="opa-h2" style={{ margin: "12px 0 14px" }}>Tu marca, <em>no la nuestra.</em></h2>
              <p className="opa-lead">
                Tus clientes entran a un portal con tu logo y tus colores, en{" "}
                <span className="opa-mono" style={{ overflowWrap: "anywhere", color: "var(--opa-charcoal)" }}>
                  caminante.numanhub.com/caminante/o/tu-marca
                </span>
                . Caminante queda atrás, sosteniendo el cobro y los papeles.
              </p>
            </div>
            <div className="opa-mock lite" style={{ marginTop: 26 }}>
              <div className="bar">
                <span className="dot" /><span className="dot" /><span className="dot" />
                <span className="addr">caminante.numanhub.com/caminante/o/tu-marca</span>
              </div>
              <div className="body">
                <div className="brand"><span className="sq" /><span><b>Tu operadora</b><small>Baja California Sur</small></span></div>
                <div className="row">
                  <div className="card"><img src={`${IMG}/exp-ensenada.jpg`} alt="" /><em>Safari marino · 1 día</em></div>
                  <div className="card"><img src={`${IMG}/boat-crew.jpg`} alt="" /><em>Isla y campamento · 2 días</em></div>
                </div>
                <span className="pill">Reservar</span>
              </div>
            </div>
          </div>
          <div className="opa-soon">
            <div className="hd">
              <span className="opa-eyb"><i>{"//"}</i> En camino</span>
              <span className="opa-fine">Compromiso, no función disponible</span>
            </div>
            <p className="opa-fine" style={{ maxWidth: "56ch" }}>
              Cuatro cosas que hoy no existen. Las escribimos aquí para que nadie te las prometa en
              una llamada.
            </p>
            <div className="opa-soonlist">
              <div><span className="opa-tag">En camino</span> Correos con tu marca</div>
              <div><span className="opa-tag">En camino</span> Dominio propio</div>
              <div><span className="opa-tag">En camino</span> Kit y PDF con tu marca</div>
              <div><span className="opa-tag">En camino</span> Depósito automático</div>
            </div>
          </div>
        </div>
      </section>

      {/* 1.5 Comisión */}
      <section className="opa-band" id="comision">
        <div className="opa-ph"><img src={`${IMG}/camp-aerial.jpg`} alt="Campamento visto desde el aire" /></div>
        <div className="opa-wrap">
          <div className="opa-narrow">
            <span className="opa-eyb neg"><i>{"//"}</i> Cómo ganas</span>
            <h2 className="opa-h2" style={{ color: "#fff", margin: "12px 0 14px" }}>
              Entre más cara la experiencia, <em>más baja nuestra comisión.</em>
            </h2>
            <p className="opa-lead neg">
              La escala es inversa al precio por persona. Tres escalones, sin letra chica escondida.
            </p>
            <div className="opa-glass" style={{ marginTop: 24, padding: "6px 20px" }}>
              <div className="opa-tramos neg">
                {TRAMOS.map((t) => (
                  <div className="opa-tramo" key={t.rango}>
                    <span className="rng"><small>Precio por persona</small>{t.rango}</span>
                    <span className="pct">{pctTexto(t)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="opa-notes neg">
              {/* Mientras no haya cifras, la primera nota lo dice en vez de fingirlas. */}
              {HAY_TRAMOS ? null : (
                <div><s>{"//"}</s><span>Los porcentajes de cada escalón se comparten en la llamada.</span></div>
              )}
              <div><s>{"//"}</s><span>La comisión se congela en cada venta: lo ya vendido nunca cambia.</span></div>
              <div><s>{"//"}</s><span>Te pagamos a los 7 días del regreso.</span></div>
              <div><s>{"//"}</s><span>El porcentaje exacto se cierra en el convenio.</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* 1.6 Lo que pedimos */}
      <section className="opa-sec" style={{ background: "var(--opa-panel)" }}>
        <div className="opa-wrap">
          <div className="opa-narrow">
            <span className="opa-eyb"><i>{"//"}</i> Lo que te pedimos</span>
            <h2 className="opa-h2" style={{ margin: "12px 0 14px" }}>Cinco cosas, <em>sin suavizar.</em></h2>
            <div className="opa-req">
              <div className="r"><span className="n">01</span><div><b>Seguro de responsabilidad civil vigente</b><p>Con la actividad que operas cubierta. El turismo de aventura suele venir excluido en pólizas genéricas.</p></div></div>
              <div className="r"><span className="n">02</span><div><b>Guías con primeros auxilios</b><p>Certificación vigente de quien sale con nuestros clientes, con atención en zonas remotas donde aplique.</p></div></div>
              <div className="r"><span className="n">03</span><div><b>Protocolo de emergencia por experiencia</b><p>Evacuación, comunicación sin señal, hospital más cercano y quién decide abortar la salida.</p></div></div>
              <div className="r"><span className="n">04</span><div><b>Permisos del área donde operas</b><p>Área natural protegida, ejido o comunidad, o predio privado. Es lo que más se salta y lo que más problema da.</p></div></div>
              <div className="r"><span className="n">05</span><div><b>El estándar Caminante</b><p>Beneficio real a la comunidad local, no dejar rastro, cupo con criterio.</p></div></div>
            </div>
            <p className="opa-lead" style={{ marginTop: 22, fontStyle: "italic", color: "var(--opa-charcoal)" }}>
              Si algo te falta, dilo. Varios de estos se resuelven; esconderlos, no.
            </p>
          </div>
        </div>
      </section>

      {/* 1.7 Proceso y cierre */}
      <section className="opa-band" id="aplica">
        <div className="opa-ph"><img src={`${IMG}/tents-sunset.jpg`} alt="Campamento al atardecer" /></div>
        <div className="opa-wrap">
          <span className="opa-eyb neg"><i>{"//"}</i> Cómo es el proceso</span>
          <h2 className="opa-h2" style={{ color: "#fff", margin: "12px 0 14px" }}>Cuatro pasos, <em>en orden.</em></h2>
          <div className="opa-grid" style={{ marginTop: 24 }}>
            <article className="opa-glass"><span className="k">Paso 01</span><h3>Aplicas</h3><p>Quince campos. Ni un documento todavía; lo suficiente para saber si vale la llamada.</p></article>
            <article className="opa-glass"><span className="k">Paso 02</span><h3>Hablamos 30 minutos</h3><p>Aquí se cierra la comisión y te decimos con claridad qué existe y qué está en camino.</p></article>
            <article className="opa-glass"><span className="k">Paso 03</span><h3>Nos compartes tus documentos</h3><p>Un link privado con la lista completa: póliza, fiscal, certificados, protocolo, permisos.</p></article>
            <article className="opa-glass"><span className="k">Paso 04</span><h3>Publicamos tu primera experiencia juntos</h3><p>La armamos contigo y la primera salida va acompañada.</p></article>
          </div>
          <div className="opa-end">
            <p className="q">Donde pones tu atención, <em>ahí va tu energía.</em></p>
            <a className="opa-btn accent" href="/caminante/operadores/aplicar">Aplica como operador</a>
            <p className="opa-fine neg">
              Dudas antes de aplicar: <a href="mailto:uno@numanhub.com">uno@numanhub.com</a>
            </p>
          </div>
        </div>
      </section>

      <div className="opa-fix" id="opa-fix">
        <a className="opa-btn accent wide" href="/caminante/operadores/aplicar">Aplica como operador</a>
      </div>

      {/*
        El script del entregable, re-emitido con next/script. ⚠️ Un <script>
        inline en JSX muere con el hydration mismatch — es la regla app-first que
        ya nos costó una vez.
      */}
      <Script id="opa-scroll" strategy="afterInteractive">{`
(function(){
  var top=document.getElementById("opa-top"),fix=document.getElementById("opa-fix");
  if(!top||!fix)return;
  addEventListener("scroll",function(){var y=scrollY;top.classList.toggle("solid",y>60);fix.classList.toggle("show",y>innerHeight*.7)},{passive:true});
})();
      `}</Script>
    </div>
  );
}
