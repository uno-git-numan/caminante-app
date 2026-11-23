// EL MOTOR DE LA COMISIÓN — fija desde el 23 nov de 2026: 8 % si la operadora
// trae al cliente, 12 % si lo trae Caminante. Cada cifra de aquí sale del motor
// que cobra; si una prueba falla, o cambió la regla a propósito o se rompió el
// dinero.
import { describe, expect, it } from "vitest";
import { IVA, TASA, TASA_PCT, TOPE, comisionDeVenta, comisionPara, sinIva } from "@/lib/operadores/comision";

describe("sinIva", () => {
  it("convierte la etiqueta al valor del servicio, a dos decimales", () => {
    expect(sinIva(1750)).toBe(1508.62);
    expect(sinIva(1160)).toBe(1000);
  });
});

describe("las dos tasas fijas (Luis, 23 nov 2026)", () => {
  it("son 12 % si lo trae Caminante y 8 % si lo trae la operadora", () => {
    expect(TASA).toEqual({ venta: 0.12, plataforma: 0.08 });
    expect(TASA_PCT).toEqual({ venta: 12, plataforma: 8 });
  });

  it("ninguna pasa del tope del 20 %, y traer al cliente nunca sale más caro", () => {
    expect(TASA.venta).toBeLessThanOrEqual(TOPE);
    expect(TASA.plataforma).toBeLessThanOrEqual(TASA.venta);
  });
});

describe("comisionPara — un boleto de $1,750 (el de las ventas de Nomádika)", () => {
  const base = sinIva(1750);

  it("lo trae Caminante: 12 % de la base = $181.03", () => {
    const c = comisionPara(base, "venta");
    expect(c.monto).toBe(181.03);
    // El monto va redondeado a centavos; la tasa efectiva se desvía en la sexta cifra.
    expect(c.pctEfectivo).toBeCloseTo(0.12, 4);
  });

  it("lo trae la operadora: 8 % = $120.69", () => {
    expect(comisionPara(base, "plataforma").monto).toBe(120.69);
  });

  it("sin precio no hay comisión, y no revienta", () => {
    expect(comisionPara(0, "venta")).toEqual({ monto: 0, pctEfectivo: 0, escala: "venta" });
    expect(comisionPara(-5, "venta").monto).toBe(0);
  });
});

describe("es PAREJA: la misma tasa para cualquier precio", () => {
  it("un boleto de $2,000 y uno de $50,000 pagan el mismo porcentaje", () => {
    for (const precio of [150, 2000, 8000, 10_000, 27_756, 50_000]) {
      expect(comisionPara(precio, "plataforma").pctEfectivo).toBeCloseTo(0.08, 4);
      expect(comisionPara(precio, "venta").pctEfectivo).toBeCloseTo(0.12, 4);
    }
    expect(comisionPara(8000, "venta").monto).toBe(960);
    expect(comisionPara(8000, "plataforma").monto).toBe(640);
  });

  it("subir el precio nunca baja la comisión en pesos", () => {
    let previa = 0;
    for (let precio = 100; precio <= 60_000; precio += 137) {
      const monto = comisionPara(precio, "venta").monto;
      expect(monto).toBeGreaterThanOrEqual(previa);
      previa = monto;
    }
  });
});

describe("comisionDeVenta — la venta completa", () => {
  const base = sinIva(1750);

  it("NO hay mínimo por reserva: un ticket chico paga su 8 %, no $250", () => {
    const c = comisionDeVenta({ viaje: { precioUnitario: base, cantidad: 1 } }, { tipo: "escala", escala: "plataforma" });
    expect(c.monto).toBe(120.69);
    const chico = comisionDeVenta({ viaje: { precioUnitario: 500, cantidad: 1 } }, { tipo: "escala", escala: "plataforma" });
    expect(chico.monto).toBe(40);
    expect(chico.pctEfectivo).toBeCloseTo(0.08, 6);
  });

  it("dos boletos pagan el doble, redondeado por cabeza", () => {
    const dos = comisionDeVenta({ viaje: { precioUnitario: base, cantidad: 2 } }, { tipo: "escala", escala: "venta" });
    expect(dos.monto).toBe(362.06); // 2 × 181.03
  });

  it("cada complemento se tarifa por su propio precio y se suma", () => {
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
    // Con tasa fija el tren ya no paga más tasa que el viaje: los dos el 12 %.
    expect(c.pctEfectivo).toBeCloseTo(0.12, 4);
  });

  it("un porcentaje PLANO pactado se respeta tal cual: es el trato firmado", () => {
    const c = comisionDeVenta({ viaje: { precioUnitario: 500, cantidad: 1 } }, { tipo: "plano", pct: 20 });
    expect(c.monto).toBe(100);
    const chico = comisionDeVenta({ viaje: { precioUnitario: 100, cantidad: 1 } }, { tipo: "plano", pct: 10 });
    expect(chico.monto).toBe(10);
  });

  it("lo que se separa para Numan es comisión + IVA de la comisión: $209.99 al 12 % y $140.00 al 8 %", () => {
    const de = (escala: "venta" | "plataforma") =>
      Math.round(comisionDeVenta({ viaje: { precioUnitario: base, cantidad: 1 } }, { tipo: "escala", escala }).monto * (1 + IVA) * 100) / 100;
    expect(de("venta")).toBe(209.99);
    expect(de("plataforma")).toBe(140);
  });
});
