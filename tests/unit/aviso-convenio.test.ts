// «TUS DOCUMENTOS YA ESTÁN APROBADOS: SIGUE LA FIRMA» — cuándo sale y cuándo no.
//
// El correo del convenio salía al aprobar la solicitud y se quitó de ahí el 23
// nov 2026 (alta en cinco pasos). Su disparador es la aprobación que COMPLETA
// el expediente de arranque de quien no ha firmado. Lo que aquí se afirma es
// la palabra «completa»: que sale en esa transición y sólo en ésa, porque
// «completo y sin firma» sigue siendo verdad cada vez que después se aprueba
// una póliza, y un correo que se repite con cada papel deja de leerse.
import { beforeEach, describe, expect, it, vi } from "vitest";

const st = vi.hoisted(() => ({
  op: null as null | Record<string, unknown>,
  docs: [] as Record<string, unknown>[],
  versiones: [] as Record<string, unknown>[],
  /** Tabla cuya lectura falla. */
  falla: null as null | string,
  /** Lo que contesta Resend. */
  sale: true,
  consultas: 0,
  enviados: [] as { to: string; asunto: string; html: string; texto: string }[],
}));

vi.mock("@/lib/email/resend", () => ({
  sendViaResend: async (to: string, asunto: string, html: string, o?: { text?: string }) => {
    st.enviados.push({ to, asunto, html, texto: o?.text ?? "" });
    return st.sale;
  },
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: (tabla: string) => {
      st.consultas++;
      const error = st.falla === tabla ? { message: "sin red" } : null;
      const q: Record<string, unknown> = {};
      const enc = () => q;
      q.select = enc; q.eq = enc; q.is = enc; q.order = enc;
      q.maybeSingle = async () => ({ data: error ? null : tabla === "operators" ? st.op : null, error });
      q.then = (res: (v: unknown) => unknown) =>
        Promise.resolve({
          data: error ? null : tabla === "operator_documents" ? st.docs : tabla === "operator_agreement_versions" ? st.versiones : [],
          error,
        }).then(res);
      return q;
    },
  }),
}));

import {
  avisarConvenioSiCompletaArranque,
  completaElArranque,
  convenioParaAvisar,
  esDeArranque,
} from "@/lib/operadores/aviso-convenio";
import type { VersionConvenio } from "@/lib/operadores/convenio";

const doc = (documento: string, estado = "aprobado", vence_at: string | null = null, actividad: string | null = null) =>
  ({ actividad, documento, estado, motivo: null, vence_at });
const t = (documento: string, estadoAnterior = "en_revision", actividad: string | null = null) =>
  ({ operatorId: "op-1", actividad, documento, estadoAnterior });

const version = (o: Partial<VersionConvenio> = {}): VersionConvenio => ({
  version: "v3.5", orden: 35, tipo: "mayor", titulo: "Convenio de operación", texto: "…", hash: "h",
  vigenteDesde: "2026-11-23T00:00:00Z", publicadaAt: "2026-11-23T00:00:00Z", ...o,
});
/** La misma versión, como la devuelve la base. */
const filaVersion = (vigente_desde: string) => ({
  version: "v3.5", orden: 35, tipo: "mayor", titulo: "Convenio de operación", texto: "…", hash: "h",
  vigente_desde, publicada_at: "2026-11-23T00:00:00Z",
});

describe("qué documentos pueden completar el arranque", () => {
  it("la constancia y la identificación, de Lo general", () => {
    expect(esDeArranque(t("csf"))).toBe(true);
    expect(esDeArranque(t("id-responsable"))).toBe(true);
  });

  it("una póliza, el registro de turismo o un papel de una actividad, no", () => {
    expect(esDeArranque(t("poliza-rc"))).toBe(false);
    expect(esDeArranque(t("rnt"))).toBe(false);
    expect(esDeArranque(t("nom09-senderismo", "en_revision", "senderismo"))).toBe(false);
  });
});

