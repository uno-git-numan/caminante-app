// CSS del DECK imprimible (flyer) de una experiencia. Un slide = una página de
// tamaño fijo (16:9 horizontal / 9:16 vertical), como los flyers de referencia.
// Reusa los tokens de marca del diseño bespoke. Se imprime con @page del tamaño
// exacto + page-break por slide → sin cortes ni componentes perdidos.

import { DECK_FONTS } from "./deck-fonts";

export function deckCss(orient: "h" | "v"): string {
  const W = orient === "h" ? 1280 : 720;
  const H = orient === "h" ? 720 : 1280;
  return `
${DECK_FONTS}

:root{--lagoon:#1c6f6a;--dune:#c9b79c;--cream:#fbfbf7;--sand:#b6ada5;--salvia:#d6d8c7;--olive:#637154;--olive-d:#4f5d44;--forest:#20392b;--charcoal:#20211c;--orange:#ff5d36;--panel:#f1eee7;--ink-soft:rgba(32,33,28,.6);--line:rgba(32,33,28,.13);--line-w:rgba(255,255,255,.22);}
*{box-sizing:border-box;margin:0;padding:0;}
html,body{background:#e9e7e0;}
.deck{font-family:"Geist",system-ui,sans-serif;color:var(--charcoal);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;display:flex;flex-direction:column;align-items:center;gap:22px;padding:22px;}
.deck img{display:block;}

/* ---- página / slide ---- */
@page{size:${W}px ${H}px;margin:0;}
.slide{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:var(--cream);page-break-after:always;break-after:page;box-shadow:0 20px 50px -30px rgba(0,0,0,.5);}
.slide:last-child{page-break-after:auto;break-after:auto;}
@media print{.deck{gap:0;padding:0;}.slide{box-shadow:none;}}

/* ---- marca / pager / tipografía base ----
   El sello SIEMPRE va en sus colores verdaderos (olive/sand/orange);
   solo las letras CAMINANTE cambian: carbón en claro, blanco en foto. */
.s-word{height:${orient === "h" ? 20 : 17}px;display:block;}
.s-word svg{height:100%;width:auto;display:block;}
.s-word .g1{fill:var(--olive);}.s-word .g2{fill:var(--sand);}.s-word .g3{fill:var(--orange);}.s-word .gw{fill:var(--charcoal);}
.s-word.on-dark .gw{fill:#fff;}
.s-pager{font-family:"Geist Mono",monospace;font-size:12px;letter-spacing:.18em;color:var(--ink-soft);}
.s-pager.on-dark{color:rgba(255,255,255,.72);}
.s-eyebrow{font-size:12px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:var(--olive);display:inline-flex;align-items:center;gap:.6em;}
.s-eyebrow .sl{color:var(--orange);font-weight:700;}
.s-eyebrow.on-dark{color:rgba(255,255,255,.86);}
.s-title{font-weight:200;letter-spacing:-.02em;line-height:1.04;}
em.ac{font-style:italic;color:var(--orange);font-weight:300;}

/* ---- capa de foto a sangre + veil ---- */
.bleed .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.bleed .veil{position:absolute;inset:0;}
.veil-btm{background:linear-gradient(to top,rgba(10,22,22,.92) 0%,rgba(10,22,22,.30) 46%,rgba(10,22,22,.05) 72%);}
.veil-soft{background:linear-gradient(to top,rgba(10,20,20,.86),rgba(10,20,20,.30) 55%,rgba(10,20,20,.42));}
.veil-even{background:linear-gradient(to top,rgba(10,16,18,.72),rgba(10,16,18,.34) 55%,rgba(10,16,18,.5));}
.bleed .inner{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;}

/* ---- topbar (marca + pager/meta) ---- */
.s-top{position:absolute;top:44px;left:56px;right:56px;z-index:3;display:flex;align-items:center;justify-content:space-between;}
.s-meta{font-family:"Geist Mono",monospace;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.82);}

/* ======================= COVER / CLOSING ======================= */
.cover .cover-btm{margin-top:auto;padding:${orient === "h" ? "56px 56px 74px" : "48px 40px 78px"};display:flex;flex-direction:column;align-items:center;text-align:center;}
.cover .eyebrow-w{color:#fff;letter-spacing:.42em;font-size:13px;font-weight:600;text-transform:uppercase;display:block;margin-bottom:20px;padding-left:.42em;}
.cover .cover-title{color:#fff;font-weight:200;letter-spacing:-.025em;line-height:1.02;font-size:${orient === "h" ? 104 : 66}px;margin:0 auto ${orient === "h" ? 24 : 18}px;max-width:${orient === "h" ? "94%" : "96%"};}
.cover .cover-title em.ac{font-style:italic;color:var(--orange);font-weight:200;}
.cover .tag{color:rgba(255,255,255,.92);font-size:${orient === "h" ? 21 : 17}px;font-weight:300;line-height:1.45;max-width:${orient === "h" ? "70%" : "94%"};margin:0 auto;}
.pill{background:var(--orange);color:#fff;border-radius:999px;padding:8px 18px;font-size:12px;font-weight:600;letter-spacing:.04em;}

/* ---- marca discreta al pie de TODOS los slides (sello + colaboradores) ---- */
.brandfoot{position:absolute;left:0;right:0;bottom:${orient === "h" ? 16 : 14}px;z-index:6;display:flex;align-items:center;justify-content:center;gap:18px;}
.brandfoot .bf-mark{height:16px;display:block;}
.brandfoot .bf-mark svg{height:100%;width:auto;display:block;}
.brandfoot .bf-mark .g1{fill:var(--olive);}.brandfoot .bf-mark .g2{fill:var(--sand);}.brandfoot .bf-mark .g3{fill:var(--orange);}.brandfoot .bf-mark .gw{fill:var(--charcoal);}
.brandfoot.on-dark .bf-mark .gw{fill:#fff;}
/* Logos de colaborador: color natural sobre fondos claros; sobre foto se
   fuerzan a silueta blanca (un logo negro sería invisible). PNG transparente
   ya recortado por el form (recortarLogo). */
.brandfoot img{height:16px;width:auto;display:block;opacity:.85;}
.brandfoot.on-dark img{filter:brightness(0) invert(1);opacity:.9;}
.brandfoot.in-panel{position:static;justify-content:flex-start;margin-top:auto;padding-top:18px;gap:15px;}

.closing .close-btm{margin-top:auto;padding:56px 56px ${orient === "h" ? 56 : 60}px;display:flex;align-items:flex-end;justify-content:space-between;gap:30px;flex-wrap:wrap;}
.closing .c-l h2{color:#fff;font-size:${orient === "h" ? 58 : 46}px;margin-top:16px;}
.closing .btn-reserva{display:inline-flex;align-items:center;margin-top:22px;background:var(--orange);color:#fff;text-decoration:none;border-radius:999px;padding:${orient === "h" ? "14px 26px" : "12px 22px"};font-size:${orient === "h" ? 16 : 15}px;font-weight:600;letter-spacing:.02em;}
.closing .c-l .s-eyebrow{color:#fff;}
.closing .contact{display:grid;gap:12px;}
.closing .crow{display:flex;gap:14px;align-items:baseline;}
.closing .crow .k{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange);font-weight:700;min-width:96px;}
.closing .crow .v{font-size:17px;color:#fff;font-weight:300;}

/* ======================= SPLIT (texto + media) ======================= */
.s-split{display:flex;height:100%;}
.deck.v .s-split{flex-direction:column;}
.s-panel{background:var(--cream);position:relative;display:flex;flex-direction:column;padding:${orient === "h" ? "44px 56px" : "40px 48px"};}
.deck.h .s-panel{width:44%;flex:0 0 44%;}
.deck.v .s-panel{flex:1;}
.s-panel .panel-top{display:flex;align-items:center;justify-content:space-between;${orient === "h" ? "margin-bottom:auto;" : ""}}
.s-panel .panel-body{margin-top:${orient === "h" ? 0 : 26}px;${orient === "h" ? "margin-bottom:auto;" : ""}}
.s-media{position:relative;flex:1;overflow:hidden;background:var(--panel);}
.deck.v .s-media{flex:0 0 42%;}
.s-media > img{width:100%;height:100%;object-fit:cover;}
.s-mosaic{display:grid;width:100%;height:100%;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:4px;}
.s-mosaic .m{overflow:hidden;}.s-mosaic .m img{width:100%;height:100%;object-fit:cover;}
.s-mosaic .big{grid-row:1 / span 2;}

.s-split .s-eyebrow{margin-bottom:14px;}
.s-split h2{font-size:${orient === "h" ? 46 : 40}px;margin-bottom:${orient === "h" ? 30 : 22}px;}
.s-sub-eyebrow{color:var(--orange);font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;margin-bottom:16px;}
.s-points .pt{font-size:${orient === "h" ? 17 : 16}px;font-weight:500;line-height:1.4;padding:${orient === "h" ? "16px 0" : "13px 0"};border-top:1px solid var(--line);}
.s-points .pt:first-child{border-top:0;}
.s-para{font-size:16px;line-height:1.5;color:#36382f;margin-bottom:12px;font-weight:300;}
.s-allies{margin-top:4px;}
.s-ally{display:flex;align-items:baseline;gap:11px;padding:${orient === "h" ? "13px 0" : "11px 0"};border-top:1px solid var(--line);}
.s-ally:first-child{border-top:0;}
.s-ally .dot{width:8px;height:8px;border-radius:999px;background:var(--orange);flex:0 0 auto;transform:translateY(-2px);}
.s-ally .nm{font-weight:600;font-size:16px;}
.s-ally .ro{font-size:13.5px;color:var(--ink-soft);}
.s-lead{font-size:14px;color:var(--ink-soft);margin-top:16px;line-height:1.5;max-width:44ch;}

/* incluye / no incluye (dos columnas) */
.s-cols{display:grid;grid-template-columns:1fr 1fr;gap:14px 40px;margin-top:6px;}
.deck.v .s-cols{gap:10px 26px;}
.s-col-h{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;margin-bottom:8px;}
.yes-h{color:var(--orange);}.no-h{color:var(--sand);}
.inc{display:flex;gap:9px;font-size:13.5px;line-height:1.35;padding:6px 0;border-top:1px solid var(--line);}
.inc:first-of-type{border-top:0;}
.inc .mk{font-weight:700;flex:0 0 auto;}
.inc.yes .mk{color:var(--orange);}.inc.no{color:rgba(32,33,28,.55);}.inc.no .mk{color:var(--sand);}

/* mochila (checklist con casillas) */
.s-pack{display:grid;grid-template-columns:1fr 1fr;gap:0 30px;margin-top:8px;}
.deck.v .s-pack{gap:0 20px;}
.s-pk{display:flex;align-items:center;gap:11px;padding:9px 0;border-bottom:1px solid var(--line);font-size:14px;}
.s-pk .box{width:15px;height:15px;border-radius:4px;border:1.5px solid var(--sand);flex:0 0 auto;}
.s-cap{font-size:14px;color:var(--ink-soft);margin-bottom:16px;}

/* ======================= GLASS REAL (clon del fondo con blur; ver DECK_GLASS_SCRIPT) =======================
   backdrop-filter NO se rasteriza al imprimir a PDF; en su lugar el script clona
   el bg del slide DENTRO de cada .glassify con CSS filter:blur (que sí imprime),
   alineado pixel-perfect. El background rgba de la card queda como fallback
   sin-JS y se convierte en el tinte del clon. */
.glassify{position:relative;overflow:hidden;}
.glassify>*{position:relative;z-index:1;}
.glassify>.gclone{position:absolute;inset:0;z-index:0;border-radius:inherit;overflow:hidden;}
.glassify>.gclone img{position:absolute;max-width:none;object-fit:cover;display:block;}
.glassify>.gclone .gtint{position:absolute;inset:0;}

/* ======================= ITINERARIO (cajas ARRIBA a la derecha, letra grande) ======================= */
.itin .veil-even{background:linear-gradient(to bottom,rgba(10,16,18,.72),rgba(10,16,18,.36) 58%,rgba(10,16,18,.46));}
.itin .it-head{position:absolute;top:${orient === "h" ? 96 : 84}px;left:${orient === "h" ? 56 : 40}px;z-index:3;}
.itin .it-head h2{color:#fff;font-size:${orient === "h" ? 48 : 42}px;margin-top:12px;}
.itin .days{position:absolute;z-index:3;display:grid;align-content:start;gap:16px;${
    orient === "h"
      ? "top:96px;right:56px;grid-template-columns:repeat(2,378px);justify-content:end;"
      : "top:220px;left:40px;right:40px;grid-template-columns:1fr 1fr;"
  }}
.itin .days.d1{grid-template-columns:${orient === "h" ? "470px" : "1fr"};}
.day{background:rgba(16,22,19,.30);border:1px solid rgba(255,255,255,.28);border-radius:16px;padding:${orient === "h" ? "24px 24px 20px" : "22px 20px 18px"};box-shadow:inset 0 1px 0 rgba(255,255,255,.12);}
.day .dnum{font-weight:200;font-size:${orient === "h" ? 36 : 32}px;color:#fff;line-height:1;}
.day .dlab{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange);margin:10px 0 12px;font-weight:600;}
.day ul{list-style:none;}
.day li{font-size:${orient === "h" ? 14.5 : 14}px;line-height:1.42;color:rgba(251,251,247,.88);padding:6px 0;border-top:1px solid rgba(255,255,255,.14);}
.day li:first-child{border-top:0;}
.day li b{color:#fff;font-weight:600;}

/* ======================= INVERSIÓN (tarifa) ======================= */
.tariff-s .tf-in{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;justify-content:center;padding:${orient === "h" ? "0 56px" : "0 48px"};}
.tariff-s h2{color:#fff;font-size:${orient === "h" ? 46 : 40}px;margin:12px 0 26px;max-width:14ch;}
.tf-card{background:rgba(14,20,20,.34);border:1px solid rgba(255,255,255,.30);border-radius:18px;padding:28px 30px;box-shadow:inset 0 1px 0 rgba(255,255,255,.12);max-width:560px;}
.tf-card .tier{color:var(--orange);font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;}
.tf-row{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-top:14px;flex-wrap:wrap;}
.tf-price{color:#fff;font-weight:200;font-size:${orient === "h" ? 48 : 40}px;letter-spacing:-.02em;line-height:1;}
.tf-price .cur{font-size:16px;font-weight:400;color:rgba(255,255,255,.6);margin-left:6px;}
.tf-av .k{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.6);display:block;}
.tf-av .v{color:#fff;font-size:18px;font-weight:600;}
.tf-tiers{margin-top:16px;border-top:1px solid var(--line-w);padding-top:12px;display:grid;gap:8px;}
.tf-tier{display:flex;justify-content:space-between;font-size:14px;color:#fff;}
.tf-tier .tl{color:rgba(255,255,255,.82);}
.tariff-s .tf-lead{color:rgba(255,255,255,.82);font-size:14px;margin-top:20px;max-width:52ch;line-height:1.5;}

/* ======================= FAQ ======================= */
/* Centrado con FLEX, no con transform: translateY(-50%) se fragmenta mal al
   imprimir (Chrome pinta el desborde SIN el transform → texto fuera de la card). */
.faq-s{display:flex;align-items:center;}
.faq-s .faq-card{position:relative;z-index:3;margin-left:${orient === "h" ? 56 : 40}px;width:${orient === "h" ? 58 : 82}%;background:rgba(12,18,18,.42);border:1px solid rgba(255,255,255,.28);border-radius:22px;box-shadow:inset 0 1px 0 rgba(255,255,255,.12);padding:34px 34px;}
.faq-s .s-eyebrow{color:#fff;margin-bottom:18px;}
.qa{padding:14px 0;border-top:1px solid var(--line-w);}
.qa:first-of-type{border-top:0;padding-top:0;}
.qa .q{color:#fff;font-weight:600;font-size:15.5px;margin-bottom:5px;}
.qa .a{color:rgba(255,255,255,.82);font-size:13px;line-height:1.45;font-weight:300;}
`;
}

