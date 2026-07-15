// CSS del KIT DE COMUNICACIÓN. Reusa el sistema visual del deck (tokens de marca,
// fuentes Geist en base64, sello CAMINANTE en colores reales, glass) pero con
// LAYOUTS NUEVOS por tipo de lámina (cover, fact, foto, lista, incluye, qa, dia,
// precio, cupo, cita, perfil, cierre). Un `.slide` = una lámina, tamaño fijo:
// post 720×900 (→1080×1350) · story 720×1280 (→1080×1920). El export (SocialExport)
// serializa cada .slide dentro del wrapper `.kit …` a PNG.
import { DECK_FONTS } from "@/lib/experiences/deck-fonts";

export function kitCss(orient: "post" | "story"): string {
  const W = 720;
  const H = orient === "story" ? 1280 : 900;
  const story = orient === "story";
  // aire vertical: las stories tienen más alto → más padding y tipografías.
  const pad = story ? 64 : 48;
  return `
${DECK_FONTS}
:root{--lagoon:#1c6f6a;--dune:#c9b79c;--cream:#fbfbf7;--sand:#b6ada5;--salvia:#d6d8c7;--olive:#637154;--olive-d:#4f5d44;--forest:#20392b;--charcoal:#20211c;--orange:#ff5d36;--panel:#f1eee7;--ink-soft:rgba(32,33,28,.6);--line:rgba(32,33,28,.13);--line-w:rgba(255,255,255,.20);}
*{box-sizing:border-box;margin:0;padding:0;}
html,body{background:#e9e7e0;}
.kit{font-family:"Geist",system-ui,sans-serif;color:var(--charcoal);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;display:flex;flex-direction:column;align-items:center;gap:22px;padding:22px;}
.kit img{display:block;}
.slide{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:var(--cream);box-shadow:0 20px 50px -30px rgba(0,0,0,.5);}
em.ac{font-style:italic;color:var(--orange);font-weight:300;}

/* ---- capa foto a sangre + veil ---- */
.k-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;}
.k-veil{position:absolute;inset:0;z-index:1;}
.veil-btm{background:linear-gradient(to top,rgba(10,22,22,.92) 0%,rgba(10,22,22,.34) 46%,rgba(10,22,22,.06) 74%);}
.veil-even{background:linear-gradient(to bottom,rgba(10,16,18,.62),rgba(10,16,18,.30) 45%,rgba(10,16,18,.66));}
.veil-mid{background:rgba(10,18,18,.52);}
.k-in{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;padding:${pad}px;}

/* ---- topbar: sello + momento ---- */
.k-top{position:absolute;top:${story ? 44 : 34}px;left:${pad}px;right:${pad}px;z-index:4;display:flex;align-items:center;justify-content:space-between;}
.k-word{height:${story ? 20 : 18}px;display:block;}
.k-word svg{height:100%;width:auto;display:block;}
.k-word .g1{fill:var(--olive);}.k-word .g2{fill:var(--sand);}.k-word .g3{fill:var(--orange);}.k-word .gw{fill:var(--charcoal);}
.k-word.on-dark .gw{fill:#fff;}
.k-tag{font-family:"Geist Mono",monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-soft);}
.k-tag.on-dark{color:rgba(255,255,255,.72);}

/* ---- footer marca (sello + colaboradores) ---- */
.k-foot{position:absolute;left:0;right:0;bottom:${story ? 30 : 22}px;z-index:5;display:flex;align-items:center;justify-content:center;gap:16px;}
.k-foot .fm{height:15px;}.k-foot .fm svg{height:100%;width:auto;display:block;}
.k-foot .fm .g1{fill:var(--olive);}.k-foot .fm .g2{fill:var(--sand);}.k-foot .fm .g3{fill:var(--orange);}.k-foot .fm .gw{fill:var(--charcoal);}
.k-foot.on-dark .fm .gw{fill:#fff;}
.k-foot img{height:15px;width:auto;opacity:.82;}
.k-foot.on-dark img{filter:brightness(0) invert(1);opacity:.9;}

.k-eyebrow{font-size:12px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:var(--olive);display:inline-flex;align-items:center;gap:.6em;}
.k-eyebrow .sl{color:var(--orange);font-weight:700;}
.k-eyebrow.on-dark{color:rgba(255,255,255,.9);}
.k-title{font-weight:200;letter-spacing:-.02em;line-height:1.04;}

/* ============ COVER ============ */
.l-cover .k-in{justify-content:flex-end;text-align:center;align-items:center;padding-bottom:${story ? 150 : 120}px;}
.l-cover .k-eyebrow{color:#fff;letter-spacing:.4em;margin-bottom:18px;}
.l-cover h1{color:#fff;font-weight:200;letter-spacing:-.025em;line-height:1.02;font-size:${story ? 78 : 62}px;max-width:96%;}
.l-cover .tag{color:rgba(255,255,255,.9);font-size:${story ? 20 : 17}px;font-weight:300;line-height:1.45;max-width:90%;margin-top:${story ? 22 : 16}px;}

/* ============ FACT (dato científico grande) ============ */
.l-fact .k-in{justify-content:flex-end;padding-bottom:${story ? 130 : 104}px;}
.l-fact .n{color:#fff;font-weight:200;letter-spacing:-.03em;line-height:.92;font-size:${story ? 150 : 118}px;}
.l-fact .lbl{color:#fff;font-size:${story ? 26 : 22}px;font-weight:300;line-height:1.32;max-width:88%;margin-top:${story ? 20 : 14}px;}
.l-fact .src{color:var(--dune);font-family:"Geist Mono",monospace;font-size:12px;letter-spacing:.08em;margin-top:16px;}

/* ============ FOTO (línea corta sobre foto) ============ */
.l-foto .k-in{justify-content:flex-end;padding-bottom:${story ? 130 : 104}px;}
.l-foto .line{color:#fff;font-weight:200;letter-spacing:-.01em;line-height:1.14;font-size:${story ? 40 : 34}px;max-width:92%;}
.l-foto .sub{color:rgba(255,255,255,.86);font-size:16px;font-weight:300;margin-top:14px;max-width:80%;line-height:1.5;}

/* ============ LISTA (panel claro) ============ */
.l-lista{background:var(--cream);}
.l-lista .k-in{justify-content:flex-start;padding-top:${story ? 150 : 120}px;}
.l-lista h2{font-size:${story ? 48 : 40}px;margin:14px 0 ${story ? 30 : 22}px;}
.l-lista .it{font-size:${story ? 20 : 17}px;font-weight:500;line-height:1.4;padding:${story ? 18 : 14}px 0;border-top:1px solid var(--line);display:flex;gap:12px;}
.l-lista .it:first-child{border-top:0;}
.l-lista .it .mk{color:var(--orange);font-weight:700;flex:0 0 auto;}

/* ============ INCLUYE / NO ============ */
.l-incluye{background:var(--cream);}
.l-incluye .k-in{justify-content:flex-start;padding-top:${story ? 150 : 120}px;}
.l-incluye h2{font-size:${story ? 46 : 38}px;margin:14px 0 ${story ? 28 : 20}px;}
.l-incluye .cols{display:grid;grid-template-columns:${story ? "1fr" : "1fr 1fr"};gap:${story ? "22px 0" : "10px 36px"};}
.l-incluye .ch{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;margin-bottom:10px;}
.l-incluye .yes-h{color:var(--orange);}.l-incluye .no-h{color:var(--sand);}
.l-incluye .inc{display:flex;gap:9px;font-size:${story ? 15.5 : 14}px;line-height:1.34;padding:7px 0;border-top:1px solid var(--line);}
.l-incluye .inc:first-of-type{border-top:0;}
.l-incluye .inc .mk{font-weight:700;flex:0 0 auto;}
.l-incluye .inc.yes .mk{color:var(--orange);}.l-incluye .inc.no{color:rgba(32,33,28,.6);}.l-incluye .inc.no .mk{color:var(--sand);}

/* ============ QA (faq glass sobre foto) ============ */
.l-qa .k-in{justify-content:center;}
.l-qa .card{background:rgba(12,18,18,.42);border:1px solid var(--line-w);border-radius:22px;box-shadow:inset 0 1px 0 rgba(255,255,255,.12);padding:${story ? 36 : 30}px;}
.l-qa .k-eyebrow{color:#fff;margin-bottom:18px;}
.l-qa .qa{padding:14px 0;border-top:1px solid var(--line-w);}
.l-qa .qa:first-of-type{border-top:0;padding-top:0;}
.l-qa .qa .q{color:#fff;font-weight:600;font-size:${story ? 18 : 16}px;margin-bottom:6px;}
.l-qa .qa .a{color:rgba(255,255,255,.84);font-size:${story ? 14.5 : 13.5}px;line-height:1.46;font-weight:300;}

/* ============ DÍA (itinerario, card glass sobre foto) ============ */
.l-dia .k-in{justify-content:flex-end;padding-bottom:${story ? 120 : 96}px;}
.l-dia .card{background:rgba(16,22,19,.34);border:1px solid rgba(255,255,255,.28);border-radius:18px;box-shadow:inset 0 1px 0 rgba(255,255,255,.12);padding:${story ? "28px 28px 24px" : "24px 24px 20px"};}
.l-dia .dnum{color:#fff;font-weight:200;font-size:${story ? 44 : 36}px;line-height:1;}
.l-dia .dlab{color:var(--orange);font-size:13px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;margin:${story ? 12 : 10}px 0 ${story ? 14 : 12}px;}
.l-dia ul{list-style:none;}
.l-dia li{color:rgba(251,251,247,.9);font-size:${story ? 17 : 15}px;line-height:1.44;padding:${story ? 8 : 6}px 0;border-top:1px solid rgba(255,255,255,.15);}
.l-dia li:first-child{border-top:0;}
.l-dia li b{color:#fff;font-weight:600;}

/* ============ PRECIO (tarjeta glass narrativa) ============ */
.l-precio .k-in{justify-content:center;}
.l-precio h2{color:#fff;font-size:${story ? 40 : 34}px;margin:12px 0 24px;max-width:14ch;}
.l-precio .card{background:rgba(14,20,20,.36);border:1px solid rgba(255,255,255,.30);border-radius:18px;box-shadow:inset 0 1px 0 rgba(255,255,255,.12);padding:${story ? "30px 30px" : "26px 28px"};}
.l-precio .tier{color:var(--orange);font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;}
.l-precio .price{color:#fff;font-weight:200;font-size:${story ? 60 : 48}px;letter-spacing:-.02em;line-height:1;margin-top:12px;}
.l-precio .price .cur{font-size:16px;font-weight:400;color:rgba(255,255,255,.62);margin-left:8px;}
.l-precio .lead{color:rgba(255,255,255,.84);font-size:${story ? 16 : 14.5}px;line-height:1.5;margin-top:16px;}
.l-precio .tiers{margin-top:16px;border-top:1px solid var(--line-w);padding-top:12px;display:grid;gap:8px;}
.l-precio .tier-r{display:flex;justify-content:space-between;color:#fff;font-size:15px;}
.l-precio .tier-r .tl{color:rgba(255,255,255,.82);}

/* ============ CUPO (story de disponibilidad) ============ */
.l-cupo .k-in{justify-content:center;text-align:center;align-items:center;}
.l-cupo .k-eyebrow{color:var(--orange);letter-spacing:.3em;margin-bottom:20px;}
.l-cupo .big{color:#fff;font-weight:200;letter-spacing:-.03em;line-height:.9;font-size:${story ? 220 : 180}px;}
.l-cupo .lugares{color:#fff;font-size:${story ? 30 : 26}px;font-weight:300;letter-spacing:.02em;margin-top:6px;}
.l-cupo .exp{color:#fff;font-size:${story ? 26 : 22}px;font-weight:300;margin-top:${story ? 34 : 26}px;max-width:88%;}
.l-cupo .fecha{color:var(--dune);font-family:"Geist Mono",monospace;font-size:15px;letter-spacing:.1em;margin-top:12px;}

/* ============ CITA (testimonio) ============ */
.l-cita .k-in{justify-content:center;}
.l-cita .stars{color:var(--orange);font-size:24px;letter-spacing:4px;margin-bottom:22px;}
.l-cita .quote{color:#fff;font-weight:200;letter-spacing:-.01em;line-height:1.22;font-size:${story ? 40 : 32}px;}
.l-cita .who{color:var(--dune);font-family:"Geist Mono",monospace;font-size:14px;letter-spacing:.14em;text-transform:uppercase;margin-top:${story ? 28 : 22}px;}

/* ============ PERFIL (guía/aliado) ============ */
.l-perfil{background:var(--cream);}
.l-perfil .k-in{justify-content:flex-end;padding:0;}
.l-perfil .ph{position:absolute;inset:0;bottom:${story ? "42%" : "46%"};z-index:1;}
.l-perfil .ph img{width:100%;height:100%;object-fit:cover;}
.l-perfil .body{position:relative;z-index:2;margin-top:auto;background:var(--cream);padding:${pad}px;}
.l-perfil .role{color:var(--orange);font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;}
.l-perfil .name{font-size:${story ? 44 : 36}px;font-weight:300;margin:10px 0 6px;letter-spacing:-.01em;}
.l-perfil .cred{color:var(--olive);font-size:14px;font-style:italic;margin-bottom:14px;}
.l-perfil .bio{color:#36382f;font-size:${story ? 17 : 15}px;line-height:1.5;font-weight:300;}

/* ============ CIERRE (CTA) ============ */
.l-cierre .k-in{justify-content:flex-end;padding-bottom:${story ? 150 : 120}px;}
.l-cierre .k-eyebrow{color:#fff;margin-bottom:14px;}
.l-cierre h2{color:#fff;font-weight:200;font-size:${story ? 64 : 50}px;line-height:1.02;letter-spacing:-.02em;}
.l-cierre .cta{display:inline-flex;align-self:flex-start;margin-top:26px;background:var(--orange);color:#fff;border-radius:999px;padding:${story ? "14px 26px" : "12px 22px"};font-size:${story ? 17 : 15}px;font-weight:600;letter-spacing:.02em;}
`;
}
