// Plantilla de página de destino, data-driven (reproduce VERBATIM el diseño
// estático de public/landing/destinos/*.html leyendo de la BD). Página inmersiva
// (.dst, su propia nav/footer). Las secciones editoriales (territorio, galería,
// destacada) solo se renderizan si hay contenido; hero + grilla de experiencias
// (en vivo por estado) + cierre SIEMPRE → un estado sin contenido cae en un
// fallback válido sin romperse. Server component: el CSS y el JS (marca, nav,
// drawer, slideshow) se inyectan como en el HTML original.
import Script from "next/script";
import { DESTINO_CSS } from "@/lib/destinos/destino-css";
import { CONTACTO_DEFAULT, type DestinoContent } from "@/lib/destinos/types";

const G1 =
  '<g class="g1"><path d="M14.64,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64S0,96.44,0,104.52s6.56,14.64,14.64,14.64"/><path d="M102.08,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M91.72,114.57L4.29,27.44C-1.43,21.73-1.43,12.46,4.29,6.74c5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
const G2 =
  '<g class="g2"><path d="M218.65,2.3c-8.09,0-14.64,6.56-14.64,14.64s6.56,14.64,14.64,14.64,14.64-6.56,14.64-14.64-6.56-14.64-14.64-14.64"/><path d="M276.91,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/><path d="M189.47,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/></g>';
const G3 =
  '<g class="g3"><path d="M335.23,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M422.67,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M412.31,114.57l-87.43-87.13c-5.72-5.72-5.72-14.99,0-20.71,5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
const GW =
  '<g class="gw"><path d="M532.87,98.77c-4.27,4.6-9.41,6.89-15.42,6.89-5.69,0-10.45-1.75-14.27-5.25-3.83-3.5-6.73-8.56-8.7-15.18-1.97-6.62-2.95-14.68-2.95-24.2s.98-17.77,2.95-24.45c1.97-6.67,4.87-11.76,8.7-15.26,3.83-3.5,8.58-5.25,14.27-5.25s10.42,2.11,14.52,6.32c4.1,4.21,6.97,10.36,8.61,18.46l18.05-.98c-2.3-12.58-7.08-22.37-14.36-29.37-7.27-7-16.22-10.5-26.82-10.5-9.41,0-17.37,2.49-23.87,7.47-6.51,4.98-11.46,12-14.85,21.08-3.39,9.08-5.08,19.91-5.08,32.49s1.69,23.24,5.08,32.32c3.39,9.08,8.34,16.08,14.85,21,6.51,4.92,14.46,7.38,23.87,7.38,11.26,0,20.56-3.72,27.89-11.16,7.33-7.44,11.98-17.83,13.95-31.17l-17.88-.82c-1.42,8.86-4.27,15.59-8.53,20.18"/><path d="M636.87,72.84l14.54-52.34,14.54,52.34h-29.09ZM640.25,2.62l-34.13,116.49h17.88l8.43-30.35h37.93l8.43,30.35h17.88L662.57,2.62h-22.31Z"/><polygon points="784.88 77.66 766.51 2.62 743.54 2.62 743.54 119.11 760.11 119.11 760.11 29.17 778.32 105 791.45 105 809.66 29.17 809.66 119.11 826.23 119.11 826.23 2.62 803.26 2.62 784.88 77.66"/><polygon points="873.07 18.87 900.97 18.87 900.97 102.87 873.07 102.87 873.07 119.11 945.92 119.11 945.92 102.87 918.03 102.87 918.03 18.87 945.92 18.87 945.92 2.62 873.07 2.62 873.07 18.87"/><polygon points="1051.99 94.46 1013.77 2.62 992.77 2.62 992.77 119.11 1009.67 119.11 1009.67 27.28 1047.89 119.11 1068.89 119.11 1068.89 2.62 1051.99 2.62 1051.99 94.46"/><path d="M1146.48,72.84l14.54-52.34,14.54,52.34h-29.09ZM1149.87,2.62l-34.13,116.49h17.88l8.43-30.35h37.93l8.43,30.35h17.88l-34.13-116.49h-22.31Z"/><polygon points="1312.38 94.46 1274.15 2.62 1253.15 2.62 1253.15 119.11 1270.05 119.11 1270.05 27.28 1308.28 119.11 1329.28 119.11 1329.28 2.62 1312.38 2.62 1312.38 94.46"/><polygon points="1376.12 18.87 1410.25 18.87 1410.25 119.11 1427.31 119.11 1427.31 18.87 1461.44 18.87 1461.44 2.62 1376.12 2.62 1376.12 18.87"/><polygon points="1508.28 2.62 1508.28 119.11 1581.13 119.11 1581.13 102.87 1525.51 102.87 1525.51 68.58 1577.85 68.58 1577.85 52.83 1525.51 52.83 1525.51 18.87 1579.81 18.87 1579.81 2.62 1508.28 2.62"/></g>';

