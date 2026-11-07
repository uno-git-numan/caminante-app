import { redirect } from "next/navigation";
import { definirContrasena } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";

// Define (o cambia) la contraseña de la cuenta con sesión. Se llega por la liga
// del correo (auth/confirm type=recovery → aquí) o desde Mi espacio.

export const dynamic = "force-dynamic";

const ERRORES: Record<string, string> = {
  corta: "La contraseña necesita al menos 8 caracteres.",
  distintas: "Las dos contraseñas no coinciden.",
  misma: "Esa ya es tu contraseña. Escribe una distinta.",
};

export default async function CuentaContrasenaPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/caminante";
  const user = await getCurrentUser();
  if (!user) redirect(`/caminante/login?next=${encodeURIComponent(`/caminante/cuenta/contrasena?next=${encodeURIComponent(nextPath)}`)}`);

  return (
    <section className="mx-auto max-w-md px-6 py-12">
      <p className="text-[10px] uppercase tracking-[0.25em] text-olive">Tu cuenta</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-lagoon">Tu contraseña</h1>
      <p className="mt-2 text-sm text-olive">
        Para <strong>{user.email}</strong>. Con ella entras desde cualquier dispositivo, sin esperar correos.
      </p>

      <div className="mt-8 space-y-5 rounded-2xl border border-sand bg-white p-6">
        {error ? <div className="rounded-lg bg-clay/10 p-3 text-sm text-clay">{ERRORES[error] ?? decodeURIComponent(error)}</div> : null}
        <form action={definirContrasena} className="space-y-3">
          <input type="hidden" name="next" value={nextPath} />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-olive" htmlFor="password">
              Contraseña nueva
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm text-lagoon outline-none focus:border-dune"
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-olive" htmlFor="password2">
              Repítela
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm text-lagoon outline-none focus:border-dune"
              id="password2"
              name="password2"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="w-full rounded-xl bg-lagoon px-4 py-3 text-sm font-semibold text-cream transition hover:bg-dune">
            Guardar y entrar
          </button>
        </form>
      </div>
    </section>
  );
}
