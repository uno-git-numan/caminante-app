// «ESTO TE FALTA PARA VENDER» — UNA SOLA LISTA (23 nov 2026).
//
// Luis: «Dar de alta… es gigante, hay demasiada información, incógnitas». Mi
// alta cuenta lo que falta en cuatro pasos y la operadora tiene que abrir cada
// uno para saber qué le toca. Esta lista lo pone junto, arriba, en el orden en
// que se hace, y con la liga de cada cosa en su renglón.
//
// ⚠️ NO RECALCULA NADA. Los renglones salen de los MISMOS seis candados que ve
// la casa (`fetchOperadorasPlataforma`) y del expediente real. Una segunda
// cuenta de «qué falta» acabaría diciendo otra cosa que la ficha de la casa —
// la misma razón por la que `mi-alta.ts` no recalcula los candados—.
//
// Es pura: se prueba sin base y se importa desde el navegador.

import type { Candado } from "@/lib/plataforma/etapas";

export type Falta = {
  clave: string;
  titulo: string;
  /** Qué falta exactamente, en una línea. */
  detalle: string;
  /** Quién lo destraba. Lo de la casa se enseña, pero no lleva botón. */
  toca: "operadora" | "casa";
  /** A dónde se va a resolverlo. `null`: no hay nada que la operadora haga. */
  href: string | null;
  /** La palabra del botón. */
  accion: string | null;
  /**
   * `false`: no detiene la venta, tiene su propio plazo (antes de la primera
   * salida, 30 días). Se enseña en la misma lista, pero no cuenta en el
   * «te faltan N cosas para vender». Sin el campo, sí la detiene.
   */
  detieneLaVenta?: boolean;
};

export type ParaLoQueFalta = {
  candados: Candado[];
  /** `null` mientras no hay fila de operadora: sigue en el embudo. */
  expediente: {
    /** El expediente de ARRANQUE está aprobado (constancia e identificación). */
    completo: boolean;
    vacio: boolean;
    /** Documentos de arranque sin subir o rechazados. */
    faltanTotal: number;
    /** Lo que se entrega antes de la primera salida y todavía falta. */
    paraSalir?: { faltan: number };
    /** El registro de turismo: 30 días desde la firma. */
    rnt?: { estado: string } | null;
  } | null;
  /** Vende con dispensa: el expediente abierto no le detiene la venta hoy. */
  conDispensa: boolean;
  /** Borradores a su nombre, para decidir a dónde manda «una experiencia». */
  borradores: number;
  /**
   * El alta de la cuenta de cobro DENTRO de la plataforma está prendida
   * (`COBRO_EN_PLATAFORMA`). Apagada, la cuenta la abre la casa: la operadora
   * no sale al enlace externo (Luis, 11 nov 2026), así que no es pendiente suyo.
   */
  cobroEnPlataforma: boolean;
};

const RUTA = {
  expediente: "/caminante/admin/mi-alta/expediente",
  convenio: "/caminante/admin/mi-alta/convenio",
  cobrar: "/caminante/admin/mi-alta/cobrar",
  nueva: "/caminante/admin/experiencias/nueva",
  experiencias: "/caminante/admin/eventos",
} as const;

/** Las rutas que son DE LA OPERADORA y llevan `?operadora=` si actúa la casa. */
export const RUTAS_CON_OPERADORA: readonly string[] = [RUTA.expediente, RUTA.convenio, RUTA.cobrar];

const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

/**
 * Lo que falta para vender, en el orden en que se resuelve. Vacía = ya vende.
 *
 * El orden no es el de los candados: es el del camino (el mismo de los cinco
 * pasos de Mi alta, `pasos.ts`). Primero su experiencia, que es libre; luego
 * los dos documentos, la firma y la cuenta; y al final, publicarla.
 */
