import Link from "next/link";
import { sendMagicLink, signUpWithPassword, elegirOperador } from "@/lib/auth/actions";
import GoogleButton from "../login/GoogleButton";

interface SignupPageProps {
  searchParams: Promise<{
    sent?: string;
    email?: string;
    error?: string;
    next?: string;
    tipo?: string;
  }>;
}

function friendlyError(raw: string): string {
  const map: Record<string, string> = {
    invalid_email: "Escribe un correo válido.",
    weak_password: "La contraseña debe tener al menos 8 caracteres.",
    "User already registered": "Ya existe una cuenta con ese correo. Entra con tu contraseña o un enlace.",
  };
  return map[raw] ?? raw;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { sent, email, error, next, tipo } = await searchParams;
  const esOperador = tipo === "operador";

  // PASO 1 — elegir el camino. Sin ?tipo aún → mostramos las dos puertas.
  if (tipo !== "viajero" && tipo !== "operador") {
    return (
      <section className="mx-auto max-w-md px-6 py-12">
        <p className="text-[10px] uppercase tracking-[0.25em] text-olive">Tu cuenta</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-lagoon">¿Cómo entras a Caminante?</h1>
        <p className="mt-2 text-sm text-olive">Elige tu camino.</p>

        <div className="mt-8 space-y-4">
          {/* Viajero */}
          <Link
            href="/caminante/signup?tipo=viajero"
            className="block rounded-2xl border border-sand bg-white p-5 transition hover:border-dune"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream text-lagoon">🥾</span>
              <div>
                <div className="text-base font-semibold text-lagoon">Soy viajero</div>
                <div className="mt-1 text-sm text-olive">
                  Quiero vivir experiencias, reservar mi lugar y guardar mi expediente.
                </div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-dune">Crear cuenta →</div>
              </div>
            </div>
          </Link>

          {/* Operador */}
          <form action={elegirOperador}>
            <button
              type="submit"
              className="block w-full rounded-2xl border border-sand bg-white p-5 text-left transition hover:border-dune"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream text-lagoon">🏔️</span>
                <div>
                  <div className="text-base font-semibold text-lagoon">Soy operador o marca</div>
                  <div className="mt-1 text-sm text-olive">
                    Quiero publicar mis experiencias en Caminante y gestionarlas desde el panel.
                  </div>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-dune">
                    Solicitar acceso →
                  </div>
                </div>
              </div>
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-olive">
          ¿Ya tienes cuenta?{" "}
          <Link className="font-semibold text-forest underline" href="/caminante/login">
            Entra aquí
          </Link>
        </p>
      </section>
    );
  }

  // PASO 2 — formulario. El operador aterriza en /bienvenida (ahí se registra su
  // solicitud vía la cookie de intención); el viajero, al sitio.
  const nextPath = esOperador ? "/caminante/bienvenida" : next?.startsWith("/") ? next : "/caminante";

  return (
    <section className="mx-auto max-w-md px-6 py-12">
      <p className="text-[10px] uppercase tracking-[0.25em] text-olive">
        {esOperador ? "Cuenta de operador" : "Tu cuenta"}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-lagoon">
        {esOperador ? "Solicita tu acceso de operador" : "Crea tu cuenta"}
      </h1>
      <p className="mt-2 text-sm text-olive">
        {esOperador
          ? "Crea tu cuenta y revisamos tu solicitud. En cuanto la aprobemos, entras al panel para publicar tus experiencias."
          : "Para reservar tus experiencias y guardar tu expediente caminante."}
      </p>

      {esOperador ? (
        <div className="mt-4 rounded-xl border border-dune/40 bg-dune/5 p-3 text-xs leading-relaxed text-olive">
          Un humano revisa cada solicitud (por seguridad, el acceso al panel no es automático). Mientras
          tanto tu cuenta funciona como viajero; te avisamos por WhatsApp/correo al aprobarla.
        </div>
      ) : null}

      <div className="mt-6 space-y-5 rounded-2xl border border-sand bg-white p-6">
        {sent === "1" && email ? (
          <div className="rounded-lg bg-cream p-3 text-sm text-lagoon">
            Te enviamos un correo a <strong>{email}</strong> para confirmar tu cuenta. Ábrelo desde este
            dispositivo.
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg bg-clay/10 p-3 text-sm text-clay">{friendlyError(decodeURIComponent(error))}</div>
        ) : null}

        <GoogleButton next={nextPath} />

        <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-olive/60">
          <span className="h-px flex-1 bg-sand" />
          o con tu correo
          <span className="h-px flex-1 bg-sand" />
        </div>

        <form action={signUpWithPassword} className="space-y-3">
          <input type="hidden" name="next" value={nextPath} />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-olive" htmlFor="email">
              Correo
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm text-lagoon outline-none focus:border-dune"
              id="email"
              name="email"
              type="email"
              required
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-olive" htmlFor="password">
              Contraseña
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm text-lagoon outline-none focus:border-dune"
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-lagoon px-4 py-3 text-sm font-semibold text-cream transition hover:bg-dune"
          >
            {esOperador ? "Crear cuenta y solicitar acceso" : "Crear cuenta"}
          </button>
          <button
            type="submit"
            formAction={sendMagicLink}
            className="w-full rounded-xl border border-sand bg-white px-4 py-3 text-sm font-semibold text-lagoon transition hover:border-dune"
          >
            Prefiero un enlace por correo
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-olive">
        <Link className="font-semibold text-forest underline" href="/caminante/signup">
          ← Elegir otro camino
        </Link>
      </p>
    </section>
  );
}
