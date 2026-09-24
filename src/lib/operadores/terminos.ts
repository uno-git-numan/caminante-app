// EL RESUMEN DE TÉRMINOS — su CONTENIDO, en un solo lugar.
//
// Viaja de dos maneras y tiene que decir lo mismo en las dos: como PDF adjunto
// a la invitación a la llamada (`terminos-pdf.ts`) y como texto desplegable en
// el paso «01 · Nos conocemos» de Mi alta, para que la operadora lo pueda
// releer cuando quiera sin buscar el correo (Luis, 24 sep 2026).
//
// ⚠️ POR ESO EL TEXTO VIVE AQUÍ Y NO EN NINGUNO DE LOS DOS. Hasta hoy estaba
// tejido con las llamadas de dibujo del PDF. Escribir una versión HTML aparte
// habría sido una segunda copia de un documento que habla de comisiones, y dos
// copias de un texto de dinero se separan la primera vez que alguien corrige
// una sola. Aquí se describe QUÉ dice, en bloques; cada formato decide CÓMO se
// ve. El PDF y el HTML recorren la misma lista.
//
// ⚠️ Y EL TEXTO NO SE REESCRIBIÓ AL MUDARLO: se transformó con un script las
// llamadas `h.parrafo(…)` en `b.parrafo(…)`, sin tocar una sola cadena, y se
// comparó el PDF antes y después. Al reproducir a mano un texto largo se cuelan
// cambios —esa misma tarde, al copiar un archivo, dos «ó» llegaron como «o»—.
//
// ⚠️ NO ES EL CONVENIO, y lo dice en su primer bloque. Ver `terminos-pdf.ts`.

import { IVA, MINIMO_POR_RESERVA, TOPE, comisionPara, pesos, tablaDeComisiones } from "./comision";
import { ACTIVIDADES, GENERALES, nombreDeActividad, requisitosDe } from "./actividades";

export type DatosTerminos = {
  responsable: string | null;
  operadora: string | null;
  /** Cuándo es la llamada. `null` si todavía no está agendada. */
  llamada: Date | null;
  /** Slugs del catálogo que declaró. Puede venir vacío. */
  actividades: string[];
  /** Tal como lo capturó en la solicitud: «$5,001 a $15,000 MXN». */
  rangoPrecio: string | null;
};

/** Para las tablas: sin «MXN» en cada celda, que se dice una vez arriba. */
const miles = (n: number): string => "$" + Math.round(n).toLocaleString("es-MX");

const fecha = (d: Date) =>
  d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City" });

/**
 * Los dos extremos de la banda de precio que declaró, si se pueden leer.
 *
 * ⚠️ SI NO SE PUEDEN LEER, NO HAY EJEMPLO. El campo es texto libre en la
 * solicitud; adivinar un monto para poner un ejemplo sería inventarle a alguien
 * cuánto va a cobrar, en un documento que va a leer antes de decidir.
 */
