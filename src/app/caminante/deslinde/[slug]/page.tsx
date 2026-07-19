// DESLINDE público y data-driven, con el MISMO diseño brandeado de los PDFs
// legales (sello + wordmark, encabezado con regla, título centrado, subtítulo
// serif itálico, caja de datos, secciones con regla y cuerpo SERIF justificado).
// Se arma solo desde las cláusulas de la experiencia + el marco legal
// (deslinde-doc.ts). Imprimible → "Descargar PDF" = window.print(). Inmersiva.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Experience } from "@/lib/experiences/types";
import { buildDeslinde, ENTIDAD } from "@/lib/legal/deslinde-doc";

export const dynamic = "force-dynamic";

// Sello (3 colores) + wordmark CAMINANTE — mismos paths que el deck/kit.
const G1 =
  '<g class="g1"><path d="M14.64,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64S0,96.44,0,104.52s6.56,14.64,14.64,14.64"/><path d="M102.08,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M91.72,114.57L4.29,27.44C-1.43,21.73-1.43,12.46,4.29,6.74c5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
const G2 =
  '<g class="g2"><path d="M218.65,2.3c-8.09,0-14.64,6.56-14.64,14.64s6.56,14.64,14.64,14.64,14.64-6.56,14.64-14.64-6.56-14.64-14.64-14.64"/><path d="M276.91,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/><path d="M189.47,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/></g>';
const G3 =
  '<g class="g3"><path d="M335.23,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M422.67,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M412.31,114.57l-87.43-87.13c-5.72-5.72-5.72-14.99,0-20.71,5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
const GW =
  '<g class="gw"><path d="M532.87,98.77c-4.27,4.6-9.41,6.89-15.42,6.89-5.69,0-10.45-1.75-14.27-5.25-3.83-3.5-6.73-8.56-8.7-15.18-1.97-6.62-2.95-14.68-2.95-24.2s.98-17.77,2.95-24.45c1.97-6.67,4.87-11.76,8.7-15.26,3.83-3.5,8.58-5.25,14.27-5.25s10.42,2.11,14.52,6.32c4.1,4.21,6.97,10.36,8.61,18.46l18.05-.98c-2.3-12.58-7.08-22.37-14.36-29.37-7.27-7-16.22-10.5-26.82-10.5-9.41,0-17.37,2.49-23.87,7.47-6.51,4.98-11.46,12-14.85,21.08-3.39,9.08-5.08,19.91-5.08,32.49s1.69,23.24,5.08,32.32c3.39,9.08,8.34,16.08,14.85,21,6.51,4.92,14.46,7.38,23.87,7.38,11.26,0,20.56-3.72,27.89-11.16,7.33-7.44,11.98-17.83,13.95-31.17l-17.88-.82c-1.42,8.86-4.27,15.59-8.53,20.18"/><path d="M636.87,72.84l14.54-52.34,14.54,52.34h-29.09ZM640.25,2.62l-34.13,116.49h17.88l8.43-30.35h37.93l8.43,30.35h17.88L662.57,2.62h-22.31Z"/><polygon points="784.88 77.66 766.51 2.62 743.54 2.62 743.54 119.11 760.11 119.11 760.11 29.17 778.32 105 791.45 105 809.66 29.17 809.66 119.11 826.23 119.11 826.23 2.62 803.26 2.62 784.88 77.66"/><polygon points="873.07 18.87 900.97 18.87 900.97 102.87 873.07 102.87 873.07 119.11 945.92 119.11 945.92 102.87 918.03 102.87 918.03 18.87 945.92 18.87 945.92 2.62 873.07 2.62 873.07 18.87"/><polygon points="1051.99 94.46 1013.77 2.62 992.77 2.62 992.77 119.11 1009.67 119.11 1009.67 27.28 1047.89 119.11 1068.89 119.11 1068.89 2.62 1051.99 2.62 1051.99 94.46"/><path d="M1146.48,72.84l14.54-52.34,14.54,52.34h-29.09ZM1149.87,2.62l-34.13,116.49h17.88l8.43-30.35h37.93l8.43,30.35h17.88l-34.13-116.49h-22.31Z"/><polygon points="1312.38 94.46 1274.15 2.62 1253.15 2.62 1253.15 119.11 1270.05 119.11 1270.05 27.28 1308.28 119.11 1329.28 119.11 1329.28 2.62 1312.38 2.62 1312.38 94.46"/><polygon points="1376.12 18.87 1410.25 18.87 1410.25 119.11 1427.31 119.11 1427.31 18.87 1461.44 18.87 1461.44 2.62 1376.12 2.62 1376.12 18.87"/><polygon points="1508.28 2.62 1508.28 119.11 1581.13 119.11 1581.13 102.87 1525.51 102.87 1525.51 68.58 1577.85 68.58 1577.85 52.83 1525.51 52.83 1525.51 18.87 1579.81 18.87 1579.81 2.62 1508.28 2.62"/></g>';
const WORD = `<svg viewBox="0 0 1581.13 121.74" role="img" aria-label="Caminante">${G1}${G2}${G3}${GW}</svg>`;

async function getExp(slug: string): Promise<Experience | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("experiences").select("data").eq("slug", slug).maybeSingle();
  return (data?.data as Experience | undefined) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = buildDeslinde(await getExp(slug));
  return { title: doc ? `Deslinde · ${doc.experiencia}` : "Deslinde" };
}

