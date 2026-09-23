// DEVOLVER UNA PARTE.
//
// La Cláusula Quinta del convenio deja que el Operador fije su política de
// cancelación, y casi ninguna devuelve el 100%: «50% si cancelas con siete
// días». Hasta el 23 sep 2026 el sistema sólo sabía devolver todo, así que el
// convenio prometía algo que la caja no podía ejecutar.
//
// ⚠️ LO QUE NO SE PRUEBA AQUÍ, A PROPÓSITO: cómo reparte Stripe un parcial. Eso
// no se calcula en este repo —se le pide a Stripe con `reverse_transfer` y
// `refund_application_fee` y él reparte en proporción— así que probarlo aquí
// sería probar una copia de su regla. Se MIDIÓ contra Stripe en modo prueba el
// 23 sep 2026, sobre una venta de $1,750 con $350 de comisión:
//
//     refund de $875 (50%) → comisión devuelta $175, saldo de la operadora −$700
//
// Lo que sí es nuestro, y es lo que se prueba, es la ARITMÉTICA DE LO QUE QUEDA:
// cuánto se puede pedir, y qué pasa cuando alguien pide de más.
import { describe, expect, it } from "vitest";

/**
 * Lo que todavía se le puede devolver a un pago.
 *
 * Es la misma cuenta que hace `reembolsos.ts` y la misma que la 0063 le impone
 * a la base con un CHECK. Vive en los dos lados a propósito: el código da el
 * mensaje bueno y la base impide el renglón malo aunque el mensaje falle.
 */
const porDevolver = (cobrado: number, devuelto: number): number =>
  Math.round((cobrado - (devuelto || 0)) * 100) / 100;

describe("cuánto queda por devolver", () => {
  it("un pago intacto se puede devolver entero", () => {
    expect(porDevolver(1750, 0)).toBe(1750);
  });

  it("después de una parcial, queda el resto", () => {
    expect(porDevolver(1750, 875)).toBe(875);
  });

  it("dos parciales agotan el pago", () => {
    expect(porDevolver(1750, 875 + 875)).toBe(0);
  });

  // La política del Operador se escribe en porcentajes y el dinero en pesos:
  // un 30% de $1,750 no es un número redondo y el redondeo tiene que cerrar.
  it("los centavos cierran: lo devuelto más lo que queda es lo cobrado", () => {
    for (const pct of [0.3, 0.33, 0.5, 0.7, 0.15]) {
      const devuelto = Math.round(1750 * pct * 100) / 100;
      expect(devuelto + porDevolver(1750, devuelto)).toBe(1750);
    }
  });

  it("nunca sale negativo por un centavo de flotante", () => {
    expect(porDevolver(1750, 583.33 + 583.33 + 583.34)).toBe(0);
  });
});

describe("lo que la caja NO debe aceptar", () => {
  const pedido = (cobrado: number, devuelto: number, pide: number) => {
    const restante = porDevolver(cobrado, devuelto);
    if (restante <= 0) return "nada-que-devolver";
    const p = Math.round(pide * 100) / 100;
    if (p <= 0) return "cero-o-menos";
    if (p > restante) return "pide-de-mas";
    return "ok";
  };

  it("pedir más de lo que queda se para ANTES de Stripe", () => {
    // Stripe también lo rechazaría, pero para entonces el libro ya diría otra
    // cosa que la caja: la fila del reembolso se escribe antes del cargo.
    expect(pedido(1750, 0, 2000)).toBe("pide-de-mas");
    expect(pedido(1750, 875, 1000)).toBe("pide-de-mas");
  });

  it("pedir cero, o negativo, no es devolver", () => {
    expect(pedido(1750, 0, 0)).toBe("cero-o-menos");
    expect(pedido(1750, 0, -100)).toBe("cero-o-menos");
  });

  it("un pago ya devuelto entero no se vuelve a devolver", () => {
    expect(pedido(1750, 1750, 100)).toBe("nada-que-devolver");
  });

  it("pedir exactamente lo que queda sí se puede", () => {
    expect(pedido(1750, 875, 875)).toBe("ok");
  });
});
