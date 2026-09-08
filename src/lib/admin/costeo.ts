// EL COSTEO DE UNA SALIDA, ANTES DE QUE OCURRA.
//
// Puro a propósito: la calculadora de Recursos lo corre en el navegador para
// mostrar la tabla en vivo, y el panel lo corre en el servidor contra el roster
// real. Un solo motor, dos usos — si fueran dos, divergirían, y el día que
// diverjan el precio publicado y el corte contarían historias distintas.
//
// Los modos salieron de la 0049 y la 0057. Ver los comentarios de esas
// migraciones para POR QUÉ existe cada uno; aquí solo se aplican.

import { comisionDeVenta, sinIva, type Regla } from "@/lib/operadores/comision";

export type Modo = "unico" | "por_persona" | "desde_personas" | "porcentaje" | "tarifa_por_tramo";

export type LineaCosto = {
  concepto: string;
  tipo: "fijo" | "variable" | "buffer";
  modo: Modo;
  montoMxn?: number;
  tarifaMxn?: number | null;
  escalones?: { desde: number; monto: number }[] | null;
  tramos?: { desde: number; tarifa: number }[] | null;
  porcentaje?: number | null;
  /** Fracción de los CLIENTES que lo toma. NULL = lo toman todos (y las cortesías). */
  proporcion?: number | null;
};

/** Gente que va y cuesta sin pagar boleto. */
export type Cortesia = { rol: string; cuantas: number; descuentoPct: number };

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * CABEZAS = clientes + cortesías. Es lo que decide el tramo.
 *
 * ⚠️ No es un detalle: en San Andrés, 10 clientes + 2 guías son 12 cabezas, y
 * esa doceava cabeza baja la tarifa de $6,790 a $5,980 PARA TODOS. Contar solo
 * clientes movería el punto de quiebre de 10 a 12 y cambiaría qué se le promete
 * al equipo de ventas.
 */
export const cabezasDe = (clientes: number, cortesias: Cortesia[]): number =>
  clientes + cortesias.reduce((n, c) => n + Math.max(0, c.cuantas), 0);

/** El tramo más alto que no rebase las cabezas; por debajo del más bajo, el más bajo. */
function tarifaDelTramo(tramos: { desde: number; tarifa: number }[], cabezas: number): number {
  const orden = [...tramos].sort((a, b) => a.desde - b.desde);
  let elegida = orden[0]?.tarifa ?? 0;
  for (const t of orden) if (cabezas >= t.desde) elegida = t.tarifa;
  return elegida;
}

function montoDelEscalon(escalones: { desde: number; monto: number }[], personas: number): number {
  const orden = [...escalones].sort((a, b) => a.desde - b.desde);
  let elegido = orden[0]?.monto ?? 0;
  for (const e of orden) if (personas >= e.desde) elegido = e.monto;
  return elegido;
}

/**
 * Cuánto cuesta UNA línea con este grupo.
 *
 * La regla de a quién le aplica es explícita y vale la pena leerla:
 *   · sin `proporcion` → a TODAS las cabezas, y las cortesías entran con su
 *     descuento. Es el hospedaje: los guías también duermen.
 *   · con `proporcion` → solo a esa fracción de los CLIENTES. Es la caminata:
 *     una actividad opcional que los guías no compran.
 */
export function costoDeLinea(
  l: LineaCosto,
  ctx: { clientes: number; cortesias: Cortesia[] },
): number {
  const cabezas = cabezasDe(ctx.clientes, ctx.cortesias);

  // Cabezas "equivalentes": las cortesías cuentan a (100 − descuento)%.
  const equivalentes =
    ctx.clientes +
    ctx.cortesias.reduce((n, c) => n + c.cuantas * (1 - Math.min(100, Math.max(0, c.descuentoPct)) / 100), 0);

  const cuantos =
    l.proporcion != null ? Math.ceil(ctx.clientes * l.proporcion) : equivalentes;

  switch (l.modo) {
    case "unico":
      return r2(l.montoMxn ?? 0);
    case "por_persona":
      return r2((l.tarifaMxn ?? 0) * cuantos);
    case "tarifa_por_tramo":
      return r2(tarifaDelTramo(l.tramos ?? [], cabezas) * cuantos);
    case "desde_personas":
      return r2(montoDelEscalon(l.escalones ?? [], cabezas));
    case "porcentaje":
      return 0; // se resuelve en la cascada, sobre los que NO son porcentaje
    default:
      return 0;
  }
}

export type Cascada = {
  clientes: number;
  cabezas: number;
  publicoPorPersona: number;
  cobrado: number;
  iva: number;
  base: number;
  lineas: { concepto: string; tipo: string; monto: number }[];
  costosDuros: number;
  comision: number;
  pctComision: number;
  /** Lo que queda para el operador después de costos Y comisión. */
  queda: number;
  margen: number;
};

/**
 * LA CASCADA COMPLETA, con la comisión adentro.
 *
 * ⚠️ LA COMISIÓN ES UN COSTO. No estaba en la cascada y por eso el margen que
 * mostraba el panel salía inflado — el mismo defecto que la 0049 arregló para
 * los costos variables, vivo una capa más arriba. Aquí entra como un renglón
 * más, para que «lo que queda» signifique de verdad lo que queda.
 *
 * Y lo que queda es TODO del operador: Caminante cobra su comisión y ahí
 * termina, sin reparto de utilidad (decisión de Luis, 6 sep 2026).
 */
export function cascada(input: {
  clientes: number;
  cortesias: Cortesia[];
  costos: LineaCosto[];
  publicoPorPersona: number;
  regla: Regla;
}): Cascada {
  const { clientes, cortesias, costos, publicoPorPersona, regla } = input;
  const cabezas = cabezasDe(clientes, cortesias);

  const lineas = costos
    .filter((l) => l.modo !== "porcentaje")
    .map((l) => ({ concepto: l.concepto, tipo: l.tipo, monto: costoDeLinea(l, { clientes, cortesias }) }));
  const sinPorcentaje = lineas.reduce((n, l) => n + l.monto, 0);

  // El buffer, SOBRE LOS QUE NO SON PORCENTAJE. Si fuera sobre todo, dos
  // porcentajes se comerían el uno al otro y el total dependería del orden.
  for (const l of costos.filter((x) => x.modo === "porcentaje")) {
    lineas.push({
      concepto: l.concepto,
      tipo: l.tipo,
      monto: r2(sinPorcentaje * ((l.porcentaje ?? 0) / 100)),
    });
  }
  const costosDuros = r2(lineas.reduce((n, l) => n + l.monto, 0));

  const cobrado = r2(publicoPorPersona * clientes);
  const baseUno = sinIva(publicoPorPersona);
  const base = r2(baseUno * clientes);
  const iva = r2(cobrado - base);

  const c = comisionDeVenta({ viaje: { precioUnitario: baseUno, cantidad: clientes } }, regla);
  const queda = r2(base - costosDuros - c.monto);

  return {
    clientes, cabezas, publicoPorPersona, cobrado, iva, base,
    lineas: [...lineas, { concepto: "Comisión Caminante", tipo: "comision", monto: c.monto }],
    costosDuros, comision: c.monto, pctComision: c.pctEfectivo,
    queda, margen: base > 0 ? queda / base : 0,
  };
}
