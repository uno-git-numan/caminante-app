// «¿EL EXPEDIENTE ALCANZA PARA VENDER?» — una sola respuesta para dos pantallas.
//
// Mi alta decide con ella en qué paso va la operadora, y el Pipeline de numan
// en qué columna la pone.
//
// TRES MOMENTOS (convenio v3.5, Anexo B; 23 nov 2026): `completo` y
// `faltanTotal` hablan del expediente de ARRANQUE —constancia fiscal e
// identificación—, que es lo que detiene la venta. Pólizas, credencial del
// guía y permisos van en `paraSalir`; el registro de turismo en `rnt`; lo que
// sólo se declara no se pide. `todoEntregado` es lo que antes era `completo`.
import { describe, expect, it } from "vitest";
import { armarExpediente } from "@/lib/operadores/expediente";
import { pesoEnPalabras } from "@/lib/operadores/peso";
import { ACTIVIDADES, GENERALES, generalesPara, momentoDeGeneral, momentoDePropio, requisitosDe } from "@/lib/operadores/actividades";

const doc = (documento: string, actividad: string | null, estado = "aprobado") =>
  ({ actividad, documento, estado, motivo: null, vence_at: null });
const generalesEntregados = GENERALES.map((g) => doc(g.slug, null));
const deArranque = ["csf", "id-responsable"].map((g) => doc(g, null));
const propiosDe = (act: string, estado = "aprobado") =>
  requisitosDe(act).propios.map((d) => doc(d.slug, act, estado));

describe("los tres momentos del catálogo", () => {
  it("para vender: constancia e identificación; antes de salir: la póliza de responsabilidad civil; en 30 días: el registro de turismo", () => {
    expect(momentoDeGeneral("csf")).toBe("arranque");
    expect(momentoDeGeneral("id-responsable")).toBe("arranque");
    expect(momentoDeGeneral("poliza-rc")).toBe("salida");
    // La de accidentes salió del catálogo el 24 nov 2026: ya no tiene momento
    // propio y cae en el de omisión, sin contarse en ningún lado.
    expect(generalesPara("fisica").map((d) => d.slug)).not.toContain("poliza-gm");
    expect(momentoDeGeneral("rnt")).toBe("treinta-dias");
  });

  it("de lo propio se ENTREGAN la credencial del guía y los permisos; planes y bitácoras se declaran", () => {
    expect(momentoDePropio("nom09-senderismo")).toBe("salida");
    expect(momentoDePropio("permiso-anp")).toBe("salida");
    expect(momentoDePropio("permiso-ejido")).toBe("salida");
    expect(momentoDePropio("bitacora-epp")).toBe("declarado");
    expect(momentoDePropio("plan-aclimatacion")).toBe("declarado");
    expect(momentoDePropio("ratio-guias")).toBe("declarado");
  });

  it("toda actividad pide entregar al menos la credencial o licencia de quien conduce, y nada queda sin clasificar", () => {
    for (const a of ACTIVIDADES) {
      const r = requisitosDe(a.slug);
      expect(r.propios.length, a.slug).toBeGreaterThan(0);
      expect(r.propios.length + r.declarados.length, a.slug).toBe(a.documentos.length);
    }
  });
});

