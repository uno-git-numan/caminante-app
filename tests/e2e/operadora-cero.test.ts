// EL GUION DE ACEPTACIÓN — «Operadora Cero» entra de cero y termina vendiendo.
//
// Ésta es la definición de «listo» del MVP: la frase entera —*una operadora
// externa entra, completa su expediente, publica, y su venta cobra a su
// nombre*— recorrida de corrido, contra una base de verdad, afirmando en cada
// paso QUÉ candado está cerrado y POR QUÉ. Las pruebas unitarias dicen que la
// aritmética de la comisión es correcta; ésta dice que las once puertas del
// camino se abren en el orden que se le promete a una operadora.
//
// ⚠️ NO CORRE SOLA Y NUNCA CONTRA PRODUCCIÓN. Escribe y borra filas, así que
// pide que le nombres el ambiente:
//
//   PROBAR_E2E=1 STAGING_URL=https://<ref>.supabase.co STAGING_SERVICE_KEY=… npm test
//
// y se niega en seco si la URL es la de producción. La guarda es la misma idea
// que la de `scripts/aplicar-migraciones.mjs`: el ref de producción vive
// escrito aquí para que no baste con un dedazo.
//
// La llave es la `service_role` de staging: dashboard → Settings → API Keys →
// «Legacy anon, service_role» → Reveal. No vive en ningún archivo del repo.
//
// ✅ Corrido contra `caminante-staging` el 23 sep 2026: 11 de 11, dos veces
// seguidas. Y probado que PUEDE fallar: revirtiendo la regla de la fila en
// `mi-alta.ts` —el bug de Nomádika— el paso 02 se pone en rojo con «expected
// null not to be null», que es exactamente lo que tiene que decir.
//
// Lo único simulado es la SESIÓN (`correoEnSesion`): no hay navegador, así que
// se le dice quién entró. Todo lo demás —`fetchMiAlta`, `candadosDe`,
// `operadorListo`, `planDeCobro`— es el código que corre en producción,
// hablando con Postgres de verdad.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const URL_STAGING = process.env.STAGING_URL ?? "";
const LLAVE = process.env.STAGING_SERVICE_KEY ?? "";
const PRODUCCION = "hnyoahirxmzkshivgvnm";

const prendida =
  process.env.PROBAR_E2E === "1" &&
  !!URL_STAGING &&
  !!LLAVE &&
  !URL_STAGING.includes(PRODUCCION);

// El correo de la sesión. Se declara antes del mock porque `vi.mock` se iza
// hasta arriba del archivo y no puede ver una constante declarada después.
// ⚠️ CADA CORRIDA ES OTRA OPERADORA. No por gusto: una dispensa no se borra
// —la 0060 lo impide con un trigger, y el `on delete cascade` de `operators`
// choca contra ese mismo trigger—, así que la operadora del paso 11 NO SE PUEDE
// BORRAR nunca más. Reusar el mismo correo dejaría la segunda corrida
// estrellándose contra la primera. El sello hace que cada corrida tenga su
// propio mundo y que la limpieza sea exacta.
const SELLO = `${Date.now().toString(36)}`;
const CORREO = `operadora.cero+${SELLO}@numanhub.com`;
vi.mock("@/lib/auth/authorization", () => ({
  correoEnSesion: async () => CORREO,
}));

// ⚠️ EL ENTORNO SE FIJA ANTES DE QUE NADIE ABRA UN CLIENTE. `getServerSupabaseEnv`
// lee `process.env` en CADA llamada, así que basta con escribirlo antes de la
// primera; hacerlo aquí arriba —y no en un `beforeAll`— evita depender de en qué
// orden vitest evalúa los archivos.
if (prendida) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = URL_STAGING;
  process.env.SUPABASE_SERVICE_ROLE_KEY = LLAVE;
  // La publishable key no la usa el cliente de servicio: el esquema de zod sólo
  // exige que exista. Se pone la de staging si la diste, y si no un centinela
  // que dice en voz alta que nadie la lee por aquí.
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
    process.env.STAGING_ANON_KEY || "sin-uso-en-el-guion-de-aceptacion";
}

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchMiAlta } from "@/lib/operadores/mi-alta";
import { candadosDe } from "@/lib/experiences/candados-venta";
import { operadorListo, COLUMNAS_GATE, type OperadorParaGate } from "@/lib/operators/listo-para-vender";
import { planDeCobro, retencionDe } from "@/lib/payments/connect-cobro";
import { comisionDeVenta, sinIva } from "@/lib/operadores/comision";
import { versionDelAnexo } from "@/lib/operadores/subconvenio-doc";

