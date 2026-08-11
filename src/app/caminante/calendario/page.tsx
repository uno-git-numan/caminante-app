import Link from "next/link";
import type { Metadata } from "next";
import {
  fetchPublishedExperiences,
  fetchPublishedExperienceRows,
} from "@/lib/experiences/queries";
import { toCard, type ExperienceCard } from "@/lib/experiences/card";
import {
  fetchPublicAvailability,
  type SlotAvailabilityPublic,
} from "@/lib/experiences/availability";
import { fetchOperatorChipForExperience } from "@/lib/operators/public";
import PubStyles from "../ui/pub/PubStyles";
import PubShell from "../ui/pub/PubShell";
import CalendarioMovil, { type MesCal, type SalidaCal } from "./CalendarioMovil";

// La ruta YA tenía escritorio: desde el sitio público móvil se renderizan los
// DOS marcados y el CSS decide cuál se ve (corte en 700px, modo `swap` de
// PubStyles). El marcado de escritorio de abajo NO se tocó — solo quedó
// envuelto en `.pub-no`. Ver design/publico-movil/PATRON.md.

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

// --- vista móvil: las salidas ABIERTAS agrupadas por mes ---------------------

const TZ = "America/Mexico_City";
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MESES_CORTO = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** Año / mes / día de una fecha, leídos en horario de CDMX. */
function ymd(d: Date): { y: number; m: number; d: number } {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(d);
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value ?? "0");
  return { y: get("year"), m: get("month"), d: get("day") };
}

const claveMes = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;

/** Una salida ya pasó si su fecha de inicio quedó atrás. El cierre de verdad lo
 *  hace el cron `cerrar-salidas` cada mañana (`lib/experiences/cerrar-vencidas.ts`),
 *  y ahí desaparece del sitio, del checkout y del deslinde de un solo golpe.
 *  Esto es el cinturón para las horas entre una corrida y la siguiente. */
function esFutura(startsAt: string | null): boolean {
  if (!startsAt) return true;
  const t = Date.parse(startsAt);
  return Number.isNaN(t) || t >= Date.now();
}

function dispoDe(s: SlotAvailabilityPublic): { dispo: string; low: boolean } {
  if (s.soldOut) return { dispo: "agotada", low: true };
  if (s.available === null) return { dispo: "lugares disponibles", low: false };
  if (s.available === 1) return { dispo: "queda 1 lugar", low: true };
  return { dispo: `quedan ${s.available}`, low: s.available <= 3 };
}

async function calendarioMovil(): Promise<{ meses: MesCal[]; resumen: string }> {
  const [rows, disponibilidad] = await Promise.all([
    fetchPublishedExperienceRows(),
    fetchPublicAvailability(),
  ]);

  // slug → { nombre, estado, operador }
  const meta = new Map<string, { nombre: string; estado: string; operador: string | null }>();
  await Promise.all(
    rows.map(async (r) => {
      const card = toCard(r.data);
      const chip = await fetchOperatorChipForExperience(r.id);
      meta.set(r.data.slug, {
        nombre: card.title,
        estado: card.estado || card.ploc,
        operador: chip?.name ?? null,
      });
    }),
  );

  const porMes = new Map<string, SalidaCal[]>();
  const sinFecha: SalidaCal[] = [];
  let total = 0;
  const experiencias = new Set<string>();

  for (const exp of disponibilidad) {
    const m = meta.get(exp.slug);
    if (!m) continue; // experiencia sin fila publicada: no se anuncia
    for (const s of exp.slots) {
      if (!esFutura(s.startsAt)) continue;
      total += 1;
      experiencias.add(exp.slug);
      const { dispo, low } = dispoDe(s);
      const base = {
        id: s.id,
        slug: exp.slug,
        nombre: m.nombre,
        sub: [m.estado, m.operador].filter(Boolean).join(" · "),
        dispo,
        low,
      };
      if (!s.startsAt) {
        sinFecha.push({ ...base, dia: "", mesCorto: "" });
        continue;
      }
      const f = ymd(new Date(s.startsAt));
      const clave = claveMes(f.y, f.m);
      const fila: SalidaCal = {
        ...base,
        dia: String(f.d),
        mesCorto: MESES_CORTO[f.m - 1],
      };
      porMes.set(clave, [...(porMes.get(clave) ?? []), fila]);
    }
  }

  // Ventana: el mes en curso y los tres siguientes (como el entregable, que
  // enseña cuatro), más cualquier mes posterior que sí tenga salidas. Un mes sin
  // salidas se queda con su estado vacío y su «Avísame».
  const hoy = ymd(new Date());
  const claves: string[] = [];
  for (let i = 0; i < 4; i += 1) {
    const total0 = hoy.m - 1 + i;
    claves.push(claveMes(hoy.y + Math.floor(total0 / 12), (total0 % 12) + 1));
  }
  for (const k of porMes.keys()) if (!claves.includes(k)) claves.push(k);
  claves.sort();

  const meses: MesCal[] = claves.map((k) => {
    const [y, m] = k.split("-").map((n) => Number(n));
    return { key: k, label: `${MESES[m - 1]} ${y}`, salidas: porMes.get(k) ?? [] };
  });
  if (sinFecha.length) {
    meses.push({ key: "sin-fecha", label: "Fechas por confirmar", salidas: sinFecha });
  }

  const nExp = experiencias.size;
  const resumen =
    total === 0
      ? "Hoy no hay salidas abiertas. Puedes pedir tu fecha desde la experiencia que te interese."
      : `Hoy hay ${total} ${total === 1 ? "salida" : "salidas"} en ${nExp} ${
          nExp === 1 ? "experiencia" : "experiencias"
        }. Si tu mes está vacío, pide tu fecha desde la experiencia que te interese.`;

  return { meses, resumen };
}

export default async function CalendarioPage() {
  const [cards, movil] = await Promise.all([
    fetchPublishedExperiences().then((exps) => exps.map(toCard)),
    calendarioMovil(),
  ]);
  const dated = cards
    .filter((c) => c.startDate)
    .sort((a, b) => (a.startDate! < b.startDate! ? -1 : 1));
  const undated = cards.filter((c) => !c.startDate);

  return (
    <>
      <PubStyles />
      <div className="pub-no">
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
      </div>
      <PubShell>
        <CalendarioMovil meses={movil.meses} resumen={movil.resumen} />
      </PubShell>
    </>
  );
}
