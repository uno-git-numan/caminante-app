// LA POLÍTICA DE CANCELACIÓN FRENTE AL CLIENTE (D12–D14 y D23 de legal;
// design/legal/POLITICA-CANCELACION-CLIENTE-2026-11.md).
//
// Tres cosas viven aquí y en ningún otro lado:
//   1 · EL TEXTO que ve el cliente, transcrito tal cual del documento de legal.
//       Dos variantes (Estándar y Expedición); cambia sólo el primer bloque.
//       Los números son los de la Cláusula Quinta del convenio v3.3.
//   2 · LOS DÍAS HÁBILES: lunes a viernes sin los descansos obligatorios del
//       artículo 74 de la Ley Federal del Trabajo, en una lista por año.
//   3 · LA CALCULADORA: qué porcentaje propone el sistema al devolver, y por
//       qué regla. Propone; la persona de la casa confirma.
//
// Módulo puro a propósito: lo prueban los tests sin servidor y lo usan tanto
// las pantallas (texto) como el panel (calculadora).

const r2 = (x: number) => Math.round(x * 100) / 100;
const DIA = 86_400_000;

// ── 1 · El texto ────────────────────────────────────────────────────────────

export type Variante = "estandar" | "expedicion";

/** Las ventanas de cada variante: con `desdeDias` o más antes de la salida, se devuelve `pct`. De mayor a menor. */
export const VENTANAS: Record<Variante, { nombre: string; tramos: { desdeDias: number; pct: number }[] }> = {
  estandar: { nombre: "Estándar", tramos: [{ desdeDias: 30, pct: 100 }, { desdeDias: 15, pct: 50 }] },
  expedicion: { nombre: "Expedición", tramos: [{ desdeDias: 60, pct: 100 }, { desdeDias: 30, pct: 50 }] },
};

export function esVariante(x: unknown): x is Variante {
  return x === "estandar" || x === "expedicion";
}

export type BloquePolitica = { titulo: string; renglones: string[] };

/** La frase que va junto al botón de pagar. Con el texto a la vista, basta como aceptación (LFPC 76 Bis III). */
export const FRASE_ACEPTACION = "Al pagar aceptas la política de cancelación de esta experiencia.";
export const TITULO_POLITICA = "Cancelación y devoluciones";

/**
 * El texto completo, en bloques. `**…**` marca negritas. Transcrito de legal:
 * no se edita aquí sin que legal cambie su documento (cada reserva guarda la
 * huella del texto que aceptó).
 */
export function bloquesPolitica(v: Variante): BloquePolitica[] {
  const [a, b] = VENTANAS[v].tramos;
  return [
    {
      titulo: "Si cancelas tú",
      renglones: [
        `Con ${a.desdeDias} días o más antes de la salida: te devolvemos el **100 %**.`,
        `De ${b.desdeDias} a ${a.desdeDias - 1} días antes: el **50 %**.`,
        `Con menos de ${b.desdeDias} días: no hay devolución.`,
      ],
    },
    {
      titulo: "Tu derecho a arrepentirte",
      renglones: [
        "Dentro de las **24 horas** siguientes a tu reserva, si la salida está a 7 días o más, te devolvemos el **100 %**.",
        "Además, por ley: si reservaste con **más de 10 días hábiles** de anticipación a la salida, puedes cancelar sin dar motivo dentro de los **5 días hábiles** siguientes a tu reserva y te devolvemos el **100 %** (artículo 56 de la Ley Federal de Protección al Consumidor).",
      ],
    },
    {
      titulo: "Si la salida se cancela",
      renglones: [
        "Te devolvemos siempre el **100 %** de lo que pagaste.",
        "Si se cancela por una causa atribuible a quien opera la experiencia, recibes además una **bonificación del 20 %** de lo que pagaste (artículos 92 Bis y 92 Ter de la misma ley). La bonificación no aplica cuando la cancelación es por fuerza mayor: mal tiempo que impida operar con seguridad, cierre del área natural, del camino o del puerto por la autoridad, contingencia sanitaria o bloqueo que impida llegar, o emergencia médica del guía sin sustituto posible.",
      ],
    },
    {
      titulo: "Cómo se devuelve",
      renglones: [
        "Las devoluciones se hacen a la **misma forma de pago** que usaste.",
        "La bonificación se paga por transferencia a la cuenta que nos indiques, a más tardar en 5 días hábiles.",
        "Los plazos en días se cuentan en días naturales hasta el inicio de la salida. Los días hábiles son de lunes a viernes, sin los días de descanso obligatorio.",
        "Para cancelar, hazlo desde tu espacio o escríbenos. Cuenta la fecha y la hora en que recibimos tu aviso.",
      ],
    },
  ];
}

