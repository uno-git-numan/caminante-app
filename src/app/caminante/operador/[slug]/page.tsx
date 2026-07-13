// Perfil PÚBLICO del operador: quién opera, métricas reales (derivadas en vivo),
// sus experiencias activas y testimonios aprobados. Se llega desde el chip
// "Operada por" del hero de cada experiencia.
// Markup provisional con los tokens del sitio — se re-skinnea con el HTML de
// Claude Design sin tocar la capa de datos (fetchOperatorProfile).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchOperatorProfile } from "@/lib/operators/public";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const op = await fetchOperatorProfile(slug);
  return { title: op ? `${op.name} · Operador · Caminante` : "Operador · Caminante" };
}

const fmtDesde = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { month: "long", year: "numeric" });

export default async function OperadorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const op = await fetchOperatorProfile(slug);
  if (!op) notFound();
  const m = op.metrics;

  const stats: { v: string; k: string }[] = [
    ...(m.salidas > 0 ? [{ v: String(m.salidas), k: m.salidas === 1 ? "salida operada" : "salidas operadas" }] : []),
    ...(m.viajeros > 0 ? [{ v: String(m.viajeros), k: "viajeros" }] : []),
    ...(m.stars != null ? [{ v: `★ ${m.stars}`, k: `satisfacción (${m.encuestas})` }] : []),
    ...(m.volveria != null ? [{ v: `${m.volveria}%`, k: "volvería a viajar" }] : []),
  ];

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
      {/* Header del operador */}
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        {op.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={op.photoUrl} alt={op.name} className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-full bg-forest/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landing/assets/logos/caminante-mark.svg" alt="" className="h-9 w-auto" />
          </div>
        )}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-olive">
            {"//"} Operador
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-lagoon sm:text-4xl">{op.name}</h1>
          <p className="mt-1 text-sm text-olive">
            Opera desde {fmtDesde(op.since)}
            {op.instagram ? (
              <>
                {" · "}
                <a
                  href={`https://instagram.com/${op.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-forest underline"
                >
                  @{op.instagram.replace(/^@/, "")}
                </a>
              </>
            ) : null}
          </p>
        </div>
      </div>

      {op.bio ? <p className="mt-6 max-w-[62ch] text-[15px] leading-relaxed text-lagoon">{op.bio}</p> : null}

      {/* Métricas reales */}
      {stats.length ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl border border-sand bg-white px-4 py-5 text-center">
              <div className="text-2xl font-semibold text-lagoon">{s.v}</div>
              <div className="mt-1 text-xs text-olive">{s.k}</div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Sus experiencias */}
      {op.experiencias.length ? (
        <>
          <h2 className="mt-12 text-xl font-semibold tracking-tight text-lagoon">Sus experiencias</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {op.experiencias.map((e) => (
              <Link
                key={e.slug}
                href={`/caminante/experiencias/${e.slug}`}
                className="group overflow-hidden rounded-2xl border border-sand bg-white transition hover:border-dune"
              >
                {e.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.image} alt={e.imageAlt} className="h-40 w-full object-cover" />
                ) : null}
                <div className="p-4">
                  <div className="text-[15px] font-semibold text-lagoon group-hover:text-dune">{e.title}</div>
                  {e.ploc ? <div className="mt-1 text-xs uppercase tracking-wide text-olive">{e.ploc}</div> : null}
                  {e.hook ? <div className="mt-2 text-sm text-olive">{e.hook}</div> : null}
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      {/* Testimonios aprobados (solo iniciales) */}
      {op.testimonios.length ? (
        <>
          <h2 className="mt-12 text-xl font-semibold tracking-tight text-lagoon">Lo que dicen sus viajeros</h2>
          <div className="mt-4 flex flex-col gap-4">
            {op.testimonios.map((t, i) => (
              <blockquote key={i} className="rounded-2xl border border-sand bg-white p-5">
                {t.stars != null ? (
                  <div className="text-sm text-dune">{"★".repeat(Math.round(t.stars))}</div>
                ) : null}
                <p className="mt-2 text-[15px] leading-relaxed text-lagoon">“{t.text}”</p>
                <footer className="mt-3 text-xs text-olive">
                  {t.initials}
                  {t.location ? ` · ${t.location}` : ""}
                </footer>
              </blockquote>
            ))}
          </div>
        </>
      ) : null}

      <div className="mt-12">
        <Link href="/caminante" className="text-sm font-semibold text-forest underline">
          ← Volver a Caminante
        </Link>
      </div>
    </section>
  );
}
