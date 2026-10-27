// CSS del ESPACIO DEL GRUPO — transcrito del entregable de Claude Design
// (design/comunidad/dc/espacio/css-3.css, «sólo lo nuevo (.esp-*)»).
//
// Cambios mecánicos respecto al entregable, y nada más:
//   · `@container esp (min-width:700px)` → `@media (min-width:700px)`. En la
//     lámina el sujeto era el marco para ver teléfono y escritorio lado a lado;
//     en el sitio el corte es el de siempre, 700px (PATRON.md).
//   · Las reglas de la lámina (.esp-lam, .esp-row, .esp-fig, .esp-frame,
//     .esp-phone, .esp-wrap, .esp-intro, .esp-idx, .esp-pieces, .esp-two,
//     .esp-recibo, el chat .esp-wa y el correo .esp-mail) no viajan: son del
//     documento de diseño, no de la pantalla.
//   · Lo que el entregable aplicaba a `.pub-head` dentro del marco va bajo
//     `.esp` para no tocar el resto del sitio.
//   · En modo «solo» el sitio dibuja `.pub-app` como un teléfono de 390px
//     centrado arriba de 700px; aquí el espacio ocupa el ancho (es la única
//     pantalla pública con versión de escritorio propia).
export const ESP_CSS = `
.pub.esp{--forest:var(--olive)}
.pub.esp .pub-cta-forest{background:var(--olive)}
.esp-donly{display:none}
.esp-body{display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:"hero" "side" "main"}
.esp-body>.pub-hero{grid-area:hero}
.esp-side{grid-area:side}
.esp-main{grid-area:main;min-width:0}
.esp-side .esp-count{margin-bottom:0}
.esp-c1 .esp-right{display:contents}
.esp-dtop{display:none}
.esp-sidenote{font-size:13px;color:var(--ink-soft);line-height:1.5;margin-top:12px}
.esp-aviso{margin:12px 16px 0;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;font-size:13.5px;line-height:1.5;color:var(--charcoal)}
.esp-aviso.err{border-color:var(--orange);color:var(--orange)}
.esp-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,16px);background:var(--charcoal);color:#fff;font-size:13.5px;padding:11px 16px;border-radius:999px;opacity:0;pointer-events:none;transition:.22s;z-index:90}
.esp-toast.show{opacity:1;transform:translate(-50%,0)}
@media (min-width:700px){
.pub.esp{height:auto;min-height:100dvh;display:block}
.pub.esp .pub-app{width:100%;height:auto;max-width:none;margin:0;border-radius:0;border:0;box-shadow:none;overflow:visible}
.pub.esp .pub-scroll{overflow:visible;padding-bottom:0}
.pub.esp .pub-buybar{display:none}
.esp .pub-head{padding:46px 72px 10px;margin-bottom:calc(-100px);grid-template-columns:44px 1fr 44px;gap:16px}
.esp .pub-head .brand .lockup{height:26px}
.esp .esp-c1 .pub-head{padding:36px 40px 10px}
.esp-donly{display:block}.esp-monly{display:none!important}
.esp-dtop{display:flex;align-items:center;justify-content:space-between;padding:18px 40px;border-bottom:1px solid var(--line);background:var(--cream)}
.esp-dtop img{height:24px;width:auto;object-fit:contain}
.esp-dtop .lk{display:flex;gap:26px;font-size:14px;font-weight:500;color:var(--ink-soft)}
.esp-dtop .lk a{color:var(--ink-soft);text-decoration:none}
.esp-dtop .out{font-size:13px;font-weight:500;color:var(--ink-soft);border:1px solid var(--line);border-radius:999px;padding:8px 16px;background:none;font-family:inherit;cursor:pointer}
.esp-body{grid-template-columns:minmax(0,1fr) 400px;grid-template-areas:"hero hero" "main side";column-gap:56px;padding:0 40px 80px;align-items:start}
.esp-body>.pub-hero{border-radius:22px;overflow:hidden;min-height:520px!important;margin-top:24px}
.esp-body>.pub-hero .inner{padding:0 40px 44px!important}
.esp-body>.pub-hero h1{font-size:64px}
.esp-body>.pub-hero .ph{position:absolute;inset:0}
.esp-side{position:sticky;top:24px;margin-top:-72px;background:#fff;border:1px solid var(--line);border-radius:22px;box-shadow:var(--shadow);padding:24px 26px 26px;z-index:3}
.esp-side .esp-count{margin:0;border:0;box-shadow:none;padding:0;border-radius:0}
.esp-side .esp-price{padding:16px 0 0;margin-top:14px;border-top:1px solid var(--line)}
.esp-side .pub-cta{width:100%;margin-top:16px}
.esp-side .mesp-invite{margin-top:16px}
.esp-side .mesp-invite-in{background:var(--panel);border-color:var(--line);backdrop-filter:none;-webkit-backdrop-filter:none}
.esp-side .mesp-invite .t{color:var(--charcoal)}
.esp-side .mesp-cupo{color:var(--ink-soft)}
.esp-side .mesp-linkrow input{background:#fff;color:var(--charcoal);border-color:var(--line)}
.esp-side .mesp-glassbtn{background:var(--panel);color:var(--olive-d);border-color:var(--line)}
.esp-side .mesp-priv{background:rgba(99,113,84,.14);color:var(--olive-d);border-color:transparent}
.esp-side .esp-sidenote{font-size:13px;color:var(--ink-soft);line-height:1.5;margin-top:12px}
.esp-main .pub-sec{padding:40px 0 6px}
.esp-main .pub-sec h2{font-size:34px}
.esp-main .mesp-trip .pad{padding-top:160px!important}
.esp-main .pub-gal{grid-template-columns:1fr 1fr 1fr}
.esp-aviso{margin:16px 40px 0}
/* C1 · foto a media pantalla */
.esp-c1{display:grid;grid-template-columns:1fr 1fr;min-height:780px}
.esp-c1 .pub-hero{min-height:100%!important}
.esp-c1 .pub-hero .inner{display:none}
.esp-c1 .esp-right{display:flex;flex-direction:column;justify-content:center;padding:60px 72px;gap:0}
.esp-c1 .esp-right h1{font-size:44px;font-weight:200;letter-spacing:-.02em;line-height:1.06;margin:14px 0 26px}
.esp-c1 .esp-right h1 em{font-style:italic;color:var(--orange);font-weight:250}
.esp-c1 .esp-count{margin:0}
.esp-c1 .esp-price{padding:18px 0 0}
.esp-c1 .esp-right .pub-sec{padding:20px 0 0}
.esp-c1 .pub-head{position:absolute;left:0;right:0}
/* C2 · tarjeta angosta centrada */
.esp-auth{max-width:440px;margin:64px auto 80px;background:#fff;border:1px solid var(--line);border-radius:22px;box-shadow:var(--shadow);padding:34px 32px 30px}
.esp-auth .pub-sec{padding:0!important}
.esp-authwrap{min-height:860px;background:var(--bg)}
.esp-authwrap .pub-nav{position:static}
}
/* contador de lugares */
.esp-count{margin:-18px 16px 0;position:relative;background:#fff;border:1px solid var(--line);border-radius:20px;box-shadow:var(--shadow);padding:16px 18px 15px}
.esp-count .nm{display:flex;align-items:baseline;gap:10px}
.esp-count .nm b{font-size:44px;font-weight:200;letter-spacing:-.03em;line-height:1}
.esp-count .nm span{font-size:15px;color:var(--ink-soft)}
.esp-count .bar{height:8px;border-radius:999px;background:var(--salvia);overflow:hidden;margin:12px 0 12px}
.esp-count .bar i{display:block;height:100%;background:var(--olive);border-radius:999px}
.esp-count .lim{display:flex;justify-content:space-between;gap:10px;align-items:baseline;flex-wrap:wrap;font-size:14px;font-weight:600;padding-top:11px;border-top:1px solid var(--line)}
.esp-count .lim em{font-style:normal;font-family:var(--mono);font-size:12.5px;font-weight:500;color:var(--olive-d);white-space:nowrap}
.esp-count .note{font-size:13.5px;line-height:1.5;color:var(--ink-soft);margin-top:10px;text-wrap:pretty}
.esp-count.warn .bar i{background:var(--orange)}
.esp-count.warn .lim em{color:var(--orange);font-weight:700}
.esp-count.full .bar i{background:var(--olive)}
/* entré → pagué → firmé */
.esp-steps{list-style:none;display:flex;align-items:center;gap:6px;margin-top:16px;flex-wrap:wrap;padding:0}
.esp-steps li{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:500;color:rgba(255,255,255,.6)}
.esp-steps li+li::before{content:"";width:16px;height:1px;background:rgba(255,255,255,.35);margin-right:2px}
.esp-steps i{font-style:normal;width:24px;height:24px;border-radius:999px;border:1px solid rgba(255,255,255,.4);display:inline-flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:11px}
.esp-steps li.ok{color:#fff}
.esp-steps li.ok i{background:rgba(146,180,110,.35);border-color:rgba(146,180,110,.6);color:#e6efd4}
.esp-steps li.now{color:#fff;font-weight:600}
.esp-steps li.now i{background:var(--orange);border-color:var(--orange);color:#fff}
/* quién va */
.esp-who{flex-direction:column;gap:8px}
.esp-who .mesp-person{width:100%;box-shadow:none;padding:10px 12px}
.esp-who .mesp-person .g{flex:1;min-width:0}
.esp-who .mesp-av{width:38px;height:38px;font-size:13px}
.esp-who .cov{margin-left:26px;width:calc(100% - 26px);background:var(--cream);border-style:dashed}
.esp-who .cov .mesp-av{width:30px;height:30px;font-size:11px;background:#fff;border:1px solid var(--line)}
.esp-host{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--orange);font-weight:700;margin-left:6px}
.esp-st{display:inline-flex;align-items:center;font-size:12px;font-weight:600;padding:6px 11px;border-radius:999px;white-space:nowrap;flex:0 0 auto;background:var(--panel);color:var(--ink-soft)}
.esp-st.pago{background:var(--salvia);color:var(--olive-d)}
.esp-st.firmo{background:var(--olive);color:#fff}
/* precio */
.esp-price{padding:16px 18px 4px}
.esp-price b{font-size:26px;font-weight:300;letter-spacing:-.02em}
.esp-price .q{font-size:15px;color:var(--ink-soft)}
/* código de verificación */
.esp-code{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:18px 0 6px}
.esp-code span{aspect-ratio:4/5;border:1.5px solid var(--line);border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:24px;font-weight:300}
.esp-code span.on{border-color:var(--olive);outline:2px solid rgba(99,113,84,.25)}
.esp-code-in{position:absolute;opacity:0;pointer-events:none;width:1px;height:1px}
.esp-codewrap{position:relative}
.esp-or{display:flex;align-items:center;gap:12px;font-size:12.5px;color:var(--ink-soft);margin:16px 0 4px}
.esp-or::before,.esp-or::after{content:"";flex:1;height:1px;background:var(--line)}
`;
