import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  avisoDeCancelacionPorCupo,
  cambioQuePerjudica,
  formaDePagoDe,
  clausulaDeReserva,
  clausulaDeSalida,
  clausulaVistaDe,
  diasDeDuracion,
  pisoDeConfirmacion,
  puedeCancelarPorCupo,
  type SalidaParaClausula,
} from "@/lib/cancelacion/cupo-minimo";
import {
  BLOQUE_MINIMO_DE_FICHA,
  bloqueCupoMinimo,
  bloquesDeFicha,
  bloquesPolitica,
  renglonMinimoDeFicha,
  renglonMinimoDelComprobante,
  resumenPolitica,
  SALIDA_CONFIRMADA,
  textoPolitica,
} from "@/lib/cancelacion/politica";
import { pruebaComoMetadata, pruebaDeMetadata, pruebaDePolitica } from "@/lib/cancelacion/prueba";

// D26 · la cláusula de cupo mínimo.

const clausula = { minimo: 6, limite: "2026-12-01" };

describe("el texto, tal cual lo escribió legal (§7.1)", () => {
  // El documento trae N y la fecha como marcadores; se sustituyen y se compara.
  const legal = readFileSync("design/legal/POLITICA-CANCELACION-CLIENTE-2026-11.md", "utf8")
    .replace(/\n> ?/g, "\n")
    .replace(/\s+/g, " ")
    .replace(/\*\*N personas\*\*/g, "**6 personas**")
    .replace(/\*\*\[día\] de \[mes\] de \[año\]\*\*/g, "**1 de diciembre de 2026**")
    .replace(/necesita N personas/g, "necesita 6 personas")
    .replace(/mínimo de N personas/g, "mínimo de 6 personas")
    .replace(/\[día\] de \[mes\] de \[año\]/g, "1 de diciembre de 2026")
    .replace(/\[día\] de \[mes\]/g, "1 de diciembre");

  it("el bloque «Si no se junta el grupo mínimo», renglón por renglón", () => {
    const b = bloqueCupoMinimo(clausula);
    expect(legal).toContain(`**${b.titulo}**`);
    for (const r of b.renglones) expect(legal).toContain(r);
  });

  it("el tercer renglón del resumen y el renglón del comprobante", () => {
    expect(legal).toContain(resumenPolitica("estandar", clausula)[2]);
    expect(legal).toContain(renglonMinimoDelComprobante(clausula));
  });

  it("va después de «Si la salida se cancela» y antes de «Cómo se devuelve»", () => {
    const titulos = bloquesPolitica("estandar", clausula).map((b) => b.titulo);
    expect(titulos).toEqual(["Si cancelas tú", "Tu derecho a arrepentirte", "Si la salida se cancela", "Si no se junta el grupo mínimo", "Cómo se devuelve"]);
  });

  it("sin cláusula el texto es idéntico al de antes: la huella de esas reservas no cambia", () => {
    expect(bloquesPolitica("estandar", null)).toEqual(bloquesPolitica("estandar"));
    expect(textoPolitica("expedicion", null)).toBe(textoPolitica("expedicion"));
    expect(resumenPolitica("estandar")[2]).toBe("Si la salida se cancela, te devolvemos el 100 %.");
    expect(pruebaDePolitica("estandar", null)?.politica_hash).toBe(pruebaDePolitica("estandar")?.politica_hash);
  });
});

