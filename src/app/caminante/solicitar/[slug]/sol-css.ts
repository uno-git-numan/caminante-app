// CSS de "Solicita una fecha" — integrado del HTML de Claude Design
// ("Caminante Web - Solicita una fecha.html", jul 2026). Scopeado con .sol-*.
// Sin @font-face: Geist ya está disponible globalmente en la app.
export const SOL_CSS = `
.sol{font-family:"Geist",system-ui,sans-serif;background:#fbfbf7;color:#20211c;-webkit-font-smoothing:antialiased;line-height:1.5;min-height:100vh;
  --cream:#fbfbf7;--charcoal:#20211c;--olive:#637154;--olive-d:#4f5d44;--forest:#20392b;
  --sand:#b6ada5;--salvia:#d6d8c7;--orange:#ff5d36;
  --panel:#f1eee7;--line:rgba(32,33,28,.13);--ink-soft:rgba(32,33,28,.6);
  --r:22px;--eb:.24em;--mono:"Geist Mono",ui-monospace,monospace;
  --shadow:0 30px 70px -34px rgba(32,33,28,.5);}
.sol *{box-sizing:border-box;margin:0;padding:0;}
.sol img{display:block;max-width:100%;}
.sol button{font-family:inherit;cursor:pointer;}
.sol a{color:var(--olive);text-decoration:none;}
.sol a:hover{color:var(--olive-d);}
.sol input,.sol textarea{font-family:inherit;}

.sol-eyebrow{font-family:var(--mono);font-size:11.5px;font-weight:500;letter-spacing:var(--eb);text-transform:uppercase;display:inline-flex;align-items:center;gap:.55em;}
.sol-eyebrow .sl{color:var(--orange);font-weight:700;}
.sol-display{font-weight:200;letter-spacing:-.02em;line-height:1.04;}
em.sol-ac{font-style:italic;color:var(--orange);font-weight:300;}

/* ===== HERO ===== */
.sol-hero{position:relative;isolation:isolate;color:#fff;padding:118px 22px 128px;text-align:center;overflow:hidden;}
.sol-hero .sol-ph{position:absolute;inset:0;z-index:-2;}
.sol-hero .sol-ph img{width:100%;height:100%;object-fit:cover;}
.sol-hero::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(to bottom,rgba(18,26,17,.62) 0%,rgba(18,26,17,.5) 45%,rgba(18,26,17,.72) 100%);}
.sol-hero .sol-eyebrow{color:rgba(255,255,255,.9);justify-content:center;}
.sol-hero h1{font-size:clamp(38px,8vw,66px);margin-top:18px;}
.sol-hero .sol-sub{font-size:clamp(15px,2.2vw,18px);font-weight:300;color:rgba(255,255,255,.86);margin:16px auto 0;max-width:34ch;}
.sol-topbar{position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;justify-content:space-between;padding:20px 22px;}
.sol-logo{height:22px;display:block;}
.sol-logo svg{height:100%;width:auto;display:block;}
.sol-logo .g1{fill:#637154;}.sol-logo .g2{fill:#fbfbf7;}.sol-logo .g3{fill:#ff5d36;}.sol-logo .gw{fill:#fff;}
.sol-back{font-size:13px;font-weight:500;color:rgba(255,255,255,.85);display:inline-flex;align-items:center;gap:.5em;}
.sol-back:hover{color:#fff;}

/* ===== FORM WRAP ===== */
.sol-wrap{max-width:600px;margin:-72px auto 90px;padding:0 20px;position:relative;z-index:6;}
.sol-card{background:var(--cream);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);padding:clamp(24px,5vw,40px);}
.sol-exp{display:flex;align-items:center;gap:13px;padding-bottom:22px;margin-bottom:26px;border-bottom:1px solid var(--line);}
.sol-exp img{width:56px;height:56px;border-radius:14px;object-fit:cover;flex:0 0 auto;}
.sol-exp .l .k{font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);}
.sol-exp .l .n{font-size:17px;font-weight:500;margin-top:2px;}

.sol-err{border:1px solid rgba(255,93,54,.4);background:rgba(255,93,54,.08);color:#b33517;border-radius:13px;padding:12px 16px;font-size:13.5px;margin-bottom:22px;}

.sol-group{margin-bottom:30px;}
.sol-group:last-of-type{margin-bottom:0;}
.sol-glabel{display:flex;align-items:baseline;gap:10px;margin-bottom:15px;}
.sol-glabel .sol-eyebrow{color:var(--olive);}

.sol-fields{display:grid;gap:14px;}
.sol-fg{display:flex;flex-direction:column;gap:6px;}
.sol-fg label{font-size:12px;font-weight:600;letter-spacing:.05em;color:var(--charcoal);}
.sol-fg input,.sol-fg textarea{font-size:15px;padding:13px 15px;border:1px solid var(--line);border-radius:13px;background:#fff;color:var(--charcoal);transition:border-color .18s,box-shadow .18s;width:100%;}
.sol-fg input::placeholder,.sol-fg textarea::placeholder{color:var(--sand);}
.sol-fg input:focus,.sol-fg textarea:focus{outline:none;border-color:var(--olive);box-shadow:0 0 0 3px rgba(99,113,84,.16);}
.sol-fg textarea{resize:vertical;min-height:66px;}
.sol-hint{font-size:12.5px;color:var(--ink-soft);font-style:italic;margin-top:4px;}

/* stepper */
.sol-stepwrap{display:flex;align-items:center;gap:18px;flex-wrap:wrap;}
.sol-stepper{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:999px;background:#fff;overflow:hidden;}
.sol-stepper button{width:46px;height:46px;font-size:22px;font-weight:300;color:var(--olive);background:transparent;border:0;line-height:1;transition:background .15s;display:flex;align-items:center;justify-content:center;}
.sol-stepper button:hover{background:var(--panel);}
.sol-stepper button:disabled{color:var(--sand);cursor:not-allowed;}
.sol-stepper .val{min-width:52px;text-align:center;font-size:19px;font-weight:500;font-variant-numeric:tabular-nums;}
.sol-chip{display:inline-flex;align-items:center;gap:.5em;font-family:var(--mono);font-size:11.5px;font-weight:500;letter-spacing:.04em;color:var(--olive-d);background:var(--salvia);border-radius:999px;padding:8px 15px;}
.sol-chip .dot{width:6px;height:6px;border-radius:50%;background:var(--orange);}

/* radio cards */
.sol-radios{display:grid;gap:12px;margin-top:16px;}
.sol-radio{display:flex;gap:13px;align-items:flex-start;border:1px solid var(--line);border-radius:15px;padding:16px 17px;cursor:pointer;transition:border-color .18s,background .18s;background:#fff;position:relative;}
.sol-radio:hover{border-color:var(--sand);}
.sol-radio input{position:absolute;opacity:0;pointer-events:none;}
.sol-radio .mk{width:20px;height:20px;border-radius:50%;border:2px solid var(--sand);flex:0 0 auto;margin-top:2px;position:relative;transition:border-color .18s;}
.sol-radio .mk::after{content:"";position:absolute;inset:3px;border-radius:50%;background:var(--orange);transform:scale(0);transition:transform .18s;}
.sol-radio .tt{display:block;font-size:15px;font-weight:500;}
.sol-radio .dd{font-size:13px;color:var(--ink-soft);margin-top:3px;}
.sol-radio.sel{border-color:var(--olive);background:rgba(99,113,84,.05);}
.sol-radio.sel .mk{border-color:var(--orange);}
.sol-radio.sel .mk::after{transform:scale(1);}

/* submit */
.sol-submit{width:100%;display:flex;align-items:center;justify-content:center;gap:.5em;min-height:54px;margin-top:30px;background:var(--orange);color:#fff;font-size:16px;font-weight:500;border:0;border-radius:999px;transition:background .18s,transform .1s;}
.sol-submit:hover{background:#e8431f;}
.sol-submit:active{transform:translateY(1px);}
.sol-submit:disabled{opacity:.6;cursor:wait;}
.sol-micro{font-size:12.5px;color:var(--ink-soft);text-align:center;margin-top:14px;line-height:1.5;}

/* honeypot: fuera de vista, no display:none (algunos bots lo detectan) */
.sol-hp{position:absolute;left:-9999px;top:-9999px;height:0;width:0;overflow:hidden;}

/* ===== SUCCESS ===== */
.sol-ok{text-align:center;padding:14px 6px 6px;animation:solIn .5s ease both;}
@keyframes solIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
.sol-check{width:76px;height:76px;border-radius:50%;background:rgba(99,113,84,.12);color:var(--olive);display:flex;align-items:center;justify-content:center;margin:0 auto 22px;}
.sol-check svg{width:38px;height:38px;}
.sol-ok h2{font-size:clamp(28px,6vw,38px);font-weight:200;letter-spacing:-.02em;}
.sol-ok p{font-size:15px;color:var(--ink-soft);margin:14px auto 0;max-width:34ch;}
.sol-ghost{display:inline-flex;align-items:center;gap:.5em;min-height:48px;padding:0 24px;margin-top:28px;border:1px solid var(--line);border-radius:999px;font-size:14px;font-weight:500;color:var(--olive);background:transparent;transition:border-color .18s;}
.sol-ghost:hover{border-color:var(--olive);}

@media(max-width:520px){.sol-hero{padding:100px 20px 108px;}}
`;
