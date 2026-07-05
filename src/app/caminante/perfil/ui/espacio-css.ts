// CSS de "Mi espacio" (Claude Design, jul 2026) scopeado bajo .mesp — mismo
// patrón que admin-css.ts. Fuentes: las Geist ya versionadas en /landing.

export const ESPACIO_CSS = `
@font-face{font-family:"Geist";src:url("/landing/assets/fonts/Geist-VariableFont_wght.ttf") format("truetype-variations");font-weight:100 900;font-style:normal;font-display:swap;}
@font-face{font-family:"Geist";src:url("/landing/assets/fonts/Geist-Italic-VariableFont_wght.ttf") format("truetype-variations");font-weight:100 900;font-style:italic;font-display:swap;}
@font-face{font-family:"Geist Mono";src:url("/landing/assets/fonts/GeistMono-VariableFont_wght.ttf") format("truetype-variations");font-weight:100 900;font-style:normal;font-display:swap;}
.mesp{
  --cream:#fbfbf7;--charcoal:#20211c;--olive:#637154;--olive-d:#4f5d44;--forest:#20392b;
  --sand:#b6ada5;--salvia:#d6d8c7;--orange:#ff5d36;
  --panel:#f1eee7;--line:rgba(32,33,28,.13);--ink-soft:rgba(32,33,28,.6);
  --amber-bg:rgba(201,183,156,.35);--amber-tx:#8a6d1f;
  --r:22px;--eb:.22em;--shadow:0 14px 38px -24px rgba(32,33,28,.42);
  --mono:"Geist Mono",ui-monospace,monospace;
  font-family:"Geist",system-ui,sans-serif;background:var(--cream);color:var(--charcoal);
  -webkit-font-smoothing:antialiased;min-height:100vh;
}
.mesp *{box-sizing:border-box;margin:0;padding:0;}
.mesp button{font-family:inherit;cursor:pointer;}
.mesp a{color:inherit;text-decoration:none;}
.mesp img{display:block;}
.mesp .mono{font-family:var(--mono);}
.mesp .eyebrow{font-size:11px;font-weight:600;letter-spacing:var(--eb);text-transform:uppercase;display:inline-flex;align-items:center;gap:.5em;color:var(--olive);}
.mesp .eyebrow .sl{color:var(--orange);font-weight:700;}
.mesp .display{font-weight:200;letter-spacing:-.02em;line-height:1.05;}
.mesp em.ac{font-style:italic;color:var(--orange);font-weight:300;}

.mesp .wrap{max-width:860px;margin:0 auto;padding:0 20px 100px;}

/* ===== TOP BAR ===== */
.mesp .topbar{position:sticky;top:0;z-index:40;background:rgba(251,251,247,.86);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line);}
.mesp .topbar .in{max-width:860px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:13px 20px;}
.mesp .topbar .rt{display:flex;align-items:center;gap:18px;}
.mesp .sitelink{font-size:13px;font-weight:500;color:var(--ink-soft);transition:color .15s;}
.mesp .sitelink:hover{color:var(--charcoal);}
.mesp .logo{height:24px;}.mesp .logo svg{height:100%;width:auto;display:block;}
.mesp .logo .g1{fill:var(--olive);}.mesp .logo .g2{fill:var(--sand);}.mesp .logo .g3{fill:var(--orange);}
.mesp .out{font-size:13px;font-weight:500;color:var(--ink-soft);border:1px solid var(--line);border-radius:999px;padding:7px 15px;background:transparent;transition:all .18s;}
.mesp .out:hover{color:var(--charcoal);border-color:var(--sand);}

/* ===== HEADER ===== */
.mesp .hd{padding:46px 0 6px;}
.mesp .hd h1{font-size:clamp(38px,8vw,58px);margin-top:16px;}
.mesp .hd .po{font-size:17px;font-weight:300;color:var(--ink-soft);margin-top:10px;font-style:italic;}

/* ===== BUTTONS ===== */
.mesp .btn{display:inline-flex;align-items:center;justify-content:center;gap:.5em;min-height:44px;padding:0 20px;border-radius:999px;font-size:14px;font-weight:500;border:1px solid transparent;transition:background .18s,transform .1s,border-color .18s;white-space:nowrap;}
.mesp .btn:active{transform:translateY(1px);}
.mesp .btn-orange{background:var(--orange);color:#fff;}.mesp .btn-orange:hover{background:#e8431f;}
.mesp .btn-ghost{background:transparent;color:var(--olive);border-color:var(--line);}.mesp .btn-ghost:hover{border-color:var(--olive);}
.mesp .btn-sm{min-height:36px;padding:0 14px;font-size:13px;}

/* ===== AVISOS ===== */
.mesp .flash{margin-top:18px;border-radius:14px;padding:12px 16px;font-size:13.5px;font-weight:500;}
.mesp .flash.ok{background:rgba(99,113,84,.12);color:var(--olive-d);border:1px solid rgba(99,113,84,.25);}
.mesp .flash.err{background:rgba(255,93,54,.1);color:#b33517;border:1px solid rgba(255,93,54,.3);}

/* ===== SECTIONS ===== */
.mesp .sec{margin-top:52px;}
.mesp .sec > .eyebrow{margin-bottom:16px;display:inline-flex;}
.mesp .empty{font-size:14.5px;color:var(--ink-soft);font-weight:300;line-height:1.6;background:#fff;border:1px dashed var(--sand);border-radius:16px;padding:22px;}
.mesp .empty a{color:var(--orange);font-weight:600;}

/* ===== HERO TRIP CARDS ===== */
.mesp .trip{position:relative;border-radius:var(--r);overflow:hidden;box-shadow:0 24px 60px -30px rgba(32,33,28,.55);margin-bottom:22px;color:#fff;min-height:480px;display:flex;flex-direction:column;justify-content:flex-end;isolation:isolate;}
.mesp .trip .ph{position:absolute;inset:0;z-index:-2;background:var(--forest);}
.mesp .trip .ph img{width:100%;height:100%;object-fit:cover;}
.mesp .trip::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(to top,rgba(18,22,15,.88) 0%,rgba(18,22,15,.46) 42%,rgba(18,22,15,.06) 72%,rgba(18,22,15,.18) 100%);}
.mesp .trip .top{position:absolute;top:20px;right:20px;}
.mesp .chip-date{display:inline-flex;align-items:center;gap:.5em;font-family:var(--mono);font-size:12.5px;font-weight:500;color:#fff;padding:9px 16px;border-radius:999px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);white-space:nowrap;}
.mesp .trip .body{position:relative;padding:26px 26px 24px;display:flex;flex-direction:column;gap:0;}
.mesp .trip .eb{font-size:11px;font-weight:600;letter-spacing:var(--eb);text-transform:uppercase;color:rgba(255,255,255,.85);}
.mesp .trip .eb .sl{color:var(--orange);font-weight:700;}
.mesp .trip h3{font-size:clamp(30px,5.4vw,42px);font-weight:200;letter-spacing:-.02em;line-height:1.04;margin-top:10px;}
.mesp .trip .pax{font-size:14px;font-weight:400;color:rgba(255,255,255,.82);margin-top:8px;}
.mesp .trip .chips{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px;align-items:center;}
.mesp .chip{display:inline-flex;align-items:center;gap:.45em;font-size:12.5px;font-weight:600;padding:8px 15px;border-radius:999px;white-space:nowrap;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}
.mesp .c-ok{background:rgba(214,216,199,.24);color:#e8ebda;border:1px solid rgba(214,216,199,.34);}
.mesp .c-ok .tick{color:#c9e3a8;font-weight:700;}
.mesp .c-warn{background:rgba(228,196,132,.26);color:#f4dfae;border:1px solid rgba(228,196,132,.4);}
.mesp .cta-firma{display:inline-flex;align-items:center;gap:.5em;background:var(--orange);color:#fff;font-size:13.5px;font-weight:600;padding:11px 20px;border-radius:999px;transition:background .18s,transform .1s;box-shadow:0 10px 26px -10px rgba(255,93,54,.7);}
.mesp .cta-firma:hover{background:#e8431f;}
.mesp .cta-firma:active{transform:translateY(1px);}
.mesp .trip .next{font-size:14px;font-weight:300;font-style:italic;color:rgba(255,255,255,.78);margin-top:18px;max-width:52ch;line-height:1.55;}
.mesp .trip .foot{margin-top:16px;display:flex;}
.mesp .btn-glassy{display:inline-flex;align-items:center;gap:.5em;font-size:13px;font-weight:500;color:#fff;padding:10px 18px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:background .18s;}
.mesp .btn-glassy:hover{background:rgba(255,255,255,.26);}

/* ===== SALIDAS VIVIDAS ===== */
.mesp .past{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
@media(max-width:680px){.mesp .past{grid-template-columns:1fr 1fr;}}
@media(max-width:460px){.mesp .past{grid-template-columns:1fr;}}
.mesp .pcard{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:var(--shadow);display:flex;flex-direction:column;}
.mesp .pcard .pim{aspect-ratio:3/2;overflow:hidden;background:var(--salvia);}
.mesp .pcard .pim img{width:100%;height:100%;object-fit:cover;filter:saturate(.92);}
.mesp .pcard .pin{padding:14px 16px 16px;display:flex;flex-direction:column;gap:4px;flex:1;}
.mesp .pcard .nm{font-size:15px;font-weight:500;line-height:1.3;}
.mesp .pcard .mt{font-family:var(--mono);font-size:11.5px;color:var(--ink-soft);}
.mesp .pcard .linky{font-size:13px;font-weight:600;color:var(--orange);margin-top:auto;padding-top:10px;transition:opacity .15s;}
.mesp .pcard .linky:hover{opacity:.75;}
.mesp .pcard .done{font-size:12.5px;color:var(--olive);font-weight:600;margin-top:auto;padding-top:10px;}

/* ===== ACCORDION (expediente) ===== */
.mesp .acc{background:#fff;border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow);margin-top:14px;overflow:hidden;}
.mesp .acc-h{width:100%;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:19px 22px;background:transparent;border:0;text-align:left;}
.mesp .acc-h .l{display:flex;flex-direction:column;gap:3px;}
.mesp .acc-h .ti{font-size:16px;font-weight:500;}
.mesp .acc-h .su{font-size:12.5px;color:var(--ink-soft);}
.mesp .acc-h .chev{color:var(--sand);font-size:11px;transition:transform .25s ease;flex:0 0 auto;}
.mesp .acc.open .acc-h .chev{transform:rotate(180deg);}
.mesp .acc-b{max-height:0;opacity:0;overflow:hidden;transition:max-height .35s ease,opacity .28s ease;}
.mesp .acc.open .acc-b{max-height:1600px;opacity:1;}
.mesp .acc-in{padding:4px 22px 22px;}

/* datos limpios */
.mesp .dgrid{display:grid;grid-template-columns:1fr;gap:0;}
.mesp .drow{display:flex;justify-content:space-between;gap:16px;padding:11px 0;border-bottom:1px solid var(--line);font-size:14px;}
.mesp .drow:last-child{border-bottom:0;}
.mesp .drow .k{color:var(--ink-soft);}
.mesp .drow .v{font-weight:500;text-align:right;}
.mesp .edit-note{font-size:12.5px;color:var(--ink-soft);font-style:italic;margin-top:12px;line-height:1.55;}
.mesp .acc-act{display:flex;justify-content:flex-end;margin-top:14px;}

/* form inline */
.mesp .form{display:none;margin-top:14px;padding-top:16px;border-top:1px solid var(--line);}
.mesp .form.on{display:grid;gap:12px;}
.mesp .fg{display:flex;flex-direction:column;gap:5px;}
.mesp .fg label{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--olive);}
.mesp .fg input,.mesp .fg select,.mesp .fg textarea{font-family:inherit;font-size:14px;padding:11px 13px;border:1px solid var(--line);border-radius:11px;background:var(--cream);color:var(--charcoal);}
.mesp .fg input:focus,.mesp .fg select:focus,.mesp .fg textarea:focus{outline:none;border-color:var(--olive);box-shadow:0 0 0 3px rgba(99,113,84,.15);}
.mesp .fg textarea{resize:vertical;min-height:64px;}
.mesp .f2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
@media(max-width:520px){.mesp .f2{grid-template-columns:1fr;}}
.mesp .form .acts{display:flex;gap:10px;justify-content:flex-end;margin-top:4px;}
.mesp .check{display:flex;align-items:center;gap:9px;font-size:13.5px;color:var(--ink-soft);}
.mesp .check input{width:16px;height:16px;accent-color:var(--olive);}

/* acompañantes */
.mesp .comps{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
@media(max-width:520px){.mesp .comps{grid-template-columns:1fr;}}
.mesp .comp{border:1px solid var(--line);border-radius:14px;padding:15px 16px;background:var(--cream);}
.mesp .comp .cn{font-size:14.5px;font-weight:500;}
.mesp .comp .cm{font-size:12.5px;color:var(--ink-soft);margin-top:3px;}
.mesp .comp.add{border:1.5px dashed var(--sand);background:transparent;display:flex;align-items:center;justify-content:center;color:var(--olive);font-size:13.5px;font-weight:500;min-height:66px;cursor:pointer;transition:border-color .18s;width:100%;}
.mesp .comp.add:hover{border-color:var(--olive);}

/* firmas */
.mesp .sig{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 0;border-bottom:1px solid var(--line);font-size:14px;flex-wrap:wrap;}
.mesp .sig:last-child{border-bottom:0;}
.mesp .sig .sm{font-size:12.5px;color:var(--ink-soft);margin-top:2px;}
.mesp .sig .ok{color:var(--olive);font-weight:700;font-size:15px;}
.mesp .sig .ver{font-family:var(--mono);font-size:11.5px;color:var(--ink-soft);background:var(--panel);border-radius:6px;padding:3px 8px;}
.mesp .sig .rt{display:flex;align-items:center;gap:10px;}
`;
