import Link from "next/link";
import { sendMagicLink } from "@/lib/auth/actions";

interface SignupPageProps {
  searchParams: Promise<{
    next?: string;
  }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { next } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/caminante";

  return (
    <section className="mx-auto max-w-md space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-2xl font-semibold">Crear cuenta</h2>
      <p className="text-sm text-stone-600">Usamos el mismo flujo de magic link para registro.</p>
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
          Crear cuenta con magic link
        </button>
      </form>
      <Link className="text-sm text-emerald-700 hover:underline" href="/caminante/login">
        Ya tengo cuenta
      </Link>
    </section>
  );
}
