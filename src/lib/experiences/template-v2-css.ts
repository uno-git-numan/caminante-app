// CSS del diseño bespoke Caminante (ensenada/hongos), extraído VERBATIM del
// <style> de public/landing/experiencias/recoleccion-de-hongos.html.
// Es la fuente de verdad del diseño v2. No editar a mano: si el diseño cambia,
// re-extraer del HTML. La plantilla React (ExperienceTemplateV2) lo inyecta.
export const TEMPLATE_V2_CSS = String.raw`
/* ============================== FONTS ============================== */
@font-face{font-family:"Geist";src:url("/landing/assets/fonts/Geist-VariableFont_wght.ttf") format("truetype-variations");font-weight:100 900;font-style:normal;font-display:swap;}
@font-face{font-family:"Geist";src:url("/landing/assets/fonts/Geist-Italic-VariableFont_wght.ttf") format("truetype-variations");font-weight:100 900;font-style:italic;font-display:swap;}
@font-face{font-family:"Geist Mono";src:url("/landing/assets/fonts/GeistMono-VariableFont_wght.ttf") format("truetype-variations");font-weight:100 900;font-style:normal;font-display:swap;}

/* ============================== TOKENS ============================= */
:root{
  --lagoon:#1c6f6a;--lagoon-deep:#0f3f40;--dune:#c9b79c;--cream:#fbfbf7;--sand:#b6ada5;
  --salvia:#d6d8c7;--olive:#637154;--olive-d:#4f5d44;--forest:#20392b;--charcoal:#20211c;--orange:#ff5d36;
  --panel:#f1eee7;
  --ink-soft:rgba(32,33,28,.62);--line:rgba(32,33,28,.12);--line-w:rgba(255,255,255,.22);
  --maxw:1240px;--eb:.24em;--r:18px;--shadow:0 24px 60px -28px rgba(32,33,28,.5);
}
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:"Geist",system-ui,sans-serif;color:var(--charcoal);background:var(--cream);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overflow-x:hidden;}
img{display:block;max-width:100%;}
a{color:inherit;text-decoration:none;}

/* ============================== TYPE ============================== */
.eyebrow{font-size:12px;font-weight:600;letter-spacing:var(--eb);text-transform:uppercase;display:inline-flex;align-items:center;gap:.6em;line-height:1;}
.eyebrow .sl{color:var(--orange);font-weight:700;}
.display{font-weight:200;letter-spacing:-.02em;line-height:1.04;}
em.ac{font-style:italic;color:var(--orange);font-weight:300;}
.lead{font-weight:300;line-height:1.55;}
.container{max-width:var(--maxw);margin:0 auto;padding:0 22px;width:100%;}

/* ============================== BUTTONS =========================== */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.6em;min-height:50px;padding:0 26px;border-radius:999px;font-size:15px;font-weight:500;letter-spacing:.01em;cursor:pointer;border:1px solid transparent;transition:transform .18s ease,background .2s ease,border-color .2s ease,color .2s ease;white-space:nowrap;}
.btn:active{transform:translateY(1px);}
.btn-green{background:var(--olive);color:#fff;}
.btn-green:hover{background:var(--olive-d);}
.btn-orange{background:var(--orange);color:#fff;}
.btn-orange:hover{background:#e8431f;}
.btn-glass{background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.42);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);}
.btn-glass:hover{background:rgba(255,255,255,.22);}
.btn-outline{background:transparent;color:var(--olive);border-color:var(--olive);}
.btn-outline:hover{background:var(--olive);color:#fff;}
.btn-outline-d{background:transparent;color:#fff;border-color:var(--line-w);}
.btn-outline-d:hover{background:rgba(255,255,255,.12);}
.btn-arrow::after{content:"→";font-size:1.05em;}

/* ============================== NAV =============================== */
.nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:16px 22px;transition:background .3s ease,box-shadow .3s ease,padding .3s ease;}
.nav.scrolled{background:rgba(251,251,247,.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 1px 0 var(--line);padding:11px 22px;}
.nav .brand{display:flex;align-items:center;}
.nav .logo-word{display:none;height:26px;}
.nav .logo-mark{display:block;height:34px;}
.nav .logo-word svg,.nav .logo-mark svg{height:100%;width:auto;display:block;}
.nav .brand .g1,.nav .brand .g2,.nav .brand .g3,.nav .brand .gw{fill:#fff;transition:fill .3s ease;}
.nav.scrolled .brand .g1{fill:var(--olive);}
.nav.scrolled .brand .g2{fill:var(--sand);}
.nav.scrolled .brand .g3{fill:var(--orange);}
.nav.scrolled .brand .gw{fill:var(--charcoal);}
@media(min-width:620px){.nav .logo-word{display:block;}.nav .logo-mark{display:none;}}
.nav-links{display:none;align-items:center;gap:34px;}
.nav-links a{font-size:15px;font-weight:500;color:#fff;opacity:.92;transition:color .3s,opacity .2s;}
.nav-links a:hover{opacity:1;}
.nav.scrolled .nav-links a{color:var(--charcoal);}
.nav-cta{display:flex;align-items:center;gap:14px;}
.nav-cta .btn{min-height:42px;padding:0 20px;font-size:14px;}
.burger{display:flex;flex-direction:column;gap:5px;background:none;border:0;cursor:pointer;padding:8px;width:44px;height:44px;align-items:center;justify-content:center;}
.burger span{display:block;width:24px;height:2px;background:#fff;transition:background .3s,transform .3s,opacity .3s;}
.nav.scrolled .burger span{background:var(--charcoal);}
.drawer{position:fixed;inset:0;z-index:99;background:var(--forest);display:flex;flex-direction:column;justify-content:center;gap:6px;padding:32px;transform:translateY(-100%);transition:transform .4s cubic-bezier(.4,0,.2,1);}
.drawer.open{transform:translateY(0);}
.drawer a{color:#fff;font-size:30px;font-weight:200;letter-spacing:-.01em;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.12);}
.drawer a .sl{color:var(--orange);margin-right:.4em;font-size:.6em;vertical-align:middle;}
.drawer .btn{margin-top:24px;align-self:flex-start;}
@media(min-width:920px){.nav-links{display:flex;}.burger{display:none;}.nav{padding:20px 40px;}.nav.scrolled{padding:13px 40px;}}

/* ============================== HERO ============================== */
.hero{position:relative;min-height:100svh;display:flex;align-items:flex-end;color:#fff;overflow:hidden;}
.hero .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 46%;}
.hero .veil{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,24,24,.86) 0%,rgba(10,24,24,.32) 44%,rgba(10,24,24,.16) 72%,rgba(10,24,24,.42) 100%);}
.hero .container{position:relative;z-index:2;padding-bottom:64px;padding-top:120px;}
.hero .eyebrow{color:#fff;}
.hero-top{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:auto;}
.hero .meta-est{color:rgba(255,255,255,.78);font-size:12px;font-weight:600;letter-spacing:var(--eb);}
.hero h1{font-size:clamp(40px,9vw,84px);max-width:15ch;margin:22px 0 0;}
.hero .sub{font-size:clamp(16px,2.2vw,21px);max-width:46ch;margin-top:24px;color:rgba(255,255,255,.9);}
.hero .actions{display:flex;flex-wrap:wrap;gap:14px;margin-top:34px;}

/* section rhythm */
.section{padding:60px 0;}
@media(min-width:768px){.section{padding:84px 0;}}
.shead-num{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;}
.shead-main{max-width:760px;}
.shead-main .eyebrow{margin-bottom:0;}
.shead-main h2{font-size:clamp(30px,5vw,54px);margin-top:16px;}
.shead-main .cap{margin-top:18px;font-size:17px;color:var(--ink-soft);max-width:54ch;line-height:1.55;}
.secnum{font-family:"Geist Mono",ui-monospace,monospace;font-weight:500;font-size:13px;letter-spacing:.14em;line-height:1;flex:0 0 auto;align-self:flex-start;white-space:nowrap;color:var(--olive);}

/* ============================== EXPERIENCIA ====================== */
.xp{background:var(--cream);}
.xp .grid{display:grid;gap:40px;align-items:center;}
.xp h2{font-size:clamp(32px,5.4vw,56px);margin:16px 0 30px;}
.xp .points{display:flex;flex-direction:column;}
.xp .pt{font-size:clamp(18px,2.3vw,21px);font-weight:500;line-height:1.4;padding:22px 0;border-top:1px solid var(--line);}
.xp .pt:first-child{border-top:0;padding-top:0;}
.mosaic{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:200px 200px;gap:10px;}
.mosaic .m{position:relative;overflow:hidden;border-radius:14px;}
.mosaic .m img{width:100%;height:100%;object-fit:cover;}
.mosaic .big{grid-row:1 / span 2;}
@media(min-width:860px){.xp .grid{grid-template-columns:.85fr 1.15fr;gap:64px;}.mosaic{grid-template-rows:230px 230px;}}

/* ============================== MEDITACIONES (dark photo) ======== */
.medi{position:relative;color:#fff;overflow:hidden;min-height:78vh;display:flex;align-items:flex-end;}
.medi .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 42%;}
.medi .veil{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,22,20,.86),rgba(10,22,20,.22) 56%,rgba(10,22,20,.36));}
.medi .container{position:relative;z-index:2;padding-top:90px;padding-bottom:80px;}
.medi h2{font-size:clamp(32px,5.6vw,62px);margin-top:14px;max-width:16ch;}
.medi p{font-size:clamp(17px,2.2vw,22px);max-width:52ch;margin-top:24px;color:rgba(255,255,255,.9);line-height:1.5;}
.medi .quote{margin-top:28px;font-style:italic;font-weight:300;font-size:clamp(18px,2.4vw,22px);color:var(--orange);}

/* ============================== ALIADOS ========================== */
.allies-sec{background:var(--panel);}
.allies-sec .grid{display:grid;gap:40px;align-items:center;}
.allies-sec h2{font-size:clamp(30px,5vw,52px);margin:16px 0 26px;}
.ally{display:flex;align-items:baseline;gap:14px;padding:18px 0;border-top:1px solid var(--line);}
.ally:last-child{border-bottom:1px solid var(--line);}
.ally .dot{width:9px;height:9px;border-radius:999px;background:var(--orange);flex:0 0 auto;transform:translateY(-2px);}
.ally .nm{font-weight:600;font-size:clamp(18px,2.3vw,21px);letter-spacing:-.01em;}
.ally .ro{font-size:16px;color:var(--ink-soft);}
.allies-sec .photo{position:relative;border-radius:var(--r);overflow:hidden;box-shadow:var(--shadow);aspect-ratio:4/5;}
.allies-sec .photo img{width:100%;height:100%;object-fit:cover;}
@media(min-width:860px){.allies-sec .grid{grid-template-columns:1.1fr .9fr;gap:64px;}}

/* ============================== ITINERARIO (dark) ================ */
.itin{position:relative;color:#fff;overflow:hidden;}
.itin .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 36%;}
.itin .veil{position:absolute;inset:0;background:rgba(12,18,20,.66);}
.itin .container{position:relative;z-index:2;}
.itin .shead-main h2,.itin .shead-main .eyebrow{color:#fff;}
.itin .secnum{color:rgba(255,255,255,.6);}
.days{display:grid;gap:16px;margin-top:48px;grid-template-columns:1fr;}
.glass{background:rgba(18,22,18,.40);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);border:1px solid var(--line-w);border-radius:18px;}
.day{padding:24px 22px;}
.day .dnum{font-weight:200;font-size:38px;line-height:1;color:#fff;}
.day .dlab{font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange);margin-top:6px;font-weight:600;}
.day ul{margin-top:14px;list-style:none;}
.day li{font-size:14.5px;line-height:1.4;color:rgba(251,251,247,.85);padding:6px 0;border-top:1px solid rgba(255,255,255,.14);}
.day li:first-child{border-top:0;}
.day li b{font-weight:600;color:#fff;}
@media(min-width:600px){.days{grid-template-columns:1fr 1fr;}}
@media(min-width:1040px){.days{grid-template-columns:repeat(4,1fr);}}

/* ============================== INVERSIÓN / INCLUYE ============== */
.invest{background:var(--cream);}
.invest .grid{display:grid;gap:40px;align-items:start;}
.invest h2{font-size:clamp(30px,5vw,52px);margin:16px 0 22px;}
.invest .lead{font-size:17px;color:#36382f;max-width:50ch;}
.tariff{background:var(--forest);color:#fff;border-radius:var(--r);padding:34px;box-shadow:var(--shadow);}
.tariff .tier{font-size:13px;letter-spacing:.18em;text-transform:uppercase;font-weight:600;color:var(--orange);}
.tariff .price{font-weight:200;font-size:clamp(40px,7vw,56px);letter-spacing:-.02em;margin:12px 0 0;}
.tariff .cur{font-size:18px;font-weight:400;color:rgba(251,251,247,.6);}
.tariff .avail{margin-top:18px;border-top:1px solid var(--line-w);padding-top:16px;display:flex;justify-content:space-between;align-items:center;}
.tariff .avail .k{font-size:12px;letter-spacing:.06em;color:rgba(251,251,247,.6);text-transform:uppercase;}
.tariff .avail .v{font-size:18px;font-weight:500;}
@media(min-width:860px){.invest .grid{grid-template-columns:1fr 1fr;gap:64px;}}

/* incluye / no incluye */
.incl{background:var(--panel);}
.incl .grid{display:grid;gap:18px 56px;grid-template-columns:1fr;}
.incl h2{font-size:clamp(30px,5vw,50px);margin:16px 0 30px;}
.incl .col-h{font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;margin-bottom:10px;}
.incl .yes-h{color:var(--orange);}
.incl .no-h{color:var(--sand);}
.inc-item{display:flex;gap:11px;align-items:flex-start;padding:9px 0;font-size:16px;line-height:1.38;border-top:1px solid var(--line);}
.inc-item:first-of-type{border-top:0;}
.inc-item .mk{flex:0 0 auto;font-weight:700;line-height:1.3;}
.yes .mk{color:var(--orange);}
.no{color:rgba(32,33,28,.55);}
.no .mk{color:var(--sand);}
@media(min-width:760px){.incl .grid{grid-template-columns:1fr 1fr;}}

/* ============================== FAQ (photo) ===================== */
.faq{position:relative;color:#fff;overflow:hidden;}
.faq .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:70% center;}
.faq .veil{position:absolute;inset:0;background:linear-gradient(to right,rgba(10,22,22,.9) 0%,rgba(10,22,22,.55) 55%,rgba(10,22,22,.25) 100%);}
.faq .container{position:relative;z-index:2;}
.faq .glasscard{background:rgba(255,255,255,.1);border:1px solid var(--line-w);border-radius:24px;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);padding:34px 26px;max-width:640px;}
.faq .eyebrow{color:#fff;margin-bottom:22px;}
.qa{padding:18px 0;border-top:1px solid var(--line-w);}
.qa:first-of-type{border-top:0;padding-top:0;}
.qa .q{font-weight:600;font-size:17px;color:#fff;margin-bottom:6px;}
.qa .a{font-size:15px;line-height:1.5;color:rgba(255,255,255,.82);font-weight:300;}
@media(min-width:768px){.faq .glasscard{padding:46px 44px;}}

/* ============================== MOCHILA ========================= */
.pack-sec{background:var(--cream);}
.pack-sec .grid{display:grid;gap:40px;align-items:center;}
.pack-sec h2{font-size:clamp(30px,5vw,52px);margin:16px 0 8px;}
.pack-sec .cap{font-size:17px;color:var(--ink-soft);margin-bottom:28px;}
.pack{display:grid;grid-template-columns:1fr 1fr;gap:0 30px;}
.pk{display:flex;align-items:center;gap:13px;padding:12px 0;border-bottom:1px solid var(--line);font-size:16px;}
.pk .box{width:17px;height:17px;border-radius:5px;border:1.5px solid var(--sand);flex:0 0 auto;}
.pack-sec .photo{position:relative;border-radius:var(--r);overflow:hidden;box-shadow:var(--shadow);aspect-ratio:4/5;}
.pack-sec .photo img{width:100%;height:100%;object-fit:cover;}
@media(min-width:860px){.pack-sec .grid{grid-template-columns:1.1fr .9fr;gap:64px;}}

/* ============================== FECHAS / RESERVA ================ */
.fechas{background:var(--forest);color:#fff;}
.fechas .shead-main h2,.fechas .shead-main .eyebrow{color:#fff;}
.fechas .shead-main .cap{color:rgba(255,255,255,.75);}
.fechas .secnum{color:rgba(255,255,255,.6);}
.date-grid{display:grid;gap:20px;margin:48px 0 36px;grid-template-columns:1fr;}
.date-card{background:rgba(255,255,255,.07);border:1px solid var(--line-w);border-radius:var(--r);padding:30px 28px;display:flex;flex-direction:column;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);}
.date-card .salida{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange);font-weight:600;}
.date-card .fecha{font-size:clamp(26px,3.6vw,34px);font-weight:200;letter-spacing:-.01em;margin:12px 0 18px;}
.date-card .meta-row{display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid var(--line-w);padding-top:16px;margin-top:auto;}
.date-card .meta-row .k{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.6);}
.date-card .cupo{font-size:17px;font-weight:500;}
.date-card .cupo .lugares{color:var(--dune);font-size:14px;font-weight:400;}
.fechas .price-line{font-size:18px;color:rgba(255,255,255,.85);margin-bottom:28px;}
.fechas .price-line b{color:#fff;font-weight:600;}
.fechas .actions{display:flex;flex-wrap:wrap;gap:14px;}
@media(min-width:720px){.date-grid{grid-template-columns:1fr 1fr;}}

/* ============================== CIERRE ========================== */
.close{position:relative;color:#fff;overflow:hidden;}
.close .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;}
.close .veil{position:absolute;inset:0;background:linear-gradient(to top,rgba(8,22,22,.82),rgba(8,22,22,.28) 60%,rgba(8,22,22,.5));}
.close .container{position:relative;z-index:2;display:flex;justify-content:center;}
.glasscard-c{background:rgba(255,255,255,.1);border:1px solid var(--line-w);border-radius:24px;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);padding:44px 30px;max-width:640px;width:100%;text-align:center;}
.glasscard-c .eyebrow{color:#fff;justify-content:center;}
.glasscard-c h2{font-size:clamp(32px,5.6vw,58px);margin:16px 0 26px;}
.contact{display:flex;flex-direction:column;gap:12px;margin-bottom:30px;}
.crow{display:flex;flex-direction:column;gap:3px;}
.crow .lbl{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--dune);font-weight:600;}
.crow .val{font-size:17px;font-weight:300;}
.glasscard-c .actions{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;}
@media(min-width:560px){.contact{flex-direction:row;justify-content:center;gap:34px;flex-wrap:wrap;}.glasscard-c{padding:56px 48px;}}

/* ============================== FOOTER ========================== */
.footer{background:var(--charcoal);color:#fff;padding:64px 0 40px;}
.footer .word{height:30px;margin-bottom:28px;}
.footer .word svg{height:100%;width:auto;}
.footer .word .g1{fill:var(--olive);}
.footer .word .g2{fill:var(--sand);}
.footer .word .gw{fill:#fff;}
.footer .word .g3{fill:var(--orange);}
.footer .tagline{font-size:20px;font-weight:300;margin-bottom:8px;}
.footer .sub{font-size:14px;color:rgba(255,255,255,.6);letter-spacing:.04em;text-transform:uppercase;margin-bottom:24px;}
.footer .desc{font-size:15px;line-height:1.6;color:rgba(255,255,255,.7);max-width:64ch;}
.footer .fbottom{margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,.12);font-size:13px;color:rgba(255,255,255,.5);display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;}

@media (prefers-reduced-motion:reduce){*{scroll-behavior:auto;transition:none!important;}}
`;
