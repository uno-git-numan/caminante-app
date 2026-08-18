// PORTAL WHITE-LABEL del operador — /caminante/o/[slug]. La cara pública del
// operador vestida con SU marca (override de CSS vars vía themeCssFor):
// su logo, sus colores, sus experiencias. Caminante = «powered by» discreto.
// Sin branding capturado (o migración 0030 sin aplicar) ⇒ 404: el portal solo
// existe cuando el onboarding lo vistió.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchOperatorThemeBySlug, themeCssFor } from "@/lib/operators/branding";
import { experienceTitle } from "@/lib/admin/queries";
import { BRAND_WORD } from "@/lib/experiences/brand-svg";
import type { Experience } from "@/lib/experiences/types";

export const dynamic = "force-dynamic";

const OPW_CSS = `
.opw{font-family:"Geist",system-ui,sans-serif;background:var(--cream);color:var(--charcoal);-webkit-font-smoothing:antialiased;line-height:1.5;min-height:100vh;
  --cream:#fbfbf7;--charcoal:#20211c;--olive:#637154;--olive-d:#4f5d44;--forest:#20392b;--orange:#ff5d36;
  --panel:#f1eee7;--line:rgba(32,33,28,.13);--ink-soft:rgba(32,33,28,.6);
  --r:22px;--mono:"Geist Mono",ui-monospace,monospace;--shadow:0 30px 70px -34px rgba(32,33,28,.5);}
.opw *{box-sizing:border-box;margin:0;padding:0;}
.opw img{display:block;max-width:100%;}
.opw a{color:var(--olive);text-decoration:none;}

.opw-hero{position:relative;isolation:isolate;background:var(--forest);color:#fff;padding:132px 22px 96px;text-align:center;overflow:hidden;}
.opw-hero .ph{position:absolute;inset:0;z-index:-2;}
.opw-hero .ph img{width:100%;height:100%;object-fit:cover;opacity:.5;}
/* VELO obligatorio: la foto del operador puede ser clarísima (Izta a mediodía) y
   sin él el título se pierde. Nunca quitarlo por "ver mejor la foto". */
.opw-hero .ph::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,rgba(12,14,11,.62),rgba(12,14,11,.34) 45%,rgba(12,14,11,.72));}
.opw-topbar{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:center;padding:26px 22px;}
.opw-logo{height:30px;width:auto;filter:brightness(0) invert(1);}
.opw-hero h1{font-weight:200;letter-spacing:-.02em;line-height:1.06;font-size:clamp(34px,6.6vw,58px);max-width:22ch;margin:0 auto;}
.opw-hero h1 em{font-style:italic;font-weight:300;color:var(--orange);}
.opw-hero .sub{font-weight:300;font-size:clamp(14.5px,2vw,17px);color:rgba(255,255,255,.85);margin:16px auto 0;max-width:46ch;}

.opw-wrap{max-width:1020px;margin:0 auto;padding:0 22px;}
.opw-sec{padding:64px 0 80px;}
.opw-eyebrow{font-family:var(--mono);font-size:11.5px;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:var(--olive);}
.opw-eyebrow .sl{color:var(--orange);font-weight:700;}
.opw-grid{display:grid;gap:20px;margin-top:26px;}
@media(min-width:720px){.opw-grid{grid-template-columns:repeat(2,1fr);}}
/* ⚠️ Las reglas de la tarjeta van prefijadas con .opw: ".opw a" (0-1-1) le gana
   a una clase sola (0-1-0) y el título salía del color primario del operador
   (negro sobre pasto claro = invisible). Mismo tropiezo que el CTA de
   embajadores — si agregas texto sobre foto aquí, prefíjalo. */
.opw .opw-card{position:relative;border-radius:var(--r);overflow:hidden;box-shadow:var(--shadow);isolation:isolate;min-height:340px;display:flex;align-items:flex-end;color:#fff;}
.opw-card .bg{position:absolute;inset:0;z-index:-2;}
.opw-card .bg img{width:100%;height:100%;object-fit:cover;transition:transform .5s;}
.opw-card:hover .bg img{transform:scale(1.04);}
.opw-card .bg::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(12,14,11,.86),rgba(12,14,11,.28) 58%,transparent);}
.opw-card .body{padding:24px 26px;width:100%;}
.opw .opw-card .t{display:block;font-weight:300;font-size:25px;letter-spacing:-.01em;line-height:1.15;color:#fff;}
.opw .opw-card .cta{display:inline-flex;margin-top:14px;padding:10px 22px;border-radius:999px;background:var(--orange);color:#fff;font-size:13.5px;font-weight:500;}
.opw-empty{border:1px dashed var(--line);border-radius:var(--r);padding:40px;text-align:center;color:var(--ink-soft);margin-top:26px;}

.opw-foot{border-top:1px solid var(--line);padding:26px 22px 36px;text-align:center;}
.opw-foot .legal{font-size:12px;color:var(--ink-soft);}
.opw-powered{display:inline-flex;align-items:center;gap:8px;margin-top:12px;font-family:var(--mono);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-soft);}
.opw-powered svg{height:11px;width:auto;opacity:.65;}
.opw-powered svg .g1,.opw-powered svg .g2,.opw-powered svg .g3,.opw-powered svg .gw{fill:currentColor;}
`;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const theme = await fetchOperatorThemeBySlug(slug);
  return { title: theme ? `${theme.name} · Experiencias` : "Operador" };
}

