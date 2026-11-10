// Lo que se le manda a Stripe de la constancia (identidad-stripe.ts): sólo lo
// que sabemos, en el lugar correcto según física o moral, y nada si no se sabe.
import { describe, expect, it } from "vitest";
import { identidadParaStripe } from "@/lib/payments/identidad-stripe";

const base = { rfc: "EKU9003173C9", razon_social: "EMPRESA", cp_fiscal: "11000", email: "a@b.mx" };

describe("identidadParaStripe", () => {
  it("moral ⇒ razón social, RFC y CP en business_details", () => {
    expect(identidadParaStripe({ ...base, tipo_persona: "moral" })).toEqual({
      business_details: {
        registered_name: "EMPRESA",
        id_numbers: [{ type: "mx_rfc", value: "EKU9003173C9" }],
        address: { country: "mx", postal_code: "11000" },
      },
    });
  });
  it("física ⇒ RFC, CP y correo en individual, y NO el nombre (partirlo sería adivinar)", () => {
    const r = identidadParaStripe({ ...base, rfc: "ROBL990531HI3", tipo_persona: "fisica" });
    expect(r.individual).toEqual({
      id_numbers: [{ type: "mx_rfc", value: "ROBL990531HI3" }],
      address: { country: "mx", postal_code: "11000" },
      email: "a@b.mx",
    });
    expect(JSON.stringify(r)).not.toMatch(/EMPRESA/);
  });
  it("sin física o moral no se manda nada", () => {
    expect(identidadParaStripe({ ...base, tipo_persona: null })).toEqual({});
  });
  it("un CP que no son 5 dígitos no viaja", () => {
    expect(identidadParaStripe({ ...base, cp_fiscal: "1100", tipo_persona: "moral" }).business_details?.address).toBeUndefined();
  });
});
