import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { contactoDeUsuario, fetchEspacio, lugarDe } from "@/lib/grupo/espacio";
import { entrarAlGrupo, entrarConSesion } from "@/lib/grupo/acciones";
import { EspShell, Nav } from "../ui";
import { OAuth } from "../cliente";

// C2 · «Crear cuenta, un paso». Apple o Google llenan nombre y correo; el
// celular es obligatorio y se verifica con un código. Con sesión, sólo falta el
// celular. En escritorio es la tarjeta angosta centrada (.esp-auth).

export const dynamic = "force-dynamic";

const ERRORES: Record<string, string> = {
  celular: "Escribe tu celular a diez dígitos (o con lada internacional).",
  correo: "Escribe un correo válido.",
  nombre: "Escribe tu nombre.",
};

export default async function EntrarAlGrupoPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const e = await fetchEspacio(token);
  if (!e) notFound();

  const user = await getCurrentUser();
  const contacto = user ? await contactoDeUsuario(user) : null;
  if (lugarDe(e, contacto?.id ?? null)) redirect(`/caminante/g/${e.token}`);

  const aqui = `/caminante/g/${e.token}/entrar`;
  const apple = process.env.NEXT_PUBLIC_AUTH_APPLE === "1";
  const sub = `${e.anfitrion?.pila ? `Grupo de ${e.anfitrion.pila}` : "Salida privada"} · ${e.etiqueta}`;
  const err = error ? (ERRORES[error] ?? error) : null;
  const celularListo = !!contacto?.phone_verified_at;

  return (
    <EspShell>
      <div className="esp-authwrap">
        <Nav t="Entrar al grupo" sub={sub} backHref={`/caminante/g/${e.token}`} />
        <div className="esp-auth">
          <div className="pub-sec" style={{ paddingTop: 22 }}>
            {user && celularListo ? (
              <>
                <h2 style={{ marginTop: 0 }}>
                  Ya tienes <em>cuenta.</em>
                </h2>
                <p style={{ fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
                  Entras como <b>{contacto?.full_name || user.email}</b>. Tu lugar queda apartado al pagar; el deslinde se firma después.
                </p>
                <form action={entrarConSesion}>
                  <input type="hidden" name="token" value={e.token} />
                  <button className="pub-cta pub-cta-orange" style={{ marginTop: 16 }}>
                    Entrar al grupo
                  </button>
                </form>
              </>
            ) : user ? (
              <>
                <h2 style={{ marginTop: 0 }}>
                  Falta tu <em>celular.</em>
                </h2>
                <p style={{ fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
                  Entras como <b>{contacto?.full_name || user.email}</b>. Por el celular te llegan los avisos del viaje; lo verificamos con un código.
                </p>
                {err ? <p style={{ fontSize: 13.5, color: "var(--orange)", marginTop: 10 }}>{err}</p> : null}
                <form action={entrarAlGrupo}>
                  <input type="hidden" name="token" value={e.token} />
                  <div className="pub-fld">
                    <label htmlFor="celular">Celular</label>
                    <input id="celular" name="celular" inputMode="tel" autoComplete="tel" defaultValue={contacto?.phone ?? ""} placeholder="55 1234 5678" required />
                    <span className="hint">Obligatorio. Por aquí te llegan los avisos del viaje.</span>
                  </div>
                  <button className="pub-cta pub-cta-orange" style={{ marginTop: 10 }}>
                    Mandarme el código
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 style={{ marginTop: 0 }}>
                  Tu cuenta <em>Caminante.</em>
                </h2>
                <OAuth next={aqui} apple={apple} />
                <div className="esp-or">o con tus datos</div>
                {err ? <p style={{ fontSize: 13.5, color: "var(--orange)", marginBottom: 6 }}>{err}</p> : null}
                <form action={entrarAlGrupo}>
                  <input type="hidden" name="token" value={e.token} />
                  <div className="pub-fld">
                    <label htmlFor="nombre">Nombre</label>
                    <input id="nombre" name="nombre" autoComplete="name" required />
                  </div>
                  <div className="pub-fld">
                    <label htmlFor="celular">Celular</label>
                    <input id="celular" name="celular" inputMode="tel" autoComplete="tel" placeholder="55 1234 5678" required />
                    <span className="hint">Obligatorio. Por aquí te llegan los avisos del viaje.</span>
                  </div>
                  <div className="pub-fld">
                    <label htmlFor="correo">Correo</label>
                    <input id="correo" name="correo" inputMode="email" type="email" autoComplete="email" required />
                  </div>
                  <button className="pub-cta pub-cta-orange" style={{ marginTop: 10 }}>
                    Entrar
                  </button>
                </form>
                <a className="pub-cta pub-cta-ghost" style={{ width: "100%", marginTop: 10 }} href={`/caminante/login?next=${encodeURIComponent(aqui)}`}>
                  Ya tengo cuenta · entrar
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </EspShell>
  );
}
