import Link from "next/link";
import { sendMagicLink, signUpWithPassword } from "@/lib/auth/actions";
import GoogleButton from "../login/GoogleButton";

interface SignupPageProps {
  searchParams: Promise<{
    sent?: string;
    email?: string;
    error?: string;
    next?: string;
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
  const { sent, email, error, next } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/caminante";

  return (
    <section className="mx-auto max-w-md px-6 py-12">
      <p className="text-[10px] uppercase tracking-[0.25em] text-olive">Tu cuenta</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-lagoon">Crea tu cuenta</h1>
      <p className="mt-2 text-sm text-olive">
        Para reservar tus experiencias y guardar tu expediente caminante.
      </p>

      <div className="mt-8 space-y-5 rounded-2xl border border-sand bg-white p-6">
        {sent === "1" && email ? (
          <div className="rounded-lg bg-cream p-3 text-sm text-lagoon">
            Te enviamos un correo a <strong>{email}</strong> para confirmar tu cuenta. Ábrelo
            desde este dispositivo.
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
            Crear cuenta
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
        ¿Ya tienes cuenta?{" "}
        <Link
          className="font-semibold text-forest underline"
          href={`/caminante/login?next=${encodeURIComponent(nextPath)}`}
        >
          Entra aquí
        </Link>
      </p>
    </section>
  );
}
