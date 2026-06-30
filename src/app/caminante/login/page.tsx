import Link from "next/link";
import { sendMagicLink, signInWithPassword } from "@/lib/auth/actions";
import GoogleButton from "./GoogleButton";

interface LoginPageProps {
  searchParams: Promise<{
    sent?: string;
    email?: string;
    error?: string;
    next?: string;
  }>;
}

// Mensajes en español para los códigos/errores comunes (voz "tú").
function friendlyError(raw: string): string {
  const map: Record<string, string> = {
    invalid_credentials: "Correo o contraseña incorrectos.",
    invalid_email: "Escribe un correo válido.",
    missing_code: "No pudimos completar el inicio de sesión. Inténtalo de nuevo.",
    missing_token: "El enlace ya no es válido. Pide uno nuevo.",
    "Invalid login credentials": "Correo o contraseña incorrectos.",
    "Email not confirmed": "Confirma tu correo antes de entrar (revisa tu bandeja).",
  };
  return map[raw] ?? raw;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { sent, email, error, next } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/caminante";

  return (
    <section className="mx-auto max-w-md px-6 py-12">
      <p className="text-[10px] uppercase tracking-[0.25em] text-olive">Tu cuenta</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-lagoon">Entra a Caminante</h1>
      <p className="mt-2 text-sm text-olive">
        Usa tu cuenta de Google, tu contraseña, o pide un enlace por correo.
      </p>

      <div className="mt-8 space-y-5 rounded-2xl border border-sand bg-white p-6">
        {sent === "1" && email ? (
          <div className="rounded-lg bg-cream p-3 text-sm text-lagoon">
            Te enviamos un enlace a <strong>{email}</strong>. Ábrelo desde este dispositivo.
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg bg-clay/10 p-3 text-sm text-clay">
            {friendlyError(decodeURIComponent(error))}
          </div>
        ) : null}

        <GoogleButton next={nextPath} />

        <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-olive/60">
          <span className="h-px flex-1 bg-sand" />
          o con tu correo
          <span className="h-px flex-1 bg-sand" />
        </div>

        <form action={signInWithPassword} className="space-y-3">
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
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-lagoon px-4 py-3 text-sm font-semibold text-cream transition hover:bg-dune"
          >
            Entrar
          </button>
          <button
            type="submit"
            formAction={sendMagicLink}
            className="w-full rounded-xl border border-sand bg-white px-4 py-3 text-sm font-semibold text-lagoon transition hover:border-dune"
          >
            Enviar enlace por correo
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-olive">
        ¿Aún no tienes cuenta?{" "}
        <Link
          className="font-semibold text-forest underline"
          href={`/caminante/signup?next=${encodeURIComponent(nextPath)}`}
        >
          Créala aquí
        </Link>
      </p>
    </section>
  );
}