const ACTIVIDAD = "senderismo";
const PRECIO = 1750;
const SLUG = `zz-operadora-cero-${SELLO}`;

// Todo lo que este guion escribe lleva esta marca, y al terminar se borra por
// ella. Un guion que deja basura convierte la siguiente corrida en una
// investigación.
const MARCA = `e2e-operadora-cero-${SELLO}`;

let operadoraId = "";
let casaId = "";
let experienciaId = "";

const sb = () => createSupabaseAdminClient();

/** La fila de la operadora, con las columnas que el gate necesita. */
async function filaDelGate(): Promise<OperadorParaGate> {
  const { data } = await sb().from("operators").select(COLUMNAS_GATE).eq("id", operadoraId).single();
  return data as unknown as OperadorParaGate;
}

/** La experiencia, tal como la leen los candados: de la FILA, nunca del formulario. */
async function experiencia() {
  const { data } = await sb()
    .from("experiences")
    .select("data, operator_id, actividad")
    .eq("id", experienciaId)
    .single();
  return data as unknown as Parameters<typeof candadosDe>[1];
}

const actualizarOperadora = (campos: Record<string, unknown>) =>
  sb().from("operators").update(campos).eq("id", operadoraId).throwOnError();

const actualizarExperiencia = (campos: Record<string, unknown>) =>
  sb().from("experiences").update(campos).eq("id", experienciaId).throwOnError();

// Una experiencia con el deslinde y la encuesta completos. Se construye aquí y
// no en la base para que la prueba pueda apagar una pieza a la vez.
const DATOS_COMPLETOS = {
  title: "Operadora Cero · guion de aceptación",
  registration: {
    active: true,
    waiverClauses: [{ texto: "Reconozco los riesgos de la caminata.", obligatoria: true, origen: "casa" }],
  },
  feedback: {
    active: true,
    locationLabel: "el cerro de prueba",
    sections: [{ label: "Guía" }, { label: "Ritmo" }],
  },
};