function bandaDe(rango: string | null): [number, number] | null {
  if (!rango) return null;
  const montos = [...rango.matchAll(/\$\s?([\d,]+)/g)]
    .map((m) => Number(m[1].replace(/,/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (montos.length !== 2) return null;
  const [a, b] = montos;
  return a < b ? [a, b] : null;
}

/** Un bloque del resumen. Describe el contenido y el peso, no la tinta. */
export type BloqueTerminos =
  | { t: "parrafo"; texto: string; size?: number; color?: "olivo" | "naranja"; interlinea?: number; sangria?: boolean }
  | { t: "titulo"; texto: string }
  | { t: "aviso"; titulo: string; cuerpo: string }
  | { t: "fila"; celdas: [string, string, string]; encabezado?: boolean }
  | { t: "espacio"; alto: number };

/** Junta los bloques con la misma forma de llamar que tenía la hoja del PDF. */
class Bloques {
  lista: BloqueTerminos[] = [];
  parrafo(
    texto: string,
    o: { size?: number; color?: "olivo" | "naranja"; interlinea?: number; sangria?: boolean } = {},
  ) {
    this.lista.push({ t: "parrafo", texto, ...o });
  }
  titulo(texto: string) {
    this.lista.push({ t: "titulo", texto });
  }
  aviso(titulo: string, cuerpo: string) {
    this.lista.push({ t: "aviso", titulo, cuerpo });
  }
  fila(a: string, b: string, c: string, o: { encabezado?: boolean } = {}) {
    this.lista.push({ t: "fila", celdas: [a, b, c], ...o });
  }
  espacio(alto: number) {
    this.lista.push({ t: "espacio", alto });
  }
}

/**
 * Qué dice el resumen para esta operadora, en orden.
 *
 * `hoy` se inyecta para que el pie («Generado el …») sea reproducible en
 * pruebas; en producción es la fecha en que se genera.
 */
export function terminosDe(d: DatosTerminos, hoy: Date = new Date()): BloqueTerminos[] {
  const b = new Bloques();
  const quien = (d.operadora || d.responsable || "").trim();

  b.parrafo("CAMINANTE · OPERADORES", { size: 8.5, color: "olivo" });
  b.espacio(8);
  b.parrafo("Resumen de términos", { size: 26, interlinea: 30 });
  b.parrafo(
    d.llamada ? `Para tu llamada del ${fecha(d.llamada)}` : "Para tu llamada",
    { size: 13, color: "naranja" },
  );
  if (quien) b.parrafo(quien, { size: 11, color: "olivo" });
  b.espacio(10);

  b.aviso(
    "Esto no es el convenio.",
    "Es un resumen para que llegues a la llamada sabiendo de qué vamos a hablar. El convenio es otro " +
      "documento, más largo y más preciso, y se firma después en tu panel. Si algo de aquí y algo de allá " +
      "se contradicen, manda el convenio.",
  );

  b.titulo("Qué es Caminante y qué no");
  b.parrafo(
    "Caminante es una plataforma: publicas tu experiencia, se cobra en línea, se firman los deslindes, " +
      "se lleva la lista de participantes y tienes tu panel. Caminante NO es operador turístico y no presta " +
      "el servicio de viaje: la experiencia —su diseño, su ejecución y su seguridad— es tuya.",
  );

  // ⚠️ ESTA SECCIÓN VA ANTES DE LOS NÚMEROS, y el orden es la decisión. Quien
  // lee primero una comisión y después una lista de funciones está comparando un
  // costo contra nada. Al revés, la comisión aterriza sobre algo que ya entendió.
  //
  // ⚠️ TODO LO DE AQUÍ ESTÁ EN PRODUCCIÓN, verificado el 11 de septiembre de
  // 2026. Lo que está a medias —Connect, facturación con su CSD, dominio
  // propio— NO se menciona: el guion de la llamada obliga a decirlo en vivo, y
  // un PDF que promete y una llamada que desmiente es la peor combinación.
  b.titulo("Lo que la plataforma hace por ti");
  b.parrafo(
    "No es una página con un botón de pagar. Es la operación completa de una salida, desde que alguien " +
      "la ve hasta que regresa y te deja un testimonio.",
    { color: "olivo", size: 10 },
  );
  b.espacio(6);
  for (const [titulo, detalle] of [
    ["Tu experiencia se ve como merece",
      "Página propia con el diseño de la marca: portada a sangre, itinerario, guías, qué incluye, qué llevar en la mochila, preguntas frecuentes. La armas tú desde un formulario, sin diseñador y sin programador, y puedes pre-llenarla con IA a partir del itinerario que ya tienes en PDF o en Word."],
    ["Con tu logo y tus colores",
      "Tus clientes compran en un portal vestido con tu marca, no con la nuestra."],
    ["Cobras con tarjeta, en línea",
      "Meses sin intereses según el banco, varios niveles de precio en la misma salida (habitación compartida o individual) y complementos que el cliente marca y se suman al total: el tren, una noche extra, un traslado."],
    ["Los cupos se cuidan solos",
      "Cada salida tiene su fecha y su cupo, se cierra sola cuando se llena y también cuando ya pasó. Puedes abrir salidas privadas con liga secreta para un grupo, y recibir solicitudes de fecha de quien quiere ir y no le queda ninguna."],
    ["El deslinde se firma en línea, y es tuyo",
      "Se genera con tus cláusulas y el viajero lo firma antes de viajar. Si ya tienes tu propia carta de deslinde, no la reemplazamos: se FUSIONA con la nuestra — donde las dos digan lo mismo se queda la tuya, lo que sólo tengas tú se agrega, y nunca se pierde cobertura."],
    ["El expediente que necesitas en el cerro",
      "Cada viajero llena sus datos, su contacto de emergencia y lo médico: alergias, padecimientos, dieta. Llegas a la salida con la lista imprimible y la ficha de cada persona, para poder leerle a un médico lo que declaró."],
    ["Tu comunicación, armada",
      "Un kit que toma tus fotos y arma las piezas para redes —post y story— con sus textos, y las publica directo a Instagram desde el panel. Más un flyer en PDF de cada experiencia, vertical y horizontal, y boletín por correo a tu gente."],
    ["Después del viaje, mides",
      "Encuesta de satisfacción que sale sola un día después de que termina cada salida, con calificación por partes del viaje y los testimonios que después usas para vender la siguiente."],
    ["Tu panel, y también en el teléfono",
      "Qué se vendió, quién va, cuánto entró, qué falta por firmar — por salida y en vivo. Desde la computadora y desde el celular."],
  ] as [string, string][]) {
    b.parrafo(titulo, { size: 11 });
    b.parrafo(detalle, { size: 9.5, color: "olivo", sangria: true });
    b.espacio(3);
  }
  b.parrafo(
    "Todo esto ya está funcionando hoy, no es un plan. Lo que todavía estamos construyendo te lo decimos " +
      "en la llamada, sin adornos — y ahí es donde queremos tus preguntas.",
    { size: 9.5, color: "olivo" },
  );

  b.titulo("La comisión");
  b.parrafo(
    "Se calcula por tramos sobre el precio de cada boleto, sin IVA, y no es una tasa plana: cada pedazo del " +
      "precio paga su tasa. Hay dos escalas, y lo que las separa es quién trajo al cliente.",
    { color: "olivo", size: 10 },
  );
  b.espacio(6);
  b.fila("Tramo del precio por persona", "Te lo traemos", "Lo traes tú", { encabezado: true });
  // ⚠️ `tablaDeComisiones()` y no `tramosPara()`: la segunda fusiona los tramos
  // de tasa igual y una tabla de dos columnas armada con eso sale con huecos.
  for (const t of tablaDeComisiones()) {
    b.fila(
      t.hasta ? `De ${miles(t.desde)} a ${miles(t.hasta)}` : `De ${miles(t.desde)} en adelante`,
      `${Math.round(t.venta * 100)}%`,
      `${Math.round(t.plataforma * 100)}%`,
    );
  }
  b.espacio(6);
  b.parrafo(
    `Todos los montos en pesos mexicanos. Mínimo ${pesos(MINIMO_POR_RESERVA)} por reserva, y nunca más del ${Math.round(TOPE * 100)}% de lo cobrado — ` +
      `el mínimo no puede volverse una tasa alta en una venta chica. Más IVA (${Math.round(IVA * 100)}%) sobre la comisión.`,
    { size: 9.5, color: "olivo" },
  );

  const banda = bandaDe(d.rangoPrecio);
  if (banda) {
    b.titulo("Tu caso, con los números que nos diste");
    b.parrafo(`Declaraste un rango de ${d.rangoPrecio}. Con esa banda:`, { size: 10, color: "olivo" });
    b.espacio(4);
    b.fila("Precio del boleto", "Te lo traemos", "Lo traes tú", { encabezado: true });
    for (const precio of banda) {
      const cv = comisionPara(precio, "venta");
      const cp = comisionPara(precio, "plataforma");
      b.fila(
        `Si cobras ${miles(precio)}, te quedan`,
        miles(precio - cv.monto),
        miles(precio - cp.monto),
      );
    }
    b.parrafo(
      "Sobre el precio sin IVA y antes de tus propios costos. La comisión efectiva baja conforme sube el " +
        "boleto, porque los tramos de arriba pagan menos.",
      { size: 9.5, color: "olivo" },
    );
  }

  b.titulo("Cómo se te paga");
  b.parrafo(
    "El cliente le paga a Caminante. De lo cobrado se retiene la comisión más su IVA, y el resto se te " +
      "transfiere a los 7 días naturales de que regresa la salida, con el desglose de cada liquidación. " +
      "Las comisiones bancarias y de procesamiento las absorbe Caminante: no se te descuentan.",
  );

  b.titulo("Qué te vamos a pedir");
  b.parrafo(
    `Un expediente, y se revisa uno por uno. Son ${GENERALES.length} documentos generales que se entregan ` +
      "una sola vez y sirven para todo, más los propios de cada actividad que quieras ofrecer — porque una " +
      "caminata y un descenso a una caverna no se acreditan igual.",
  );
  const declaradas = d.actividades.filter((a) => ACTIVIDADES.some((c) => c.slug === a));
  if (declaradas.length) {
    b.espacio(4);
    for (const a of declaradas) {
      const n = requisitosDe(a).propios.length;
      b.parrafo(`·  ${nombreDeActividad(a)} — ${n} ${n === 1 ? "documento propio" : "documentos propios"}`, { size: 10 });
    }
    b.parrafo(
      "Cada actividad se aprueba por separado, y lo aprobado ya puede vender aunque las demás sigan a medias.",
      { size: 9.5, color: "olivo" },
    );
  } else {
    b.parrafo(
      "En la llamada definimos cuáles son las tuyas; de ahí sale tu lista exacta.",
      { size: 9.5, color: "olivo" },
    );
  }

  b.titulo("Lee esto y anota tus dudas");
  b.parrafo(
    "La llamada son 30 minutos y rinden mucho más si llegas con las preguntas escritas. Estas son las que " +
      "casi siempre salen; si alguna te falta clara, anótala:",
    { color: "olivo", size: 10 },
  );
  b.espacio(4);
  for (const q of [
    "¿Quién trae a mis clientes, y por lo tanto qué escala me aplica?",
    "¿Qué pasa si una salida se cancela o alguien pide reembolso?",
    "¿Quién factura al viajero, y quién factura la comisión?",
    "¿Cuánto tarda en revisarse mi expediente, y qué pasa mientras tanto?",
    "¿Qué se ve con mi marca y qué se ve con la de Caminante?",
    "¿Cómo salgo si un día ya no quiero estar?",
  ]) b.parrafo(`·  ${q}`, { size: 10 });

  b.espacio(12);
  b.parrafo(
    `Generado el ${fecha(hoy)} · Caminante by NUMAN · uno@numanhub.com`,
    { size: 8.5, color: "olivo" },
  );

  return b.lista;
}
