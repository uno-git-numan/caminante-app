import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";

const navItems = [
  { href: "/caminante", label: "Inicio" },
  { href: "/caminante/experiencias", label: "Experiencias" },
  { href: "/caminante/descubre", label: "Descubre" },
  { href: "/caminante/nosotros", label: "Nosotros" },
];

export default async function CaminanteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-cream text-lagoon">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-sand/50 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/caminante" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lagoon text-cream text-sm font-bold tracking-wider">
              C
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-lagoon">
                Caminante
              </h1>
              <p className="text-[10px] uppercase tracking-[0.25em] text-olive">
                Naturaleza en movimiento
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-olive transition-colors hover:bg-lagoon/5 hover:text-lagoon"
              >
                {item.label}
              </Link>
            ))}

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/message/PLACEHOLDER"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 rounded-full bg-lagoon px-5 py-2 text-sm font-medium text-cream transition-colors hover:bg-lagoon-light"
            >
              Reserva tu lugar
            </a>

            {user ? (
              <form action={signOut}>
                <button
                  type="submit"
                  className="ml-1 rounded-full px-3 py-2 text-xs text-olive hover:text-lagoon"
                >
                  Salir
                </button>
              </form>
            ) : null}
          </nav>

          {/* Mobile menu button */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-lagoon md:hidden"
            aria-label="Menú"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-sand/50 bg-lagoon text-cream">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Brand */}
            <div>
              <h3 className="text-lg font-semibold">Caminante</h3>
              <p className="mt-2 text-sm text-sand">
                Naturaleza en movimiento. Experiencias inmersivas que conectan
                cuerpo, mente y entorno.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-dune">
                Explora
              </h4>
              <div className="mt-3 flex flex-col gap-2 text-sm text-sand">
                <Link href="/caminante/experiencias" className="hover:text-cream">
                  Experiencias
                </Link>
                <Link href="/caminante/descubre" className="hover:text-cream">
                  Descubre
                </Link>
                <Link href="/caminante/nosotros" className="hover:text-cream">
                  Nosotros
                </Link>
              </div>
            </div>

            {/* Social + Contact */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-dune">
                Conecta
              </h4>
              <div className="mt-3 flex flex-col gap-2 text-sm text-sand">
                <a
                  href="https://instagram.com/somos.caminante"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cream"
                >
                  @somos.caminante
                </a>
                <a
                  href="https://wa.me/message/PLACEHOLDER"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cream"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-lagoon-light/30 pt-6 text-center text-xs text-sand/70">
            &copy; {new Date().getFullYear()} Caminante by Numan. Todos los
            derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
