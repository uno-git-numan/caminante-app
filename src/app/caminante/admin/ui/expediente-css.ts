// Generado por scripts/extraer-css-dc.mjs desde design/panel-operador/dc/Operador Expediente v1.html
// ⚠️ NO editar a mano: si el diseño cambia se re-entrega y se re-extrae.
// Sólo va el delta del entregable, con TODOS los selectores bajo `.adm`.

export const EXPEDIENTE_CSS = String.raw`
.adm a:hover{color:var(--orange)}
.adm .opseg{display:flex;gap:4px;flex-wrap:wrap;padding:4px;border-radius:14px;background:var(--panel);border:1px solid var(--line);margin-top:16px}
.adm .opseg button{display:inline-flex;align-items:baseline;gap:8px;border:0;background:transparent;border-radius:11px;padding:8px 13px;font-size:12.5px;font-weight:600;color:var(--ink-soft);letter-spacing:.01em}
.adm .opseg button .no{font-family:var(--mono);font-size:10.5px;font-weight:700;color:var(--sand)}
.adm .opseg button:hover{background:rgba(255,255,255,.75);color:var(--charcoal)}
.adm .opseg button.on{background:#fff;color:var(--charcoal);box-shadow:var(--shadow)}
.adm .opseg button.on .no{color:var(--orange)}
.adm .oppane{display:block}
.adm .oppane[hidden]{display:none}
.adm .calm{display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap;padding:14px 17px;border-radius:12px;border:1px solid var(--line);background:var(--panel)}
.adm .calm s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--sand);flex:0 0 auto;padding-top:2px}
.adm .calm .g{flex:1 1 300px;min-width:0}
.adm .calm .g b{display:block;font-size:14px;font-weight:600}
.adm .calm .g span{display:block;font-size:12.5px;color:var(--ink-soft);line-height:1.6;margin-top:4px}
.adm .calm .ac{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.adm .recibo{display:grid;gap:20px;grid-template-columns:1fr}
@media(min-width:860px){.adm .recibo{grid-template-columns:1fr 1fr}}
.adm .recibo .col{border:1px solid var(--line);border-radius:14px;background:#fff;overflow:hidden}
.adm .recibo .rh{padding:12px 16px;border-bottom:1px solid var(--line);background:var(--panel);display:flex;align-items:baseline;gap:10px}
.adm .recibo .rh b{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--charcoal)}
.adm .recibo .rh .fr{margin-left:auto;font-family:var(--mono);font-size:12px;color:var(--ink-soft)}
.adm .recibo .rr{display:grid;grid-template-columns:minmax(120px,auto) 1fr;gap:14px;padding:10px 16px;border-bottom:1px solid var(--line);font-size:12.5px;line-height:1.55;color:var(--ink-soft)}
.adm .recibo .rr:last-child{border-bottom:0}
.adm .recibo .rr code{font-family:var(--mono);font-size:12px;color:var(--charcoal);white-space:normal}
.adm .recibo .rr b{color:var(--charcoal);font-weight:600}
@media(max-width:560px){.adm .recibo .rr{grid-template-columns:1fr;row-gap:4px}}
.adm .docs{border:1px solid var(--line);border-radius:12px;background:#fff;overflow:hidden}
.adm .doc{display:grid;grid-template-columns:20px minmax(160px,1.5fr) minmax(140px,1.2fr) auto;gap:12px;align-items:center;padding:12px 15px;border-bottom:1px solid var(--line);font-size:13px}
.adm .doc:last-child{border-bottom:0}
.adm .doc .st{width:15px;height:15px}
.adm .doc .nm{min-width:0}
.adm .doc .nm b{display:block;font-size:13.5px;font-weight:600;letter-spacing:-.01em}
.adm .doc .nm small{display:block;font-size:11.5px;color:var(--ink-soft);margin-top:2px;line-height:1.45}
.adm .doc .fl{min-width:0;font-family:var(--mono);font-size:11.5px;color:var(--ink-soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.adm .doc .ac{display:flex;gap:7px;justify-content:flex-end;flex-wrap:wrap}
.adm .doc.pend{background:rgba(255,93,54,.045)}
.adm .docbar{display:flex;align-items:center;gap:13px;flex-wrap:wrap;margin-bottom:13px}
.adm .docbar .bar{flex:1 1 200px;height:6px;border-radius:999px;background:var(--panel);border:1px solid var(--line);overflow:hidden;min-width:140px}
.adm .docbar .bar i{display:block;height:100%;background:var(--olive)}
.adm .docbar .fr{font-family:var(--mono);font-size:12.5px;color:var(--charcoal);flex:0 0 auto}
@media(max-width:640px){.adm .doc{grid-template-columns:20px 1fr;row-gap:8px}.adm .doc .fl,.adm .doc .ac{grid-column:2}.adm .doc .ac{justify-content:flex-start}}
.adm .sig{border:1px solid var(--olive);border-radius:14px;background:rgba(99,113,84,.05);padding:18px 20px}
.adm .sig .who{display:grid;gap:11px;grid-template-columns:1fr;margin-bottom:14px}
@media(min-width:620px){.adm .sig .who{grid-template-columns:1fr 1fr}}
.adm .sig .f{border:1px solid var(--line);border-radius:10px;background:#fff;padding:9px 12px}
.adm .sig .f span{display:block;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--olive)}
.adm .sig .f b{display:block;font-size:14px;font-weight:500;margin-top:4px}
.adm .sig .f b.mono{font-family:var(--mono);font-size:13px}
.adm .sig .ck{display:flex;gap:11px;align-items:flex-start;font-size:13px;line-height:1.55;padding:12px 13px;border:1px solid var(--line);border-radius:10px;background:#fff}
.adm .sig .ck i{width:18px;height:18px;border-radius:5px;border:1.5px solid var(--sand);flex:0 0 auto;margin-top:1px}
.adm .sig .ck.on i{border-color:var(--olive);background:var(--olive)}
.adm .sig .ck.on i::after{content:'';display:block;width:10px;height:5px;border-left:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(-45deg);margin:4px 0 0 3px}
.adm .sigdone{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:14px 16px;border:1px solid rgba(99,113,84,.4);border-radius:12px;background:rgba(99,113,84,.09)}
.adm .sigdone .g b{display:block;font-size:14px;font-weight:600}
.adm .sigdone .g span{display:block;font-size:12.5px;color:var(--ink-soft);margin-top:3px}
.adm .embed{border:1px dashed var(--sand);border-radius:14px;background:var(--panel);padding:16px 17px}
.adm .embed .tag{display:inline-flex;align-items:center;gap:7px;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--sand);margin-bottom:12px}
.adm .embed .tag s{text-decoration:none;font-family:var(--mono);color:var(--orange)}
.adm .embed .body{background:#fff;border:1px solid var(--line);border-radius:10px;padding:15px 16px}
.adm .embed .ln{height:11px;border-radius:4px;background:var(--panel);margin:0 0 11px}
.adm .embed .ln.s{width:38%}
.adm .embed .ln.m{width:64%}
.adm .embed .ln.l{width:88%}
.adm .embed .fldrow{display:grid;gap:10px;grid-template-columns:1fr;margin-top:13px}
@media(min-width:620px){.adm .embed .fldrow{grid-template-columns:1fr 1fr}}
.adm .embed .fk{border:1px solid var(--line);border-radius:9px;padding:9px 11px;background:#fff}
.adm .embed .fk span{display:block;font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--sand)}
.adm .embed .fk b{display:block;font-size:13px;font-weight:400;color:var(--ink-soft);margin-top:5px;font-family:var(--mono)}
.adm .mails{display:grid;gap:18px;grid-template-columns:1fr}
@media(min-width:820px){.adm .mails{grid-template-columns:1fr 1fr}}
.adm .mail{border:1px solid var(--line);border-radius:14px;background:#fff;overflow:hidden;box-shadow:var(--shadow)}
.adm .mail .mh{padding:11px 15px;border-bottom:1px solid var(--line);background:var(--panel);display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.adm .mail .mh .k{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--sand);flex:0 0 auto}
.adm .mail .mh .su{font-size:13px;font-weight:600;letter-spacing:-.01em;min-width:0}
.adm .mail .mb{padding:17px 18px 18px}
.adm .mail .mb p{font-size:13.5px;line-height:1.65;color:var(--charcoal);margin-bottom:11px}
.adm .mail .mb p.sm{font-size:12.5px;color:var(--ink-soft)}
.adm .mail .mb .dl{margin:13px 0}
.adm .mail .mf{padding:12px 18px 16px;border-top:1px solid var(--line);font-size:11.5px;color:var(--ink-soft);line-height:1.55}
.adm .mail.nueva{border-color:rgba(255,93,54,.5)}
.adm .mail.nueva .mh{background:rgba(255,93,54,.07)}
.adm .mailtag{display:inline-flex;align-items:center;gap:6px;font-size:9px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--olive);border:1px solid rgba(99,113,84,.35);border-radius:5px;padding:2px 6px;margin-left:auto;flex:0 0 auto}
.adm .mail.nueva .mailtag{color:var(--orange);border-color:rgba(255,93,54,.45)}
.adm .phones{display:grid;gap:22px;grid-template-columns:1fr;justify-items:center}
@media(min-width:760px){.adm .phones{grid-template-columns:1fr 1fr}}
.adm .phone{width:340px;max-width:100%;border:1px solid var(--line);border-radius:26px;background:#fff;box-shadow:var(--shadow);overflow:hidden}
.adm .phone .ph{padding:13px 16px 11px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:9px}
.adm .phone .ph .lg{height:14px}
.adm .phone .ph .nm{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--olive)}
.adm .phone .pb{padding:15px 16px 20px;max-height:560px;overflow-y:auto}
.adm .phone .pb .locks{grid-template-columns:1fr}
.adm .phone .pb .gates{grid-template-columns:1fr}
.adm .phone .pb .gate .gb .locks{grid-template-columns:1fr}
.adm .phone .pb .doc{grid-template-columns:20px 1fr;row-gap:8px}
.adm .phone .pb .doc .fl,.adm .phone .pb .doc .ac{grid-column:2}
.adm .phone .pb .doc .ac{justify-content:flex-start}
.adm .phone .pb .doc .ac .btn{width:auto}
.adm .phone .pb .verdict{padding:12px 13px}
.adm .phone .pb .btn{width:100%}
.adm .phone .pb .salfoot{flex-direction:column;align-items:stretch}
.adm .win{border:1px solid rgba(99,113,84,.45);border-radius:16px;background:linear-gradient(180deg,rgba(99,113,84,.13),rgba(99,113,84,.04));padding:22px 24px}
.adm .win .big{font-family:var(--mono);font-weight:200;font-size:40px;letter-spacing:-.03em;color:var(--olive-d);line-height:1}
.adm .win .lb{font-size:10px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--olive);margin-bottom:8px}
.adm .win .row{display:grid;gap:16px;grid-template-columns:1fr;margin-top:16px}
@media(min-width:620px){.adm .win .row{grid-template-columns:repeat(3,1fr)}}
.adm .cold{display:flex;gap:.6em;align-items:baseline;padding:11px 13px;border-radius:10px;background:rgba(201,183,156,.28);border:1px solid rgba(201,183,156,.9);font-size:12.5px;line-height:1.55}
.adm .cold s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--olive-d);flex:0 0 auto}
.adm .cold b{font-weight:600}
.adm .gates{display:grid;gap:16px;grid-template-columns:1fr}
@media(min-width:900px){.adm .gates{grid-template-columns:1fr 1.55fr}}
.adm .gate{border:1px solid var(--line);border-radius:14px;background:#fff;overflow:hidden}
.adm .gate .gh{padding:13px 16px;border-bottom:1px solid var(--line);display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.adm .gate .gh b{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:700}
.adm .gate .gh small{font-size:12px;color:var(--ink-soft);line-height:1.5;flex:1 1 100%}
.adm .gate .gb{padding:14px 16px 16px}
.adm .gate .gb .locks{grid-template-columns:1fr}
@media(min-width:1120px){.adm .gate.cobrar .gb .locks{grid-template-columns:1fr 1fr}}
.adm .gate.armar{border-color:rgba(99,113,84,.45);background:rgba(99,113,84,.05)}
.adm .gate.armar .gh{background:rgba(99,113,84,.12)}
.adm .gate.armar .gh b{color:var(--olive-d)}
.adm .gate.cobrar .gh{background:var(--panel)}
.adm .gate.cobrar .gh b{color:var(--charcoal)}
.adm .gate .fr{margin-left:auto;font-family:var(--mono);font-size:12.5px;flex:0 0 auto}
.adm .canbar{border:1px solid rgba(99,113,84,.4);border-radius:14px;background:rgba(99,113,84,.09);padding:16px 18px;margin-bottom:16px}
.adm .canbar .lb{font-size:10px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--olive);display:block;margin-bottom:9px}
.adm .canbar p{font-size:15px;line-height:1.5;font-weight:300;letter-spacing:-.01em;max-width:56ch}
.adm .canbar ul{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;list-style:none}
.adm .canbar li{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;background:#fff;border:1px solid rgba(99,113,84,.3);border-radius:999px;padding:5px 12px}
.adm .canbar li s{text-decoration:none;color:var(--olive);font-family:var(--mono);font-weight:700}
.adm .legal{border:1px solid var(--line);border-radius:12px;background:#fff;padding:20px 22px;max-height:420px;overflow-y:auto;scrollbar-width:thin}
.adm .legal::-webkit-scrollbar{width:9px}
.adm .legal::-webkit-scrollbar-thumb{background:var(--sand);border-radius:999px}
.adm .legal h4{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--olive);font-weight:700;margin:20px 0 8px}
.adm .legal h4:first-child{margin-top:0}
.adm .legal p{font-size:13.5px;line-height:1.7;color:var(--charcoal);margin-bottom:10px;max-width:74ch}
.adm .legal .cl{font-family:var(--mono);font-size:11px;color:var(--sand);margin-right:8px}
.adm .legal mark{background:rgba(255,93,54,.16);color:var(--charcoal);padding:1px 4px;border-radius:3px;font-weight:600}
.adm .legal .vers{font-family:var(--mono);font-size:11px;color:var(--ink-soft);border-top:1px solid var(--line);margin-top:18px;padding-top:12px}
.adm .sig .tw{border:1px solid var(--line);border-radius:10px;background:#fff;padding:11px 13px;margin-bottom:12px}
.adm .sig .tw span{display:block;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--olive);margin-bottom:6px}
.adm .sig .tw input{width:100%;border:0;border-bottom:1px dashed var(--sand);background:transparent;font-family:var(--mono);font-size:16px;color:var(--charcoal);padding:4px 0;outline:none}
.adm .sig .tw input:focus{border-bottom-color:var(--olive)}
.adm .sig .ck+.ck{margin-top:10px}
.adm .cdown{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:14px 16px;border-radius:12px;border:1px solid rgba(255,93,54,.45);background:rgba(255,93,54,.08)}
.adm .cdown .d{font-family:var(--mono);font-weight:200;font-size:34px;line-height:1;color:var(--orange);flex:0 0 auto}
.adm .cdown .g b{display:block;font-size:14px;font-weight:600}
.adm .cdown .g span{display:block;font-size:12.5px;color:var(--ink-soft);margin-top:3px;line-height:1.55}
.adm .alive{display:grid;gap:10px;grid-template-columns:1fr;margin-top:14px}
@media(min-width:620px){.adm .alive{grid-template-columns:1fr 1fr}}
.adm .alive .a{display:flex;gap:10px;align-items:flex-start;padding:11px 13px;border-radius:10px;border:1px solid var(--line);background:#fff;font-size:12.5px;line-height:1.5}
.adm .alive .a s{text-decoration:none;font-family:var(--mono);font-weight:700;flex:0 0 auto}
.adm .alive .a.si{border-color:rgba(99,113,84,.4);background:rgba(99,113,84,.07)}
.adm .alive .a.si s{color:var(--olive)}
.adm .alive .a.no s{color:var(--sand)}
.adm .alive .a b{font-weight:600;display:block;margin-bottom:2px}
.adm .revbar{max-width:1100px;margin:0 auto 18px;padding:0 22px}
.adm .revbar .rl{display:flex;align-items:baseline;gap:.55em;font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:var(--sand);margin-bottom:9px}
.adm .revbar .rl s{text-decoration:none;font-family:var(--mono);color:var(--orange)}
.adm .revbar .rn{font-size:12px;line-height:1.6;color:var(--ink-soft);letter-spacing:0;text-transform:none;font-weight:400;margin-left:8px}
.adm .revwrap{display:flex;gap:5px;flex-wrap:wrap;padding:5px;border:1px dashed var(--sand);border-radius:14px;background:rgba(201,183,156,.16)}
.adm .revwrap button{display:inline-flex;align-items:baseline;gap:7px;border:0;background:transparent;border-radius:10px;padding:7px 12px;font-size:12px;font-weight:600;color:var(--ink-soft)}
.adm .revwrap button .no{font-family:var(--mono);font-size:10px;font-weight:700;color:var(--sand)}
.adm .revwrap button:hover{background:rgba(255,255,255,.7);color:var(--charcoal)}
.adm .revwrap button.on{background:#fff;color:var(--charcoal);box-shadow:var(--shadow)}
.adm .revwrap button.on .no{color:var(--orange)}
.adm .app{border:1px solid var(--line);border-radius:20px;background:var(--bg);overflow:hidden;box-shadow:var(--shadow);max-width:1100px;margin:0 auto}
.adm .app .ahead{position:static;border-radius:0}
.adm .nav .fut{display:inline-flex;align-items:center;gap:7px;flex:0 0 auto;font-size:13.5px;font-weight:500;color:var(--sand);padding:7px 13px;border-radius:999px;border:1px dashed rgba(201,183,156,.9);background:transparent;cursor:not-allowed;-webkit-user-select:none;user-select:none}
.adm .nav .fut .dt{width:7px;height:7px;border-radius:999px;border:1.25px solid var(--sand);flex:0 0 auto}
.adm .nav a.yo{margin-left:auto;flex:0 0 auto}
.adm .nav a.on.yo{background:var(--charcoal);color:#fff;border:0}
.adm .app.abierto .nav .fut{color:var(--charcoal);border-style:solid;border-color:var(--line);background:#fff;cursor:pointer}
.adm .app.abierto .nav .fut:hover{border-color:var(--olive);color:var(--olive-d)}
.adm .app.abierto .nav .fut .dt{background:var(--olive);border-color:var(--olive)}
.adm .navnote{display:flex;align-items:baseline;gap:.5em;padding:0 22px 12px;font-size:11.5px;line-height:1.55;color:var(--ink-soft)}
.adm .navnote s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--sand)}
.adm .app.abierto .navnote{color:var(--olive-d)}
.adm .app.abierto .navnote s{color:var(--olive)}
.adm .reqs{display:flex;flex-direction:column;gap:9px}
.adm .req{border:1px solid var(--line);border-radius:14px;background:#fff;overflow:hidden}
.adm .req>.rh{display:grid;grid-template-columns:24px 1fr auto;gap:13px;align-items:center;padding:14px 16px;cursor:pointer}
.adm .req>.rh .m{width:19px;height:19px}
.adm .req>.rh .g{min-width:0}
.adm .req>.rh .g b{display:block;font-size:14.5px;font-weight:600;letter-spacing:-.01em}
.adm .req>.rh .g small{display:block;font-size:12px;color:var(--ink-soft);line-height:1.5;margin-top:3px}
.adm .req>.rh .rt{display:flex;align-items:center;gap:10px;flex:0 0 auto}
.adm .req>.rh .rt .chev2{transition:transform .25s ease}
.adm .req.ok{border-color:rgba(99,113,84,.45)}
.adm .req.ok>.rh .m{color:var(--olive)}
.adm .req.no>.rh .m{color:var(--orange)}
.adm .req.open{border-color:var(--olive);box-shadow:var(--shadow)}
.adm .req.open>.rh{background:var(--panel);border-bottom:1px solid var(--line)}
.adm .req.open>.rh .rt .chev2{transform:rotate(180deg)}
.adm .req .rb{display:none;padding:18px 18px 20px}
.adm .req.open .rb{display:block}
.adm .req .rb .legal{max-height:340px}
.adm .req .rb>.xh4:first-child{margin-top:0}
.adm .reqgrp{margin-bottom:10px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.adm .reqgrp b{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:700}
.adm .reqgrp.armar b{color:var(--olive-d)}
.adm .reqgrp.cobrar b{color:var(--charcoal)}
.adm .reqgrp small{font-size:12px;color:var(--ink-soft);line-height:1.5;flex:1 1 240px}
.adm .reqgrp .fr{font-family:var(--mono);font-size:12.5px;color:var(--ink-soft)}
.adm .reqsep{height:1px;background:var(--line);margin:22px 0 16px}
@media(max-width:640px){.adm .req>.rh{grid-template-columns:24px 1fr;row-gap:9px}.adm .req>.rh .rt{grid-column:2;justify-content:flex-start}}
.adm .mret{display:flex;align-items:center;gap:9px;width:100%;border:0;background:transparent;padding:0 0 13px;margin-bottom:13px;border-bottom:1px solid var(--line);font-size:12.5px;font-weight:600;color:var(--olive-d);text-align:left}
.adm .mret s{text-decoration:none;font-family:var(--mono);font-size:15px;color:var(--orange)}
.adm .mtitle{font-size:19px;font-weight:300;letter-spacing:-.02em;margin-bottom:4px}
.adm .mtitle+.mut{font-size:12px;display:block;margin-bottom:14px;line-height:1.5}
.adm .pfhero{display:grid;gap:16px;grid-template-columns:1fr;align-items:center;padding:18px 20px;border:1px solid var(--line);border-radius:16px;background:#fff}
@media(min-width:700px){.adm .pfhero{grid-template-columns:auto 1fr auto}}
.adm .pfhero .ava{width:64px;height:64px;border-radius:999px;background:var(--panel);border:1px solid var(--line);display:grid;place-items:center;font-family:var(--mono);font-size:19px;color:var(--olive-d)}
.adm .pfhero .nm b{display:block;font-size:21px;font-weight:300;letter-spacing:-.02em}
.adm .pfhero .nm span{display:block;font-size:12.5px;color:var(--ink-soft);margin-top:4px;line-height:1.55}
.adm .pf{border:1px solid var(--line);border-radius:14px;background:#fff;overflow:hidden}
.adm .pf .ph{padding:11px 16px;border-bottom:1px solid var(--line);background:var(--panel);display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.adm .pf .ph b{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--charcoal)}
.adm .pf .ph .fr{margin-left:auto;font-size:11px;color:var(--ink-soft)}
.adm .pfr{display:grid;grid-template-columns:minmax(150px,1fr) minmax(150px,1.3fr) auto;gap:12px;align-items:baseline;padding:11px 16px;border-bottom:1px solid var(--line);font-size:13px}
.adm .pfr:last-child{border-bottom:0}
.adm .pfr .k{font-size:11.5px;color:var(--ink-soft);line-height:1.45}
.adm .pfr .v{color:var(--charcoal);line-height:1.5}
.adm .pfr .v.mono{font-family:var(--mono);font-size:12.5px}
.adm .pfr .t{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
@media(max-width:640px){.adm .pfr{grid-template-columns:1fr;row-gap:5px}.adm .pfr .t{justify-content:flex-start}}
.adm .pill{display:inline-flex;align-items:center;gap:5px;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;border-radius:999px;padding:3px 9px;white-space:nowrap}
.adm .pill.pub{color:var(--olive-d);background:rgba(99,113,84,.12);border:1px solid rgba(99,113,84,.35)}
.adm .pill.int{color:var(--ink-soft);background:var(--panel);border:1px solid var(--line)}
.adm .pill.lock{color:var(--sand);background:transparent;border:1px dashed var(--sand)}
.adm .trans{display:grid;gap:12px;grid-template-columns:1fr;margin:16px 0 0}
@media(min-width:760px){.adm .trans{grid-template-columns:1fr auto 1fr;align-items:center}}
.adm .trans .b{border:1px solid var(--line);border-radius:12px;background:#fff;padding:14px 16px}
.adm .trans .b .lb{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--sand);display:block;margin-bottom:7px}
.adm .trans .b b{font-size:15px;font-weight:600;display:block}
.adm .trans .b span{font-size:12.5px;color:var(--ink-soft);line-height:1.55;display:block;margin-top:4px}
.adm .trans .b.dsp{border-color:rgba(99,113,84,.45);background:rgba(99,113,84,.07)}
.adm .trans .ar{font-family:var(--mono);font-size:18px;color:var(--orange);text-align:center}
.adm .revbar .rrow{margin-bottom:10px}
.adm .revbar .rrow:last-child{margin-bottom:0}
.adm .revbar .rk{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--sand);margin-bottom:6px;display:block}
.adm .nav .fut.liv{color:var(--charcoal);border-style:solid;border-color:var(--line);background:#fff;cursor:pointer}
.adm .nav .fut.liv .dt{background:var(--olive);border-color:var(--olive)}
.adm .nav .fut.liv:hover{border-color:var(--olive);color:var(--olive-d)}
.adm .nav .fut.nuevo{border-color:rgba(99,113,84,.55);box-shadow:0 0 0 3px rgba(99,113,84,.12)}
.adm .susurro{display:none;align-items:flex-start;gap:12px;margin:0 22px 14px;padding:12px 15px;border-radius:12px;border:1px solid var(--line);background:#fff;box-shadow:var(--shadow)}
.adm .susurro.on{display:flex}
.adm .susurro s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--orange);flex:0 0 auto;padding-top:2px}
.adm .susurro .g{flex:1 1 auto;min-width:0;font-size:12.5px;line-height:1.6;color:var(--ink-soft)}
.adm .susurro .g b{display:block;font-size:13.5px;font-weight:600;color:var(--charcoal);margin-bottom:3px}
.adm .susurro .x{border:0;background:transparent;font-family:var(--mono);font-size:15px;color:var(--sand);flex:0 0 auto;padding:0 2px}
.adm .req.senala{border-color:var(--orange);box-shadow:0 0 0 3px rgba(255,93,54,.14)}
.adm .req.slim>.rh{grid-template-columns:20px 1fr auto;padding:11px 15px}
.adm .req.slim>.rh .m{width:16px;height:16px}
.adm .req.slim>.rh .g b{font-size:13.5px;font-weight:500}
.adm .req.slim>.rh .g small{display:none}
.adm .req.slim.open>.rh .g small{display:block}
.adm .req.slim>.rh .rt .chip{font-size:10.5px;padding:3px 9px}
.adm .ahora{border:1px solid rgba(99,113,84,.45);border-radius:16px;background:linear-gradient(180deg,rgba(99,113,84,.12),rgba(99,113,84,.04));padding:20px 22px}
.adm .ahora .lb{font-size:10px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--olive);display:block;margin-bottom:10px}
.adm .ahora h3{font-size:clamp(20px,2.4vw,26px);font-weight:300;letter-spacing:-.02em;line-height:1.25;max-width:30ch;margin-bottom:9px}
.adm .ahora h3 em{font-style:italic;color:var(--orange)}
.adm .ahora p{font-size:13.5px;line-height:1.65;color:var(--ink-soft);max-width:62ch}
.adm .ahora .salfoot{border-color:rgba(99,113,84,.3)}
.adm details.fold{border:1px solid var(--line);border-radius:14px;background:#fff}
.adm details.fold>summary{display:flex;align-items:center;gap:12px;cursor:pointer;list-style:none;padding:13px 16px}
.adm details.fold>summary::-webkit-details-marker{display:none}
.adm details.fold>summary::after{content:'+';margin-left:auto;font-family:var(--mono);font-size:16px;color:var(--sand)}
.adm details.fold[open]>summary::after{content:'−'}
.adm details.fold>summary b{font-size:14px;font-weight:600}
.adm details.fold>summary .mut{font-size:12.5px}
.adm details.fold>summary .fr{font-family:var(--mono);font-size:13px;color:var(--olive-d)}
.adm details.fold .fb{padding:0 16px 16px}
.adm .nowgrid{display:grid;gap:12px;grid-template-columns:1fr}
@media(min-width:760px){.adm .nowgrid{grid-template-columns:1.3fr 1fr}}
.adm .nowcard{border:1px solid var(--line);border-radius:14px;background:#fff;padding:16px 18px}
.adm .nowcard .lb{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--sand);display:block;margin-bottom:9px}
.adm .nowcard b.t{display:block;font-size:17px;font-weight:400;letter-spacing:-.01em}
.adm .nowcard .mn{font-family:var(--mono);font-weight:200;font-size:30px;line-height:1;color:var(--olive-d);display:block;margin-top:4px}
.adm .nowcard p{font-size:12.5px;line-height:1.6;color:var(--ink-soft);margin-top:8px}
.adm .firmanota{display:flex;gap:.6em;align-items:flex-start;margin-top:12px;padding:11px 13px;border-left:2px solid var(--olive);background:rgba(99,113,84,.07);border-radius:0 8px 8px 0;font-size:12.5px;line-height:1.6;color:var(--charcoal);max-width:74ch}
.adm .firmanota s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--olive);flex:0 0 auto}
.adm .venc{display:inline-flex;align-items:baseline;gap:6px;font-family:'Geist',system-ui,sans-serif;font-size:11px;font-weight:600;color:var(--olive-d);margin-top:3px}
.adm .venc s{text-decoration:none;font-family:var(--mono);color:var(--sand);font-weight:700}
.adm .venc.pronto{color:var(--orange)}
.adm .venc.pronto s{color:var(--orange)}
.adm .opts{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 14px}
.adm .opt{display:inline-flex;align-items:center;gap:9px;border:1px solid var(--line);border-radius:11px;background:#fff;padding:10px 14px;font-size:13px;font-weight:500;color:var(--ink-soft);text-align:left}
.adm .opt i{width:15px;height:15px;border-radius:999px;border:1.5px solid var(--sand);flex:0 0 auto}
.adm .opt:hover{border-color:var(--olive);color:var(--charcoal)}
.adm .opt.on{border-color:var(--olive);background:rgba(99,113,84,.08);color:var(--charcoal)}
.adm .opt.on i{border-color:var(--olive);border-width:4.5px}
.adm .optbody[hidden]{display:none}
.adm .paths{display:grid;gap:12px;grid-template-columns:1fr;margin:12px 0 16px}
@media(min-width:700px){.adm .paths{grid-template-columns:1fr 1fr}}
.adm .path{border:1px solid var(--line);border-radius:14px;background:#fff;padding:15px 17px;text-align:left}
.adm .path.on{border-color:var(--olive);background:rgba(99,113,84,.06);box-shadow:var(--shadow)}
.adm .path .hd{display:flex;align-items:center;gap:10px;margin-bottom:9px}
.adm .path .hd i{width:15px;height:15px;border-radius:999px;border:1.5px solid var(--sand);flex:0 0 auto}
.adm .path.on .hd i{border-color:var(--olive);border-width:4.5px}
.adm .path .hd b{font-size:14.5px;font-weight:600}
.adm .path .hd .mut{margin-left:auto;font-size:11.5px}
.adm .path ul{list-style:none;display:flex;flex-direction:column;gap:7px}
.adm .path li{display:flex;gap:9px;align-items:baseline;font-size:12.5px;line-height:1.55;color:var(--ink-soft)}
.adm .path li s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--olive);flex:0 0 auto}
.adm .path li b{color:var(--charcoal);font-weight:600}
.adm .guias{border:1px solid var(--line);border-radius:12px;background:#fff;overflow:hidden}
.adm .guia{display:grid;grid-template-columns:minmax(130px,1fr) minmax(180px,1.5fr) auto;gap:12px;align-items:center;padding:11px 15px;border-bottom:1px solid var(--line);font-size:13px}
.adm .guia:last-child{border-bottom:0}
.adm .guia .nm b{display:block;font-size:13.5px;font-weight:600}
.adm .guia .nm small{display:block;font-size:11.5px;color:var(--ink-soft);margin-top:2px}
.adm .guia .cert{display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:var(--ink-soft)}
.adm .guia .cert span{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
.adm .guia .cert s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--olive);flex:0 0 auto}
.adm .guia .ac{display:flex;gap:7px;justify-content:flex-end;flex-wrap:wrap}
.adm .guia.head{background:var(--panel);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--sand)}
@media(max-width:640px){.adm .guia{grid-template-columns:1fr;row-gap:8px}.adm .guia .ac{justify-content:flex-start}}
.adm .app.full{max-width:none;margin:0;border:0;border-radius:0;box-shadow:none;background:var(--bg)}
.adm .app.full .ahead{position:sticky;top:0;z-index:40}
.adm .app.full>.page{max-width:1100px;margin:0 auto;padding-bottom:40px}
.adm .fases{display:grid;gap:12px;grid-template-columns:1fr}
@media(min-width:760px){.adm .fases{grid-template-columns:1fr 1fr}}
@media(min-width:1100px){.adm #rev1.fases{grid-template-columns:repeat(4,1fr)}}
.adm .fase{border:1px dashed var(--sand);border-radius:14px;background:rgba(201,183,156,.14);padding:14px 15px;display:flex;flex-direction:column;gap:12px}
.adm .fase .fh{display:flex;gap:11px;align-items:flex-start}
.adm .fase .fh .no{font-family:var(--mono);font-size:11px;font-weight:700;color:var(--orange);padding-top:3px;flex:0 0 auto}
.adm .fase .fh b{display:block;font-size:14.5px;font-weight:600;letter-spacing:-.01em}
.adm .fase .fh small{display:block;font-size:11.5px;line-height:1.55;color:var(--ink-soft);margin-top:4px}
.adm .fase .fe{display:flex;flex-direction:column;gap:6px;margin-top:auto}
.adm .fase .fe button{border:1px solid var(--line);background:#fff;border-radius:10px;padding:8px 12px;font-size:12.5px;font-weight:500;color:var(--ink-soft);text-align:left}
.adm .fase .fe button:hover{border-color:var(--olive);color:var(--charcoal)}
.adm .fase .fe button.on{border-color:var(--olive);background:var(--olive);color:#fff;font-weight:600}
.adm .paso-pane{display:block}
.adm .pasos{display:grid;gap:8px;grid-template-columns:1fr;margin:0 0 22px}
@media(min-width:820px){.adm .pasos{grid-template-columns:repeat(4,1fr)}}
.adm .paso{display:grid;grid-template-columns:26px 1fr;gap:11px;align-items:start;border:1px solid var(--line);border-radius:14px;background:#fff;padding:13px 14px;text-align:left;position:relative}
.adm .paso .n{width:24px;height:24px;border-radius:999px;border:1.25px solid var(--sand);display:grid;place-items:center;font-family:var(--mono);font-size:11px;font-weight:700;color:var(--sand);flex:0 0 auto}
.adm .paso .g{min-width:0}
.adm .paso .g b{display:block;font-size:14px;font-weight:600;letter-spacing:-.01em}
.adm .paso .g small{display:block;font-size:11.5px;line-height:1.5;color:var(--ink-soft);margin-top:3px}
.adm .paso .g .st{display:block;font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--sand);margin-top:7px}
.adm .paso:hover{border-color:var(--olive)}
.adm .paso.done{border-color:rgba(99,113,84,.45);background:rgba(99,113,84,.06)}
.adm .paso.done .n{border-color:var(--olive);background:var(--olive);color:#fff}
.adm .paso.done .g .st{color:var(--olive-d)}
.adm .paso.now{border-color:var(--charcoal);box-shadow:var(--shadow)}
.adm .paso.now .n{border-color:var(--charcoal);background:var(--charcoal);color:#fff}
.adm .paso.now .g .st{color:var(--orange)}
.adm .paso.next{background:rgba(201,183,156,.13);border-style:dashed;border-color:rgba(201,183,156,.9)}
.adm .paso.next .g b,.adm .paso.next .g small{color:var(--ink-soft)}
.adm .paso.sel{outline:2px solid var(--orange);outline-offset:2px}
.adm .lectura{display:flex;gap:13px;align-items:flex-start;padding:13px 16px;border-radius:12px;border:1px dashed var(--sand);background:rgba(201,183,156,.16);margin-bottom:16px}
.adm .lectura s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--sand);flex:0 0 auto;padding-top:2px}
.adm .lectura .g b{display:block;font-size:14px;font-weight:600}
.adm .lectura .g span{display:block;font-size:12.5px;line-height:1.6;color:var(--ink-soft);margin-top:4px}
.adm .oppane.lec .req>.rh,.adm .oppane.lec .btn,.adm .oppane.lec .opt,.adm .oppane.lec .path,.adm .oppane.lec details.fold>summary{pointer-events:none}
.adm .oppane.lec .btn,.adm .oppane.lec .doc .ac,.adm .oppane.lec .salfoot{opacity:.45}
.adm .mitades{display:grid;gap:16px;grid-template-columns:1fr}
@media(min-width:900px){.adm .mitades{grid-template-columns:1fr 1fr;align-items:start}}
.adm .mitad{border:1px solid var(--line);border-radius:16px;background:#fff;overflow:hidden}
.adm .mitad .mh{padding:14px 17px;border-bottom:1px solid var(--line);display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.adm .mitad .mh b{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:700}
.adm .mitad .mh .fr{margin-left:auto;font-family:var(--mono);font-size:12.5px}
.adm .mitad .mh small{flex:1 1 100%;font-size:12px;line-height:1.55;color:var(--ink-soft)}
.adm .mitad .mb{padding:15px 17px 17px}
.adm .mitad.armar{border-color:rgba(99,113,84,.45)}
.adm .mitad.armar .mh{background:rgba(99,113,84,.1)}
.adm .mitad.armar .mh b,.adm .mitad.armar .mh .fr{color:var(--olive-d)}
.adm .mitad.cobrar .mh{background:var(--panel)}
.adm .mitad.cobrar .mh .fr{color:var(--orange)}
.adm .mitad .mb>.ahora{border:0;background:transparent;padding:0}
.adm .sits{display:grid;gap:12px;grid-template-columns:1fr}
@media(min-width:760px){.adm .sits{grid-template-columns:1fr 1fr}}
@media(min-width:1100px){.adm #sitCam.sits{grid-template-columns:repeat(4,1fr)}}
.adm [hidden]{display:none!important}
.adm .pfr .v{overflow-wrap:anywhere}
.adm .solp{font-size:13.5px;line-height:1.75;color:var(--charcoal);max-width:70ch;padding:12px 15px;border-left:2px solid var(--sand);background:var(--panel);border-radius:0 8px 8px 0;margin-top:4px}
.adm .solgrid{display:grid;gap:12px;grid-template-columns:1fr}
@media(min-width:820px){.adm .solgrid{grid-template-columns:1fr 1fr}}
.adm .pf .ph .qk{font-size:11px;letter-spacing:0;text-transform:none;font-weight:400;color:var(--ink-soft)}
.adm .paso{display:block;padding:0}
.adm .paso .phead{display:grid;grid-template-columns:26px 1fr;gap:11px;align-items:start;padding:13px 14px;cursor:pointer;text-align:left;width:100%;border:0;background:transparent}
.adm .paso .subs{display:flex;gap:6px;flex-wrap:wrap;padding:0 14px 12px}
.adm .paso .subs button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:4px 11px;font-size:11.5px;font-weight:500;color:var(--ink-soft)}
.adm .paso .subs button:hover{border-color:var(--olive);color:var(--charcoal)}
.adm .paso .subs button.on{border-color:var(--charcoal);background:var(--charcoal);color:#fff;font-weight:600}
.adm .paso.done .subs button.on{border-color:var(--olive);background:var(--olive)}
.adm .paso .n .pal{display:block;width:11px;height:6px;border-left:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(-45deg);margin-top:-2px}
.adm .paso .subs button.hecho{border-color:rgba(99,113,84,.5);background:rgba(99,113,84,.1);color:var(--olive-d);font-weight:600}
.adm .paso .subs button .palm{display:inline-block;width:8px;height:4.5px;border-left:1.8px solid currentColor;border-bottom:1.8px solid currentColor;transform:rotate(-45deg);margin-right:7px;vertical-align:2px}
.adm .expbar{display:grid;gap:12px;grid-template-columns:1fr;margin-bottom:20px}
@media(min-width:760px){.adm .expbar{grid-template-columns:1.4fr 1fr}}
.adm .acts{display:flex;flex-direction:column;gap:9px}
.adm .actv{border:1px solid var(--line);border-radius:14px;background:#fff;overflow:hidden}
.adm .actv>.ah{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;padding:15px 17px;cursor:pointer;width:100%;border:0;background:transparent;text-align:left}
.adm .actv>.ah .g{min-width:0}
.adm .actv>.ah .g b{display:block;font-size:15.5px;font-weight:500;letter-spacing:-.01em}
.adm .actv>.ah .g small{display:block;font-size:12px;line-height:1.5;color:var(--ink-soft);margin-top:4px}
.adm .actv>.ah .rt{display:flex;align-items:center;gap:11px;flex-wrap:wrap;justify-content:flex-end}
.adm .actv>.ah .rt .fr{font-family:var(--mono);font-size:12px;color:var(--ink-soft);white-space:nowrap}
.adm .actv>.ah .rt .chev2{transition:transform .25s ease}
.adm .actv .ab{display:none;padding:2px 17px 18px}
.adm .actv.open .ab{display:block}
.adm .actv.open>.ah{border-bottom:1px solid var(--line);background:var(--panel)}
.adm .actv.open>.ah .chev2{transform:rotate(180deg)}
.adm .actv.aprob{border-color:rgba(99,113,84,.45)}
.adm .actv.aprob>.ah .g b{color:var(--olive-d)}
.adm .actv.rev>.ah .rt .fr{color:var(--olive-d)}
.adm .actv.inc{border-color:rgba(255,93,54,.45)}
.adm .actv.inc>.ah .rt .fr{color:var(--orange)}
.adm .actv.nod{background:var(--panel);border-style:dashed;border-color:rgba(201,183,156,.9)}
.adm .actv.nod>.ah .g b{color:var(--ink-soft);font-weight:400}
.adm .actv.trae{border-color:var(--orange);box-shadow:0 0 0 3px rgba(255,93,54,.14)}
.adm .subh{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:16px 0 9px}
.adm .subh b{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--charcoal)}
.adm .subh small{font-size:11.5px;color:var(--ink-soft);line-height:1.5;flex:1 1 220px}
.adm .hers{border:1px dashed rgba(201,183,156,.95);border-radius:12px;background:rgba(201,183,156,.13);overflow:hidden}
.adm .her{display:grid;grid-template-columns:18px 1fr auto;gap:12px;align-items:center;padding:10px 15px;font-size:13px;border-bottom:1px dashed rgba(201,183,156,.8)}
.adm .her:last-child{border-bottom:0}
.adm .her .k{width:14px;height:14px;color:var(--olive)}
.adm .her b{font-weight:500;font-size:13px}
.adm .her small{display:block;font-size:11.5px;color:var(--ink-soft);margin-top:2px}
.adm .her .rt{display:flex;gap:9px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
.adm .her .lbl{font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--olive-d);white-space:nowrap}
.adm .her a{font-size:11.5px;color:var(--ink-soft);text-decoration:none;border-bottom:1px dashed var(--sand)}
.adm .her a:hover{color:var(--orange);border-color:rgba(255,93,54,.6)}
@media(max-width:640px){.adm .her{grid-template-columns:18px 1fr;row-gap:7px}.adm .her .rt{grid-column:2;justify-content:flex-start}}
.adm .doc.rech{background:rgba(255,93,54,.05);box-shadow:inset 3px 0 0 var(--orange)}
.adm .motivo{grid-column:1/-1;display:flex;gap:11px;align-items:flex-start;margin-top:4px;padding:11px 13px;border:1px solid rgba(255,93,54,.4);border-radius:10px;background:#fff;font-size:12.5px;line-height:1.6}
.adm .motivo s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--orange);flex:0 0 auto}
.adm .motivo b{display:block;font-weight:600;color:var(--charcoal);margin-bottom:3px}
.adm .venc.vencido{color:#fff;background:var(--orange);border-radius:999px;padding:2px 9px;font-weight:700;letter-spacing:.04em}
.adm .venc.vencido s{color:rgba(255,255,255,.7)}
.adm .cat{display:grid;gap:8px;grid-template-columns:1fr}
@media(min-width:620px){.adm .cat{grid-template-columns:1fr 1fr}}
@media(min-width:1000px){.adm .cat{grid-template-columns:repeat(3,1fr)}}
.adm .cati{display:flex;gap:11px;align-items:flex-start;border:1px solid var(--line);border-radius:12px;background:#fff;padding:12px 14px;text-align:left}
.adm .cati:hover{border-color:var(--olive)}
.adm .cati .pl{font-family:var(--mono);font-size:15px;color:var(--orange);line-height:1;padding-top:2px;flex:0 0 auto}
.adm .cati b{display:block;font-size:13.5px;font-weight:500}
.adm .cati small{display:block;font-size:11.5px;color:var(--ink-soft);line-height:1.5;margin-top:3px}
.adm .cati.ya{background:var(--panel);border-style:dashed}
.adm .cati.ya .pl{color:var(--olive)}
.adm .trajo{display:flex;gap:13px;align-items:flex-start;padding:15px 17px;border-radius:14px;background:var(--charcoal);color:rgba(255,255,255,.78);font-size:13px;line-height:1.6;margin-bottom:18px}
.adm .trajo s{text-decoration:none;font-family:var(--mono);font-weight:700;color:var(--orange);flex:0 0 auto;padding-top:2px}
.adm .trajo b{display:block;color:#fff;font-size:15px;font-weight:500;margin-bottom:4px}
.adm .trajo .ac{margin-left:auto;flex:0 0 auto}
.adm .pactv{display:grid;gap:10px;grid-template-columns:1fr}
@media(min-width:700px){.adm .pactv{grid-template-columns:1fr 1fr}}
.adm .pact{border:1px solid var(--line);border-radius:14px;background:#fff;padding:15px 17px}
.adm .pact .hd{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:9px}
.adm .pact .hd b{font-size:15px;font-weight:500;letter-spacing:-.01em}
.adm .pact .hd .rt{margin-left:auto}
.adm .pact p{font-size:12.5px;line-height:1.6;color:var(--ink-soft);max-width:44ch}
.adm .pact.aprob{border-color:rgba(99,113,84,.45);background:rgba(99,113,84,.05)}
.adm .pact.pend{border-style:dashed;border-color:rgba(201,183,156,.95);background:var(--panel)}
.adm .doc .fl{white-space:normal;overflow:visible;text-overflow:clip}
.adm .doc{grid-template-columns:20px minmax(160px,1.4fr) minmax(200px,1.6fr) auto}
.adm .venc{white-space:normal;flex-wrap:wrap}
.adm .verdict .g span b{display:inline;font-weight:600}
`;
