// DESLINDE público y data-driven: se arma solo desde las cláusulas de la
// experiencia + el marco legal genérico (deslinde-doc.ts). Es el documento que
// el firmante SIEMPRE puede leer (el candado de venta ya no exige un PDF a mano).
// Imprimible → "Descargar PDF" usa window.print(). Inmersiva en SiteChrome.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Experience } from "@/lib/experiences/types";
import { buildDeslinde, ENTIDAD } from "@/lib/legal/deslinde-doc";

export const dynamic = "force-dynamic";

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
.dsld{max-width:780px;margin:0 auto;padding:40px 24px 90px;font-family:"Geist",system-ui,sans-serif;color:#20211c;background:#fbfbf7;}
.dsld .brand{font-size:12px;font-weight:600;letter-spacing:.34em;text-transform:uppercase;color:#637154;}
.dsld .brand b{color:#20211c;}
.dsld .sub{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#8a8078;margin-top:2px;}
.dsld h1{font-size:26px;font-weight:300;line-height:1.25;letter-spacing:-.01em;margin:22px 0 4px;}
.dsld .exp{font-size:16px;color:#3e4836;font-weight:500;}
.dsld .loc{font-size:13px;color:#776f67;margin-top:2px;}
.dsld .ent{background:#fff;border:1px solid #e6e0d7;border-radius:14px;padding:16px 18px;margin:20px 0 8px;font-size:12.5px;line-height:1.55;color:#4f5d44;}
.dsld .ent b{color:#20211c;}
.dsld h2{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#637154;margin:28px 0 10px;}
.dsld p{font-size:14px;line-height:1.62;margin:0 0 10px;}
.dsld ol.cl{margin:0;padding-left:20px;}
.dsld ol.cl li{font-size:14px;line-height:1.6;margin-bottom:10px;}
.dsld .foot{margin-top:34px;padding-top:16px;border-top:1px solid #e6e0d7;font-size:12px;color:#8a8078;}
.dsld .bar{position:sticky;top:0;background:#fbfbf7cc;backdrop-filter:blur(6px);padding:10px 0 12px;margin:-6px 0 6px;display:flex;gap:10px;align-items:center;z-index:5;}
.dsld .dl{border:1px solid transparent;background:#3e4836;color:#fff;border-radius:999px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;}
.dsld .dl:hover{background:#4a5540;}
@media print{
  .dsld{background:#fff;max-width:none;padding:0;}
  .dsld .bar{display:none;}
  .dsld .ent{background:#fff;}
  @page{margin:18mm 16mm;}
}
`;

export default async function DeslindePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = buildDeslinde(await getExp(slug));
  if (!doc) notFound(); // registro inactivo o sin cláusulas → no hay deslinde

  return (
    <div className="dsld">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bar">
        <button className="dl" id="dl-pdf" type="button">⬇ Descargar PDF</button>
      </div>

      <div className="brand">CAMI<b>N</b>ANTE</div>
      <div className="sub">Nature + Movement by Numan · Documento legal · {doc.version}</div>

      <h1>{doc.titulo}</h1>
      <div className="exp">{doc.experiencia}</div>
      {doc.ubicacion ? <div className="loc">{doc.ubicacion}</div> : null}

      <div className="ent">
        <div>Organiza: <b>{ENTIDAD.razonSocial}</b>, operando bajo la marca {ENTIDAD.marca} (en adelante “el Organizador”).</div>
        <div>RFC: {ENTIDAD.rfc} · Domicilio: {ENTIDAD.domicilio} · RNT: {ENTIDAD.rnt}</div>
        <div>Contacto: {ENTIDAD.contacto} · WhatsApp {ENTIDAD.whatsapp}</div>
      </div>

      <h2>Declaraciones y compromisos del participante</h2>
      <p>Al aceptar esta carta, el participante declara bajo protesta de decir verdad y se compromete a lo siguiente:</p>
      <ol className="cl">
        {doc.clausulas.map((c, i) => <li key={i}>{c}</li>)}
      </ol>

      {doc.secciones.map((s, i) => (
        <section key={i}>
          <h2>{s.titulo}</h2>
          {s.paras.map((p, j) => <p key={j}>{p}</p>)}
        </section>
      ))}

      <div className="foot">
        Caminante · Nature + Movement by Numan · {ENTIDAD.contacto} · Documento legal — {ENTIDAD.razonSocial}
      </div>

      <script dangerouslySetInnerHTML={{ __html: `document.getElementById('dl-pdf')?.addEventListener('click',function(){window.print();});` }} />
    </div>
  );
}
