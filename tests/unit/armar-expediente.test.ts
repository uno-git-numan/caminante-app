// «¿EL EXPEDIENTE ESTÁ COMPLETO?» — una sola respuesta para dos pantallas.
//
// Mi alta decide con ella en qué paso va la operadora, y el Pipeline de numan
// en qué columna la pone. Antes el Pipeline no lo sabía, y ponía en
// «Vendiendo» a quien vendía con dispensa sin un solo documento.
import { describe, expect, it } from "vitest";
import { armarExpediente } from "@/lib/operadores/expediente";
import { pesoEnPalabras } from "@/lib/operadores/peso";
import { GENERALES, generalesPara, requisitosDe } from "@/lib/operadores/actividades";

const doc = (documento: string, actividad: string | null, estado = "aprobado") =>
  ({ actividad, documento, estado, motivo: null, vence_at: null });
const generalesEntregados = GENERALES.map((g) => doc(g.slug, null));
const propiosDe = (act: string, estado = "aprobado") =>
  requisitosDe(act).propios.map((d) => doc(d.slug, act, estado));

describe("armarExpediente", () => {
  it("EL CASO NOMÁDIKA: sin actividades y sin documentos ⇒ vacío, no completo", () => {
    const e = armarExpediente([], []);
    expect(e.vacio).toBe(true);
    expect(e.completo).toBe(false);
  });

  it("EL CASO KÉNTRO: senderismo declarado, cero documentos ⇒ no completo, y cuenta lo que falta", () => {
    const e = armarExpediente([{ actividad: "senderismo", estado: "incompleta", motivo: null }], [], undefined, "fisica");
    expect(e.completo).toBe(false);
    const obligatorios = generalesPara("fisica").filter((d) => !d.opcional).length;
    expect(e.faltanTotal).toBe(obligatorios + requisitosDe("senderismo").propios.length);
  });

  it("todo entregado pero la actividad sin aprobar ⇒ no completo (está en revisión)", () => {
    const e = armarExpediente(
      [{ actividad: "senderismo", estado: "en_revision", motivo: null }],
      [...generalesEntregados, ...propiosDe("senderismo", "en_revision")],
      undefined,
      "fisica",
    );
    expect(e.faltanTotal).toBe(0);
    expect(e.completo).toBe(false);
  });

  it("todo entregado y la actividad aprobada ⇒ completo", () => {
    const e = armarExpediente(
      [{ actividad: "senderismo", estado: "aprobada", motivo: null }],
      [...generalesEntregados, ...propiosDe("senderismo")],
      undefined,
      "moral",
    );
    expect(e.completo).toBe(true);
  });

  it("sin decir si es física o moral el expediente no cierra, aunque todo esté entregado", () => {
    const e = armarExpediente(
      [{ actividad: "senderismo", estado: "aprobada", motivo: null }],
      [...generalesEntregados, ...propiosDe("senderismo")],
    );
    expect(e.faltanTotal).toBe(0);
    expect(e.completo).toBe(false);
  });

  it("LUIS, 9 NOV: a una persona física no se le enseña el acta; a una moral sí, y es opcional", () => {
    const fisica = armarExpediente([], [], undefined, "fisica");
    expect(fisica.generales.some((d) => d.slug === "acta-constitutiva")).toBe(false);
    const moral = armarExpediente([], [], undefined, "moral");
    const acta = moral.generales.find((d) => d.slug === "acta-constitutiva")!;
    expect(acta.opcional).toBe(true);
    // Lo opcional sin subir no cuenta como faltante.
    const obligatorios = generalesPara("moral").filter((d) => !d.opcional).length;
    expect(moral.faltanGenerales).toBe(obligatorios);
  });

  it("todo entregado MENOS lo opcional ⇒ completo", () => {
    const sinOpcionales = GENERALES.filter((g) => !g.opcional).map((g) => doc(g.slug, null));
    const e = armarExpediente(
      [{ actividad: "senderismo", estado: "aprobada", motivo: null }],
      [...sinOpcionales, ...propiosDe("senderismo")],
      undefined,
      "moral",
    );
    expect(e.completo).toBe(true);
  });

  it("la identificación pide su vigencia por AÑO y se llama según quién firma", () => {
    const moral = armarExpediente([], [], undefined, "moral");
    const id = moral.generales.find((d) => d.slug === "id-responsable")!;
    expect(id.vencePorAnio).toBe(true);
    expect(id.nombre).toMatch(/representante legal/);
    const csf = moral.generales.find((d) => d.slug === "csf")!;
    expect(csf.caduca).toBe(false);
  });

  it("lo que Luis quitó ya no se pide: primeros auxilios, protocolo, botiquín, bitácora", () => {
    const slugs = GENERALES.map((g) => g.slug);
    for (const fuera of ["primeros-auxilios", "protocolo-emergencia", "botiquin", "bitacora-incidentes"]) {
      expect(slugs).not.toContain(fuera);
    }
  });

  it("un documento rechazado reabre el expediente", () => {
    const [primero, ...resto] = generalesEntregados;
    const e = armarExpediente(
      [{ actividad: "senderismo", estado: "aprobada", motivo: null }],
      [{ ...primero, estado: "rechazado" }, ...resto, ...propiosDe("senderismo")],
      undefined,
      "fisica",
    );
    expect(e.completo).toBe(false);
  });
});

describe("el archivo en el renglón (lámina «Panel Operadora»)", () => {
  it("nombre guardado, peso del bucket y fecha de subida viajan al renglón; sin fila, todo null", () => {
    const tamanos = new Map([["abc.pdf", 348_160]]);
    const e = armarExpediente(
      [],
      [{ ...doc("rnt", null, "en_revision"), id: "d1", archivo_path: "op-1/abc.pdf", archivo_nombre: "RNT 2026.pdf", subido_at: "2026-09-24T10:00:00Z" }],
      tamanos,
    );
    const rnt = e.generales.find((d) => d.slug === "rnt")!;
    expect(rnt.id).toBe("d1");
    expect(rnt.archivoNombre).toBe("RNT 2026.pdf");
    expect(rnt.archivoBytes).toBe(348_160);
    expect(rnt.subidoAt).toBe("2026-09-24T10:00:00Z");
    const otro = e.generales.find((d) => d.slug !== "rnt")!;
    expect(otro.id).toBeNull();
    expect(otro.archivoNombre).toBeNull();
  });

  it("sin nombre guardado (filas viejas) enseña el de la ruta; sin peso en el bucket, null", () => {
    const e = armarExpediente([], [{ ...doc("rnt", null, "aprobado"), id: "d1", archivo_path: "op-1/abc.pdf" }]);
    const rnt = e.generales.find((d) => d.slug === "rnt")!;
    expect(rnt.archivoNombre).toBe("abc.pdf");
    expect(rnt.archivoBytes).toBeNull();
  });

  it("pesoEnPalabras: KB redondeados (mínimo 1), MB con una decimal y coma", () => {
    expect(pesoEnPalabras(348_160)).toBe("340 KB");
    expect(pesoEnPalabras(10)).toBe("1 KB");
    expect(pesoEnPalabras(1_258_291)).toBe("1,2 MB");
  });
});
