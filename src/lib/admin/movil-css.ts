// CSS de la app de admin en móvil — extraído VERBATIM de
// design/admin-movil/adm-app.css (entregable de Claude Design).
//
// ⚠️ NO editar a mano. Si el diseño cambia, Claude Design re-entrega el archivo
// completo y se vuelve a extraer de ahí. Los parches viven en una capa aparte.
//
// Únicas desviaciones respecto al archivo fuente, ambas de integración:
//   1. Las rutas de @font-face apuntan a /landing/assets/fonts/ (donde vive Geist aquí).
//   2. Las reglas de la demo que pintaban un "teléfono" flotante en pantallas
//      anchas (@media(min-width:700px)) se omiten: aquí la app OCUPA la pantalla.

export const MOVIL_CSS = String.raw`:root{--cream:#fbfbf7;--charcoal:#20211c;--olive:#637154;--olive-d:#4f5d44;--orange:#ff5d36;--forest:#20392b;--sand:#b6ada5;--dune:#c9b79c;--salvia:#d6d8c7;--panel:#f1eee7;--bg:#eceae3;--line:rgba(32,33,28,.13);--ink-soft:rgba(32,33,28,.6);--mono:"Geist Mono",ui-monospace,monospace;--shadow:0 12px 34px -22px rgba(32,33,28,.42);}
@font-face{font-family:"Geist";src:url("/landing/assets/fonts/Geist-VariableFont_wght.ttf") format("truetype-variations");font-weight:100 900;font-style:normal;font-display:swap;}
@font-face{font-family:"Geist";src:url("/landing/assets/fonts/Geist-Italic-VariableFont_wght.ttf") format("truetype-variations");font-weight:100 900;font-style:italic;font-display:swap;}
@font-face{font-family:"Geist Mono";src:url("/landing/assets/fonts/GeistMono-VariableFont_wght.ttf") format("truetype-variations");font-weight:100 900;font-style:normal;font-display:swap;}
*{box-sizing:border-box;margin:0;padding:0;}
html,body{height:100%;}
body{font-family:"Geist",system-ui,sans-serif;color:var(--charcoal);background:var(--bg);-webkit-font-smoothing:antialiased;}
button{font-family:inherit;cursor:pointer;color:inherit;background:none;border:none;}
a{color:var(--olive-d);}a:hover{color:var(--orange);}
.adm-app{position:relative;width:100%;height:100%;max-width:430px;margin:0 auto;background:var(--cream);overflow:hidden;display:flex;flex-direction:column;}
.adm-scroll{flex:1;overflow-y:auto;overscroll-behavior:contain;padding-bottom:110px;position:relative;}
.adm-scroll.nopad{padding-bottom:24px;}
.adm-screen{animation:admin .22s ease-out;}
@keyframes admin{from{opacity:0;transform:translateX(14px);}to{opacity:1;transform:none;}}
.adm-status{display:flex;align-items:center;justify-content:space-between;padding:14px 26px 4px;font-family:var(--mono);font-size:12.5px;font-weight:500;flex:0 0 auto;}
.adm-head{position:sticky;top:0;z-index:30;background:rgba(251,251,247,.86);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);padding:10px 18px 12px;border-bottom:1px solid var(--line);display:flex;align-items:flex-end;justify-content:space-between;gap:12px;}
.adm-head h1{font-size:26px;font-weight:250;letter-spacing:-.02em;line-height:1.05;}
.adm-head .adm-eyebrow{margin-bottom:5px;}
.adm-nav{position:sticky;top:0;z-index:30;background:rgba(251,251,247,.86);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);padding:8px 12px 10px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:6px;}
.adm-nav .bk{min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;color:var(--olive);font-size:24px;font-weight:300;border-radius:999px;}
.adm-nav .tt{flex:1;min-width:0;}
.adm-nav .tt b{display:block;font-size:16.5px;font-weight:600;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.adm-nav .tt small{font-size:11px;color:var(--ink-soft);}
.adm-eyebrow{font-family:var(--mono);font-size:11px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;display:inline-flex;align-items:center;gap:.5em;line-height:1.4;color:var(--olive);}
.adm-eyebrow .sl{color:var(--orange);font-weight:700;}
.adm-display em{font-style:italic;color:var(--orange);font-weight:300;}
.adm-mono{font-family:var(--mono);font-variant-numeric:tabular-nums;letter-spacing:0;}
.adm-mut{color:var(--ink-soft);}
.adm-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5em;min-height:44px;min-width:44px;padding:0 18px;border-radius:999px;font-size:14px;font-weight:500;border:1px solid transparent;transition:background .18s,transform .1s,opacity .18s;white-space:nowrap;-webkit-tap-highlight-color:transparent;text-decoration:none;}
.adm-btn:active{transform:translateY(1px);}
.adm-btn:disabled{opacity:.45;cursor:not-allowed;}
.adm-btn-orange{background:var(--orange);color:#fff;}.adm-btn-orange:active{background:#e8431f;}
.adm-btn-ghost{color:var(--olive);border-color:var(--line);}
.adm-btn-glass{background:rgba(255,255,255,.6);color:var(--olive-d);border-color:rgba(99,113,84,.28);}
.adm-btn-danger{color:var(--orange);border-color:rgba(255,93,54,.35);}
.adm-btn-forest{background:var(--forest);color:#fff;}
.adm-btn-block{width:100%;}
.adm-btn-sm{min-height:44px;padding:0 14px;font-size:13px;}
.adm-tabbar{position:absolute;left:0;right:0;bottom:0;z-index:40;display:flex;align-items:stretch;background:rgba(251,251,247,.82);backdrop-filter:blur(18px) saturate(1.4);-webkit-backdrop-filter:blur(18px) saturate(1.4);border-top:1px solid var(--line);padding:6px 8px calc(10px + env(safe-area-inset-bottom,10px));}
.adm-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:50px;border-radius:14px;color:var(--ink-soft);position:relative;-webkit-tap-highlight-color:transparent;}
.adm-tab svg{display:block;stroke:currentColor;}
.adm-tab span{font-size:10px;font-weight:600;letter-spacing:.04em;}
.adm-tab.on{color:var(--charcoal);}
.adm-tab.on::after{content:"";position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:18px;height:3px;border-radius:999px;background:var(--orange);}
.adm-tab .bdg{position:absolute;top:2px;left:calc(50% + 6px);min-width:17px;height:17px;padding:0 5px;border-radius:999px;background:var(--orange);color:#fff;font-family:var(--mono);font-size:10.5px;font-weight:600;display:flex;align-items:center;justify-content:center;line-height:1;}
.adm-pad{padding:16px 18px 0;}
.adm-card{background:#fff;border:1px solid var(--line);border-radius:20px;box-shadow:var(--shadow);overflow:hidden;}
.adm-sub{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--olive);font-weight:700;font-family:var(--mono);display:block;}
.adm-sub.pad{padding-bottom:10px;}
.adm-gap{height:16px;}.adm-gap-s{height:10px;}
.adm-pulse details{border-bottom:1px solid var(--line);}
.adm-pulse details:last-child{border-bottom:0;}
.adm-pulse summary{list-style:none;display:flex;align-items:center;gap:12px;min-height:58px;padding:8px 16px;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.adm-pulse summary::-webkit-details-marker{display:none;}
.adm-pulse .lbl{font-size:12.5px;font-weight:500;color:var(--ink-soft);flex:1;line-height:1.3;}
.adm-pulse .lbl b{display:block;color:var(--charcoal);font-weight:600;font-size:13.5px;}
.adm-pulse .val{font-family:var(--mono);font-variant-numeric:tabular-nums;font-weight:300;font-size:23px;letter-spacing:-.02em;white-space:nowrap;text-align:right;}
.adm-pulse .val .u{font-size:12px;color:var(--ink-soft);}
.adm-pulse .val .up{font-size:11px;color:var(--olive);font-weight:500;display:block;}
.adm-pulse .val .wr{color:var(--orange);}
.adm-chev{flex:0 0 auto;width:28px;height:28px;border-radius:999px;background:var(--panel);display:flex;align-items:center;justify-content:center;transition:transform .25s;color:var(--olive);font-size:12px;}
details[open]>summary .adm-chev{transform:rotate(180deg);}
.adm-x{padding:2px 16px 16px;background:var(--panel);border-top:1px solid var(--line);}
.adm-x .adm-sub{margin:14px 0 8px;}
.adm-prow{display:grid;grid-template-columns:96px 1fr auto;gap:10px;align-items:center;padding:6px 0;font-size:12.5px;}
.adm-prow .tk{height:6px;border-radius:999px;background:var(--salvia);overflow:hidden;}
.adm-prow .tk i{display:block;height:100%;background:var(--olive);border-radius:999px;}
.adm-prow.warn .tk i{background:var(--orange);}
.adm-prow .fr{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:12px;color:var(--ink-soft);}
.adm-chip{display:inline-flex;align-items:center;gap:.45em;font-size:11.5px;font-weight:600;padding:4px 11px;border-radius:999px;white-space:nowrap;}
.adm-chip .cd{width:6px;height:6px;border-radius:999px;background:currentColor;}
.adm-c-ok{background:rgba(99,113,84,.14);color:var(--olive-d);}
.adm-c-warn{background:rgba(255,93,54,.13);color:#e8431f;}
.adm-c-mut{background:var(--panel);color:var(--ink-soft);}
.adm-c-sol{background:rgba(201,183,156,.3);color:var(--olive-d);}
.adm-li{border-bottom:1px solid var(--line);}
.adm-li:last-child{border-bottom:0;}
.adm-li summary,.adm-li .rowbody{list-style:none;display:flex;flex-direction:column;gap:8px;padding:14px 16px;min-height:44px;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.adm-li summary::-webkit-details-marker{display:none;}
.adm-li .r1{display:flex;align-items:baseline;gap:10px;}
.adm-li .r1 .t{flex:1;font-size:14.5px;font-weight:600;line-height:1.3;min-width:0;}
.adm-li .r1 .t small{display:block;font-weight:400;font-size:12px;color:var(--ink-soft);margin-top:2px;}
.adm-li .r1 .m{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:15px;font-weight:500;white-space:nowrap;}
.adm-li .r1 .m.neg{color:var(--orange);}
.adm-li .r2{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.adm-li .r2 .dt{font-family:var(--mono);font-size:11px;color:var(--ink-soft);}
.adm-acts{display:flex;gap:8px;flex-wrap:wrap;padding:12px 0 4px;}
.adm-acts .adm-btn{flex:1;}
.adm-seg{display:flex;gap:4px;background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:3px;}
.adm-seg button{flex:1;text-align:center;font-size:12.5px;font-weight:600;color:var(--ink-soft);padding:10px 2px;border-radius:999px;min-height:44px;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;}
.adm-seg button.on{background:var(--forest);color:#fff;}
.adm-filters{display:flex;gap:8px;overflow-x:auto;padding-bottom:12px;}
.adm-filters .adm-btn{flex:0 0 auto;}
.adm-ros{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--line);min-height:56px;}
.adm-ros:last-child{border-bottom:0;}
.adm-av{width:34px;height:34px;border-radius:999px;background:var(--salvia);color:var(--olive-d);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex:0 0 auto;}
.adm-ros .nm{flex:1;font-size:14px;font-weight:500;line-height:1.3;min-width:0;}
.adm-ros .nm small{display:block;font-size:11.5px;color:var(--ink-soft);font-weight:400;}
.adm-tick{width:28px;height:28px;border-radius:999px;background:rgba(99,113,84,.14);color:var(--olive-d);display:flex;align-items:center;justify-content:center;flex:0 0 auto;font-size:13px;font-weight:700;}
.adm-tick.off{background:var(--panel);color:var(--sand);}
.adm-menu .mrow{display:flex;align-items:center;gap:14px;padding:15px 16px;min-height:56px;border-bottom:1px solid var(--line);color:var(--charcoal);font-size:14.5px;font-weight:500;width:100%;text-align:left;-webkit-tap-highlight-color:transparent;}
.adm-menu .mrow:last-child{border-bottom:0;}
.adm-menu .mi{width:36px;height:36px;border-radius:12px;background:var(--panel);display:flex;align-items:center;justify-content:center;flex:0 0 auto;color:var(--olive);font-family:var(--mono);font-size:13px;font-weight:600;}
.adm-menu .grow{flex:1;min-width:0;}
.adm-menu .grow small{display:block;font-size:11.5px;color:var(--ink-soft);font-weight:400;margin-top:1px;}
.adm-menu .nbd{min-width:22px;height:22px;padding:0 7px;border-radius:999px;background:var(--orange);color:#fff;font-family:var(--mono);font-size:11.5px;font-weight:600;display:flex;align-items:center;justify-content:center;}
.adm-menu .go{color:var(--sand);font-size:17px;}
.adm-menu .mrow.out{color:var(--orange);}
.adm-fld{display:flex;flex-direction:column;gap:6px;padding:10px 0;}
.adm-fld label{font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:var(--olive);font-family:var(--mono);}
.adm-fld input,.adm-fld select,.adm-fld textarea{appearance:none;-webkit-appearance:none;width:100%;min-height:48px;border:1px solid var(--line);border-radius:14px;background:#fff;padding:12px 14px;font-family:inherit;font-size:15px;color:var(--charcoal);}
.adm-fld input:focus,.adm-fld textarea:focus{outline:2px solid var(--olive);outline-offset:1px;}
.adm-fld .mono-in{font-family:var(--mono);font-variant-numeric:tabular-nums;}
.adm-fld .hint{font-size:11.5px;color:var(--ink-soft);line-height:1.45;}
.adm-fld.err input{border-color:var(--orange);background:rgba(255,93,54,.05);}
.adm-fld.err .hint{color:#e8431f;font-weight:500;}
.adm-2col{display:grid;grid-template-columns:1fr 1fr;gap:0 12px;}
.adm-dim{position:absolute;inset:0;background:rgba(32,33,28,.44);z-index:50;animation:admfade .18s ease-out;}
@keyframes admfade{from{opacity:0;}to{opacity:1;}}
.adm-sheet{position:absolute;left:0;right:0;bottom:0;z-index:60;background:var(--cream);border-radius:26px 26px 0 0;padding:10px 20px calc(18px + env(safe-area-inset-bottom,10px));box-shadow:0 -18px 50px -20px rgba(32,33,28,.5);max-height:88%;overflow-y:auto;animation:admup .24s ease-out;}
@keyframes admup{from{transform:translateY(40px);opacity:0;}to{transform:none;opacity:1;}}
.adm-sheet .grab{width:38px;height:4px;border-radius:999px;background:var(--sand);margin:4px auto 12px;}
.adm-sheet h2{font-size:19px;font-weight:600;margin-bottom:2px;}
.adm-sheet .sd{font-size:12.5px;color:var(--ink-soft);line-height:1.5;margin-bottom:6px;}
.adm-dlg-wrap{position:absolute;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:26px;}
.adm-dlg{position:relative;z-index:61;background:var(--cream);border-radius:22px;padding:22px 20px 18px;width:100%;box-shadow:0 24px 60px -24px rgba(32,33,28,.6);animation:admup .2s ease-out;max-height:80%;overflow-y:auto;}
.adm-dlg h2{font-size:18px;font-weight:600;line-height:1.3;margin-bottom:8px;}
.adm-dlg p{font-size:13.5px;color:var(--ink-soft);line-height:1.55;}
.adm-dlg p b{color:var(--charcoal);}
.adm-dlg .adm-acts{padding-top:16px;}
.adm-toast{position:absolute;left:16px;right:16px;bottom:calc(92px + env(safe-area-inset-bottom,10px));z-index:70;background:var(--forest);color:#fff;border-radius:16px;padding:13px 16px;display:flex;gap:11px;align-items:center;box-shadow:var(--shadow);animation:admup .22s ease-out;}
.adm-toast .ok{width:22px;height:22px;border-radius:999px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;font-size:11px;flex:0 0 auto;}
.adm-toast .tx{flex:1;font-size:13px;line-height:1.4;color:rgba(255,255,255,.82);}
.adm-toast .tx b{color:#fff;display:block;font-weight:600;}
.adm-toast button{color:#fff;font-size:12.5px;font-weight:600;text-decoration:underline;text-underline-offset:2px;padding:8px 4px;}
.adm-lock{border:1px solid var(--line);border-radius:16px;background:#fff;overflow:hidden;margin-top:14px;}
.adm-lock .it{display:flex;align-items:center;gap:12px;padding:13px 14px;border-bottom:1px solid var(--line);font-size:13.5px;}
.adm-lock .it:last-child{border-bottom:0;}
.adm-lock .st{width:9px;height:9px;border-radius:999px;flex:0 0 auto;}
.adm-lock .g{flex:1;line-height:1.35;}
.adm-lock .g small{display:block;font-size:11.5px;color:var(--ink-soft);}
.adm-lock button.lnk{font-size:12.5px;font-weight:600;color:var(--olive);padding:8px 0 8px 8px;white-space:nowrap;}
.adm-note{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:14px;font-size:12.5px;line-height:1.5;}
.adm-note .st{width:8px;height:8px;border-radius:999px;flex:0 0 auto;margin-top:5px;}
.adm-note-warn{background:rgba(255,93,54,.09);color:#933a20;}
.adm-note-info{background:var(--panel);color:var(--ink-soft);}
.adm-note-forest{background:var(--forest);color:rgba(255,255,255,.85);border-radius:18px;}
.adm-note b{font-weight:600;color:inherit;}
.adm-copy{border:1.5px dashed rgba(99,113,84,.4);border-radius:14px;background:rgba(214,216,199,.25);padding:12px 14px;display:flex;align-items:center;gap:10px;}
.adm-copy .cv{flex:1;font-family:var(--mono);font-size:12px;line-height:1.5;word-break:break-all;color:var(--olive-d);}
.adm-copy .cv.txt{font-family:"Geist",sans-serif;font-size:12.5px;}
.adm-copy button{min-width:44px;min-height:44px;border:1px solid var(--line);border-radius:12px;background:#fff;font-size:11px;font-weight:700;font-family:var(--mono);letter-spacing:.08em;color:var(--olive);padding:0 10px;}
.adm-life{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;font-weight:600;white-space:nowrap;}
.adm-life i{width:7px;height:7px;border-radius:999px;font-style:normal;}
.lf-miss{color:#e8431f;}.lf-miss i{background:var(--orange);}
.lf-nocap{color:#9a8a5c;}.lf-nocap i{background:var(--dune);}
.lf-ready{color:var(--olive-d);}.lf-ready i{background:var(--olive);}
.lf-sched{color:#1c5f6a;}.lf-sched i{background:#1c6f6a;}
.lf-pub{color:var(--forest);}.lf-pub i{background:var(--forest);}
.lf-fail{color:#e8431f;}.lf-fail i{background:var(--orange);outline:2px solid rgba(255,93,54,.3);}
.adm-fros{padding:16px 18px;border-bottom:1.5px solid rgba(32,33,28,.18);display:flex;flex-direction:column;gap:7px;}
.adm-fros .r1{display:flex;align-items:center;gap:10px;}
.adm-fros .r1 b{flex:1;font-size:18.5px;font-weight:650;letter-spacing:-.01em;}
.adm-fros .tel{font-family:var(--mono);font-size:15px;font-weight:600;color:var(--olive-d);text-decoration:none;display:inline-flex;align-items:center;min-height:44px;}
.adm-fros .em{font-size:13.5px;color:var(--ink-soft);}
.adm-fros .em b{color:var(--charcoal);font-weight:600;}
.adm-fros .med{font-size:13.5px;font-weight:600;color:#933a20;background:rgba(255,93,54,.09);border-radius:10px;padding:8px 12px;}
.adm-cal{padding:14px 16px 16px;}
.adm-cal .mh{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:13.5px;font-weight:600;}
.adm-cal .gridc{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
.adm-cal .dh{font-family:var(--mono);font-size:9.5px;text-align:center;color:var(--ink-soft);text-transform:uppercase;padding:4px 0;}
.adm-cal .d{aspect-ratio:1;border-radius:10px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:12px;color:var(--charcoal);position:relative;}
.adm-cal .d i{width:5px;height:5px;border-radius:999px;position:absolute;bottom:5px;font-style:normal;}
.adm-cal .d.mut{color:var(--sand);}
.adm-cal .d.has{background:var(--panel);font-weight:600;}
.adm-cal .d.today{outline:2px solid var(--orange);outline-offset:-2px;font-weight:700;}
.adm-prev{border-radius:16px;overflow:hidden;border:1px solid var(--line);}
.adm-prev .hero{height:86px;display:flex;align-items:flex-end;padding:12px;}
.adm-prev .hero span{font-size:15px;font-weight:600;color:#fff;letter-spacing:.06em;}
.adm-prev .body{background:#fff;padding:12px;display:flex;align-items:center;gap:10px;}
.adm-prev .body .adm-btn{min-height:38px;font-size:12px;flex:0 0 auto;}
.adm-prev .body small{font-size:11px;color:var(--ink-soft);line-height:1.4;}
.adm-swatch{display:flex;gap:10px;}
.adm-swatch .sw{flex:1;border:1px solid var(--line);border-radius:14px;padding:10px;display:flex;align-items:center;gap:10px;background:#fff;min-height:52px;}
.adm-swatch .sw i{width:26px;height:26px;border-radius:8px;font-style:normal;flex:0 0 auto;border:1px solid var(--line);}
.adm-swatch .sw input{border:none;font-family:var(--mono);font-size:11.5px;width:100%;background:transparent;padding:6px 0;min-height:32px;}
.adm-state{padding:30px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;}
.adm-state .ic{width:52px;height:52px;border-radius:999px;background:var(--panel);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--olive);}
.adm-state h3{font-size:16px;font-weight:600;}
.adm-state p{font-size:13px;color:var(--ink-soft);line-height:1.55;max-width:250px;}
.adm-skel{padding:16px;display:flex;flex-direction:column;gap:14px;}
.adm-skel .sk{height:14px;border-radius:7px;background:linear-gradient(90deg,var(--panel) 25%,#e7e4da 45%,var(--panel) 65%);background-size:200% 100%;animation:admsh 1.4s infinite linear;}
@keyframes admsh{from{background-position:200% 0}to{background-position:-200% 0}}
.adm-load-note{display:flex;align-items:center;gap:10px;justify-content:center;padding:0 16px 18px;font-size:12.5px;color:var(--ink-soft);text-align:left;line-height:1.45;}
.adm-spin{width:16px;height:16px;border-radius:999px;border:2px solid var(--salvia);border-top-color:var(--olive);animation:admsp .9s linear infinite;flex:0 0 auto;}
@keyframes admsp{to{transform:rotate(360deg)}}
.adm-prog{height:7px;border-radius:999px;background:var(--salvia);overflow:hidden;}
.adm-prog i{display:block;height:100%;background:var(--olive);border-radius:999px;transition:width .4s;}
.adm-steps{display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft);}
.adm-steps b{width:22px;height:22px;border-radius:999px;background:var(--forest);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:11px;}
.adm-steps b.off{background:var(--panel);color:var(--ink-soft);}
.adm-steps i{flex:1;height:1px;background:var(--line);font-style:normal;}
.adm-kpi4{display:grid;grid-template-columns:repeat(4,1fr);text-align:center;padding:14px 6px;}
.adm-kpi4 .adm-mono{font-size:21px;}
.adm-kpi4 small{font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-soft);}
.adm-fieldmode{background:#fff;}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;}}

`;
