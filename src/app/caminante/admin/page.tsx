import Link from "next/link";

type Card = { href: string; title: string; desc: string };

const groups: { label: string; cards: Card[] }[] = [
  {
    label: "Experiencias",
    cards: [
      {
        href: "/caminante/admin/experiencias/nueva",
        title: "Crear experiencia",
        desc: "Arma una nueva experiencia: básicos, fechas y cupo, contenido y encuesta.",
      },
    ],
  },
  {
    label: "Reservas y cobro",
    cards: [
      {
        href: "/caminante/admin/cobro",
        title: "Generar cobro",
        desc: "Crea el link de pago por persona y el mensaje listo para WhatsApp.",
      },
      {
        href: "/caminante/admin/bookings/requests",
        title: "Solicitudes de reserva",
        desc: "Revisa quién ha pedido lugar y en qué salida.",
      },
      {
        href: "/caminante/admin/payouts",
        title: "Pagos",
        desc: "Estado de los pagos recibidos.",
      },
    ],
  },
  {
    label: "Operación",
    cards: [
      { href: "/caminante/admin/providers", title: "Proveedores", desc: "Aliados y operadores." },
      { href: "/caminante/admin/listings", title: "Listings", desc: "Inventario heredado." },
      { href: "/caminante/admin/support", title: "Soporte", desc: "Atención y casos." },
    ],
  },
];

const notices: Record<string, string> = {
  admin_no_registro:
    "Estás en modo admin. El registro y la reserva de experiencias son para viajeros — usa una cuenta de caminante si quieres probar ese flujo.",
};

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const noticeText = notice ? notices[notice] : null;

  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-10">
      <p className="text-[10px] uppercase tracking-[0.25em] text-olive">Modo admin</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-lagoon">Panel</h1>
      <p className="mt-2 text-sm text-olive">
        Desde aquí gestionas las experiencias y los cobros. Este perfil no reserva ni compra.
      </p>

      {noticeText ? (
        <div className="mt-6 rounded-xl border border-dune/40 bg-dune/10 p-4 text-sm text-lagoon">
          {noticeText}
        </div>
      ) : null}

      <div className="mt-8 space-y-8">
        {groups.map((g) => (
          <div key={g.label}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-olive">{g.label}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {g.cards.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="group rounded-2xl border border-sand bg-white p-5 transition hover:border-dune"
                >
                  <p className="text-base font-semibold text-lagoon group-hover:text-dune">{c.title}</p>
                  <p className="mt-1 text-sm text-olive">{c.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
