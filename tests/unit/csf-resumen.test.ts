// LA LÍNEA QUE SE LE DICE A UNA PERSONA SOBRE SU CSF (csf.ts).
// El SAT pesa más que la vista de la IA; lo viejo se avisa, no se castiga.
import { describe, expect, it } from "vitest";
import { DIAS_RECIENTE, resumenCsf, urlValidadorSat, type AnalisisCsf } from "@/lib/operadores/csf";

const base: AnalisisCsf = {
  v: 1, at: "2026-11-09T00:00:00Z", esConstancia: true, rfc: "ROBL990531HI3", nombre: "X",
  fechaEmision: "2026-11-01", codigoPostal: "06700", regimenes: ["612"], estatus: "ACTIVO",
  alertas: [], sat: "validada", satUrl: "u", coincideRfc: true, diasDeAntiguedad: 8,
};

describe("resumenCsf", () => {
  it("confirmada con el SAT, reciente y con su RFC ⇒ ok", () => {
    const r = resumenCsf(base);
    expect(r.tono).toBe("ok");
    expect(r.texto).toMatch(/confirmada con el SAT/);
    expect(r.texto).toMatch(/1 de noviembre de 2026/);
  });
  it("el SAT no la reconoce ⇒ mal, diga lo que diga la lectura", () => {
    expect(resumenCsf({ ...base, sat: "no_emitida" }).tono).toBe("mal");
  });
  it("vieja de más ⇒ aviso para bajar una reciente", () => {
    const r = resumenCsf({ ...base, diasDeAntiguedad: DIAS_RECIENTE + 60 });
    expect(r.tono).toBe("aviso");
    expect(r.texto).toMatch(/reciente/);
  });
  it("RFC distinto al capturado ⇒ aviso", () => {
    expect(resumenCsf({ ...base, coincideRfc: false }).texto).toMatch(/no es el que capturaste/);
  });
  it("la liga del validador es la del QR: idCIF_RFC", () => {
    expect(urlValidadorSat("123", "ABC")).toMatch(/validadorqr\.jsf\?D1=10&D2=1&D3=123_ABC$/);
  });
});
