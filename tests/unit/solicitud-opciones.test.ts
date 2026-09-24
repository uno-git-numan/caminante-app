// LAS OPCIONES DE LA SOLICITUD — una sola lista para el formulario, el servidor
// y los paneles. Antes eran tres, y la tarjeta de la casa decía otras palabras.
import { describe, expect, it } from "vitest";
import { SEGURO, TIPOS, codigos, etiqueta } from "@/lib/operadores/solicitud-opciones";

describe("solicitud-opciones", () => {
  it("la palabra es la del formulario, no un resumen", () => {
    expect(etiqueta(TIPOS, "montana")).toBe("Montaña y senderismo");
    expect(etiqueta(SEGURO, "vence-pronto")).toBe("Sí, pero vence pronto");
  });
  it("un código que ya no existe se enseña tal cual, no se esconde", () => {
    expect(etiqueta(TIPOS, "rafting")).toBe("rafting");
    expect(etiqueta(TIPOS, null)).toBeNull();
  });
  it("el servidor valida contra la misma lista", () => {
    expect(codigos(TIPOS).has("mixta")).toBe(true);
    expect(codigos(TIPOS).has("Montaña")).toBe(false);
  });
});
