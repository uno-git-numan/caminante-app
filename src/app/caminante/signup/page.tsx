import Link from "next/link";
import { sendMagicLink, signInWithGoogle, signInWithApple, signUpWithPasswordAction } from "@/lib/auth/actions";

interface SignupPageProps {
  searchParams: Promise<{
    next?: string;
    mode?: string;
    error?: string;
  }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { next, mode, error } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/caminante";
  const isPassword = mode === "password";

  const magicTabHref = nextPath !== "/caminante"
    ? `/caminante/signup?next=${encodeURIComponent(nextPath)}`
    : "/caminante/signup";
  const passwordTabHref = nextPath !== "/caminante"
    ? `/caminante/signup?mode=password&next=${encodeURIComponent(nextPath)}`
    : "/caminante/signup?mode=password";

  return (
    <section className="mx-auto max-w-md space-y-6 rounded-2xl border border-stone-200 bg-white p-8 my-12">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Caminante</p>
        <h2 className="mt-2 text-2xl font-light">Crear cuenta</h2>
      </div>

      {error ? (
        <div className="border-l-2 border-rose-400 pl-4 text-sm text-stone-600">
          {decodeURIComponent(error)}
        </div>
      ) : null}

      {/* OAuth buttons */}
      <div className="space-y-3">
        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={nextPath} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 border border-stone-300 py-3 text-sm tracking-wide transition-colors hover:bg-stone-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.174 0 7.548 0 9s.348 2.826.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>
        </form>

        <form action={signInWithApple}>
          <input type="hidden" name="next" value={nextPath} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 border border-stone-300 py-3 text-sm tracking-wide transition-colors hover:bg-stone-50"
          >
            <svg width="16" height="18" viewBox="0 0 814 1000" aria-hidden="true" fill="currentColor">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-194.3 127.4-297.5 252.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
            </svg>
            Continuar con Apple
          </button>
        </form>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="text-xs text-stone-400">o</span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      {/* Mode tabs */}
      <div className="flex gap-6 border-b border-stone-200">
        <Link
          href={magicTabHref}
          className={`pb-2 text-xs uppercase tracking-widest transition-colors ${
            !isPassword
              ? "border-b-2 border-stone-900 text-stone-900"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          Magic link
        </Link>
        <Link
          href={passwordTabHref}
          className={`pb-2 text-xs uppercase tracking-widest transition-colors ${
            isPassword
              ? "border-b-2 border-stone-900 text-stone-900"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          Contraseña
        </Link>
      </div>

      {/* Email form */}
      {!isPassword ? (
        <form action={sendMagicLink} className="space-y-4">
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
            Crear cuenta con magic link
          </button>
        </form>
      ) : (
        <form action={signUpWithPasswordAction} className="space-y-4">
          <input type="hidden" name="next" value={nextPath} />
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-widest text-stone-400" htmlFor="email-pw">
              Email
            </label>
            <input
              className="w-full border-b border-stone-300 bg-transparent py-2 text-sm outline-none focus:border-stone-900"
              id="email-pw"
              name="email"
              type="email"
              required
              placeholder="tu@email.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-widest text-stone-400" htmlFor="password">
              Contraseña
            </label>
            <input
              className="w-full border-b border-stone-300 bg-transparent py-2 text-sm outline-none focus:border-stone-900"
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>
          <button
            type="submit"
            className="w-full border border-stone-900 py-3 text-sm tracking-widest transition-colors hover:bg-stone-900 hover:text-white"
          >
            Crear cuenta
          </button>
        </form>
      )}

      <Link className="text-xs text-stone-400 underline-offset-4 hover:underline" href="/caminante/login">
        Ya tengo cuenta
      </Link>
    </section>
  );
}
