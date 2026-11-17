import "server-only";

// LA ORGANIZACIÓN DE FACTURAPI DE UNA OPERADORA (0076).
//
// Una operadora factura al cliente con SU sello (modelo Airbnb). Para eso tiene
// una organización en Facturapi: datos fiscales + CSD + carta manifiesto +
// llaves. La organización es de la cuenta de NUMAN: la operadora nunca entra a
// Facturapi (D20).
//
// ⚠️ EL CSD NO SE GUARDA EN LA PLATAFORMA, NI DE PASO (D20 bis, convenio v3.3
// Octava §4 y Décima tercera §1 bis). Los dos archivos y la contraseña llegan
// en UNA petición y se reenvían a Facturapi EN MEMORIA: nada de bucket, disco
// ni log. Aquí sólo queda lo que Facturapi confirma (serie y vigencia). Hasta
// el 17 nov 2026 los archivos vivían en el bucket `csd`; nunca se usó (vacío).
//
// La casa (`es_la_casa`) NO pasa por aquí: su organización es la de
// FACTURAPI_SECRET_KEY, la abre Luis en el dashboard de Facturapi.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { organizaciones, organizacionesActivas, type EstadoOrganizacion } from "@/lib/facturacion/facturapi";
import { leerCer } from "@/lib/facturacion/cer";
import { cifrar, cifradoActivo } from "@/lib/facturacion/crypto";

type Op = {
  id: string;
  name: string;
  email: string | null;
  es_la_casa: boolean | null;
  rfc: string | null;
  razon_social: string | null;
  regimen_fiscal: string | null;
  cp_fiscal: string | null;
  facturacion_portal_at: string | null;
  facturapi_org_id: string | null;
  facturapi_live_key_enc: string | null;
  facturapi_test_key_enc: string | null;
  facturapi_csd_at: string | null;
  facturapi_manifiesto_at: string | null;
};

const COLS = "id, name, email, es_la_casa, rfc, razon_social, regimen_fiscal, cp_fiscal, facturacion_portal_at, facturapi_org_id, facturapi_live_key_enc, facturapi_test_key_enc, facturapi_csd_at, facturapi_manifiesto_at";

export type ResultadoOrg = { ok: true; orgId: string; paso: string } | { ok: false; error: string };

/** Lo que Facturapi exige para los datos legales. null si está completo; si no, qué falta. */
export function faltanParaFacturapi(op: Pick<Op, "rfc" | "razon_social" | "regimen_fiscal" | "cp_fiscal">): string | null {
  const faltan = [
    [!op.rfc, "RFC"],
    [!op.razon_social, "razón social"],
    [!op.regimen_fiscal, "régimen fiscal"],
    [!op.cp_fiscal, "código postal fiscal"],
  ].filter(([f]) => f).map(([, n]) => n as string);
  return faltan.length ? `Faltan ${faltan.join(", ")}.` : null;
}

async function cargar(operatorId: string): Promise<Op | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("operators").select(COLS).eq("id", operatorId).maybeSingle();
  return (data as Op | null) ?? null;
}

/** Crea la organización si no existe y manda (o actualiza) sus datos legales. */
export async function sincronizarLegalFacturapi(operatorId: string): Promise<ResultadoOrg> {
  if (!organizacionesActivas()) return { ok: false, error: "La conexión con Facturapi aún no está activa (falta la llave de usuario)." };
  const op = await cargar(operatorId);
  if (!op) return { ok: false, error: "No encontramos la operadora." };
  if (op.es_la_casa) return { ok: false, error: "La organización de la casa se administra desde Facturapi." };
  const faltan = faltanParaFacturapi(op);
  if (faltan) return { ok: false, error: faltan };
  const sb = createSupabaseAdminClient();
  try {
    let orgId = op.facturapi_org_id;
    if (!orgId) {
      orgId = await organizaciones.crear(op.name);
      await sb.from("operators").update({ facturapi_org_id: orgId }).eq("id", op.id);
    }
    await organizaciones.editarLegal(orgId, {
      nombre: op.name,
      razonSocial: op.razon_social!,
      regimenFiscal: op.regimen_fiscal!,
      codigoPostal: op.cp_fiscal!,
      correoSoporte: op.email ?? undefined,
    });
    await sb.from("operators").update({ facturapi_legal_at: new Date().toISOString() }).eq("id", op.id);
    return { ok: true, orgId, paso: "legal" };
  } catch (e) {
    return { ok: false, error: `Facturapi: ${(e as Error).message}` };
  }
}

/**
 * Sube el CSD a la organización EN MEMORIA y deja las llaves de emisión
 * cifradas. Sólo con la facturación desde el portal activada: el consentimiento
 * del §1 bis va primero. Los archivos llegan de la petición y se van con ella.
 */
