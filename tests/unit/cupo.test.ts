// EL CUPO TIENE UN SOLO HOGAR — y estas pruebas afirman lo que el invariante
// #19 sólo puede vigilar por la forma.
import { describe, expect, it } from "vitest";
import { CUPO_ESCRITO_A_MANO, cupoDe, sinCupo, textoDeCupo } from "@/lib/experiences/cupo";

describe("cupoDe", () => {
  it("lee data.capacity y nada más", () => {
    expect(cupoDe({ capacity: 12 })).toBe(12);
    expect(cupoDe({ capacity: 12.9 })).toBe(12);
  });

  it("null es «no definido», que NO es cero", () => {
    expect(cupoDe({ capacity: undefined })).toBeNull();
    expect(cupoDe({ capacity: 0 })).toBeNull();
    expect(cupoDe({ capacity: -3 })).toBeNull();
    expect(cupoDe({ capacity: Number.NaN })).toBeNull();
    expect(cupoDe(null)).toBeNull();
    expect(cupoDe(undefined)).toBeNull();
  });
});

describe("textoDeCupo", () => {
  it("habla en singular y plural, y calla cuando no hay cupo", () => {
    expect(textoDeCupo(1)).toBe("1 persona");
    expect(textoDeCupo(18)).toBe("18 personas");
    expect(textoDeCupo(null)).toBeNull();
  });
});

describe("CUPO_ESCRITO_A_MANO — el patrón que tumba el build", () => {
  it("atrapa un cupo con cifra, en sus variantes", () => {
    for (const t of ["cupo 16", "Cupo: 16 personas", "cupos 12", "cupo máximo 8"]) {
      expect(t).toMatch(CUPO_ESCRITO_A_MANO);
    }
  });

  it("deja pasar «cupo limitado»: no promete ninguna cifra", () => {
    expect("cupo limitado").not.toMatch(CUPO_ESCRITO_A_MANO);
    expect("Cupo limitado. Reserva con tiempo.").not.toMatch(CUPO_ESCRITO_A_MANO);
  });
});

describe("sinCupo — la línea de precios sin el segmento del cupo", () => {
  it("quita el segmento entero, no sólo el número", () => {
    expect(sinCupo("$13,500 MXN · habitación compartida · cupo 16 personas")).toBe(
      "$13,500 MXN · habitación compartida",
    );
  });

  it("no toca una línea que no habla de cupo", () => {
    expect(sinCupo("$13,500 MXN · habitación compartida")).toBe("$13,500 MXN · habitación compartida");
  });

  it("tolera espacios sueltos y segmentos vacíos", () => {
    expect(sinCupo(" $1,750 ·  · cupo: 14 · todo incluido ")).toBe("$1,750 · todo incluido");
  });
});
