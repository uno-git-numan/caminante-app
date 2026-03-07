import Link from "next/link";
import { sendMagicLink } from "@/lib/auth/actions";

interface LoginPageProps {
  searchParams: Promise<{
    sent?: string;
    email?: string;
    error?: string;
    next?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { sent, email, error, next } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/caminante";

  return (
    <section className="mx-auto max-w-md space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-2xl font-semibold">Iniciar sesión</h2>
      <p className="text-sm text-stone-600">Te enviaremos un magic link por email para entrar.</p>
      {sent === "1" && email ? (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          Revisa tu correo: <strong>{email}</strong>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(error)}</div>
      ) : null}
      <form action={sendMagicLink} className="space-y-3">
        <input type="hidden" name="next" value={nextPath} />
        <label className="block text-sm font-medium text-stone-700" htmlFor="email">
          Email
        </label>
        <input
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
          id="email"
          name="email"
          type="email"
          required
          placeholder="tu@email.com"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
        >
          Enviar magic link
        </button>
      </form>
      <Link className="text-sm text-emerald-700 hover:underline" href="/caminante/signup">
        Crear cuenta
      </Link>
    </section>
  );
}