/** El texto canónico (sin negritas), el que se huella en cada reserva. */
export function textoPolitica(v: Variante): string {
  return [TITULO_POLITICA, ...bloquesPolitica(v).flatMap((b) => ["", b.titulo, ...b.renglones.map((r) => `- ${r.replace(/\*\*/g, "")}`)])].join("\n");
}

/** El resumen de tres renglones para reservar y la página de pago. */
export function resumenPolitica(v: Variante): string[] {
  const [a, b] = VENTANAS[v].tramos;
  return [
    `Si cancelas tú: 100 % con ${a.desdeDias} días o más de anticipación; 50 % de ${b.desdeDias} a ${a.desdeDias - 1} días; después, sin devolución.`,
    "Puedes arrepentirte: 24 horas si la salida está a 7 días o más, y 5 días hábiles si reservaste con más de 10 días hábiles de anticipación.",
    "Si la salida se cancela, te devolvemos el 100 %.",
  ];
}

// ── 2 · Los días hábiles ────────────────────────────────────────────────────

/**
 * Días de descanso obligatorio, artículo 74 de la Ley Federal del Trabajo
 * (fracciones I–VI y VIII), por año. Fuente del artículo: PROFEDET, «¿Sabes
 * cuáles son los Días de Descanso Obligatorio para este 2026?», 2 ene 2026
 * (gob.mx/profedet). Las fechas salen de la regla del propio artículo: 1 ene ·
 * primer lunes de febrero · tercer lunes de marzo · 1 may · 16 sep · tercer
 * lunes de noviembre · 25 dic. La fracción VII (1 oct cada seis años, cambio
 * del Ejecutivo) no cae en estos años (2024, 2030). La fracción IX (jornada
 * electoral) cae en domingo, que de todos modos no es hábil.
 * Un año que no esté en la lista NO se calcula: se agrega con su fuente.
 */
export const DESCANSOS_OBLIGATORIOS: Record<number, string[]> = {
  2026: ["2026-01-01", "2026-02-02", "2026-03-16", "2026-05-01", "2026-09-16", "2026-11-16", "2026-12-25"],
  2027: ["2027-01-01", "2027-02-01", "2027-03-15", "2027-05-01", "2027-09-16", "2027-11-15", "2027-12-25"],
};

/** La fecha (YYYY-MM-DD) de un instante, en hora de CDMX (UTC−6, sin horario de verano). */
export const ymdCdmx = (d: Date | string): string => new Date(new Date(d).getTime() - 6 * 3600_000).toISOString().slice(0, 10);

const utc = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

/** ¿Es día hábil? Lunes a viernes y no descanso obligatorio. Truena si el año no está en la lista. */
export function esDiaHabil(ymd: string): boolean {
  const anio = Number(ymd.slice(0, 4));
  const descansos = DESCANSOS_OBLIGATORIOS[anio];
  if (!descansos) throw new Error(`Falta la lista de días de descanso obligatorio de ${anio} (politica.ts).`);
  const dow = utc(ymd).getUTCDay();
  return dow !== 0 && dow !== 6 && !descansos.includes(ymd);
}

const masUnDia = (ymd: string) => new Date(utc(ymd).getTime() + DIA).toISOString().slice(0, 10);

/** Días hábiles DESPUÉS de `desde` y hasta `hasta` inclusive (las dos, fechas de CDMX). */
export function diasHabilesEntre(desde: string, hasta: string): number {
  let n = 0;
  for (let d = masUnDia(desde); d <= hasta; d = masUnDia(d)) if (esDiaHabil(d)) n += 1;
  return n;
}

/** La fecha del n-ésimo día hábil siguiente a `desde`. */
export function sumarDiasHabiles(desde: string, n: number): string {
  let d = desde;
  for (let k = 0; k < n; ) {
    d = masUnDia(d);
    if (esDiaHabil(d)) k += 1;
  }
  return d;
}

