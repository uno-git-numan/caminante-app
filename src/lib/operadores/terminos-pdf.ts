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
import { terminosDe, type DatosTerminos } from "./terminos";

// El tipo sigue saliendo de aquí para quien ya lo importaba de este archivo.
export type { DatosTerminos };

// La paleta de la marca, la misma de los correos.
const LAGOON = rgb(0.24, 0.28, 0.21);
const OLIVO = rgb(0.47, 0.44, 0.40);
const NARANJA = rgb(1, 0.365, 0.212);
const ARENA = rgb(0.83, 0.81, 0.78);
const CREMA = rgb(0.984, 0.984, 0.968);

const A4: [number, number] = [595.28, 841.89];
const MARGEN = 56;
const ANCHO = A4[0] - MARGEN * 2;





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

  // ⚠️ EL TEXTO NO VIVE AQUÍ: vive en `terminos.ts`, que también alimenta la
  // versión que se lee en Mi alta. Esto sólo lo dibuja, bloque por bloque, con
  // la misma tinta de siempre.
  for (const b of terminosDe(d)) {
    if (b.t === "parrafo") {
      h.parrafo(b.texto, {
        size: b.size,
        interlinea: b.interlinea,
        color: b.color === "olivo" ? OLIVO : b.color === "naranja" ? NARANJA : undefined,
        ...(b.sangria ? { x: MARGEN + 14, ancho: ANCHO - 14 } : {}),
      });
    } else if (b.t === "titulo") h.titulo(b.texto);
    else if (b.t === "aviso") h.aviso(b.titulo, b.cuerpo);
    else if (b.t === "fila") h.fila(b.celdas[0], b.celdas[1], b.celdas[2], { encabezado: b.encabezado });
    else h.y -= b.alto;
  }

  return doc.save();
}
