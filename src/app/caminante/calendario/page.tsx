import Link from "next/link";
import type { Metadata } from "next";
import { fetchPublishedExperiences } from "@/lib/experiences/queries";
import { toCard, type ExperienceCard } from "@/lib/experiences/card";

export const metadata: Metadata = { title: "Calendario · Caminante" };
export const dynamic = "force-dynamic";

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

function DateBadge({ iso }: { iso: string | null }) {
  if (!iso) {
    return (
      <div className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-dashed border-sand text-center text-[10px] uppercase tracking-wider text-olive/70">
        Por
        <br />
        confirmar
      </div>
    );
  }
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  return (
    <div className="flex h-16 w-16 flex-col items-center justify-center rounded-lg bg-lagoon text-cream">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-dune">
        {MONTHS[(m || 1) - 1]}
      </span>
      <span className="font-serif text-2xl leading-none">{d || ""}</span>
      <span className="text-[9px] tracking-wider text-sand/80">{y}</span>
    </div>
  );
}

function Coin() {
  return (
    <span className="inline-flex items-center gap-1">
      {["#2C4A3E", "#1E3147", "#D18730", "#C4724E"].map((c) => (
        <i key={c} className="h-2 w-2 rounded-full" style={{ background: c }} />
      ))}
      <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-olive/70">
        Cuatro caras
      </span>
    </span>
  );
}

function Row({ c }: { c: ExperienceCard }) {
  return (
    <Link
      href={`/caminante/experiencias/${c.slug}`}
      className="group flex items-center gap-5 border-b border-sand/60 py-5 transition-colors hover:bg-white/50"
    >
      <DateBadge iso={c.startDate} />
      {c.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.image} alt="" className="hidden h-16 w-24 rounded-lg object-cover sm:block" />
      ) : null}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-semibold text-lagoon">{c.title}</h3>
        <p className="text-sm text-olive">{c.ploc}</p>
        <div className="mt-1.5">
          <Coin />
        </div>
      </div>
      <span className="hidden whitespace-nowrap text-sm font-semibold text-dune group-hover:underline sm:inline">
        Ver experiencia →
      </span>
    </Link>
  );
}

export default async function CalendarioPage() {
  const cards = (await fetchPublishedExperiences()).map(toCard);
  const dated = cards
    .filter((c) => c.startDate)
    .sort((a, b) => (a.startDate! < b.startDate! ? -1 : 1));
  const undated = cards.filter((c) => !c.startDate);

  return (
    <div className="min-h-screen bg-cream text-lagoon">
      {/* nav */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-sand/50 bg-cream/85 px-6 py-3 backdrop-blur">
        <Link href="/caminante" className="text-sm font-semibold uppercase tracking-widest text-lagoon">
          Caminante <span className="text-[10px] tracking-wider text-dune">Calendario</span>
        </Link>
        <a
          href="https://wa.me/525512020565"
          target="_blank"
          rel="noopener"
          className="rounded-sm bg-lagoon px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-dune"
        >
          Reservar
        </a>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-dune">
          Hoy · Tu próximo paisaje
        </p>
        <h1 className="mt-3 font-serif text-5xl font-light text-lagoon">Calendario.</h1>
        <p className="mt-3 max-w-xl text-olive">
          Lo que viene. El libro de los próximos paisajes — fechas abiertas a reserva.
        </p>

        {cards.length === 0 ? (
          <p className="mt-12 text-olive">Aún no hay experiencias publicadas.</p>
        ) : (
          <div className="mt-12">
            {dated.length > 0 ? (
              <section className="mb-12">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-olive/70">
                  Próximas fechas
                </h2>
                {dated.map((c) => (
                  <Row key={c.slug} c={c} />
                ))}
              </section>
            ) : null}

            {undated.length > 0 ? (
              <section>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-olive/70">
                  Fechas por confirmar
                </h2>
                {undated.map((c) => (
                  <Row key={c.slug} c={c} />
                ))}
              </section>
            ) : null}
          </div>
        )}

        <div className="mt-16 rounded-2xl border border-sand bg-white/60 p-6 text-center">
          <p className="text-olive">¿No ves tu fecha? Escríbenos y armamos una salida.</p>
          <a
            href="https://wa.me/525512020565"
            target="_blank"
            rel="noopener"
            className="mt-3 inline-block rounded-sm bg-dune px-5 py-2.5 text-sm font-semibold text-white hover:bg-dune-light"
          >
            Reservar por WhatsApp →
          </a>
        </div>
      </main>
    </div>
  );
}
