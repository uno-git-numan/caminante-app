import Link from "next/link";

const quickLinks = [
  { href: "/caminante/search", label: "Explorar inventario" },
  { href: "/caminante/trips/new", label: "Crear viaje" },
  { href: "/caminante/magazine", label: "Leer magazine" },
  { href: "/caminante/admin/bookings/requests", label: "Ver requests" },
];

export default function CaminanteHomePage() {
  return (
    <section className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-600 p-8 text-white">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-100">V1 Build</p>
        <h2 className="mt-3 text-3xl font-semibold">Travel platform live under /caminante</h2>
        <p className="mt-3 max-w-3xl text-emerald-50">
          This baseline includes public routes, admin routes, and API endpoints aligned
          with the PRD path strategy on numanhub.com.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-stone-200 bg-white p-4 hover:border-emerald-700"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
