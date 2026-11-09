// LOS TEXTOS DEL RIEL QUE LLEVAN UN NÚMERO ESCRITO.
//
// El aviso del paso 02 viene de la lámina «Panel Operadora» y dice «diez
// generales que sirven para todo». Es un número escrito DENTRO de un texto: si
// el catálogo cambia, la pantalla mentiría sin fallar. Esta prueba se pone roja
// antes.
import { describe, expect, it } from "vitest";
import { LECTURA_PASO } from "@/lib/operadores/pasos";
import { generalesPara } from "@/lib/operadores/actividades";

describe("textos del riel", () => {
  // Desde el 9 nov 2026 lo general depende de si es persona física o moral, y
  // el número escrito cuenta los OBLIGATORIOS: lo opcional no se promete.
  it("«cinco generales» sigue siendo cierto para física y para moral", () => {
    expect(LECTURA_PASO[1]).toContain("cinco generales");
    expect(generalesPara("fisica").filter((d) => !d.opcional)).toHaveLength(5);
    expect(generalesPara("moral").filter((d) => !d.opcional)).toHaveLength(5);
  });
});
