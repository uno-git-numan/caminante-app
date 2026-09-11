import "server-only";

// EL RESUMEN DE TÉRMINOS QUE VIAJA CON LA INVITACIÓN A LA LLAMADA.
//
// Media hora de videollamada no alcanza para explicar una tabla de comisiones
// por tramos, un expediente por actividad y una mecánica de liquidación. Y
// explicarlas en vivo tiene un defecto peor: quien escucha no puede releer, así
// que asiente y se entera después. Este PDF llega ANTES, con su nombre y sus
// números, para que la llamada sea de dudas y no de dictado.
//
// ⚠️ NO ES EL CONVENIO Y LO DICE EN LA PRIMERA PLANA. El convenio es otro
// documento, todavía en revisión legal, y se firma en el panel. Si este resumen
// se leyera como contrato, alguien podría argumentar que se obligó con él —y lo
// que dice está simplificado a propósito—. La advertencia va arriba, no en un
// pie de página.
//
// ⚠️ NINGÚN NÚMERO SE ESCRIBE AQUÍ. Las tasas salen de `comision.ts`, los
// documentos de `actividades.ts` y el plazo de pago del convenio. Un PDF con
// una tasa tecleada a mano sería la cuarta copia de la comisión, y ya hubo tres
// columnas duplicadas que la 0037 tuvo que borrar.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { IVA, MINIMO_POR_RESERVA, TOPE, comisionPara, pesos, tablaDeComisiones } from "./comision";
import { ACTIVIDADES, GENERALES, nombreDeActividad, requisitosDe } from "./actividades";

// La paleta de la marca, la misma de los correos.
const LAGOON = rgb(0.24, 0.28, 0.21);
const OLIVO = rgb(0.47, 0.44, 0.40);
const NARANJA = rgb(1, 0.365, 0.212);
const ARENA = rgb(0.83, 0.81, 0.78);
const CREMA = rgb(0.984, 0.984, 0.968);

const A4: [number, number] = [595.28, 841.89];
const MARGEN = 56;
const ANCHO = A4[0] - MARGEN * 2;

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

/** Escritor secuencial: lleva el cursor y salta de página cuando se acaba. */
class Hoja {
  y = A4[1] - MARGEN;
  pagina: PDFPage;
  private doc: PDFDocument;
  private reg: PDFFont;
  private neg: PDFFont;
  private mono: PDFFont;
  constructor(doc: PDFDocument, reg: PDFFont, neg: PDFFont, mono: PDFFont) {
    this.doc = doc;
    this.reg = reg;
    this.neg = neg;
    this.mono = mono;
    this.pagina = doc.addPage(A4);
  }
  espacio(alto: number) {
    if (this.y - alto < MARGEN + 24) {
      this.pagina = this.doc.addPage(A4);
      this.y = A4[1] - MARGEN;
    }
  }
  /**
   * Parte el texto a mano: pdf-lib no envuelve y un renglón largo se sale.
   *
   * Separado del dibujo A PROPÓSITO: `aviso` necesita saber cuántos renglones
   * van a salir ANTES de dibujar su recuadro. Con la altura a ojo, el recuadro
   * cortaba la última línea por la mitad — y lo hacía justo en el aviso que
   * dice «esto no es el convenio», que es el que no se puede leer a medias.
   */
  private envolver(txt: string, size: number, font: PDFFont, ancho: number): string[] {
    const lineas: string[] = [];
    let linea = "";
    for (const palabra of txt.split(" ")) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (font.widthOfTextAtSize(prueba, size) > ancho && linea) {
        lineas.push(linea);
        linea = palabra;
      } else linea = prueba;
    }
    if (linea) lineas.push(linea);
    return lineas;
  }
  parrafo(txt: string, o: { size?: number; font?: PDFFont; color?: typeof LAGOON; x?: number; ancho?: number; interlinea?: number } = {}) {
    const size = o.size ?? 10.5;
    const font = o.font ?? this.reg;
    const x = o.x ?? MARGEN;
    const alto = o.interlinea ?? size * 1.55;
    for (const linea of this.envolver(txt, size, font, o.ancho ?? ANCHO)) {
      this.espacio(alto);
      this.pagina.drawText(linea, { x, y: this.y, size, font, color: o.color ?? LAGOON });
      this.y -= alto;
    }
  }
  titulo(txt: string) {
    this.y -= 14;
    this.espacio(24);
    this.pagina.drawText(txt.toUpperCase(), { x: MARGEN, y: this.y, size: 8.5, font: this.neg, color: NARANJA });
    this.y -= 6;
    this.pagina.drawLine({
      start: { x: MARGEN, y: this.y }, end: { x: MARGEN + ANCHO, y: this.y },
      thickness: 0.7, color: ARENA,
    });
    this.y -= 14;
  }
  /** Un renglón de tabla: etiqueta a la izquierda, dos columnas de números. */
  fila(etiqueta: string, a: string, b: string, o: { encabezado?: boolean } = {}) {
    const size = o.encabezado ? 8.5 : 10;
    const color = o.encabezado ? OLIVO : LAGOON;
    this.espacio(17);
    this.pagina.drawText(etiqueta, { x: MARGEN, y: this.y, size, font: this.reg, color });
    // Los números van en mono para que las columnas se alineen a la vista; el
    // encabezado NO, porque no es un número y en mono se lee como código.
    const f = o.encabezado ? this.reg : this.mono;
    this.pagina.drawText(a, { x: MARGEN + 300, y: this.y, size, font: f, color });
    this.pagina.drawText(b, { x: MARGEN + 400, y: this.y, size, font: f, color });
    this.y -= o.encabezado ? 14 : 17;
  }
  aviso(titulo: string, cuerpo: string) {
    const anchoTexto = ANCHO - 28;
    const lineasT = this.envolver(titulo, 10.5, this.reg, anchoTexto);
    const lineasC = this.envolver(cuerpo, 9.5, this.reg, anchoTexto);
    // 14 arriba + 12 abajo de aire. Medido, no a ojo.
    const alto = 14 + lineasT.length * 16 + lineasC.length * 14.7 + 12;
    // Si no cabe entero, se va completo a la siguiente hoja: un recuadro partido
    // entre dos páginas se lee como dos avisos distintos.
    if (this.y - alto < MARGEN + 24) {
      this.pagina = this.doc.addPage(A4);
      this.y = A4[1] - MARGEN;
    }
    this.pagina.drawRectangle({
      x: MARGEN, y: this.y - alto, width: ANCHO, height: alto,
      color: CREMA, borderColor: ARENA, borderWidth: 0.8,
    });
    this.y -= 14;
    for (const l of lineasT) {
      this.pagina.drawText(l, { x: MARGEN + 14, y: this.y, size: 10.5, font: this.reg, color: LAGOON });
      this.y -= 16;
    }
    for (const l of lineasC) {
      this.pagina.drawText(l, { x: MARGEN + 14, y: this.y, size: 9.5, font: this.reg, color: OLIVO });
      this.y -= 14.7;
    }
    this.y -= 12 + 16;
  }
}

