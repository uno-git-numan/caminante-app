import { describe, expect, it } from "vitest";
import { cuantasMeTocan, loQueFalta, tituloDeLoQueFalta, type ParaLoQueFalta } from "@/lib/operadores/lo-que-falta";
import type { Candado } from "@/lib/plataforma/etapas";

// La lista única de «esto te falta para vender» (23 nov 2026). Sale de los
// mismos seis candados que ve la casa: aquí sólo se prueba el orden, a quién
// le toca cada renglón y que no se ofrezca un botón que el candado niega.

const c = (clave: string, cumplido: boolean, toca: Candado["toca"] = "operadora", detalle = "detalle"): Candado => ({
  clave,
  nombre: clave,
  cumplido,
  detalle,
  toca,
  bloquea: "cobrar",
});

const seis = (abiertos: string[], toca: Partial<Record<string, Candado["toca"]>> = {}): Candado[] =>
  ["comision", "convenio", "fiscal", "connect", "panel", "experiencia"].map((k) =>
    c(k, !abiertos.includes(k), toca[k] ?? "operadora"),
  );

const base: ParaLoQueFalta = {
  candados: seis([]),
  expediente: { completo: true, vacio: false, faltanTotal: 0 },
  conDispensa: false,
  borradores: 0,
  cobroEnPlataforma: false,
};

describe("lo que falta para vender", () => {
  it("con los seis en verde y el expediente completo no falta nada", () => {
    expect(loQueFalta(base)).toEqual([]);
  });

  it("va en el orden en que se hace: papeles, constancia, firma, cuenta, panel, experiencia", () => {
    const falta = loQueFalta({
      ...base,
      candados: seis(["convenio", "fiscal", "connect", "panel", "experiencia"]),
      expediente: { completo: false, vacio: false, faltanTotal: 3 },
    });
    expect(falta.map((f) => f.clave)).toEqual(["expediente", "fiscal", "convenio", "connect", "panel", "experiencia"]);
  });

  it("el expediente dice cuántos documentos faltan, y en singular cuando es uno", () => {
    const varios = loQueFalta({ ...base, expediente: { completo: false, vacio: false, faltanTotal: 3 } })[0];
    expect(varios.detalle).toContain("Faltan 3 documentos");
    expect(varios.href).toBe("/caminante/admin/mi-alta/expediente");
    const uno = loQueFalta({ ...base, expediente: { completo: false, vacio: false, faltanTotal: 1 } })[0];
    expect(uno.detalle).toContain("Falta 1 documento ");
  });

  it("entregado todo y sin aprobar, el expediente es pendiente de la casa", () => {
    const [f] = loQueFalta({ ...base, expediente: { completo: false, vacio: false, faltanTotal: 0 } });
    expect(f.toca).toBe("casa");
    expect(cuantasMeTocan([f])).toBe(0);
  });

  it("sin actividad declarada manda a empezar el expediente", () => {
    const [f] = loQueFalta({ ...base, expediente: { completo: false, vacio: true, faltanTotal: 0 } });
    expect(f.accion).toBe("Empezar");
    expect(f.toca).toBe("operadora");
  });

  it("con dispensa el expediente abierto se sigue enseñando", () => {
    const [f] = loQueFalta({ ...base, conDispensa: true, expediente: { completo: false, vacio: false, faltanTotal: 2 } });
    expect(f.clave).toBe("expediente");
    expect(f.detalle).toContain("dispensa");
  });

  it("sin fila de operadora (en el embudo) el expediente no aparece", () => {
    expect(loQueFalta({ ...base, expediente: null })).toEqual([]);
  });

  it("el convenio sin texto publicado es de la casa y no lleva botón", () => {
    const [f] = loQueFalta({ ...base, candados: seis(["convenio"], { convenio: "casa" }) });
    expect(f).toMatchObject({ clave: "convenio", toca: "casa", href: null, accion: null });
  });

  it("el convenio por firmar manda a firmarlo", () => {
    const [f] = loQueFalta({ ...base, candados: seis(["convenio"]) });
    expect(f).toMatchObject({ toca: "operadora", href: "/caminante/admin/mi-alta/convenio", accion: "Firmar" });
  });

  it("la cuenta de cobro es de la casa mientras el alta en la plataforma esté apagada", () => {
    const apagada = loQueFalta({ ...base, candados: seis(["connect"]) })[0];
    expect(apagada.toca).toBe("casa");
    const prendida = loQueFalta({ ...base, candados: seis(["connect"]), cobroEnPlataforma: true })[0];
    expect(prendida).toMatchObject({ toca: "operadora", accion: "Conectar", href: "/caminante/admin/mi-alta/cobrar" });
  });

  it("no ofrece crear una experiencia antes de la firma: «Armar» se prende al firmar", () => {
    const falta = loQueFalta({ ...base, candados: seis(["convenio", "experiencia"]) });
    const exp = falta.find((f) => f.clave === "experiencia")!;
    expect(exp.href).toBeNull();
    expect(exp.detalle).toContain("firmes");
  });

  it("ya firmado: sin borradores manda a crear, con borradores a abrirlos", () => {
    const crear = loQueFalta({ ...base, candados: seis(["experiencia"]) })[0];
    expect(crear).toMatchObject({ href: "/caminante/admin/experiencias/nueva", accion: "Crear" });
    const abrir = loQueFalta({ ...base, candados: seis(["experiencia"]), borradores: 2 })[0];
    expect(abrir).toMatchObject({ href: "/caminante/admin/eventos", accion: "Abrir" });
    expect(abrir.detalle).toContain("2 en borrador");
  });

  it("el título cuenta sólo lo que le toca a ella", () => {
    const tres = loQueFalta({
      ...base,
      candados: seis(["convenio", "fiscal", "panel"], { panel: "casa" }),
    });
    expect(tituloDeLoQueFalta(tres)).toBe("Te faltan 2 cosas para vender");
    expect(tituloDeLoQueFalta(loQueFalta({ ...base, candados: seis(["fiscal"]) }))).toBe("Te falta una cosa para vender");
    expect(tituloDeLoQueFalta(loQueFalta({ ...base, candados: seis(["panel"], { panel: "casa" }) }))).toBe(
      "Lo que falta para que vendas ya no depende de ti",
    );
  });
});
