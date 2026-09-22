// EL MOTOR DE LA COMISIÓN — los números que ya cobraron y las reglas que los
// sostienen. Cada cifra de aquí sale de una venta real o de la tabla publicada;
// si una prueba falla, o cambió la regla a propósito o se rompió el dinero.
import { describe, expect, it } from "vitest";
import {
  IVA,
  MINIMO_POR_RESERVA,
  TOPE,
  comisionDeVenta,
  comisionPara,
  sinIva,
  tablaDeComisiones,
  tramosPara,
} from "@/lib/operadores/comision";

describe("sinIva", () => {
  it("convierte la etiqueta al valor del servicio, a dos decimales", () => {
    expect(sinIva(1750)).toBe(1508.62);
    expect(sinIva(1160)).toBe(1000);
  });
});

describe("comisionPara — la venta real de Nomádika (15–18 sep 2026)", () => {
  // 12 ventas de $1,750 congelaron platform_fee_mxn = 301.72 cada una.
  const base = sinIva(1750);

  it("escala VENTA: 20% del primer tramo = $301.72", () => {
    const c = comisionPara(base, "venta");
    expect(c.monto).toBe(301.72);
    // El monto va redondeado a centavos; la tasa efectiva se desvía en la sexta cifra.
    expect(c.pctEfectivo).toBeCloseTo(0.2, 4);
  });

  it("escala PLATAFORMA: 15% = $226.29 (abajo del piso, que se aplica en la venta, no aquí)", () => {
    expect(comisionPara(base, "plataforma").monto).toBe(226.29);
  });

  it("sin precio no hay comisión, y no revienta", () => {
    expect(comisionPara(0, "venta")).toEqual({ monto: 0, pctEfectivo: 0, escala: "venta" });
    expect(comisionPara(-5, "venta").monto).toBe(0);
  });
});

describe("tramos marginales, como el ISR", () => {
  it("$8,000 en VENTA paga 20% de los primeros 3,000 y 18% de los otros 5,000", () => {
    expect(comisionPara(8000, "venta").monto).toBe(600 + 900);
  });

  it("subir el precio nunca baja la comisión en pesos", () => {
    let previa = 0;
    for (let precio = 100; precio <= 60_000; precio += 137) {
      const monto = comisionPara(precio, "venta").monto;
      expect(monto).toBeGreaterThanOrEqual(previa);
      previa = monto;
    }
  });

  it("la tasa efectiva baja conforme sube el precio («entre más cara, más baja»)", () => {
    const pct = (p: number) => comisionPara(p, "plataforma").pctEfectivo;
    expect(pct(2000)).toBeGreaterThan(pct(10_000));
    expect(pct(10_000)).toBeGreaterThan(pct(50_000));
  });
});

describe("el tope del 20%", () => {
  it("ninguna tasa de ninguna escala pasa de TOPE", () => {
    for (const fila of tablaDeComisiones()) {
      expect(fila.venta).toBeLessThanOrEqual(TOPE);
      expect(fila.plataforma).toBeLessThanOrEqual(TOPE);
      expect(fila.plataforma).toBeLessThanOrEqual(fila.venta);
    }
  });
});

describe("comisionDeVenta — la venta completa", () => {
  const base = sinIva(1750);

  it("PLATAFORMA con ticket chico: rige el piso de $250", () => {
    const c = comisionDeVenta({ viaje: { precioUnitario: base, cantidad: 1 } }, { tipo: "escala", escala: "plataforma" });
    expect(c.monto).toBe(MINIMO_POR_RESERVA);
    expect(c.desglose.viaje).toBe(226.29); // lo que dio la escala antes del piso
  });

  it("el piso está acotado por el tope: en $500 no cobra $250 sino $100", () => {
    const c = comisionDeVenta({ viaje: { precioUnitario: 500, cantidad: 1 } }, { tipo: "escala", escala: "plataforma" });
    expect(c.monto).toBe(100);
    expect(c.pctEfectivo).toBeCloseTo(TOPE, 6);
  });

  it("la cantidad multiplica la comisión, NO el precio que entra a la escala", () => {
    const dos = comisionDeVenta({ viaje: { precioUnitario: base, cantidad: 2 } }, { tipo: "escala", escala: "venta" });
    expect(dos.monto).toBe(603.44); // 2 × 301.72
    // Si se hubiera sumado el precio, el segundo boleto habría caído al 18%:
    expect(comisionPara(base * 2, "venta").monto).toBeLessThan(dos.monto);
  });

  it("cada complemento se tarifa por su propio precio", () => {
    const c = comisionDeVenta(
      {
        viaje: { precioUnitario: 27_756, cantidad: 1 }, // travesía de $32,197 con IVA
        complementos: [{ precioUnitario: sinIva(6778), cantidad: 1 }], // el tren
      },
      { tipo: "escala", escala: "venta" },
    );
    const soloViaje = comisionPara(27_756, "venta").monto;
    const soloTren = comisionPara(sinIva(6778), "venta").monto;
    expect(c.desglose.viaje).toBe(soloViaje);
    expect(c.desglose.complementos).toBe(soloTren);
    expect(c.monto).toBe(Math.round((soloViaje + soloTren) * 100) / 100);
  });

  it("un porcentaje PLANO pactado no lleva piso: es el trato firmado", () => {
    const c = comisionDeVenta({ viaje: { precioUnitario: 500, cantidad: 1 } }, { tipo: "plano", pct: 20 });
    expect(c.monto).toBe(100);
    const chico = comisionDeVenta({ viaje: { precioUnitario: 100, cantidad: 1 } }, { tipo: "plano", pct: 10 });
    expect(chico.monto).toBe(10); // sin piso de 250
  });

  it("lo que retiene Numan por Connect es comisión + IVA de la comisión: $350 en $1,750", () => {
    const c = comisionDeVenta({ viaje: { precioUnitario: base, cantidad: 1 } }, { tipo: "escala", escala: "venta" });
    expect(Math.round(c.monto * (1 + IVA) * 100) / 100).toBe(350);
  });
});

describe("cómo se publica la escala", () => {
  it("tablaDeComisiones: cinco renglones con los mismos cortes en las dos columnas", () => {
    const t = tablaDeComisiones();
    expect(t).toHaveLength(5);
    expect(t.map((f) => f.hasta)).toEqual([3000, 8000, 15_000, 40_000, null]);
    expect(t.map((f) => f.venta)).toEqual([0.2, 0.18, 0.16, 0.14, 0.14]);
    expect(t.map((f) => f.plataforma)).toEqual([0.15, 0.13, 0.11, 0.09, 0.08]);
  });

  it("tramosPara fusiona los tramos con la misma tasa: VENTA termina en un solo 14%", () => {
    const v = tramosPara("venta");
    expect(v).toHaveLength(4);
    expect(v[3]).toEqual({ desde: 15_000, hasta: null, pct: 0.14 });
    expect(tramosPara("plataforma")).toHaveLength(5);
  });
});
