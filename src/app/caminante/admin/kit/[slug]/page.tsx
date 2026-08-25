// KIT DE COMUNICACIÓN de una experiencia (solo admin) — DASHBOARD.
// Re-diseño 20 jul: de 18 tarjetas gigantes en lista a un tablero glanceable:
// KPIs arriba (¡«sin captions» VISIBLE — ese estado invisible escondió un bug
// días!), UNA barra de acciones sticky, y las piezas como filas compactas
// agrupadas por momento (M1/M2/M3/E) que se expanden en acordeón (<details>
// nativo — la página es inmersiva, sin AdminShell, no hay script [data-x]).
// Cada fila muestra su CICLO DE VIDA real leyendo social_posts (pieza-estado):
// falta insumo → sin caption → lista → programada → publicada / falló.
//
// ⚠️ REGLAS DURAS:
// - El bloque off-screen `.off` ([data-piece] + KitDeck a tamaño real) es la
//   FUENTE de los PNG: KitPieceControls y CampanaButton leen del DOM
//   `[data-piece="ID"] .slide`. No moverlo, no renombrarlo.
// - KitPieceControls: lógica intocable (campaña en vivo); recibe las mismas
//   4 props de siempre.
// - SIN EMOJIS en todo el Kit (decisión de Luis, 20 jul): jerarquía por
//   tipografía, peso y color; estados = puntos de color.
import { notFound } from "next/navigation";
import { puedeEditarSlug } from "@/lib/auth/alcance";
import { fetchKitContext } from "@/lib/kit/queries";
import { PIEZAS, PIEZAS_E, expName, type Lamina, type PieceDef, type PieceState, type Momento } from "@/lib/kit/kit";
import { fetchEstadoPiezas, fechaPill, type PiezaEnCola } from "@/lib/kit/pieza-estado";
import { HORA_PUBLICACION } from "@/lib/social/publish-hora";
import type { PageV2 } from "@/lib/experiences/types";
import CaptionsRunner from "./CaptionsRunner";
import { captionToText, palabraTrigger, type KitCaptions } from "@/lib/ai/kit-captions";
import { kitCss } from "./kit-css";
import KitDeck from "./KitDeck";
import { KitPieceControls } from "./KitClient";
import { CampanaButton } from "./CampanaButton";
import ConexionRedes from "./ConexionRedes";
import { fetchConnectedAccount } from "@/lib/social/accounts";
import BoletinPanel from "./BoletinPanel";
import { fetchBoletin } from "@/lib/newsletter/queries";
import { composeNewsletter } from "@/lib/newsletter/compose";
import { contarDestinatarios } from "@/lib/newsletter/send";
import { renderNewsletter } from "@/lib/newsletter/templates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const metadata = { title: "Kit de comunicación · Admin" };

