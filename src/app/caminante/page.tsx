import Link from "next/link";
import Image from "next/image";

export default function CaminanteHomePage() {
  return (
    <div>
      {/* Hero */}
      <div className="relative h-[90vh] w-full overflow-hidden">
        <Image
          src="/images/hero.jpeg"
          alt="Dunas del desierto"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
          <p className="text-xs uppercase tracking-[0.35em] text-white/70">Explora México</p>
          <h1 className="mt-4 text-5xl font-light tracking-wide md:text-7xl">Caminante</h1>
          <p className="mt-4 max-w-sm text-sm text-white/80 md:max-w-md">
            Experiencias únicas de viaje curadas para quienes quieren ir más lejos.
          </p>
          <div className="mt-10 flex gap-6">
            <Link
              href="/caminante/search"
              className="border border-white/70 px-8 py-3 text-sm tracking-widest text-white transition-colors hover:bg-white hover:text-stone-900"
            >
              Explorar
            </Link>
            <Link
              href="/caminante/trips/new"
              className="bg-white px-8 py-3 text-sm tracking-widest text-stone-900 transition-colors hover:bg-white/90"
            >
              Crear viaje
            </Link>
          </div>
        </div>
      </div>

      {/* Secondary links */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-px border border-stone-100 bg-stone-100 md:grid-cols-4">
          {[
            { href: "/caminante/search", label: "Actividades" },
            { href: "/caminante/compare/packages", label: "Paquetes" },
            { href: "/caminante/magazine", label: "Magazine" },
            { href: "/caminante/trips/new", label: "Nuevo viaje" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-center bg-white px-6 py-10 text-sm tracking-widest text-stone-500 transition-colors hover:text-stone-900"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
