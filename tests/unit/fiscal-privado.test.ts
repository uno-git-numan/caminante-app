// CURP y domicilio fiscal desde la constancia (lib/operadores/fiscal-privado.ts).
// La informativa de plataformas los pide (D4); se toman de la CSF confirmada,
// nunca se le preguntan a la operadora, y una lectura dudosa no se guarda.
import { describe, expect, it } from "vitest";
import { curpDeRfc, domicilioUtil } from "@/lib/operadores/fiscal-privado";

describe("curpDeRfc", () => {
  const rfc = "ROBL990531HI3";
  it("una CURP bien formada y del mismo RFC ⇒ se guarda", () => {
    expect(curpDeRfc("ROBL990531MQTMRR09", rfc)).toBe("ROBL990531MQTMRR09");
  });
  it("los 10 primeros no coinciden con el RFC ⇒ la lectura se equivocó, no se guarda", () => {
    expect(curpDeRfc("ROBL990532MQTMRR09", rfc)).toBeNull();
  });
  it("mal formada ⇒ null", () => {
    expect(curpDeRfc("ROBL990531", rfc)).toBeNull();
  });
  it("persona moral (RFC de 12) ⇒ no tiene CURP", () => {
    expect(curpDeRfc("ROBL990531MQTMRR09", "NHU250826CS8")).toBeNull();
  });
  it("tolera minúsculas y espacios de la lectura", () => {
    expect(curpDeRfc(" robl990531mqtmrr09 ", rfc)).toBe("ROBL990531MQTMRR09");
  });
});

describe("domicilioUtil", () => {
  it("con calle y CP ⇒ se guarda, limpio", () => {
    expect(domicilioUtil({ calle: " Av. Juárez ", codigoPostal: "76230", estado: "QUERÉTARO" })).toMatchObject({
      calle: "Av. Juárez",
      codigoPostal: "76230",
      estado: "QUERÉTARO",
      colonia: null,
    });
  });
  it("sin CP de 5 dígitos ⇒ no sirve", () => {
    expect(domicilioUtil({ calle: "Av. Juárez", codigoPostal: "7623" })).toBeNull();
  });
  it("sólo el CP ⇒ no sirve: eso ya lo teníamos", () => {
    expect(domicilioUtil({ codigoPostal: "76230" })).toBeNull();
  });
  it("nada ⇒ null", () => {
    expect(domicilioUtil(null)).toBeNull();
  });
});
