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
    pathname.startsWith("/caminante/destinos/") || // páginas de destino (nav propia .dst)
    pathname.startsWith("/caminante/feedback/") ||
    pathname.startsWith("/caminante/registro/") ||
    pathname.startsWith("/caminante/solicitar/") || // solicitar fecha: topbar propio
    pathname.startsWith("/caminante/embajadores") || // programa de embajadores: topbar propio (.emb)
    pathname.startsWith("/caminante/operadores") || // programa de operadores: topbar propio (.opa)
    pathname === "/caminante" || // portada: el landing trae su propia nav (+ shell .pub en móvil)
    pathname === "/caminante/nosotros" || // sitio público móvil: shell propio (.pub)
    pathname === "/caminante/experiencias" || // índice de experiencias: shell propio (.pub)
    pathname === "/caminante/aprende" || // índice de la ficha científica: shell propio (.pub)
    pathname.startsWith("/caminante/invitar/") || // invitación imprimible (→ PDF)
    pathname.startsWith("/caminante/deslinde/") || // deslinde legal data-driven (imprimible)
    // ⚠️ TODO /caminante/admin es inmersivo, sin excepciones. Antes esto era
    // una lista blanca de rutas una por una, y cada pantalla nueva del panel
    // había que acordarse de anotarla AQUÍ, en un componente del sitio
    // público. Trece de las veintisiete se habían olvidado: se veían con el
    // encabezado público montado encima del panel. El panel entero trae su
    // propio shell (AdminShell o el de móvil); ninguna de sus pantallas
    // quiere el chrome de visitante. La regla es estructural, no una lista.
    pathname.startsWith("/caminante/admin") ||
    pathname === "/caminante/perfil" || // Mi espacio: topbar propio (.mesp)
    pathname.startsWith("/caminante/operador/") || // perfil de operador (.opf)
    pathname.startsWith("/caminante/o/") || // portal white-label del operador (.opw)
    pathname === "/caminante/calendario"
  );
}

// Rutas en modo SWAP del sitio público móvil: abajo de 700px la pantalla trae su
// propio shell de app (`.pub`, con cabecera y barra de compra propias), así que
// el chrome compartido sobra — y encima le robaría la altura al `100dvh` del
// shell. Arriba de 700px no cambia nada: el escritorio conserva su nav y su pie.
// El interruptor es la misma clase `.pub-no` del contrato (PUB_SWAP_CSS), que
// solo existe cuando la página inyecta `PubStyles`.
function esSwapPub(pathname: string): boolean {
  return (
    pathname.startsWith("/caminante/reservar/") || pathname === "/caminante/reserva/exito"
  );
}

export default function SiteChrome({
  role,
  children,
}: {
  role: "admin" | "operador" | "caminante" | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (isImmersive(pathname)) {
    return <>{children}</>;
  }

  const swap = esSwapPub(pathname) ? "pub-no " : "";

  return (
    <div className="min-h-screen bg-cream text-lagoon">
      <header className={`${swap}sticky top-0 z-50 border-b border-sand/50 bg-cream/90 backdrop-blur-md`}>
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

            {role ? (
              <>
                {/*
                  ⚠️ Va a `/caminante/entrar`, NO directo al panel. Este botón
                  atajaba a `/caminante/admin` y por eso el admin desde el
                  teléfono SIEMPRE caía en el panel de escritorio: se saltaba la
                  única pieza que sabe decidir por rol y por dispositivo.
                  Y con <a>, no <Link>: es un route handler, y el router le
                  pediría su carga RSC, recibiría un redirect y se colgaría.
                */}
                <a
                  href="/caminante/entrar"
                  className="ml-1 rounded-full px-3 py-2 text-xs font-medium text-olive hover:text-lagoon"
                >
                  {/* El operador también tiene panel — el suyo, filtrado. */}
                  {role === "admin" || role === "operador" ? "Panel" : "Mi espacio"}
                </a>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="rounded-full px-3 py-2 text-xs text-olive hover:text-lagoon"
                  >
                    Salir
                  </button>
                </form>
              </>
            ) : (
              <>
                {/* `/caminante/entrar` es un route handler, no una página: con
                    Link el router le pide su carga RSC, recibe HTML y la
                    navegación se cuelga. A un handler se va con una etiqueta a. */}
                <a
                  href="/caminante/entrar"
                  className="ml-1 rounded-full border border-lagoon/25 bg-white/40 px-4 py-2 text-xs font-medium text-lagoon backdrop-blur-sm transition-colors hover:bg-lagoon/5"
                >
                  Entrar
                </a>
              </>
            )}
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

      <footer className={`${swap}border-t border-sand/50 bg-lagoon text-cream`}>
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