const CSS = `
.dsld{--cream:#fbfbf7;--lagoon:#3e4836;--olive:#63714f;--sand:#c9b79c;--orange:#ff5d36;--ink:#20211c;--gray:#8a8078;
  max-width:760px;margin:0 auto;padding:40px 30px 90px;background:var(--cream);color:var(--ink);
  font-family:Georgia,"Times New Roman",serif;}
.dsld .bar{position:sticky;top:0;background:#fbfbf7cc;backdrop-filter:blur(6px);padding:8px 0 12px;margin:-8px 0 4px;z-index:5;}
.dsld .dl{border:none;background:var(--lagoon);color:#fff;border-radius:999px;padding:11px 22px;font-size:14px;font-weight:600;cursor:pointer;font-family:"Geist",system-ui,sans-serif;}
.dsld .dl:hover{background:#4a5540;}
/* --- encabezado --- */
.dsld .dhead{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding-bottom:14px;border-bottom:1.5px solid #d9d2c6;}
.dsld .brand .mark{height:24px;}
.dsld .brand .mark svg{height:100%;width:auto;display:block;}
.dsld .mark .g1{fill:var(--olive);}.dsld .mark .g2{fill:var(--sand);}.dsld .mark .g3{fill:var(--orange);}.dsld .mark .gw{fill:var(--ink);}
.dsld .tag{font-family:"Geist",system-ui,sans-serif;font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--gray);margin-top:6px;}
.dsld .hmeta{font-family:"Geist",system-ui,sans-serif;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--gray);text-align:right;line-height:1.7;white-space:nowrap;}
/* --- título --- */
.dsld h1{text-align:center;font-family:"Geist",system-ui,sans-serif;font-size:19px;font-weight:700;letter-spacing:.01em;text-transform:uppercase;color:var(--lagoon);line-height:1.3;margin:30px 0 6px;}
.dsld .subtitle{text-align:center;font-style:italic;font-size:16px;color:var(--ink);margin-bottom:4px;}
/* --- caja de datos --- */
.dsld .infobox{background:#fff;border:1px solid #e6e0d7;border-radius:12px;padding:15px 18px;margin:22px 0 6px;font-size:13px;line-height:1.55;}
.dsld .infobox div{margin-bottom:3px;}
.dsld .infobox b{color:var(--ink);}
/* --- secciones --- */
.dsld .shead{font-family:"Geist",system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:var(--olive);margin:30px 0 0;padding-bottom:8px;border-bottom:1px solid #e0d9cd;}
.dsld p.body{font-size:14.5px;line-height:1.72;text-align:justify;margin:14px 0 0;}
.dsld .foot{margin-top:38px;padding-top:14px;border-top:1px solid #e0d9cd;font-size:11.5px;color:var(--gray);text-align:center;font-family:"Geist",system-ui,sans-serif;letter-spacing:.02em;}
@media print{
  .dsld{background:#fff;max-width:none;padding:0;}
  .dsld .bar{display:none;}
  .dsld .infobox{background:#fff;}
  .dsld .shead{break-after:avoid;}
  .dsld p.body{orphans:2;widows:2;}
  @page{margin:16mm 15mm;}
}
`;

export default async function DeslindePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = buildDeslinde(await getExp(slug));
  if (!doc) notFound();

  return (
    <div className="dsld">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bar">
        {/* Regla app-first: camino de vuelta visible (nunca depender del back del navegador) */}
        <a href={`/caminante/experiencias/${slug}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#637154", textDecoration: "none", fontFamily: '"Geist",system-ui,sans-serif', marginRight: 4 }}>← Volver</a>
        <button className="dl" id="dl-pdf" type="button">⬇ Descargar PDF</button>
      </div>

      <header className="dhead">
        <div className="brand">
          <div className="mark" dangerouslySetInnerHTML={{ __html: WORD }} />
          <div className="tag">Nature + Movement by Numan</div>
        </div>
        <div className="hmeta">
          Carta de responsabilidad<br />y deslinde · {doc.version}
        </div>
      </header>

      <h1>{doc.titulo}</h1>
      <div className="subtitle">{doc.experiencia}{doc.ubicacion ? ` · ${doc.ubicacion}` : ""}</div>

      <div className="infobox">
        <div><b>Organiza:</b> {ENTIDAD.razonSocial}, operando bajo la marca {ENTIDAD.marca} (en adelante “el Organizador”).</div>
        {doc.ubicacion ? <div><b>Ubicación:</b> {doc.ubicacion}</div> : null}
        <div><b>RFC · Domicilio · RNT:</b> {ENTIDAD.rfc} · {ENTIDAD.domicilio} · RNT: {ENTIDAD.rnt}</div>
        <div><b>Contacto:</b> {ENTIDAD.contacto} · WhatsApp {ENTIDAD.whatsapp}</div>
        <div><b>Versión del documento:</b> {doc.version}</div>
      </div>

      <div className="shead">Declaraciones y compromisos del participante</div>
      <p className="body">Al aceptar esta carta, el participante declara bajo protesta de decir verdad y se compromete a lo siguiente:</p>
      {doc.clausulas.map((c, i) => <p className="body" key={i}>{i + 1}. {c}</p>)}

      {doc.secciones.map((s, i) => (
        <section key={i}>
          <div className="shead">{s.titulo}</div>
          {s.paras.map((p, j) => <p className="body" key={j}>{p}</p>)}
        </section>
      ))}

      <div className="foot">
        Caminante · Nature + Movement by Numan · {ENTIDAD.contacto} · Documento legal — {ENTIDAD.razonSocial}
      </div>

      <script dangerouslySetInnerHTML={{ __html: `document.getElementById('dl-pdf')?.addEventListener('click',function(){window.print();});` }} />
    </div>
  );
}