describe("¿esta aprobación COMPLETA el arranque?", () => {
  it("la constancia llega al final: sí", () => {
    expect(completaElArranque(t("csf"), [doc("csf"), doc("id-responsable")], "fisica")).toBe(true);
  });

  it("la identificación llega al final: sí — no importa el orden", () => {
    expect(completaElArranque(t("id-responsable"), [doc("csf"), doc("id-responsable")], "moral")).toBe(true);
  });

  it("se aprueba uno y el otro sigue en revisión, falta o está rechazado: todavía no", () => {
    expect(completaElArranque(t("csf"), [doc("csf"), doc("id-responsable", "en_revision")], "fisica")).toBe(false);
    expect(completaElArranque(t("csf"), [doc("csf")], "fisica")).toBe(false);
    expect(completaElArranque(t("csf"), [doc("csf"), doc("id-responsable", "rechazado")], "fisica")).toBe(false);
  });

  // El caso que justifica mirar la TRANSICIÓN y no el estado: con el arranque
  // ya completo, cada papel que se apruebe después lo encontraría «completo y
  // sin firma».
  it("con el arranque ya completo, aprobar una póliza no lo «completa» otra vez", () => {
    const filas = [doc("csf"), doc("id-responsable"), doc("poliza-rc")];
    expect(completaElArranque(t("poliza-rc"), filas, "fisica")).toBe(false);
  });

  it("un opcional que estaba en revisión no lo completa: ya lo estaba sin él", () => {
    const filas = [doc("csf"), doc("id-responsable"), doc("id-operacion")];
    expect(completaElArranque(t("id-operacion"), filas, "fisica")).toBe(false);
  });

  it("un opcional RECHAZADO que la casa levanta sí: ese papel era lo que lo tenía abierto", () => {
    const filas = [doc("csf"), doc("id-responsable"), doc("id-operacion")];
    expect(completaElArranque(t("id-operacion", "rechazado"), filas, "fisica")).toBe(true);
  });

  it("volver a aprobar lo que ya estaba aprobado no es una transición", () => {
    expect(completaElArranque(t("csf", "aprobado"), [doc("csf"), doc("id-responsable")], "fisica")).toBe(false);
  });

  it("sin saber si es física o moral el expediente no cierra, y no se avisa", () => {
    expect(completaElArranque(t("csf"), [doc("csf"), doc("id-responsable")], null)).toBe(false);
  });

  it("con la identificación vencida no está completo aunque diga «aprobado»", () => {
    const filas = [doc("csf"), doc("id-responsable", "aprobado", "2000-12-31")];
    expect(completaElArranque(t("csf"), filas, "fisica")).toBe(false);
  });
});

describe("qué convenio se le enseña", () => {
  const ahora = new Date("2026-11-23T18:00:00Z");

  it("sin convenio publicado no hay qué avisar", () => {
    expect(convenioParaAvisar([], ahora)).toBeNull();
  });

  it("la última publicada, ya vigente: cero días", () => {
    expect(convenioParaAvisar([version()], ahora)).toEqual({ titulo: "Convenio de operación", version: "v3.5", dias: 0 });
  });

  it("la última publicada aunque todavía no sea exigible, con sus días", () => {
    const nueva = version({ version: "v4", orden: 40, vigenteDesde: "2026-12-23T18:00:00Z" });
    // `versionesConvenio` las entrega de la más nueva a la más vieja.
    expect(convenioParaAvisar([nueva, version()], ahora)).toEqual({ titulo: "Convenio de operación", version: "v4", dias: 30 });
  });
});

