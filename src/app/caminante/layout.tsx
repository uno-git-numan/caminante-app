import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";

const navItems = [
  { href: "/caminante/search", label: "Explorar" },
  { href: "/caminante/compare/activities", label: "Actividades" },
  { href: "/caminante/compare/packages", label: "Paquetes" },
  { href: "/caminante/magazine", label: "Magazine" },
  { href: "/caminante/admin", label: "Admin" },
];

export default async function CaminanteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-white text-stone-900">
      <header className="border-b border-stone-100 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/caminante" className="flex flex-col leading-none">
            <span className="text-[10px] uppercase tracking-[0.25em] text-stone-400">numanhub</span>
            <span className="text-xl font-light tracking-wide text-stone-900">Caminante</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-stone-500">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-stone-900"
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <form action={signOut}>
                <button
                  type="submit"
                  className="transition-colors hover:text-stone-900"
                >
                  Salir
                </button>
              </form>
            ) : (
              <Link
                href="/caminante/login"
                className="transition-colors hover:text-stone-900"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
