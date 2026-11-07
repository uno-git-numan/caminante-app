import Link from "next/link";
import { pedirLigaDeContrasena } from "@/lib/auth/actions";

// «¿Olvidaste tu contraseña?» y «todavía no tengo contraseña» son la misma
// puerta: se pide una liga por correo y la persona la define en
// /caminante/cuenta/contrasena. Mismo lenguaje visual que /login.

export default async function ContrasenaPage({ searchParams }: { searchParams: Promise<{ sent?: string; email?: string; error?: string; next?: string }> }) {
  const { sent, email, error, next } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/caminante";
  return (
    <section className="mx-auto max-w-md px-6 py-12">
      <p className="text-[10px] uppercase tracking-[0.25em] text-olive">Tu cuenta</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-lagoon">Crea o cambia tu contraseña</h1>
      <p className="mt-2 text-sm text-olive">
        Te mandamos una liga al correo. La abres desde donde quieras, escribes tu contraseña nueva y entras.
      </p>

      <div className="mt-8 space-y-5 rounded-2xl border border-sand bg-white p-6">
        {sent === "1" && email ? (
          <div className="rounded-lg bg-cream p-3 text-sm text-lagoon">
            Si <strong>{email}</strong> tiene cuenta, ya tiene un correo con la liga. Revisa también Promociones o Spam.
          </div>
        ) : null}
        {error ? <div className="rounded-lg bg-clay/10 p-3 text-sm text-clay">Escribe un correo válido.</div> : null}
        <form action={pedirLigaDeContrasena} className="space-y-3">
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
              defaultValue={email ?? ""}
              placeholder="tu@correo.com"
            />
          </div>
          <button type="submit" className="w-full rounded-xl bg-lagoon px-4 py-3 text-sm font-semibold text-cream transition hover:bg-dune">
            Mandarme la liga
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-olive">
        <Link className="font-semibold text-forest underline" href={`/caminante/login?next=${encodeURIComponent(nextPath)}`}>
          ← Volver a entrar
        </Link>
      </p>
    </section>
  );
}
