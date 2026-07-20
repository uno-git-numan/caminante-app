// KIT DE COMUNICACIÓN de una experiencia (solo admin). Genera las 10 piezas
// canónicas del playbook desde los bloques v2 + la galería de "Lo básico" +
// feedback + disponibilidad. Cada pieza: estado (lista/pendiente), preview,
// descarga POST 4:5 y STORY 9:16 (PNG por lámina) y caption en voz de marca.
// Página inmersiva (sin AdminShell), como /admin/social y /admin/print.
import { notFound } from "next/navigation";
import { fetchKitContext } from "@/lib/kit/queries";
import { PIEZAS, PIEZAS_E, expName, type Lamina, type PieceDef, type PieceState } from "@/lib/kit/kit";
import type { PageV2 } from "@/lib/experiences/types";
import CaptionsRunner from "./CaptionsRunner";
import { captionToText, palabraTrigger, type KitCaptions } from "@/lib/ai/kit-captions";
import { kitCss } from "./kit-css";
import KitDeck from "./KitDeck";
import { KitPieceControls } from "./KitClient";
import { CampanaButton } from "./CampanaButton";
import ConexionRedes from "./ConexionRedes";
import KitToolbar from "./KitToolbar";
import BoletinPanel from "./BoletinPanel";
import { fetchBoletin } from "@/lib/newsletter/queries";
import { composeNewsletter } from "@/lib/newsletter/compose";
import { contarDestinatarios } from "@/lib/newsletter/send";
import { renderNewsletter } from "@/lib/newsletter/templates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const metadata = { title: "Kit de comunicación · Admin" };

const UI = `
.kt{max-width:1080px;margin:0 auto;padding:34px 22px 120px;font-family:"Geist",system-ui,sans-serif;color:#20211c;}
.kt a{color:inherit;}
.kt .eyebrow{font-size:12px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:#637154;}
.kt h1{font-size:40px;font-weight:200;letter-spacing:-.02em;margin:8px 0 6px;}
.kt .lead{color:rgba(32,33,28,.62);font-size:14.5px;line-height:1.5;max-width:64ch;}
.kt .note{background:#f1eee7;border-radius:12px;padding:12px 16px;font-size:13px;color:#4f5d44;margin:16px 0;border:1px solid rgba(32,33,28,.08);}
.kt .banner{border-radius:12px;padding:10px 16px;font-size:13.5px;margin:14px 0;}
.kt .ok{background:rgba(99,113,84,.12);color:#4f5d44;}
.kt .err{background:rgba(255,93,54,.1);color:#c23c1c;border:1px solid rgba(255,93,54,.3);}
.kt .bar{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin:18px 0 26px;}
.kt .seg{display:inline-flex;gap:3px;background:#e9e6df;border-radius:999px;padding:3px;}
.kt .seg a{border-radius:999px;padding:7px 16px;font-size:13px;font-weight:600;text-decoration:none;color:#20211c;}
.kt .seg a.on{background:#20211c;color:#fff;}
.kt .btn{display:inline-flex;align-items:center;gap:6px;border:1px solid transparent;border-radius:999px;cursor:pointer;font-weight:600;text-decoration:none;transition:all .15s;font-family:inherit;}
.kt .btn-sm{padding:8px 15px;font-size:13px;}
.kt .btn-orange{background:#ff5d36;color:#fff;}.kt .btn-orange:hover{background:#e8431f;}
.kt .btn-glass{background:#f1eee7;color:#20211c;border-color:rgba(32,33,28,.12);}.kt .btn-glass:hover{background:#e6e2d9;}
.kt .btn:disabled{opacity:.6;cursor:default;}
.kt .piece{border:1px solid rgba(32,33,28,.12);border-radius:16px;padding:20px 22px;margin-bottom:16px;background:#fff;scroll-margin-top:20px;}
.kt .ph{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;}
.kt .pid{font-family:"Geist Mono",monospace;font-size:12px;color:#ff5d36;font-weight:600;letter-spacing:.1em;}
.kt .pn{font-size:20px;font-weight:400;margin:2px 0;}
.kt .pw{font-size:13.5px;color:rgba(32,33,28,.62);line-height:1.45;max-width:60ch;}
.kt .chip{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;border-radius:999px;padding:5px 12px;white-space:nowrap;}
.kt .chips{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;}
.kt .chip.c-trig{background:#fff1ec;color:#c1330f;border:1px solid rgba(255,93,54,.32);}
.kt .c-lista{background:rgba(99,113,84,.14);color:#4f5d44;}
.kt .c-pend{background:rgba(201,183,156,.28);color:#8a6d3b;}
.kt .pend-msg{margin-top:12px;font-size:13.5px;color:#8a6d3b;background:rgba(201,183,156,.14);border-radius:10px;padding:10px 14px;}
.kt .cap{margin-top:14px;background:#faf8f3;border:1px solid rgba(32,33,28,.09);border-radius:10px;padding:14px 16px;font-size:13.5px;line-height:1.55;white-space:pre-wrap;color:#33352d;}
.kt .cap .tags{color:#637154;margin-top:8px;}
.kt .porq{margin-top:8px;font-size:12.5px;color:#6b6d62;}
.kt .porq summary{cursor:pointer;color:#637154;font-weight:600;}
.kt .porq div{margin-top:7px;line-height:1.5;}
.kt .porq div span{display:inline-block;min-width:46px;font-family:ui-monospace,monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#ff5d36;}
.kt .bol h2{font-size:26px;font-weight:300;margin:6px 0 8px;}
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
.kt .btn-danger{background:#c23c1c;color:#fff;}.kt .btn-danger:hover{background:#a53214;}
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
.kt .thumbs{display:flex;gap:10px;margin-top:16px;overflow-x:auto;padding-bottom:6px;}
.kt .thumb{flex:0 0 auto;border-radius:8px;overflow:hidden;box-shadow:0 8px 24px -16px rgba(0,0,0,.5);}
.kt .thumb .kit{padding:0;gap:0;transform-origin:top left;}
.kt .thumb .slide{box-shadow:none;}
.kt .off{position:absolute;left:-99999px;top:0;width:1px;height:1px;overflow:hidden;}
`;