const UI = `
.kt{max-width:1080px;margin:0 auto;padding:26px 22px 120px;font-family:"Geist",system-ui,sans-serif;color:#20211c;}
.kt a{color:inherit;}
.kt .eyebrow{font-size:12px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:#637154;}
.kt h1{font-size:34px;font-weight:200;letter-spacing:-.02em;margin:6px 0 4px;}
.kt .lead{color:rgba(32,33,28,.62);font-size:14px;line-height:1.5;max-width:70ch;}
.kt .topbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap;}
.kt .back{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#637154;text-decoration:none;}
.kt .igchip{font-family:"Geist Mono",monospace;font-size:11.5px;letter-spacing:.08em;color:#4f5d44;text-decoration:none;display:inline-flex;align-items:center;gap:7px;}
.kt .igchip .dot{width:7px;height:7px;border-radius:50%;background:#637154;}
.kt .note{background:#f1eee7;border-radius:12px;padding:10px 16px;font-size:12.5px;color:#4f5d44;margin:14px 0;border:1px solid rgba(32,33,28,.08);}
.kt .banner{border-radius:12px;padding:10px 16px;font-size:13.5px;margin:12px 0;}
.kt .ok{background:rgba(99,113,84,.12);color:#4f5d44;}
.kt .err{background:rgba(255,93,54,.1);color:#c23c1c;border:1px solid rgba(255,93,54,.3);}
.kt .btn{display:inline-flex;align-items:center;gap:6px;border:1px solid transparent;border-radius:999px;cursor:pointer;font-weight:600;text-decoration:none;transition:all .15s;font-family:inherit;}
.kt .btn-sm{padding:8px 15px;font-size:13px;}
.kt .btn-orange{background:#ff5d36;color:#fff;}.kt .btn-orange:hover{background:#e8431f;}
.kt .btn-glass{background:#f1eee7;color:#20211c;border-color:rgba(32,33,28,.12);}.kt .btn-glass:hover{background:#e6e2d9;}
.kt .btn-danger{background:#c23c1c;color:#fff;}.kt .btn-danger:hover{background:#a53214;}
.kt .btn:disabled{opacity:.6;cursor:default;}

/* ---- KPIs ---- */
.kt .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:16px 0 6px;}
.kt .kpi{border:1px solid rgba(32,33,28,.1);border-radius:14px;background:#fff;padding:12px 16px;}
.kt .kpi .n{font-size:26px;font-weight:200;letter-spacing:-.02em;line-height:1;}
.kt .kpi .n b{font-weight:200;font-size:16px;color:rgba(32,33,28,.45);}
.kt .kpi .n.warn{color:#c1330f;font-weight:400;}
.kt .kpi .l{font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#637154;margin-top:6px;}

/* ---- barra global sticky ---- */
.kt .gbar{position:sticky;top:0;z-index:40;display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:12px -10px 20px;padding:10px;background:rgba(251,251,247,.94);backdrop-filter:blur(8px);border-bottom:1px solid rgba(32,33,28,.08);}
.kt .seg{display:inline-flex;gap:3px;background:#e9e6df;border-radius:999px;padding:3px;}
.kt .seg a{border-radius:999px;padding:7px 16px;font-size:13px;font-weight:600;text-decoration:none;color:#20211c;}
.kt .seg a.on{background:#20211c;color:#fff;}
.kt .matmenu{position:relative;}
.kt .matmenu>summary{list-style:none;}
.kt .matmenu>summary::-webkit-details-marker{display:none;}
.kt .matpop{position:absolute;left:0;top:calc(100% + 6px);z-index:60;background:#fff;border:1px solid rgba(32,33,28,.14);border-radius:12px;box-shadow:0 18px 40px -18px rgba(0,0,0,.35);padding:8px;min-width:240px;display:flex;flex-direction:column;}
.kt .matpop .mh{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8a8b80;padding:6px 12px 2px;}
.kt .matpop a{padding:8px 12px;border-radius:8px;font-size:13.5px;font-weight:500;text-decoration:none;}
.kt .matpop a:hover{background:#f1eee7;}

/* ---- pipeline: grupos por momento ---- */
.kt .grupo{border:1px solid rgba(32,33,28,.1);border-radius:16px;background:#fff;margin-bottom:14px;overflow:hidden;}
.kt .grupo>summary{list-style:none;cursor:pointer;display:flex;align-items:baseline;gap:12px;padding:14px 18px;flex-wrap:wrap;}
.kt .grupo>summary::-webkit-details-marker{display:none;}
.kt .gm{font-family:"Geist Mono",monospace;font-size:12px;color:#ff5d36;font-weight:600;letter-spacing:.1em;}
.kt .gt{font-size:16px;font-weight:500;}
.kt .gsub{font-size:12.5px;color:rgba(32,33,28,.55);flex-basis:100%;margin-top:-2px;max-width:78ch;line-height:1.45;}
.kt .gsum{margin-left:auto;font-size:12px;color:rgba(32,33,28,.55);white-space:nowrap;}
.kt .chev{color:rgba(32,33,28,.4);font-size:12px;transition:transform .15s;align-self:center;}
.kt details:not([open])>summary .chev{transform:rotate(-90deg);}

/* ---- fila de pieza ---- */
.kt .prow{border-top:1px solid rgba(32,33,28,.08);scroll-margin-top:70px;}
.kt .prow>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:12px;padding:10px 18px;}
.kt .prow>summary::-webkit-details-marker{display:none;}
.kt .prow>summary:hover{background:#faf8f3;}
.kt .mini{flex:0 0 auto;border-radius:6px;overflow:hidden;background:#e9e6df;box-shadow:0 4px 12px -6px rgba(0,0,0,.35);}
.kt .mini .kit{padding:0;gap:0;transform-origin:top left;}
.kt .mini .slide{box-shadow:none;}
.kt .rid{font-family:"Geist Mono",monospace;font-size:11.5px;color:#ff5d36;font-weight:600;min-width:24px;}
.kt .rnom{font-size:14.5px;font-weight:500;flex:1;min-width:110px;}
.kt .rpills{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;align-items:center;}
.kt .chip{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;border-radius:999px;padding:4px 10px;white-space:nowrap;}
.kt .chip.c-trig{background:#fff1ec;color:#c1330f;border:1px solid rgba(255,93,54,.32);}
.kt .pill{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;border-radius:999px;padding:4px 10px;white-space:nowrap;}
.kt .pill .dot{width:7px;height:7px;border-radius:50%;background:currentColor;opacity:.85;flex:0 0 auto;}
.kt .lc-insumo{background:rgba(201,183,156,.25);color:#8a6d3b;}
.kt .lc-nocap{background:rgba(255,93,54,.12);color:#c1330f;}
.kt .lc-lista{background:rgba(99,113,84,.14);color:#4f5d44;}
.kt .lc-prog{background:#637154;color:#fff;}
.kt .lc-pub{background:#20392b;color:#fff;}
.kt .lc-fail{background:#c23c1c;color:#fff;}

/* ---- detalle expandido ---- */
.kt .rbody{padding:4px 18px 18px 77px;}
@media (max-width:640px){.kt .rbody{padding-left:18px;}}
.kt .rwork{font-size:13px;color:rgba(32,33,28,.6);line-height:1.45;max-width:70ch;margin-bottom:10px;}
.kt .colainfo{font-size:12.5px;color:#4f5d44;background:rgba(99,113,84,.08);border-radius:10px;padding:8px 12px;margin-bottom:10px;display:flex;gap:14px;flex-wrap:wrap;}
.kt .colainfo a{font-weight:600;text-decoration:underline;}
.kt .colainfo.fail{color:#c23c1c;background:rgba(255,93,54,.08);}
.kt .pend-msg{font-size:13.5px;color:#8a6d3b;background:rgba(201,183,156,.14);border-radius:10px;padding:10px 14px;}
.kt .pend-msg a{font-weight:600;text-decoration:underline;}
.kt .cap{margin-top:14px;background:#faf8f3;border:1px solid rgba(32,33,28,.09);border-radius:10px;padding:14px 16px;font-size:13.5px;line-height:1.55;white-space:pre-wrap;color:#33352d;}
.kt .cap .tags{color:#637154;margin-top:8px;}
.kt .porq{margin-top:8px;font-size:12.5px;color:#6b6d62;}
.kt .porq summary{cursor:pointer;color:#637154;font-weight:600;}
.kt .porq div{margin-top:7px;line-height:1.5;}
.kt .porq div span{display:inline-block;min-width:46px;font-family:ui-monospace,monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#ff5d36;}
.kt .thumbs{display:flex;gap:10px;margin-top:16px;overflow-x:auto;padding-bottom:6px;}
.kt .thumb{flex:0 0 auto;border-radius:8px;overflow:hidden;box-shadow:0 8px 24px -16px rgba(0,0,0,.5);}
.kt .thumb .kit{padding:0;gap:0;transform-origin:top left;}
.kt .thumb .slide{box-shadow:none;}

/* ---- secciones colapsables sueltas (cuenta IG, boletín) ---- */
.kt .fold{border:1px solid rgba(32,33,28,.1);border-radius:16px;background:#fff;margin:14px 0;overflow:hidden;}
.kt .fold>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:12px;padding:14px 18px;}
.kt .fold>summary::-webkit-details-marker{display:none;}
.kt .fold .ft{font-size:15px;font-weight:500;}
.kt .fold .fs{margin-left:auto;font-size:12px;color:rgba(32,33,28,.55);}
.kt .fpad{padding:0 18px 18px;}

/* ---- boletín (BoletinPanel) ---- */
.kt .bol h2{font-size:22px;font-weight:300;margin:6px 0 8px;}
.kt .bol-warn{background:rgba(201,183,156,.16);border:1px solid rgba(201,183,156,.5);border-radius:10px;padding:10px 14px;font-size:13px;color:#8a6d3b;margin:12px 0;line-height:1.6;}
.kt .bol-tpl{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:16px;}
.kt .bol-card{border:1px solid rgba(32,33,28,.12);border-radius:14px;padding:16px 18px;background:#fff;}
.kt .bol-nom{font-size:17px;font-weight:500;}
.kt .bol-para{font-size:13px;color:rgba(32,33,28,.6);line-height:1.45;margin-top:4px;}
.kt .bol-edit{border:1px solid rgba(32,33,28,.12);border-radius:16px;padding:20px 22px;background:#fff;margin-top:16px;}
.kt .bol-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;}
.kt .bol-dest{font-size:12.5px;color:#637154;font-family:"Geist Mono",monospace;}
.kt .bol-f{display:block;margin-bottom:14px;}
.kt .bol-f>span{display:block;font-size:11.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#637154;margin-bottom:6px;}
.kt .bol-f>span i{font-weight:400;letter-spacing:0;text-transform:none;color:rgba(32,33,28,.5);}
.kt .bol-f input,.kt .bol-f textarea,.kt .bol-sub input,.kt .bol-sub textarea{width:100%;border:1px solid rgba(32,33,28,.16);border-radius:9px;padding:10px 12px;font-family:inherit;font-size:14px;color:#20211c;background:#faf8f3;}
.kt .bol-sub{border-left:3px solid #ff5d36;padding-left:14px;margin:0 0 14px;display:grid;gap:8px;}
.kt .bol-acts{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:18px;}
.kt .bol-prueba{display:inline-flex;gap:8px;align-items:center;}
.kt .bol-prueba-in{border:1px solid rgba(32,33,28,.16);border-radius:999px;padding:8px 14px;font-family:inherit;font-size:13px;color:#20211c;background:#faf8f3;width:200px;}
.kt .bol-conf{margin-top:16px;border:1px solid rgba(194,60,28,.35);background:rgba(255,93,54,.07);border-radius:12px;padding:16px 18px;}
.kt .bol-conf-t{font-size:15px;font-weight:600;color:#c23c1c;}
.kt .bol-conf-b{font-size:13.5px;line-height:1.6;color:#33352d;margin-top:6px;}
.kt .bol-prev{width:100%;height:640px;border:1px solid rgba(32,33,28,.14);border-radius:12px;margin-top:16px;background:#fff;}
.kt .bol-hist{margin-top:18px;}
.kt .bol-hist-t{font-size:11.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#637154;margin-bottom:8px;}
.kt .bol-hist-r{display:flex;justify-content:space-between;gap:12px;font-size:13.5px;padding:8px 0;border-top:1px solid rgba(32,33,28,.1);}
.kt .bol-hist-m{color:rgba(32,33,28,.55);font-family:"Geist Mono",monospace;font-size:12px;white-space:nowrap;}
.kt .caprun{display:inline-flex;align-items:center;gap:10px;flex-wrap:wrap;}
.kt .caprun-ok{font-size:12.5px;color:#4f5d44;font-weight:600;}
.kt .caprun-err{font-size:12.5px;color:#c23c1c;max-width:44ch;line-height:1.45;}
.kt .off{position:absolute;left:-99999px;top:0;width:1px;height:1px;overflow:hidden;}
`;

