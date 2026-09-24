// EL NAV DEL ALTA — qué secciones del panel se abren mientras la operadora
// no termina su alta, y qué le dice cada una cuando la pica.
//
// Transcrito del script de la lámina v5 (design/panel-operador/dc/Operador Mi
// Alta v5.html): tres estados, las seis secciones y sus «susurros». Los textos
// se copiaron del archivo con un script, no se teclearon.
//
//   cerrado      → las seis punteadas. Sólo «Mi alta».
//   experiencias → se prende Experiencias al firmar el convenio (puede armar).
//   abierto      → todo, cuando puede cobrar.
//
// ⚠️ LO VENDIDO NUNCA SE CIERRA (Luis, 24 sep 2026). Una operadora con ventas
// pagadas conserva todo abierto aunque su alta siga abierta: sus salidas vivas
// no se pueden quedar sin lista, sin deslindes ni sin datos médicos. Hoy sólo
// aplica a Nomádika —la única que vende con dispensa—, y como fuera de ella no
// debe haber otra excepción, ninguna operadora nueva puede tener ventas sin
// poder cobrar: no se repite.
//
// Puro y sin servidor: lo importan el layout, la cabecera y el nav, que es un
// componente de navegador.

export type EstadoNav = "cerrado" | "experiencias" | "abierto";

export type Seccion = {
  nombre: string;
  href: string;
  /** Las rutas que son de esta sección. */
  prefijos: string[];
  /** Panorama es `/caminante/admin` exacto: como prefijo abarcaría todo. */
  exacta?: boolean;
  /** [título, texto] del susurro cuando se pica cerrada. */
  dice: [string, string];
};

export const SECCIONES_ALTA: Seccion[] = [
  {
    nombre: "Panorama",
    href: "/caminante/admin",
    prefijos: [],
    exacta: true,
    dice: ["Panorama se abre cuando puedas vender", "Aquí verás tus ventas, tus reservas y tu dinero del mes. Mientras no haya una venta, no habría nada que mostrarte."],
  },
  {
    nombre: "Experiencias",
    href: "/caminante/admin/eventos",
    prefijos: ["/caminante/admin/eventos", "/caminante/admin/experiencias/", "/caminante/admin/preview/"],
    dice: ["Experiencias se abre al firmar el convenio", "Es lo primero que se prende, y sólo necesita tu firma. Desde ahí armas tus experiencias en borrador, con fotos, itinerario y precios, sin darnos un solo dato fiscal."],
  },
  {
    nombre: "Comunicación",
    href: "/caminante/admin/comunicacion",
    prefijos: ["/caminante/admin/comunicacion", "/caminante/admin/kit/", "/caminante/admin/social/"],
    dice: ["Comunicación se abre cuando puedas vender", "Es donde le escribes a la gente que te reservó. Sin reservas todavía no tiene a quién escribirle."],
  },
  {
    nombre: "Comunidad",
    href: "/caminante/admin/comunidad",
    prefijos: ["/caminante/admin/comunidad"],
    dice: ["Comunidad se abre cuando puedas vender", "Aquí vive quien ya te compró y quien te sigue. Se llena con tu primera venta."],
  },
  {
    nombre: "Salidas",
    href: "/caminante/admin/salidas",
    prefijos: ["/caminante/admin/salidas", "/caminante/admin/roster/", "/caminante/admin/print/", "/caminante/admin/encuesta"],
    dice: ["Salidas se abre cuando puedas vender", "Es el calendario de tus fechas y sus lugares. Para abrir una fecha a la venta primero tiene que poder cobrarse."],
  },
  {
    nombre: "Pagos",
    href: "/caminante/admin/pagos",
    prefijos: ["/caminante/admin/pagos"],
    dice: ["Pagos se abre al conectar tus cobros", "Aquí ves lo que te entra, lo que retiene la plataforma y cuándo cae cada depósito. Necesita tu cuenta verificada y tu CSD cargado."],
  },
];

export const NOTA_NAV: Record<Exclude<EstadoNav, "abierto">, string> = {
  cerrado: "Las seis secciones se abren cuando termines tu alta. Pícalas y te digo qué le falta a cada una.",
  experiencias: "Experiencias se prendió al firmar tu convenio. Las otras cinco se abren cuando puedas cobrar; pícalas y te digo qué falta.",
};

export function estadoNav(o: {
  puedeArmar: boolean;
  puedeCobrar: boolean;
  /** Tiene al menos una venta PAGADA. */
  tieneVentas: boolean;
}): EstadoNav {
  if (o.puedeCobrar || o.tieneVentas) return "abierto";
  if (o.puedeArmar) return "experiencias";
  return "cerrado";
}

/** ¿Esta sección está abierta en este estado? */
export function abierta(s: Seccion, estado: EstadoNav): boolean {
  if (estado === "abierto") return true;
  if (estado === "experiencias") return s.nombre === "Experiencias";
  return false;
}

/** La sección a la que pertenece una ruta, o null si no es de las seis. */
export function seccionDe(ruta: string | null | undefined): Seccion | null {
  if (!ruta) return null;
  const p = ruta.split("?")[0].replace(/\/+$/, "") || "/";
  for (const s of SECCIONES_ALTA) {
    if (s.exacta ? p === s.href : s.prefijos.some((x) => p === x || p.startsWith(x.endsWith("/") ? x : x + "/"))) return s;
  }
  return null;
}

/**
 * ¿Esta ruta está cerrada para quien sigue en su alta?
 *
 * Sólo las seis secciones se cierran. «Mi alta» y sus pantallas (expediente,
 * convenio, cobro, marca) nunca: son justo por donde se termina el alta.
 */
export function rutaCerrada(ruta: string | null | undefined, estado: EstadoNav): boolean {
  const s = seccionDe(ruta);
  return !!s && !abierta(s, estado);
}
