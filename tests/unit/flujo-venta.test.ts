// EL CANDADO DE PUBLICAR Y COBRAR — deslinde y encuesta. Regla de Luis (9 jul y
// 3 ago 2026): no existe un evento sin deslinde, y todo prendido antes de publicar.
import { describe, expect, it } from "vitest";
import { deslindeListo, encuestaLista, listaParaPublicar } from "@/lib/experiences/flujo-venta";

const registro = {
  active: true,
  waiverVersion: "v1",
  waiverDocUrl: "",
  waiverClauses: ["Acepto el riesgo."],
};
const encuesta = {
  active: true,
  version: "v1",
  locationLabel: "Hacienda San Andrés",
  npsEnabled: true,
  sections: [{ key: "guia", label: "El guía" }],
};

describe("deslindeListo", () => {
  it("con registro activo y al menos una cláusula, vende", () => {
    expect(deslindeListo({ registration: registro })).toEqual({ ok: true, faltantes: [] });
  });

  it("el PDF externo ya no se exige: el deslinde se genera de las cláusulas", () => {
    expect(deslindeListo({ registration: { ...registro, waiverDocUrl: "" } }).ok).toBe(true);
  });

  it("apagado o sin cláusulas: bloquea y dice qué falta", () => {
    const r = deslindeListo({ registration: { ...registro, active: false, waiverClauses: [] } });
    expect(r.ok).toBe(false);
    expect(r.faltantes).toHaveLength(2);
  });

  it("sin sección de registro, bloquea", () => {
    expect(deslindeListo({}).ok).toBe(false);
    expect(deslindeListo(null).ok).toBe(false);
  });
});

describe("encuestaLista", () => {
  it("activa, con categorías y con etiqueta de locación", () => {
    expect(encuestaLista({ feedback: encuesta }).ok).toBe(true);
  });

  it("nace apagada y eso bloquea publicar (caso hongos: 18 personas sin encuesta)", () => {
    const r = encuestaLista({ feedback: { ...encuesta, active: false } });
    expect(r.ok).toBe(false);
    expect(r.faltantes[0]).toMatch(/no está activa/);
  });

  it("una categoría sin etiqueta no cuenta", () => {
    const r = encuestaLista({ feedback: { ...encuesta, sections: [{ key: "x", label: "  " }] } });
    expect(r.faltantes.join(" ")).toMatch(/categorías/);
  });
});

describe("listaParaPublicar", () => {
  it("suma las faltas de los dos candados", () => {
    const r = listaParaPublicar({ registration: { ...registro, active: false }, feedback: { ...encuesta, active: false } });
    expect(r.ok).toBe(false);
    expect(r.faltantes).toHaveLength(2);
  });

  it("con todo prendido, publica", () => {
    expect(listaParaPublicar({ registration: registro, feedback: encuesta }).ok).toBe(true);
  });
});
