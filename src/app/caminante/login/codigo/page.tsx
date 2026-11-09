import Link from "next/link";
import { entrarConCodigo, reenviarCodigo } from "@/lib/auth/actions";

// ESCRIBE EL CÓDIGO DEL CORREO (9 nov 2026). El correo de acceso trae una liga
// Y un código; el código se escribe AQUÍ, en el navegador donde la persona ya
// está. No depende de que la liga sobreviva al escáner de Hotmail/Outlook, de
// que el correo se abra en el mismo teléfono, ni del navegador interno de la
// app de correo: el error que dejó fuera a Ana Malvido. Mismo lenguaje visual
// que /login.

export const dynamic = "force-dynamic";

const ERRORES: Record<string, string> = {
  formato: "El código son los dígitos que vienen en el correo.",
  codigo: "Ese código no funcionó. Pide otro aquí abajo.",
};

function textoError(raw: string): string {
  if (ERRORES[raw]) return ERRORES[raw];
  if (/expired|invalid/i.test(raw)) return "Ese código ya venció o no es el último que te mandamos. Pide otro aquí abajo.";
  if (/rate limit|too many|only request this after/i.test(raw)) return "Espera un minuto antes de pedir otro código.";
  return "No pudimos validar el código. Pide otro aquí abajo.";
}

export default async function CodigoPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string; error?: string; otro?: string; aviso?: string }>;
}) {
  const { email = "", next, error, otro, aviso } = await searchParams;
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : "/caminante";
  const correo = email.trim().toLowerCase();

  return (
    <section className="mx-auto max-w-md px-6 py-12">
      <p className="text-[10px] uppercase tracking-[0.25em] text-olive">Tu cuenta</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-lagoon">Escribe tu código</h1>
      <p className="mt-2 text-sm text-olive">
        {aviso === "contrasena" ? (
          <>
            Te mandamos un código a <strong>{correo}</strong>. Escríbelo aquí y en la siguiente pantalla eliges tu contraseña.
          </>
        ) : aviso === "existe" ? (
          <>
            <strong>{correo}</strong> ya tiene cuenta en Caminante. Para entrar sin contraseña, te mandamos un código a ese correo.
          </>
        ) : (
          <>
            Te mandamos un correo a <strong>{correo}</strong> con un código. Escríbelo aquí abajo.
          </>
        )}
      </p>

      <div className="mt-8 space-y-5 rounded-2xl border border-sand bg-white p-6">
        {otro ? <div className="rounded-lg bg-cream p-3 text-sm text-lagoon">Te mandamos un código nuevo. Usa el más reciente.</div> : null}
        {error ? <div className="rounded-lg bg-clay/10 p-3 text-sm text-clay">{textoError(decodeURIComponent(error))}</div> : null}

        <form action={entrarConCodigo} className="space-y-3">
          <input type="hidden" name="email" value={correo} />
          <input type="hidden" name="next" value={nextPath} />
          <label className="block text-xs font-semibold uppercase tracking-wider text-olive" htmlFor="codigo">
            Código del correo
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-sand px-3 py-3 text-center font-mono text-2xl tracking-[0.35em] text-lagoon outline-none focus:border-dune"
            id="codigo"
            name="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,12}"
            maxLength={12}
            placeholder="••••••••"
            required
            autoFocus
          />
          <button type="submit" className="w-full rounded-xl bg-lagoon px-4 py-3 text-sm font-semibold text-cream transition hover:bg-dune">
            Entrar
          </button>
        </form>

        <div className="space-y-2 text-xs leading-relaxed text-olive">
          <p>
            <strong>¿No llega?</strong> Revisa <strong>Correo no deseado</strong> o <strong>Promociones</strong>; en Hotmail y Outlook a veces tarda un par de minutos.
            El mismo correo trae también un botón para entrar: si lo abres en este mismo teléfono, sirve igual.
          </p>
          <form action={reenviarCodigo}>
            <input type="hidden" name="email" value={correo} />
            <input type="hidden" name="next" value={nextPath} />
            <button type="submit" className="w-full rounded-xl border border-sand bg-white px-4 py-3 text-sm font-semibold text-lagoon transition hover:border-dune">
              Mandarme otro código
            </button>
          </form>
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-olive">
        <Link className="font-semibold text-forest underline" href={`/caminante/login?next=${encodeURIComponent(nextPath)}`}>
          ← Usar otro correo o entrar con contraseña
        </Link>
      </p>
    </section>
  );
}
