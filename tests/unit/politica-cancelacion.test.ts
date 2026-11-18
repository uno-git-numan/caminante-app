import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  bloquesPolitica,
  bonificacionDe,
  DESCANSOS_OBLIGATORIOS,
  diasHabilesEntre,
  diasNaturales,
  esDiaHabil,
  esVariante,
  FRASE_ACEPTACION,
  limiteArrepentimiento,
  proponerReembolso,
  resumenPolitica,
  sumarDiasHabiles,
  textoPolitica,
  ymdCdmx,
  type CasoReembolso,
} from "@/lib/cancelacion/politica";

// D23 · la política de cancelación frente al cliente.

describe("el texto que ve el cliente", () => {
  const legal = readFileSync("design/legal/POLITICA-CANCELACION-CLIENTE-2026-11.md", "utf8").replace(/\n> ?/g, "\n").replace(/\s+/g, " ");
  const plano = (s: string) => s.replace(/\s+/g, " ");

  it("cada renglón está tal cual en el documento de legal, en las dos variantes", () => {
    for (const v of ["estandar", "expedicion"] as const) {
      for (const b of bloquesPolitica(v)) {
        expect(legal).toContain(`**${b.titulo}**`);
        for (const r of b.renglones) expect(legal).toContain(plano(r));
      }
    }
  });

  it("Estándar es 30/15 y Expedición 60/30", () => {
    expect(bloquesPolitica("estandar")[0].renglones[1]).toBe("De 15 a 29 días antes: el **50 %**.");
    expect(bloquesPolitica("expedicion")[0].renglones[1]).toBe("De 30 a 59 días antes: el **50 %**.");
  });

  it("el texto canónico (el que se huella) no lleva negritas y es distinto por variante", () => {
    expect(textoPolitica("estandar")).not.toContain("**");
    expect(textoPolitica("estandar")).not.toBe(textoPolitica("expedicion"));
    expect(textoPolitica("estandar").startsWith("Cancelación y devoluciones\n\nSi cancelas tú\n- Con 30 días o más")).toBe(true);
  });

  it("el resumen son tres renglones y la frase del botón es la de legal", () => {
    expect(resumenPolitica("estandar")).toHaveLength(3);
    expect(resumenPolitica("expedicion")[0]).toMatch(/60 días o más.*30 a 59/);
    expect(legal).toContain(FRASE_ACEPTACION);
  });

  it("sólo hay dos variantes", () => {
    expect(esVariante("estandar") && esVariante("expedicion")).toBe(true);
    expect(esVariante("otra") || esVariante(null)).toBe(false);
  });
});

describe("los días hábiles (LFT art. 74)", () => {
  // La regla del artículo, para comprobar que la lista no trae una fecha mal copiada.
  const lunes = (anio: number, mes: number, n: number) => {
    const d = new Date(Date.UTC(anio, mes - 1, 1));
    let vistos = 0;
    for (;;) {
      if (d.getUTCDay() === 1 && ++vistos === n) return d.toISOString().slice(0, 10);
      d.setUTCDate(d.getUTCDate() + 1);
    }
  };

  it("la lista de cada año es la que sale del artículo 74", () => {
    for (const anio of [2026, 2027]) {
      expect(DESCANSOS_OBLIGATORIOS[anio]).toEqual([`${anio}-01-01`, lunes(anio, 2, 1), lunes(anio, 3, 3), `${anio}-05-01`, `${anio}-09-16`, lunes(anio, 11, 3), `${anio}-12-25`]);
    }
  });

  it("sábado, domingo y descanso obligatorio no son hábiles", () => {
    expect(esDiaHabil("2026-11-13")).toBe(true); // viernes
    expect(esDiaHabil("2026-11-14")).toBe(false); // sábado
    expect(esDiaHabil("2026-11-16")).toBe(false); // tercer lunes de noviembre
    expect(esDiaHabil("2026-09-16")).toBe(false);
  });

  it("un año sin lista no se adivina", () => {
    expect(() => esDiaHabil("2029-03-01")).toThrow(/Falta la lista/);
  });

  it("cuenta y suma saltándose fines de semana y descansos", () => {
    // Del viernes 13 nov: lunes 16 es descanso → el 1er día hábil es el martes 17.
    expect(sumarDiasHabiles("2026-11-13", 1)).toBe("2026-11-17");
    expect(sumarDiasHabiles("2026-11-13", 5)).toBe("2026-11-23");
    expect(diasHabilesEntre("2026-11-13", "2026-11-23")).toBe(5);
    expect(diasNaturales("2026-11-13", "2026-11-28")).toBe(15);
  });

  it("la fecha es la de CDMX, no la de UTC", () => {
    expect(ymdCdmx("2026-12-01T05:30:00.000Z")).toBe("2026-11-30");
  });
});

