"use client";

// «Comunicación lista» — el semáforo de insumos del Kit, DENTRO del formulario.
// Antes había que guardar, ir al Kit, ver seis piezas en "pendiente de insumo" y
// volver a adivinar qué faltaba. Aquí se ve mientras capturas y cada renglón
// lleva a la sección que lo arregla.
import { evaluarChecklist, listoParaComunicar, type ChecklistEntrada, type ItemEstado } from "@/lib/kit/checklist";
import { generarCaptionsDesdeForm } from "@/lib/kit/kit-actions";

const CSS = `
.ckl{border:1px solid rgba(32,33,28,.13);border-radius:16px;background:#fff;padding:20px 22px;margin-bottom:22px;}
.ckl .hd{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:4px;}
.ckl h2{font-size:19px;font-weight:500;letter-spacing:-.01em;margin:0;}
.ckl .verdict{font-size:11.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;border-radius:999px;padding:5px 12px;}
.ckl .v-ok{background:rgba(99,113,84,.16);color:#4f5d44;}
.ckl .v-no{background:rgba(201,183,156,.3);color:#8a6d3b;}
.ckl .desc{color:rgba(32,33,28,.6);font-size:13.5px;line-height:1.5;margin:0 0 14px;}
.ckl .it{display:flex;gap:12px;align-items:flex-start;padding:11px 0;border-top:1px solid rgba(32,33,28,.09);}
.ckl .it:first-of-type{border-top:0;}
.ckl .dot{width:9px;height:9px;border-radius:999px;flex:0 0 auto;margin-top:6px;}
.ckl .d-ok{background:#637154;}
.ckl .d-parcial{background:#e8a33d;}
.ckl .d-falta{background:#ff5d36;}
.ckl .body{flex:1;min-width:0;}
.ckl .t{font-size:14.5px;font-weight:600;}
.ckl .d{font-size:12.5px;color:rgba(32,33,28,.62);line-height:1.45;margin-top:2px;}
.ckl .unlock{font-size:11.5px;color:#637154;margin-top:3px;font-style:italic;}
.ckl .go{font-size:12.5px;font-weight:600;color:#c23c1c;text-decoration:none;white-space:nowrap;flex:0 0 auto;}
.ckl .acts{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid rgba(32,33,28,.09);}
.ckl .btn{border:1px solid rgba(32,33,28,.14);border-radius:999px;padding:9px 18px;font-size:13px;font-weight:600;background:#f1eee7;color:#20211c;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-block;}
.ckl .btn.pri{background:#ff5d36;border-color:#ff5d36;color:#fff;}
.ckl .btn[disabled]{opacity:.42;cursor:not-allowed;}
.ckl .nota{font-size:12px;color:rgba(32,33,28,.55);margin-top:10px;line-height:1.45;}
`;

const DOT: Record<ItemEstado, string> = { ok: "d-ok", parcial: "d-parcial", falta: "d-falta" };

export default function ChecklistComunicacion({
  entrada,
  slug,
  guardado,
}: {
  entrada: ChecklistEntrada;
  slug: string;
  guardado: boolean; // false = experiencia nueva sin guardar: aún no hay Kit
}) {
  const items = evaluarChecklist(entrada);
  const listo = listoParaComunicar(items);

  return (
    <section className="ckl" id="s0">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hd">
        <h2>Comunicación lista</h2>
        <span className={`verdict ${listo ? "v-ok" : "v-no"}`}>{listo ? "✓ Lista para comunicar" : "Faltan insumos"}</span>
      </div>
      <p className="desc">
        Lo que el Kit necesita para armar las piezas. No hace falta tenerlo todo: cada renglón verde
        desbloquea sus piezas. Los cambios se reflejan aquí mientras capturas.
      </p>

      {items.map((it) => (
        <div className="it" key={it.id}>
          <span className={`dot ${DOT[it.estado]}`} />
          <div className="body">
            <div className="t">{it.titulo}</div>
            <div className="d">{it.detalle}</div>
            <div className="unlock">{it.desbloquea}</div>
          </div>
          <a className="go" href={it.ancla}>Ir →</a>
        </div>
      ))}

      <div className="acts">
        <form action={generarCaptionsDesdeForm}>
          <input type="hidden" name="slug" value={slug} />
          <button type="submit" className="btn pri" disabled={!guardado}>✨ Generar captions</button>
        </form>
        <a
          className="btn"
          href={guardado ? `/caminante/admin/kit/${slug}` : undefined}
          aria-disabled={!guardado}
          style={guardado ? undefined : { opacity: 0.42, pointerEvents: "none" }}
        >
          🎬 Programar campaña ↗
        </a>
      </div>
      <p className="nota">
        {guardado
          ? "«Programar campaña» abre el Kit: ahí se arman las imágenes de cada lámina antes de agendarlas (por eso vive allá y no aquí)."
          : "Guarda la experiencia primero — el Kit trabaja sobre lo guardado."}
      </p>
    </section>
  );
}
