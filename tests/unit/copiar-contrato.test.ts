// EL CONTRATO DE LA COPIA — qué viaja y qué no. La lista de lo que NO viaja
// existe porque cada renglón cobró o iba a cobrar de más: la liga de Stripe de
// la otra experiencia, el deslinde de la otra salida, las fechas viejas.
import { describe, expect, it } from "vitest";
import { LO_QUE_NO_VIAJA, limpiarParaCopia } from "@/lib/experiences/copiar-contrato";
import type { Experience } from "@/lib/experiences/types";

const original = {
  slug: "el-bosque-de-los-volcanes",
  status: "published",
  title: "El bosque",
  titleAccent: "de los volcanes",
  stripeLink: "https://buy.stripe.com/abc",
  capacity: 18,
  kitCaptions: { p1: "caption sobre hongos" },
  datesBadge: { label: "Fechas", big: "13", rest: "nov" },
  heroMeta: [
    { k: "Fecha", v: "13 de noviembre" },
    { k: "Lugar", v: "Hacienda San Andrés" },
  ],
  registration: {
    active: true,
    waiverVersion: "v1",
    waiverDocUrl: "https://…/deslinde-hongos.pdf",
    waiverClauses: ["Acepto el riesgo de la montaña."],
  },
} as unknown as Experience;

describe("limpiarParaCopia", () => {
  const copia = limpiarParaCopia(original) as Experience & Record<string, unknown>;

  it("nace sin dirección y en borrador", () => {
    expect(copia.slug).toBe("");
    expect(copia.status).toBe("draft");
  });

  it("no hereda la liga de pago: cobraría el producto viejo al precio viejo", () => {
    expect(copia.stripeLink).toBeNull();
  });

  it("no hereda captions, fechas a mano ni el PDF del deslinde de la otra", () => {
    expect(copia.kitCaptions).toBeUndefined();
    expect(copia.datesBadge).toBeUndefined();
    expect(copia.registration?.waiverDocUrl).toBe("");
    expect(copia.heroMeta?.find((m) => m.k === "Fecha")?.v).toBe("");
  });

  it("sí conserva lo que describe el lugar: cláusulas, cupo, título, el resto de la portada", () => {
    expect(copia.registration?.waiverClauses).toEqual(["Acepto el riesgo de la montaña."]);
    expect(copia.registration?.active).toBe(true);
    expect(copia.capacity).toBe(18);
    expect(copia.title).toBe("El bosque");
    expect(copia.heroMeta?.find((m) => m.k === "Lugar")?.v).toBe("Hacienda San Andrés");
  });

  it("no muta el original", () => {
    expect(original.slug).toBe("el-bosque-de-los-volcanes");
    expect(original.stripeLink).toBe("https://buy.stripe.com/abc");
    expect(original.registration?.waiverDocUrl).toContain("hongos");
  });

  it("la lista que se le enseña a la persona cubre cada campo que se limpia", () => {
    const texto = LO_QUE_NO_VIAJA.join(" ");
    for (const palabra of ["slug", "Stripe", "captions", "fechas", "deslinde"]) {
      expect(texto.toLowerCase()).toContain(palabra.toLowerCase());
    }
  });
});