describe("la huella y la copia en la reserva (§7.4)", () => {
  it("la huella cubre el texto con el mínimo y la fecha ya escritos", () => {
    const sin = pruebaDePolitica("estandar", null);
    const con = pruebaDePolitica("estandar", clausula);
    const otra = pruebaDePolitica("estandar", { minimo: 5, limite: "2026-12-01" });
    expect(con?.politica_hash).not.toBe(sin?.politica_hash);
    expect(con?.politica_hash).not.toBe(otra?.politica_hash);
    expect(con).toMatchObject({ clausula_minimo: 6, clausula_limite: "2026-12-01" });
    expect(sin && "clausula_minimo" in sin).toBe(false);
  });

  it("viaja por la metadata del cobro como texto y vuelve igual", () => {
    const p = pruebaDePolitica("estandar", clausula, new Date("2026-11-20T18:00:00Z"));
    const md = pruebaComoMetadata(p);
    expect(Object.values(md).every((v) => typeof v === "string")).toBe(true);
    expect(pruebaDeMetadata(md)).toEqual(p);
  });

  it("una cláusula a medias o mal formada en la metadata no cuenta", () => {
    const base = pruebaComoMetadata(pruebaDePolitica("estandar", null));
    expect(pruebaDeMetadata({ ...base, clausula_minimo: "6" })).not.toHaveProperty("clausula_minimo");
    expect(pruebaDeMetadata({ ...base, clausula_minimo: "1", clausula_limite: "2026-12-01" })).not.toHaveProperty("clausula_minimo");
    expect(pruebaDeMetadata({ ...base, clausula_minimo: "6", clausula_limite: "mañana" })).not.toHaveProperty("clausula_limite");
  });

  it("la reserva trae la cláusula sólo si guardó los dos datos", () => {
    expect(clausulaDeReserva({ clausula_minimo: 6, clausula_limite: "2026-12-01" })).toEqual(clausula);
    expect(clausulaDeReserva({ clausula_minimo: 6, clausula_limite: null })).toBeNull();
    expect(clausulaDeReserva({ clausula_minimo: null, clausula_limite: null })).toBeNull();
    expect(clausulaDeReserva(null)).toBeNull();
  });

  it("lo que la pantalla enseñó se compara como texto corto", () => {
    expect(clausulaVistaDe(clausula)).toBe("6|2026-12-01");
    expect(clausulaVistaDe(null)).toBe("");
  });
});

describe("el piso de la fecha según la duración (§7.3)", () => {
  it("cuenta los días de inicio y fin", () => {
    expect(diasDeDuracion("2026-12-12T12:00:00Z", null)).toBe(1);
    expect(diasDeDuracion("2026-12-12T12:00:00Z", "2026-12-12T23:00:00Z")).toBe(1);
    expect(diasDeDuracion("2026-12-12T12:00:00Z", "2026-12-13T20:00:00Z")).toBe(2);
    expect(diasDeDuracion("2026-12-10T12:00:00Z", "2026-12-16T20:00:00Z")).toBe(7);
  });

  it("menos de dos días: 48 horas antes del inicio", () => {
    // Sale el sábado 12 dic a las 7:00 CDMX. 48 h antes es el jueves 10 a las
    // 7:00; «a más tardar ese día» llega a las 23:59, así que el último día
    // válido es el miércoles 9.
    expect(pisoDeConfirmacion("2026-12-12T07:00:00-06:00", null).ultimoDia).toBe("2026-12-09");
  });

  it("de dos a seis días: 7 días naturales antes", () => {
    expect(pisoDeConfirmacion("2026-12-12T07:00:00-06:00", "2026-12-13T18:00:00-06:00").ultimoDia).toBe("2026-12-05");
    expect(pisoDeConfirmacion("2026-12-10T07:00:00-06:00", "2026-12-15T18:00:00-06:00").ultimoDia).toBe("2026-12-03"); // seis días
  });

  it("más de seis días: 20 días naturales antes", () => {
    expect(pisoDeConfirmacion("2026-12-10T07:00:00-06:00", "2026-12-16T18:00:00-06:00").ultimoDia).toBe("2026-11-20"); // siete días
  });
});

