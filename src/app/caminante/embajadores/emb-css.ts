// CSS del PROGRAMA DE EMBAJADORES (/caminante/embajadores) — página pública.
// Misma paleta y lenguaje que .sol (Claude Design jul 2026): crema/olivo/naranja,
// display 200 con acento itálico naranja, glass sobre foto (regla de la casa),
// mono para eyebrows. Scopeado .emb-*.
export const EMB_CSS = `
.emb{font-family:"Geist",system-ui,sans-serif;background:#fbfbf7;color:#20211c;-webkit-font-smoothing:antialiased;line-height:1.5;min-height:100vh;
  --cream:#fbfbf7;--charcoal:#20211c;--olive:#637154;--olive-d:#4f5d44;--forest:#20392b;
  --sand:#b6ada5;--salvia:#d6d8c7;--orange:#ff5d36;
  --panel:#f1eee7;--line:rgba(32,33,28,.13);--ink-soft:rgba(32,33,28,.6);
  --r:22px;--eb:.24em;--mono:"Geist Mono",ui-monospace,monospace;
  --shadow:0 30px 70px -34px rgba(32,33,28,.5);}
.emb *{box-sizing:border-box;margin:0;padding:0;}
.emb img{display:block;max-width:100%;}
.emb button{font-family:inherit;cursor:pointer;}
.emb a{color:var(--olive);text-decoration:none;}
.emb a:hover{color:var(--olive-d);}
.emb input,.emb textarea{font-family:inherit;}

.emb-eyebrow{font-family:var(--mono);font-size:11.5px;font-weight:500;letter-spacing:var(--eb);text-transform:uppercase;display:inline-flex;align-items:center;gap:.55em;}
.emb-eyebrow .sl{color:var(--orange);font-weight:700;}
.emb-display{font-weight:200;letter-spacing:-.02em;line-height:1.04;}
em.emb-ac{font-style:italic;color:var(--orange);font-weight:300;}

/* ===== HERO ===== */
.emb-hero{position:relative;isolation:isolate;color:#fff;padding:128px 22px 96px;text-align:center;overflow:hidden;}
.emb-hero .emb-ph{position:absolute;inset:0;z-index:-2;}
.emb-hero .emb-ph img{width:100%;height:100%;object-fit:cover;}
.emb-hero::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(to bottom,rgba(18,26,17,.6) 0%,rgba(18,26,17,.42) 45%,rgba(18,26,17,.74) 100%);}
.emb-hero .emb-eyebrow{color:rgba(255,255,255,.9);justify-content:center;}
.emb-hero h1{font-size:clamp(40px,8.4vw,72px);margin-top:18px;}
.emb-hero .emb-sub{font-size:clamp(15px,2.2vw,18.5px);font-weight:300;color:rgba(255,255,255,.88);margin:18px auto 0;max-width:44ch;}
.emb-topbar{position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;justify-content:space-between;padding:20px 22px;}
/* Wordmark COMPLETO (sello + CAMINANTE) todo en blanco — como el landing, en blanco */
.emb-logo{height:20px;display:block;}
.emb-logo svg{height:100%;width:auto;display:block;}
.emb .emb-logo .g1,.emb .emb-logo .g2,.emb .emb-logo .g3,.emb .emb-logo .gw{fill:#fff;}
/* ⚠️ Los links del hero se prefijan con .emb: la regla `.emb a{color:olive}`
   (0-1-1) le ganaba a una clase sola (0-1-0) y el CTA salía verde. */
.emb .emb-back{font-size:13px;font-weight:500;color:rgba(255,255,255,.85);display:inline-flex;align-items:center;gap:.5em;}
.emb .emb-back:hover{color:#fff;}
/* CTA glass del hero (regla de la casa: glassy sobre foto) */
.emb .emb-cta{display:inline-flex;align-items:center;justify-content:center;gap:.55em;min-height:56px;padding:0 34px;margin-top:34px;border-radius:999px;font-size:16px;font-weight:500;color:#fff;background:rgba(255,93,54,.92);border:1px solid rgba(255,255,255,.25);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:background .18s,transform .1s;}
.emb .emb-cta:hover{background:#e8431f;color:#fff;}
.emb .emb-cta:active{transform:translateY(1px);}

/* ===== SECCIONES ===== */
/* Ritmo: foto → crema → PANEL (tinte) → foto → crema → foto manifiesto →
   BOSQUE (oscuro) → foto con card. Dos secciones seguidas nunca comparten
   fondo — feedback de Luis: "se pierde". */
.emb-wrap{max-width:1020px;margin:0 auto;padding:0 22px;}
.emb-sec{padding:72px 0 40px;}
.emb-sec .emb-eyebrow{color:var(--olive);}
.emb-sec h2{font-size:clamp(28px,5vw,44px);font-weight:200;letter-spacing:-.02em;margin-top:14px;max-width:22ch;}
.emb-sec .emb-lead{font-size:clamp(15px,2vw,17px);font-weight:300;color:var(--ink-soft);margin-top:14px;max-width:56ch;}
/* sección con tinte panel (rompe el blanco) */
.emb-tint{background:var(--panel);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
.emb-tint .emb-step{background:var(--cream);}
/* banda manifiesto: UNA línea grande sobre foto */
.emb-manif{position:relative;isolation:isolate;color:#fff;padding:110px 22px;text-align:center;overflow:hidden;}
.emb-manif .emb-ph{position:absolute;inset:0;z-index:-2;}
.emb-manif .emb-ph img{width:100%;height:100%;object-fit:cover;}
.emb-manif::after{content:"";position:absolute;inset:0;z-index:-1;background:rgba(18,26,17,.52);}
.emb-manif p{font-size:clamp(26px,4.6vw,42px);font-weight:200;letter-spacing:-.02em;line-height:1.15;max-width:24ch;margin:0 auto;}
.emb-manif p b{font-weight:400;font-style:italic;color:var(--orange);}
/* sección OSCURA (reglas) */
.emb-dark{background:var(--forest);color:#fff;}
.emb-dark .emb-eyebrow{color:var(--salvia);}
.emb-dark .emb-regla{color:rgba(255,255,255,.82);border-bottom-color:rgba(255,255,255,.16);}
.emb-dark .emb-regla b{color:#fff;}
/* sección del FORM sobre foto (la card crema encima) */
.emb-formband{position:relative;isolation:isolate;color:#fff;padding:84px 22px 96px;overflow:hidden;scroll-margin-top:20px;}
.emb-formband .emb-ph{position:absolute;inset:0;z-index:-2;}
.emb-formband .emb-ph img{width:100%;height:100%;object-fit:cover;}
.emb-formband::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(to bottom,rgba(18,26,17,.66),rgba(18,26,17,.78));}
.emb-formband .emb-eyebrow{color:rgba(255,255,255,.9);}
.emb-formband h2{color:#fff;}
.emb-formband .emb-lead{color:rgba(255,255,255,.85);}

/* dos columnas tú/nosotros */
.emb-duo{display:grid;gap:18px;margin-top:34px;}
@media(min-width:760px){.emb-duo{grid-template-columns:1fr 1fr;}}
.emb-col{border:1px solid var(--line);border-radius:var(--r);background:#fff;padding:26px 28px;}
.emb-col.na{border-top:3px solid var(--orange);}
.emb-col.ve{border-top:3px solid var(--olive);}
.emb-col .k{font-family:var(--mono);font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;}
.emb-col.na .k{color:var(--orange);}
.emb-col.ve .k{color:var(--olive);}
.emb-col ul{list-style:none;margin-top:16px;display:flex;flex-direction:column;gap:12px;}
.emb-col li{display:flex;gap:11px;font-size:14.5px;line-height:1.55;}
.emb-col li::before{content:"—";color:var(--sand);flex:0 0 auto;}

/* pasos */
.emb-steps{display:grid;gap:16px;margin-top:34px;}
@media(min-width:700px){.emb-steps{grid-template-columns:repeat(2,1fr);}}
@media(min-width:1000px){.emb-steps{grid-template-columns:repeat(4,1fr);}}
.emb-step{border:1px solid var(--line);border-radius:18px;background:#fff;padding:22px 22px 20px;}
.emb-step .n{font-family:var(--mono);font-size:30px;font-weight:300;color:var(--olive);}
.emb-step .n.na{color:var(--orange);}
.emb-step .t{font-family:var(--mono);font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--olive-d);margin-top:12px;}
.emb-step p{font-size:13.5px;line-height:1.55;color:var(--ink-soft);margin-top:8px;}

/* banda de foto con cards glass (lo que recibes) */
.emb-band{position:relative;isolation:isolate;color:#fff;margin-top:72px;padding:78px 22px;overflow:hidden;}
.emb-band .emb-ph{position:absolute;inset:0;z-index:-2;}
.emb-band .emb-ph img{width:100%;height:100%;object-fit:cover;}
.emb-band::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(to bottom,rgba(18,26,17,.55),rgba(18,26,17,.68));}
.emb-band .emb-eyebrow{color:rgba(255,255,255,.9);}
.emb-band h2{font-size:clamp(28px,5vw,44px);font-weight:200;letter-spacing:-.02em;margin-top:14px;color:#fff;}
.emb-band-grid{display:grid;gap:16px;margin-top:34px;}
@media(min-width:760px){.emb-band-grid{grid-template-columns:repeat(3,1fr);}}
.emb-glass{background:rgba(251,251,247,.12);border:1px solid rgba(255,255,255,.28);border-radius:18px;padding:22px 22px 20px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);}
.emb-glass .k{font-family:var(--mono);font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.92);}
.emb-glass p{font-size:13.5px;line-height:1.6;color:rgba(255,255,255,.85);margin-top:10px;}

/* perfil buscado */
.emb-perfiles{display:grid;gap:16px;margin-top:34px;}
@media(min-width:760px){.emb-perfiles{grid-template-columns:repeat(3,1fr);}}
.emb-perfil{border:1px solid var(--line);border-radius:18px;background:#fff;padding:22px;}
.emb-perfil .k{font-family:var(--mono);font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--olive);}
.emb-perfil p{font-size:13.5px;line-height:1.6;color:var(--ink-soft);margin-top:10px;}
.emb-nota{border:1px solid rgba(255,93,54,.35);background:rgba(255,93,54,.06);border-radius:16px;padding:18px 22px;margin-top:22px;font-size:14.5px;line-height:1.6;}

/* reglas claras */
.emb-reglas{display:grid;gap:10px 26px;margin-top:30px;}
@media(min-width:760px){.emb-reglas{grid-template-columns:1fr 1fr;}}
.emb-regla{display:flex;gap:11px;font-size:14px;line-height:1.6;color:var(--ink-soft);padding:9px 0;border-bottom:1px solid var(--line);}
.emb-regla::before{content:"//";font-family:var(--mono);color:var(--orange);font-weight:700;font-size:12px;line-height:1.9;flex:0 0 auto;}
.emb-regla b{color:var(--charcoal);font-weight:600;}

/* ===== FORM ===== */
.emb-card{max-width:640px;margin:34px auto 0;background:var(--cream);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);padding:clamp(24px,5vw,40px);}
.emb-err{border:1px solid rgba(255,93,54,.4);background:rgba(255,93,54,.08);color:#b33517;border-radius:13px;padding:12px 16px;font-size:13.5px;margin-bottom:22px;}
.emb-group{margin-bottom:30px;}
.emb-group:last-of-type{margin-bottom:0;}
.emb-glabel{display:flex;align-items:baseline;gap:10px;margin-bottom:15px;}
.emb-glabel .emb-eyebrow{color:var(--olive);}
.emb-fields{display:grid;gap:14px;}
.emb-fg{display:flex;flex-direction:column;gap:6px;}
.emb-fg label{font-size:12px;font-weight:600;letter-spacing:.05em;color:var(--charcoal);}
.emb-fg input,.emb-fg textarea{font-size:15px;padding:13px 15px;border:1px solid var(--line);border-radius:13px;background:#fff;color:var(--charcoal);transition:border-color .18s,box-shadow .18s;width:100%;}
.emb-fg input::placeholder,.emb-fg textarea::placeholder{color:var(--sand);}
.emb-fg input:focus,.emb-fg textarea:focus{outline:none;border-color:var(--olive);box-shadow:0 0 0 3px rgba(99,113,84,.16);}
.emb-fg textarea{resize:vertical;min-height:76px;}
.emb-hint{font-size:12.5px;color:var(--ink-soft);font-style:italic;margin-top:4px;}

/* radio cards (perfil) */
.emb-radios{display:grid;gap:12px;}
.emb-radio{display:flex;gap:13px;align-items:flex-start;border:1px solid var(--line);border-radius:15px;padding:16px 17px;cursor:pointer;transition:border-color .18s,background .18s;background:#fff;position:relative;}
.emb-radio:hover{border-color:var(--sand);}
.emb-radio input{position:absolute;opacity:0;pointer-events:none;}
.emb-radio .mk{width:20px;height:20px;border-radius:50%;border:2px solid var(--sand);flex:0 0 auto;margin-top:2px;position:relative;transition:border-color .18s;}
.emb-radio .mk::after{content:"";position:absolute;inset:3px;border-radius:50%;background:var(--orange);transform:scale(0);transition:transform .18s;}
.emb-radio .tt{display:block;font-size:15px;font-weight:500;}
.emb-radio .dd{font-size:13px;color:var(--ink-soft);margin-top:3px;}
.emb-radio.sel{border-color:var(--olive);background:rgba(99,113,84,.05);}
.emb-radio.sel .mk{border-color:var(--orange);}
.emb-radio.sel .mk::after{transform:scale(1);}

.emb-submit{width:100%;display:flex;align-items:center;justify-content:center;gap:.5em;min-height:54px;margin-top:30px;background:var(--orange);color:#fff;font-size:16px;font-weight:500;border:0;border-radius:999px;transition:background .18s,transform .1s;}
.emb-submit:hover{background:#e8431f;}
.emb-submit:active{transform:translateY(1px);}
.emb-submit:disabled{opacity:.6;cursor:wait;}
.emb-micro{font-size:12.5px;color:var(--ink-soft);text-align:center;margin-top:14px;line-height:1.5;}
.emb-hp{position:absolute;left:-9999px;top:-9999px;height:0;width:0;overflow:hidden;}

/* success */
.emb-ok{text-align:center;padding:14px 6px 6px;animation:embIn .5s ease both;}
@keyframes embIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
.emb-check{width:76px;height:76px;border-radius:50%;background:rgba(99,113,84,.12);color:var(--olive);display:flex;align-items:center;justify-content:center;margin:0 auto 22px;}
.emb-check svg{width:38px;height:38px;}
.emb-ok h2{font-size:clamp(28px,6vw,38px);font-weight:200;letter-spacing:-.02em;}
.emb-ok p{font-size:15px;color:var(--ink-soft);margin:14px auto 0;max-width:38ch;}
.emb-ghost{display:inline-flex;align-items:center;gap:.5em;min-height:48px;padding:0 24px;margin-top:28px;border:1px solid var(--line);border-radius:999px;font-size:14px;font-weight:500;color:var(--olive);background:transparent;transition:border-color .18s;}
.emb-ghost:hover{border-color:var(--olive);}

/* pie */
.emb-foot{border-top:1px solid var(--line);padding:26px 22px 34px;text-align:center;font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);}

@media(max-width:520px){.emb-hero{padding:104px 20px 84px;} .emb-cta-ghost{margin-left:0;}}
`;
