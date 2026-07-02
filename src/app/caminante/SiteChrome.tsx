"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth/actions";

const navItems = [
  { href: "/caminante", label: "Inicio" },
  { href: "/caminante/experiencias", label: "Experiencias" },
  { href: "/caminante/descubre", label: "Descubre" },
  { href: "/caminante/nosotros", label: "Nosotros" },
];

// Routes that render their own immersive nav/footer (the magazine template).
// On these, the shared site chrome is hidden.
function isImmersive(pathname: string): boolean {
  return (
    pathname.startsWith("/caminante/experiencias/") ||
    pathname.startsWith("/caminante/feedback/") ||
    pathname.startsWith("/caminante/registro/") ||
    pathname.startsWith("/caminante/admin/experiencias") ||
    pathname.startsWith("/caminante/admin/eventos") || // dashboard (AdminShell)
    pathname.startsWith("/caminante/admin/reservas") ||
    pathname.startsWith("/caminante/admin/personas") ||
    pathname.startsWith("/caminante/admin/roster") ||
    pathname.startsWith("/caminante/admin/encuesta") ||
    pathname.startsWith("/caminante/admin/dinero") ||
    pathname === "/caminante/admin" || // dashboard: trae su propio shell (AdminShell)
    pathname === "/caminante/calendario"
  );
}

export default function SiteChrome({
  user,
  children,
}: {
  user: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (isImmersive(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-cream text-lagoon">
      <header className="sticky top-0 z-50 border-b border-sand/50 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/caminante" className="group flex items-center" aria-label="Caminante · Naturaleza en movimiento">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/shared/logos/caminante-logo.svg"
              alt="Caminante · Naturaleza en movimiento"
              className="h-5 w-auto"
            />
          </Link>

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

            <a
              href="https://wa.me/525512020565"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 rounded-full bg-lagoon px-5 py-2 text-sm font-medium text-cream transition-colors hover:bg-lagoon-light"
            >
              Reserva tu lugar
            </a>

            {user ? (
              <>
                <Link
                  href="/caminante/perfil"
                  className="ml-1 rounded-full px-3 py-2 text-xs font-medium text-olive hover:text-lagoon"
                >
                  Mi perfil
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="rounded-full px-3 py-2 text-xs text-olive hover:text-lagoon"
                  >
                    Salir
                  </button>
                </form>
              </>
            ) : null}
          </nav>

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

      <main>{children}</main>

      <footer className="border-t border-sand/50 bg-lagoon text-cream">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/shared/logos/caminante-logo-white.svg"
                alt="Caminante"
                className="h-5 w-auto"
              />
              <p className="mt-3 text-sm text-sand">
                Naturaleza en movimiento. Experiencias inmersivas que conectan
                cuerpo, mente y entorno.
              </p>
            </div>

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
                  href="https://wa.me/525512020565"
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
            &copy; 2026 Caminante by Numan. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