export default async function PortalOperadorPage({ params }: Params) {
  const { slug } = await params;
  const theme = await fetchOperatorThemeBySlug(slug);
  if (!theme) notFound();
  const b = theme.branding;

  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("experiences")
    .select("slug, status, data")
    .eq("operator_id", theme.operatorId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  const exps = ((data ?? []) as { slug: string; data: Experience }[]).map((r) => {
    const heroBlock = r.data.page?.blocks?.find((bl) => bl.type === "hero");
    return {
      slug: r.slug,
      titulo: experienceTitle(r.data, r.slug),
      foto: (heroBlock && "bg" in heroBlock ? heroBlock.bg.url : "") || r.data.heroImageUrl || "",
    };
  });
  const heroFoto = exps[0]?.foto || "";

  return (
    <div className="opw">
      <style dangerouslySetInnerHTML={{ __html: OPW_CSS + themeCssFor(".opw", b) }} />

      <header className="opw-hero">
        {heroFoto ? (
          <div className="ph">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroFoto} alt="" />
          </div>
        ) : null}
        <div className="opw-topbar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="opw-logo" src={b.logoDarkUrl || b.logoUrl} alt={theme.name} />
        </div>
        <h1>
          Experiencias de <em>{theme.name}.</em>
        </h1>
        <p className="sub">Reserva en línea — pago seguro, confirmación al instante y todo tu viaje en un solo lugar.</p>
      </header>

      <div className="opw-wrap">
        <section className="opw-sec">
          <span className="opw-eyebrow"><span className="sl">{"//"}</span> Próximas experiencias</span>
          {exps.length === 0 ? (
            <div className="opw-empty">Pronto — las experiencias de {theme.name} van a aparecer aquí.</div>
          ) : (
            <div className="opw-grid">
              {exps.map((e) => (
                <a key={e.slug} className="opw-card" href={`/caminante/experiencias/${e.slug}`}>
                  <span className="bg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {e.foto ? <img src={e.foto} alt={e.titulo} /> : null}
                  </span>
                  <span className="body">
                    <span className="t">{e.titulo}</span>
                    <span className="cta">Ver y reservar →</span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="opw-foot">
        {/* La razón social sale de la columna plana y el domicilio de `legal`
            (0038: quien EMITE vs quien RESPONDE). Se arma con lo que haya: si
            solo hay uno de los dos, se muestra ese en vez de dejar un " · "
            colgando o esconder el pie entero. */}
        {[theme.razonSocial, theme.legal?.domicilio].filter(Boolean).length > 0 ? (
          <div className="legal">
            {[theme.razonSocial, theme.legal?.domicilio].filter(Boolean).join(" · ")}
          </div>
        ) : null}
        {b.footerLine ? <div className="legal">{b.footerLine}</div> : null}
        <a className="opw-powered" href="/caminante" aria-label="Powered by NMN Caminante">
          powered by
          <span dangerouslySetInnerHTML={{ __html: BRAND_WORD }} />
        </a>
      </footer>
    </div>
  );
}
