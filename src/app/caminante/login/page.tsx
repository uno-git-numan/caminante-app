import Link from "next/link";
import Image from "next/image";
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
    <div className="flex min-h-[calc(100vh-57px)]">
      {/* Left: photo */}
      <div className="relative hidden w-1/2 md:block">
        <Image
          src="/images/login.jpeg"
          alt="Desierto"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Right: form */}
      <div className="flex w-full flex-col justify-center px-10 py-16 md:w-1/2">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Caminante</p>
            <h2 className="mt-2 text-2xl font-light">Iniciar sesión</h2>
            <p className="mt-2 text-sm text-stone-400">Te enviamos un magic link por email.</p>
          </div>

          {sent === "1" && email ? (
            <div className="border-l-2 border-emerald-600 pl-4 text-sm text-stone-600">
              Revisa tu correo: <strong>{email}</strong>
            </div>
          ) : null}
          {error ? (
            <div className="border-l-2 border-rose-400 pl-4 text-sm text-stone-600">
              {decodeURIComponent(error)}
            </div>
          ) : null}

          <form action={sendMagicLink} className="space-y-6">
            <input type="hidden" name="next" value={nextPath} />
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-widest text-stone-400" htmlFor="email">
                Email
              </label>
              <input
                className="w-full border-b border-stone-300 bg-transparent py-2 text-sm outline-none focus:border-stone-900"
                id="email"
                name="email"
                type="email"
                required
                placeholder="tu@email.com"
              />
            </div>
            <button
              type="submit"
              className="w-full border border-stone-900 py-3 text-sm tracking-widest transition-colors hover:bg-stone-900 hover:text-white"
            >
              Enviar magic link
            </button>
          </form>

          <Link className="text-xs text-stone-400 underline-offset-4 hover:underline" href="/caminante/signup">
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