/** Días naturales de una fecha a otra (fechas de CDMX). */
export const diasNaturales = (desde: string, hasta: string): number => Math.round((utc(hasta).getTime() - utc(desde).getTime()) / DIA);

// ── 3 · La calculadora ──────────────────────────────────────────────────────

export type ReglaReembolso = "operacion" | "arrepentimiento-legal" | "arrepentimiento-24h" | "ventana";

export type PropuestaReembolso = { pct: number; regla: ReglaReembolso; porque: string; importe: number };

export type CasoReembolso = {
  variante: Variante;
  /** Cuándo se creó el cobro (la reserva). */
  reservadaAt: string;
  /** El primer día de la salida, YYYY-MM-DD. */
  salidaInicio: string;
  /** Cuándo se recibió el aviso de cancelación. */
  avisoAt: string;
  /** Lo que pagó, complementos incluidos. */
  pagado: number;
  /** `operacion` = cancela quien opera o la casa; `cliente` = cancela el cliente. */
  cancela: "cliente" | "operacion";
};

/** El último instante (ISO) en que el cliente puede arrepentirse con el 100 %, o null si no tiene ese derecho. */
export function limiteArrepentimiento(reservadaAt: string, salidaInicio: string): string | null {
  const reserva = ymdCdmx(reservadaAt);
  const limites: number[] = [];
  // Legal (LFPC 56): reservó con más de 10 días hábiles de anticipación → 5 días hábiles.
  if (diasHabilesEntre(reserva, salidaInicio) > 10) {
    limites.push(new Date(`${sumarDiasHabiles(reserva, 5)}T23:59:59.999-06:00`).getTime());
  }
  // 24 horas, si la salida está a 7 días o más de la reserva.
  if (diasNaturales(reserva, salidaInicio) >= 7) limites.push(new Date(reservadaAt).getTime() + DIA);
  return limites.length ? new Date(Math.max(...limites)).toISOString() : null;
}

/**
 * Lo que el sistema PROPONE devolver. Orden de las reglas (gana la más
 * favorable al cliente): cancela la operación → arrepentimiento legal →
 * arrepentimiento de 24 horas → ventanas de la variante.
 */
export function proponerReembolso(c: CasoReembolso): PropuestaReembolso {
  const con = (pct: number, regla: ReglaReembolso, porque: string): PropuestaReembolso => ({ pct, regla, porque, importe: r2((c.pagado * pct) / 100) });
  if (c.cancela === "operacion") return con(100, "operacion", "La salida se cancela: se devuelve siempre el 100 %.");

  const reserva = ymdCdmx(c.reservadaAt);
  const aviso = ymdCdmx(c.avisoAt);
  const tAviso = new Date(c.avisoAt).getTime();

  if (diasHabilesEntre(reserva, c.salidaInicio) > 10 && diasHabilesEntre(reserva, aviso) <= 5) {
    return con(100, "arrepentimiento-legal", "Reservó con más de 10 días hábiles de anticipación y avisó dentro de los 5 días hábiles siguientes (LFPC art. 56).");
  }
  if (diasNaturales(reserva, c.salidaInicio) >= 7 && tAviso - new Date(c.reservadaAt).getTime() <= DIA) {
    return con(100, "arrepentimiento-24h", "Avisó dentro de las 24 horas siguientes a su reserva y la salida estaba a 7 días o más.");
  }
  const faltan = diasNaturales(aviso, c.salidaInicio);
  const tramo = VENTANAS[c.variante].tramos.find((t) => faltan >= t.desdeDias);
  const nombre = VENTANAS[c.variante].nombre;
  if (!tramo) return con(0, "ventana", `Política ${nombre}: avisó ${faltan} días antes de la salida; con menos de ${VENTANAS[c.variante].tramos[1].desdeDias} días no hay devolución.`);
  return con(tramo.pct, "ventana", `Política ${nombre}: avisó ${faltan} días antes de la salida (${tramo.desdeDias} días o más: ${tramo.pct} %).`);
}

/** La bonificación del 20 % cuando la operación cancela por causa imputable (LFPC 92 Bis y 92 Ter). */
export const bonificacionDe = (pagado: number): number => r2(pagado * 0.2);