const BRAND_JS = `
const G1='${G1}';const G2='${G2}';const G3='${G3}';const GW='${GW}';
const MARK='<svg viewBox="0 0 437.31 121.74" role="img" aria-label="Caminante">'+G1+G2+G3+'</svg>';
const WORD='<svg viewBox="0 0 1581.13 121.74" role="img" aria-label="Caminante">'+G1+G2+G3+GW+'</svg>';
document.querySelectorAll('[data-mark]').forEach(function(el){el.innerHTML=MARK;});
document.querySelectorAll('[data-word]').forEach(function(el){el.innerHTML=WORD;});
(function(){
  var nav=document.getElementById('dnav');
  if(nav){var onScroll=function(){nav.classList.toggle('scrolled',window.scrollY>window.innerHeight*0.7);};onScroll();window.addEventListener('scroll',onScroll,{passive:true});}
  var burger=document.getElementById('dburger'),drawer=document.getElementById('ddrawer');
  if(burger&&drawer){
    function toggleDrawer(open){drawer.classList.toggle('open',open);burger.setAttribute('aria-expanded',open?'true':'false');document.body.style.overflow=open?'hidden':'';}
    burger.addEventListener('click',function(){toggleDrawer(!drawer.classList.contains('open'));});
    drawer.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){toggleDrawer(false);});});
  }
  var track=document.getElementById('ssTrack');
  if(track){
    var slides=[].slice.call(track.children),dotsWrap=document.getElementById('ssDots'),numEl=document.getElementById('ssNum'),i=0;
    slides.forEach(function(_,k){var d=document.createElement('button');d.className='ss-dot'+(k===0?' on':'');d.setAttribute('aria-label','Ir a la foto '+(k+1));d.addEventListener('click',function(){go(k);});dotsWrap.appendChild(d);});
    function go(n){i=(n+slides.length)%slides.length;track.style.transform='translateX('+(-i*100)+'%)';if(numEl)numEl.textContent=String(i+1).padStart(2,'0');[].slice.call(dotsWrap.children).forEach(function(d,k){d.classList.toggle('on',k===i);});}
    document.getElementById('ssPrev').addEventListener('click',function(){go(i-1);});
    document.getElementById('ssNext').addEventListener('click',function(){go(i+1);});
  }
})();
`;

