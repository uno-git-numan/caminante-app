import Link from "next/link";

// Nav del dashboard de admin. Fuente única de secciones: al lanzar cada fase se
// cambia `soon: true` por su href. NO enlaza el marketplace dormido
// (listings/providers/payouts/support/bookings) a propósito.
export type AdminSection =
  | "panorama"
  | "eventos"
  | "reservas"
  | "personas"
  | "dinero"
  | "encuesta";

const items: { key: AdminSection | string; label: string; href?: string; soon?: boolean }[] = [
  { key: "panorama", label: "Panorama", href: "/caminante/admin" },
  { key: "eventos", label: "Eventos", soon: true },
  { key: "reservas", label: "Reservas", soon: true },
  { key: "personas", label: "Personas", soon: true },
  { key: "dinero", label: "Dinero", soon: true },
  { key: "encuesta", label: "Encuesta", soon: true },
];

const quick: { label: string; href: string }[] = [
  { label: "Generar cobro", href: "/caminante/admin/cobro" },
  { label: "+ Experiencia", href: "/caminante/admin/experiencias/nueva" },
];

export default function AdminNav({ active }: { active: AdminSection }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 border-b border-sand pb-4">
      {items.map((it) =>
        it.href ? (
          <Link
            key={it.key}
            href={it.href}
            className={
              active === it.key
                ? "rounded-full bg-lagoon px-4 py-1.5 text-sm font-semibold text-cream"
                : "rounded-full border border-sand bg-white px-4 py-1.5 text-sm font-medium text-lagoon transition hover:border-dune"
            }
          >
            {it.label}
          </Link>
        ) : (
          <span
            key={it.key}
            className="cursor-default rounded-full border border-dashed border-sand px-4 py-1.5 text-sm text-olive/60"
            title="Pronto"
          >
            {it.label}
          </span>
        ),
      )}
      <span className="mx-1 hidden h-5 w-px bg-sand sm:block" />
      {quick.map((q) => (
        <Link
          key={q.href}
          href={q.href}
          className="rounded-full border border-dune/50 bg-dune/10 px-4 py-1.5 text-sm font-medium text-lagoon transition hover:border-dune"
        >
          {q.label}
        </Link>
      ))}
    </nav>
  );
}