// Glass REAL para pantalla e impresión: por cada .glassify clona el bg de su
// slide adentro (offset negativo = alineado con el fondo) con filter:blur —
// CSS filter SÍ sobrevive al print-to-PDF (backdrop-filter no). El tinte toma
// el background actual de la card y la card queda transparente.
export const DECK_GLASS_SCRIPT = `
(function () {
  function apply() {
    document.querySelectorAll('.slide').forEach(function (slide) {
      var bg = slide.querySelector('img.bg');
      if (!bg) return;
      var s = slide.getBoundingClientRect();
      slide.querySelectorAll('.glassify').forEach(function (card) {
        if (card.querySelector('.gclone')) return;
        var r = card.getBoundingClientRect();
        var tint = getComputedStyle(card).backgroundColor;
        var wrap = document.createElement('div');
        wrap.className = 'gclone';
        var img = document.createElement('img');
        img.src = bg.currentSrc || bg.src;
        img.alt = '';
        img.style.left = (s.left - r.left) + 'px';
        img.style.top = (s.top - r.top) + 'px';
        img.style.width = s.width + 'px';
        img.style.height = s.height + 'px';
        img.style.objectPosition = getComputedStyle(bg).objectPosition;
        img.style.filter = 'blur(18px) brightness(.74) saturate(1.06)';
        var t = document.createElement('div');
        t.className = 'gtint';
        t.style.background = tint;
        wrap.appendChild(img);
        wrap.appendChild(t);
        card.prepend(wrap);
        card.style.background = 'transparent';
      });
    });
  }
  if (document.readyState === 'complete') apply();
  else window.addEventListener('load', apply);
})();
`;
