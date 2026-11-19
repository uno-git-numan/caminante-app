// La marca y la hoja de estilos del formulario de experiencia (`.adminexp`).
// Vivían dentro de ExperienceForm.tsx; se sacaron el 19 nov 2026 para que el
// alta rápida (AltaRapida.tsx) se vista EXACTAMENTE igual sin arrastrar las
// 1,800 líneas del editor completo. Es el mismo texto, sin un cambio.

const G1 =
  '<g class="g1"><path d="M14.64,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64S0,96.44,0,104.52s6.56,14.64,14.64,14.64"/><path d="M102.08,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M91.72,114.57L4.29,27.44C-1.43,21.73-1.43,12.46,4.29,6.74c5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
const G2 =
  '<g class="g2"><path d="M218.65,2.3c-8.09,0-14.64,6.56-14.64,14.64s6.56,14.64,14.64,14.64,14.64-6.56,14.64-14.64-6.56-14.64-14.64-14.64"/><path d="M276.91,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/><path d="M189.47,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/></g>';
const G3 =
  '<g class="g3"><path d="M335.23,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M422.67,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M412.31,114.57l-87.43-87.13c-5.72-5.72-5.72-14.99,0-20.71,5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
export const MARK = `<svg viewBox="0 0 437.31 121.74" role="img" aria-label="Caminante">${G1}${G2}${G3}</svg>`;

