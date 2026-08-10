import Link from "next/link";
import { redirect } from "next/navigation";
import { sendMagicLink, signInWithPassword } from "@/lib/auth/actions";
import { getCurrentRole } from "@/lib/auth/authorization";
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
//
// ⚠️ El fallback NUNCA devuelve el texto crudo: `confirm/route.ts` reenvía el
// `error.message` de Supabase, que viene en INGLÉS. Un usuario mexicano veía
// "Email link is invalid or has expired" en una pantalla en español (detectado
// en el audit móvil del 8 ago 2026). Ante un mensaje desconocido preferimos una
// frase en español que diga qué hacer, y el crudo se queda en el log.
function friendlyError(raw: string): string {
  const exactos: Record<string, string> = {
    invalid_credentials: "Correo o contraseña incorrectos.",
    invalid_email: "Escribe un correo válido.",
    missing_code: "No pudimos completar el inicio de sesión. Inténtalo de nuevo.",
    missing_token: "El enlace ya no es válido. Pide uno nuevo.",
    "Invalid login credentials": "Correo o contraseña incorrectos.",
    "Email not confirmed": "Confirma tu correo antes de entrar (revisa tu bandeja).",
  };
  if (exactos[raw]) return exactos[raw];

  // Patrones de Supabase (su copy cambia entre versiones; el patrón aguanta).
  const patrones: [RegExp, string][] = [
    [/expired|invalid.*(link|token)|otp.*expired/i, "Ese enlace ya venció o se usó. Pide uno nuevo aquí abajo."],
    [/rate limit|too many/i, "Demasiados intentos. Espera un minuto y vuelve a intentar."],
    [/user (not found|already registered)/i, "Revisa el correo: no encontramos esa cuenta."],
    [/password/i, "Correo o contraseña incorrectos."],
    [/network|fetch failed/i, "Se cayó la conexión. Inténtalo otra vez."],
  ];
  for (const [re, msg] of patrones) if (re.test(raw)) return msg;

  if (raw) console.warn("[login] error sin traducir:", raw);
  return "No pudimos completar el inicio de sesión. Inténtalo de nuevo o pide un enlace nuevo.";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { sent, email, error, next } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/caminante";

  // Con sesión activa el login no tiene nada que ofrecer: directo a tu página.
  const role = await getCurrentRole();
  if (role === "admin") redirect("/caminante/admin");
  if (role === "caminante") redirect("/caminante/perfil");

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
