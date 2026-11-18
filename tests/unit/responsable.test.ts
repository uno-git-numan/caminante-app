import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CONTACTO_CAMINANTE, contactoPropioDe, CORREO_PRIVACIDAD, DOMICILIO_NUMAN, RAZON_SOCIAL_NUMAN, waHref } from "@/lib/legal/responsable";

// D25 · identidad, domicilio y medios de reclamación a la vista.

const plano = (s: string) => s.replace(/\n> ?/g, " ").replace(/\*\*/g, "").replace(/\s+/g, " ");

describe("el responsable y su domicilio", () => {
  const aviso = plano(readFileSync("design/legal/AVISO-PRIVACIDAD-ADICIONES-2026-11.md", "utf8"));
  const decisiones = plano(readFileSync("design/legal/DECISIONES-LEGAL-FISCAL-2026-11-11.md", "utf8"));

  it("el domicilio y la razón social son los del documento de legal, letra por letra", () => {
    expect(aviso).toContain(`${RAZON_SOCIAL_NUMAN}, con domicilio en ${DOMICILIO_NUMAN}`);
    expect(decisiones).toContain(DOMICILIO_NUMAN);
  });

  it("el correo del aviso de privacidad es el que legal escribió", () => {
    expect(aviso).toContain(`escríbenos a ${CORREO_PRIVACIDAD}`);
  });

  it("el aviso de privacidad publicado usa esas constantes y trae el párrafo de la bonificación", () => {
    const pagina = readFileSync("src/app/caminante/privacidad/page.tsx", "utf8");
    expect(pagina).toContain("{RAZON_SOCIAL_NUMAN}");
    expect(pagina).toContain("{DOMICILIO_NUMAN}");
    expect(plano(pagina)).toContain("conservamos únicamente la fecha, el importe, los últimos cuatro dígitos de la cuenta y la clave de rastreo de la transferencia");
    expect(aviso).toContain("conservamos únicamente la fecha, el importe, los últimos cuatro dígitos de la cuenta y la clave de rastreo de la transferencia");
  });
});

describe("a quién reclamar antes de pagar", () => {
  it("si quien vende trae el mismo contacto que Caminante, no se repite", () => {
    expect(contactoPropioDe({ whatsapp: "+52 55 1202 0565", email: CONTACTO_CAMINANTE.email.toUpperCase() })).toBeNull();
    expect(contactoPropioDe(null)).toBeNull();
  });

  it("si es distinto, se enseña además del de Caminante", () => {
    expect(contactoPropioDe({ whatsapp: "+525500000000", email: CONTACTO_CAMINANTE.email })).toEqual({ whatsapp: "+525500000000", email: null });
    expect(contactoPropioDe({ whatsapp: null, email: "hola@operadora.test" })).toEqual({ whatsapp: null, email: "hola@operadora.test" });
  });

  it("la liga de WhatsApp lleva sólo dígitos", () => {
    expect(waHref("+52 55 1202-0565")).toBe("https://wa.me/525512020565");
  });

  it("las cuatro pantallas de pago y el pie del sitio lo muestran", () => {
    for (const f of [
      "src/app/caminante/reservar/[slug]/CheckoutForm.tsx",
      "src/app/caminante/reservar/[slug]/ReservarMovil.tsx",
      "src/app/caminante/pago/[token]/page.tsx",
      "src/app/caminante/pago/[token]/PagoMovil.tsx",
    ]) {
      expect(readFileSync(f, "utf8")).toMatch(/<ContactoReclamaciones(Escritorio|Movil) contacto=/);
    }
    for (const f of ["src/app/caminante/SiteChrome.tsx", "src/app/caminante/ui/pub/PubShell.tsx", "src/app/caminante/experiencias/[slug]/ExperienceTemplateV2.tsx"]) {
      expect(readFileSync(f, "utf8")).toContain("{DOMICILIO_NUMAN}");
    }
  });
});
