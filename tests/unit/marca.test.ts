// LA MARCA DEL OPERADOR — normalización. Un color inválido no rompe visible-
// mente (color-mix lo ignora y la página se ve Caminante), por eso se rechaza
// en la puerta y por eso hay que probarlo.
import { describe, expect, it } from "vitest";
import { armarMarca, color, faltanDeMarca, logoUrl, marcaLista } from "@/lib/operators/marca";

describe("color", () => {
  it("normaliza a hex en minúsculas, con o sin #", () => {
    expect(color("#ABC")).toBe("#abc");
    expect(color("ff5d36")).toBe("#ff5d36");
    expect(color("  #9A3B2D ")).toBe("#9a3b2d");
  });

  it("rechaza lo que no es hex de 3 o 6", () => {
    for (const v of ["zzz", "#12345", "rgb(1,2,3)", "", null, undefined, "#ggg"]) {
      expect(color(v)).toBeNull();
    }
  });
});

describe("logoUrl", () => {
  it("sólo https y sólo imagen", () => {
    expect(logoUrl("https://x.com/logo.png")).toBe("https://x.com/logo.png");
    expect(logoUrl("https://x.com/logo.SVG")).toBe("https://x.com/logo.SVG");
    expect(logoUrl("http://x.com/logo.png")).toBeNull();
    expect(logoUrl("https://x.com/logo.pdf")).toBeNull();
    expect(logoUrl("no es url")).toBeNull();
  });
});

describe("armarMarca", () => {
  it("sin los dos colores no hay marca: a medias es peor que ninguna", () => {
    expect(armarMarca({ primary: "#637154" })).toBeNull();
    expect(armarMarca({ accent: "#ff5d36", logoUrl: "https://x.com/l.png" })).toBeNull();
  });

  it("con los dos colores arma el contrato, el logo es opcional", () => {
    const m = armarMarca({ primary: "#637154", accent: "FF5D36", footerLine: "  Nomádika   SC  ", fontFamily: "Fraunces!" });
    expect(m).toEqual({
      logoUrl: "",
      colors: { primary: "#637154", accent: "#ff5d36" },
      footerLine: "Nomádika SC",
      font: { family: "Fraunces" },
    });
  });
});

describe("marcaLista", () => {
  it("es exactamente «tiene los dos colores válidos»", () => {
    expect(marcaLista({ logoUrl: "", colors: { primary: "#111", accent: "#222" } })).toBe(true);
    expect(marcaLista({ logoUrl: "https://x/l.png", colors: { primary: "", accent: "#222" } })).toBe(false);
    expect(marcaLista(null)).toBe(false);
  });
});

describe("faltanDeMarca", () => {
  // ⚠️ ES MÁS EXIGENTE QUE `marcaLista` A PROPÓSITO, y por eso se prueba el
  // desacuerdo entre las dos: con los dos colores y sin logo la marca YA viste
  // (marcaLista true) pero todavía falta algo que decirle a quien la capturó —
  // donde iría su logo sigue el sello de Caminante. Si alguien "arreglara" esta
  // función para que empate con marcaLista, este caso se pondría rojo.
  it("con los dos colores y sin logo: viste, pero le falta el logo", () => {
    const b = { logoUrl: "", colors: { primary: "#637154", accent: "#ff5d36" } };
    expect(marcaLista(b)).toBe(true);
    expect(faltanDeMarca(b)).toEqual(["logo"]);
  });

  it("sin nada, los nombra los tres, en el orden en que se capturan", () => {
    expect(faltanDeMarca(null)).toEqual(["color principal", "color de acento", "logo"]);
  });

  it("un color inválido cuenta como faltante, no como puesto", () => {
    expect(faltanDeMarca({ logoUrl: "https://x/l.png", colors: { primary: "verde", accent: "#ff5d36" } }))
      .toEqual(["color principal"]);
  });

  it("completa de verdad no deja nada pendiente", () => {
    expect(faltanDeMarca({ logoUrl: "https://x/l.png", colors: { primary: "#637154", accent: "#ff5d36" } }))
      .toEqual([]);
  });
});