const THUMB_K = 0.2; // detalle: 720 → 144px
const MINI_K = 0.065; // fila: 720 → ~47px

// Los 4 momentos del playbook, en orden de campaña.
const MOMENTOS: { m: Momento; sub: string }[] = [
  { m: "M1 · Lanzamiento", sub: "Despertar interés: existe esto y es distinto. Sin vender." },
  { m: "M2 · Venta", sub: "Convertir: itinerario, transparencia, precio y cupo." },
  { m: "M3 · Prueba", sub: "Prueba social después del viaje: testimonios y lo vivido." },
  { m: "E · Informativo", sub: "Catálogo atemporal que enseña (no vende): sale de la Ficha científica y el Banco de fotos del formulario. Cada dato con su fuente." },
];

// Ciclo de vida de una pieza: la cola manda; luego insumos; luego caption.
function cicloDe(
  state: PieceState,
  tieneCaption: boolean,
  cola: PiezaEnCola | undefined,
): { cls: string; texto: string } {
  if (cola) {
    if (cola.status === "published") return { cls: "lc-pub", texto: `Publicada · ${fechaPill(cola.publishedAt, false)}` };
    if (cola.status === "failed") return { cls: "lc-fail", texto: "Falló al publicar" };
    // La hora guardada de una programada es la normalizada (≈02:00) que solo
    // marca el día; el robot publica ~1:00 p.m. → fecha + hora REAL del cron.
    return { cls: "lc-prog", texto: `Programada · ${fechaPill(cola.scheduledAt, false)} · ${HORA_PUBLICACION}` };
  }
  // P1 · una pieza pendiente POR FALTA DE FOTOS lo dice a la cara (para que Luis
  // sepa que sube fotos, no ficha); las demás pendientes = «Falta insumo».
  if (state.estado === "pendiente") return { cls: "lc-insumo", texto: /foto/i.test(state.razon) ? "Faltan fotos" : "Falta insumo" };
  if (!tieneCaption) return { cls: "lc-nocap", texto: "Sin caption" };
  return { cls: "lc-lista", texto: `Lista · ${state.laminas.length} lámina${state.laminas.length === 1 ? "" : "s"}` };
}

