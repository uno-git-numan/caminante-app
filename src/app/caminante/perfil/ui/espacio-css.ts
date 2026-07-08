// CSS de "Mi espacio" — integrado del HTML de Claude Design
// ("Caminante Web - Mi espacio (completo).html", jul 2026). Scopeado bajo
// `.mesp` (sin @font-face: Geist ya es global). Clases `.mesp-*` verbatim.
export const ESPACIO_CSS = `
.mesp{
  --cream:#fbfbf7;--charcoal:#20211c;--olive:#637154;--olive-d:#4f5d44;--forest:#20392b;
  --sand:#b6ada5;--salvia:#d6d8c7;--orange:#ff5d36;
  --panel:#f1eee7;--line:rgba(32,33,28,.13);--ink-soft:rgba(32,33,28,.6);
  --r:22px;--eb:.24em;--mono:"Geist Mono",ui-monospace,monospace;
  --shadow:0 20px 50px -30px rgba(32,33,28,.45);
  --shadow-lg:0 30px 70px -34px rgba(32,33,28,.55);
  font-family:"Geist",system-ui,sans-serif;background:var(--cream);color:var(--charcoal);
  -webkit-font-smoothing:antialiased;line-height:1.5;min-height:100vh;
}
.mesp *{box-sizing:border-box;margin:0;padding:0;}
.mesp img{display:block;max-width:100%;}
.mesp button{font-family:inherit;cursor:pointer;}
.mesp a{color:var(--olive);text-decoration:none;}
.mesp a:hover{color:var(--olive-d);}
.mesp input,.mesp textarea,.mesp select{font-family:inherit;}

.mesp-eyebrow{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:var(--eb);text-transform:uppercase;display:inline-flex;align-items:center;gap:.55em;color:var(--olive);}
.mesp-eyebrow .sl{color:var(--orange);font-weight:700;}
.mesp-display{font-weight:200;letter-spacing:-.02em;line-height:1.04;}
.mesp em.mesp-ac{font-style:italic;color:var(--orange);font-weight:300;}

/* pill buttons */
.mesp-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5em;min-height:44px;padding:0 20px;border-radius:999px;font-size:14px;font-weight:500;border:1px solid transparent;transition:background .18s,transform .1s,border-color .18s,color .18s;white-space:nowrap;text-align:center;}
.mesp-btn:active{transform:translateY(1px);}
.mesp-orange{background:var(--orange);color:#fff;}.mesp-orange:hover{background:#e8431f;color:#fff;}
.mesp-outline{background:transparent;color:var(--olive);border-color:var(--line);}.mesp-outline:hover{border-color:var(--olive);}
.mesp-soft{background:var(--panel);color:var(--charcoal);}.mesp-soft:hover{background:#e9e5db;color:var(--charcoal);}
.mesp-sm{min-height:38px;padding:0 15px;font-size:13px;}

/* ===== TOPBAR ===== */
.mesp-top{position:sticky;top:0;z-index:50;background:rgba(251,251,247,.86);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line);}
.mesp-top .in{max-width:900px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:13px 22px;}
.mesp-logo{height:23px;display:block;}.mesp-logo svg{height:100%;width:auto;display:block;}
.mesp-logo .g1{fill:var(--olive);}.mesp-logo .g2{fill:var(--sand);}.mesp-logo .g3{fill:var(--orange);}
.mesp-out{font-size:13px;font-weight:500;color:var(--ink-soft);border:1px solid var(--line);border-radius:999px;padding:8px 16px;background:transparent;transition:all .18s;}
.mesp-out:hover{color:var(--charcoal);border-color:var(--sand);}

.mesp-wrap{max-width:900px;margin:0 auto;padding:0 22px 110px;}

/* ===== HEADER ===== */
.mesp-hd{padding:46px 0 8px;}
.mesp-hd h1{font-size:clamp(38px,8vw,60px);margin-top:16px;}
.mesp-hd .sub{font-size:17px;font-weight:300;color:var(--ink-soft);margin-top:10px;font-style:italic;}
.mesp-flash{margin-top:22px;border-radius:14px;padding:12px 16px;font-size:13.5px;font-weight:500;}
.mesp-flash.ok{background:rgba(99,113,84,.14);color:var(--olive-d);border:1px solid rgba(99,113,84,.3);}
.mesp-flash.err{background:rgba(255,93,54,.08);color:#b33517;border:1px solid rgba(255,93,54,.35);}

.mesp-sec{margin-top:54px;}
.mesp-sec > .mesp-eyebrow{margin-bottom:8px;}
.mesp-sec .lead{font-size:14px;color:var(--ink-soft);margin-bottom:18px;}

/* ===== TRIP CARDS ===== */
.mesp-trip{position:relative;border-radius:var(--r);overflow:hidden;box-shadow:var(--shadow-lg);margin-bottom:22px;color:#fff;isolation:isolate;background:var(--forest);}
.mesp-trip .ph{position:absolute;inset:0;z-index:-2;}
.mesp-trip .ph img{width:100%;height:100%;object-fit:cover;}
.mesp-trip::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(to top,rgba(16,20,13,.9) 0%,rgba(16,20,13,.5) 46%,rgba(16,20,13,.08) 74%,rgba(16,20,13,.22) 100%);}
.mesp-trip .pad{padding:150px 24px 24px;}
.mesp-trip .chip-date{position:absolute;top:20px;right:20px;display:inline-flex;align-items:center;gap:.5em;font-family:var(--mono);font-size:12px;font-weight:500;color:#fff;padding:9px 15px;border-radius:999px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);}
.mesp-trip .eb{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:var(--eb);text-transform:uppercase;color:rgba(255,255,255,.86);display:inline-flex;gap:.5em;}
.mesp-trip .eb .sl{color:var(--orange);font-weight:700;}
.mesp-trip h3{font-size:clamp(28px,5.2vw,40px);font-weight:200;letter-spacing:-.02em;line-height:1.04;margin-top:10px;}
.mesp-trip .pax{font-size:14px;color:rgba(255,255,255,.82);margin-top:8px;}
.mesp-trip .st{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px;}
.mesp-stchip{display:inline-flex;align-items:center;gap:.45em;font-size:12.5px;font-weight:600;padding:8px 14px;border-radius:999px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);white-space:nowrap;}
.st-ok{background:rgba(146,180,110,.28);color:#e6efd4;border:1px solid rgba(146,180,110,.4);}
.st-ok .tk{color:#c9e3a8;font-weight:700;}
.st-amber{background:rgba(228,196,132,.28);color:#f4dfae;border:1px solid rgba(228,196,132,.42);}
.st-warn{background:rgba(255,93,54,.26);color:#ffd2c6;border:1px solid rgba(255,93,54,.5);}
.st-warn .dot,.st-amber .dot{width:6px;height:6px;border-radius:50%;background:currentColor;}
.mesp-trip .acts{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px;}
.mesp-glassbtn{display:inline-flex;align-items:center;justify-content:center;gap:.5em;min-height:44px;padding:0 18px;font-size:13.5px;font-weight:500;color:#fff;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:background .18s,transform .1s;}
.mesp-glassbtn:hover{background:rgba(255,255,255,.26);color:#fff;}
.mesp-glassbtn:active{transform:translateY(1px);}
.mesp-orange-lg{min-height:44px;padding:0 20px;font-size:14px;font-weight:600;background:var(--orange);color:#fff;border:0;border-radius:999px;box-shadow:0 12px 28px -12px rgba(255,93,54,.8);transition:background .18s,transform .1s;display:inline-flex;align-items:center;gap:.5em;}
.mesp-orange-lg:hover{background:#e8431f;color:#fff;}
.mesp-orange-lg:active{transform:translateY(1px);}

/* invite pop (inside trip) */
.mesp-invite{max-height:0;overflow:hidden;transition:max-height .35s ease,margin .35s ease,opacity .3s ease;opacity:0;margin-top:0;}
.mesp-invite.open{max-height:520px;opacity:1;margin-top:18px;}
.mesp-invite-in{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.26);border-radius:18px;padding:20px;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);}
.mesp-invite .t{font-size:14px;font-weight:300;color:rgba(255,255,255,.92);line-height:1.55;}
.mesp-priv{display:inline-flex;align-items:center;gap:.5em;font-family:var(--mono);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:rgba(99,113,84,.5);border:1px solid rgba(255,255,255,.24);border-radius:999px;padding:6px 12px;margin-bottom:12px;}
.mesp-cupo{font-size:12.5px;color:rgba(255,255,255,.8);margin-top:8px;}
.mesp-linkrow{display:flex;gap:8px;margin-top:14px;}
.mesp-linkrow input{flex:1;min-width:0;font-size:13px;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.3);background:rgba(0,0,0,.22);color:#fff;font-family:var(--mono);}
.mesp-linkrow input:focus{outline:none;border-color:rgba(255,255,255,.6);}
.mesp-invite .row2{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px;}

/* ===== GENTE ===== */
.mesp-invite-friend{background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px;}
.mesp-invite-friend .l .tt{font-size:15px;font-weight:500;}
.mesp-invite-friend .l .dd{font-size:13px;color:var(--ink-soft);margin-top:2px;}
.mesp-invite-friend .r{display:flex;gap:8px;flex-wrap:wrap;}
.mesp-people{display:flex;gap:12px;flex-wrap:wrap;align-items:stretch;}
.mesp-person{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px 18px 12px 12px;box-shadow:var(--shadow);}
.mesp-av{width:42px;height:42px;border-radius:50%;background:var(--salvia);color:var(--olive-d);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;flex:0 0 auto;text-transform:uppercase;}
.mesp-person .nm{font-size:14.5px;font-weight:500;}
.mesp-person .mt{font-size:12.5px;color:var(--ink-soft);}
.mesp-addp{display:flex;align-items:center;gap:10px;border:1.5px dashed var(--sand);border-radius:16px;padding:12px 20px;color:var(--olive);font-size:14px;font-weight:500;background:transparent;transition:border-color .18s;}
.mesp-addp:hover{border-color:var(--olive);}
.mesp-addform{max-height:0;overflow:hidden;opacity:0;transition:max-height .35s ease,opacity .3s ease,margin .3s ease;}
.mesp-addform.on{max-height:400px;opacity:1;margin-top:16px;}

/* ===== VIVIDAS (álbum) ===== */
.mesp-album{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;}
.mesp-mem{background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:var(--shadow);display:flex;flex-direction:column;}
.mesp-mem .im{aspect-ratio:16/10;overflow:hidden;position:relative;background:var(--panel);}
.mesp-mem .im img{width:100%;height:100%;object-fit:cover;filter:saturate(.94) sepia(.06);transition:transform .5s ease;}
.mesp-mem:hover .im img{transform:scale(1.04);}
.mesp-mem .body{padding:16px 18px 18px;display:flex;flex-direction:column;gap:5px;flex:1;}
.mesp-mem .nm{font-size:17px;font-weight:400;}
.mesp-mem .mt{font-family:var(--mono);font-size:11.5px;color:var(--ink-soft);letter-spacing:.03em;}
.mesp-mem .foot{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:14px;}
.mesp-seal{font-size:12.5px;color:var(--olive);font-weight:600;display:inline-flex;align-items:center;gap:.4em;}

/* ===== ACCORDION ===== */
.mesp-acc{background:#fff;border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow);margin-top:14px;overflow:hidden;}
.mesp-acc-h{width:100%;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:19px 22px;background:transparent;border:0;text-align:left;}
.mesp-acc-h .l .ti{display:block;font-size:16px;font-weight:500;}
.mesp-acc-h .l .su{font-size:12.5px;color:var(--ink-soft);margin-top:2px;}
.mesp-chev{color:var(--sand);font-size:11px;transition:transform .25s ease;flex:0 0 auto;}
.mesp-acc.open .mesp-chev{transform:rotate(180deg);}
.mesp-acc-b{max-height:0;opacity:0;overflow:hidden;transition:max-height .4s ease,opacity .3s ease;}
.mesp-acc.open .mesp-acc-b{max-height:2000px;opacity:1;}
.mesp-acc-in{padding:2px 22px 22px;}

.mesp-fg{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;}
.mesp-fg label{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--olive);}
.mesp-fg input,.mesp-fg select,.mesp-fg textarea{font-size:14px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--cream);color:var(--charcoal);transition:border-color .18s,box-shadow .18s;width:100%;}
.mesp-fg input:focus,.mesp-fg select:focus,.mesp-fg textarea:focus{outline:none;border-color:var(--olive);box-shadow:0 0 0 3px rgba(99,113,84,.15);}
.mesp-fg textarea{resize:vertical;min-height:60px;}
.mesp-f2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.mesp-note{font-size:12.5px;color:var(--ink-soft);font-style:italic;margin:6px 0 14px;line-height:1.5;}
.mesp-sub-eb{font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--sand);margin:20px 0 12px;}
.mesp-save{display:flex;justify-content:flex-end;gap:10px;margin-top:6px;}

/* toggle (checkbox estilado) */
.mesp-toggle{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 0 6px;cursor:pointer;}
.mesp-toggle .tl{font-size:14px;font-weight:500;}
.mesp-toggle input{position:absolute;opacity:0;pointer-events:none;}
.mesp-sw{position:relative;width:46px;height:26px;flex:0 0 auto;border-radius:999px;background:var(--sand);transition:background .2s;}
.mesp-sw::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.2);}
.mesp-toggle input:checked + .mesp-sw{background:var(--olive);}
.mesp-toggle input:checked + .mesp-sw::after{transform:translateX(20px);}

/* deslindes list */
.mesp-sig{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 0;border-bottom:1px solid var(--line);flex-wrap:wrap;}
.mesp-sig:last-child{border-bottom:0;}
.mesp-sig .tt{font-size:14.5px;font-weight:500;}
.mesp-sig .mt{font-size:12.5px;color:var(--ink-soft);margin-top:2px;}
.mesp-sig .r{display:flex;align-items:center;gap:12px;}
.mesp-ver{font-family:var(--mono);font-size:11px;color:var(--ink-soft);background:var(--panel);border-radius:7px;padding:3px 9px;}

/* toast */
.mesp-toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--forest);color:#fff;font-size:13.5px;font-weight:500;padding:12px 20px;border-radius:999px;box-shadow:0 16px 40px -12px rgba(0,0,0,.5);opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;z-index:100;display:inline-flex;align-items:center;gap:.5em;}
.mesp-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}

/* empty state */
.mesp-empty{border:1.5px dashed var(--sand);border-radius:var(--r);padding:40px 28px;text-align:center;background:rgba(214,216,199,.18);}
.mesp-empty h3{font-size:22px;font-weight:200;letter-spacing:-.01em;}
.mesp-empty p{font-size:14px;color:var(--ink-soft);margin-top:8px;}
.mesp-empty .acts{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:22px;}

@media(max-width:640px){.mesp-album{grid-template-columns:1fr;}}
@media(max-width:520px){.mesp-f2{grid-template-columns:1fr;}}
`;