describe("avisarConvenioSiCompletaArranque", () => {
  beforeEach(() => {
    st.op = { email: "hola@nomadika.mx", name: "Nomádika Tours", tipo_persona: "moral", convenio_firmado_at: null, es_la_casa: false };
    st.docs = [doc("csf"), doc("id-responsable")];
    st.versiones = [filaVersion("2020-01-01T00:00:00Z")];
    st.falla = null; st.sale = true; st.consultas = 0; st.enviados = [];
  });

  it("la aprobación que completa el arranque, sin firma ⇒ sale UN correo que dice que sigue la firma", async () => {
    expect(await avisarConvenioSiCompletaArranque(t("id-responsable"))).toEqual({ enviado: true });
    expect(st.enviados).toHaveLength(1);
    const c = st.enviados[0];
    expect(c.to).toBe("hola@nomadika.mx");
    expect(c.asunto).toBe("Tus documentos están aprobados: sigue la firma de tu convenio");
    expect(c.html).toContain("Tus documentos ya están aprobados, Nomádika. Sigue la firma.");
    expect(c.html).toContain("Convenio de operación");
    expect(c.html).toContain("v3.5");
    expect(c.html).toContain("hasta que lo firmes, tus experiencias no pueden publicarse ni cobrar");
    expect(c.html).toContain("/caminante/admin/mi-alta/convenio");
    // Lo mismo llega a quien lee en texto plano.
    expect(c.texto).toContain("Tus documentos ya están aprobados, Nomádika. Sigue la firma.");
  });

  // Invariante #25: la operadora no lee el nombre del procesador de pagos.
  it("el correo no nombra a Stripe, ni en el HTML ni en el texto", async () => {
    await avisarConvenioSiCompletaArranque(t("csf"));
    const c = st.enviados[0];
    expect(`${c.asunto} ${c.html} ${c.texto}`).not.toMatch(/stripe/i);
  });

  it("el papel que se aprueba DESPUÉS (una póliza) no lo vuelve a mandar, ni pregunta a la base", async () => {
    st.docs.push(doc("poliza-rc"));
    expect(await avisarConvenioSiCompletaArranque(t("poliza-rc"))).toEqual({ enviado: false, porque: "no-es-de-arranque" });
    expect(st.enviados).toHaveLength(0);
    expect(st.consultas).toBe(0);
  });

  it("falta el otro documento ⇒ todavía no", async () => {
    st.docs = [doc("csf"), doc("id-responsable", "en_revision")];
    expect(await avisarConvenioSiCompletaArranque(t("csf"))).toEqual({ enviado: false, porque: "no-completa-el-arranque" });
    expect(st.enviados).toHaveLength(0);
  });

  it("ya firmó ⇒ no se le pide una firma que ya dio", async () => {
    st.op!.convenio_firmado_at = "2026-11-20T10:00:00Z";
    expect(await avisarConvenioSiCompletaArranque(t("csf"))).toEqual({ enviado: false, porque: "ya-firmo" });
    expect(st.enviados).toHaveLength(0);
  });

  it("la casa no firma convenio consigo misma", async () => {
    st.op!.es_la_casa = true;
    expect(await avisarConvenioSiCompletaArranque(t("csf"))).toEqual({ enviado: false, porque: "la-casa" });
    expect(st.enviados).toHaveLength(0);
  });

  it("sin convenio publicado ⇒ silencio: no se manda a firmar algo que no existe", async () => {
    st.versiones = [];
    expect(await avisarConvenioSiCompletaArranque(t("csf"))).toEqual({ enviado: false, porque: "sin-convenio-publicado" });
    expect(st.enviados).toHaveLength(0);
  });

  it("sin correo en su ficha no hay a quién escribirle", async () => {
    st.op!.email = null;
    expect(await avisarConvenioSiCompletaArranque(t("csf"))).toEqual({ enviado: false, porque: "sin-correo" });
  });

  // Quien nunca ha firmado no tiene «días para seguir vendiendo»: no ha vendido.
  it("con el convenio todavía por entrar en vigor no promete un plazo ni lo llama vigente", async () => {
    st.versiones = [filaVersion("2999-01-01T00:00:00Z")];
    expect(await avisarConvenioSiCompletaArranque(t("csf"))).toEqual({ enviado: true });
    const c = st.enviados[0];
    expect(c.html).toContain("Hasta que lo firmes, tus experiencias no pueden publicarse ni cobrar.");
    expect(c.html).not.toContain("sigues vendiendo normal");
    expect(c.html).not.toContain("Ya está vigente");
  });

  // La aprobación ya quedó guardada: un correo que no sale no la deshace.
  it("si Resend lo rechaza, se dice y no se lanza", async () => {
    st.sale = false;
    expect(await avisarConvenioSiCompletaArranque(t("csf"))).toEqual({ enviado: false, porque: "no-salio" });
  });

  it("si la base no contesta, no se lanza ni se manda nada a ciegas", async () => {
    st.falla = "operator_documents";
    expect(await avisarConvenioSiCompletaArranque(t("csf"))).toEqual({ enviado: false, porque: "error" });
    expect(st.enviados).toHaveLength(0);
  });
});