export async function conectarCsdFacturapi(operatorId: string, cer: Blob, key: Blob, password: string): Promise<ResultadoOrg> {
  if (!organizacionesActivas()) return { ok: false, error: "La conexión con Facturapi aún no está activa (falta la llave de usuario)." };
  if (!cifradoActivo()) return { ok: false, error: "Falta FACTURAPI_KEY_SECRET para guardar las llaves cifradas." };
  if (!password) return { ok: false, error: "Falta la contraseña del CSD." };
  const op0 = await cargar(operatorId);
  if (!op0) return { ok: false, error: "No encontramos la operadora." };
  if (!op0.facturacion_portal_at) return { ok: false, error: "Primero activa la facturación desde el portal." };

  // El .cer se lee aquí mismo, en memoria: vigencia y RFC del titular.
  const lectura = leerCer(Buffer.from(await cer.arrayBuffer()));
  if (!lectura) return { ok: false, error: "Ese .cer no se pudo leer como certificado. ¿Es el CSD que te dio el SAT?" };
  const rfcSuyo = (op0.rfc ?? "").trim().toUpperCase();
  if (rfcSuyo && lectura.rfc && lectura.rfc !== rfcSuyo) return { ok: false, error: `Ese sello es del RFC ${lectura.rfc}, y el tuyo es ${rfcSuyo}.` };

  const legal = await sincronizarLegalFacturapi(operatorId);
  if (!legal.ok) return legal;
  const sb = createSupabaseAdminClient();
  try {
    await organizaciones.subirCSD(legal.orgId, cer, key, password);
    const estado = await organizaciones.leer(legal.orgId);

    // Las llaves: la Test se puede pedir siempre; la Live sólo se ve completa al crearla.
    const test = await organizaciones.llaveTest(legal.orgId);
    const live = op0.facturapi_live_key_enc ? null : await organizaciones.crearLlaveLive(legal.orgId);
    const ahora = new Date().toISOString();
    await sb
      .from("operators")
      .update({
        facturapi_test_key_enc: cifrar(test),
        ...(live ? { facturapi_live_key_enc: cifrar(live) } : {}),
        facturapi_csd_at: ahora,
        csd_subido_at: ahora,
        csd_vence_at: estado.venceAt ?? lectura.venceAt,
        facturapi_csd_serial: estado.serie,
        ...(estado.manifiesto && !op0.facturapi_manifiesto_at ? { facturapi_manifiesto_at: ahora } : {}),
      })
      .eq("id", operatorId);
    return { ok: true, orgId: legal.orgId, paso: "csd" };
  } catch (e) {
    return { ok: false, error: `Facturapi: ${(e as Error).message}` };
  }
}

/**
 * Da de baja el CSD en Facturapi (D20 punto 3): al desactivar la facturación o
 * terminar el convenio. Lo que ya se emitió se queda (CFF 30); lo que sigue, no
 * se sella. Si no hay organización o no hay CSD, no hay nada que dar de baja.
 */
export async function darDeBajaCsd(operatorId: string): Promise<{ ok: true; habia: boolean } | { ok: false; error: string }> {
  const op = await cargar(operatorId);
  if (!op) return { ok: false, error: "No encontramos la operadora." };
  if (op.es_la_casa) return { ok: false, error: "El CSD de la casa se administra desde Facturapi." };
  const sb = createSupabaseAdminClient();
  if (op.facturapi_org_id && op.facturapi_csd_at) {
    if (!organizacionesActivas()) return { ok: false, error: "Sin la llave de usuario de Facturapi no se puede dar de baja el certificado." };
    try {
      const estado = await organizaciones.leer(op.facturapi_org_id);
      if (estado.certificado) await organizaciones.borrarCSD(op.facturapi_org_id);
    } catch (e) {
      return { ok: false, error: `Facturapi: ${(e as Error).message}` };
    }
  }
  const habia = Boolean(op.facturapi_csd_at);
  await sb
    .from("operators")
    .update({ facturapi_csd_at: null, facturapi_csd_serial: null, csd_subido_at: null, csd_vence_at: null })
    .eq("id", operatorId);
  return { ok: true, habia };
}

/** Le pregunta a Facturapi si la carta manifiesto ya está firmada y lo deja anotado. */
export async function sincronizarManifiesto(operatorId: string): Promise<{ ok: true; firmada: boolean; estado: EstadoOrganizacion } | { ok: false; error: string }> {
  if (!organizacionesActivas()) return { ok: false, error: "La conexión con Facturapi aún no está activa." };
  const op = await cargar(operatorId);
  if (!op?.facturapi_org_id) return { ok: false, error: "Primero sube tu CSD: así se crea tu espacio de facturación." };
  try {
    const estado = await organizaciones.leer(op.facturapi_org_id);
    // Se anota la primera vez que Facturapi la ve firmada (o se borra si dejó de estarlo).
    if (estado.manifiesto !== Boolean(op.facturapi_manifiesto_at)) {
      const sb = createSupabaseAdminClient();
      await sb
        .from("operators")
        .update({ facturapi_manifiesto_at: estado.manifiesto ? new Date().toISOString() : null })
        .eq("id", operatorId);
    }
    return { ok: true, firmada: estado.manifiesto, estado };
  } catch (e) {
    return { ok: false, error: `Facturapi: ${(e as Error).message}` };
  }
}
