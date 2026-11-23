// EL RESUMEN DE TÉRMINOS — su contenido, que ahora alimenta dos formatos.
//
// Viaja en PDF con la invitación a la llamada y se relee en HTML en el paso
// 01 de Mi alta. Los dos salen de `terminosDe`. Que el PDF no cambió al mudar
// el texto se demostró comparándolo descomprimido antes y después (24 sep
// 2026); estas pruebas fijan lo que no se puede perder en ningún formato.
import { describe, expect, it } from "vitest";
import { terminosDe } from "@/lib/operadores/terminos";
import { TASA_PCT } from "@/lib/operadores/comision";

const HOY = new Date("2026-09-24T12:00:00Z");
const base = { responsable: null, operadora: "Kéntro", llamada: null, actividades: [] as string[], rangoPrecio: null };

describe("terminosDe", () => {
  it("el PRIMER aviso dice que no es el convenio", () => {
    // Si este resumen se leyera como contrato, alguien podría argumentar que se
    // obligó con él. La advertencia va arriba, no en un pie de página.
    const aviso = terminosDe(base, HOY).find((b) => b.t === "aviso");
    expect(aviso && "titulo" in aviso ? aviso.titulo : "").toBe("Esto no es el convenio.");
  });

  it("la comisión son las dos tasas del motor, no un número tecleado", () => {
    const filas = terminosDe(base, HOY).filter((b) => b.t === "fila" && !b.encabezado);
    // Sin rango de precio no hay tabla de «tu caso»: la única fila es la de la comisión.
    expect(filas).toHaveLength(1);
    expect(JSON.stringify(filas[0])).toContain(`${TASA_PCT.venta}%`);
    expect(JSON.stringify(filas[0])).toContain(`${TASA_PCT.plataforma}%`);
  });

  it("ya no habla de tramos, escalas ni mínimos", () => {
    const texto = JSON.stringify(terminosDe({ ...base, rangoPrecio: "$5,001 a $15,000 MXN" }, HOY)).toLowerCase();
    for (const palabra of ["tramo", "escala ", "escalas", "mínimo $"]) expect(texto).not.toContain(palabra);
  });

  it("con un rango legible agrega «tu caso»; con uno ilegible, no inventa ejemplo", () => {
    const conRango = terminosDe({ ...base, rangoPrecio: "$5,001 a $15,000 MXN" }, HOY);
    expect(conRango.some((b) => b.t === "titulo" && b.texto === "Tu caso, con los números que nos diste")).toBe(true);
    const sinRango = terminosDe({ ...base, rangoPrecio: "depende" }, HOY);
    expect(sinRango.some((b) => b.t === "titulo" && b.texto.startsWith("Tu caso"))).toBe(false);
  });

  it("el pie lleva la fecha en que se genera", () => {
    const ult = terminosDe(base, HOY).at(-1);
    expect(ult && "texto" in ult ? ult.texto : "").toContain("24 de septiembre de 2026");
  });
});
