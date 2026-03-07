import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";

const navItems = [
  { href: "/caminante", label: "Inicio" },
  { href: "/caminante/search", label: "Buscar" },
  { href: "/caminante/compare/activities", label: "Comparar actividades" },
  { href: "/caminante/compare/packages", label: "Comparar paquetes" },
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
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">numanhub.com</p>
            <h1 className="text-2xl font-semibold">Caminante</h1>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-stone-300 px-3 py-1.5 hover:border-emerald-700 hover:text-emerald-700"
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full border border-stone-300 px-3 py-1.5 hover:border-emerald-700 hover:text-emerald-700"
                >
                  Salir ({user.email})
                </button>
              </form>
            ) : (
              <Link
                href="/caminante/login"
                className="rounded-full border border-stone-300 px-3 py-1.5 hover:border-emerald-700 hover:text-emerald-700"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
