// LA CLÁUSULA DE CUPO MÍNIMO: CUÁNDO ESTÁ ACTIVA EN UNA SALIDA (D26 de legal;
// design/legal/POLITICA-CANCELACION-CLIENTE-2026-11.md §7).
//
// Cancelar una salida porque no se juntó gente genera la bonificación del 20 %
// (es causa de quien opera) SALVO que el cliente lo supiera antes de pagar, con
// número y fecha. Eso es esta cláusula, y es de cada salida.
//
// Está activa cuando se cumplen las cuatro cosas:
//   1 · La salida tiene MÍNIMO y FECHA DE CONFIRMACIÓN capturados a propósito
//       (`minimo` y `confirmacion_limite`). ⚠️ No se usa `fecha_limite`: ésa es
//       la fecha para apartar lugar en el espacio del grupo y se llena sola.
//   2 · La fecha respeta el piso según lo que dura la salida (§7.3): quien
//       opera puede avisar antes, nunca después.
//   3 · La salida no está confirmada (ni cancelada).
//   4 · La fecha no ha pasado: a quien compra después no se le puede decir «te
//       confirmamos a más tardar el [día que ya fue]».
//
// Si no está activa, la cláusula NO se muestra y cancelar por falta de grupo
// es atribuible a quien opera. El sistema no la «arregla» moviendo la fecha.
//
// Puro: lo usan las pantallas, el cobro, el panel y las pruebas.

import { diasNaturales, fechaConAnio, ymdCdmx, type ClausulaMinimo } from "@/lib/cancelacion/politica";

const DIA = 86_400_000;
const restarDias = (ymd: string, n: number): string => new Date(new Date(`${ymd}T12:00:00Z`).getTime() - n * DIA).toISOString().slice(0, 10);

export type SalidaParaClausula = {
  minimo: number | null;
  /** YYYY-MM-DD. El día a más tardar en que se confirma o se cancela por cupo. */
  confirmacionLimite: string | null;
  startsAt: string | null;
  endsAt: string | null;
  confirmadaAt: string | null;
  status?: string | null;
};

/** Cuántos días dura la salida, contando el de inicio y el de fin (fechas de CDMX). Sin fin, uno. */
export function diasDeDuracion(startsAt: string, endsAt: string | null): number {
  const inicio = ymdCdmx(startsAt);
  const fin = endsAt ? ymdCdmx(endsAt) : inicio;
  return Math.max(1, diasNaturales(inicio, fin) + 1);
}

/**
 * El último día en que puede caer la fecha de confirmación (§7.3). La regla de
 * referencia es la europea de viajes combinados (Directiva (UE) 2015/2302,
 * art. 12.3.a): 20 días antes en viajes de más de seis días; 7 días en viajes
 * de dos a seis; 48 horas en viajes de menos de dos.
 *
 * La fecha de confirmación no trae hora y «te avisamos a más tardar ese día»
 * llega hasta las 23:59 de CDMX; por eso en el caso de las 48 horas el último
 * día válido es el anterior al día en que caen esas 48 horas.
 */
export function pisoDeConfirmacion(startsAt: string, endsAt: string | null): { ultimoDia: string; regla: string } {
  const d = diasDeDuracion(startsAt, endsAt);
  const inicio = ymdCdmx(startsAt);
  if (d < 2) {
    const corte = new Date(new Date(startsAt).getTime() - 2 * DIA);
    return { ultimoDia: restarDias(ymdCdmx(corte), 1), regla: "48 horas antes del inicio (salida de menos de dos días)" };
  }
  if (d <= 6) return { ultimoDia: restarDias(inicio, 7), regla: "7 días naturales antes del inicio (salida de dos a seis días)" };
  return { ultimoDia: restarDias(inicio, 20), regla: "20 días naturales antes del inicio (salida de más de seis días)" };
}

export type EstadoDeClausula =
  | { activa: true; clausula: ClausulaMinimo }
  | { activa: false; razon: "sin-datos" | "minimo-de-uno" | "sin-fecha-de-salida" | "fuera-del-piso" | "confirmada" | "cancelada" | "vencida"; porque: string };