describe.skipIf(!prendida)("Operadora Cero · de cero a vender", () => {
  beforeAll(async () => {
    const c = sb();
    await limpiar();

    // La casa NO se crea: ya viene con las migraciones, y la base sólo admite
    // una (`operators_una_sola_casa`). Se comprueba que esté, porque
    // `actividadListaParaPublicar` le pregunta a la base quién es la casa —no lo
    // deduce de `operator_id IS NULL`, que fue el bug de la 0058— y sin esa fila
    // el guion probaría otro mundo.
    const { data: casa } = await c
      .from("operators")
      .select("id")
      .eq("es_la_casa", true)
      .maybeSingle()
      .throwOnError();
    casaId = (casa as { id: string } | null)?.id ?? "";
    expect(casaId, "el ambiente no tiene fila de la casa: revisa las migraciones").toBeTruthy();

    // La solicitud, como la manda una operadora por el formulario público.
    await c
      .from("operator_applications")
      .insert({
        nombre_operadora: "Operadora Cero",
        responsable: "Cero, la responsable",
        email: CORREO,
        whatsapp: "+525555555555",
        ciudad_estado: "Ciudad de México",
        // Los valores salen de los CHECK de la 0035: inventarlos aquí dejaría
        // una prueba que sólo falla el día que alguien la corre.
        tipo_operacion: "montana",
        descripcion: MARCA,
        antiguedad: "3-10",
        seguro_rc: "vigente",
        primeros_auxilios: "todos",
        ratio_guias: "1:8",
        incidentes: "ninguno",
        acepta_cobro: true,
        acepta_deslinde: true,
        acepta_encuesta: true,
        actividades: [ACTIVIDAD],
        expediente: [],
        status: "calling",
      })
      .throwOnError();
  }, 60_000);

  afterAll(limpiar, 60_000);

  // ── 01 ─────────────────────────────────────────────────────────────────────
  it("01 · mandó su solicitud: hay recorrido y todavía no hay operadora", async () => {
    const alta = await fetchMiAlta();
    expect(alta?.estado).toBe("llamada");
    expect(alta?.operadora).toBeNull();
  });

  // ── 02 ─── EL LAZO DE NOMÁDIKA ────────────────────────────────────────────
  it("02 · aprobada: la FILA manda sobre el embudo, aunque la solicitud siga abierta", async () => {
    const c = sb();
    const { data } = await c
      .from("operators")
      .insert({
        name: "Operadora Cero",
        slug: SLUG,
        email: CORREO,
        estado: "activa",
        panel_activo: true,
        comision_desde: new Date().toISOString(),
        notes: MARCA,
      })
      .select("id")
      .single()
      .throwOnError();
    operadoraId = (data as { id: string }).id;

    // ⚠️ LA SOLICITUD SE QUEDA EN `calling` A PROPÓSITO. Ése era exactamente el
    // estado de Nomádika el 22 sep: fila activa, solicitud reabierta. Bastaba
    // para que `fetchMiAlta` devolviera `operadora: null`, la página del
    // expediente rebotara y no pudiera subir un solo documento — ni ella ni la
    // casa por ella. Si esta afirmación se vuelve a poner en rojo, el lazo
    // volvió.
    const alta = await fetchMiAlta();
    expect(alta?.solicitud?.status).toBe("calling");
    expect(alta?.operadora).not.toBeNull();
    expect(alta?.operadora?.id).toBe(operadoraId);
  });

  // ── 03 ─────────────────────────────────────────────────────────────────────
  it("03 · su experiencia no publica: no ha declarado la actividad", async () => {
    const c = sb();
    const { data } = await c
      .from("experiences")
      .insert({
        slug: SLUG,
        status: "draft",
        operator_id: operadoraId,
        actividad: ACTIVIDAD,
        data: DATOS_COMPLETOS,
      })
      .select("id")
      .single()
      .throwOnError();
    experienciaId = (data as { id: string }).id;

    const v = await candadosDe("publicar", await experiencia());
    expect(v.ok).toBe(false);
    if (v.ok) return;
    expect(v.motivo).toBe("actividad");
    expect(v.candado?.motivo).toBe("no_declarada");
  });

  // ── 04 ─────────────────────────────────────────────────────────────────────
  it("04 · declarada y en revisión: sigue cerrado, pero ya no es culpa suya", async () => {
    await sb()
      .from("operator_activities")
      .insert({ operator_id: operadoraId, actividad: ACTIVIDAD, estado: "en_revision", enviada_at: new Date().toISOString() })
      .throwOnError();

    const v = await candadosDe("publicar", await experiencia());
    expect(v.ok).toBe(false);
    if (v.ok) return;
    expect(v.candado?.motivo).toBe("no_aprobada");
    expect(v.candado?.estado).toBe("en_revision");
    // La diferencia que importa: «en revisión» no le pide nada a ella.
    expect(v.mensaje).toContain("en revisión");
  });

  // ── 05 ─────────────────────────────────────────────────────────────────────
  it("05 · expediente aprobado: ahora falta el anexo, no los papeles", async () => {
    await sb()
      .from("operator_activities")
      .update({ estado: "aprobada", resuelta_at: new Date().toISOString() })
      .eq("operator_id", operadoraId)
      .eq("actividad", ACTIVIDAD)
      .throwOnError();

    const v = await candadosDe("publicar", await experiencia());
    expect(v.ok).toBe(false);
    if (v.ok) return;
    expect(v.candado?.motivo).toBe("sin_anexo");
  });

  // ── 06 ─────────────────────────────────────────────────────────────────────
  it("06 · anexo firmado: el candado de la actividad abre", async () => {
    const version = versionDelAnexo(ACTIVIDAD);
    expect(version).toBeTruthy();
    await sb()
      .from("operator_activity_annexes")
      .insert({
        operator_id: operadoraId,
        actividad: ACTIVIDAD,
        version,
        doc_hash: MARCA,
        firmante_nombre: "Cero, la responsable",
        firmante_email: CORREO,
        facultades_declaradas: true,
        aceptado: true,
        documentos_snapshot: [],
      })
      .throwOnError();

    const v = await candadosDe("publicar", await experiencia());
    expect(v.ok).toBe(true);
  });

  // ── 07 ─── LA REGLA DE LUIS: PRENDIDO TODO ANTES DE PUBLICAR ──────────────
  it("07 · sin encuesta no publica, pero sí vende: son dos candados distintos", async () => {
    await actualizarExperiencia({
      data: { ...DATOS_COMPLETOS, feedback: { ...DATOS_COMPLETOS.feedback, active: false } },
    });

    const publicar = await candadosDe("publicar", await experiencia());
    expect(publicar.ok).toBe(false);
    if (!publicar.ok) expect(publicar.motivo).toBe("flujo");

    // Vender no la exige: una venta con la encuesta apagada no le hace daño al
    // cliente. Publicar sí, porque la salida se operaría sin medir (hongos, 26 jul).
    const vender = await candadosDe("vender", await experiencia());
    expect(vender.ok).toBe(true);

    await actualizarExperiencia({ data: DATOS_COMPLETOS });
    expect((await candadosDe("publicar", await experiencia())).ok).toBe(true);
  });

  // ── 08 ─── EL GATE DE CONNECT ─────────────────────────────────────────────
  it("08 · conecta Stripe a medias y la caja se cierra, con la lista de lo que falta", async () => {
    // Una cuenta creada NO es una cuenta que cobra: el KYC puede seguir abierto.
    await actualizarOperadora({ stripe_account_id: "acct_operadora_cero_e2e" });

    const v = await candadosDe("vender", await experiencia());
    expect(v.ok).toBe(false);
    if (v.ok) return;
    expect(v.motivo).toBe("operadora");
    // Las cuatro cosas que le faltan, dichas de una vez y no de una en una.
    const todo = v.faltantes.join(" ");
    expect(todo).toContain("Stripe todavía no habilita");
    expect(todo).toContain("CSD");
    expect(todo).toContain("datos fiscales");
    expect(todo).toContain("convenio");
  });

  // ── 09 ─────────────────────────────────────────────────────────────────────
  it("09 · con Stripe, CSD vigente, fiscales y convenio, la caja abre", async () => {
    const enUnAno = new Date();
    enUnAno.setFullYear(enUnAno.getFullYear() + 1);
    await actualizarOperadora({
      stripe_charges_enabled: true,
      csd_cer_path: `${MARCA}/csd.cer`,
      csd_key_path: `${MARCA}/csd.key`,
      csd_vence_at: enUnAno.toISOString().slice(0, 10),
      csd_subido_at: new Date().toISOString(),
      rfc: "XAXX010101000",
      razon_social: "OPERADORA CERO",
      regimen_fiscal: "612",
      cp_fiscal: "06700",
      tipo_persona: "fisica",
      convenio_firmado_at: new Date().toISOString(),
    });

    expect(operadorListo(await filaDelGate()).ok).toBe(true);
    expect((await candadosDe("vender", await experiencia())).ok).toBe(true);
  });

  // ── 10 ─── EL DINERO ──────────────────────────────────────────────────────
  it("10 · el cobro sale por Connect y retiene comisión + IVA, ni un peso más", async () => {
    const comision = comisionDeVenta(
      { viaje: { precioUnitario: sinIva(PRECIO), cantidad: 1 } },
      { tipo: "escala", escala: "venta" },
    ).monto;

    const plan = planDeCobro(await filaDelGate(), comision, PRECIO);
    expect(plan.canal).toBe("connect");
    if (plan.canal !== "connect") return;
    expect(plan.cuenta).toBe("acct_operadora_cero_e2e");
    expect(plan.retenidoMxn).toBe(retencionDe(comision));
    // Lo retenido no puede pasar de lo cobrado: si pasara, Stripe rechazaría el
    // cargo con el cliente enfrente.
    expect(plan.feeCentavos).toBeLessThanOrEqual(PRECIO * 100);
    // Y la operadora recibe el resto. Ojo: NO es `transfer.amount`, que es el
    // bruto (ver connect-cobro.ts).
    expect(PRECIO - plan.retenidoMxn).toBeCloseTo(PRECIO - comision * 1.16, 2);
  });

  // ── 11 ─── LA DISPENSA ────────────────────────────────────────────────────
  it("11 · la dispensa abre el candado y se dice en voz alta; vencida, no abre", async () => {
    const c = sb();
    // Se le cae el expediente: la actividad se suspende.
    await c
      .from("operator_activities")
      // El motivo NO es adorno: la 0058 lo exige por CHECK. Una suspensión sin
      // razón escrita es una puerta cerrada que nadie sabe cómo volver a abrir.
      .update({ estado: "suspendida", resuelta_at: new Date().toISOString(), motivo: `Póliza vencida · ${MARCA}` })
      .eq("operator_id", operadoraId)
      .eq("actividad", ACTIVIDAD)
      .throwOnError();
    expect((await candadosDe("vender", await experiencia())).ok).toBe(false);

    const ayer = new Date(Date.now() - 86_400_000).toISOString();
    const anteayer = new Date(Date.now() - 2 * 86_400_000).toISOString();
    const enTreinta = new Date(Date.now() + 30 * 86_400_000).toISOString();

    // Una dispensa VENCIDA es exactamente igual a no tenerla. Eso es lo que la
    // hace una excepción y no un agujero (0060).
    //
    // ⚠️ Y una dispensa NO PUEDE NACER VENCIDA: la 0060 lo impide con
    // `dispensa_vence_despues` (vence_at > autorizada_at). Por eso ésta se
    // fecha completa en el pasado, en vez de colgarle un vencimiento de ayer a
    // una autorización de hoy —que la base rechaza, y con razón.
    await c
      .from("operator_activity_dispensas")
      .insert({
        operator_id: operadoraId,
        actividad: ACTIVIDAD,
        motivo: `Dispensa de prueba ya vencida · ${MARCA}`,
        autorizada_por: MARCA,
        autorizada_at: anteayer,
        vence_at: ayer,
      })
      .throwOnError();
    expect((await candadosDe("vender", await experiencia())).ok).toBe(false);

    await c
      .from("operator_activity_dispensas")
      .insert({
        operator_id: operadoraId,
        actividad: ACTIVIDAD,
        // El motivo lleva mínimo diez caracteres por CHECK: una dispensa sin
        // explicación es un agujero con fecha.
        motivo: `Póliza en trámite, sale la semana que entra · ${MARCA}`,
        autorizada_por: "Luis",
        vence_at: enTreinta,
      })
      .throwOnError();
    const v = await candadosDe("vender", await experiencia());
    expect(v.ok).toBe(true);
    // No basta con que abra: tiene que decir que está vendiendo bajo dispensa.
    if (v.ok) {
      expect(v.dispensa?.autorizadaPor).toBe("Luis");
      expect(v.dispensa?.venceAt).toBeTruthy();
    }
  });
});