export default async function KitPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ f?: string; ok?: string; error?: string; redes?: string; msg?: string; u?: string; confirmar?: string; n?: string }>;
}) {
  const { slug } = await params;
  const { f, ok, error, redes, msg, u, confirmar, n } = await searchParams;
  const orient: "post" | "story" = f === "story" ? "story" : "post";

  // El Kit es por experiencia y el slug va en la URL: sin esta guarda, un
  // operador escribe el slug de un viaje ajeno y le genera (y publica) piezas.
  if (!(await puedeEditarSlug(slug))) notFound();

  const ctx = await fetchKitContext(slug);
  if (!ctx) notFound();

  const collaborators = (ctx.exp.page as PageV2 | undefined)?.collaborators ?? [];
  const captions = ((ctx.exp as unknown as { kitCaptions?: KitCaptions }).kitCaptions) ?? {};
  const nombre = expName(ctx.exp);

  const piezas = PIEZAS.map((p) => ({ def: p, state: p.build(ctx) }));
  const piezasE = PIEZAS_E.map((p) => ({ def: p, state: p.build(ctx) }));
  const todas = [...piezas, ...piezasE];
  const listas = todas.filter((x) => x.state.estado === "lista");

  // Ciclo de vida real desde la cola de redes (best-effort, archivo propio —
  // lib/social/posts.ts no se toca).
  const cola = await fetchEstadoPiezas(slug);
  const cuentaIg = await fetchConnectedAccount("instagram");
  const igConectada = !!cuentaIg && cuentaIg.status === "connected";

  // KPIs del tablero.
  const capListas = listas.filter((x) => captions[x.def.id]).length;
  const enCola = todas.map((x) => cola[x.def.id]).filter(Boolean) as PiezaEnCola[];
  const programadas = enCola.filter((c) => c.status === "scheduled" || c.status === "publishing").length;
  const publicadas = enCola.filter((c) => c.status === "published").length;
  const sinCaption = listas.length - capListas;

  // ── BOLETÍN ────────────────────────────────────────────────────────────────
  const bol = await fetchBoletin(slug);
  const boletinPrellenado = await composeNewsletter(slug, bol.borrador?.template ?? "carta");
  const destinatarios = await contarDestinatarios();
  const previewHtml = bol.borrador
    ? renderNewsletter(bol.borrador.template, bol.borrador.body, bol.borrador.preheader)
    : null;

  // Piezas que entran a «Programar campaña»: listas, de M1/M2, sin P7 (P7 la
  // dispara el cron de cupo; M3 se agenda después del viaje).
  const campanaPiezas = piezas
    .filter((x) => x.state.estado === "lista" && x.def.id !== "P7" && (x.def.momento.startsWith("M1") || x.def.momento.startsWith("M2")))
    .map((x) => ({ id: x.def.id, caption: captions[x.def.id] ? captionToText(captions[x.def.id]) : undefined }));

  const thumbH = orient === "story" ? 1280 * THUMB_K : 900 * THUMB_K;
  const thumbW = 720 * THUMB_K;
  const miniH = orient === "story" ? 1280 * MINI_K : 900 * MINI_K;
  const miniW = 720 * MINI_K;

  // Fila + detalle de una pieza (acordeón). El detalle trae TODO lo que antes
  // era la tarjeta: KitPieceControls (mismas props), caption, porqués, láminas.
  const renderFila = ({ def, state }: { def: PieceDef; state: PieceState }) => {
    const cap = captions[def.id];
    const c = cicloDe(state, !!cap, cola[def.id]);
    const enColaPieza = cola[def.id];
    const trigger = palabraTrigger(cap);
    return (
      <details className="prow" id={def.id} key={def.id}>
        <summary>
          <span className="mini" style={{ width: miniW, height: miniH }} aria-hidden>
            {state.estado === "lista" && state.laminas[0] ? (
              <span className={`kit ${orient}`} style={{ transform: `scale(${MINI_K})`, display: "block" }}>
                <KitDeck laminas={[state.laminas[0]]} orient={orient} momento={def.momento} collaborators={collaborators} />
              </span>
            ) : null}
          </span>
          <span className="rid">{def.id}</span>
          <span className="rnom">{def.nombre}</span>
          <span className="rpills">
            {trigger ? <span className="chip c-trig">vigilar: {trigger}</span> : null}
            <span className={`pill ${c.cls}`}><i className="dot" />{c.texto}</span>
          </span>
          <span className="chev">▾</span>
        </summary>
        <div className="rbody">
          <div className="rwork">{def.trabajo} · <b>{def.formato}</b>{def.cara !== "—" ? ` · cara ${def.cara}` : ""}</div>

          {enColaPieza ? (
            <div className={`colainfo${enColaPieza.status === "failed" ? " fail" : ""}`}>
              {enColaPieza.status === "published" ? (
                <span>Publicada el {fechaPill(enColaPieza.publishedAt, true)}</span>
              ) : enColaPieza.status === "failed" ? (
                <span>Falló al publicar{enColaPieza.error ? `: ${enColaPieza.error.slice(0, 120)}` : ""}</span>
              ) : (
                <span>Programada para el {fechaPill(enColaPieza.scheduledAt, false)} · {HORA_PUBLICACION}</span>
              )}
              {enColaPieza.igPermalink ? (
                <a href={enColaPieza.igPermalink} target="_blank" rel="noreferrer">Ver en Instagram</a>
              ) : null}
              <a href="/caminante/admin/social-cola">Ver en calendario</a>
            </div>
          ) : null}

          {state.estado === "pendiente" ? (
            <div className="pend-msg">
              {state.razon}{" "}
              <a href={`/caminante/admin/experiencias/${slug}`}>Completar en el formulario</a>
            </div>
          ) : (
            <>
              <KitPieceControls pieceId={def.id} slug={slug} orient={orient} captionText={cap ? captionToText(cap) : undefined} />
              {cap ? (
                <>
                  <div className="cap">
                    {captionToText({ ...cap, hashtags: [] })}
                    {cap.hashtags.length ? <div className="tags">{cap.hashtags.join(" ")}</div> : null}
                  </div>
                  {/* Los 3 porqués (04-FORMULAS.md §6) — nota interna, no va en el copiado. */}
                  {cap.porques ? (
                    <details className="porq">
                      <summary>Los 3 porqués · de dónde salió la pregunta</summary>
                      <div><span>safe</span>{cap.porques.safe}</div>
                      <div><span>real</span>{cap.porques.real}</div>
                      <div><span>raw</span>{cap.porques.raw}</div>
                    </details>
                  ) : null}
                </>
              ) : (
                <div className="cap" style={{ color: "#8a6d3b" }}>Sin caption todavía — usa «Generar captions» en la barra de arriba.</div>
              )}
              <div className="thumbs">
                {state.laminas.map((l: Lamina, i) => (
                  <div className="thumb" key={i} style={{ width: thumbW, height: thumbH }}>
                    <div className={`kit ${orient}`} style={{ transform: `scale(${THUMB_K})` }}>
                      <KitDeck laminas={[l]} orient={orient} momento={def.momento} collaborators={collaborators} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </details>
    );
  };

  // Resumen del summary de cada grupo («4 listas · 1 pendiente · 2 publicadas»).
  const resumenGrupo = (items: typeof todas): string => {
    const parts: string[] = [];
    const li = items.filter((x) => x.state.estado === "lista" && !cola[x.def.id]).length;
    const pe = items.filter((x) => x.state.estado === "pendiente").length;
    const pr = items.filter((x) => ["scheduled", "publishing"].includes(cola[x.def.id]?.status ?? "")).length;
    const pu = items.filter((x) => cola[x.def.id]?.status === "published").length;
    if (li) parts.push(`${li} lista${li === 1 ? "" : "s"}`);
    if (pr) parts.push(`${pr} programada${pr === 1 ? "" : "s"}`);
    if (pu) parts.push(`${pu} publicada${pu === 1 ? "" : "s"}`);
    if (pe) parts.push(`${pe} pendiente${pe === 1 ? "" : "s"}`);
    return parts.join(" · ");
  };

  return (
    <div className="kt">
      <style dangerouslySetInnerHTML={{ __html: UI + kitCss(orient) }} />

      {/* Regla app-first: siempre hay camino de vuelta visible. */}
      <div className="topbar">
        <a className="back" href={`/caminante/admin/eventos/${slug}`}>← Volver a la experiencia</a>
        {igConectada ? (
          <a className="igchip" href="#cuenta"><i className="dot" />IG @{cuentaIg!.username || "conectada"}</a>
        ) : null}
      </div>
      <div className="eyebrow">{"//"} Kit de comunicación</div>
      <h1>{nombre}</h1>
      <p className="lead">
        Todo el material de la experiencia en un tablero: cada pieza muestra en qué paso va
        (insumos, caption, programada, publicada) y se expande para actuar sin cambiar de página.
      </p>

      {ok ? <div className="banner ok">{ok}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}
      {redes === "ok" ? <div className="banner ok">Instagram conectado{u ? `: @${u}` : ""}.</div> : null}
      {redes === "desconectada" ? <div className="banner ok">Cuenta de Instagram desconectada.</div> : null}
      {redes === "denegada" ? <div className="banner err">Conexión cancelada{msg ? `: ${msg}` : ""}.</div> : null}
      {redes === "error" ? <div className="banner err">No se pudo conectar Instagram{msg ? `: ${msg}` : ""}.</div> : null}

      {/* Sin cuenta conectada la tarjeta va PROMINENTE (no hay kit sin cuenta);
          conectada, se pliega para no ocupar el tablero. */}
      {!igConectada ? (
        <ConexionRedes returnTo={`/caminante/admin/kit/${slug}?f=${orient}`} />
      ) : null}

      <div className="kpis">
        <div className="kpi"><div className="n">{listas.length}<b> / {todas.length}</b></div><div className="l">Piezas listas</div></div>
        <div className="kpi">
          <div className={`n${sinCaption > 0 ? " warn" : ""}`}>{capListas}<b> / {listas.length}</b></div>
          <div className="l">Con caption</div>
        </div>
        <div className="kpi"><div className="n">{programadas}</div><div className="l">Programadas</div></div>
        <div className="kpi"><div className="n">{publicadas}</div><div className="l">Publicadas</div></div>
      </div>

      <div className="gbar">
        <span className="seg">
          <a href="?f=post" className={orient === "post" ? "on" : ""}>Post 4:5</a>
          <a href="?f=story" className={orient === "story" ? "on" : ""}>Story 9:16</a>
        </span>
        <CaptionsRunner slug={slug} yaTiene={Object.keys(captions).length > 0} />
        {orient === "post" ? <CampanaButton slug={slug} orient="post" pieces={campanaPiezas} /> : null}
        <details className="matmenu">
          <summary className="btn btn-glass btn-sm">Material ▾</summary>
          <div className="matpop">
            <div className="mh">Flyer (PDF)</div>
            <a href={`/caminante/admin/print/${slug}?o=v`} target="_blank" rel="noreferrer">PDF vertical</a>
            <a href={`/caminante/admin/print/${slug}?o=h`} target="_blank" rel="noreferrer">PDF horizontal</a>
            <div className="mh">Redes</div>
            <a href={`/caminante/admin/social/${slug}`} target="_blank" rel="noreferrer">Flyer para redes (PNG 4:5)</a>
          </div>
        </details>
        <a href="/caminante/admin/social-cola" className="btn btn-glass btn-sm">Calendario de redes</a>
        <a href={`/caminante/experiencias/${slug}`} target="_blank" rel="noreferrer" className="btn btn-glass btn-sm">Ver experiencia ↗</a>
      </div>

      <div className="note">
        Las fotos del kit salen de la galería de «Lo básico»
        {ctx.gallery.length ? ` (${ctx.gallery.length} foto${ctx.gallery.length === 1 ? "" : "s"})` : " (vacía — usa los fondos de la página)"} y
        del Banco de fotos tipificado. Súbelas o cámbialas en el formulario y el kit se actualiza.
      </div>

      {MOMENTOS.map((g) => {
        const items = todas.filter((x) => x.def.momento === g.m);
        if (!items.length) return null;
        return (
          <details className="grupo" open key={g.m}>
            <summary>
              <span className="gm">{g.m}</span>
              <span className="gsum">{resumenGrupo(items)}</span>
              <span className="chev">▾</span>
              <span className="gsub">{g.sub}</span>
            </summary>
            {items.map(renderFila)}
          </details>
        );
      })}

      {/* Cuenta de Instagram (plegada cuando ya está conectada). */}
      {igConectada ? (
        <details className="fold">
          <summary>
            <span className="ft" id="cuenta">Cuenta de Instagram</span>
            <span className="fs">@{cuentaIg!.username || "conectada"}</span>
            <span className="chev">▾</span>
          </summary>
          <div className="fpad">
            <ConexionRedes returnTo={`/caminante/admin/kit/${slug}?f=${orient}`} />
          </div>
        </details>
      ) : null}

      {/* Boletín — plegado; el navegador lo abre solo al navegar a #boletin
          (auto-expansión de <details> por fragmento) y ante la confirmación. */}
      {bol.tablaLista ? (
        <details className="fold" open={!!confirmar || !!bol.borrador}>
          <summary>
            <span className="ft">Boletín</span>
            <span className="fs">
              {bol.borrador ? "borrador en curso" : `${destinatarios} suscriptores`}
              {bol.enviados.length ? ` · ${bol.enviados.length} enviado${bol.enviados.length === 1 ? "" : "s"}` : ""}
            </span>
            <span className="chev">▾</span>
          </summary>
          <div className="fpad">
            <BoletinPanel
              /* key = id del borrador: fuerza remontaje al pasar de «sin
                 borrador» a «con borrador» (estado derivado de props). */
              key={bol.borrador?.id ?? "nuevo"}
              slug={slug}
              borrador={bol.borrador}
              previewHtml={previewHtml}
              destinatarios={destinatarios}
              faltantes={boletinPrellenado?.faltantes ?? []}
              enviados={bol.enviados}
              confirmar={confirmar}
              nConfirmado={n ? Number(n) : undefined}
            />
          </div>
        </details>
      ) : (
        <div className="note" id="boletin" style={{ marginTop: 24 }}>
          El <b>Boletín</b> se activa al aplicar la migración <code>0028_newsletters</code> en el SQL Editor.
        </div>
      )}

      {/* Decks a tamaño real, fuera de pantalla — de aquí exportan
          KitPieceControls y CampanaButton ([data-piece] .slide). NO TOCAR. */}
      <div className="off" aria-hidden>
        {listas.map(({ def, state }) =>
          state.estado === "lista" ? (
            <div data-piece={def.id} key={def.id}>
              <KitDeck laminas={state.laminas} orient={orient} momento={def.momento} collaborators={collaborators} />
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
