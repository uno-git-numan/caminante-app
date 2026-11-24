// EL FLYER LLENA EL ALTA RÁPIDA — las tres reglas, probadas sin IA:
// nunca se inventa, nunca se pisa lo escrito, y se dice qué pasó.
import { describe, expect, it } from "vitest";
import { CORTA_VACIA } from "@/lib/experiences/corta";
import { aplicarPrellenadoCorta, fechaDe, horaDe, pesosDe, type CortaDeIA } from "@/lib/experiences/prellenado-corta";

const HOY = "2026-11-23";
const SIN_SALIDA = { inicio: "", fin: "", puntoEncuentro: "" };

const FLYER: CortaDeIA = {
  titulo: "Amanecer en el Nevado de Toluca",
  lugar: "Nevado de Toluca",
  estado: "Estado de México",
  actividad: "senderismo",
  descripcion: "Subimos de madrugada para ver salir el sol desde el cráter.\n\nBajamos por las lagunas.",
  incluye: ["Guía certificado", "Transporte desde CDMX", "Desayuno"],
  noIncluye: ["Comida"],
  horaInicio: "5:00",
  horaTermino: "16:00 h",
  exigencia: "media",
  edadMinima: "14",
  precio: "$1,800 MXN",
  cupo: "12",
  fechaInicio: "2026-12-12",
  fechaFin: "",
  puntoEncuentro: "Metro Observatorio",
  notas: "No venía la política de cancelación.",
};

describe("el flyer llena el alta rápida", () => {
  it("con un flyer completo llena los campos y no deja obligatorios pendientes", () => {
    const r = aplicarPrellenadoCorta(CORTA_VACIA, SIN_SALIDA, FLYER, HOY);
    expect(r.corta).toMatchObject({
      titulo: "Amanecer en el Nevado de Toluca",
      estado: "Estado de México",
      actividad: "senderismo",
      horaInicio: "05:00",
      horaTermino: "16:00",
      exigencia: "media",
      edadMinima: "14",
      precio: "1800",
      cupo: "12",
    });
    expect(r.corta.incluye).toEqual(["Guía certificado", "Transporte desde CDMX", "Desayuno"]);
    expect(r.corta.descripcion).toContain("\n\n"); // los párrafos sobreviven: son bloques de la página
    expect(r.salida).toEqual({ inicio: "2026-12-12", fin: "", puntoEncuentro: "Metro Observatorio" });
    expect(r.faltan).toEqual([]);
    expect(r.llenados).toContain("el precio");
    expect(r.notas).toContain("cancelación");
  });

  it("NUNCA PISA LO ESCRITO: lo que la persona ya tecleó manda", () => {
    const escrito = { ...CORTA_VACIA, titulo: "Mi nombre", precio: "2500", incluye: ["Lo mío"] };
    const r = aplicarPrellenadoCorta(escrito, { inicio: "2027-01-10", fin: "", puntoEncuentro: "" }, FLYER, HOY);
    expect(r.corta.titulo).toBe("Mi nombre");
    expect(r.corta.precio).toBe("2500");
    expect(r.corta.incluye).toEqual(["Lo mío"]);
    expect(r.salida.inicio).toBe("2027-01-10");
    expect(r.llenados).not.toContain("el nombre");
    expect(r.llenados).not.toContain("el precio");
    expect(r.llenados).not.toContain("la primera fecha");
    expect(r.llenados).toContain("dónde es"); // lo vacío sí se llena
  });

  it("NUNCA SE INVENTA: lo que no tiene la forma del formulario se tira, no se acomoda", () => {
    const r = aplicarPrellenadoCorta(
      CORTA_VACIA,
      SIN_SALIDA,
      {
        estado: "Narnia",
        actividad: "paseo en globo aerostático",
        horaInicio: "temprano",
        exigencia: "moderada",
        edadMinima: "niños",
        precio: "USD 120",
        cupo: "0",
        fechaInicio: "2026-11-01", // ya pasó
      },
      HOY,
    );
    expect(r.corta).toMatchObject({ estado: "", actividad: "", horaInicio: "", exigencia: "", edadMinima: "", precio: "", cupo: "" });
    expect(r.salida.inicio).toBe("");
    expect(r.llenados).toEqual([]);
    expect(r.faltan).toContain("el precio");
    expect(r.faltan).toContain("la actividad");
  });

  it("un flyer vacío no rompe ni llena nada, y lista todo lo que falta", () => {
    const r = aplicarPrellenadoCorta(CORTA_VACIA, SIN_SALIDA, {}, HOY);
    expect(r.llenados).toEqual([]);
    expect(r.corta).toEqual(CORTA_VACIA);
    expect(r.faltan).toHaveLength(11);
  });

  it("el estado se normaliza al nombre oficial («Edo. de México», «CDMX»)", () => {
    expect(aplicarPrellenadoCorta(CORTA_VACIA, SIN_SALIDA, { estado: "Edo. de México" }, HOY).corta.estado).toBe("Estado de México");
    expect(aplicarPrellenadoCorta(CORTA_VACIA, SIN_SALIDA, { estado: "cdmx" }, HOY).corta.estado).toBe("Ciudad de México");
  });

  it("el fin nunca queda antes del inicio, y el punto de encuentro sólo entra con una fecha", () => {
    const antes = aplicarPrellenadoCorta(CORTA_VACIA, SIN_SALIDA, { fechaInicio: "2026-12-12", fechaFin: "2026-12-10" }, HOY);
    expect(antes.salida).toMatchObject({ inicio: "2026-12-12", fin: "" });
    const variosDias = aplicarPrellenadoCorta(CORTA_VACIA, SIN_SALIDA, { fechaInicio: "2026-12-12", fechaFin: "2026-12-14" }, HOY);
    expect(variosDias.salida.fin).toBe("2026-12-14");
    const sinFecha = aplicarPrellenadoCorta(CORTA_VACIA, SIN_SALIDA, { puntoEncuentro: "Metro Observatorio" }, HOY);
    expect(sinFecha.salida.puntoEncuentro).toBe("");
  });
});

describe("las formas que el formulario acepta", () => {
  it("horas", () => {
    expect(horaDe("7:30")).toBe("07:30");
    expect(horaDe("18.00 hrs")).toBe("18:00");
    expect(horaDe("25:00")).toBe("");
    expect(horaDe("al amanecer")).toBe("");
  });

  it("pesos", () => {
    expect(pesosDe("$2,550")).toBe("2550");
    expect(pesosDe("1800.00 MXN")).toBe("1800");
    expect(pesosDe("USD 120")).toBe("");
    expect(pesosDe("5")).toBe("");
    expect(pesosDe("dos mil")).toBe("");
  });

  it("fechas: reales y que no hayan pasado", () => {
    expect(fechaDe("2026-12-12", HOY)).toBe("2026-12-12");
    expect(fechaDe("2026-11-23", HOY)).toBe("2026-11-23");
    expect(fechaDe("2026-11-22", HOY)).toBe("");
    expect(fechaDe("2026-02-30", HOY)).toBe("");
    expect(fechaDe("12 de diciembre", HOY)).toBe("");
  });
});
