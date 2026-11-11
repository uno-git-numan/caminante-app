// LA CLABE (lib/fiscal/clabe.ts): validar el dígito de control y sacar el banco
// de sus tres primeros dígitos, para no preguntarlo.
import { describe, expect, it } from "vitest";
import { clabeEnmascarada, digitoControl, validarClabe } from "@/lib/fiscal/clabe";

// La CLABE de prueba que Stripe acepta en modo test (tests/e2e/connect.test.ts).
const PRUEBA = "000000001234567897";

describe("validarClabe", () => {
  it("el dígito de control: la CLABE de prueba de Stripe cuadra", () => {
    expect(digitoControl(PRUEBA.slice(0, 17))).toBe(7);
    expect(validarClabe(PRUEBA)).toMatchObject({ ok: true, clabe: PRUEBA, clave: "000", banco: null });
  });
  it("un dígito cambiado ⇒ inválida", () => {
    expect(validarClabe("000000001234567898").ok).toBe(false);
  });
  it("acepta espacios y guiones al pegarla", () => {
    expect(validarClabe("0000 0000 1234 5678 97").ok).toBe(true);
  });
  it("no son 18 dígitos ⇒ lo dice", () => {
    const r = validarClabe("12345");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.porque).toMatch(/18/);
  });
  it("el banco sale de los 3 primeros: 012 es BBVA", () => {
    const base = "01218000123456789";
    const r = validarClabe(base + digitoControl(base));
    expect(r).toMatchObject({ ok: true, clave: "012", banco: "BBVA MEXICO" });
  });
  it("un prefijo que no está en el listado de Banxico NO se adivina", () => {
    const base = "99918000123456789";
    const r = validarClabe(base + digitoControl(base));
    expect(r).toMatchObject({ ok: true, banco: null });
  });
});

describe("clabeEnmascarada", () => {
  it("sólo enseña los últimos 4", () => {
    expect(clabeEnmascarada(PRUEBA)).toBe("•••• 7897");
  });
});