describe("la calculadora del reembolso", () => {
  const base: CasoReembolso = { variante: "estandar", reservadaAt: "2026-11-03T10:00:00-06:00", salidaInicio: "2026-12-12", avisoAt: "2026-11-20T10:00:00-06:00", pagado: 6750, cancela: "cliente" };

  it("1 · si cancela la operación, 100 % siempre", () => {
    expect(proponerReembolso({ ...base, cancela: "operacion", avisoAt: "2026-12-11T10:00:00-06:00" })).toMatchObject({ pct: 100, regla: "operacion", importe: 6750 });
  });

  it("2 · arrepentimiento legal: reservó con más de 10 días hábiles y avisó dentro de 5 hábiles", () => {
    // Reserva martes 3 nov; el 5º día hábil es el martes 10 nov.
    expect(proponerReembolso({ ...base, avisoAt: "2026-11-10T22:00:00-06:00" })).toMatchObject({ pct: 100, regla: "arrepentimiento-legal" });
  });

  it("2 · al sexto día hábil ya no", () => {
    expect(proponerReembolso({ ...base, avisoAt: "2026-11-11T09:00:00-06:00" }).regla).toBe("ventana");
  });

  it("2 · no aplica si reservó con 10 días hábiles o menos de anticipación", () => {
    // Reserva 3 nov, salida 17 nov: 9 días hábiles (el 16 es descanso). Avisa al día siguiente… pero pasadas 24 h.
    const p = proponerReembolso({ ...base, salidaInicio: "2026-11-17", avisoAt: "2026-11-04T11:00:00-06:00" });
    expect(p.regla).toBe("ventana");
    expect(p.pct).toBe(0);
  });

  it("3 · 24 horas, con la salida a 7 días o más", () => {
    expect(proponerReembolso({ ...base, salidaInicio: "2026-11-12", avisoAt: "2026-11-04T09:00:00-06:00" })).toMatchObject({ pct: 100, regla: "arrepentimiento-24h" });
  });

  it("3 · no aplica si la salida está a menos de 7 días", () => {
    expect(proponerReembolso({ ...base, salidaInicio: "2026-11-08", avisoAt: "2026-11-03T12:00:00-06:00" })).toMatchObject({ pct: 0, regla: "ventana" });
  });

  it("4 · ventanas de Estándar: 30 o más → 100 %; 15 a 29 → 50 %; menos → 0", () => {
    const con = (avisoAt: string) => proponerReembolso({ ...base, avisoAt });
    expect(con("2026-11-12T10:00:00-06:00")).toMatchObject({ pct: 100, regla: "ventana", importe: 6750 }); // 30 días
    expect(con("2026-11-13T10:00:00-06:00")).toMatchObject({ pct: 50, importe: 3375 }); // 29 días
    expect(con("2026-11-27T10:00:00-06:00")).toMatchObject({ pct: 50 }); // 15 días
    expect(con("2026-11-28T10:00:00-06:00")).toMatchObject({ pct: 0, importe: 0 }); // 14 días
  });

  it("4 · ventanas de Expedición: 60 / 30", () => {
    const exp = { ...base, variante: "expedicion" as const, reservadaAt: "2026-09-01T10:00:00-06:00", salidaInicio: "2026-12-12" };
    expect(proponerReembolso({ ...exp, avisoAt: "2026-10-13T10:00:00-06:00" }).pct).toBe(100); // 60 días
    expect(proponerReembolso({ ...exp, avisoAt: "2026-10-14T10:00:00-06:00" }).pct).toBe(50); // 59 días
    expect(proponerReembolso({ ...exp, avisoAt: "2026-11-13T10:00:00-06:00" }).pct).toBe(0); // 29 días
  });

  it("dice por qué", () => {
    expect(proponerReembolso(base).porque).toMatch(/Política Estándar: avisó 22 días antes/);
  });
});

describe("la fecha límite del arrepentimiento (para el comprobante)", () => {
  it("con más de 10 días hábiles de anticipación: el fin del 5º día hábil", () => {
    expect(limiteArrepentimiento("2026-11-03T10:00:00-06:00", "2026-12-12")).toBe("2026-11-11T05:59:59.999Z"); // martes 10 nov, 23:59 CDMX
  });

  it("con menos anticipación pero la salida a 7 días o más: 24 horas", () => {
    expect(limiteArrepentimiento("2026-11-03T10:00:00-06:00", "2026-11-12")).toBe("2026-11-04T16:00:00.000Z");
  });

  it("con la salida a menos de 7 días no hay arrepentimiento", () => {
    expect(limiteArrepentimiento("2026-11-03T10:00:00-06:00", "2026-11-08")).toBeNull();
  });
});

describe("la bonificación", () => {
  it("es el 20 % de lo que pagó", () => {
    expect(bonificacionDe(6750)).toBe(1350);
    expect(bonificacionDe(11500)).toBe(2300);
  });
});
