// LOS 32 ESTADOS DE MÉXICO, Y SU HUSO.
//
// ⚠️ Sustituye al campo libre «Ciudad» del registro. Ese texto llegaba como
// «Mexico city», «Mexico», «CDMX» y —en cuatro de siete de una salida— vacío;
// y NO es cosmético: de ahí sale a qué hora se le manda la encuesta a cada
// quien. Con una lista cerrada el dato deja de ser una adivinanza.
//
// México tiene cuatro husos. La lista los fija por estado, que es la unidad más
// grande donde el huso no cambia... con dos salvedades reales:
//
//   · NAYARIT: casi todo va en la hora del Pacífico, pero el municipio de Bahía
//     de Banderas va con el Centro. Se toma Pacífico, que es la mayoría.
//   · CHIHUAHUA: desde 2022 va en la hora del Centro (dejó el Pacífico). Se usa
//     `America/Chihuahua`, que ya refleja ese cambio en la base tz.
//
// «Fuera de México» existe a propósito: hay clientes de Madrid y de Nueva York.
// Cae en la hora de la casa y se marca como supuesto — no se inventa un huso
// que nadie declaró.

export type Estado = { clave: string; nombre: string; zona: string };

const CENTRO = "America/Mexico_City";
const PACIFICO = "America/Mazatlan";
const NOROESTE = "America/Tijuana";
const SURESTE = "America/Cancun";

export const ESTADOS: Estado[] = [
  { clave: "AGS", nombre: "Aguascalientes", zona: CENTRO },
  { clave: "BC", nombre: "Baja California", zona: NOROESTE },
  { clave: "BCS", nombre: "Baja California Sur", zona: PACIFICO },
  { clave: "CAM", nombre: "Campeche", zona: CENTRO },
  { clave: "CHIS", nombre: "Chiapas", zona: CENTRO },
  { clave: "CHIH", nombre: "Chihuahua", zona: "America/Chihuahua" },
  { clave: "CDMX", nombre: "Ciudad de México", zona: CENTRO },
  { clave: "COAH", nombre: "Coahuila", zona: CENTRO },
  { clave: "COL", nombre: "Colima", zona: CENTRO },
  { clave: "DGO", nombre: "Durango", zona: CENTRO },
  { clave: "EDOMEX", nombre: "Estado de México", zona: CENTRO },
  { clave: "GTO", nombre: "Guanajuato", zona: CENTRO },
  { clave: "GRO", nombre: "Guerrero", zona: CENTRO },
  { clave: "HGO", nombre: "Hidalgo", zona: CENTRO },
  { clave: "JAL", nombre: "Jalisco", zona: CENTRO },
  { clave: "MICH", nombre: "Michoacán", zona: CENTRO },
  { clave: "MOR", nombre: "Morelos", zona: CENTRO },
  { clave: "NAY", nombre: "Nayarit", zona: PACIFICO },
  { clave: "NL", nombre: "Nuevo León", zona: CENTRO },
  { clave: "OAX", nombre: "Oaxaca", zona: CENTRO },
  { clave: "PUE", nombre: "Puebla", zona: CENTRO },
  { clave: "QRO", nombre: "Querétaro", zona: CENTRO },
  { clave: "QROO", nombre: "Quintana Roo", zona: SURESTE },
  { clave: "SLP", nombre: "San Luis Potosí", zona: CENTRO },
  { clave: "SIN", nombre: "Sinaloa", zona: PACIFICO },
  { clave: "SON", nombre: "Sonora", zona: "America/Hermosillo" },
  { clave: "TAB", nombre: "Tabasco", zona: CENTRO },
  { clave: "TAMS", nombre: "Tamaulipas", zona: CENTRO },
  { clave: "TLAX", nombre: "Tlaxcala", zona: CENTRO },
  { clave: "VER", nombre: "Veracruz", zona: CENTRO },
  { clave: "YUC", nombre: "Yucatán", zona: CENTRO },
  { clave: "ZAC", nombre: "Zacatecas", zona: CENTRO },
];

/** Existe porque hay clientes de Madrid y de Nueva York. */
export const FUERA: Estado = { clave: "FUERA", nombre: "Fuera de México", zona: CENTRO };

/** Lo que se pinta en el <select>. */
export const OPCIONES_ESTADO: Estado[] = [...ESTADOS, FUERA];

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * El huso de un estado guardado.
 *
 * Acepta la clave («CDMX») y el nombre («Ciudad de México»), porque el campo
 * viejo era libre y en la base ya hay de todo. Lo que no reconoce cae en la hora
 * de la casa Y SE MARCA como supuesto: quien lea el reporte tiene que poder
 * distinguir «sé que es el centro» de «no sé y asumí el centro».
 */
export function husoDeEstado(valor: string | null | undefined): { zona: string; supuesto: boolean } {
  const v = norm(valor ?? "");
  if (!v) return { zona: CENTRO, supuesto: true };
  const e = ESTADOS.find((x) => norm(x.clave) === v || norm(x.nombre) === v);
  return e ? { zona: e.zona, supuesto: false } : { zona: CENTRO, supuesto: true };
}
