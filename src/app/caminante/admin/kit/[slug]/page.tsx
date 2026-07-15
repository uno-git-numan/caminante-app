// KIT DE COMUNICACIÓN de una experiencia (solo admin). Genera las 10 piezas
// canónicas del playbook desde los bloques v2 + la galería de "Lo básico" +
// feedback + disponibilidad. Cada pieza: estado (lista/pendiente), preview,
// descarga POST 4:5 y STORY 9:16 (PNG por lámina) y caption en voz de marca.
// Página inmersiva (sin AdminShell), como /admin/social y /admin/print.
import { notFound } from "next/navigation";
import { fetchKitContext } from "@/lib/kit/queries";
import { PIEZAS, expName, type Lamina } from "@/lib/kit/kit";
import type { PageV2 } from "@/lib/experiences/types";
import { generarKitCaptions } from "@/lib/kit/kit-actions";
import { captionToText, type KitCaptions } from "@/lib/ai/kit-captions";
import { kitCss } from "./kit-css";
import KitDeck from "./KitDeck";
import { KitPieceControls } from "./KitClient";

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
.kt .c-lista{background:rgba(99,113,84,.14);color:#4f5d44;}
.kt .c-pend{background:rgba(201,183,156,.28);color:#8a6d3b;}
.kt .pend-msg{margin-top:12px;font-size:13.5px;color:#8a6d3b;background:rgba(201,183,156,.14);border-radius:10px;padding:10px 14px;}
.kt .cap{margin-top:14px;background:#faf8f3;border:1px solid rgba(32,33,28,.09);border-radius:10px;padding:14px 16px;font-size:13.5px;line-height:1.55;white-space:pre-wrap;color:#33352d;}
.kt .cap .tags{color:#637154;margin-top:8px;}
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
  searchParams: Promise<{ f?: string; ok?: string; error?: string }>;
}) {
  const { slug } = await params;
  const { f, ok, error } = await searchParams;
  const orient: "post" | "story" = f === "story" ? "story" : "post";

  const ctx = await fetchKitContext(slug);
  if (!ctx) notFound();

  const collaborators = (ctx.exp.page as PageV2 | undefined)?.collaborators ?? [];
  const captions = ((ctx.exp as unknown as { kitCaptions?: KitCaptions }).kitCaptions) ?? {};
  const nombre = expName(ctx.exp);

  const piezas = PIEZAS.map((p) => ({ def: p, state: p.build(ctx) }));
  const listas = piezas.filter((x) => x.state.estado === "lista");

  const thumbH = orient === "story" ? 1280 * THUMB_K : 900 * THUMB_K;
  const thumbW = 720 * THUMB_K;

  return (
    <div className="kt">
      <style dangerouslySetInnerHTML={{ __html: UI + kitCss(orient) }} />

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

      <div className="bar">
        <span className="seg">
          <a href="?f=post" className={orient === "post" ? "on" : ""}>Post 4:5</a>
          <a href="?f=story" className={orient === "story" ? "on" : ""}>Story 9:16</a>
        </span>
        <form action={generarKitCaptions}>
          <input type="hidden" name="slug" value={slug} />
          <button type="submit" className="btn btn-orange btn-sm">
            {Object.keys(captions).length ? "↻ Regenerar captions" : "✨ Generar captions con IA"}
          </button>
        </form>
        <a href={`/caminante/experiencias/${slug}`} target="_blank" rel="noreferrer" className="btn btn-glass btn-sm">Ver experiencia ↗</a>
      </div>

      {piezas.map(({ def, state }) => {
        const cap = captions[def.id];
        return (
          <section className="piece" id={def.id} key={def.id}>
            <div className="ph">
              <div>
                <div className="pid">{def.id} · {def.momento}</div>
                <div className="pn">{def.nombre}</div>
                <div className="pw">{def.trabajo} · <b>{def.formato}</b>{def.cara !== "—" ? ` · cara ${def.cara}` : ""}</div>
              </div>
              <span className={`chip ${state.estado === "lista" ? "c-lista" : "c-pend"}`}>
                {state.estado === "lista" ? `Lista · ${state.laminas.length} lámina${state.laminas.length === 1 ? "" : "s"}` : "Pendiente de insumo"}
              </span>
            </div>

            {state.estado === "pendiente" ? (
              <div className="pend-msg">⏳ {state.razon}</div>
            ) : (
              <>
                <div style={{ marginTop: 14 }}>
                  <KitPieceControls pieceId={def.id} slug={slug} orient={orient} captionText={cap ? captionToText(cap) : undefined} />
                </div>
                {cap ? (
                  <div className="cap">
                    {captionToText({ ...cap, hashtags: [] })}
                    {cap.hashtags.length ? <div className="tags">{cap.hashtags.join(" ")}</div> : null}
                  </div>
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
      })}

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
