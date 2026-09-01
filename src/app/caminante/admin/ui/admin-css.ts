// CSS del dashboard de admin — diseño de Claude Design (jul 2026), integrado
// verbatim y SCOPEADO bajo `.adm` para no tocar nada fuera del admin.
// Fuente del diseño: dashboard admin.zip (Desktop de Luis). Si se re-diseña,
// regenerar desde el HTML y volver a prefijar.

export const ADMIN_CSS = `
@font-face{font-family:"Geist";src:url("/landing/assets/fonts/Geist-VariableFont_wght.ttf") format("truetype-variations");font-weight:100 900;font-style:normal;font-display:swap;}
@font-face{font-family:"Geist";src:url("/landing/assets/fonts/Geist-Italic-VariableFont_wght.ttf") format("truetype-variations");font-weight:100 900;font-style:italic;font-display:swap;}
@font-face{font-family:"Geist Mono";src:url("/landing/assets/fonts/GeistMono-VariableFont_wght.ttf") format("truetype-variations");font-weight:100 900;font-style:normal;font-display:swap;}
.adm{
  --cream:#fbfbf7;--charcoal:#20211c;--lagoon:#1c6f6a;--forest:#20392b;
  --olive:#637154;--olive-d:#4f5d44;--sand:#b6ada5;--dune:#c9b79c;--salvia:#d6d8c7;--orange:#ff5d36;
  --panel:#f1eee7;--bg:#eceae3;--line:rgba(32,33,28,.13);--ink-soft:rgba(32,33,28,.6);
  --r:16px;--eb:.2em;--shadow:0 12px 34px -22px rgba(32,33,28,.42);
  --mono:"Geist Mono",ui-monospace,monospace;
  font-family:"Geist",system-ui,sans-serif;color:var(--charcoal);background:var(--bg);
  -webkit-font-smoothing:antialiased;min-height:100svh;
}
.adm *{box-sizing:border-box;margin:0;padding:0;}
.adm a{color:inherit;text-decoration:none;}
.adm button{font-family:inherit;cursor:pointer;}
.adm .mono{font-family:var(--mono);}
.adm .eyebrow{font-size:11px;font-weight:600;letter-spacing:var(--eb);text-transform:uppercase;display:inline-flex;align-items:center;gap:.5em;line-height:1;color:var(--olive);}
.adm .eyebrow .sl{color:var(--orange);font-weight:700;}
.adm .display{font-weight:200;letter-spacing:-.02em;line-height:1.05;}
.adm em.ac{font-style:italic;color:var(--orange);font-weight:300;}

/* ===== SHELL ===== */
.adm .ahead{position:sticky;top:0;z-index:50;background:rgba(251,251,247,.86);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line);}
.adm .ahead .top{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:13px 22px;}
.adm .ahead .brand{display:flex;align-items:center;gap:13px;}
.adm .ahead .logo{height:25px;display:inline-block;}
.adm .ahead .logo svg{height:100%;width:auto;display:block;}
.adm .ahead .logo .g1{fill:var(--olive);}
.adm .ahead .logo .g2{fill:var(--sand);}
.adm .ahead .logo .g3{fill:var(--orange);}
.adm .ahead .mode{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);border-left:1px solid var(--line);padding-left:13px;}
.adm .qa{display:flex;gap:10px;}
.adm .nav{display:flex;gap:7px;padding:0 22px 12px;overflow-x:auto;}
.adm .nav a,.adm .nav span.soon{flex:0 0 auto;font-size:13.5px;font-weight:500;color:var(--ink-soft);padding:8px 15px;border-radius:999px;border:1px solid transparent;transition:all .15s;white-space:nowrap;}
.adm .nav a:hover{color:var(--charcoal);background:var(--panel);}
.adm .nav a.on{background:var(--forest);color:#fff;}
.adm .nav span.soon{border:1px dashed var(--line);opacity:.55;cursor:default;}

.adm .btn{display:inline-flex;align-items:center;justify-content:center;gap:.5em;min-height:40px;padding:0 17px;border-radius:999px;font-size:13.5px;font-weight:500;border:1px solid transparent;transition:background .18s,transform .1s,color .18s,border-color .18s;white-space:nowrap;}
.adm .btn:active{transform:translateY(1px);}
.adm .btn-orange{background:var(--orange);color:#fff;}
.adm .btn-orange:hover{background:#e8431f;}
.adm .btn-glass{background:rgba(255,255,255,.55);color:var(--olive);border-color:rgba(99,113,84,.3);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}
.adm .btn-glass:hover{background:rgba(255,255,255,.85);}
.adm .btn-ghost{background:transparent;color:var(--olive);border-color:var(--line);}
.adm .btn-ghost:hover{border-color:var(--olive);}
.adm .btn-sm{min-height:33px;padding:0 12px;font-size:12.5px;}
.adm .btn-danger{background:transparent;color:var(--orange);border-color:rgba(255,93,54,.4);}
.adm .btn-danger:hover{background:rgba(255,93,54,.08);}

/* ===== LAYOUT ===== */
.adm .page{max-width:1200px;margin:0 auto;padding:26px 22px 90px;}
.adm .sec{margin-bottom:46px;scroll-margin-top:120px;}
.adm .sec-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px;}
.adm .sec-head h1,.adm .sec-head h2{font-size:clamp(24px,3.4vw,34px);}
.adm .sec-head .desc{font-size:13.5px;color:var(--ink-soft);margin-top:4px;}
.adm .card{background:#fff;border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);}
.adm .glass{background:rgba(255,255,255,.6);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.5);box-shadow:var(--shadow);border-radius:var(--r);}
.adm .pad{padding:20px 22px;}

/* ===== EXPANDIBLES ===== */
.adm .xhead{cursor:pointer;-webkit-tap-highlight-color:transparent;}
.adm .chev2{display:inline-block;color:var(--sand);font-size:10px;transition:transform .25s ease;margin-left:6px;flex:0 0 auto;}
.adm .xhead.open .chev2,.adm .xhead.open + tr .chev2{transform:rotate(180deg);}
/* ⚠️ El acordeón animaba con max-height:1600px, y eso NO es un detalle de
   estilo: es un techo. Una cápsula de Salidas con nueve que respondieron y
   nueve que faltan pasa de 1600px y el contenido se CORTA — sin scroll, sin
   aviso, simplemente no está. Justo la gente a la que había que escribirle.
   grid-template-rows de 0fr a 1fr anima igual y no tiene techo: la altura la
   pone el contenido. El hijo necesita min-height:0 para poder encogerse. */
.adm .xbody{display:grid;grid-template-rows:0fr;opacity:0;overflow:hidden;transition:grid-template-rows .35s ease,opacity .28s ease;}
.adm .xbody>*{min-height:0;}
.adm .xbody.on{grid-template-rows:1fr;opacity:1;}
.adm .xpad{padding:16px 2px 8px;}
.adm tr.xdetail td{padding:0 15px;border-bottom:0;}
.adm tr.xdetail .xbody.on{border-bottom:1px solid var(--line);}
.adm tbody tr.xdetail:hover{background:transparent;}
.adm .xh4{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--olive);font-weight:700;margin:16px 0 9px;}
.adm .xh4:first-child{margin-top:0;}

/* barra de progreso con fracción */
.adm .prog{display:flex;align-items:center;gap:10px;}
.adm .prog .tk2{flex:1;height:6px;border-radius:999px;background:var(--salvia);overflow:hidden;min-width:70px;}
.adm .prog .tk2 i{display:block;height:100%;background:var(--olive);border-radius:999px;}
.adm .prog.warn .tk2 i{background:var(--orange);}
.adm .prog .fr{font-family:var(--mono);font-size:12px;color:var(--ink-soft);white-space:nowrap;}
.adm .progrow{display:grid;grid-template-columns:130px 1fr;gap:12px;align-items:center;padding:6px 0;font-size:12.5px;}

/* chip de persona */
.adm .pchips{display:flex;flex-wrap:wrap;gap:8px;}
.adm .pchip{display:inline-flex;align-items:center;gap:7px;font-size:12px;padding:4px 11px 4px 4px;border:1px solid var(--line);border-radius:999px;background:#fff;}
.adm .pchip .av{width:22px;height:22px;border-radius:999px;background:var(--salvia);color:var(--olive-d);display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;}
.adm .pchip .stt{font-size:10.5px;font-weight:700;}
.adm .pchip.ok .stt{color:var(--olive);}
.adm .pchip.pend .stt{color:var(--orange);}
.adm .pchip.pend{border-color:rgba(255,93,54,.35);}
.adm .pchip .dt{font-family:var(--mono);font-size:10px;color:var(--ink-soft);}

/* lista quién puso qué */
.adm .wlist{display:flex;flex-direction:column;}
.adm .wl{display:grid;grid-template-columns:1.3fr .7fr .9fr .7fr;gap:10px;padding:7px 0;border-bottom:1px solid var(--line);font-size:12.5px;align-items:baseline;}
.adm .wl .m{font-family:var(--mono);text-align:right;}
.adm .wl .me{color:var(--ink-soft);}
.adm .wl .d{font-family:var(--mono);color:var(--ink-soft);text-align:right;font-size:11.5px;}
.adm .wl.debt{color:var(--ink-soft);}
.adm .wl.debt .m{color:var(--orange);font-weight:600;}
.adm .wl.total{border-bottom:0;font-weight:600;}
.adm .wl.total .m{font-weight:600;}
@media(max-width:560px){.adm .wl{grid-template-columns:1fr auto;} .adm .wl .me,.adm .wl .d{display:none;}}

/* KPI */
.adm .kpis{display:grid;gap:16px;grid-template-columns:1fr;}
@media(min-width:640px){.adm .kpis{grid-template-columns:1fr 1fr;}}
@media(min-width:1000px){.adm .kpis{grid-template-columns:repeat(4,1fr);}}
.adm .kpi{padding:20px 20px 18px;border-radius:var(--r);}
.adm .kpi .k-lbl{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft);font-weight:600;display:flex;align-items:center;justify-content:space-between;}
.adm .kpi .k-val{font-family:var(--mono);font-weight:300;font-size:32px;letter-spacing:-.02em;margin:10px 0 2px;}
.adm .kpi .k-val .u{font-size:15px;color:var(--ink-soft);}
.adm .kpi .k-sub{font-size:12.5px;color:var(--ink-soft);margin-top:6px;line-height:1.5;}
.adm .kpi .k-sub b{color:var(--charcoal);font-weight:600;}
.adm .spark{display:flex;align-items:flex-end;gap:3px;height:30px;margin-top:12px;}
.adm .spark i{flex:1;background:var(--salvia);border-radius:2px 2px 0 0;min-height:3px;}
.adm .spark i.hi{background:var(--olive);}
.adm .dots{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px;}
.adm .dot-l{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--ink-soft);}
.adm .dot{width:8px;height:8px;border-radius:999px;flex:0 0 auto;}
.adm .stars-lg{color:var(--orange);font-size:19px;letter-spacing:2px;}
.adm .stars-lg .off{color:var(--sand);}

/* tablas */
.adm .tbl-wrap{overflow-x:auto;border-radius:var(--r);}
.adm table{width:100%;border-collapse:collapse;font-size:13.5px;background:#fff;}
.adm thead th{text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft);font-weight:600;padding:13px 15px;border-bottom:1px solid var(--line);white-space:nowrap;}
.adm tbody td{padding:13px 15px;border-bottom:1px solid var(--line);vertical-align:middle;}
.adm tbody tr{transition:background .12s;}
.adm tbody tr:hover{background:var(--panel);}
.adm tbody tr:last-child td{border-bottom:0;}
.adm td.num,.adm th.num{font-family:var(--mono);}
.adm td.right,.adm th.right{text-align:right;}
.adm .mut{color:var(--ink-soft);}

/* chips / badges */
.adm .chip{display:inline-flex;align-items:center;gap:.4em;font-size:11.5px;font-weight:600;letter-spacing:.02em;padding:4px 10px;border-radius:999px;white-space:nowrap;}
.adm .chip .cd{width:6px;height:6px;border-radius:999px;}
.adm .c-draft{background:var(--salvia);color:var(--olive-d);}
.adm .c-pub{background:rgba(99,113,84,.14);color:var(--olive-d);}
.adm .c-full{background:rgba(255,93,54,.14);color:#c23c1c;}
.adm .c-sol{background:rgba(198,178,120,.22);color:#8a6d1f;}
.adm .c-conf{background:rgba(28,111,106,.14);color:var(--lagoon);}
.adm .c-paid{background:rgba(99,113,84,.16);color:var(--olive-d);}
.adm .c-canc{background:rgba(32,33,28,.08);color:var(--ink-soft);}
.adm .badge{display:inline-flex;align-items:center;gap:.4em;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;padding:3px 9px;border-radius:6px;background:var(--panel);color:var(--ink-soft);}
.adm .tick{color:var(--olive);font-weight:700;}
.adm .cross{color:var(--sand);}

/* filtros */
.adm .filters{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px;}
.adm .filters select,.adm .filters input{font-family:inherit;font-size:13px;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--charcoal);}
.adm .filters input{flex:1;min-width:160px;}
.adm .filters select:focus,.adm .filters input:focus{outline:none;border-color:var(--olive);box-shadow:0 0 0 3px rgba(99,113,84,.15);}

/* detalle */
.adm .detail{display:grid;gap:20px;grid-template-columns:1fr;}
@media(min-width:760px){.adm .detail{grid-template-columns:1.1fr .9fr;}}
.adm .dl{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;font-size:13px;}
.adm .dl dt{color:var(--ink-soft);}
.adm .dl dd{font-weight:500;text-align:right;}
.adm .mini-form{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px;}
.adm .mini-form input,.adm .mini-form select{font-family:inherit;font-size:12.5px;padding:8px 10px;border:1px solid var(--line);border-radius:9px;background:#fff;}
.adm .act-row{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px;}

/* barras */
.adm .barrow{display:grid;grid-template-columns:150px 1fr 42px;gap:12px;align-items:center;padding:7px 0;font-size:13px;}
.adm .bar{height:8px;border-radius:999px;background:var(--salvia);overflow:hidden;}
.adm .bar i{display:block;height:100%;background:var(--olive);border-radius:999px;}
.adm .barrow .bv{font-family:var(--mono);font-size:12.5px;text-align:right;color:var(--ink-soft);}

/* testimonios */
.adm .testi{display:grid;gap:14px;grid-template-columns:1fr;}
@media(min-width:720px){.adm .testi{grid-template-columns:1fr 1fr;}}
.adm .tcard{padding:18px 18px 16px;border-radius:var(--r);}
.adm .tcard .tt{font-size:14px;line-height:1.55;font-style:italic;color:#33352d;}
.adm .tcard .tm{display:flex;align-items:center;justify-content:space-between;margin-top:14px;gap:10px;}
.adm .tcard .who{font-size:12px;color:var(--ink-soft);font-weight:600;}
.adm .tcard .st{color:var(--orange);font-size:13px;letter-spacing:1px;}

.adm .empty{padding:30px;text-align:center;color:var(--ink-soft);font-size:14px;border:1px dashed var(--line);border-radius:var(--r);background:rgba(255,255,255,.4);}
.adm .grid2{display:grid;gap:20px;grid-template-columns:1fr;}
@media(min-width:900px){.adm .grid2{grid-template-columns:1fr 1fr;}}
.adm .subtitle{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--olive);font-weight:700;margin-bottom:12px;display:block;}
.adm .roster-head{display:none;}

/* ── Roster: la ficha desplegable por persona ─────────────────────────────
   El renglón resume; la ficha es para actuar (llamar, escribir, leerle a un
   médico lo declarado). La fila de detalle SIEMPRE se renderiza y se esconde
   aquí — así al imprimir salen todas abiertas sin tocar nada. */
.adm .r-name{display:inline-flex;align-items:baseline;gap:8px;background:none;border:0;padding:0;margin:0;font:inherit;color:inherit;text-align:left;cursor:pointer;}
.adm .r-name:hover .r-chev{color:var(--orange);}
.adm .r-chev{display:inline-block;font-size:15px;line-height:1;color:var(--ink-soft);transition:transform .15s ease;transform:translateY(1px);}
.adm .r-name.abierto .r-chev{transform:translateY(1px) rotate(90deg);color:var(--orange);}
.adm tr.r-det{display:none;}
.adm tr.r-det.abierta{display:table-row;}
.adm tr.r-det > td{background:var(--panel);padding:16px 15px 18px;}
.adm .r-ficha{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:18px 26px;}
.adm .r-tit{font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-soft);font-weight:600;margin-bottom:7px;}
.adm .r-dato{display:flex;gap:8px;font-size:13px;line-height:1.5;margin-bottom:3px;}
.adm .r-k{color:var(--ink-soft);flex:0 0 auto;min-width:96px;}
.adm .r-v{font-weight:500;}
.adm .r-vacio{font-size:12.5px;color:var(--ink-soft);font-style:italic;line-height:1.5;}

/* ── SALIDAS · transcrito VERBATIM del entregable de Claude Design
   (design/encuesta-v2/dc/salidas.dc.html), prefijado con .adm como
   el resto del panel. Si el diseño cambia, RE-EXTRAER del HTML — no
   editar a mano. ── */
.adm .saltop{display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap}
.adm .saltop .g{flex:1;min-width:200px}
.adm .saltop h3{font-size:19px;font-weight:400;letter-spacing:-.01em;line-height:1.25}
.adm .saltop .meta{font-size:12.5px;color:var(--ink-soft);margin-top:4px;line-height:1.5}
.adm .salwhen{font-family:var(--mono);font-size:12px;letter-spacing:.04em;color:var(--olive-d);white-space:nowrap;padding-top:3px}
.adm .salwhen.cerca{color:var(--orange);font-weight:700}
.adm .salbars{display:grid;gap:2px;margin-top:14px;max-width:520px}
.adm .salsig{display:flex;flex-wrap:wrap;gap:7px 16px;margin-top:14px;padding-top:12px;border-top:1px solid var(--line);align-items:center}
.adm .salsig span{display:inline-flex;align-items:baseline;gap:.45em;font-size:12.5px;color:var(--ink-soft);line-height:1.45}
.adm .salsig s{text-decoration:none;font-family:var(--mono);font-weight:700;flex:0 0 auto}
.adm .salsig .ok s{color:var(--olive)}
.adm .salsig .pend{color:var(--charcoal)}
.adm .salsig .pend s{color:var(--orange)}
.adm .salsig .crit{color:var(--charcoal);font-weight:600;background:rgba(255,93,54,.13);border-radius:999px;padding:5px 12px}
.adm .salsig .crit s{color:var(--orange)}
.adm .salmtr{display:flex;flex-wrap:wrap;gap:14px 32px;margin-top:14px}
.adm .salmtr>div{min-width:118px}
.adm .salmtr .v{font-family:var(--mono);font-weight:300;font-size:26px;letter-spacing:-.02em;line-height:1.1}
.adm .salmtr .v .u{font-size:13px;color:var(--ink-soft)}
.adm .salmtr .v .st{font-family:"Geist",system-ui,sans-serif;font-size:17px;color:var(--orange);letter-spacing:1px}
.adm .salmtr .d{font-size:12px;color:var(--ink-soft);margin-top:3px;line-height:1.4}
.adm .salmtr .d b{color:var(--charcoal);font-weight:600;font-family:var(--mono)}
.adm .salper{display:grid;grid-template-columns:26px 1fr auto;gap:11px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line);font-size:13px}
.adm .salper:last-child{border-bottom:0}
.adm .salper .av{width:26px;height:26px;border-radius:999px;background:var(--salvia);color:var(--olive-d);display:inline-flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:10px;font-weight:700}
.adm .salper .nm{min-width:0;line-height:1.35}
.adm .salper .nm small{display:block;font-size:11.5px;color:var(--ink-soft);margin-top:1px}
.adm .salper .rt{display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:flex-end}
.adm .salper .st{font-family:var(--mono);font-size:11.5px;font-weight:700;color:var(--orange);white-space:nowrap}
.adm .salper .qz{font-family:var(--mono);font-size:12px;white-space:nowrap}
.adm .salper .qz .s{font-family:"Geist",system-ui,sans-serif;font-size:15px;color:var(--orange);letter-spacing:1px}
.adm .salper .tx{display:block;font-size:12.5px;font-style:italic;color:var(--ink-soft);line-height:1.45;max-width:44ch;margin-top:3px}
.adm .salsay{border-left:2px solid var(--orange);padding:2px 0 2px 13px;margin:14px 0 2px;font-size:13.5px;line-height:1.55;font-style:italic}
.adm .salsay small{display:block;font-style:normal;font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft);margin-top:5px}
.adm .salfoot{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}
.adm .sallk{flex:1 1 210px;min-width:0;display:flex;align-items:center;gap:8px;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:5px 6px 5px 12px}
.adm .sallk span{flex:1;min-width:0;font-family:var(--mono);font-size:11px;color:var(--ink-soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.adm .salgrp{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--line)}
.adm .salgrp .t{font-size:11px;font-weight:600;letter-spacing:var(--eb);text-transform:uppercase;color:var(--olive)}
.adm .salgrp .n{font-family:var(--mono);font-size:12px;color:var(--ink-soft)}
.adm .salgrp .r{flex:1;text-align:right;font-size:12.5px;color:var(--ink-soft);min-width:170px}
.adm .salcard{margin-bottom:12px}
.adm .salcard.alerta{border-color:rgba(255,93,54,.32)}
.adm .salcard.grave{border-color:rgba(255,93,54,.5);box-shadow:inset 3px 0 0 var(--orange),var(--shadow)}
.adm .salvac summary{list-style:none;display:flex;align-items:center;gap:12px;padding:14px 20px;cursor:pointer;min-height:52px}
.adm .salvac summary::-webkit-details-marker{display:none}
.adm .salvac summary .g{flex:1;font-size:13.5px;color:var(--ink-soft)}
.adm .salvac summary .g b{color:var(--charcoal);font-weight:600}
.adm .salvac[open] .chev2{transform:rotate(180deg)}
.adm .salvac .in{padding:0 20px 14px}
.adm .salvl{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;padding:9px 0;border-top:1px solid var(--line);font-size:13.5px}
.adm .salvl .nm{flex:1 1 190px}
.adm .salvl .dt{font-family:var(--mono);font-size:12px;color:var(--ink-soft)}
.adm .salvl a{color:var(--olive);font-weight:500}
.adm .salnew{display:grid;gap:0}
.adm .salstep{display:grid;grid-template-columns:24px 1fr;gap:14px;padding:16px 0;border-bottom:1px solid var(--line)}
.adm .salstep:last-child{border-bottom:0}
.adm .salstep .no{font-family:var(--mono);font-size:12px;color:var(--orange);font-weight:700;padding-top:9px}
.adm .salstep .h{font-size:14.5px;font-weight:500;margin-bottom:3px}
.adm .salstep .h small{display:block;font-size:12.5px;font-weight:400;color:var(--ink-soft);margin-top:2px;line-height:1.45}
.adm .salpick{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.adm .salpick button{font-size:12.5px;padding:8px 13px;border-radius:999px;border:1px solid var(--line);background:#fff;color:var(--ink-soft);min-height:38px}
.adm .salpick button.on{border-color:var(--olive);background:rgba(99,113,84,.1);color:var(--olive-d);font-weight:600}
/* El teléfono, y SOLO el teléfono: sueltas se comían el layout de escritorio. */
@media(max-width:620px){
  .adm .salper{grid-template-columns:26px 1fr;row-gap:8px}
  .adm .salper .rt{grid-column:1/-1;justify-content:flex-start}
  .adm .salmtr{gap:14px 24px}
}

/* ── EXPERIENCIAS · transcrito VERBATIM del entregable de Claude Design
   (design/encuesta-v2/dc/experiencias.dc.html), prefijado con .adm.
   Si el diseño cambia, RE-EXTRAER con design/encuesta-v2/transcribir-css.py —
   no editar a mano.

   ⚠️ La primera transcripción se comió LAS ONCE reglas que seguían a un
   comentario (.excat, .ex3, .exsem, .exarm, .excal, .exhero, .exban, .exkit,
   .exdim, .extrato, .exfech): justo las que dan la estructura. La pantalla
   compilaba y se veía «casi bien» —tarjetas a una columna, cifras apiladas—
   porque lo que sobrevivió fueron los descendientes, que solo pintan.
   El transcriptor ahora falla si pierde una regla.

   Se omiten a propósito «a», «a:hover» y «.nav a»: Claude Design las marcó
   «solo para esta pantalla» y contradicen al entregable del Dashboard, que
   viste las otras doce pantallas del panel. ── */
.adm .vtag{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 18px;padding:11px 16px;border-radius:999px;background:var(--panel);border:1px solid var(--line)}
.adm .vtag b{font-size:11px;font-weight:700;letter-spacing:var(--eb);text-transform:uppercase;color:var(--olive)}
.adm .vtag span{font-size:12.5px;color:var(--ink-soft);line-height:1.45}
.adm .vtag.casa{background:rgba(32,57,43,.07);border-color:rgba(32,57,43,.2)}
.adm .vtag.casa b{color:var(--forest)}
.adm .vsep{margin:60px 0 34px;border-top:1px solid rgba(32,33,28,.2)}
/* catálogo */
.adm .excat{display:grid;gap:18px;grid-template-columns:1fr}
@media(min-width:720px){
  .adm .excat{grid-template-columns:1fr 1fr}
}
@media(min-width:1080px){
  .adm .excat{grid-template-columns:repeat(3,1fr)}
}
.adm .exc{display:flex;flex-direction:column;overflow:hidden;text-align:left;color:inherit;cursor:pointer;transition:transform .18s ease-out,box-shadow .18s ease-out,border-color .18s ease-out}
.adm .exc:hover{transform:translateY(-2px);border-color:rgba(99,113,84,.4);box-shadow:0 18px 42px -22px rgba(32,33,28,.5)}
.adm .exc:hover h3{color:var(--olive-d)}
.adm .exc .ph{position:relative;aspect-ratio:16/10;overflow:hidden;background:var(--salvia)}
.adm .exc .ph img{width:100%;height:100%;object-fit:cover;display:block}
.adm .exc .ph .tp{position:absolute;top:11px;left:11px;right:11px;display:flex;gap:7px;flex-wrap:wrap}
.adm .exc .ph .tp .chip{background:rgba(20,22,16,.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.26);color:#fff}
.adm .exc .ph .tp .chip .cd{background:var(--salvia)}
.adm .exc .ph .tp .chip.c-draft .cd{background:var(--sand)}
.adm .exc .bd{padding:15px 17px 17px;display:flex;flex-direction:column;flex:1}
.adm .exc h3{font-size:17.5px;font-weight:400;letter-spacing:-.01em;line-height:1.25;transition:color .18s}
.adm .exc .op{font-size:12px;color:var(--ink-soft);margin-top:4px}
/* semáforo de venta */
.adm .exsem{display:flex;align-items:baseline;gap:.5em;font-size:12.5px;line-height:1.45;margin-top:10px;padding:8px 11px;border-radius:10px}
.adm .exsem s{text-decoration:none;font-family:var(--mono);font-weight:700;flex:0 0 auto}
.adm .exsem.si{background:rgba(99,113,84,.11);color:var(--olive-d)}
.adm .exsem.si s{color:var(--olive)}
.adm .exsem.no{background:rgba(255,93,54,.13);color:var(--charcoal);font-weight:600}
.adm .exsem.no s{color:var(--orange)}
.adm .exsem.dorm{background:var(--panel);color:var(--ink-soft)}
.adm .exsem.dorm s{color:var(--sand)}
.adm .exsem.big{font-size:14px;padding:12px 15px;border-radius:12px}
/* tres cifras */
.adm .ex3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px;padding-top:13px;border-top:1px solid var(--line)}
.adm .ex3 .v{font-family:var(--mono);font-weight:300;font-size:17px;letter-spacing:-.01em;line-height:1.15;white-space:nowrap}
.adm .ex3 .v .st{font-family:"Geist",system-ui,sans-serif;font-size:14px;color:var(--orange);letter-spacing:1px}
.adm .ex3 .l{font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-soft);font-weight:600;margin-top:4px;line-height:1.3}
.adm .ex3 .d{font-size:11px;color:var(--ink-soft);margin-top:2px;font-family:var(--mono)}
/* armadura · cinco dimensiones con nombre y tres estados */
.adm .exarm{margin-top:14px;padding-top:13px;border-top:1px solid var(--line)}
.adm .exarm .hd{display:flex;align-items:baseline;gap:8px;margin-bottom:9px}
.adm .exarm .hd .t{font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-soft);font-weight:600}
.adm .exarm .hd .fr{font-family:var(--mono);font-size:11.5px;color:var(--ink-soft);margin-left:auto}
.adm .exdims{display:flex;flex-wrap:wrap;gap:5px}
.adm .exd{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;line-height:1;padding:5px 9px 5px 7px;border-radius:999px;border:1px solid var(--line);background:#fff;white-space:nowrap}
.adm .exd i{width:7px;height:7px;border-radius:999px;flex:0 0 auto}
.adm .exd.full{color:var(--olive-d);border-color:rgba(99,113,84,.3);background:rgba(99,113,84,.08)}
.adm .exd.full i{background:var(--olive)}
.adm .exd.half{color:var(--olive-d);border-color:rgba(201,183,156,.7);background:rgba(201,183,156,.22)}
.adm .exd.half i{background:transparent;border:2px solid var(--dune)}
.adm .exd.none{color:var(--charcoal);border-color:rgba(255,93,54,.42);background:rgba(255,93,54,.09)}
.adm .exd.none i{background:transparent;border:1.5px solid var(--orange)}
.adm .exleg{display:flex;flex-wrap:wrap;gap:8px 18px;margin-bottom:18px;padding:11px 15px;border-radius:12px;background:var(--panel);border:1px solid var(--line)}
.adm .exleg span{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;color:var(--ink-soft)}
.adm .exleg .f,.adm .exleg .h,.adm .exleg .n{padding:4px 10px 4px 8px;border-radius:999px;border:1px solid var(--line);background:#fff}
.adm .exleg i{width:7px;height:7px;border-radius:999px;flex:0 0 auto}
.adm .exleg .f{color:var(--olive-d);border-color:rgba(99,113,84,.3);background:rgba(99,113,84,.08)}
.adm .exleg .f i{background:var(--olive)}
.adm .exleg .h{color:var(--olive-d);border-color:rgba(201,183,156,.7);background:rgba(201,183,156,.22)}
.adm .exleg .h i{background:transparent;border:2px solid var(--dune)}
.adm .exleg .n{color:var(--charcoal);border-color:rgba(255,93,54,.42);background:rgba(255,93,54,.09)}
.adm .exleg .n i{background:transparent;border:1.5px solid var(--orange)}
/* pie · enunciado del calendario */
.adm .excal{margin-top:14px;padding-top:12px;border-top:1px solid var(--line);display:flex;align-items:baseline;gap:.5em;font-size:12px;color:var(--ink-soft);line-height:1.45}
.adm .excal s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--sand);flex:0 0 auto}
.adm .excal b{color:var(--charcoal);font-weight:500;font-family:var(--mono)}
/* ficha */
.adm .exhero{position:relative;border-radius:var(--r);overflow:hidden;min-height:250px;display:flex;flex-direction:column;justify-content:flex-end;color:#fff}
.adm .exhero .ph{position:absolute;inset:0}
.adm .exhero .ph img{width:100%;height:100%;object-fit:cover}
.adm .exhero .ph::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,20,14,.2),rgba(18,20,14,.62) 52%,rgba(18,20,14,.9))}
.adm .exhero .in{position:relative;padding:20px 22px}
.adm .exhero .chip{background:rgba(20,22,16,.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.26);color:#fff}
.adm .exhero .chip .cd{background:var(--salvia)}
.adm .exhero h2{font-size:clamp(23px,3.4vw,32px);font-weight:200;letter-spacing:-.02em;line-height:1.08;margin:9px 0 4px}
.adm .exhero .sub{font-size:12.5px;color:rgba(255,255,255,.8)}
.adm .exhero .exsem{background:rgba(20,22,16,.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.24);color:#fff;max-width:max-content}
.adm .exhero .exsem s{color:var(--orange)}
.adm .exhero .exsem.si s{color:var(--salvia)}
.adm .exbar{display:flex;gap:9px;flex-wrap:wrap;margin:14px 0 24px}
/* banco de fotos */
.adm .exban{display:grid;gap:10px;grid-template-columns:repeat(2,1fr);margin-top:14px}
@media(min-width:560px){
  .adm .exban{grid-template-columns:repeat(5,1fr)}
}
.adm .exsl{border-radius:12px;overflow:hidden;position:relative;aspect-ratio:3/4;background:var(--panel);border:1px solid var(--line)}
.adm .exsl img{width:100%;height:100%;object-fit:cover;display:block}
.adm .exsl .tt{position:absolute;left:0;right:0;bottom:0;padding:7px 8px;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;color:#fff;background:linear-gradient(180deg,transparent,rgba(18,20,14,.82))}
.adm .exsl .n{position:absolute;top:7px;right:8px;font-family:var(--mono);font-size:10px;color:#fff;background:rgba(20,22,16,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:999px;padding:3px 7px}
.adm .exsl.vacia{border-style:dashed;border-color:rgba(255,93,54,.4);background:rgba(255,93,54,.05);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:10px}
.adm .exsl.vacia .lb{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;color:var(--charcoal)}
.adm .exsl.vacia .ad{font-family:var(--mono);font-size:11px;color:var(--orange)}
/* comunicación */
.adm .exkit{display:grid;gap:0;margin-top:12px}
.adm .exkit .r{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line);font-size:13px}
.adm .exkit .r:last-child{border-bottom:0}
.adm .exkit .r .m{font-family:var(--mono);font-size:14px}
.adm .exkit .r small{display:block;font-size:11.5px;color:var(--ink-soft);margin-top:2px}
/* dimensiones desplegadas */
.adm .exdim{display:grid;gap:0;margin-top:12px}
.adm .exdim .d{display:grid;grid-template-columns:10px 1fr auto;gap:12px;align-items:center;padding:11px 0;border-bottom:1px solid var(--line);font-size:13px}
.adm .exdim .d:last-child{border-bottom:0}
.adm .exdim .d i{width:8px;height:8px;border-radius:999px;background:var(--olive)}
.adm .exdim .d.half i{background:transparent;border:2px solid var(--dune)}
.adm .exdim .d.none i{background:transparent;border:1.5px solid var(--orange)}
.adm .exdim .d .g{line-height:1.4}
.adm .exdim .d .g small{display:block;font-size:11.5px;color:var(--ink-soft);margin-top:1px}
.adm .exdim .d.full .g{color:var(--ink-soft)}
/* trato */
.adm .extrato{display:flex;align-items:flex-start;gap:18px;flex-wrap:wrap;margin-top:14px}
.adm .extrato .pct{font-family:var(--mono);font-weight:200;font-size:44px;letter-spacing:-.03em;line-height:1}
.adm .extrato .g{flex:1;min-width:190px;font-size:12.5px;color:var(--ink-soft);line-height:1.6}
/* fechas · cierre discreto */
.adm .exfech{margin-top:24px;padding-top:16px;border-top:1px solid var(--line)}
.adm .exmir{display:flex;align-items:baseline;gap:.5em;font-size:12px;color:var(--ink-soft);line-height:1.5;margin:0 0 8px}
.adm .exmir s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--olive)}
.adm .exro{display:grid;grid-template-columns:1fr auto;gap:8px 14px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line);font-size:13px}
.adm .exro:last-child{border-bottom:0}
.adm .exro .dt{font-family:var(--mono);font-size:13px}
.adm .exro .sub{display:block;font-size:11.5px;color:var(--ink-soft);margin-top:2px}
.adm .exro .rt{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.adm .docnote{margin-top:44px;padding-top:18px;border-top:1px solid var(--line);font-size:12.5px;line-height:1.7;color:var(--ink-soft)}
.adm .docnote b{color:var(--charcoal);font-weight:600}
.adm .docnote .sl{color:var(--orange);font-family:var(--mono);font-weight:700}
@media(max-width:620px){
  .adm .pad{padding:16px 16px}
  .adm .exro{grid-template-columns:1fr}
  .adm .exro .rt{justify-content:flex-start}
}

/* ── COMUNIDAD · transcrito del entregable de Claude Design
   (design/comunidad/dc/comunidad.dc.html), prefijado con .adm.
   Si el diseño cambia, RE-EXTRAER con design/comunidad/transcribir-css.py —
   no editar a mano. Ese script cuenta llaves en vez de usar regex sobre el
   archivo entero: la versión con regex se detenía en la primera at-rule
   inesperada y perdía TODO lo que venía después, en silencio.
   Falla ruidosamente si pierde una sola regla. ── */
/* fases y etapas · el tablero baja, no se va de lado */
.adm .cmphase{display:flex;align-items:baseline;gap:14px;margin:34px 0 4px}
.adm .cmphase .t{font-size:11px;letter-spacing:var(--eb);text-transform:uppercase;color:var(--olive);font-weight:700;flex:0 0 auto}
.adm .cmphase .l{flex:1;height:1px;background:var(--line)}
.adm .cmphase .n{font-size:12px;color:var(--ink-soft);flex:0 0 auto}
.adm .cmstage{border-top:1px solid var(--line);padding:16px 0 20px}
.adm .cmstage-hd{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:13px}
.adm .cmstage-hd .no{font-family:var(--mono);font-size:12px;font-weight:700;color:var(--sand)}
.adm .cmstage-hd h3{font-size:16px;font-weight:400;letter-spacing:-.01em}
.adm .cmstage-hd .ct{font-family:var(--mono);font-size:12px;color:var(--ink-soft)}
.adm .cmstage-hd .how{margin-left:auto;font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;font-weight:600;padding:4px 10px;border-radius:999px;border:1px solid var(--line);color:var(--ink-soft);background:#fff}
.adm .cmstage-hd .how.auto{color:var(--olive-d);border-color:rgba(99,113,84,.3);background:rgba(99,113,84,.08)}
.adm .cmstage .gl{font-size:12.5px;color:var(--ink-soft);line-height:1.55;margin:-6px 0 13px;max-width:66ch}
.adm .cmcards{display:grid;gap:14px;grid-template-columns:1fr;align-items:start}
@media(min-width:780px){
  .adm .cmcards{grid-template-columns:1fr 1fr}
}
.adm .cmcards.one{grid-template-columns:1fr}
/* la tarjeta persona × salida */
.adm .cmc{border:1px solid var(--line);border-radius:var(--r);background:var(--cream);padding:15px 17px;box-shadow:var(--shadow)}
.adm .cmc .hd{display:flex;align-items:flex-start;gap:12px}
.adm .cmc .av{width:34px;height:34px;border-radius:999px;background:var(--salvia);color:var(--olive-d);display:inline-flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:11px;font-weight:700;flex:0 0 auto}
.adm .cmc .nm{flex:1;min-width:0}
.adm .cmc .nm b{display:block;font-size:15.5px;font-weight:500;letter-spacing:-.01em;line-height:1.25}
.adm .cmc .nm small{display:block;font-size:12px;color:var(--ink-soft);margin-top:3px;line-height:1.4}
.adm .cmc .nm small .sal{color:var(--olive-d);font-weight:500}
.adm .cmc .age{font-family:var(--mono);font-size:11px;color:var(--ink-soft);white-space:nowrap;flex:0 0 auto;padding-top:3px}
.adm .cmc .met{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}
.adm .cmtag{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;line-height:1;padding:5px 10px;border-radius:999px;border:1px solid var(--line);background:#fff;color:var(--ink-soft);white-space:nowrap}
.adm .cmtag .k{font-family:var(--mono);color:var(--charcoal);font-weight:700}
/* LA SIGUIENTE ACCIÓN · lo único que de verdad importa */
.adm .cmnext{display:flex;align-items:baseline;gap:.55em;margin-top:12px;padding:9px 12px;border-radius:10px;background:rgba(99,113,84,.1);font-size:13px;line-height:1.45;color:var(--olive-d)}
.adm .cmnext s{text-decoration:none;font-family:var(--mono);font-weight:700;flex:0 0 auto;color:var(--olive)}
.adm .cmnext b{font-family:var(--mono);font-weight:700;color:var(--charcoal)}
/* fría · tiene que verse mal */
.adm .cmc.cold{border-color:rgba(255,93,54,.5);background:linear-gradient(180deg,rgba(255,93,54,.07),rgba(255,93,54,0) 90px),var(--cream)}
.adm .cmc.cold .cmnext{background:rgba(255,93,54,.13);color:var(--charcoal);font-weight:500}
.adm .cmc.cold .cmnext s,.adm .cmc.cold .cmnext b{color:var(--orange)}
.adm .cmc.cold .age{color:var(--orange);font-weight:700}
/* caída · perder es un dato */
.adm .cmc.lost{background:var(--panel);box-shadow:none;border-style:dashed}
.adm .cmc.lost .av,.adm .cmc.lost .nm b{color:var(--ink-soft)}
.adm .cmc.lost .av{background:#fff}
.adm .cmc.lost .cmnext{background:#fff;border:1px solid var(--line);color:var(--ink-soft);font-style:italic}
.adm .cmc.lost .cmnext s{color:var(--sand)}
.adm .cmxp{margin-top:14px;padding-top:14px;border-top:1px solid var(--line)}
/* mensaje · canal y ventana */
.adm .cmch{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.adm .cmch button{font-size:12.5px;padding:8px 14px;border-radius:999px;border:1px solid var(--line);background:#fff;color:var(--ink-soft);min-height:38px;font-family:inherit;cursor:pointer}
.adm .cmch button.on{border-color:var(--olive);background:rgba(99,113,84,.1);color:var(--olive-d);font-weight:600}
.adm .cmwin{border:1px solid var(--line);border-radius:12px;background:#fff;overflow:hidden}
.adm .cmwin+.cmwin{margin-top:12px}
.adm .cmwin .wh{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border-bottom:1px solid var(--line);font-size:12px}
.adm .cmwin .wh .lb{font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;font-weight:700;color:var(--olive)}
.adm .cmwin .wh .cd{margin-left:auto;font-family:var(--mono);font-size:11.5px;color:var(--ink-soft)}
.adm .cmwin .wb{padding:14px}
.adm .cmwin .why{font-size:12px;color:var(--ink-soft);line-height:1.55;padding:0 14px 13px}
.adm .cmwin.open{border-color:rgba(99,113,84,.4)}
.adm .cmwin.open .wh{background:rgba(99,113,84,.08)}
.adm .cmwin.open .wh .cd{color:var(--olive-d);font-weight:700}
.adm .cmwin.locked .wh{background:var(--panel)}
.adm .cmwin.locked .wh .lb{color:var(--ink-soft)}
.adm .cmwin input,.adm .cmwin textarea{font-family:inherit;font-size:13px;width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:#fff;color:var(--charcoal);line-height:1.5;resize:vertical}
.adm .cmwin textarea{min-height:88px}
.adm .cmwin input+input,.adm .cmwin input+textarea{margin-top:9px}
.adm .cmwin textarea[disabled]{background:var(--panel);color:var(--sand);font-style:italic;cursor:not-allowed;min-height:52px}
/* la plantilla: se llenan huecos, no se redacta */
.adm .cmtpl{border:1px solid var(--line);border-radius:10px;background:var(--panel);padding:13px 14px;font-size:13.5px;line-height:2.05;color:var(--charcoal)}
.adm .cmslot{display:inline-flex;align-items:center;min-width:96px;padding:2px 10px;margin:0 2px;border-radius:7px;border:1px dashed rgba(255,93,54,.55);background:rgba(255,93,54,.08);font-family:var(--mono);font-size:12.5px;color:var(--charcoal)}
.adm .cmslot.empty{color:var(--orange);font-style:italic}
.adm .cmtpl .fx{color:var(--ink-soft)}
/* el reparto de la liga · un trabajo, tres destinos */
.adm .cmfan{display:grid;gap:0;margin-top:14px;border-top:1px solid var(--line);padding-top:4px}
.adm .cmfan .r{display:grid;grid-template-columns:22px 1fr;gap:12px;padding:11px 0;border-bottom:1px solid var(--line);font-size:13px;line-height:1.45}
.adm .cmfan .r:last-child{border-bottom:0}
.adm .cmfan .r .no{font-family:var(--mono);font-size:11px;font-weight:700;color:var(--orange);padding-top:2px}
.adm .cmfan .r small{display:block;font-size:12px;color:var(--ink-soft);margin-top:3px;line-height:1.5}
.adm .cmfan .r .two{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}
/* agenda propia */
.adm .cmag{display:grid;grid-template-columns:74px 1fr auto;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line);font-size:13px}
.adm .cmag:last-child{border-bottom:0}
.adm .cmag .dy{font-family:var(--mono);font-size:12px;line-height:1.35}
.adm .cmag .dy b{display:block;font-size:19px;font-weight:300;letter-spacing:-.02em;color:var(--charcoal)}
.adm .cmag .g{min-width:0;line-height:1.4}
.adm .cmag .g small{display:block;font-size:12px;color:var(--ink-soft);margin-top:2px}
.adm .cmag .rt{display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
/* mensajes programados · por día */
.adm .cmt{display:grid;grid-template-columns:96px 1fr auto;gap:14px;align-items:center;padding:11px 0;border-bottom:1px solid var(--line);font-size:13px}
.adm .cmt:last-child{border-bottom:0}
.adm .cmt .wn{font-family:var(--mono);font-size:12px;color:var(--ink-soft);line-height:1.35}
.adm .cmt .g small{display:block;font-size:12px;color:var(--ink-soft);margin-top:2px;line-height:1.45}
.adm .cmt.sent{color:var(--ink-soft)}
.adm .cmt.sent .g b{font-weight:400}
.adm .cmt .sg{font-family:var(--mono);font-size:11.5px;white-space:nowrap;font-weight:700}
.adm .cmt.sent .sg{color:var(--olive)}
.adm .cmt.wait .sg{color:var(--sand)}
/* la gente · grupos como deuda, no como estadística */
.adm .cmgrp{border:1px solid var(--line);border-radius:var(--r);background:var(--cream);box-shadow:var(--shadow);overflow:hidden}
.adm .cmgrp+.cmgrp{margin-top:14px}
.adm .cmgrp>.hd{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:16px 18px}
.adm .cmgrp>.hd .g{flex:1;min-width:220px}
.adm .cmgrp>.hd .ph{font-size:17px;font-weight:400;letter-spacing:-.01em;line-height:1.3}
.adm .cmgrp>.hd .ph b{font-family:var(--mono);font-weight:700;color:var(--orange)}
.adm .cmgrp>.hd .ph .cool{color:var(--olive-d)}
.adm .cmgrp>.hd small{display:block;font-size:12.5px;color:var(--ink-soft);margin-top:4px;line-height:1.5;max-width:62ch}
.adm .cmgrp>.hd .rt{display:flex;gap:11px;align-items:center;flex-wrap:wrap}
.adm .cmgrp>.hd .chev2{color:var(--olive);font-size:14px;margin-left:0}
.adm .cmgrp.owe{border-color:rgba(255,93,54,.42)}
.adm .cmgrp.owe>.hd{background:rgba(255,93,54,.06)}
.adm .cmgrp .bd{padding:0 18px}
.adm .cmgrp .bd .in{padding:15px 0 18px;border-top:1px solid var(--line)}
/* la meta · no es un dato */
.adm .cmgoal{border:1px solid rgba(99,113,84,.32);border-radius:var(--r);background:rgba(99,113,84,.07);padding:18px}
.adm .cmgoal .ph{font-size:17px;font-weight:400;line-height:1.3}
.adm .cmgoal .ph b{font-family:var(--mono);font-weight:700;color:var(--olive)}
.adm .cmgoal .prog{margin-top:14px}
.adm .cmgoal small{display:block;font-size:12.5px;color:var(--ink-soft);margin-top:11px;line-height:1.55;max-width:60ch}
/* ficha de persona */
.adm .cmficha{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:17px 18px;margin-top:12px}
.adm .cmficha .top{display:flex;align-items:flex-start;gap:13px;flex-wrap:wrap}
.adm .cmficha .av{width:40px;height:40px;border-radius:999px;background:var(--salvia);color:var(--olive-d);display:inline-flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:12.5px;font-weight:700;flex:0 0 auto}
.adm .cmficha .top .g{flex:1;min-width:170px}
.adm .cmficha .top .g b{display:block;font-size:18px;font-weight:400;letter-spacing:-.01em}
.adm .cmficha .top .g small{display:block;font-family:var(--mono);font-size:12px;color:var(--ink-soft);margin-top:4px;line-height:1.6}
.adm .cmtrip{display:grid;grid-template-columns:1fr auto;gap:6px 14px;align-items:baseline;padding:9px 0;border-bottom:1px solid var(--line);font-size:13px}
.adm .cmtrip:last-child{border-bottom:0}
.adm .cmtrip .dt{font-family:var(--mono);font-size:12px;color:var(--ink-soft);display:block;margin-top:2px}
.adm .cmtrip .mn{font-family:var(--mono);font-size:13.5px}
.adm .hole{display:inline-block;min-width:52px;border-bottom:1px dashed var(--sand);color:var(--sand);font-family:var(--mono);font-size:12px}
@media(max-width:620px){
  .adm .cmag,.adm .cmt{grid-template-columns:1fr;row-gap:7px}
  .adm .cmag .rt{justify-content:flex-start}
}
/* la cabecera de la pantalla se queda fija */
.adm .cmstick{position:sticky;top:var(--ahead-h);z-index:30;background:var(--bg);padding:18px 0 12px;border-bottom:1px solid var(--line);margin-bottom:18px}
.adm .cmstick .sec-head{margin-bottom:0}
.adm .cmseg{display:inline-flex;gap:0;margin-top:14px;padding:3px;border-radius:999px;background:var(--panel);border:1px solid var(--line)}
.adm .cmseg button{font-family:inherit;font-size:12.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;padding:9px 22px;border-radius:999px;border:0;background:transparent;color:var(--ink-soft);cursor:pointer;min-height:40px}
.adm .cmseg button.on{background:var(--charcoal);color:#fff}
.adm .cmseg .ct{font-family:var(--mono);font-weight:400;letter-spacing:0;text-transform:none;margin-left:7px;opacity:.6}
/* tablero + panel · el scroll vive adentro */
.adm .cmwrap{display:flex;gap:0;align-items:stretch}
.adm .cmboard{flex:1;min-width:0;overflow-x:auto;overflow-y:hidden;padding-bottom:14px;scrollbar-width:thin}
/* ── EL TABLERO SANGRA HASTA LOS BORDES DE LA VENTANA ──────────────────────
   Vivía dentro de .page (máximo 1200px) mientras la navegación de arriba
   abarca la ventana entera. El resultado: media columna cortada en los dos
   extremos, que no se lee como «hay más si deslizas» sino como un recorte mal
   hecho — y hace que columnas idénticas de 280px parezcan de tamaños
   distintos.

   El margin-inline negativo estira la caja hasta los bordes; el
   padding-inline del mismo tamaño devuelve el margen de la página, así que
   la PRIMERA columna sigue alineada con el título y con las cifras de arriba.
   Nada se mueve de sitio: sólo deja de cortarse.

   ⚠️ El scroll sigue encerrado aquí dentro. La página no se desliza de lado. */
.adm .cmboard{margin-inline:calc(50% - 50vw);padding-inline:calc(50vw - 50%);scroll-padding-inline:calc(50vw - 50%);}
/* Y el último renglón de columnas necesita aire al final: sin esto la última
   se pega al borde y tampoco se ve que terminó. */
.adm .cmtrack{padding-right:22px;}
.adm .cmboard::-webkit-scrollbar{height:9px}
.adm .cmboard::-webkit-scrollbar-track{background:var(--panel);border-radius:999px}
.adm .cmboard::-webkit-scrollbar-thumb{background:var(--sand);border-radius:999px}
.adm .cmtrack{display:flex;gap:14px;align-items:flex-start;min-width:max-content;padding:2px}
.adm .cmcol{flex:0 0 280px;display:flex;flex-direction:column;border-radius:14px;border:1px solid var(--line);background:rgba(251,251,247,.55);padding:13px 12px 14px}
.adm .cmcol-hd{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;padding-bottom:11px;border-bottom:1px solid var(--line);margin-bottom:12px}
.adm .cmcol-hd .no{font-family:var(--mono);font-size:11px;font-weight:700;color:var(--sand)}
.adm .cmcol-hd h3{font-size:13.5px;font-weight:500;letter-spacing:-.005em}
.adm .cmcol-hd .ct{font-family:var(--mono);font-size:11.5px;color:var(--ink-soft);margin-left:auto}
.adm .cmcol-hd .how{flex:1 0 100%;font-size:10px;letter-spacing:.09em;text-transform:uppercase;font-weight:600;color:var(--ink-soft);margin-top:5px}
.adm .cmcol-hd .how.auto{color:var(--olive)}
.adm .cmcol-bd{display:flex;flex-direction:column;gap:11px;min-height:76px}
/* columnas que sólo reciben */
.adm .cmcol.recv{background:var(--panel)}
.adm .cmcol.recv .cmcol-hd{border-bottom-style:dashed}
.adm .cmcol .src{font-size:11.5px;color:var(--ink-soft);line-height:1.5;margin-top:11px;padding-top:10px;border-top:1px dashed var(--line)}
.adm .cmcol .src s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--sand);margin-right:.45em}
/* estados de arrastre */
.adm .cmcol.can{border-color:var(--olive);border-style:dashed;background:rgba(99,113,84,.1)}
.adm .cmcol.can .cmcol-hd h3{color:var(--olive-d)}
.adm .cmcol.cant{background:var(--panel)}
.adm .cmcol.cant .cmcol-hd{opacity:.5}
.adm .cmcol.cant .cmcol-bd{opacity:.4}
.adm .cmcol .nodrop{display:flex;align-items:baseline;gap:.5em;font-size:11.5px;line-height:1.5;color:var(--ink-soft);margin-bottom:11px;padding:9px 11px;border-radius:10px;background:#fff;border:1px solid var(--line)}
.adm .cmcol .nodrop s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--sand)}
.adm .cmghost{border:1px dashed var(--sand);border-radius:var(--r);background:rgba(182,173,165,.1);min-height:104px;display:flex;align-items:center;justify-content:center;font-size:11.5px;color:var(--sand);font-family:var(--mono)}
.adm .cmghost.tgt{border-color:var(--olive);background:rgba(99,113,84,.1);color:var(--olive-d)}
/* la tarjeta dentro de la columna */
.adm .cmcol .cmc{padding:12px 13px;box-shadow:none;cursor:pointer}
.adm .cmcol .cmc:hover{border-color:rgba(99,113,84,.4)}
.adm .cmcol .cmc .av{width:28px;height:28px;font-size:10px}
.adm .cmcol .cmc .nm b{font-size:14px}
.adm .cmcol .cmc .nm small{font-size:11.5px}
.adm .cmcol .cmc .age{font-size:10.5px;padding-top:2px}
.adm .cmcol .cmc .met{margin-top:9px;gap:5px}
.adm .cmcol .cmc .cmtag{font-size:11px;padding:4px 9px}
.adm .cmcol .cmc .cmnext{margin-top:10px;padding:8px 10px;font-size:12px}
.adm .cmcol.recv .cmc{cursor:default}
.adm .cmcol.recv .cmc:hover{border-color:rgba(99,113,84,.4)}
/* asa de arrastre · sólo en las tres primeras */
.adm .cmgrip{display:flex;flex-direction:column;gap:3px;padding:4px 2px;flex:0 0 auto;cursor:grab}
.adm .cmgrip i{display:block;width:11px;height:1.5px;border-radius:999px;background:var(--sand)}
.adm .cmc:hover .cmgrip i{background:var(--olive)}
/* siendo arrastrada */
.adm .cmc.drag{transform:rotate(-1.6deg) scale(1.015);box-shadow:0 26px 50px -20px rgba(32,33,28,.55);border-color:var(--olive);cursor:grabbing;position:relative;z-index:5}
.adm .cmc.drag .cmgrip{cursor:grabbing}
.adm .cmc.drag .cmgrip i{background:var(--olive)}
/* abierta en el panel */
.adm .cmc.picked{border-color:var(--charcoal);box-shadow:0 0 0 1px var(--charcoal)}
.adm .cmc.picked .nm b{color:var(--charcoal)}
/* la séptima columna · colapsada */
.adm .cmcol.lost{flex:0 0 60px;padding:13px 8px;align-items:center;background:var(--panel)}
.adm .cmcol.lost .vt{writing-mode:vertical-rl;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:var(--ink-soft);white-space:nowrap;margin-top:8px}
.adm .cmcol.lost .n{font-family:var(--mono);font-size:12px;color:var(--sand)}
.adm .cmcol.lost .cv{font-size:12px;color:var(--sand);margin-bottom:8px}
.adm .cmcol.lost.open{flex:0 0 280px;padding:13px 12px;align-items:stretch}
.adm .cmcol.lost.open .vt{writing-mode:horizontal-tb;margin-top:0}
/* el panel lateral */
.adm .cmpanel{flex:0 0 420px;align-self:flex-start;position:sticky;top:calc(var(--ahead-h) + var(--stick-h) + 12px);max-height:calc(100vh - var(--ahead-h) - var(--stick-h) - 30px);display:flex;flex-direction:column;border:1.5px solid rgba(32,33,28,.22);border-radius:var(--r);background:#fff;margin-left:-22px;z-index:6;box-shadow:-20px 0 44px -24px rgba(32,33,28,.5),0 34px 70px -26px rgba(32,33,28,.45);overflow:hidden}
.adm .cmpanel-hd{display:flex;align-items:flex-start;gap:12px;padding:16px 17px;border-bottom:1px solid var(--line);background:#fff}
.adm .cmpanel-hd .av{width:36px;height:36px;border-radius:999px;background:var(--salvia);color:var(--olive-d);display:inline-flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:11.5px;font-weight:700;flex:0 0 auto}
.adm .cmpanel-hd .g{flex:1;min-width:0}
.adm .cmpanel-hd .g b{display:block;font-size:16.5px;font-weight:500;letter-spacing:-.01em;line-height:1.25}
.adm .cmpanel-hd .g small{display:block;font-size:11.5px;color:var(--ink-soft);margin-top:3px;line-height:1.45}
.adm .cmpanel-hd .g small .sal{color:var(--olive-d);font-weight:500}
.adm .cmpanel-hd .x{font-family:inherit;font-size:16px;line-height:1;color:var(--ink-soft);background:transparent;border:1px solid var(--line);border-radius:999px;width:30px;height:30px;cursor:pointer;flex:0 0 auto}
.adm .cmpanel-st{display:flex;align-items:center;gap:9px;padding:10px 17px;border-bottom:1px solid var(--line);font-size:11px;letter-spacing:.09em;text-transform:uppercase;font-weight:700;color:var(--olive)}
.adm .cmpanel-st .n{font-family:var(--mono);color:var(--sand)}
.adm .cmpanel-st .mv{margin-left:auto;font-size:10px;letter-spacing:.08em;color:var(--ink-soft);font-weight:600}
.adm .cmpanel-bd{padding:16px 17px 20px;overflow-y:auto;flex:1}
.adm .cmpanel-bd .xh4:first-child{margin-top:0}
.adm .cmpanel .cmwin input,.adm .cmpanel .cmwin textarea{font-size:12.5px}
.adm .cmpanel .cmtpl{font-size:12.5px;line-height:1.95}
.adm .cmpanel .dl{font-size:12.5px}
.adm .lam{margin:52px 0 0;padding-top:22px;border-top:1px solid rgba(32,33,28,.2)}
@media(max-width:1180px){
  .adm .cmpanel{flex:0 0 380px}
}
@media(max-width:980px){
  .adm .cmwrap{flex-direction:column;gap:18px}
  .adm .cmpanel{margin-left:0}
  .adm .cmpanel{flex:1 1 auto;width:100%;position:static;max-height:none}
}
/* ══ NUEVO EN v3 · los textos que salen ══ */
.adm .cmpanel.wide{flex:1 1 auto;position:static;max-height:none;max-width:820px;margin-left:0;box-shadow:var(--shadow)}
.adm .cmtx{font-size:13px;line-height:2;color:var(--charcoal)}
.adm .cmdb{background:rgba(99,113,84,.13);border-bottom:1px solid rgba(99,113,84,.45);padding:1px 6px;border-radius:5px}
.adm .cmdb.va{color:var(--olive-d);font-style:italic;background:rgba(99,113,84,.07)}
.adm .cmsrc{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:12px;padding-top:11px;border-top:1px dashed var(--line);font-size:11px;color:var(--ink-soft)}
.adm .cmsrc s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--olive)}
.adm .cmsrc .p{display:inline-flex;align-items:center;gap:5px;font-family:var(--mono);font-size:10.5px;padding:3px 9px;border-radius:999px;background:rgba(99,113,84,.1);color:var(--olive-d)}
.adm .cmmact{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}
.adm .cmstop{display:flex;gap:.6em;align-items:baseline;margin-top:13px;padding:11px 13px;border-radius:10px;background:rgba(255,93,54,.1);border:1px solid rgba(255,93,54,.4);font-size:12.5px;line-height:1.6}
.adm .cmstop s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--orange);flex:0 0 auto}
.adm .cmstop b{font-weight:600}
.adm .cmfill{margin-top:12px;padding:12px 13px;border:1px solid var(--line);border-radius:10px;background:var(--panel)}
.adm .cmfill .lb{font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--olive);display:block;margin-bottom:7px}
.adm .cmfill p{font-size:12px;color:var(--ink-soft);line-height:1.55}
/* el calendario · dos estados */
.adm .cmconn{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:12px;padding:13px 14px;border:1px solid rgba(99,113,84,.32);border-radius:12px;background:rgba(99,113,84,.07);font-size:12.5px;line-height:1.55;color:var(--olive-d)}
.adm .cmconn .g{flex:1 1 210px}
.adm .cmconn b{color:var(--charcoal);font-weight:600}
.adm .cmauto{display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:9px 12px;border:1px solid rgba(99,113,84,.3);border-radius:10px;background:rgba(99,113,84,.07);font-family:var(--mono);font-size:11.5px;color:var(--olive-d)}
.adm .cmauto .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* ══ NUEVO EN v3 · GENTE, la biblioteca ══ */
.adm .gnf.on{border-color:var(--olive);background:rgba(99,113,84,.1);color:var(--olive-d);font-weight:600}
.adm .gnf.on .n,.adm .gnf.on .cv{color:var(--olive)}
.adm .gntags{display:flex;gap:6px;flex-wrap:wrap}
.adm .gntag{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;padding:4px 11px;border-radius:999px;background:rgba(28,111,106,.1);color:var(--lagoon);border:1px solid rgba(28,111,106,.22)}
.adm .gntag .x{color:rgba(28,111,106,.5);font-size:12px;line-height:1;cursor:pointer}
.adm .gntag.add{background:transparent;border-style:dashed;border-color:var(--sand);color:var(--ink-soft);cursor:pointer}
.adm .gnfalta{display:inline-flex;align-items:center;gap:7px;font-size:12px;color:var(--sand);font-style:italic}
.adm .gnnew{display:flex;gap:.55em;align-items:baseline;margin-top:12px;padding:10px 12px;border-radius:10px;background:var(--panel);border:1px solid var(--line);font-size:12.5px;line-height:1.55;color:var(--ink-soft)}
.adm .gnnew s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--sand);flex:0 0 auto}
.adm .gnnew b{color:var(--charcoal);font-weight:600}
.adm .gnmeta{display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:12.5px;color:var(--ink-soft)}
.adm .gnficha{background:#fff}
.adm .gnficha .top .g small{font-family:var(--mono)}
.adm .gnhint{font-size:12px;color:var(--ink-soft);line-height:1.55;margin-top:8px;max-width:52ch}
/* ══ v3.1 · EL PANEL COMO CAPA ══ */
.adm .cmstage{position:relative;margin:0 -26px;height:660px;overflow:hidden;background:var(--bg);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.adm .cmstage>.cmboard{position:absolute;inset:0;padding:18px 0 18px 26px;overflow-x:auto;overflow-y:hidden}
.adm .cmstage>.cmboard>.cmtrack{align-items:flex-start}
.adm .cmveil{position:absolute;inset:0;z-index:4;background:rgba(32,33,28,.34);cursor:pointer;transition:background .2s}
.adm .cmveil:hover{background:rgba(32,33,28,.4)}
.adm .cmveil span{position:absolute;left:26px;bottom:16px;font-size:10px;letter-spacing:.16em;text-transform:uppercase;font-weight:600;color:rgba(255,255,255,.82)}
.adm .cmstage .cmc.picked{position:relative;z-index:6;background:#fff;box-shadow:0 0 0 1px var(--charcoal),0 0 0 10px rgba(251,251,247,.5),0 18px 34px -20px rgba(32,33,28,.5)}
/* el panel: pegado al borde derecho, de alto completo, opaco */
.adm .cmpanel.layer{position:absolute;top:0;right:0;bottom:0;left:auto;z-index:8;flex:none;width:min(580px,52%);height:100%;max-height:none;margin:0;background:#fff;border:1px solid rgba(32,33,28,.2);border-right:0;border-radius:20px 0 0 20px;box-shadow:-34px 0 70px -22px rgba(32,33,28,.55),-3px 0 0 rgba(32,33,28,.06);overflow:hidden}
.adm .cmpanel.layer .cmpanel-hd{flex:0 0 auto;position:relative;z-index:2;background:#fff;border-bottom:1px solid rgba(32,33,28,.18);padding:17px 20px}
.adm .cmpanel.layer .cmpanel-st{flex:0 0 auto;position:relative;z-index:2;background:rgba(99,113,84,.07);padding:11px 20px}
.adm .cmpanel.layer .cmpanel-bd{padding:18px 20px 46px;scrollbar-width:thin}
.adm .cmpanel.layer .cmpanel-bd::-webkit-scrollbar{width:9px}
.adm .cmpanel.layer .cmpanel-bd::-webkit-scrollbar-track{background:var(--panel)}
.adm .cmpanel.layer .cmpanel-bd::-webkit-scrollbar-thumb{background:var(--sand);border-radius:999px}
.adm .cmpanel .fade{position:absolute;left:0;right:0;bottom:0;height:56px;background:linear-gradient(180deg,rgba(255,255,255,0),#fff 78%);pointer-events:none;z-index:3}
.adm .cmpanel-hd .esc{align-self:center;font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;color:var(--sand);border:1px solid var(--line);border-radius:6px;padding:3px 6px;flex:0 0 auto}
.adm .cmstage.shut .cmpanel,.adm .cmstage.shut .cmveil{display:none}
.adm .cmreopen{position:absolute;right:26px;bottom:18px;z-index:9;display:none}
.adm .cmstage.shut .cmreopen{display:inline-flex}
@media(max-width:980px){
  .adm .cmpanel.layer{width:86%}
}
/* v3.2 · el mensaje se despliega en su renglón */
.adm .cmmi{border-bottom:1px solid var(--line)}
.adm .cmmi:last-of-type{border-bottom:0}
.adm .cmmi .cmt{border-bottom:0;cursor:pointer;align-items:center}
.adm .cmmi .cmt:hover .g b{color:var(--olive-d)}
.adm .cmmi.open .cmt{padding-bottom:4px}
.adm .cmmi.mio .cmt{background:rgba(201,183,156,.16);border-radius:9px;padding-left:9px;padding-right:9px;margin:4px 0}
.adm .cmmi.off .cmt .g,.adm .cmmi.off .cmt .wn{opacity:.55}
.adm .cmmi.off .cmt .sg{color:var(--sand)}
.adm .cmmi.falta .cmt .sg{color:var(--orange)}
.adm .cmmi.falta .cmt .g b{color:var(--charcoal)}
.adm .cmpen{border:0;background:transparent;padding:3px;color:var(--sand);display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;line-height:0}
.adm .cmpen svg{width:13px;height:13px;display:block}
.adm .cmpen:hover{color:var(--olive)}
.adm .cmmi.edit .cmpen{color:var(--olive)}
.adm .cmmi.open{background:var(--bg);border:1px solid rgba(32,33,28,.18);border-radius:12px;margin:7px 0;padding:0 11px}
.adm .cmmi.open .cmt{background:transparent}
.adm .cmmi.open .cmfill,.adm .cmmi.open .cmtx{background:#fff}
.adm .cmmi.open .cmfill{border-color:rgba(32,33,28,.16)}
.adm .cmmi.open.mio{background:rgba(201,183,156,.3);border-color:rgba(201,183,156,.85)}
.adm .cmmi.open.mio .cmt{background:transparent;margin:0;padding-left:0;padding-right:0}
.adm .cmdrop{display:none;padding:2px 0 14px}
.adm .cmmi.open .cmdrop{display:block}
.adm .cmmi.edit .cmtx{background:var(--panel);border:1px solid var(--olive);border-radius:9px;padding:11px 12px;outline:none}
.adm .cmedit{display:none;gap:7px;flex-wrap:wrap;margin-top:11px}
.adm .cmmi.edit .cmedit{display:flex}
.adm .cmmi.edit .cmsrc,.adm .cmmi.edit .cmmact{opacity:.45}
/* v3.4 · la lista: cuatro columnas, encabezados que ordenan */
.adm .gnhead{display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;margin-bottom:12px}
.adm .gnpills{display:flex;gap:2px;flex-wrap:wrap;align-items:center}
.adm .gnp{display:inline-flex;align-items:center;gap:7px;height:38px;font-family:inherit;font-size:12.5px;padding:0 14px;border-radius:999px;border:1px solid transparent;background:transparent;color:var(--ink-soft);cursor:pointer}
.adm .gnp .n{font-family:var(--mono);font-size:11px;color:var(--sand)}
.adm .gnp:hover{background:rgba(32,33,28,.045)}
.adm .gnp.on{background:rgba(99,113,84,.13);border-color:rgba(99,113,84,.3);color:var(--olive-d);font-weight:600}
.adm .gnp.on .n{color:var(--olive)}
.adm .gntools{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.adm .gntools input[type=search]{font-family:inherit;font-size:13px;height:38px;padding:0 15px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--charcoal);min-width:210px}
.adm .gntools input[type=search]:focus{outline:none;border-color:var(--olive);box-shadow:0 0 0 3px rgba(99,113,84,.15)}
.adm .gntools .mas{display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 14px;font-family:inherit;font-size:12.5px;color:var(--ink-soft);background:#fff;border:1px solid var(--line);border-radius:999px;cursor:pointer}
.adm .gntools .mas:hover{border-color:var(--olive);color:var(--olive-d)}
.adm .gntools .mas s{text-decoration:none;font-size:9px;color:var(--sand)}
/* la línea que convierte el dato sucio en tarea */
.adm .gnfix{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 12px;padding:10px 16px;border:1px dashed rgba(99,113,84,.45);border-radius:12px;background:rgba(99,113,84,.06);font-size:12.5px;color:var(--olive-d);line-height:1.5}
.adm .gnfix s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--orange);flex:0 0 auto}
.adm .gnfix .g{flex:1 1 220px}
.adm .gnfix b{color:var(--charcoal);font-weight:600}
.adm .gnuv{display:flex;align-items:center;gap:11px;padding:9px 0;border-bottom:1px solid var(--line);font-size:13px;cursor:pointer}
.adm .gnuv:last-of-type{border-bottom:0}
.adm .gnuv .rd{width:14px;height:14px;border-radius:999px;border:1px solid var(--sand);flex:0 0 auto}
.adm .gnuv.on .rd{background:var(--olive);border-color:var(--olive);box-shadow:inset 0 0 0 2.5px #fff}
.adm .gnuv.on{font-weight:500}
.adm .gnuv .n{margin-left:auto;font-family:var(--mono);font-size:11.5px;color:var(--ink-soft)}
.adm .gnuv .wr{color:var(--ink-soft)}
/* la lista */
.adm .gnlist{border:1px solid var(--line);border-radius:14px;background:#fff;overflow:hidden}
.adm .gnlist .gnhd,.adm .gnlist .gnr{display:grid;grid-template-columns:32px minmax(150px,1.15fr) minmax(0,1.4fr) 64px;gap:14px;align-items:center}
.adm .gnlist.contags .gnhd,.adm .gnlist.contags .gnr{grid-template-columns:32px minmax(140px,1fr) minmax(0,.92fr) minmax(0,1.12fr) 64px}
.adm .gnhd{padding:10px 15px;border-bottom:1px solid var(--line);background:rgba(251,251,247,.75)}
.adm .gnhd span,.adm .gnsort{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--sand);line-height:1}
.adm .gnhd .r{text-align:right}
.adm .gnsort{display:inline-flex;align-items:center;gap:6px;font-family:inherit;background:transparent;border:0;padding:0;cursor:pointer}
.adm .gnsort:hover{color:var(--olive)}
.adm .gnsort.on{color:var(--olive-d)}
.adm .gnsort s{text-decoration:none;font-size:10px;opacity:0;transition:opacity .15s}
.adm .gnsort.on s,.adm .gnsort:hover s{opacity:1}
.adm .gnr{padding:5px 15px;min-height:46px;border-bottom:1px solid var(--line);cursor:pointer;transition:background .12s}
.adm .gnr:last-child{border-bottom:0}
.adm .gnr:hover{background:rgba(99,113,84,.05)}
.adm .gnr .av{width:32px;height:32px;border-radius:999px;background:var(--salvia);color:var(--olive-d);display:inline-flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:10.5px;font-weight:700}
.adm .gnr .who{min-width:0}
.adm .gnr .who b{display:block;font-size:14px;font-weight:500;letter-spacing:-.01em;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.adm .gnr .who small{display:block;font-size:11px;color:var(--ink-soft);line-height:1.3;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.adm .gnr .tags{display:flex;gap:5px;min-width:0;flex-wrap:nowrap;align-items:center}
.adm .gnr .tags .gntag{font-size:10.5px;padding:2px 9px;white-space:nowrap;display:block;flex:0 0 auto}
.adm .gnr .tags .gntag.mas{position:relative;background:transparent;border-color:var(--sand);color:var(--ink-soft);font-family:var(--mono);font-size:10px;overflow:visible}
.adm .gnr .tags .gntag.mas .tip{display:none;position:absolute;left:0;top:calc(100% + 7px);white-space:nowrap;background:var(--charcoal);color:#fff;font-family:"Geist",system-ui,sans-serif;font-size:11px;letter-spacing:0;padding:6px 10px;border-radius:8px;z-index:20}
.adm .gnr .tags .gntag.mas:hover .tip{display:block}
.adm .gnr .hist{font-size:12px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.adm .gnr .hist b{font-family:var(--mono);font-weight:700}
.adm .gnr .hist i{font-style:normal;color:var(--ink-soft)}
.adm .gnr .hist u{text-decoration:none;font-family:var(--mono);font-size:11px;color:var(--sand)}
.adm .gnr .hist.no em{font-style:italic;color:var(--charcoal);font-weight:400}
.adm .gnr .ic{display:flex;gap:14px;justify-content:flex-end;color:var(--olive-d)}
.adm .gnr .ic span{position:relative;display:block}
.adm .gnr .ic svg{width:17px;height:17px;display:block}
.adm .gnr .ic .off{color:var(--sand)}
.adm .gnr .ic .off::after{content:"";position:absolute;left:-2px;right:-2px;top:50%;height:1.25px;background:var(--sand);transform:rotate(-40deg)}
.adm .gnr.picked{position:relative;z-index:6;background:#fff;box-shadow:0 0 0 1px var(--charcoal),0 14px 30px -22px rgba(32,33,28,.5)}
.adm .gnmore{padding:12px 15px;font-family:var(--mono);font-size:11.5px;color:var(--sand);border-top:1px solid var(--line);background:rgba(251,251,247,.6);cursor:pointer}
.adm .gnmore:hover{color:var(--olive)}
.adm .cmstage>.gnstack{position:absolute;inset:0;padding:18px 26px;overflow:hidden}
@media(max-width:1040px){
  .adm .gnlist .gnhd,.adm .gnlist .gnr{grid-template-columns:32px minmax(130px,1fr) minmax(0,1.3fr) 64px}
  .adm .gnlist.contags .gnhd,.adm .gnlist.contags .gnr{grid-template-columns:32px minmax(120px,1fr) minmax(0,.9fr) minmax(0,1.1fr) 64px}
}
/* v3.5 · el presente del CRM en el renglón, y los cumpleaños */
.adm .gnr .who .nmline{display:flex;align-items:center;gap:8px;min-width:0}
.adm .gnr .who .nmline b{min-width:0}
.adm .gnst{position:relative;display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;padding:3px 8px;border-radius:5px;background:rgba(99,113,84,.14);color:var(--olive-d);white-space:nowrap}
.adm .gnst .d{width:5px;height:5px;border-radius:999px;background:var(--olive);flex:0 0 auto}
.adm .gnst .s{font-size:10px;font-weight:400;letter-spacing:.01em;text-transform:none;opacity:.8}
.adm .gnst.caida{background:rgba(32,33,28,.07);color:var(--ink-soft)}
.adm .gnst.caida .d{background:var(--sand)}
.adm .gnr .gnst .tip{display:none;position:absolute;left:0;top:calc(100% + 7px);white-space:nowrap;background:var(--charcoal);color:#fff;font-family:"Geist",system-ui,sans-serif;font-size:11px;font-weight:400;letter-spacing:0;text-transform:none;padding:6px 10px;border-radius:8px;z-index:20}
.adm .gnr .gnst:hover .tip{display:block}
.adm .gnlist.conest .gnhd,.adm .gnlist.conest .gnr{grid-template-columns:32px minmax(210px,1.5fr) minmax(0,1.12fr) 64px}
.adm .gnlist.conest.contags .gnhd,.adm .gnlist.conest.contags .gnr{grid-template-columns:32px minmax(200px,1.4fr) minmax(0,.82fr) minmax(0,1fr) 64px}
/* la banda de cumpleaños · buena noticia, no alerta */
.adm .gncum{border:1.5px solid rgba(255,93,54,.6);border-radius:14px;background:linear-gradient(180deg,rgba(201,183,156,.2),rgba(201,183,156,.07));padding:14px 17px;margin-bottom:14px}
.adm .gncum .lb{font-size:10px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:#8a6d1f;display:flex;align-items:center;gap:.5em}
.adm .gncum .lb s{text-decoration:none;font-family:var(--mono);color:var(--orange)}
.adm .gncum .hoy,.adm .gnpa .hoy{display:flex;align-items:center;gap:13px;flex-wrap:wrap;margin-top:11px}
.adm .gncum .hoy .av,.adm .gnpa .hoy .av{width:40px;height:40px;border-radius:999px;background:var(--salvia);color:var(--olive-d);display:inline-flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:12px;font-weight:700;flex:0 0 auto}
.adm .gncum .hoy .g,.adm .gnpa .hoy .g{min-width:0;flex:1 1 180px}
.adm .gncum .hoy .g b,.adm .gnpa .hoy .g b{display:block;font-size:16px;font-weight:500;letter-spacing:-.01em}
.adm .gncum .hoy .g small,.adm .gnpa .hoy .g small{display:block;font-size:12px;color:var(--ink-soft);margin-top:2px}
.adm .gncum .hoy .rt,.adm .gnpa .hoy .rt{display:flex;gap:8px;flex-wrap:wrap}
.adm .gncum .nx{display:flex;gap:26px;flex-wrap:wrap;margin-top:13px;padding-top:12px;border-top:1px solid rgba(32,33,28,.13)}
.adm .gncum .nx .grp{min-width:160px}
.adm .gncum .nx .t{font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;font-weight:700;color:var(--olive);display:block;margin-bottom:6px}
.adm .gncum .nx .p{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;margin:0 14px 4px 0}
.adm .gncum .nx .p .dt{font-family:var(--mono);font-size:11px;color:var(--sand)}
.adm .gncum.solo{background:rgba(201,183,156,.1);border-color:rgba(255,93,54,.45)}
.adm .gncum.solo .nx{margin-top:9px;padding-top:0;border-top:0}
/* capturar el cumpleaños desde la ficha */
.adm .gncap{display:inline-flex;align-items:center;gap:9px;flex-wrap:wrap;font-size:12.5px;color:var(--ink-soft)}
.adm .gncap input{font-family:var(--mono);font-size:11.5px;padding:5px 9px;border:1px dashed var(--sand);border-radius:8px;background:#fff;color:var(--charcoal)}
.adm .gncap input:focus{outline:none;border-style:solid;border-color:var(--olive);box-shadow:0 0 0 3px rgba(99,113,84,.15)}
.adm .gncap small{font-size:11px;color:var(--sand)}
/* v3.6 · el regalo de cumpleaños */
.adm .gngift{display:inline-flex;align-items:center;gap:6px;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;padding:3px 8px;border-radius:5px;background:rgba(99,113,84,.15);color:var(--olive-d);white-space:nowrap}
.adm .gngift .d{width:5px;height:5px;border-radius:999px;background:var(--olive)}
.adm .gnopt{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px}
.adm .gnopt button{font-family:inherit;font-size:12.5px;min-height:34px;padding:0 13px;border-radius:999px;border:1px solid var(--line);background:#fff;color:var(--ink-soft);cursor:pointer}
.adm .gnopt button.on{border-color:var(--olive);background:rgba(99,113,84,.12);color:var(--olive-d);font-weight:600}
.adm .gnopt input{font-family:var(--mono);font-size:12px;width:86px;padding:0 11px;height:34px;border:1px dashed var(--sand);border-radius:999px;background:#fff;color:var(--charcoal)}
.adm .gnefe{padding:11px 13px;border-radius:10px;background:rgba(99,113,84,.1);font-size:13px;line-height:1.55;color:var(--olive-d)}
.adm .gnefe b{font-family:var(--mono);color:var(--charcoal);font-weight:700}
.adm .gncost{display:flex;gap:.6em;align-items:baseline;margin-top:10px;font-size:12px;line-height:1.6;color:var(--ink-soft)}
.adm .gncost s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--orange);flex:0 0 auto}
.adm .gncost b{font-family:var(--mono);color:var(--charcoal);font-weight:700}
.adm .gnlink{display:flex;align-items:center;gap:9px;padding:7px 8px 7px 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel)}
.adm .gnlink .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--mono);font-size:11px;color:var(--ink-soft)}
.adm .gnlink .u{font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;font-weight:700;color:var(--olive)}
.adm .gnprev{border:1px solid var(--line);border-radius:12px;background:#fff;padding:13px 14px}
.adm .gnprev .hd{display:block;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--sand);font-weight:700;margin-bottom:9px}
.adm .gnprev .bd{font-size:13px;line-height:1.85}
/* el regalo, después de mandarlo */
.adm .gnrg{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:11px 0;border-bottom:1px solid var(--line);font-size:12.5px}
.adm .gnrg:last-child{border-bottom:0}
.adm .gnrg .st{font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;padding:4px 9px;border-radius:5px;white-space:nowrap}
.adm .gnrg .g{min-width:0;line-height:1.4}
.adm .gnrg .g small{display:block;font-size:11.5px;color:var(--ink-soft);margin-top:3px}
.adm .gnrg .mn{font-family:var(--mono);font-size:12px;color:var(--ink-soft);white-space:nowrap}
.adm .gnrg.env .st{background:rgba(99,113,84,.15);color:var(--olive-d)}
.adm .gnrg.abi .st{background:rgba(255,93,54,.14);color:#c23c1c}
.adm .gnrg.abi .mn{color:var(--orange);font-weight:700}
.adm .gnrg.uso .st{background:rgba(28,111,106,.14);color:var(--lagoon)}
.adm .gnrg.ven .st{background:transparent;border:1px dashed var(--sand);color:var(--sand)}
.adm .gnrg.ven .g b{font-weight:400;color:var(--ink-soft)}
.adm .gnrg.ven .g,.adm .gnrg.ven .mn{color:var(--sand)}
/* v3.7 · el regalo se arma DENTRO de la pastilla, y las variantes se separan del producto */
.adm .gncum .hoy,.adm .gnpa .hoy{margin-top:0}
.adm .gnpa{border:1px solid rgba(32,33,28,.12);border-radius:12px;background:rgba(255,255,255,.72);padding:11px 13px;margin-top:11px;transition:background .18s,border-color .18s}
.adm .gnpa+.gnpa{margin-top:9px}
.adm .gnpa.open{background:#fff;border-color:rgba(255,93,54,.45)}
.adm .gnpa>.hoy{cursor:pointer}
.adm .gnpa .cv{font-family:var(--mono);font-size:11px;color:var(--sand);flex:0 0 auto;transition:transform .18s}
.adm .gnpa.open .cv{transform:rotate(180deg);color:var(--orange)}
.adm .gnbody{display:none;margin-top:12px;padding-top:12px;border-top:1px solid rgba(32,33,28,.12);max-height:360px;overflow-y:auto;scrollbar-width:thin}
.adm .gnpa.open .gnbody{display:block}
.adm .gnbody::-webkit-scrollbar{width:8px}
.adm .gnbody::-webkit-scrollbar-thumb{background:var(--sand);border-radius:999px}
.adm .gnstep{display:flex;align-items:baseline;gap:9px;margin:0 0 10px}
.adm .gnstep s{text-decoration:none;font-family:var(--mono);font-size:10.5px;font-weight:700;color:var(--orange)}
.adm .gnstep b{font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;font-weight:700;color:var(--olive)}
.adm .gnstep span{font-size:12px;color:var(--ink-soft)}
.adm .gnfila{display:grid;grid-template-columns:repeat(auto-fit,minmax(178px,1fr));gap:14px 18px;align-items:start}
.adm .gnfila .cel>.lb{display:block;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--sand);margin-bottom:7px}
.adm .gnfila .gnopt,.adm .gnfila .cmch{margin-bottom:0}
.adm .gnfila .gnuv{padding:6px 0;font-size:12.5px}
.adm .gnmsg2{display:grid;grid-template-columns:repeat(auto-fit,minmax(268px,1fr));gap:14px;align-items:start}
/* galería de variantes · nunca es la pantalla */
.adm .varset{margin:22px 0 0;padding:0 0 0 15px;border-left:2px dashed var(--sand)}
.adm .varset>.hd{display:flex;align-items:baseline;gap:9px;margin-bottom:4px}
.adm .varset>.hd s{text-decoration:none;font-family:var(--mono);font-size:10px;font-weight:700;color:var(--orange)}
.adm .varset>.hd b{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--sand)}
.adm .varset>.note{font-size:12px;color:var(--ink-soft);line-height:1.55;max-width:62ch;margin-bottom:14px}
.adm .varitem{margin-bottom:14px}
.adm .varitem>.t{display:block;font-size:11px;color:var(--sand);font-family:var(--mono);margin-bottom:6px}
.adm .varitem>.bx{background:transparent}


@media print{
  .adm .ahead,.adm .nav,.adm .qa,.adm .no-print,.adm .btn{display:none !important;}
  .adm{background:#fff;color:#000;}
  .adm .page{padding:0;max-width:none;}
  .adm .sec{display:none;}
  .adm #roster{display:block !important;margin:0;}
  .adm .roster-head{display:block;margin-bottom:14px;}
  .adm .card,.adm .glass{box-shadow:none;border-color:#999;}
  .adm table{font-size:11px;}
  .adm thead th{color:#000;border-color:#000;}
  .adm tbody td{border-color:#999;}
  .adm .tick{color:#000;}
  /* La hoja se la lleva el guía al cerro, donde no hay a quién darle clic:
     todas las fichas salen abiertas. */
  .adm tr.r-det{display:table-row !important;}
  .adm tr.r-det > td{background:#fff;padding:8px 15px 12px;}
  .adm .r-chev{display:none;}
  .adm .r-ficha{gap:8px 20px;}
  .adm .r-dato{font-size:10.5px;margin-bottom:1px;}
  .adm .r-tit{font-size:9px;margin-bottom:3px;}
  .adm .r-v a{text-decoration:none;color:#000;}
}

/* ══════ EL PANEL DE LA PLATAFORMA ══════════════════════════════════════════
   De design/plataforma/dc/plataforma.dc.html, transcrito por
   design/plataforma/transcribir-css.py.

   Ese script decide qué es nuevo comparando contra ESTE archivo, no con una
   lista de prefijos escrita a mano. La diferencia importa: adivinar las
   familias antes de leer el entregable fue justo lo que hizo perder once
   reglas en Experiencias, y sólo las estructurales, así que la pantalla
   compilaba y se veia casi bien.

   De las 745 reglas del entregable, 553 ya vivian aqui (es el mismo sistema)
   y 192 son nuevas. 30 de ellas redeclaran un selector que ya existe porque
   el entregable lo escribe en lista (A, B) donde aqui estaba B sola: se
   verifico una por una que el cuerpo sea IDENTICO. Ninguna pisa un valor de
   produccion. Se dejan como vienen en vez de partirle las listas al
   entregable, que seria reconstruirlo.
   ══════════════════════════════════════════════════════════════════════════ */
.adm .nav a{flex:0 0 auto;font-size:13.5px;font-weight:500;color:var(--ink-soft);padding:8px 15px;border-radius:999px;border:1px solid transparent;transition:all .15s;white-space:nowrap;}
.adm .xhead.open .chev2,.adm .xhead.open + tr .chev2{transform:rotate(180deg);}
.adm .xbody.on.tall{max-height:5000px}
.adm .cmgrp.sleep{border-color:rgba(201,183,156,.9);background:rgba(201,183,156,.14)}
.adm .cmgrp.sleep>.hd{background:rgba(201,183,156,.22)}
.adm .cmgrp .bd .in .tbl-wrap{border:0;margin-bottom:4px}
.adm td.num,.adm th.num{font-family:var(--mono);}
.adm td.right,.adm th.right{text-align:right;}
.adm .filters select,.adm .filters input{font-family:inherit;font-size:13px;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--charcoal);}
.adm .filters select:focus,.adm .filters input:focus{outline:none;border-color:var(--olive);box-shadow:0 0 0 3px rgba(99,113,84,.15);}
.adm .mini-form input,.adm .mini-form select{font-family:inherit;font-size:12.5px;padding:8px 10px;border:1px solid var(--line);border-radius:9px;background:#fff;}
@media print{.adm .ahead,.adm .nav,.adm .qa,.adm .no-print,.adm .btn{display:none !important;}.adm body{background:#fff;color:#000;}}
.adm a:hover{color:var(--orange)}
.adm .nav a,.adm .nav a.on{text-decoration:none}
.adm .cmc.cold .cmnext s,.adm .cmc.cold .cmnext b{color:var(--orange)}
.adm .cmwin input,.adm .cmwin textarea{font-family:inherit;font-size:13px;width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:#fff;color:var(--charcoal);line-height:1.5;resize:vertical}
.adm .cmwin input+input,.adm .cmwin input+textarea{margin-top:9px}
.adm .cmpanel .cmwin input,.adm .cmpanel .cmwin textarea{font-size:12.5px}
.adm .gnf.on .n,.adm .gnf.on .cv{color:var(--olive)}
.adm .cmstage.shut .cmpanel,.adm .cmstage.shut .cmveil{display:none}
.adm .cmmi.off .cmt .g,.adm .cmmi.off .cmt .wn{opacity:.55}
.adm .cmmi.edit .cmsrc,.adm .cmmi.edit .cmmact{opacity:.45}
.adm .gnlist .gnhd,.adm .gnlist .gnr{display:grid;grid-template-columns:32px minmax(150px,1.15fr) minmax(0,1.4fr) 64px;gap:14px;align-items:center}
.adm .gnlist.contags .gnhd,.adm .gnlist.contags .gnr{grid-template-columns:32px minmax(140px,1fr) minmax(0,.92fr) minmax(0,1.12fr) 64px}
.adm .gnhd span,.adm .gnsort{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--sand);line-height:1}
.adm .gnsort.on s,.adm .gnsort:hover s{opacity:1}
@media(max-width:1040px){.adm .gnlist .gnhd,.adm .gnlist .gnr{grid-template-columns:32px minmax(130px,1fr) minmax(0,1.3fr) 64px}.adm .gnlist.contags .gnhd,.adm .gnlist.contags .gnr{grid-template-columns:32px minmax(120px,1fr) minmax(0,.9fr) minmax(0,1.1fr) 64px}}
.adm .gnlist.conest .gnhd,.adm .gnlist.conest .gnr{grid-template-columns:32px minmax(210px,1.5fr) minmax(0,1.12fr) 64px}
.adm .gnlist.conest.contags .gnhd,.adm .gnlist.conest.contags .gnr{grid-template-columns:32px minmax(200px,1.4fr) minmax(0,.82fr) minmax(0,1fr) 64px}
.adm .gncum .hoy,.adm .gnpa .hoy{display:flex;align-items:center;gap:13px;flex-wrap:wrap;margin-top:11px}
.adm .gncum .hoy .av,.adm .gnpa .hoy .av{width:40px;height:40px;border-radius:999px;background:var(--salvia);color:var(--olive-d);display:inline-flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:12px;font-weight:700;flex:0 0 auto}
.adm .gncum .hoy .g,.adm .gnpa .hoy .g{min-width:0;flex:1 1 180px}
.adm .gncum .hoy .g b,.adm .gnpa .hoy .g b{display:block;font-size:16px;font-weight:500;letter-spacing:-.01em}
.adm .gncum .hoy .g small,.adm .gnpa .hoy .g small{display:block;font-size:12px;color:var(--ink-soft);margin-top:2px}
.adm .gncum .hoy .rt,.adm .gnpa .hoy .rt{display:flex;gap:8px;flex-wrap:wrap}
.adm .gnrg.ven .g,.adm .gnrg.ven .mn{color:var(--sand)}
.adm .gncum .hoy,.adm .gnpa .hoy{margin-top:0}
.adm .gnfila .gnopt,.adm .gnfila .cmch{margin-bottom:0}
/* La pastilla la dibujó el entregable con <button>, y aquí es <Link> porque
   tiene que navegar sin recargar. Los selectores llevan las dos formas: sin
   esto los <a> se quedaban SIN UNA SOLA REGLA —naranja sobre el fondo oscuro,
   y el segundo sombrero invisible— aunque el DOM fuera perfecto. Verificar la
   estructura no es verificar que se ve. */
.adm .hat{display:inline-flex;gap:2px;padding:3px;border-radius:999px;background:var(--charcoal)}
.adm .hat button,.adm .hat a{text-decoration:none;font-family:inherit;font-size:11.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;padding:8px 16px;border-radius:999px;border:0;background:transparent;color:rgba(255,255,255,.55)}
.adm .hat button:hover,.adm .hat a:hover{color:#fff}
.adm .hat button.on,.adm .hat a.on{background:#fff;color:var(--charcoal)}
.adm .hat button.on.cam,.adm .hat a.on.cam{background:var(--olive);color:#fff}
.adm .nav[hidden]{display:none}
.adm .lk .own{margin-left:auto;flex:0 0 auto;font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--sand);border:1px solid var(--line);border-radius:4px;padding:2px 5px;line-height:1.3}
.adm .lk.no .own.yo{color:var(--orange);border-color:rgba(255,93,54,.4)}
.adm .lk.no .own.el{color:var(--olive);border-color:rgba(99,113,84,.35)}
.adm .lk.ok .own{border-color:rgba(99,113,84,.25);color:var(--olive)}
.adm .ownkey{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-size:11.5px;color:var(--ink-soft);line-height:1.5}
.adm .ownkey span{display:inline-flex;align-items:center;gap:7px}
.adm .ownkey b{font-size:9px;letter-spacing:.12em;text-transform:uppercase;border:1px solid var(--line);border-radius:4px;padding:2px 5px}
.adm .ownkey .yo b{color:var(--orange);border-color:rgba(255,93,54,.4)}
.adm .ownkey .el b{color:var(--olive);border-color:rgba(99,113,84,.35)}
.adm .hatdemo{display:grid;gap:16px;grid-template-columns:1fr}
@media(min-width:1000px){.adm .hatdemo{grid-template-columns:1fr 1fr}}
.adm .hatdemo .hd{display:flex;align-items:baseline;gap:9px;margin-bottom:8px}
.adm .hatdemo .hd s{text-decoration:none;font-family:var(--mono);font-size:10px;font-weight:700;color:var(--orange)}
.adm .hatdemo .hd b{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--sand)}
.adm .hatdemo .fr{position:static;border:1px solid var(--line);border-radius:14px;background:rgba(251,251,247,.96);backdrop-filter:none;overflow:hidden}
.adm .hatdemo .fr .top{padding:12px 15px}
.adm .hatdemo .fr .nav{padding:0 15px 12px;overflow:visible;flex-wrap:wrap}
.adm .hatdemo .fr .logo{height:20px}
.adm .hatdemo .fr .nav a{font-size:12.5px;padding:7px 12px}
.adm .hatdemo .fr .qa .btn{display:none}
.adm .hatdemo .fr .who{display:flex;align-items:center;gap:8px}
.adm .hatlb{font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;color:var(--sand);margin-right:2px}
.adm .ahead .brand .hatwrap{display:flex;align-items:center;gap:9px;border-left:1px solid var(--line);padding-left:13px}
.adm .mnyrow{display:grid;grid-template-columns:1fr;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;box-shadow:var(--shadow)}
@media(min-width:900px){.adm .mnyrow{grid-template-columns:.85fr 1.15fr}}
.adm .mny{padding:22px 24px 20px}
.adm .mny .lb{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;display:block}
.adm .mny .n{font-family:var(--mono);font-weight:200;letter-spacing:-.03em;line-height:1;display:block;margin:13px 0 0}
.adm .mny .un{font-size:.42em;color:var(--ink-soft)}
.adm .mny .sub{font-size:12.5px;line-height:1.6;color:var(--ink-soft);margin-top:11px;max-width:40ch}
.adm .mny .sub b{color:var(--charcoal);font-weight:600}
.adm .mny.thru{background:var(--panel);border-bottom:1px dashed var(--line)}
@media(min-width:900px){.adm .mny.thru{border-bottom:0;border-right:1px dashed var(--line)}}
.adm .mny.thru .lb{color:var(--ink-soft)}
.adm .mny.thru .n{font-size:30px;color:var(--ink-soft)}
.adm .mny.thru .nope{display:inline-block;margin-top:12px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:var(--sand);border:1px dashed var(--sand);border-radius:7px;padding:4px 9px}
.adm .mny.mine{background:#fff}
.adm .mny.mine .lb{color:var(--orange)}
.adm .mny.mine .n{font-size:clamp(46px,7vw,68px);color:var(--orange)}
.adm .mny.mine .yes{display:inline-block;margin-top:12px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:#fff;background:var(--orange);border-radius:7px;padding:5px 10px}
.adm .mnybridge{display:flex;align-items:baseline;gap:.6em;flex-wrap:wrap;margin-top:14px;padding:11px 16px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.6);font-size:13px;line-height:1.6;color:var(--ink-soft)}
.adm .mnybridge s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--orange);flex:0 0 auto}
.adm .mnybridge b{font-family:var(--mono);color:var(--charcoal);font-weight:700}
.adm details.arch summary{display:flex;align-items:baseline;gap:12px;cursor:pointer;list-style:none}
.adm details.arch summary::-webkit-details-marker{display:none}
.adm details.arch summary::after{content:'+';margin-left:auto;font-family:var(--mono);font-size:16px;color:var(--sand)}
.adm details.arch[open] summary::after{content:'−'}
.adm details.arch summary .mut{font-size:12px}
.adm .dsgw{overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:#fff}
.adm .dsg{display:grid;grid-template-columns:minmax(240px,2.1fr) minmax(118px,1fr) minmax(118px,1fr) minmax(158px,1.25fr) minmax(126px,1fr);min-width:780px}
.adm .dh{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--sand);padding:10px 14px;background:var(--panel);border-bottom:1px solid var(--line)}
.adm .dh.r{text-align:right}
.adm .dc{padding:12px 14px;border-bottom:1px dashed var(--line);font-size:13px;line-height:1.45;color:var(--ink-soft)}
.adm .dc.r{text-align:right}
.adm .dc .nm{font-size:13.5px;font-weight:600;color:var(--charcoal);letter-spacing:-.01em;display:block;margin-bottom:5px}
.adm .dc .mn{font-family:var(--mono);font-size:14px;color:var(--charcoal);white-space:nowrap;display:block}
.adm .dc small{display:block;font-size:11px;color:var(--ink-soft);margin-top:3px}
.adm .dc .canc{color:var(--sand)}
.adm .dc.dim .nm,.adm .dc.dim .mn{color:var(--ink-soft)}
.adm .dc.tot{background:var(--panel);border-bottom:0}
.adm .dc.tot .nm,.adm .dc.tot .mn{color:var(--charcoal);font-weight:600}
.adm .pct{display:inline-flex;align-items:baseline;gap:7px;font-family:var(--mono);font-size:12.5px;color:var(--charcoal);border:1px solid var(--line);border-radius:7px;padding:3px 8px;margin:0 5px 5px 0;white-space:nowrap}
.adm .pct em{font-style:normal;font-family:'Geist',system-ui,sans-serif;font-size:11px;color:var(--ink-soft)}
.adm .pct.old{border-style:dashed;color:var(--ink-soft)}
.adm .dsgnote{display:flex;align-items:baseline;gap:.55em;font-size:12px;line-height:1.6;color:var(--ink-soft);margin-top:10px}
.adm .dsgnote s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--orange);flex:0 0 auto}
.adm .dsgnote b{color:var(--charcoal);font-weight:600}
.adm .dsgblk{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--olive);margin:18px 0 8px;display:flex;align-items:baseline;gap:8px}
.adm .dsgblk s{text-decoration:none;color:var(--orange);font-family:var(--mono)}
.adm .borrowbar{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:11px 16px;border-radius:12px;background:var(--charcoal);color:rgba(255,255,255,.75);font-size:12.5px;line-height:1.5;border:1px dashed rgba(255,93,54,.6)}
.adm .borrowbar s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--orange);flex:0 0 auto}
.adm .borrowbar b{color:#fff;font-weight:600}
.adm .borrowbar .out{margin-left:auto;font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:#fff;border:1px solid rgba(255,255,255,.45);border-radius:999px;padding:5px 13px;background:transparent;font-family:inherit;cursor:pointer}
.adm .cuenta{display:grid;grid-template-columns:1fr;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;background:#fff;box-shadow:var(--shadow)}
@media(min-width:820px){.adm .cuenta{grid-template-columns:1fr auto 1fr auto 1fr auto 1fr;align-items:stretch}}
.adm .cuenta .cu{padding:20px 22px}
.adm .cuenta .cu .lb{display:block;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--ink-soft)}
.adm .cuenta .cu .n{display:block;font-family:var(--mono);font-weight:200;font-size:34px;letter-spacing:-.03em;line-height:1;margin-top:11px}
.adm .cuenta .cu .sub{font-size:12px;line-height:1.55;color:var(--ink-soft);margin-top:9px;max-width:26ch}
.adm .cuenta .op{display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:17px;color:var(--sand);padding:0 4px;border-top:1px dashed var(--line)}
@media(min-width:820px){.adm .cuenta .op{border-top:0}}
.adm .cuenta .cu:not(:first-child){border-top:1px dashed var(--line)}
@media(min-width:820px){.adm .cuenta .cu:not(:first-child){border-top:0}}
.adm .cuenta .cu.res{background:var(--panel)}
.adm .cuenta .cu.res .lb{color:var(--orange)}
.adm .cuenta .cu.res .n{color:var(--orange);font-size:40px}
.adm .zl{display:flex;align-items:baseline;gap:.5em;font-size:12px;line-height:1.5;color:var(--ink-soft);margin-top:9px;padding-top:9px;border-top:1px dashed var(--line)}
.adm .zl s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--olive);flex:0 0 auto}
.adm .zl b{color:var(--charcoal);font-weight:600}
.adm .verdict{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;border-radius:12px;margin-bottom:14px}
.adm .verdict .n{font-family:var(--mono);font-size:22px;font-weight:300;line-height:1.1;flex:0 0 auto}
.adm .verdict .g b{display:block;font-size:15px;font-weight:500;letter-spacing:-.01em;line-height:1.3}
.adm .verdict .g span{display:block;font-size:12.5px;line-height:1.55;margin-top:5px}
.adm .verdict.no{background:rgba(255,93,54,.09);border:1px solid rgba(255,93,54,.45)}
.adm .verdict.no .n,.adm .verdict.no .g b{color:#c23c1c}
.adm .verdict.no .g span{color:var(--charcoal)}
.adm .verdict.si{background:rgba(99,113,84,.11);border:1px solid rgba(99,113,84,.4)}
.adm .verdict.si .n,.adm .verdict.si .g b{color:var(--olive-d)}
.adm .verdict.si .g span{color:var(--ink-soft)}
.adm .verdict.casa{background:var(--panel);border:1px solid var(--line)}
.adm .verdict.casa .n{color:var(--sand)}
.adm .verdict.casa .g span{color:var(--ink-soft)}
.adm .locks{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(172px,1fr))}
.adm .lk{display:flex;align-items:center;gap:9px;padding:9px 11px;border:1px solid var(--line);border-radius:10px;background:#fff;font-size:12.5px;line-height:1.35}
.adm .lk .m{width:15px;height:15px;flex:0 0 auto;display:block}
.adm .lk .g{min-width:0}
.adm .lk .g small{display:block;font-size:11px;color:var(--ink-soft);margin-top:2px}
.adm .lk .dest{display:block;font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;margin-top:5px;color:var(--olive);text-decoration:none;border-bottom:1px dashed rgba(99,113,84,.45);padding-bottom:1px}
.adm .lk .dest:hover{color:var(--orange);border-color:rgba(255,93,54,.6)}
.adm .lk.no .dest{color:var(--orange);border-color:rgba(255,93,54,.45)}
.adm .lk.ok{border-color:rgba(99,113,84,.4);background:rgba(99,113,84,.08);color:var(--olive-d)}
.adm .lk.ok .m{color:var(--olive)}
.adm .lk.no{border-color:rgba(255,93,54,.42);background:rgba(255,93,54,.06)}
.adm .lk.no .m{color:var(--orange)}
.adm .lk.na{border-style:dashed;background:transparent;color:var(--sand)}
.adm .lk.na .m{color:var(--sand)}
.adm .arr{display:flex;align-items:baseline;gap:.6em;flex-wrap:wrap;margin-top:14px;padding:12px 14px;border:1.25px solid rgba(255,93,54,.5);border-radius:12px;font-size:12.5px;line-height:1.6;color:var(--charcoal)}
.adm .arr s{text-decoration:none;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange);flex:0 0 auto}
.adm .arr b{font-family:var(--mono);font-weight:700}
.adm .arr span{color:var(--ink-soft)}
.adm .ghostsale{margin-top:14px;padding:13px 15px;border:1px dashed var(--sand);border-radius:12px;background:rgba(182,173,165,.1)}
.adm .ghostsale .t{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;font-size:13.5px}
.adm .ghostsale .t b{font-weight:500}
.adm .ghostsale .t .mn{font-family:var(--mono);margin-left:auto;font-weight:700}
.adm .ghostsale p{font-size:12px;color:var(--ink-soft);line-height:1.55;margin-top:7px}
.adm td .opnm{display:flex;align-items:center;gap:10px}
.adm td .opnm .av{width:28px;height:28px;border-radius:999px;background:var(--salvia);color:var(--olive-d);display:inline-flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:10px;font-weight:700;flex:0 0 auto}
.adm td .opnm b{font-weight:500}
.adm td .opnm small{display:block;font-family:var(--mono);font-size:10.5px;color:var(--ink-soft);margin-top:1px}
.adm .lockmini{display:inline-flex;gap:3px;align-items:center}
.adm .lockmini i{width:9px;height:9px;border-radius:2px;background:var(--sand);display:block}
.adm .lockmini i.ok{background:var(--olive)}
.adm .lockmini i.no{background:rgba(255,93,54,.85)}
.adm .lockmini u{text-decoration:none;font-family:var(--mono);font-size:11px;color:var(--ink-soft);margin-left:5px}
.adm tr.casa td{background:rgba(214,216,199,.28)}
.adm tr.casa:hover td{background:rgba(214,216,199,.4)}
.adm tr.ejem td{background:rgba(255,255,255,.5)}
.adm .ejemtag{display:inline-flex;align-items:center;gap:6px;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--sand);border:1px dashed var(--sand);border-radius:6px;padding:3px 8px}
.adm .cmcol.sleep{background:rgba(201,183,156,.22);border-color:rgba(201,183,156,.85)}
.adm .cmcol.sleep .cmcol-hd{border-bottom-color:rgba(201,183,156,.9)}
.adm .cmcol.sleep .cmcol-hd h3{color:#7a5f2a}
.adm .cmcol.sleep .cmcol-hd .how{color:#8a6d1f}
.adm .cmc.sleep{border-color:rgba(201,183,156,.9);background:#fff}
.adm .cmc.sleep .cmnext{background:rgba(201,183,156,.3);color:#7a5f2a}
.adm .cmc.sleep .cmnext s,.adm .cmc.sleep .cmnext b{color:#8a6d1f}
.adm .cmc.sleep .age{color:#8a6d1f;font-weight:700}
`;