/** ¿La salida tiene la cláusula activa hoy? Si no, por qué (para decírselo a quien la captura). */
export function clausulaDeSalida(s: SalidaParaClausula, ahora: Date = new Date()): EstadoDeClausula {
  if (s.status === "cancelled") return { activa: false, razon: "cancelada", porque: "La salida está cancelada." };
  if (s.minimo == null || !s.confirmacionLimite) {
    return { activa: false, razon: "sin-datos", porque: "Falta el mínimo de personas o la fecha de confirmación." };
  }
  if (!Number.isInteger(s.minimo) || s.minimo < 2) {
    return { activa: false, razon: "minimo-de-uno", porque: "Un mínimo de una persona no es un grupo mínimo: con el primer lugar pagado la salida ya sale." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.confirmacionLimite) || !s.startsAt) {
    return { activa: false, razon: "sin-fecha-de-salida", porque: "La salida no tiene fecha de inicio." };
  }
  if (s.confirmadaAt) return { activa: false, razon: "confirmada", porque: "La salida ya está confirmada: ya no se cancela por falta de grupo." };
  const piso = pisoDeConfirmacion(s.startsAt, s.endsAt);
  if (s.confirmacionLimite > piso.ultimoDia) {
    return {
      activa: false,
      razon: "fuera-del-piso",
      porque: `La fecha de confirmación tiene que ser a más tardar el ${piso.ultimoDia}: ${piso.regla}. Con una fecha más tardía la cláusula no se muestra y cancelar por falta de grupo genera la bonificación.`,
    };
  }
  if (ymdCdmx(ahora) > s.confirmacionLimite) {
    return { activa: false, razon: "vencida", porque: "La fecha de confirmación ya pasó: quien compre ahora ya no lleva la cláusula." };
  }
  return { activa: true, clausula: { minimo: s.minimo, limite: s.confirmacionLimite } };
}

/**
 * ¿Se puede cancelar HOY esta salida por cupo mínimo? (§7.6) Sólo con la
 * cláusula activa, menos lugares pagados que el mínimo, y el aviso saliendo a
 * más tardar el día de la fecha de confirmación (hora de CDMX). Fuera de eso no
 * existe «cupo mínimo»: es causa de quien opera.
 */
export function puedeCancelarPorCupo(s: SalidaParaClausula, lugaresPagados: number, ahora: Date = new Date()): { ok: true; clausula: ClausulaMinimo } | { ok: false; porque: string } {
  const e = clausulaDeSalida(s, ahora);
  if (!e.activa) return { ok: false, porque: e.porque };
  if (lugaresPagados >= e.clausula.minimo) {
    return { ok: false, porque: `Ya hay ${lugaresPagados} lugares pagados y el mínimo es ${e.clausula.minimo}: la salida se junta.` };
  }
  return { ok: true, clausula: e.clausula };
}

/**
 * El candado de §7.4: con reservas pagadas que traen la cláusula, el mínimo no
 * sube y la fecha de confirmación no se atrasa respecto de lo MÁS ESTRICTO que
 * se le prometió a alguna de ellas. Bajar el mínimo, adelantar la fecha o
 * quitar la cláusula sí: favorece al cliente. Se compara contra las copias de
 * las reservas y no contra el valor anterior de la salida: así quitarla y
 * volverla a poner más alta tampoco pasa. Devuelve el porqué si el cambio no
 * se permite; null si pasa. (El mismo candado vive en la base: trigger 0093.)
 */
export function cambioQuePerjudica(despues: { minimo: number | null; confirmacionLimite: string | null }, copias: ClausulaMinimo[]): string | null {
  if (!copias.length) return null;
  const minimoPrometido = Math.min(...copias.map((c) => c.minimo));
  const limitePrometido = copias.map((c) => c.limite).sort()[0];
  if (despues.minimo != null && despues.minimo > minimoPrometido) {
    return `Ya hay personas que pagaron sabiendo que el mínimo era ${minimoPrometido}: no se puede subir. Bajarlo sí.`;
  }
  if (despues.confirmacionLimite && despues.confirmacionLimite > limitePrometido) {
    return `Ya hay personas que pagaron sabiendo que se les confirmaba a más tardar el ${limitePrometido}: la fecha no se puede atrasar. Adelantarla sí.`;
  }
  return null;
}

/** La copia de la cláusula que guardó una reserva, o null si no la trae. */
export function clausulaDeReserva(r: { clausula_minimo?: number | null; clausula_limite?: string | null } | null | undefined): ClausulaMinimo | null {
  if (!r || r.clausula_minimo == null || !r.clausula_limite) return null;
  return { minimo: Number(r.clausula_minimo), limite: String(r.clausula_limite).slice(0, 10) };
}