export const CSS = `
.adminexp{--dune:#c9b79c;--cream:#fbfbf7;--sand:#b6ada5;--salvia:#d6d8c7;--olive:#637154;--olive-d:#4f5d44;--forest:#20392b;--charcoal:#20211c;--orange:#ff5d36;--panel:#f1eee7;--bg:#eceae3;--ink-soft:rgba(32,33,28,.6);--line:rgba(32,33,28,.14);--r:14px;--eb:.2em;
  font-family:"Geist",system-ui,sans-serif;color:var(--charcoal);background:var(--bg);min-height:100vh;}
.adminexp *{box-sizing:border-box;}
.adminexp .eyebrow{font-size:11px;font-weight:600;letter-spacing:var(--eb);text-transform:uppercase;display:inline-flex;align-items:center;gap:.5em;line-height:1;color:var(--olive);}
.adminexp .eyebrow .sl{color:var(--orange);font-weight:700;}
.adminexp .ahead{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 24px;background:rgba(251,251,247,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);}
.adminexp .ahead .brand{display:flex;align-items:center;gap:14px;}
.adminexp .ahead .logo{height:26px;}.adminexp .ahead .logo svg{height:100%;width:auto;display:block;}
.adminexp .ahead .logo .g1{fill:var(--olive);}.adminexp .ahead .logo .g2{fill:var(--sand);}.adminexp .ahead .logo .g3{fill:var(--orange);}
.adminexp .ahead .ctx{font-size:13px;color:var(--ink-soft);font-weight:500;border-left:1px solid var(--line);padding-left:14px;}
.adminexp .ahead .ctx b{color:var(--charcoal);font-weight:600;}
.adminexp .ahead .head-actions{display:flex;gap:10px;align-items:center;}
.adminexp .savechip{font-family:"Geist Mono",monospace;font-size:12px;color:var(--ink-soft);margin-right:6px;}
.adminexp .btn{display:inline-flex;align-items:center;justify-content:center;gap:.5em;min-height:44px;padding:0 20px;border-radius:999px;font-size:14px;font-weight:500;cursor:pointer;border:1px solid transparent;transition:background .18s,transform .1s;white-space:nowrap;font-family:inherit;}
.adminexp .btn:active{transform:translateY(1px);}
.adminexp .btn:disabled{opacity:.6;cursor:not-allowed;}
.adminexp .btn-orange{background:var(--orange);color:#fff;}.adminexp .btn-orange:hover{background:#e8431f;}
.adminexp .btn-ghost{background:transparent;color:var(--olive);border-color:var(--line);}.adminexp .btn-ghost:hover{border-color:var(--olive);}
.adminexp .btn-sm{min-height:38px;padding:0 16px;font-size:13px;}
.adminexp .wrap{max-width:1160px;margin:0 auto;padding:28px 24px 130px;display:grid;gap:28px;grid-template-columns:1fr;}
@media(min-width:960px){.adminexp .wrap{grid-template-columns:230px 1fr;align-items:start;gap:40px;}}
.adminexp .index{position:sticky;top:74px;z-index:10;background:var(--bg);}
.adminexp .ix-title{font-size:11px;letter-spacing:var(--eb);text-transform:uppercase;color:var(--ink-soft);font-weight:600;margin-bottom:10px;display:none;}
.adminexp .ix-group{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--sand);font-weight:700;margin:14px 0 4px;padding-left:10px;display:none;}
.adminexp .ix-list{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;}
.adminexp .ix-list a{flex:0 0 auto;font-size:13px;color:var(--ink-soft);padding:8px 13px;border-radius:999px;border:1px solid var(--line);background:#fff;font-weight:500;white-space:nowrap;}
.adminexp .ix-list a:hover{color:var(--charcoal);border-color:var(--olive);}
.adminexp .ix-list a .n{font-family:"Geist Mono",monospace;color:var(--orange);margin-right:.5em;font-size:11px;}
@media(min-width:960px){.adminexp .ix-title,.adminexp .ix-group{display:block;}.adminexp .ix-list{flex-direction:column;gap:2px;overflow:visible;max-height:calc(100vh - 120px);overflow-y:auto;}.adminexp .ix-list a{border:0;background:transparent;padding:7px 10px;border-radius:8px;border-left:2px solid transparent;}.adminexp .ix-list a:hover{background:var(--panel);border-left-color:var(--olive);}}
.adminexp .main{display:flex;flex-direction:column;gap:22px;min-width:0;}
.adminexp .card{background:var(--cream);border:1px solid var(--line);border-radius:var(--r);padding:26px 24px;scroll-margin-top:84px;}
.adminexp .sec-head{margin-bottom:18px;}
.adminexp .sec-head h2{font-size:23px;font-weight:300;letter-spacing:-.01em;margin-top:8px;}
.adminexp .sec-head .desc{font-size:13.5px;color:var(--ink-soft);margin-top:7px;line-height:1.55;}
.adminexp .subhead{font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--olive);margin:24px 0 12px;padding-top:18px;border-top:1px dashed var(--line);}
.adminexp .optflag{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-soft);background:rgba(32,33,28,.06);border-radius:999px;padding:2px 8px;margin-left:8px;}
.adminexp .field{margin-bottom:16px;}
.adminexp .field > label{display:block;font-size:12.5px;font-weight:600;margin-bottom:7px;color:var(--charcoal);}
.adminexp .field .hint{font-weight:400;color:var(--ink-soft);}
.adminexp input[type=text],.adminexp input[type=url],.adminexp input[type=number],.adminexp input[type=date],.adminexp textarea,.adminexp select{width:100%;font-family:inherit;font-size:15px;color:var(--charcoal);background:#fff;border:1px solid var(--line);border-radius:10px;padding:11px 13px;transition:border-color .18s,box-shadow .18s;}
.adminexp textarea{min-height:74px;line-height:1.5;resize:vertical;}
.adminexp input:focus,.adminexp textarea:focus,.adminexp select:focus{outline:none;border-color:var(--olive);box-shadow:0 0 0 3px rgba(99,113,84,.16);}
.adminexp input::placeholder,.adminexp textarea::placeholder{color:rgba(32,33,28,.36);}
.adminexp .row{display:grid;gap:16px;grid-template-columns:1fr;}
@media(min-width:560px){.adminexp .row.c2{grid-template-columns:1fr 1fr;}.adminexp .row.c3{grid-template-columns:1fr 1fr 1fr;}}
.adminexp .with-btn{display:flex;gap:10px;align-items:center;}.adminexp .with-btn input{flex:1;}
.adminexp .slugbox{font-family:"Geist Mono",monospace;}
.adminexp .uploader{display:flex;gap:10px;flex-wrap:wrap;align-items:center;}
.adminexp .uploader input[type=url],.adminexp .uploader input[type=text]{flex:1;min-width:200px;}
.adminexp .filebtn{display:inline-flex;align-items:center;gap:.5em;border:1px dashed var(--sand);color:var(--olive);border-radius:10px;padding:11px 16px;font-size:13px;font-weight:500;cursor:pointer;background:#fff;}
.adminexp .filebtn:hover{border-color:var(--olive);}.adminexp .filebtn input{display:none;}
.adminexp .thumb{height:46px;width:64px;border-radius:8px;border:1px solid var(--line);object-fit:cover;}
.adminexp .segmented{display:inline-flex;background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:3px;gap:2px;}
.adminexp .segmented label{cursor:pointer;position:relative;}.adminexp .segmented input{position:absolute;opacity:0;}
.adminexp .segmented span{display:block;padding:8px 18px;font-size:13.5px;font-weight:500;border-radius:999px;color:var(--ink-soft);}
.adminexp .segmented input:checked + span{background:var(--olive);color:#fff;}
.adminexp .segmented.sm span{padding:6px 12px;font-size:12.5px;}
.adminexp .toggle{display:inline-flex;align-items:center;gap:11px;cursor:pointer;}
.adminexp .toggle input{position:absolute;opacity:0;}
.adminexp .toggle .tk{display:inline-block;width:46px;height:26px;border-radius:999px;background:var(--sand);position:relative;transition:background .2s;flex:0 0 auto;}
.adminexp .toggle .tk::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:999px;background:#fff;transition:transform .2s;}
.adminexp .toggle input:checked + .tk{background:var(--olive);}
.adminexp .toggle input:checked + .tk::after{transform:translateX(20px);}
.adminexp .toggle .tlabel{font-size:14px;font-weight:500;}
.adminexp .rep-items{display:flex;flex-direction:column;gap:12px;}
.adminexp .rep-row{display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap;}.adminexp .rep-row > *{margin-bottom:0;}.adminexp .rep-row .grow{flex:1;min-width:160px;}
.adminexp .rep-card{border:1px solid var(--line);border-radius:12px;padding:46px 16px 18px;background:#fff;position:relative;}
.adminexp .rm{flex:0 0 auto;background:transparent;border:1px solid var(--line);color:var(--ink-soft);border-radius:9px;padding:10px 12px;font-size:13px;cursor:pointer;line-height:1;font-family:inherit;}
.adminexp .rm:hover{border-color:var(--orange);color:var(--orange);}
.adminexp .rep-card .rm{position:absolute;top:14px;right:14px;}
.adminexp .add{margin-top:12px;background:transparent;border:1px solid var(--olive);color:var(--olive);border-radius:999px;padding:9px 18px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;}
.adminexp .add:hover{background:var(--olive);color:#fff;}
.adminexp .nested{margin-top:14px;padding-top:14px;border-top:1px dashed var(--line);}
.adminexp .nested .nlabel{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft);font-weight:600;margin-bottom:10px;}
.adminexp .inline-check{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:var(--charcoal);cursor:pointer;white-space:nowrap;padding-top:10px;}
.adminexp .inline-check input{width:17px;height:17px;accent-color:var(--olive);}
.adminexp .chip-auto{display:inline-flex;align-items:center;font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--olive);background:rgba(99,113,84,.12);border:1px solid rgba(99,113,84,.32);border-radius:999px;padding:2px 7px;margin-left:7px;vertical-align:middle;}
.adminexp .field.auto input,.adminexp .field.auto select,.adminexp .field.auto textarea{background:rgba(99,113,84,.055);border-color:rgba(99,113,84,.3);}
.adminexp .brandbanner{background:rgba(99,113,84,.07);border:1px solid rgba(99,113,84,.28);border-radius:var(--r);overflow:hidden;}
.adminexp .brandbanner summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px;}
.adminexp .brandbanner summary::-webkit-details-marker{display:none;}
.adminexp .brandbanner .bb-l{display:flex;align-items:center;gap:12px;}
.adminexp .brandbanner .bb-l .t{font-size:15px;font-weight:600;}.adminexp .brandbanner .bb-l .d{font-size:12.5px;color:var(--ink-soft);}
.adminexp .brandbanner .chev{color:var(--olive);font-size:13px;}.adminexp .brandbanner[open] .chev{transform:rotate(180deg);}
.adminexp .inherited{padding:4px 22px 22px;border-top:1px dashed rgba(99,113,84,.3);}
.adminexp .inherited-grid{display:grid;gap:16px 28px;grid-template-columns:1fr;margin-top:16px;}
@media(min-width:620px){.adminexp .inherited-grid{grid-template-columns:1fr 1fr;}}
.adminexp .inh .k{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft);font-weight:600;display:block;margin-bottom:3px;}
.adminexp .inh .v{font-size:14.5px;font-weight:500;}
.adminexp .form-intro{font-size:13.5px;line-height:1.6;color:var(--ink-soft);background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:16px 20px;}
.adminexp .form-intro .sl{color:var(--orange);font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:11px;display:block;margin-bottom:7px;}
.adminexp .gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;}
.adminexp .gal-slot{aspect-ratio:1;border:1px dashed var(--sand);border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center;color:var(--olive);font-size:12px;font-weight:500;cursor:pointer;text-align:center;padding:8px;position:relative;overflow:hidden;}
.adminexp .gal-slot:hover{border-color:var(--olive);}.adminexp .gal-slot input{display:none;}
.adminexp .gal-slot img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.adminexp .gal-slot .rm{position:absolute;top:6px;right:6px;padding:5px 7px;font-size:11px;z-index:2;background:#fff;}
.adminexp .preview{margin-top:20px;background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden;}
.adminexp .preview summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;}
.adminexp .preview summary::-webkit-details-marker{display:none;}
.adminexp .preview summary .pv-l{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;color:var(--olive);}
.adminexp .preview .pv-tag{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft);background:rgba(32,33,28,.07);border-radius:999px;padding:3px 9px;}
.adminexp .preview .chev{color:var(--olive);font-size:12px;}.adminexp .preview[open] .chev{transform:rotate(180deg);}
.adminexp .pv-body{padding:8px 20px 22px;border-top:1px dashed var(--line);background:#fff;}
.adminexp .pv-ro{font-size:11px;color:var(--ink-soft);font-style:italic;margin:12px 0 4px;}
.adminexp .cv-block{margin-top:18px;}
.adminexp .cv-block > .cvh{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--olive);margin-bottom:10px;}
.adminexp .cv-grid{display:grid;gap:11px;grid-template-columns:1fr 1fr;}
@media(max-width:540px){.adminexp .cv-grid{grid-template-columns:1fr;}}
.adminexp .cv-field .l{display:block;font-size:12px;color:var(--charcoal);font-weight:500;margin-bottom:5px;}
.adminexp .cv-input{height:32px;border:1px dashed var(--line);border-radius:7px;background:var(--cream);}.adminexp .cv-input.area{height:54px;}
.adminexp .cv-q{font-size:13.5px;font-weight:600;color:var(--charcoal);margin:16px 0 7px;}
.adminexp .cv-stars{color:var(--sand);font-size:17px;letter-spacing:3px;line-height:1;}
.adminexp .cv-nps{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;}
.adminexp .cv-nps span{width:24px;height:24px;border:1px solid var(--line);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--ink-soft);font-family:"Geist Mono",monospace;}
.adminexp .cv-note{font-size:12px;color:var(--ink-soft);font-style:italic;margin-top:7px;}
.adminexp .cv-check{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:var(--charcoal);margin-top:9px;line-height:1.4;}
.adminexp .cv-check .bx{width:15px;height:15px;border:1.5px solid var(--sand);border-radius:4px;flex:0 0 auto;margin-top:1px;}
.adminexp .cv-list{margin-top:8px;display:flex;flex-direction:column;gap:7px;}
.adminexp .cv-list .ci{font-size:13px;color:#3a3c33;line-height:1.45;padding-left:16px;position:relative;}
.adminexp .cv-list .ci::before{content:"";position:absolute;left:0;top:7px;width:6px;height:6px;border-radius:999px;background:var(--orange);}
.adminexp .cv-cat{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid var(--line);}
.adminexp .cv-cat:first-child{border-top:0;}.adminexp .cv-cat .cn{font-size:13.5px;font-weight:500;}
.adminexp .cv-empty{font-size:12.5px;color:var(--ink-soft);font-style:italic;}
.adminexp .actionbar{position:fixed;bottom:0;left:0;right:0;z-index:40;background:rgba(251,251,247,.94);backdrop-filter:blur(12px);border-top:1px solid var(--line);}
.adminexp .actionbar .inner{max-width:1160px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:14px;}
.adminexp .actionbar .status{font-size:13px;color:var(--ink-soft);font-family:"Geist Mono",monospace;}
.adminexp .actionbar .status.ok{color:var(--olive);}
.adminexp .err{color:#c43d2a;font-size:13px;margin-top:8px;}
`;
