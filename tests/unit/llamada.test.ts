// ¿ESTA SOLICITUD NECESITA LLAMADA? (Luis, 23 nov 2026: «Si la antigüedad es
// de menos de 1 año, hay que agendar llamada forzoso.»)
import { afterEach, describe, expect, it } from "vitest";
import { llamadaObligatoria, llamadaObligatoriaPara } from "@/lib/operadores/llamada";
import { MIN_DESCRIPCION } from "@/lib/operadores/solicitud-opciones";

const original = process.env.ALTA_LLAMADA;
afterEach(() => {
  if (original === undefined) delete process.env.ALTA_LLAMADA;
  else process.env.ALTA_LLAMADA = original;
});

describe("la llamada", () => {
  it("por omisión es obligatoria para todas", () => {
    delete process.env.ALTA_LLAMADA;
    expect(llamadaObligatoria()).toBe(true);
    expect(llamadaObligatoriaPara({ antiguedad: "3-10" })).toBe(true);
  });

  it("con el interruptor en «opcional», quien lleva un año o más entra sola", () => {
    process.env.ALTA_LLAMADA = "opcional";
    for (const a of ["1-3", "3-10", "mas-10"]) expect(llamadaObligatoriaPara({ antiguedad: a })).toBe(false);
  });

  it("con menos de un año la llamada es forzosa SIEMPRE, aunque el interruptor diga opcional", () => {
    process.env.ALTA_LLAMADA = "opcional";
    expect(llamadaObligatoriaPara({ antiguedad: "menos-1" })).toBe(true);
  });

  it("la descripción de las experiencias pide al menos 140 caracteres", () => {
    expect(MIN_DESCRIPCION).toBe(140);
  });
});