export default function DestinoTemplate({
  estado,
  content,
}: {
  estado: string;
  content: DestinoContent | null;
}) {
  const c = content ?? {};
  const heroTitle = c.heroTitle || estado;
  const contact = { ...CONTACTO_DEFAULT, ...(c.contact ?? {}) };

  const hasTerr = Boolean((c.terrIntro && c.terrIntro.length) || (c.caras && c.caras.length));
  const hasGallery = Boolean(c.gallery && c.gallery.length);
  const hasFeatured = Boolean(c.featured);

  // Numeración de secciones (secnum) secuencial entre las que sí se renderizan.
  let n = 0;
  const num = () => String(++n).padStart(2, "0");
  const terrNum = hasTerr ? num() : "";
  const galleryNum = hasGallery ? num() : "";
  const featuredNum = hasFeatured ? num() : "";
  const expNum = num(); // la grilla de experiencias siempre va

  const feat = c.featured;

  return (
    <div className="dst">
      <style dangerouslySetInnerHTML={{ __html: DESTINO_CSS }} />

      {/* NAV */}
      <nav className="nav" id="dnav">
        <a href="/caminante" className="brand" aria-label="Caminante — inicio">
          <span className="logo-word" data-word />
          <span className="logo-mark" data-mark />
        </a>
        <div className="nav-links">
          <a href="/caminante">Inicio</a>
          <a href="/caminante#proximos">Calendario</a>
          <a href="/caminante#aprende">Aprende</a>
          <a href="/caminante#quees">Nosotros</a>
        </div>
        <div className="nav-cta">
          <a href="#reserva" className="btn btn-orange">Reservar</a>
          <button className="burger" id="dburger" aria-label="Abrir menú" aria-expanded="false">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className="drawer" id="ddrawer">
        <a href="/caminante"><span className="sl">//</span>Inicio</a>
        <a href="/caminante#proximos"><span className="sl">//</span>Calendario</a>
        <a href="/caminante#aprende"><span className="sl">//</span>Aprende</a>
        <a href="/caminante#quees"><span className="sl">//</span>Nosotros</a>
        <a href="#reserva" className="btn btn-orange">Reservar</a>
      </div>

      {/* HERO */}
      <header className="hero" id="top">
        {c.heroBgUrl ? <img className="bg" src={c.heroBgUrl} alt={`Paisaje de ${estado}`} /> : null}
        <div className="veil" />
        <div className="container">
          <div className="hero-top">
            <span className="eyebrow"><span className="sl">//</span> Destino · {estado}</span>
            {c.heroMeta ? <span className="meta-est">{c.heroMeta}</span> : null}
          </div>
          <h1 className="display">
            {heroTitle} {c.heroAccent ? <em className="ac">{c.heroAccent}</em> : null}
          </h1>
          {c.heroSub ? <p className="sub lead">{c.heroSub}</p> : null}
          <div className="actions">
            <a href="#experiencias" className="btn btn-glass btn-arrow">Ver experiencias</a>
          </div>
        </div>
      </header>

      {/* 01 · EL TERRITORIO + LAS 4 CARAS */}
      {hasTerr ? (
        <section className="section terr" id="territorio">
          <div className="container">
            <div className="shead-num">
              <div className="shead-main">
                <span className="eyebrow"><span className="sl">//</span> El territorio</span>
                <h2 className="display">
                  {c.terrTitle || `${estado},`} {c.terrAccent ? <em className="ac">{c.terrAccent}</em> : null}
                </h2>
              </div>
              <span className="secnum" style={{ color: "var(--olive)" }}>{terrNum}</span>
            </div>
            {(c.terrIntro?.length || c.terrPills?.length) ? (
              <div className="terr-intro">
                <div className="terr-copy">
                  {(c.terrIntro ?? []).map((p, i) => (
                    <p className="lead" key={i}>{p}</p>
                  ))}
                </div>
                {c.terrPills?.length ? (
                  <div className="pills">
                    {c.terrPills.map((p, i) => (
                      <div className="pill-l" key={i}>
                        <div className="v">{p.v}</div>
                        <div className="k">{p.k}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            {c.caras?.length ? (
              <>
                <div className="caras-head">
                  <span className="eyebrow"><span className="sl">//</span> Las cuatro caras del lugar</span>
                  {c.carasCap ? <p className="cap-l">{c.carasCap}</p> : null}
                </div>
                <div className="caras-grid">
                  {c.caras.map((cara, i) => (
                    <article className="cara" key={i}>
                      {cara.imageUrl ? <img src={cara.imageUrl} alt={cara.title} /> : null}
                      <span className="eb"><span className="sl">//</span> {cara.label}</span>
                      <h3>{cara.title}</h3>
                      <p>{cara.text}</p>
                    </article>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* 02 · GALERÍA */}
      {hasGallery ? (
        <section className="section gallery-sec" id="aprende">
          <div className="container">
            <div
              className="shead"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap", maxWidth: "none" }}
            >
              <div style={{ maxWidth: 680 }}>
                <span className="eyebrow"><span className="sl">//</span> Lo que vas a ver</span>
                <h2 className="display">
                  {c.galleryTitle || "De"} {c.galleryAccent ? <em className="ac">{c.galleryAccent}</em> : <em className="ac">cerca.</em>}
                </h2>
                {c.galleryCap ? <p className="cap">{c.galleryCap}</p> : null}
              </div>
              <span className="secnum" style={{ color: "var(--dune)" }}>{galleryNum}</span>
            </div>
            <div className="slideshow">
              <div className="ss-track" id="ssTrack">
                {(c.gallery ?? []).map((s, i) => (
                  <figure className="ss-slide" key={i}>
                    <img src={s.imageUrl} alt={s.caption || `${estado} ${i + 1}`} />
                    {s.caption ? <figcaption className="ss-cap">{s.caption}</figcaption> : null}
                  </figure>
                ))}
              </div>
              <button className="ss-btn ss-prev" id="ssPrev" aria-label="Anterior">‹</button>
              <button className="ss-btn ss-next" id="ssNext" aria-label="Siguiente">›</button>
              <div className="ss-foot">
                <span className="ss-count"><b id="ssNum">01</b> / {String((c.gallery ?? []).length).padStart(2, "0")}</span>
                <div className="ss-dots" id="ssDots" />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 03 · EXPERIENCIA DESTACADA */}
      {hasFeatured && feat ? (
        <section className="feat">
          <div className="container grid" style={{ maxWidth: "none", padding: 0 }}>
            <div className="photo">
              {feat.imageUrl ? <img src={feat.imageUrl} alt={feat.title} /> : null}
            </div>
            <div className="body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18 }}>
                <div>
                  <span className="eyebrow"><span className="sl">//</span> Experiencia destacada</span>
                  {feat.meta ? <span className="meta">{feat.meta}</span> : null}
                </div>
                <span className="secnum" style={{ color: "var(--olive)" }}>{featuredNum}</span>
              </div>
              <h3 className="display">
                {feat.title} {feat.accent ? <em className="ac">{feat.accent}</em> : null}
              </h3>
              <p>{feat.body}</p>
              {feat.pills?.length ? (
                <div className="datapills">
                  {feat.pills.map((p, i) => (
                    <div className="pill" key={i}>
                      <div className="k">{p.k}</div>
                      <div className="v">{p.v}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              <a href={`/caminante/experiencias/${feat.slug}`} className="btn btn-outline btn-arrow">
                Vivir esta experiencia
              </a>
            </div>
          </div>
        </section>
      ) : null}

      {/* 04 · PRÓXIMAS EXPERIENCIAS (grilla en vivo por estado) */}
      <section className="section next" id="experiencias">
        <div className="container">
          <div
            className="shead"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap", maxWidth: "none" }}
          >
            <div style={{ maxWidth: 680 }}>
              <span className="eyebrow"><span className="sl">//</span> Próximas experiencias</span>
              <h2 className="display">
                {c.expTitle || "Vivir"} {c.expAccent ? <em className="ac">{c.expAccent}</em> : <em className="ac">{estado}.</em>}
              </h2>
              {c.expCap ? <p className="cap">{c.expCap}</p> : null}
            </div>
            <span className="secnum" style={{ color: "var(--olive)" }}>{expNum}</span>
          </div>
          <div className="exp-grid" data-exp-grid={estado}>
            {/* La grilla se llena en vivo (exp-grid.js) con las experiencias de este
                estado; si aún no hay, queda esta tarjeta "Próximamente". */}
            <article className="exp slot">
              <div className="slotnote">
                <strong>Más experiencias en {estado}</strong>
                Estamos preparando nuevas travesías por este destino.<br /><br />Próximamente.
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* CIERRE / RESERVA */}
      <section className="section close" id="reserva">
        {c.closeBgUrl ? <img className="bg" src={c.closeBgUrl} alt={`Paisaje de ${estado}`} /> : null}
        <div className="veil" />
        <div className="container">
          <div className="glasscard">
            <span className="eyebrow" style={{ color: "#fff", justifyContent: "center" }}>
              <span className="sl">//</span> {c.closeEyebrow || `${estado} te espera`}
            </span>
            <h2 className="display">
              {c.closeTitle || "Nos vemos"} {c.closeAccent ? <em className="ac">{c.closeAccent}</em> : <em className="ac">allá.</em>}
            </h2>
            <div className="contact">
              <div className="crow"><span className="lbl">Email</span><span className="val">{contact.email}</span></div>
              <div className="crow"><span className="lbl">WhatsApp</span><span className="val">{contact.whatsapp}</span></div>
              <div className="crow"><span className="lbl">Instagram</span><span className="val">{contact.instagram}</span></div>
            </div>
            <div className="actions">
              <a href="#experiencias" className="btn btn-glass">Ver experiencias</a>
              <a href={contact.whatsappUrl} className="btn btn-orange btn-arrow">Reservar por WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="word" data-word aria-label="Caminante" />
          <div className="tagline">Caminante · Naturaleza en movimiento</div>
          <div className="sub">Una expansión de NUMAN al mundo natural</div>
          <p className="desc">
            Caminante lleva la educación encarnada de NUMAN a paisajes reales. Una parte de cada
            experiencia se destina a la conservación del lugar que la hace posible.
          </p>
          <div className="fbottom">
            <span>© 2026 Caminante</span>
            <span>uno@numanhub.com · @somos.caminante</span>
          </div>
        </div>
      </footer>

      {/* next/script (afterInteractive): el <script> inline moría con el
          hydration mismatch de React (#418) → hamburguesa móvil muerta y logo
          sin pintar. Script de Next ejecuta SIEMPRE tras la hidratación. */}
      <Script id="dst-brand-js" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: BRAND_JS }} />
      {/* Grilla de experiencias en vivo desde la BD (filtra por data-exp-grid) */}
      <script src="/landing/assets/exp-grid.js" defer />
    </div>
  );
}