/**
 * Deja el ambiente como lo encontró — hasta donde la base lo permite.
 *
 * ⚠️ Y NO LO PERMITE DEL TODO, lo cual es un hallazgo y no un estorbo. Dos
 * tablas de este camino son APPEND-ONLY por trigger, y el trigger le gana al
 * service-role: `operator_activity_annexes` («rastro legal: ni UPDATE ni
 * DELETE») y `operator_activity_dispensas` («no se borra: se revoca», 0060).
 * Como las dos cuelgan de `operators` con `on delete cascade`, borrar a la
 * operadora dispara esos triggers y la base se niega.
 *
 * Dicho de frente, y vale la pena saberlo fuera de esta prueba:
 * **una operadora que firmó un anexo o recibió una dispensa ya no se puede
 * borrar.** En producción eso está bien —una operadora se da de BAJA, no se
 * borra— así que aquí se hace exactamente lo mismo que allá: se revoca lo
 * revocable, se borra lo borrable, y la fila se queda de baja con su sello.
 * Si staging se llena de sellos viejos se reconstruye entero con
 * `scripts/aplicar-migraciones.mjs`, que es cosa de un comando.
 */
async function limpiar() {
  if (!prendida) return;
  const c = sb();
  const { data: mias } = await c.from("operators").select("id").eq("notes", MARCA);
  const ids = ((mias ?? []) as { id: string }[]).map((o) => o.id);

  await c.from("experiences").delete().eq("slug", SLUG);
  for (const id of ids) {
    await c.from("operator_activities").delete().eq("operator_id", id);
    await c.from("operator_documents").delete().eq("operator_id", id);
    // Revocar es lo único que se puede escribir sobre una dispensa existente.
    await c
      .from("operator_activity_dispensas")
      .update({ revocada_at: new Date().toISOString(), revocada_por: MARCA })
      .eq("operator_id", id)
      .is("revocada_at", null);
  }
  await c.from("operator_applications").delete().eq("email", CORREO);

  // El anexo y las dispensas se quedan: son rastro legal. Con ellos colgando,
  // la fila no se borra — se da de baja, que es la operación que existe.
  await c
    .from("operators")
    .update({ estado: "baja", estado_desde: new Date().toISOString(), estado_motivo: `Fin del guion ${MARCA}` })
    .eq("notes", MARCA);
}