export function loQueFalta(d: ParaLoQueFalta): Falta[] {
  const falta: Falta[] = [];
  const candado = (clave: string) => d.candados.find((c) => c.clave === clave);
  const abierto = (clave: string) => {
    const c = candado(clave);
    return c && !c.cumplido ? c : null;
  };

  // 0 · TU EXPERIENCIA, PRIMERO (23 nov 2026). Armar es libre: no espera
  // papeles ni firma, y es lo que le enseña a la operadora cómo queda su
  // página. Sin ninguna, es el primer renglón y siempre lleva botón.
  const experiencia = abierto("experiencia");
  if (experiencia && d.borradores === 0) {
    falta.push({
      clave: "experiencia",
      titulo: "Arma tu primera experiencia",
      detalle: "Es libre y se hace en una pantalla. Al guardarla ves tu página tal como la verá tu cliente.",
      toca: "operadora",
      href: RUTA.nueva,
      accion: "Crear",
    });
  }

  // 1 · EL EXPEDIENTE. No es uno de los seis, pero sin la actividad aprobada no
  // se publica (candado de publicación por actividad). Con dispensa se enseña
  // igual: una dispensa deja vender, no convierte el expediente en hecho.
  const e = d.expediente;
  if (e && !e.completo) {
    if (e.vacio) {
      falta.push({
        clave: "expediente",
        titulo: "Tus documentos",
        detalle: "Para vender bastan dos documentos: tu constancia fiscal y tu identificación.",
        toca: "operadora",
        href: RUTA.expediente,
        accion: "Empezar",
      });
    } else if (e.faltanTotal > 0) {
      falta.push({
        clave: "expediente",
        titulo: "Tus documentos",
        detalle:
          `${plural(e.faltanTotal, "Falta", "Faltan")} ${e.faltanTotal} ${plural(e.faltanTotal, "documento", "documentos")} para poder vender ${e.faltanTotal >= 2 ? "(tu constancia fiscal y tu identificación)" : "(constancia fiscal o identificación)"}.` +
          (d.conDispensa ? " Hoy vendes con una dispensa, y tiene fecha." : ""),
        toca: "operadora",
        href: RUTA.expediente,
        accion: "Subir documentos",
      });
    } else {
      falta.push({
        clave: "expediente",
        titulo: "Tus documentos",
        detalle: "Entregaste lo necesario para vender. Lo estamos revisando.",
        toca: "casa",
        href: RUTA.expediente,
        accion: "Ver",
      });
    }
  }

  // 2 · LOS DATOS FISCALES. Salen solos de la constancia confirmada con el SAT,
  // y la constancia se sube en el expediente: por eso mandan allá.
  // ⚠️ Si el renglón de arriba ya le pide subir sus documentos, la constancia
  // es uno de ellos: decirlo dos veces era una lista de cinco cosas donde hay
  // cuatro. Este renglón queda para cuando los papeles están y el dato no
  // (dos regímenes en la constancia, o el SAT no la confirmó).
  const fiscal = abierto("fiscal");
  const yaSePidenLosDocumentos = !!e && !e.completo && (e.vacio || e.faltanTotal > 0);
  if (fiscal && !yaSePidenLosDocumentos) {
    falta.push({
      clave: "fiscal",
      titulo: "Tu constancia fiscal",
      detalle: `${fiscal.detalle}. Tus datos para facturarte la comisión salen de ella.`,
      toca: "operadora",
      href: RUTA.expediente,
      accion: "Subir constancia",
    });
  }

  // 3 · EL CONVENIO. El dueño lo dice el candado: si la casa no ha publicado
  // el texto, el pendiente es de la casa y no lleva botón.
  const convenio = abierto("convenio");
  if (convenio) {
    falta.push({
      clave: "convenio",
      titulo: "Firmar el convenio",
      detalle: convenio.detalle,
      toca: convenio.toca,
      href: convenio.toca === "operadora" ? RUTA.convenio : null,
      accion: convenio.toca === "operadora" ? "Firmar" : null,
    });
  }

  // 4 · LA CUENTA DE COBRO. De quién es el pendiente depende de la bandera:
  // con el alta dentro de la plataforma la captura ella; sin ella la abre la
  // casa, y decirle «te toca» sería mandarla a una pantalla sin botón.
  const cuenta = abierto("connect");
  if (cuenta) {
    falta.push({
      clave: "connect",
      titulo: "Tu cuenta de cobro",
      detalle: d.cobroEnPlataforma
        ? "Sin conectar. A ella entra el dinero de tus ventas, a tu nombre."
        : "Sin conectar. La abrimos nosotros contigo; a ella entra el dinero de tus ventas.",
      toca: d.cobroEnPlataforma ? "operadora" : "casa",
      href: RUTA.cobrar,
      accion: d.cobroEnPlataforma ? "Conectar" : "Ver",
    });
  }

  // 5 · EL PANEL. Sólo lo prende la casa.
  const panel = abierto("panel");
  if (panel) {
    falta.push({
      clave: "panel",
      titulo: "Tu panel",
      detalle: "Apagado. Lo prendemos nosotros al aprobar tu alta.",
      toca: "casa",
      href: null,
      accion: null,
    });
  }

  // 6 · PUBLICARLA. Con borrador, publicar es lo último: pide lo de arriba.
  if (experiencia && d.borradores > 0) {
    const pendientes = falta.filter((f) => f.clave !== "experiencia").length;
    falta.push({
      clave: "experiencia",
      titulo: "Publicar tu experiencia",
      detalle: pendientes
        ? `Tienes ${d.borradores} en borrador. Se publica en cuanto cierres lo de arriba; mientras, puedes seguir armándola y ver cómo queda.`
        : `Tienes ${d.borradores} en borrador. Ya puedes publicarla.`,
      toca: "operadora",
      href: RUTA.experiencias,
      accion: pendientes ? "Abrir" : "Publicar",
    });
  }

  // ── LO QUE NO DETIENE LA VENTA, pero tiene plazo (convenio v3.5, Anexo B) ──
  if (e?.paraSalir && e.paraSalir.faltan > 0) {
    falta.push({
      clave: "para-salir",
      titulo: "Antes de tu primera salida",
      detalle:
        `${plural(e.paraSalir.faltan, "Falta", "Faltan")} ${e.paraSalir.faltan} ${plural(e.paraSalir.faltan, "documento", "documentos")}: ` +
        "póliza de responsabilidad civil, credencial del guía o permisos. Ya puedes vender sin ellos, pero sin ellos la salida no se realiza.",
      toca: "operadora",
      href: RUTA.expediente,
      accion: "Subir",
      detieneLaVenta: false,
    });
  }
  if (e?.rnt && (e.rnt.estado === "falta" || e.rnt.estado === "rechazado")) {
    falta.push({
      clave: "rnt",
      titulo: "Registro Nacional de Turismo",
      detalle: "Tienes 30 días desde que firmas el convenio para subir tu constancia o el acuse del trámite.",
      toca: "operadora",
      href: RUTA.expediente,
      accion: "Subir",
      detieneLaVenta: false,
    });
  }

  return falta;
}

/** Cuántos renglones le tocan a ella: es el número que importa arriba. */
export const cuantasMeTocan = (falta: Falta[]): number =>
  falta.filter((f) => f.toca === "operadora" && f.href && f.detieneLaVenta !== false).length;

/** Lo que de verdad detiene la venta, sea de quien sea. */
export const detienenLaVenta = (falta: Falta[]): Falta[] => falta.filter((f) => f.detieneLaVenta !== false);

/** El encabezado de la lista, dicho según a quién le toca lo que queda. */
export function tituloDeLoQueFalta(falta: Falta[]): string {
  const mias = cuantasMeTocan(falta);
  if (mias === 0) {
    return detienenLaVenta(falta).length
      ? "Lo que falta para que vendas ya no depende de ti"
      : "Ya puedes vender. Esto es lo que sigue";
  }
  return mias === 1 ? "Te falta una cosa para vender" : `Te faltan ${mias} cosas para vender`;
}
