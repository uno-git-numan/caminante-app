// CSS de la página de destino, extraído VERBATIM del diseño estático
// (public/landing/destinos/*.html). Si el diseño cambia, RE-EXTRAER de ahí, no
// editar a mano. Se inyecta con <style> en DestinoTemplate (página inmersiva).
export const DESTINO_CSS = `
/* ============================== FONTS ============================== */
@font-face{
  font-family:"Geist";
  src:url("/landing/assets/fonts/Geist-VariableFont_wght.ttf") format("truetype-variations");
  font-weight:100 900; font-style:normal; font-display:swap;
}
@font-face{
  font-family:"Geist";
  src:url("/landing/assets/fonts/Geist-Italic-VariableFont_wght.ttf") format("truetype-variations");
  font-weight:100 900; font-style:italic; font-display:swap;
}
@font-face{
  font-family:"Geist Mono";
  src:url("/landing/assets/fonts/GeistMono-VariableFont_wght.ttf") format("truetype-variations");
  font-weight:100 900; font-style:normal; font-display:swap;
}

/* ============================== TOKENS ============================= */
:root{
  --lagoon:#1c6f6a;
  --lagoon-deep:#0f3f40;
  --dune:#c9b79c;
  --cream:#fbfbf7;
  --sand:#b6ada5;
  --salvia:#d6d8c7;
  --olive:#637154;
  --olive-d:#4f5d44;
  --forest:#20392b;
  --charcoal:#20211c;
  --orange:#ff5d36;

  --ink-soft:rgba(32,33,28,.62);
  --line:rgba(32,33,28,.12);
  --line-w:rgba(255,255,255,.22);

  --maxw:1240px;
  --eb:.24em;
  --r:18px;
  --shadow:0 24px 60px -28px rgba(32,33,28,.5);
}

.dst *{box-sizing:border-box;margin:0;padding:0;}
.dst{
  font-family:"Geist",system-ui,sans-serif;
  color:var(--charcoal);
  background:var(--cream);
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
  overflow-x:hidden;
}
.dst img{display:block;max-width:100%;}
.dst a{color:inherit;text-decoration:none;}

/* ============================== TYPE HELPERS ====================== */
.dst .eyebrow{
  font-size:12px;font-weight:600;letter-spacing:var(--eb);text-transform:uppercase;
  display:inline-flex;align-items:center;gap:.6em;line-height:1;
}
.dst .eyebrow .sl{color:var(--orange);font-weight:700;}
.dst .display{font-weight:200;letter-spacing:-.02em;line-height:1.04;}
.dst em.ac{font-style:italic;color:var(--orange);font-weight:300;}
.dst .lead{font-weight:300;line-height:1.55;}
.dst .dia{color:var(--orange);font-size:.7em;transform:translateY(-1px);}

.dst .container{max-width:var(--maxw);margin:0 auto;padding:0 22px;width:100%;}

/* ============================== BUTTONS =========================== */
.dst .btn{
  display:inline-flex;align-items:center;justify-content:center;gap:.6em;
  min-height:50px;padding:0 26px;border-radius:999px;
  font-size:15px;font-weight:500;letter-spacing:.01em;cursor:pointer;
  border:1px solid transparent;transition:transform .18s ease,background .2s ease,border-color .2s ease,color .2s ease;
  white-space:nowrap;
}
.dst .btn:active{transform:translateY(1px);}
.dst .btn-green{background:var(--olive);color:#fff;}
.dst .btn-green:hover{background:var(--olive-d);}
.dst .btn-orange{background:var(--orange);color:#fff;}
.dst .btn-orange:hover{background:#e8431f;}
.dst .btn-glass{
  background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.42);
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
}
.dst .btn-glass:hover{background:rgba(255,255,255,.22);}
.dst .btn-outline{background:transparent;color:var(--olive);border-color:var(--olive);}
.dst .btn-outline:hover{background:var(--olive);color:#fff;}
.dst .btn-arrow::after{content:"→";font-size:1.05em;}

/* ============================== NAV =============================== */
.dst .nav{
  position:fixed;top:0;left:0;right:0;z-index:100;
  display:flex;align-items:center;justify-content:space-between;
  padding:16px 22px;transition:background .3s ease,box-shadow .3s ease,padding .3s ease;
}
.dst .nav.scrolled{
  background:rgba(251,251,247,.82);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  box-shadow:0 1px 0 var(--line);padding:11px 22px;
}
.dst .nav .brand{display:flex;align-items:center;}
.dst .nav .logo-word{display:none;height:26px;}
.dst .nav .logo-mark{display:block;height:34px;}
.dst .nav .logo-word svg,.dst .nav .logo-mark svg{height:100%;width:auto;display:block;}
.dst .nav .brand .g1,.dst .nav .brand .g2,.dst .nav .brand .g3,.dst .nav .brand .gw{fill:#fff;transition:fill .3s ease;}
.dst .nav.scrolled .brand .g1{fill:var(--olive);}
.dst .nav.scrolled .brand .g2{fill:var(--sand);}
.dst .nav.scrolled .brand .g3{fill:var(--orange);}
.dst .nav.scrolled .brand .gw{fill:var(--charcoal);}
@media(min-width:620px){
  .dst .nav .logo-word{display:block;}
  .dst .nav .logo-mark{display:none;}
}

.dst .nav-links{display:none;align-items:center;gap:34px;}
.dst .nav-links a{font-size:15px;font-weight:500;color:#fff;opacity:.92;transition:color .3s,opacity .2s;}
.dst .nav-links a:hover{opacity:1;}
.dst .nav.scrolled .nav-links a{color:var(--charcoal);}
.dst .nav-cta{display:flex;align-items:center;gap:14px;}
.dst .nav-cta .btn{min-height:42px;padding:0 20px;font-size:14px;}

.dst .burger{
  display:flex;flex-direction:column;gap:5px;background:none;border:0;cursor:pointer;padding:8px;
  width:44px;height:44px;align-items:center;justify-content:center;
}
.dst .burger span{display:block;width:24px;height:2px;background:#fff;transition:background .3s,transform .3s,opacity .3s;}
.dst .nav.scrolled .burger span{background:var(--charcoal);}

.dst .drawer{
  position:fixed;inset:0;z-index:99;background:var(--forest);
  display:flex;flex-direction:column;justify-content:center;gap:6px;padding:32px;
  transform:translateY(-100%);transition:transform .4s cubic-bezier(.4,0,.2,1);
}
.dst .drawer.open{transform:translateY(0);}
.dst .drawer a{color:#fff;font-size:30px;font-weight:200;letter-spacing:-.01em;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.12);}
.dst .drawer a .sl{color:var(--orange);margin-right:.4em;font-size:.6em;vertical-align:middle;}
.dst .drawer .btn{margin-top:24px;align-self:flex-start;}

@media(min-width:920px){
  .dst .nav-links{display:flex;}
  .dst .burger{display:none;}
  .dst .nav{padding:20px 40px;}
  .dst .nav.scrolled{padding:13px 40px;}
}

/* ============================== HERO ============================== */
.dst .hero{position:relative;min-height:100svh;display:flex;align-items:flex-end;color:#fff;overflow:hidden;background:var(--forest);}
.dst .hero .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 42%;}
.dst .hero .veil{position:absolute;inset:0;background:
  linear-gradient(to top,rgba(10,24,24,.86) 0%,rgba(10,24,24,.34) 42%,rgba(10,24,24,.18) 72%,rgba(10,24,24,.42) 100%);}
.dst .hero .container{position:relative;z-index:2;padding-bottom:64px;padding-top:120px;}
.dst .hero .eyebrow{color:#fff;}
.dst .hero .meta-est{color:rgba(255,255,255,.72);font-size:12px;font-weight:600;letter-spacing:var(--eb);}
.dst .hero-top{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:auto;}
.dst .hero h1{font-size:clamp(40px,9vw,86px);max-width:14ch;margin:22px 0 0;}
.dst .hero .sub{font-size:clamp(16px,2.2vw,21px);max-width:60ch;margin-top:24px;color:rgba(255,255,255,.9);}
.dst .hero .actions{display:flex;flex-wrap:wrap;gap:14px;margin-top:34px;}

.dst .section{padding:88px 0;}
@media(min-width:768px){.dst .section{padding:128px 0;}}

.dst .shead{max-width:760px;}
.dst .shead h2{font-size:clamp(30px,5vw,56px);margin-top:18px;}
.dst .shead .cap{margin-top:18px;font-size:17px;color:var(--ink-soft);max-width:54ch;}

/* ============================== CARAS (dark) ====================== */
.dst .caras-grid{display:grid;gap:16px;margin-top:48px;}
.dst .cara{
  position:relative;border-radius:var(--r);overflow:hidden;min-height:300px;
  display:flex;flex-direction:column;justify-content:flex-end;padding:26px;color:#fff;isolation:isolate;
  background:var(--olive-d);
}
.dst .cara img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;transition:transform .6s ease;}
.dst .cara::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(to top,rgba(8,20,16,.9),rgba(8,20,16,.15) 70%);}
.dst .cara:hover img{transform:scale(1.05);}
.dst .cara h3{font-size:23px;font-weight:300;margin-bottom:8px;}
.dst .cara p{font-size:15px;line-height:1.45;color:rgba(255,255,255,.82);}
@media(min-width:620px){.dst .caras-grid{grid-template-columns:1fr 1fr;}}
@media(min-width:1040px){.dst .caras-grid{grid-template-columns:repeat(4,1fr);}.dst .cara{min-height:420px;}}

/* ============================== DESTACADA ========================= */
.dst .feat{background:var(--salvia);color:var(--charcoal);overflow:hidden;}
.dst .feat .grid{display:grid;gap:0;align-items:stretch;}
.dst .feat .photo{position:relative;min-height:340px;background:var(--olive-d);}
.dst .feat .photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.dst .feat .body{padding:56px 22px;}
.dst .feat .meta{font-size:12px;font-weight:600;letter-spacing:var(--eb);color:rgba(32,33,28,.55);margin-left:14px;}
.dst .feat h3{font-size:clamp(28px,4.6vw,46px);font-weight:200;margin:18px 0 22px;}
.dst .feat p{font-size:17px;line-height:1.6;color:#33352d;max-width:50ch;}
.dst .feat .eyebrow{color:var(--charcoal);}
.dst .datapills{display:flex;flex-wrap:wrap;gap:12px;margin:30px 0 32px;}
.dst .pill{
  background:#fff;border:1px solid var(--line);border-radius:14px;
  padding:14px 18px;min-width:120px;
}
.dst .pill .k{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-soft);}
.dst .pill .v{font-size:18px;font-weight:500;margin-top:5px;color:var(--charcoal);}
@media(min-width:860px){
  .dst .feat .grid{grid-template-columns:1fr 1fr;}
  .dst .feat .body{padding:96px 64px;display:flex;flex-direction:column;justify-content:center;}
}

/* ============================== PRÓXIMOS ========================== */
.dst .next{background:var(--cream);}
.dst .exp-grid{display:grid;gap:24px;margin-top:48px;}
.dst .exp{
  background:#fff;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;
  display:flex;flex-direction:column;box-shadow:0 10px 30px -22px rgba(32,33,28,.4);
  transition:transform .25s ease,box-shadow .25s ease;
}
.dst .exp:hover{transform:translateY(-4px);box-shadow:0 26px 50px -30px rgba(32,33,28,.5);}
.dst .exp .ph{position:relative;aspect-ratio:3/2;overflow:hidden;}
.dst .exp .ph img{width:100%;height:100%;object-fit:cover;}
.dst .exp .ph .loc{position:absolute;left:14px;bottom:14px;color:#fff;font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;text-shadow:0 1px 8px rgba(0,0,0,.6);}
.dst .exp .in{padding:24px;display:flex;flex-direction:column;flex:1;}
.dst .exp h3{font-size:24px;font-weight:300;letter-spacing:-.01em;}
.dst .faces{display:flex;flex-wrap:wrap;gap:7px;margin:16px 0;}
.dst .face{font-size:11px;letter-spacing:.06em;color:var(--olive);border:1px solid var(--line);border-radius:999px;padding:5px 11px;display:inline-flex;align-items:center;gap:5px;}
.dst .exp .hook{font-size:15px;color:var(--ink-soft);line-height:1.5;margin-bottom:22px;flex:1;}
.dst .exp .btn{align-self:flex-start;}
.dst .exp.slot{border:1.5px dashed var(--sand);background:var(--salvia);align-items:center;justify-content:center;text-align:center;min-height:360px;padding:30px;}
.dst .exp.slot .ph{aspect-ratio:auto;width:100%;}
.dst .slotnote{color:var(--olive-d);font-size:14px;line-height:1.5;}
.dst .slotnote strong{display:block;font-size:18px;font-weight:500;margin-bottom:8px;color:var(--charcoal);}
@media(min-width:680px){.dst .exp-grid{grid-template-columns:1fr 1fr;}}
@media(min-width:1040px){.dst .exp-grid{grid-template-columns:repeat(3,1fr);}}

/* ============================== GALERÍA ========================== */
.dst .gallery-sec{background:var(--forest);color:#fff;}
.dst .gallery-sec .shead .cap{color:rgba(255,255,255,.72);}
.dst .slideshow{position:relative;margin-top:48px;border-radius:var(--r);overflow:hidden;box-shadow:var(--shadow);}
.dst .ss-track{display:flex;transition:transform .6s cubic-bezier(.4,0,.2,1);}
.dst .ss-slide{position:relative;flex:0 0 100%;aspect-ratio:16/9;overflow:hidden;}
.dst .ss-slide img{width:100%;height:100%;object-fit:cover;display:block;}
.dst .ss-slide::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(8,20,16,.66),rgba(8,20,16,0) 46%);}
.dst .ss-cap{position:absolute;left:24px;bottom:22px;z-index:2;color:#fff;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;text-shadow:0 1px 10px rgba(0,0,0,.6);}
.dst .ss-btn{position:absolute;top:50%;transform:translateY(-50%);z-index:3;width:52px;height:52px;border-radius:999px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;font-size:26px;line-height:0;padding-bottom:3px;background:rgba(255,255,255,.14);border:1px solid var(--line-w);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:background .2s ease,transform .2s ease;}
.dst .ss-btn:hover{background:rgba(255,255,255,.28);}
.dst .ss-prev{left:16px;}
.dst .ss-next{right:16px;}
.dst .ss-foot{display:flex;justify-content:space-between;align-items:center;margin-top:20px;}
.dst .ss-count{font-family:"Geist Mono",ui-monospace,monospace;font-size:13px;letter-spacing:.12em;color:rgba(255,255,255,.66);}
.dst .ss-count b{color:#fff;font-weight:500;}
.dst .ss-dots{display:flex;gap:9px;}
.dst .ss-dot{width:8px;height:8px;border-radius:999px;background:rgba(255,255,255,.32);border:0;padding:0;cursor:pointer;transition:background .2s ease,transform .2s ease;}
.dst .ss-dot.on{background:var(--orange);transform:scale(1.25);}
@media(min-width:760px){.dst .ss-slide{aspect-ratio:2.2/1;}.dst .ss-cap{left:32px;bottom:30px;font-size:14px;}.dst .ss-btn{width:58px;height:58px;}}

/* ===== Section numbers (Geist Mono) ===== */
.dst .secnum{font-family:"Geist Mono",ui-monospace,monospace;font-weight:500;font-size:13px;letter-spacing:.14em;line-height:1;flex:0 0 auto;align-self:flex-start;white-space:nowrap;}
.dst .shead-num{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;}
.dst .shead-main{max-width:760px;}
.dst .shead-main h2{font-size:clamp(30px,5vw,56px);margin-top:16px;}

/* ===== 01 El territorio ===== */
.dst .terr{background:var(--cream);}
.dst .terr-intro{display:grid;gap:40px;margin-top:30px;}
.dst .terr-copy .lead{font-size:clamp(18px,2.2vw,22px);font-weight:300;line-height:1.55;color:#33352d;}
.dst .terr-copy .lead + .lead{margin-top:16px;}
.dst .terr-copy .lead em{font-style:italic;color:var(--olive);}
.dst .terr .pills{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.dst .pill-l{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px 22px;box-shadow:0 10px 30px -26px rgba(32,33,28,.5);}
.dst .pill-l .v{font-size:clamp(24px,3vw,34px);font-weight:200;letter-spacing:-.01em;line-height:1;}
.dst .pill-l .k{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);margin-top:10px;font-weight:600;}
.dst .caras-head{margin-top:76px;}
.dst .caras-head .cap-l{margin-top:14px;font-size:17px;color:var(--ink-soft);max-width:54ch;}
.dst .terr .caras-grid{margin-top:28px;}
.dst .cara .eb{font-size:12px;font-weight:600;letter-spacing:var(--eb);text-transform:uppercase;color:#fff;margin-bottom:auto;display:inline-flex;gap:.5em;}
.dst .cara .eb .sl{color:var(--orange);font-weight:700;}
@media(min-width:860px){.dst .terr-intro{grid-template-columns:1.05fr .95fr;gap:64px;align-items:start;}}

/* ============================== CIERRE ============================ */
.dst .close{position:relative;color:#fff;overflow:hidden;background:var(--forest);}
.dst .close .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 50%;}
.dst .close .veil{position:absolute;inset:0;background:linear-gradient(to top,rgba(8,22,22,.82),rgba(8,22,22,.28) 60%,rgba(8,22,22,.5));}
.dst .close .container{position:relative;z-index:2;display:flex;justify-content:center;}
.dst .glasscard{
  background:rgba(255,255,255,.1);border:1px solid var(--line-w);border-radius:24px;
  backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  padding:44px 30px;max-width:640px;width:100%;text-align:center;
}
.dst .glasscard h2{font-size:clamp(32px,5.6vw,58px);margin:16px 0 26px;}
.dst .contact{display:flex;flex-direction:column;gap:12px;margin-bottom:30px;}
.dst .crow{display:flex;flex-direction:column;gap:3px;}
.dst .crow .lbl{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--dune);font-weight:600;}
.dst .crow .val{font-size:17px;font-weight:300;}
.dst .glasscard .actions{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;}
@media(min-width:560px){
  .dst .contact{flex-direction:row;justify-content:center;gap:34px;flex-wrap:wrap;}
  .dst .glasscard{padding:56px 48px;}
}

/* ============================== FOOTER ============================ */
.dst .footer{background:var(--charcoal);color:#fff;padding:64px 0 40px;}
.dst .footer .word{height:30px;margin-bottom:28px;}
.dst .footer .word svg{height:100%;width:auto;}
.dst .footer .word .g1{fill:var(--olive);}.dst .footer .word .g2{fill:var(--sand);}.dst .footer .word .gw{fill:#fff;}
.dst .footer .word .g3{fill:var(--orange);}
.dst .footer .tagline{font-size:20px;font-weight:300;margin-bottom:8px;}
.dst .footer .sub{font-size:14px;color:rgba(255,255,255,.6);letter-spacing:.04em;text-transform:uppercase;margin-bottom:24px;}
.dst .footer .desc{font-size:15px;line-height:1.6;color:rgba(255,255,255,.7);max-width:64ch;}
.dst .footer .fbottom{margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,.12);font-size:13px;color:rgba(255,255,255,.5);display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;}

@media (prefers-reduced-motion:reduce){.dst *{scroll-behavior:auto;transition:none!important;}}
`;
