// El .cer del CSD trae su vigencia y su RFC: no se teclean (cer.ts).
// El fixture es un certificado autofirmado de prueba con el RFC de ejemplo del
// SAT (EKU9003173C9), no el sello de nadie.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { leerCer } from "@/lib/facturacion/cer";

describe("leerCer", () => {
  it("lee el RFC (antes de la diagonal) y la fecha de fin de vigencia", () => {
    const r = leerCer(readFileSync(join(__dirname, "fixtures/csd-prueba.cer")));
    expect(r?.rfc).toBe("EKU9003173C9");
    expect(r?.venceAt).toBe("2030-02-22");
  });
  it("un archivo que no es certificado ⇒ null", () => {
    expect(leerCer(Buffer.from("no soy un certificado"))).toBeNull();
  });
});
