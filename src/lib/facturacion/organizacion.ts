import "server-only";

// LA ORGANIZACIÓN DE FACTURAPI DE UNA OPERADORA (0076).
//
// Una operadora factura al cliente con SU sello (modelo Airbnb). Para eso tiene
// una organización en Facturapi: datos fiscales + CSD + llaves. Todo se arma
// desde lo que ya captura en «Mi alta → Cobrar» (RFC, razón social, régimen,
// CP, los dos archivos del CSD) más la contraseña del CSD, que viaja a Facturapi
// en la misma llamada y no se guarda en ningún lado nuestro.
//
// La casa (`es_la_casa`) NO pasa por aquí: su organización es la de
// FACTURAPI_SECRET_KEY, la abre Luis en el dashboard de Facturapi.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { organizaciones, organizacionesActivas } from "@/lib/facturacion/facturapi";
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
  csd_cer_path: string | null;
  csd_key_path: string | null;
  facturapi_org_id: string | null;
  facturapi_live_key_enc: string | null;
  facturapi_test_key_enc: string | null;
  facturapi_csd_at: string | null;
};

const COLS = "id, name, email, es_la_casa, rfc, razon_social, regimen_fiscal, cp_fiscal, csd_cer_path, csd_key_path, facturapi_org_id, facturapi_live_key_enc, facturapi_test_key_enc, facturapi_csd_at";

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
    await organizaciones.configurarRecibos(orgId);
    await sb.from("operators").update({ facturapi_legal_at: new Date().toISOString() }).eq("id", op.id);
    return { ok: true, orgId, paso: "legal" };
  } catch (e) {
    return { ok: false, error: `Facturapi: ${(e as Error).message}` };
  }
}

/**
 * Sube el CSD (los dos archivos ya están en el bucket `csd`) con su contraseña
 * a la organización, y deja las llaves de emisión cifradas. Después de esto la
 * operadora puede emitir recibos y facturas desde el portal.
 */
export async function conectarCsdFacturapi(operatorId: string, password: string): Promise<ResultadoOrg> {
  if (!organizacionesActivas()) return { ok: false, error: "La conexión con Facturapi aún no está activa (falta la llave de usuario)." };
  if (!cifradoActivo()) return { ok: false, error: "Falta FACTURAPI_KEY_SECRET para guardar las llaves cifradas." };
  if (!password.trim()) return { ok: false, error: "Falta la contraseña del CSD." };
  const legal = await sincronizarLegalFacturapi(operatorId);
  if (!legal.ok) return legal;
  const op = await cargar(operatorId);
  if (!op?.csd_cer_path || !op.csd_key_path) return { ok: false, error: "Faltan los dos archivos del CSD (.cer y .key)." };

  const sb = createSupabaseAdminClient();
  try {
    const [cer, key] = await Promise.all([sb.storage.from("csd").download(op.csd_cer_path), sb.storage.from("csd").download(op.csd_key_path)]);
    if (cer.error || !cer.data || key.error || !key.data) return { ok: false, error: "No se pudieron leer los archivos del CSD." };
    await organizaciones.subirCSD(legal.orgId, cer.data, key.data, password);

    // Las llaves: la Test se puede pedir siempre; la Live sólo se ve completa al crearla.
    const test = await organizaciones.llaveTest(legal.orgId);
    const live = op.facturapi_live_key_enc ? null : await organizaciones.crearLlaveLive(legal.orgId);
    await sb
      .from("operators")
      .update({
        facturapi_test_key_enc: cifrar(test),
        ...(live ? { facturapi_live_key_enc: cifrar(live) } : {}),
        facturapi_csd_at: new Date().toISOString(),
      })
      .eq("id", op.id);
    return { ok: true, orgId: legal.orgId, paso: "csd" };
  } catch (e) {
    return { ok: false, error: `Facturapi: ${(e as Error).message}` };
  }
}
