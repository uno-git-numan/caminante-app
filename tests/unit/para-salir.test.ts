// EL CANDADO MOVIDO A LA SALIDA (convenio v3.5, Anexo B; 23 nov 2026).
//
// Para vender basta el expediente de arranque. Las pólizas, la credencial del
// guía y los permisos se entregan antes de la primera salida y tienen que estar
// vigentes el día en que inicia: «sin ellos la salida no se realiza». Esto es
// lo que le dice a cada salida qué le falta.
import { describe, expect, it } from "vitest";
import { armarExpediente } from "@/lib/operadores/expediente";
import { faltaParaSalir } from "@/lib/operadores/para-salir";
import { loQueFalta, tituloDeLoQueFalta, type ParaLoQueFalta } from "@/lib/operadores/lo-que-falta";
import { requisitosDe } from "@/lib/operadores/actividades";

const doc = (documento: string, actividad: string | null, estado = "aprobado", vence_at: string | null = null) =>
  ({ actividad, documento, estado, motivo: null, vence_at });
const arranque = [doc("csf", null), doc("id-responsable", null, "aprobado", "2099-12-31")];
const SENDERISMO = [{ actividad: "senderismo", estado: "incompleta", motivo: null }];

describe("faltaParaSalir", () => {
  it("con sólo el arranque puede vender, y a la salida le faltan la póliza de responsabilidad civil y la credencial del guía", () => {
    const e = armarExpediente(SENDERISMO, arranque, undefined, "fisica");
    expect(e.completo).toBe(true);
    const f = faltaParaSalir(e, "senderismo", "2027-03-13");
    expect(f).toHaveLength(2);
    expect(f.join(" ")).toMatch(/responsabilidad civil/);
    // La póliza de accidentes salió del catálogo el 24 nov 2026.
    expect(f.join(" ")).not.toMatch(/accidentes/);
    expect(f.join(" ")).toMatch(/Credencial de guía/);
  });

  it("con todo entregado y vigente, no falta nada", () => {
    const e = armarExpediente(
      SENDERISMO,
      [...arranque, doc("poliza-rc", null, "aprobado", "2027-12-31"), doc("nom09-senderismo", "senderismo", "aprobado", "2028-01-01")],
      undefined,
      "fisica",
    );
    expect(faltaParaSalir(e, "senderismo", "2027-03-13")).toEqual([]);
  });

  it("una póliza que vence ANTES del día de la salida no la cubre, aunque hoy esté vigente", () => {
    const e = armarExpediente(
      SENDERISMO,
      [...arranque, doc("poliza-rc", null, "aprobado", "2027-03-01"), doc("nom09-senderismo", "senderismo", "aprobado", "2028-01-01")],
      undefined,
      "fisica",
    );
    const f = faltaParaSalir(e, "senderismo", "2027-03-13");
    expect(f).toHaveLength(1);
    expect(f[0]).toMatch(/responsabilidad civil.*vence antes de la salida/);
    // Para una salida anterior al vencimiento, sí la cubre.
    expect(faltaParaSalir(e, "senderismo", "2027-02-20")).toEqual([]);
  });

  it("un documento rechazado cuenta como faltante; uno en revisión no (nos toca a nosotros)", () => {
    const e = armarExpediente(
      SENDERISMO,
      [...arranque, doc("poliza-rc", null, "rechazado"), doc("nom09-senderismo", "senderismo", "aprobado", "2028-01-01")],
      undefined,
      "fisica",
    );
    const f = faltaParaSalir(e, "senderismo", "2027-03-13");
    expect(f).toHaveLength(1);
    expect(f[0]).toMatch(/rechazado/);
  });

  it("lo que sólo se declara nunca aparece como faltante de una salida", () => {
    const e = armarExpediente([{ actividad: "alta-montana", estado: "incompleta", motivo: null }], arranque, undefined, "fisica");
    const f = faltaParaSalir(e, "alta-montana", "2027-03-13").join(" ");
    expect(f).not.toMatch(/Plan de aclimatación/);
    expect(f).toMatch(/rescate en montaña/);
  });

  it("vende con dispensa una actividad que ni declaró: lo propio de esa actividad falta entero", () => {
    const e = armarExpediente([], arranque, undefined, "fisica");
    const f = faltaParaSalir(e, "campamento", "2027-03-13");
    for (const d of requisitosDe("campamento").propios) expect(f).toContain(d.nombre);
  });

  it("el permiso de área protegida se exige, salvo que la operadora declare que no aplica a sus salidas", () => {
    const acts = [{ actividad: "observacion-naturaleza", estado: "incompleta", motivo: null }];
    const a = requisitosDe("observacion-naturaleza").propios.find((d) => d.slug === "permiso-anp");
    expect(a?.opcional).not.toBe(true);

    const sin = armarExpediente(acts, arranque, undefined, "fisica");
    expect(faltaParaSalir(sin, "observacion-naturaleza", "2027-03-13").join(" ")).toMatch(/área natural protegida/);
    const permiso = sin.actividades[0].propios.find((d) => d.slug === "permiso-anp")!;
    expect(permiso.puedeNoAplicar).toBe(true);
    expect(permiso.noAplica).toBeNull();

    const declarado = new Map([["observacion-naturaleza|permiso-anp", "2026-11-23T18:00:00Z"]]);
    const con = armarExpediente(acts, arranque, undefined, "fisica", declarado);
    expect(faltaParaSalir(con, "observacion-naturaleza", "2027-03-13").join(" ")).not.toMatch(/área natural protegida/);
    expect(con.actividades[0].propios.find((d) => d.slug === "permiso-anp")!.noAplica).toEqual({ declaradoAt: "2026-11-23T18:00:00Z" });
    expect(con.actividades[0].faltan).toBe(sin.actividades[0].faltan - 1);
  });

  it("de la credencial del guía o de una póliza NO se puede declarar que no aplica", () => {
    const e = armarExpediente(SENDERISMO, arranque, undefined, "fisica", new Map([["senderismo|nom09-senderismo", "2026-11-23T18:00:00Z"]]));
    const cred = e.actividades[0].propios.find((d) => d.slug === "nom09-senderismo")!;
    expect(cred.puedeNoAplicar).toBe(false);
    expect(cred.noAplica).toBeNull();
    expect(faltaParaSalir(e, "senderismo", "2027-03-13").join(" ")).toMatch(/Credencial de guía/);
  });

  it("si subió el permiso, manda el permiso y la declaración ya no cuenta", () => {
    const acts = [{ actividad: "observacion-naturaleza", estado: "incompleta", motivo: null }];
    const e = armarExpediente(
      acts,
      [...arranque, doc("permiso-anp", "observacion-naturaleza", "en_revision", "2027-12-31")],
      undefined,
      "fisica",
      new Map([["observacion-naturaleza|permiso-anp", "2026-11-23T18:00:00Z"]]),
    );
    expect(e.actividades[0].propios.find((d) => d.slug === "permiso-anp")!.noAplica).toBeNull();
  });
});