describe("cuándo está activa la cláusula en una salida", () => {
  // Dos días, 12–13 dic: la fecha tiene que ser a más tardar el 5 dic.
  const salida: SalidaParaClausula = {
    minimo: 6,
    confirmacionLimite: "2026-12-01",
    startsAt: "2026-12-12T07:00:00-06:00",
    endsAt: "2026-12-13T18:00:00-06:00",
    confirmadaAt: null,
    status: "open",
  };
  const hoy = new Date("2026-11-20T10:00:00-06:00");

  it("con mínimo, fecha dentro del piso, sin confirmar y antes de la fecha", () => {
    expect(clausulaDeSalida(salida, hoy)).toEqual({ activa: true, clausula });
    expect(clausulaDeSalida({ ...salida, confirmacionLimite: "2026-12-05" }, hoy).activa).toBe(true); // justo en el piso
  });

  it("sin mínimo o sin fecha no hay cláusula", () => {
    expect(clausulaDeSalida({ ...salida, minimo: null }, hoy)).toMatchObject({ activa: false, razon: "sin-datos" });
    expect(clausulaDeSalida({ ...salida, confirmacionLimite: null }, hoy)).toMatchObject({ activa: false, razon: "sin-datos" });
  });

  it("un mínimo de una persona no es un grupo mínimo", () => {
    expect(clausulaDeSalida({ ...salida, minimo: 1 }, hoy)).toMatchObject({ activa: false, razon: "minimo-de-uno" });
  });

  it("una fecha más tardía que el piso NO activa la cláusula (y no se «arregla» sola)", () => {
    const e = clausulaDeSalida({ ...salida, confirmacionLimite: "2026-12-06" }, hoy);
    expect(e).toMatchObject({ activa: false, razon: "fuera-del-piso" });
    expect(e.activa ? "" : e.porque).toMatch(/2026-12-05/);
  });

  it("una salida confirmada o cancelada ya no la tiene", () => {
    expect(clausulaDeSalida({ ...salida, confirmadaAt: "2026-11-25T10:00:00Z" }, hoy)).toMatchObject({ activa: false, razon: "confirmada" });
    expect(clausulaDeSalida({ ...salida, status: "cancelled" }, hoy)).toMatchObject({ activa: false, razon: "cancelada" });
  });

  it("pasada la fecha, quien compre ya no lleva la cláusula", () => {
    expect(clausulaDeSalida(salida, new Date("2026-12-01T23:30:00-06:00")).activa).toBe(true); // todavía es el día límite en CDMX
    expect(clausulaDeSalida(salida, new Date("2026-12-02T00:10:00-06:00"))).toMatchObject({ activa: false, razon: "vencida" });
  });
});

describe("cancelar por cupo mínimo (§7.6)", () => {
  const salida: SalidaParaClausula = {
    minimo: 6,
    confirmacionLimite: "2026-12-01",
    startsAt: "2026-12-12T07:00:00-06:00",
    endsAt: "2026-12-13T18:00:00-06:00",
    confirmadaAt: null,
    status: "open",
  };

  it("se puede con menos pagados que el mínimo y a más tardar el día de la fecha", () => {
    expect(puedeCancelarPorCupo(salida, 3, new Date("2026-11-28T10:00:00-06:00"))).toEqual({ ok: true, clausula });
    expect(puedeCancelarPorCupo(salida, 5, new Date("2026-12-01T22:00:00-06:00")).ok).toBe(true);
  });

  it("al día siguiente ya no: es causa de quien opera", () => {
    expect(puedeCancelarPorCupo(salida, 3, new Date("2026-12-02T08:00:00-06:00")).ok).toBe(false);
  });

  it("si ya se juntó el mínimo no hay falta de grupo", () => {
    expect(puedeCancelarPorCupo(salida, 6, new Date("2026-11-28T10:00:00-06:00"))).toMatchObject({ ok: false });
  });

  it("una salida confirmada ya no se cancela por cupo", () => {
    expect(puedeCancelarPorCupo({ ...salida, confirmadaAt: "2026-11-25T10:00:00Z" }, 2, new Date("2026-11-28T10:00:00-06:00")).ok).toBe(false);
  });

  it("sin cláusula no existe «cupo mínimo»", () => {
    expect(puedeCancelarPorCupo({ ...salida, confirmacionLimite: null }, 1, new Date("2026-11-28T10:00:00-06:00")).ok).toBe(false);
  });
});

