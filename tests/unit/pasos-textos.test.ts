// LOS TEXTOS DEL RIEL QUE LLEVAN UN NÚMERO ESCRITO.
//
// El aviso del paso 02 viene de la lámina «Panel Operadora» y dice «diez
// generales que sirven para todo». Es un número escrito DENTRO de un texto: si
// el catálogo cambia, la pantalla mentiría sin fallar. Esta prueba se pone roja
// antes.
import { describe, expect, it } from "vitest";
import { LECTURA_PASO } from "@/lib/operadores/pasos";
import { GENERALES } from "@/lib/operadores/actividades";

describe("textos del riel", () => {
  it("«diez generales» sigue siendo cierto", () => {
    expect(LECTURA_PASO[1]).toContain("diez generales");
    expect(GENERALES).toHaveLength(10);
  });
});
