// «¿EL EXPEDIENTE ESTÁ COMPLETO?» — una sola respuesta para dos pantallas.
//
// Mi alta decide con ella en qué paso va la operadora, y el Pipeline de numan
// en qué columna la pone. Antes el Pipeline no lo sabía, y ponía en
// «Vendiendo» a quien vendía con dispensa sin un solo documento.
import { describe, expect, it } from "vitest";
import { armarExpediente } from "@/lib/operadores/expediente";
import { GENERALES, requisitosDe } from "@/lib/operadores/actividades";

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
    const e = armarExpediente([{ actividad: "senderismo", estado: "incompleta", motivo: null }], []);
    expect(e.completo).toBe(false);
    expect(e.faltanTotal).toBe(GENERALES.length + requisitosDe("senderismo").propios.length);
  });

  it("todo entregado pero la actividad sin aprobar ⇒ no completo (está en revisión)", () => {
    const e = armarExpediente(
      [{ actividad: "senderismo", estado: "en_revision", motivo: null }],
      [...generalesEntregados, ...propiosDe("senderismo", "en_revision")],
    );
    expect(e.faltanTotal).toBe(0);
    expect(e.completo).toBe(false);
  });

  it("todo entregado y la actividad aprobada ⇒ completo", () => {
    const e = armarExpediente(
      [{ actividad: "senderismo", estado: "aprobada", motivo: null }],
      [...generalesEntregados, ...propiosDe("senderismo")],
    );
    expect(e.completo).toBe(true);
  });

  it("un documento rechazado reabre el expediente", () => {
    const [primero, ...resto] = generalesEntregados;
    const e = armarExpediente(
      [{ actividad: "senderismo", estado: "aprobada", motivo: null }],
      [{ ...primero, estado: "rechazado" }, ...resto, ...propiosDe("senderismo")],
    );
    expect(e.completo).toBe(false);
  });
});
