// Puerta ABIERTA de la encuesta: el link que Luis manda al grupo de WhatsApp.
// Pide nombre + correo, consigue la fila de esa persona y la manda al link
// PERSONAL de siempre — el formulario de la encuesta no se toca.
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fetchSalidaEncuesta, entrarEncuestaAbierta } from "@/lib/feedback/abierta";

export const dynamic = "force-dynamic";

const ERRORES: Record<string, string> = {
  nombre: "Escribe tu nombre.",
  correo: "Escribe un correo válido.",
  cerrada: "Esta encuesta ya está cerrada.",
  guardar: "No pudimos abrir tu encuesta. Inténtalo de nuevo.",
};

type Params = { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token } = await params;
  const s = await fetchSalidaEncuesta(token);
  return { title: s ? `¿Cómo te fuiste de ${s.locationLabel.split(",")[0]}?` : "Encuesta" };
}

export default async function EncuestaAbiertaPage({ params, searchParams }: Params) {
  const { token } = await params;
  const { error } = await searchParams;
  const salida = await fetchSalidaEncuesta(token);
  if (!salida) notFound();

  const lugar = salida.locationLabel.split(",")[0] || "el viaje";

  async function entrar(formData: FormData) {
    "use server";
    const r = await entrarEncuestaAbierta({
      slotToken: token,
      fullName: String(formData.get("nombre") ?? ""),
      email: String(formData.get("correo") ?? ""),
    });
    if (!r.ok) {
      const code = /nombre/i.test(r.error) ? "nombre" : /correo/i.test(r.error) ? "correo" : /cerrada/i.test(r.error) ? "cerrada" : "guardar";
      redirect(`/caminante/feedback/salida/${token}?error=${code}`);
    }
    redirect(`/caminante/feedback/${r.token}`);
  }

  return (
    <main className="fbo">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="fbo-card">
        <span className="fbo-eyebrow"><span className="sl">{"//"}</span> Encuesta</span>
        <h1>
          ¿Cómo te fuiste de <em>{lugar}?</em>
        </h1>
        <p className="fbo-sub">
          {salida.experienceTitle ? `${salida.experienceTitle} · ` : ""}
          {salida.slotLabel}
        </p>
        <p className="fbo-nota">
          Da igual si tú compraste el viaje o te trajo alguien: queremos oírte. Déjanos tu nombre y
          correo para no confundir tu respuesta con la de otra persona.
        </p>

        {error ? <div className="fbo-error">{ERRORES[error] ?? ERRORES.guardar}</div> : null}

        <form action={entrar} className="fbo-form">
          <label>
            Tu nombre
            <input name="nombre" required autoComplete="name" placeholder="Como te decimos" />
          </label>
          <label>
            Tu correo
            <input name="correo" type="email" required autoComplete="email" placeholder="tu@correo.com" />
          </label>
          <button type="submit">Empezar →</button>
        </form>

        <p className="fbo-legal">
          Solo lo usamos para guardar tu respuesta y no escribirte de más. Toma dos minutos.
        </p>
      </div>
    </main>
  );
}

const CSS = `
.fbo{--cream:#F5F0E8;--ink:#20211c;--orange:#ff5d36;--olive:#637154;--line:rgba(32,33,28,.14);
  min-height:100vh;background:var(--cream);color:var(--ink);display:flex;align-items:center;justify-content:center;
  padding:32px 20px;font-family:"Geist",system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
.fbo *{box-sizing:border-box;margin:0;}
.fbo-card{width:100%;max-width:460px;background:#fff;border:1px solid var(--line);border-radius:22px;
  padding:38px 30px;box-shadow:0 30px 70px -40px rgba(32,33,28,.45);}
.fbo-eyebrow{font-family:"Geist Mono",ui-monospace,monospace;font-size:11px;letter-spacing:.22em;
  text-transform:uppercase;color:var(--olive);display:block;margin-bottom:14px;}
.fbo-eyebrow .sl{color:var(--orange);font-weight:700;}
.fbo h1{font-weight:200;font-size:clamp(28px,7vw,38px);line-height:1.08;letter-spacing:-.02em;}
.fbo h1 em{font-style:italic;font-weight:300;color:var(--orange);}
.fbo-sub{margin-top:10px;font-size:13.5px;color:rgba(32,33,28,.6);font-family:"Geist Mono",ui-monospace,monospace;}
.fbo-nota{margin-top:18px;font-size:14.5px;font-weight:300;line-height:1.55;color:rgba(32,33,28,.78);}
.fbo-error{margin-top:16px;padding:11px 14px;border-radius:12px;background:rgba(255,93,54,.1);
  border:1px solid rgba(255,93,54,.45);font-size:13.5px;}
.fbo-form{margin-top:24px;display:grid;gap:14px;}
.fbo-form label{display:grid;gap:6px;font-size:12px;font-weight:600;letter-spacing:.02em;}
.fbo-form input{font:inherit;font-size:15px;font-weight:400;padding:12px 14px;border:1px solid var(--line);
  border-radius:12px;background:#fdfcfa;color:var(--ink);width:100%;}
.fbo-form input:focus{outline:2px solid rgba(255,93,54,.5);outline-offset:1px;}
.fbo-form button{margin-top:6px;font:inherit;font-size:15px;font-weight:500;padding:13px 22px;border:0;
  border-radius:999px;background:var(--orange);color:#fff;cursor:pointer;}
.fbo-form button:hover{background:#e94e2a;}
.fbo-legal{margin-top:16px;font-size:12px;color:rgba(32,33,28,.55);line-height:1.5;}
`;