describe("el candado: no se empeora lo que alguien ya aceptó (§7.4)", () => {
  const copias = [clausula, { minimo: 5, limite: "2026-11-28" }];

  it("sin reservas con cláusula se puede cambiar lo que sea", () => {
    expect(cambioQuePerjudica({ minimo: 12, confirmacionLimite: "2026-12-05" }, [])).toBeNull();
  });

  it("no se sube el mínimo por encima del más bajo que alguien aceptó", () => {
    expect(cambioQuePerjudica({ minimo: 6, confirmacionLimite: "2026-11-28" }, copias)).toMatch(/mínimo era 5/);
    expect(cambioQuePerjudica({ minimo: 5, confirmacionLimite: "2026-11-28" }, copias)).toBeNull();
  });

  it("no se atrasa la fecha más allá de la más temprana que alguien aceptó", () => {
    expect(cambioQuePerjudica({ minimo: 5, confirmacionLimite: "2026-11-29" }, copias)).toMatch(/2026-11-28/);
  });

  it("bajar el mínimo, adelantar la fecha o quitar la cláusula sí: favorece al cliente", () => {
    expect(cambioQuePerjudica({ minimo: 4, confirmacionLimite: "2026-11-25" }, copias)).toBeNull();
    expect(cambioQuePerjudica({ minimo: null, confirmacionLimite: null }, copias)).toBeNull();
  });
});

describe("la ficha: la oferta también dice el mínimo (§7.8)", () => {
  const legal = readFileSync("design/legal/POLITICA-CANCELACION-CLIENTE-2026-11.md", "utf8")
    .replace(/\n> ?/g, "\n")
    .replace(/\s+/g, " ")
    .replace(/Mínimo N personas/g, "Mínimo 6 personas")
    .replace(/\[día\] de \[mes\]/g, "1 de diciembre");

  it("el renglón junto a la fecha y «Salida confirmada», tal cual", () => {
    expect(legal).toContain(renglonMinimoDeFicha(clausula));
    expect(legal).toContain(SALIDA_CONFIRMADA);
  });

  it("el bloque informativo, renglón por renglón", () => {
    for (const r of BLOQUE_MINIMO_DE_FICHA.renglones) expect(legal).toContain(r);
  });

  it("sólo aparece si alguna fecha publicada tiene la cláusula activa", () => {
    expect(bloquesDeFicha("estandar", false)).toEqual(bloquesPolitica("estandar"));
    expect(bloquesDeFicha("estandar", true).map((b) => b.titulo)).toEqual([
      "Si cancelas tú",
      "Tu derecho a arrepentirte",
      "Si la salida se cancela",
      "Si no se junta el grupo mínimo",
      "Cómo se devuelve",
    ]);
  });

  it("es informativo: no cambia el texto que se acepta ni su huella", () => {
    expect(textoPolitica("estandar")).not.toContain("Algunas fechas de esta experiencia");
    expect(pruebaDePolitica("estandar", null)?.politica_hash).toBe(pruebaDePolitica("estandar")?.politica_hash);
  });
});

