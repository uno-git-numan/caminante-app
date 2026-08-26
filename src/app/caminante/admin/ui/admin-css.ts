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
.adm .xbody{max-height:0;opacity:0;overflow:hidden;transition:max-height .35s ease,opacity .28s ease;}
.adm .xbody.on{max-height:1600px;opacity:1;}
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
