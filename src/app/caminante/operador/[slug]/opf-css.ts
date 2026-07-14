// CSS del perfil público de operador (diseño Claude Design, jul 2026). Scopeado
// `.opf`; sin @font-face (Geist ya es global en el sitio). Clases `.opf-*`
// verbatim del HTML entregado. La sección "equipo" se omite (sin modelo de datos).
export const OPF_CSS = `
.opf{--cream:#fbfbf7;--ink:#20211c;--lagoon:#1c6f6a;--forest:#20392b;--olive:#637154;--olive-d:#4f5d44;--orange:#ff5d36;--sand:#b6ada5;--salvia:#d6d8c7;--line:rgba(32,33,28,.13);--ink-soft:rgba(32,33,28,.6);--r:24px;--eb:.24em;--shadow:0 20px 50px -30px rgba(32,33,28,.45);--shadow-lg:0 30px 70px -34px rgba(32,33,28,.55);
  font-family:"Geist",system-ui,sans-serif;background:var(--cream);color:var(--ink);-webkit-font-smoothing:antialiased;line-height:1.5;}
.opf *{box-sizing:border-box;margin:0;padding:0;}
.opf img{display:block;max-width:100%;}
.opf a{color:var(--olive);text-decoration:none;}.opf a:hover{color:var(--olive-d);}

.opf-eyebrow{font-size:11px;font-weight:600;letter-spacing:var(--eb);text-transform:uppercase;display:inline-flex;align-items:center;gap:.55em;color:var(--olive);}
.opf-eyebrow .sl{color:var(--orange);font-weight:700;}
.opf-display{font-weight:200;letter-spacing:-.02em;line-height:1.05;}
.opf em.opf-ac{font-style:italic;color:var(--orange);font-weight:300;}

.opf-wrap{max-width:980px;margin:0 auto;padding:0 22px;}

/* HERO */
.opf-hero{position:relative;isolation:isolate;color:#fff;overflow:hidden;padding:96px 0 60px;background:linear-gradient(160deg,#243528 0%,#182014 100%);}
.opf-hero .ph{position:absolute;inset:0;z-index:-2;}
.opf-hero .ph img{width:100%;height:100%;object-fit:cover;}
.opf-hero::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(to bottom,rgba(18,26,20,.55) 0%,rgba(18,26,20,.62) 55%,rgba(18,26,20,.82) 100%);}
.opf-hero .in{display:flex;flex-direction:column;align-items:center;text-align:center;}
.opf-av{width:104px;height:104px;border-radius:50%;overflow:hidden;border:2px solid rgba(255,255,255,.5);box-shadow:0 18px 44px -16px rgba(0,0,0,.5);background:var(--cream);display:flex;align-items:center;justify-content:center;margin-bottom:26px;}
.opf-av svg{width:74%;height:auto;}
.opf-av img{width:100%;height:100%;object-fit:cover;}
.opf-hero .opf-eyebrow{color:rgba(255,255,255,.9);}
.opf-hero h1{font-size:clamp(38px,7.5vw,62px);margin-top:16px;}
.opf-meta{font-size:14px;font-weight:400;letter-spacing:.02em;color:rgba(255,255,255,.78);margin-top:14px;display:flex;align-items:center;gap:.6em;flex-wrap:wrap;justify-content:center;}
.opf-meta a{color:rgba(255,255,255,.85);}
.opf-meta .dot{width:4px;height:4px;border-radius:50%;background:var(--orange);}
.opf-bio{font-size:clamp(15px,2vw,17px);font-weight:300;color:rgba(255,255,255,.88);max-width:52ch;margin-top:20px;line-height:1.65;}

.opf-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:44px;width:100%;max-width:760px;}
@media(min-width:680px){.opf-stats{grid-template-columns:repeat(4,1fr);}}
.opf-stat{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.26);border-radius:18px;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);padding:20px 14px 17px;text-align:center;}
.opf-stat .n{font-size:clamp(26px,4vw,34px);font-weight:200;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums;}
.opf-stat .n .st{color:var(--orange);font-size:.72em;vertical-align:.12em;}
.opf-stat .n small{font-size:.5em;font-weight:400;color:rgba(255,255,255,.7);}
.opf-stat .l{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.72);margin-top:9px;}

/* SECTIONS */
.opf-sec{padding:72px 0 0;}
.opf-sec .hd{margin-bottom:26px;}
.opf-sec h2{font-size:clamp(26px,4.6vw,38px);font-weight:200;letter-spacing:-.02em;margin-top:12px;}

/* experiencias */
.opf-grid{display:grid;grid-template-columns:1fr;gap:18px;}
@media(min-width:600px){.opf-grid{grid-template-columns:repeat(2,1fr);}}
@media(min-width:880px){.opf-grid{grid-template-columns:repeat(3,1fr);}}
.opf-exp{background:#fff;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;box-shadow:var(--shadow);display:flex;flex-direction:column;color:var(--ink);transition:transform .25s ease,box-shadow .25s ease;}
.opf-exp:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg);color:var(--ink);}
.opf-exp .im{aspect-ratio:4/3;overflow:hidden;background:var(--salvia);}
.opf-exp .im img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease;}
.opf-exp:hover .im img{transform:scale(1.05);}
.opf-exp .bd{padding:18px 20px 20px;display:flex;flex-direction:column;gap:6px;flex:1;}
.opf-exp .pl{font-size:10.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--olive);display:inline-flex;gap:.5em;}
.opf-exp .pl .sl{color:var(--orange);font-weight:700;}
.opf-exp h3{font-size:19px;font-weight:400;letter-spacing:-.01em;margin-top:2px;}
.opf-exp .hk{font-size:13.5px;font-weight:300;color:var(--ink-soft);font-style:italic;line-height:1.5;}
.opf-exp .go{font-size:13px;font-weight:600;color:var(--orange);margin-top:auto;padding-top:12px;}
.opf-exp .rt{display:inline-flex;align-items:center;gap:.4em;font-size:13px;font-weight:600;color:var(--ink);margin-top:4px;}
.opf-exp .rt .st{color:var(--orange);}
.opf-exp .rt small{font-weight:400;color:var(--ink-soft);}
.opf-exp .rt.nueva{font-size:10.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--olive);background:rgba(99,113,84,.12);border-radius:999px;padding:4px 10px;}

/* equipo */
.opf-team{display:flex;gap:28px;flex-wrap:wrap;justify-content:flex-start;}
@media(max-width:600px){.opf-team{gap:20px;}}
.opf-member{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:12px;width:230px;}
@media(max-width:600px){.opf-member{width:100%;}}
.opf-member .im{width:132px;height:132px;border-radius:50%;overflow:hidden;border:1px solid var(--line);box-shadow:var(--shadow);display:block;}
.opf-member .im img{width:100%;height:100%;object-fit:cover;}
.opf-member .nm{font-size:15px;font-weight:500;line-height:1.3;}
.opf-member .bio{font-size:13px;font-weight:300;color:var(--ink-soft);line-height:1.55;margin-top:-4px;}
.opf-member .qt{font-size:13px;font-style:italic;color:var(--olive-d);line-height:1.5;}

/* testimonios */
.opf-quotes{display:grid;grid-template-columns:1fr;gap:16px;}
@media(min-width:680px){.opf-quotes{grid-template-columns:repeat(2,1fr);}}
.opf-quote{background:#fff;border:1px solid var(--line);border-radius:20px;box-shadow:var(--shadow);padding:24px 26px;display:flex;flex-direction:column;gap:14px;}
.opf-stars{color:var(--orange);font-size:14px;letter-spacing:.18em;}
.opf-quote blockquote{font-size:16px;font-weight:300;font-style:italic;line-height:1.65;color:var(--ink);}
.opf-quote figcaption{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft);}

/* cierre */
.opf-foot{padding:80px 0 70px;text-align:center;}
.opf-back{font-size:14px;font-weight:500;color:var(--olive);display:inline-flex;align-items:center;gap:.5em;}

@media(max-width:520px){.opf-hero{padding:76px 0 48px;}}
`;