describe("el aviso de cancelación por cupo, según a quién le llega (§7.6 y §7.10)", () => {
  const legal = readFileSync("design/legal/POLITICA-CANCELACION-CLIENTE-2026-11.md", "utf8").replace(/\n> ?/g, "\n").replace(/\s+/g, " ");
  const base = { viaje: "Sardine Run · Dic 10-13", clausula, pagados: 3 };
  const plano = (t: string) => t.replace(/\*\*/g, "");

  it("con cláusula y tarjeta: el texto de legal, con «como te lo dijimos antes de pagar»", () => {
    const [uno, dos, ...mas] = avisoDeCancelacionPorCupo({ ...base, traeClausula: true, forma: "tarjeta" });
    expect(uno).toBe("Para **Sardine Run · Dic 10-13** hacían falta 6 personas y al 1 de diciembre de 2026 éramos 3. Como te lo dijimos antes de pagar, la salida se cancela.");
    expect(legal).toContain("Como te lo dijimos antes de pagar, la salida se cancela. Hoy mismo pedimos la devolución del **100 %** de lo que pagaste, a la misma forma de pago, y te avisamos en cuanto quede hecha. Si quieres, te ayudamos a pasarte a otra fecha.");
    expect(dos).toBe("Hoy mismo pedimos la devolución del **100 %** de lo que pagaste, a la misma forma de pago, y te avisamos en cuanto quede hecha. Si quieres, te ayudamos a pasarte a otra fecha.");
    expect(mas).toEqual([]); // sin bonificación
  });

  it("sin cláusula: no se le dice «como te lo dijimos» y se le anuncia su bonificación", () => {
    const p = avisoDeCancelacionPorCupo({ ...base, traeClausula: false, forma: "tarjeta" });
    expect(p[0]).toMatch(/éramos 3\. La salida se cancela\.$/);
    expect(p.join(" ")).not.toContain("Como te lo dijimos");
    expect(legal).toContain(p[2]);
    expect(plano(p[2])).toMatch(/bonificación del 20 %.*CLABE y el nombre del titular.*5 días hábiles/);
  });

  it("pagó por transferencia: la devolución va por transferencia y se le pide la cuenta", () => {
    const p = avisoDeCancelacionPorCupo({ ...base, traeClausula: true, forma: "transferencia" });
    expect(legal).toContain("por transferencia, igual que pagaste. Respóndenos con la CLABE y el nombre del titular de la cuenta donde quieres recibirla.");
    expect(p[1]).toBe("Hoy mismo pedimos la devolución del **100 %** de lo que pagaste, por transferencia, igual que pagaste. Respóndenos con la CLABE y el nombre del titular de la cuenta donde quieres recibirla. Si quieres, te ayudamos a pasarte a otra fecha.");
    expect(p[1]).not.toContain("te avisamos en cuanto quede hecha");
    expect(p).toHaveLength(2);
  });

  it("pagó una parte con tarjeta y otra por transferencia: cada pago vuelve por donde entró", () => {
    const p = avisoDeCancelacionPorCupo({ ...base, traeClausula: true, forma: "mixta" });
    expect(legal).toContain("a la misma forma de pago de cada uno de tus pagos. Lo que pagaste con tarjeta vuelve a tu tarjeta. Para lo que pagaste por transferencia, respóndenos con la CLABE y el nombre del titular de la cuenta donde quieres recibirlo.");
    expect(p[1]).toBe(
      "Hoy mismo pedimos la devolución del **100 %** de lo que pagaste, a la misma forma de pago de cada uno de tus pagos. Lo que pagaste con tarjeta vuelve a tu tarjeta. Para lo que pagaste por transferencia, respóndenos con la CLABE y el nombre del titular de la cuenta donde quieres recibirlo. Si quieres, te ayudamos a pasarte a otra fecha.",
    );
    expect(p[1]).not.toContain("igual que pagaste");
  });

  it("la forma de pago sale de los cobros vivos: todos, ninguno o mezcla con tarjeta", () => {
    expect(formaDePagoDe(["stripe"])).toBe("tarjeta");
    expect(formaDePagoDe(["stripe", "stripe"])).toBe("tarjeta");
    expect(formaDePagoDe(["transferencia"])).toBe("transferencia");
    expect(formaDePagoDe(["transferencia", "efectivo", null])).toBe("transferencia");
    expect(formaDePagoDe(["stripe", "transferencia"])).toBe("mixta");
  });

  it("sin cláusula y por transferencia: las dos frases", () => {
    const p = avisoDeCancelacionPorCupo({ ...base, traeClausula: false, forma: "transferencia" });
    expect(p).toHaveLength(3);
    expect(p[1]).toContain("por transferencia, igual que pagaste");
    expect(p[2]).toContain("bonificación del 20 %");
  });
});
