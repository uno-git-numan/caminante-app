// LA REVISIÓN AUTOMÁTICA (revision-ia.ts). Luis, 9 nov 2026: se aprueba solo
// lo que la IA confirma limpio; la casa revisa lo dudoso. Nunca se rechaza
// solo. Estas pruebas fijan qué cuenta como «limpio».
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: () => ({}) }));
vi.mock("@/lib/operadores/emails", () => ({ emailActividadAprobada: async () => true }));

import { resumenRevision, veredicto, type RevisionIa } from "@/lib/operadores/revision-ia";

const limpio = {
  esLoQueSePide: true,
  legible: true,
  titular: "NOMADIKA",
  coincideTitular: true,
  venceAt: "2027-03-03",
  alertas: [],
  resumen: "Póliza de RC vigente al 3 de marzo de 2027",
};
const ctx = { caduca: true, venceEscrita: null, hoy: "2026-11-09", pideTitular: true };

describe("veredicto", () => {
  it("todo limpio y vigente ⇒ se aprueba solo", () => {
    expect(veredicto(limpio, ctx)).toEqual({ veredicto: "aprobado", razones: [] });
  });
  it("no es lo que se pide ⇒ dudoso", () => {
    expect(veredicto({ ...limpio, esLoQueSePide: false }, ctx).veredicto).toBe("dudoso");
  });
  it("sin poder decir si es lo que se pide (null) ⇒ dudoso: la duda no aprueba", () => {
    expect(veredicto({ ...limpio, esLoQueSePide: null }, ctx).veredicto).toBe("dudoso");
  });
  it("a nombre de otra persona ⇒ dudoso, y dice de quién", () => {
    const r = veredicto({ ...limpio, coincideTitular: false, titular: "OTRA SA" }, ctx);
    expect(r.veredicto).toBe("dudoso");
    expect(r.razones.join(" ")).toMatch(/OTRA SA/);
  });
  it("cualquier señal de alteración ⇒ dudoso", () => {
    expect(veredicto({ ...limpio, alertas: ["Tipografía distinta en la fecha"] }, ctx).veredicto).toBe("dudoso");
  });
  it("vencido ⇒ dudoso", () => {
    expect(veredicto({ ...limpio, venceAt: "2026-01-01" }, ctx).razones).toContain("Ya está vencido.");
  });
  // LA PÓLIZA (D31, 24 nov 2026): con base en ella se le dice al cliente que
  // la salida va asegurada, así que sola sólo se aprueba con sus dos coberturas.
  describe("la póliza de responsabilidad civil con gastos médicos", () => {
    const poliza = { ...ctx, esPoliza: true };
    it("con gastos médicos de los participantes y la actividad cubierta ⇒ se aprueba sola", () => {
      expect(veredicto({ ...limpio, cubreGastosMedicos: true, cubreActividad: true }, poliza).veredicto).toBe("aprobado");
    });
    it("sólo daños a terceros ⇒ dudoso, y lo dice", () => {
      const r = veredicto({ ...limpio, cubreGastosMedicos: false, cubreActividad: true }, poliza);
      expect(r.veredicto).toBe("dudoso");
      expect(r.razones.join(" ")).toMatch(/gastos médicos/);
    });
    it("si no se alcanza a ver la cobertura (null) ⇒ dudoso: la duda no aprueba", () => {
      expect(veredicto({ ...limpio, cubreGastosMedicos: null, cubreActividad: true }, poliza).veredicto).toBe("dudoso");
      expect(veredicto({ ...limpio, cubreActividad: true }, poliza).veredicto).toBe("dudoso");
    });
    it("no cubre la actividad ⇒ dudoso", () => {
      const r = veredicto({ ...limpio, cubreGastosMedicos: true, cubreActividad: false }, poliza);
      expect(r.razones.join(" ")).toMatch(/actividades/);
    });
    it("a los demás documentos no se les pide: sin esas respuestas siguen aprobándose", () => {
      expect(veredicto(limpio, ctx).veredicto).toBe("aprobado");
    });
  });

  it("caduca y no se leyó la fecha ⇒ dudoso", () => {
    expect(veredicto({ ...limpio, venceAt: null }, ctx).razones).toContain("No se leyó la fecha de vencimiento.");
  });
  it("la fecha escrita y la del documento no coinciden ⇒ dudoso", () => {
    expect(veredicto(limpio, { ...ctx, venceEscrita: "2028-01-01" }).veredicto).toBe("dudoso");
  });
  it("un documento que no va a nombre de nadie no exige titular", () => {
    const r = veredicto({ ...limpio, coincideTitular: null, titular: null }, { ...ctx, pideTitular: false });
    expect(r.veredicto).toBe("aprobado");
  });
  it("un documento que no caduca no exige fecha", () => {
    expect(veredicto({ ...limpio, venceAt: null }, { ...ctx, caduca: false }).veredicto).toBe("aprobado");
  });
});

describe("resumenRevision", () => {
  const base: RevisionIa = { v: 1, tipo: "revision", at: "x", ...limpio, veredicto: "aprobado", razones: [] };
  it("aprobado solo ⇒ lo dice", () => {
    expect(resumenRevision(base, "aprobado")).toEqual({ tono: "ok", texto: `Leído y aprobado solo: ${limpio.resumen}` });
  });
  it("dudoso ⇒ dice por qué lo mira una persona", () => {
    const r = resumenRevision({ ...base, veredicto: "dudoso", razones: ["Ya está vencido."] }, "en_revision");
    expect(r.tono).toBe("aviso");
    expect(r.texto).toMatch(/Ya está vencido/);
  });
});