describe("la lista de Mi alta: lo que no detiene la venta se dice, pero no se cuenta", () => {
  const seis = ["comision", "convenio", "fiscal", "connect", "panel", "experiencia"].map((clave) => ({
    clave, nombre: clave, cumplido: true, detalle: "", toca: "operadora" as const, bloquea: "cobrar" as const,
  }));
  const base: ParaLoQueFalta = {
    candados: seis,
    expediente: { completo: true, vacio: false, faltanTotal: 0, paraSalir: { faltan: 3 }, rnt: { estado: "falta" } },
    conDispensa: false,
    borradores: 0,
    cobroEnPlataforma: true,
  };

  it("con todo lo de vender en verde, enseña lo de la salida y el registro de turismo sin contarlos", () => {
    const f = loQueFalta(base);
    expect(f.map((x) => x.clave)).toEqual(["para-salir", "rnt"]);
    expect(f.every((x) => x.detieneLaVenta === false)).toBe(true);
    expect(tituloDeLoQueFalta(f)).toBe("Ya puedes vender. Esto es lo que sigue");
  });

  it("si además falta algo para vender, el título cuenta sólo eso", () => {
    const f = loQueFalta({ ...base, expediente: { ...base.expediente!, completo: false, faltanTotal: 1 } });
    expect(f[0].clave).toBe("expediente");
    expect(tituloDeLoQueFalta(f)).toBe("Te falta una cosa para vender");
  });

  it("sin pendientes de salida ni de registro, la lista queda vacía", () => {
    expect(loQueFalta({ ...base, expediente: { completo: true, vacio: false, faltanTotal: 0, paraSalir: { faltan: 0 }, rnt: { estado: "aprobado" } } })).toEqual([]);
  });
});
