// LA HORA QUE ALGUIEN ESCRIBE ES LA HORA DE SU RELOJ, NO LA DEL SERVIDOR.
//
// ⚠️ Un `<input type="datetime-local">` entrega "2026-09-09T09:00", SIN zona.
// `new Date()` lo interpreta como hora local del proceso — y el proceso corre en
// Vercel, en UTC. Agendar «9:00» guardaba 09:00Z, que en CDMX son las 3 de la
// mañana: a la operadora se le anunciaba una llamada seis horas antes de la
// acordada, y nadie lo iba a notar hasta que ella no llegara.
//
// México no cambia de horario desde 2022, pero eso NO se codifica como −6 fijo:
// se le pregunta a Intl, que sabe de cada zona y de cada año. Un offset a mano
// es correcto hasta el día que deja de serlo, y ese día nadie se acuerda de esta
// línea.

export const CDMX = "America/Mexico_City";

/** "2026-09-09T09:00" leído en una zona → el instante real. Null si no sirve. */
export function desdeHoraLocal(valor: string, zona: string = CDMX): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec((valor || "").trim());
  if (!m) return null;
  const [Y, M, D, h, mi] = m.slice(1).map(Number);

  // Se toma el texto como si fuera UTC y se mide cuánto se corre al leerlo en la
  // zona destino; esa diferencia es el offset que hay que compensar.
  const comoSiFueraUtc = Date.UTC(Y, M - 1, D, h, mi);
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(comoSiFueraUtc));
  const g = (t: string) => Number(partes.find((p) => p.type === t)?.value ?? 0);
  const leidoEnZona = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"));

  const d = new Date(comoSiFueraUtc + (comoSiFueraUtc - leidoEnZona));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** «miércoles 9 de septiembre, 09:00 h», en la zona que se le diga. */
export function enPalabras(d: Date, zona: string = CDMX): string {
  const dia = new Intl.DateTimeFormat("es-MX", {
    timeZone: zona, weekday: "long", day: "numeric", month: "long",
  }).format(d);
  const hora = new Intl.DateTimeFormat("es-MX", {
    timeZone: zona, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(d);
  return `${dia}, ${hora} h`;
}