/**
 * La cláusula como texto corto, para que la pantalla le diga al servidor QUÉ
 * enseñó: «6|2026-12-01», o vacío si no enseñó ninguna. Al cobrar se compara
 * con la que la salida tiene en ese momento: si alguien cambió el mínimo o la
 * fecha entre que se abrió la pantalla y se dio «Pagar», no se cobra con una
 * huella de un texto que la persona no vio.
 */
export const clausulaVistaDe = (c: ClausulaMinimo | null | undefined): string => (c ? `${c.minimo}|${c.limite}` : "");

export const MENSAJE_CLAUSULA_CAMBIO = "Las condiciones de esta salida cambiaron mientras reservabas. Revisa la política de cancelación y vuelve a intentarlo.";

/** Cómo pagó una reserva, para saber por dónde vuelve su dinero. */
export type FormaDePagoDeReserva = "tarjeta" | "transferencia" | "mixta";

/**
 * De los cobros vivos de una reserva: todos con tarjeta → tarjeta; ninguno →
 * transferencia; mezcla → mixta. «Tarjeta» es lo que cobró el procesador
 * (`stripe`); todo lo demás lo devuelve la casa por banco.
 */
export function formaDePagoDe(metodos: (string | null)[]): FormaDePagoDeReserva {
  const conTarjeta = metodos.filter((m) => m === "stripe").length;
  if (conTarjeta === metodos.length) return "tarjeta"; // también sin cobros: no hay cuenta que pedir
  return conTarjeta === 0 ? "transferencia" : "mixta";
}

/**
 * EL AVISO DE CANCELACIÓN POR CUPO MÍNIMO, párrafo por párrafo (§7.6 y §7.10).
 * `**…**` marca negritas. Es el único correo que recibe todo el mundo ese día
 * —quien pagó por transferencia no tiene correo automático de devolución—, así
 * que lo que se le debe a cada persona va AQUÍ:
 *   · sin cláusula en su reserva: no se le dice «como te lo dijimos antes de
 *     pagar» y se le anuncia su bonificación del 20 %, pidiéndole la cuenta;
 *   · pagó por transferencia: la devolución va por transferencia y se le pide
 *     la cuenta donde quiere recibirla;
 *   · pagó una parte con tarjeta y otra por transferencia: cada pago vuelve
 *     por donde entró (LFPC 92), y la cuenta se pide sólo para lo transferido.
 * Es texto de correo, no de la política aceptada: no toca la huella.
 */
export function avisoDeCancelacionPorCupo(i: {
  /** «Experiencia · salida» */
  viaje: string;
  clausula: ClausulaMinimo;
  /** Cuántos lugares pagados había. */
  pagados: number;
  /** ¿La reserva de esta persona trae la cláusula? */
  traeClausula: boolean;
  /** Cómo pagó: todo con tarjeta, nada con tarjeta, o una parte y una parte. */
  forma: FormaDePagoDeReserva;
}): string[] {
  const parrafos = [
    `Para **${i.viaje}** hacían falta ${i.clausula.minimo} personas y al ${fechaConAnio(i.clausula.limite)} éramos ${i.pagados}. ${i.traeClausula ? "Como te lo dijimos antes de pagar, la" : "La"} salida se cancela.`,
    `Hoy mismo pedimos la devolución del **100 %** de lo que pagaste, ${
      i.forma === "transferencia"
        ? "por transferencia, igual que pagaste. Respóndenos con la CLABE y el nombre del titular de la cuenta donde quieres recibirla."
        : i.forma === "mixta"
          ? "a la misma forma de pago de cada uno de tus pagos. Lo que pagaste con tarjeta vuelve a tu tarjeta. Para lo que pagaste por transferencia, respóndenos con la CLABE y el nombre del titular de la cuenta donde quieres recibirlo."
          : "a la misma forma de pago, y te avisamos en cuanto quede hecha."
    } Si quieres, te ayudamos a pasarte a otra fecha.`,
  ];
  if (!i.traeClausula) {
    parrafos.push(
      "Además te corresponde una **bonificación del 20 %** de lo que pagaste. Para pagártela por transferencia, respóndenos con tu CLABE y el nombre del titular. La recibes a más tardar en 5 días hábiles.",
    );
  }
  return parrafos;
}
