// LA HORA DE QUIEN RECIBE, NO LA DEL SERVIDOR.
//
// La encuesta sale a las 19:30 de la ciudad donde está la persona. Eso obliga a
// traducir un texto que ella escribió a mano —«CDMX», «Mexico city», «Mexico»—
// a un huso real.
//
// ⚠️ EL DATO ES POBRE Y HAY QUE TRATARLO COMO TAL. `contacts.city` es texto
// libre y en la salida de los volcanes CUATRO DE SIETE lo traen vacío. Así que
// esto no adivina: normaliza lo que reconoce y, para todo lo demás, cae en la
// hora de la casa —que es donde ocurren las salidas y donde está casi todo el
// mundo— pero lo CUENTA, para que el reporte del cron diga a cuántos les
// estamos suponiendo el huso en vez de saberlo.

export const HUSO_CASA = "America/Mexico_City";

const limpia = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();

// Las ciudades de México que NO están en la hora del centro, y las de fuera que
// ya aparecieron. Se busca por inclusión: «Tijuana, BC» y «tijuana» caen igual.
const MAPA: [string[], string][] = [
  [["tijuana", "mexicali", "ensenada", "rosarito", "baja california norte"], "America/Tijuana"],
  [["la paz", "los cabos", "cabo san lucas", "san jose del cabo", "baja california sur", "bcs", "mazatlan", "culiacan", "sinaloa", "nayarit"], "America/Mazatlan"],
  [["cancun", "playa del carmen", "tulum", "cozumel", "quintana roo"], "America/Cancun"],
  [["hermosillo", "sonora", "ciudad obregon", "nogales"], "America/Hermosillo"],
  [["chihuahua", "ciudad juarez", "juarez"], "America/Chihuahua"],
  // Fuera de México, lo que ya se ha visto en la lista.
  [["madrid", "barcelona", "espana", "spain"], "Europe/Madrid"],
  [["bogota", "colombia"], "America/Bogota"],
  [["buenos aires", "argentina"], "America/Argentina/Buenos_Aires"],
  [["santiago", "chile"], "America/Santiago"],
  [["lima", "peru"], "America/Lima"],
  [["new york", "nueva york", "nyc", "brooklyn"], "America/New_York"],
  [["los angeles", "san diego", "california", "san francisco"], "America/Los_Angeles"],
  [["chicago", "austin", "texas", "houston", "dallas"], "America/Chicago"],
  [["denver", "colorado"], "America/Denver"],
  [["miami", "orlando", "florida"], "America/New_York"],
  [["london", "londres"], "Europe/London"],
];

export type Huso = { zona: string; supuesto: boolean };

/** El huso de quien recibe. `supuesto` = no lo sabemos, caímos en el de la casa. */
export function husoDeCiudad(ciudad: string | null | undefined): Huso {
  const c = limpia(ciudad ?? "");
  if (!c) return { zona: HUSO_CASA, supuesto: true };
  for (const [claves, zona] of MAPA) {
    if (claves.some((k) => c.includes(k))) return { zona, supuesto: false };
  }
  // Escribió algo, y lo que escribió es del centro (CDMX, Guadalajara,
  // Monterrey, Puebla…) o no lo reconocemos. En los dos casos la hora del
  // centro es la respuesta, pero sólo la primera es un acierto.
  const centro = ["cdmx", "ciudad de mexico", "mexico city", "df", "distrito federal", "estado de mexico", "edomex",
                  "guadalajara", "jalisco", "monterrey", "nuevo leon", "puebla", "queretaro", "toluca", "cuernavaca",
                  "morelia", "oaxaca", "veracruz", "merida", "yucatan", "leon", "guanajuato", "san luis potosi",
                  "aguascalientes", "pachuca", "tlaxcala", "chiapas", "tabasco", "campeche", "durango", "zacatecas",
                  "colima", "tepic", "michoacan", "guerrero", "acapulco", "mexico"];
  if (centro.some((k) => c.includes(k))) return { zona: HUSO_CASA, supuesto: false };
  return { zona: HUSO_CASA, supuesto: true };
}

const partes = (fecha: Date, zona: string): Record<string, string> => {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  return Object.fromEntries(f.formatToParts(fecha).map((p) => [p.type, p.value]));
};

/** La fecha (YYYY-MM-DD) y la hora (0-23) que son AHÍ en este momento. */
export function horaLocal(fecha: Date, zona: string): { dia: string; hora: number } {
  const p = partes(fecha, zona);
  // A las 24 horas Intl le llama "24" en algunos runtimes; se normaliza a 0.
  const h = Number(p.hour) % 24;
  return { dia: `${p.year}-${p.month}-${p.day}`, hora: h };
}

/** Cuánto se corre esa zona respecto a UTC, en ese instante (con horario de verano). */
function desfase(fecha: Date, zona: string): number {
  const p = partes(fecha, zona);
  const comoSiFueraUtc = Date.UTC(
    Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour) % 24,
    Number(p.minute ?? 0), 0,
  );
  return comoSiFueraUtc - Math.floor(fecha.getTime() / 60000) * 60000;
}

/**
 * El instante UTC en que serán las HH:MM del día `dia` EN esa zona.
 *
 * Esto es lo que vuelve al envío independiente de cada cuánto corra el cron. La
 * versión anterior preguntaba «¿allá son las 19?», y con una sola corrida al día
 * eso sólo se cumple para un huso: al resto no le tocaba NUNCA. Aquí se compara
 * contra un momento absoluto, así que una corrida diaria acierta en la hora de
 * la casa y a los demás les llega en la siguiente pasada —tarde, pero les llega.
 *
 * Se resuelve en dos vueltas porque el desfase depende del instante que estamos
 * calculando (un día de cambio de horario se mueve solo).
 */
export function instanteEnZona(dia: string, hora: number, minuto: number, zona: string): Date {
  const hh = String(hora).padStart(2, "0");
  const mm = String(minuto).padStart(2, "0");
  const comoUtc = Date.parse(`${dia}T${hh}:${mm}:00Z`);
  let t = comoUtc;
  for (let i = 0; i < 2; i++) t = comoUtc - desfase(new Date(t), zona);
  return new Date(t);
}

/** El día siguiente a una fecha YYYY-MM-DD, en texto. */
export function diaSiguiente(dia: string): string {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