describe("armarExpediente", () => {
  it("EL CASO NOMÁDIKA: sin actividades y sin documentos ⇒ vacío, no completo", () => {
    const e = armarExpediente([], []);
    expect(e.vacio).toBe(true);
    expect(e.completo).toBe(false);
  });

  it("EL CASO KÉNTRO: senderismo declarado, cero documentos ⇒ no alcanza para vender, y faltan DOS", () => {
    const e = armarExpediente([{ actividad: "senderismo", estado: "incompleta", motivo: null }], [], undefined, "fisica");
    expect(e.completo).toBe(false);
    // Para vender: constancia e identificación. Nada más.
    expect(e.faltanTotal).toBe(2);
    // Antes de salir: la póliza de responsabilidad civil y lo propio de senderismo.
    expect(e.paraSalir.faltan).toBe(1 + requisitosDe("senderismo").propios.length);
    expect(e.rnt?.estado).toBe("falta");
  });

  it("con constancia e identificación aprobadas YA alcanza para vender, sin póliza ni credencial", () => {
    const e = armarExpediente([{ actividad: "senderismo", estado: "incompleta", motivo: null }], deArranque, undefined, "fisica");
    expect(e.completo).toBe(true);
    expect(e.faltanTotal).toBe(0);
    expect(e.todoEntregado).toBe(false);
    expect(e.paraSalir.docs.map((d) => d.slug).sort()).toEqual(["nom09-senderismo", "poliza-rc"]);
  });

  it("arranque entregado pero sin aprobar ⇒ no falta nada por subir, y todavía no alcanza (está en revisión)", () => {
    const e = armarExpediente(
      [{ actividad: "senderismo", estado: "en_revision", motivo: null }],
      deArranque.map((d) => ({ ...d, estado: "en_revision" })),
      undefined,
      "fisica",
    );
    expect(e.faltanTotal).toBe(0);
    expect(e.completo).toBe(false);
  });

  it("todo entregado y la actividad aprobada ⇒ completo y todoEntregado", () => {
    const e = armarExpediente(
      [{ actividad: "senderismo", estado: "aprobada", motivo: null }],
      [...generalesEntregados, ...propiosDe("senderismo")],
      undefined,
      "moral",
    );
    expect(e.completo).toBe(true);
    expect(e.todoEntregado).toBe(true);
    expect(e.paraSalir.faltan).toBe(0);
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
    // Lo opcional sin subir no cuenta como faltante; para vender faltan los dos de arranque.
    expect(moral.faltanGenerales).toBe(2);
    // Cuatro generales obligatorios, repartidos en sus momentos (eran cinco
    // hasta que salió la póliza de accidentes, el 24 nov 2026).
    expect(generalesPara("moral").filter((d) => !d.opcional)).toHaveLength(4);
  });

  it("una identificación vencida no cuenta como entregada: no alcanza para vender", () => {
    const e = armarExpediente(
      [],
      [doc("csf", null), { ...doc("id-responsable", null), vence_at: "2020-12-31" }],
      undefined,
      "fisica",
    );
    expect(e.completo).toBe(false);
  });

  it("una póliza vencida no detiene la venta, pero sí cuenta entre lo que falta para salir", () => {
    const e = armarExpediente(
      [{ actividad: "senderismo", estado: "aprobada", motivo: null }],
      [...deArranque, { ...doc("poliza-rc", null), vence_at: "2020-01-01" }, ...propiosDe("senderismo")],
      undefined,
      "fisica",
    );
    expect(e.completo).toBe(true);
    expect(e.paraSalir.docs.map((d) => d.slug)).toEqual(["poliza-rc"]);
  });

  it("lo que sólo se declara no se pide: va en `declarados`, no en `propios`", () => {
    const e = armarExpediente([{ actividad: "alta-montana", estado: "incompleta", motivo: null }], [], undefined, "fisica");
    const a = e.actividades[0];
    expect(a.propios.map((d) => d.slug)).toContain("rescate-montana");
    expect(a.propios.map((d) => d.slug)).not.toContain("plan-aclimatacion");
    expect(a.declarados.map((d) => d.slug)).toContain("plan-aclimatacion");
    expect(a.faltan).toBe(a.propios.length);
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

  it("la constancia rechazada reabre el arranque; una póliza rechazada, sólo lo de salir", () => {
    const con = (slug: string) =>
      armarExpediente(
        [{ actividad: "senderismo", estado: "aprobada", motivo: null }],
        [...generalesEntregados.map((d) => (d.documento === slug ? { ...d, estado: "rechazado" } : d)), ...propiosDe("senderismo")],
        undefined,
        "fisica",
      );
    expect(con("csf").completo).toBe(false);
    expect(con("poliza-rc").completo).toBe(true);
    expect(con("poliza-rc").paraSalir.faltan).toBe(1);
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