export async function pdfDeTerminos(d: DatosTerminos): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const dir = path.join(process.cwd(), "public/landing/assets/fonts");
  const [reg, mono] = await Promise.all([
    readFile(path.join(dir, "Geist-VariableFont_wght.ttf")),
    readFile(path.join(dir, "GeistMono-VariableFont_wght.ttf")),
  ]);
  // Una sola Geist variable: pdf-lib embebe su instancia por defecto, así que
  // «negrita» aquí es la misma cara. Se distingue por tamaño y color, que es
  // como el sistema distingue jerarquías en pantalla de todos modos.
  const fReg = await doc.embedFont(reg, { subset: true });
  const fMono = await doc.embedFont(mono, { subset: true });
  const h = new Hoja(doc, fReg, fReg, fMono);

  const quien = (d.operadora || d.responsable || "").trim();

  h.parrafo("CAMINANTE · OPERADORES", { size: 8.5, color: OLIVO });
  h.y -= 8;
  h.parrafo("Resumen de términos", { size: 26, interlinea: 30 });
  h.parrafo(
    d.llamada ? `Para tu llamada del ${fecha(d.llamada)}` : "Para tu llamada",
    { size: 13, color: NARANJA },
  );
  if (quien) h.parrafo(quien, { size: 11, color: OLIVO });
  h.y -= 10;

  h.aviso(
    "Esto no es el convenio.",
    "Es un resumen para que llegues a la llamada sabiendo de qué vamos a hablar. El convenio es otro " +
      "documento, más largo y más preciso, y se firma después en tu panel. Si algo de aquí y algo de allá " +
      "se contradicen, manda el convenio.",
  );

  h.titulo("Qué es Caminante y qué no");
  h.parrafo(
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
  h.titulo("Lo que la plataforma hace por ti");
  h.parrafo(
    "No es una página con un botón de pagar. Es la operación completa de una salida, desde que alguien " +
      "la ve hasta que regresa y te deja un testimonio.",
    { color: OLIVO, size: 10 },
  );
  h.y -= 6;
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
    h.parrafo(titulo, { size: 11 });
    h.parrafo(detalle, { size: 9.5, color: OLIVO, x: MARGEN + 14, ancho: ANCHO - 14 });
    h.y -= 3;
  }
  h.parrafo(
    "Todo esto ya está funcionando hoy, no es un plan. Lo que todavía estamos construyendo te lo decimos " +
      "en la llamada, sin adornos — y ahí es donde queremos tus preguntas.",
    { size: 9.5, color: OLIVO },
  );

  h.titulo("La comisión");
  h.parrafo(
    "Se calcula por tramos sobre el precio de cada boleto, sin IVA, y no es una tasa plana: cada pedazo del " +
      "precio paga su tasa. Hay dos escalas, y lo que las separa es quién trajo al cliente.",
    { color: OLIVO, size: 10 },
  );
  h.y -= 6;
  h.fila("Tramo del precio por persona", "Te lo traemos", "Lo traes tú", { encabezado: true });
  // ⚠️ `tablaDeComisiones()` y no `tramosPara()`: la segunda fusiona los tramos
  // de tasa igual y una tabla de dos columnas armada con eso sale con huecos.
  for (const t of tablaDeComisiones()) {
    h.fila(
      t.hasta ? `De ${miles(t.desde)} a ${miles(t.hasta)}` : `De ${miles(t.desde)} en adelante`,
      `${Math.round(t.venta * 100)}%`,
      `${Math.round(t.plataforma * 100)}%`,
    );
  }
  h.y -= 6;
  h.parrafo(
    `Todos los montos en pesos mexicanos. Mínimo ${pesos(MINIMO_POR_RESERVA)} por reserva, y nunca más del ${Math.round(TOPE * 100)}% de lo cobrado — ` +
      `el mínimo no puede volverse una tasa alta en una venta chica. Más IVA (${Math.round(IVA * 100)}%) sobre la comisión.`,
    { size: 9.5, color: OLIVO },
  );

  const banda = bandaDe(d.rangoPrecio);
  if (banda) {
    h.titulo("Tu caso, con los números que nos diste");
    h.parrafo(`Declaraste un rango de ${d.rangoPrecio}. Con esa banda:`, { size: 10, color: OLIVO });
    h.y -= 4;
    h.fila("Precio del boleto", "Te lo traemos", "Lo traes tú", { encabezado: true });
    for (const precio of banda) {
      const cv = comisionPara(precio, "venta");
      const cp = comisionPara(precio, "plataforma");
      h.fila(
        `Si cobras ${miles(precio)}, te quedan`,
        miles(precio - cv.monto),
        miles(precio - cp.monto),
      );
    }
    h.parrafo(
      "Sobre el precio sin IVA y antes de tus propios costos. La comisión efectiva baja conforme sube el " +
        "boleto, porque los tramos de arriba pagan menos.",
      { size: 9.5, color: OLIVO },
    );
  }

  h.titulo("Cómo se te paga");
  h.parrafo(
    "El cliente le paga a Caminante. De lo cobrado se retiene la comisión más su IVA, y el resto se te " +
      "transfiere a los 7 días naturales de que regresa la salida, con el desglose de cada liquidación. " +
      "Las comisiones bancarias y de procesamiento las absorbe Caminante: no se te descuentan.",
  );

  h.titulo("Qué te vamos a pedir");
  h.parrafo(
    `Un expediente, y se revisa uno por uno. Son ${GENERALES.length} documentos generales que se entregan ` +
      "una sola vez y sirven para todo, más los propios de cada actividad que quieras ofrecer — porque una " +
      "caminata y un descenso a una caverna no se acreditan igual.",
  );
  const declaradas = d.actividades.filter((a) => ACTIVIDADES.some((c) => c.slug === a));
  if (declaradas.length) {
    h.y -= 4;
    for (const a of declaradas) {
      const n = requisitosDe(a).propios.length;
      h.parrafo(`·  ${nombreDeActividad(a)} — ${n} ${n === 1 ? "documento propio" : "documentos propios"}`, { size: 10 });
    }
    h.parrafo(
      "Cada actividad se aprueba por separado, y lo aprobado ya puede vender aunque las demás sigan a medias.",
      { size: 9.5, color: OLIVO },
    );
  } else {
    h.parrafo(
      "En la llamada definimos cuáles son las tuyas; de ahí sale tu lista exacta.",
      { size: 9.5, color: OLIVO },
    );
  }

  h.titulo("Lee esto y anota tus dudas");
  h.parrafo(
    "La llamada son 30 minutos y rinden mucho más si llegas con las preguntas escritas. Estas son las que " +
      "casi siempre salen; si alguna te falta clara, anótala:",
    { color: OLIVO, size: 10 },
  );
  h.y -= 4;
  for (const q of [
    "¿Quién trae a mis clientes, y por lo tanto qué escala me aplica?",
    "¿Qué pasa si una salida se cancela o alguien pide reembolso?",
    "¿Quién factura al viajero, y quién factura la comisión?",
    "¿Cuánto tarda en revisarse mi expediente, y qué pasa mientras tanto?",
    "¿Qué se ve con mi marca y qué se ve con la de Caminante?",
    "¿Cómo salgo si un día ya no quiero estar?",
  ]) h.parrafo(`·  ${q}`, { size: 10 });

  h.y -= 12;
  h.parrafo(
    `Generado el ${fecha(new Date())} · Caminante by NUMAN · uno@numanhub.com`,
    { size: 8.5, color: OLIVO },
  );

  return doc.save();
}