const THUMB_K = 0.2; // 720 → 144px de ancho

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

  const ctx = await fetchKitContext(slug);
  if (!ctx) notFound();

  const collaborators = (ctx.exp.page as PageV2 | undefined)?.collaborators ?? [];
  const captions = ((ctx.exp as unknown as { kitCaptions?: KitCaptions }).kitCaptions) ?? {};
  const nombre = expName(ctx.exp);

  const piezas = PIEZAS.map((p) => ({ def: p, state: p.build(ctx) }));
  // Serie E · Catálogo informativo (ficha científica + banco de fotos tipificado).
  const piezasE = PIEZAS_E.map((p) => ({ def: p, state: p.build(ctx) }));
  const listas = [...piezas, ...piezasE].filter((x) => x.state.estado === "lista");

  // ── BOLETÍN ────────────────────────────────────────────────────────────────
  // El borrador se pre-llena desde la MISMA fuente que el kit (ficha + serie E
  // + salidas). `composeNewsletter` solo se llama para saber qué le falta a la
  // experiencia; el contenido guardado del borrador manda sobre el pre-llenado.
  const bol = await fetchBoletin(slug);
  const boletinPrellenado = await composeNewsletter(slug, bol.borrador?.template ?? "carta");
  const destinatarios = await contarDestinatarios();
  // Vista previa: el HTML tal cual llegará (sin id de contacto → el link de
  // baja apunta a la página genérica, no se firma a nadie).
  const previewHtml = bol.borrador
    ? renderNewsletter(bol.borrador.template, bol.borrador.body, bol.borrador.preheader)
    : null;

  // Piezas que entran a «Programar campaña»: listas, de M1/M2, sin P7 (P7 la dispara
  // el cron de cupo; M3 se agenda después del viaje).
  const campanaPiezas = piezas
    .filter((x) => x.state.estado === "lista" && x.def.id !== "P7" && (x.def.momento.startsWith("M1") || x.def.momento.startsWith("M2")))
    .map((x) => ({ id: x.def.id, caption: captions[x.def.id] ? captionToText(captions[x.def.id]) : undefined }));

  const thumbH = orient === "story" ? 1280 * THUMB_K : 900 * THUMB_K;
  const thumbW = 720 * THUMB_K;

  // Card de una pieza (compartida por las 10 canónicas y la serie E — misma
  // UI, mismos controles: las E heredan Publicar/Programar de KitPieceControls).
  const renderPieza = ({ def, state }: { def: PieceDef; state: PieceState }) => {
    const cap = captions[def.id];
    return (
      <section className="piece" id={def.id} key={def.id}>
        <div className="ph">
          <div>
            <div className="pid">{def.id} · {def.momento}</div>
            <div className="pn">{def.nombre}</div>
            <div className="pw">{def.trabajo} · <b>{def.formato}</b>{def.cara !== "—" ? ` · cara ${def.cara}` : ""}</div>
          </div>
          <div className="chips">
            {/* Palabra-trigger activa (§2/§3): lo que hay que VIGILAR en los
                comentarios de esta pieza — cada uno es un lead que se contesta
                por DM, no con un link. */}
            {palabraTrigger(captions[def.id]) ? (
              <span className="chip c-trig">👁 vigilar: {palabraTrigger(captions[def.id])}</span>
            ) : null}
            <span className={`chip ${state.estado === "lista" ? "c-lista" : "c-pend"}`}>
              {state.estado === "lista" ? `Lista · ${state.laminas.length} lámina${state.laminas.length === 1 ? "" : "s"}` : "Pendiente de insumo"}
            </span>
          </div>
        </div>

        {state.estado === "pendiente" ? (
          <div className="pend-msg">⏳ {state.razon}</div>
        ) : (
          <>
            <div style={{ marginTop: 14 }}>
              <KitPieceControls pieceId={def.id} slug={slug} orient={orient} captionText={cap ? captionToText(cap) : undefined} />
            </div>
            {cap ? (
              <>
                <div className="cap">
                  {captionToText({ ...cap, hashtags: [] })}
                  {cap.hashtags.length ? <div className="tags">{cap.hashtags.join(" ")}</div> : null}
                </div>
                {/* Los 3 porqués (04-FORMULAS.md §6): el trabajo del que nace la
                    pregunta del cierre. NOTA INTERNA — no va en el copiado. */}
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
              <div className="cap" style={{ color: "#8a6d3b" }}>Genera los captions con IA (botón de arriba) para tener el texto listo para copiar.</div>
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
      </section>
    );
  };

  return (
    <div className="kt">
      <style dangerouslySetInnerHTML={{ __html: UI + kitCss(orient) }} />

      {/* Regla app-first: siempre hay camino de vuelta visible (nunca depender
          del back del navegador). */}
      <a href={`/caminante/admin/eventos/${slug}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#637154", textDecoration: "none", marginBottom: 14 }}>← Volver a la experiencia</a>
      <div className="eyebrow">// Kit de comunicación</div>
      <h1>{nombre}</h1>
      <p className="lead">
        Las 10 piezas canónicas del playbook, listas para publicar. Cada una hace un trabajo distinto — no
        decides nada creativo, solo descargas y publicas según el calendario.
      </p>
      <div className="note">
        📸 Las fotos de estas piezas salen de la <b>galería de fotos de «Lo básico»</b> de la experiencia
        {ctx.gallery.length ? ` (${ctx.gallery.length} foto${ctx.gallery.length === 1 ? "" : "s"} disponibles)` : ""}.
        {ctx.gallery.length < 3
          ? " Sube más fotos ahí para enriquecer el kit (P9 «Así se vivió» necesita mín. 3)."
          : " Súbelas/cámbialas ahí y el kit se actualiza."}
      </div>

      {ok ? <div className="banner ok">{ok}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}
      {redes === "ok" ? <div className="banner ok">✅ Instagram conectado{u ? `: @${u}` : ""}.</div> : null}
      {redes === "desconectada" ? <div className="banner ok">Cuenta de Instagram desconectada.</div> : null}
      {redes === "denegada" ? <div className="banner err">Conexión cancelada{msg ? `: ${msg}` : ""}.</div> : null}
      {redes === "error" ? <div className="banner err">No se pudo conectar Instagram{msg ? `: ${msg}` : ""}.</div> : null}

      <ConexionRedes returnTo={`/caminante/admin/kit/${slug}?f=${orient}`} />

      <KitToolbar slug={slug} />

      <div className="bar">
        <span className="seg">
          <a href="?f=post" className={orient === "post" ? "on" : ""}>Post 4:5</a>
          <a href="?f=story" className={orient === "story" ? "on" : ""}>Story 9:16</a>
        </span>
        <CaptionsRunner slug={slug} yaTiene={Object.keys(captions).length > 0} />
        <a href={`/caminante/experiencias/${slug}`} target="_blank" rel="noreferrer" className="btn btn-glass btn-sm">Ver experiencia ↗</a>
        {orient === "post" ? <CampanaButton slug={slug} orient="post" pieces={campanaPiezas} /> : null}
      </div>

      {piezas.map(renderPieza)}

      {/* SERIE E · Catálogo informativo — piezas educativas atemporales que salen
          de la ficha científica + banco de fotos tipificado de la experiencia. */}
      <div className="eyebrow" style={{ marginTop: 44 }}>// Catálogo informativo</div>
      <h2 style={{ margin: "6px 0 8px", fontSize: 26 }}>Serie E · piezas educativas</h2>
      <p className="lead" style={{ marginBottom: 12 }}>
        Contenido atemporal que enseña (no vende): especies, datos del lugar, glosario, temporada.
        Sale de la <b>Ficha científica</b> y del <b>Banco de fotos</b> de la experiencia (edítalos en el
        formulario de la experiencia). Cada dato lleva su fuente.
      </p>
      {piezasE.map(renderPieza)}

      {bol.tablaLista ? (
        <BoletinPanel
          /* key = id del borrador: al pasar de «sin borrador» a «con borrador»
             la navegación del server action reusa la MISMA instancia y los
             useState (inicializados desde props) se quedan con los valores
             viejos — los campos salían vacíos con el borrador ya guardado.
             Cambiar la key fuerza el remontaje. Guardar NO cambia el id, así
             que editar no pierde lo tecleado. */
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
      ) : (
        <div className="note" id="boletin" style={{ marginTop: 44 }}>
          📬 El <b>Boletín</b> se activa al aplicar la migración <code>0028_newsletters</code> en el SQL Editor.
        </div>
      )}

      {/* Decks a tamaño real, fuera de pantalla — de aquí exporta KitPieceControls */}
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
