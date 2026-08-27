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
`;
