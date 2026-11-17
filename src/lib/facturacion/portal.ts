import "server-only";

// ACTIVAR LA FACTURACIÓN DESDE EL PORTAL (D20; convenio v3.3, Décima tercera
// §1 bis; 0084).
//
// La operadora que ya firmó el convenio acepta el §1 bis al tocar «Activar
// facturación desde el portal»: ella firma su carta manifiesto, ella sube su
// CSD y responde de él, y Caminante lo usa sólo para sus ventas, sus egresos y
// su global. Esa aceptación es un rastro legal (append-only, con el texto
// íntegro y su hash, la versión del convenio y quién aceptó), igual que las
// firmas del convenio.
//
// ⚠️ EL TEXTO SALE DEL CONVENIO PUBLICADO, NO DEL CÓDIGO. Se recorta el párrafo
// «1 bis» de la versión vigente en la base: si legal publica otra versión, lo
// que se acepta cambia con ella, y nunca hay dos redacciones del mismo punto.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hashDeTexto, versionesConvenio } from "@/lib/operadores/convenio";
import { darDeBajaCsd } from "@/lib/facturacion/organizacion";
import { parrafoUnoBis } from "@/lib/facturacion/uno-bis";

export type Consentimiento = { version: string; texto: string; hash: string };


/** Lo que la operadora acepta hoy: el §1 bis de la última versión publicada. */
export async function consentimientoVigente(): Promise<Consentimiento | null> {
  const ultima = (await versionesConvenio())[0];
  if (!ultima) return null;
  const texto = parrafoUnoBis(ultima.texto);
  return texto ? { version: ultima.version, texto, hash: hashDeTexto(texto) } : null;
}

type Rastro = { ip: string | null; userAgent: string | null };

export async function activarFacturacionPortal(i: {
  operatorId: string;
  version: string;
  hashMostrado: string;
  aceptado: boolean;
  nombre: string;
  email: string;
} & Rastro): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!i.aceptado) return { ok: false, error: "Hay que aceptar las condiciones para activar." };
  if (!i.nombre.trim()) return { ok: false, error: "Escribe tu nombre completo." };
  if (!i.email) return { ok: false, error: "No pudimos identificar tu sesión. Vuelve a entrar e inténtalo de nuevo." };
  const c = await consentimientoVigente();
  if (!c) return { ok: false, error: "El convenio vigente no trae las condiciones de facturación desde el portal." };
  if (c.version !== i.version || c.hash !== i.hashMostrado) return { ok: false, error: "El texto cambió mientras lo leías. Vuelve a abrir la página." };

  const sb = createSupabaseAdminClient();
  const { data: op } = await sb
    .from("operators")
    .select("es_la_casa, convenio_firmado_at, facturacion_portal_at")
    .eq("id", i.operatorId)
    .maybeSingle();
  if (!op) return { ok: false, error: "No encontramos la operadora." };
  if (op.es_la_casa) return { ok: false, error: "La facturación de la casa se administra en Facturapi." };
  // El §1 bis es parte del convenio: sin convenio firmado no hay mandato que usar.
  if (!op.convenio_firmado_at) return { ok: false, error: "Primero firma tu convenio de operación." };
  if (op.facturacion_portal_at) return { ok: true };

  const { error } = await sb.from("operator_facturacion_portal").insert({
    operator_id: i.operatorId,
    accion: "activar",
    convenio_version: c.version,
    texto: c.texto,
    texto_hash: c.hash,
    actor_nombre: i.nombre.trim(),
    actor_email: i.email,
    actor_rol: "operadora",
    ip: i.ip,
    user_agent: i.userAgent,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/**
 * Desactivar: primero el rastro (que apaga la emisión al instante, porque el
 * emisor exige `facturacion_portal_at`) y luego la baja del CSD en Facturapi.
 * Si la baja falla, la emisión ya está apagada y la pantalla ofrece reintentar.
 */
export async function desactivarFacturacionPortal(i: {
  operatorId: string;
  rol: "operadora" | "casa";
  motivo: string;
  nombre: string | null;
  email: string;
} & Rastro): Promise<{ ok: true; bajaCsd: boolean } | { ok: false; error: string }> {
  if (!i.email) return { ok: false, error: "No pudimos identificar tu sesión." };
  const sb = createSupabaseAdminClient();
  const { data: op } = await sb.from("operators").select("facturacion_portal_at, facturapi_csd_at").eq("id", i.operatorId).maybeSingle();
  if (!op) return { ok: false, error: "No encontramos la operadora." };
  if (op.facturacion_portal_at) {
    const { error } = await sb.from("operator_facturacion_portal").insert({
      operator_id: i.operatorId,
      accion: "desactivar",
      texto: i.motivo.trim() || (i.rol === "operadora" ? "La operadora desactivó la facturación desde su panel." : "La plataforma desactivó la facturación."),
      texto_hash: hashDeTexto(i.motivo.trim() || "desactivar"),
      actor_nombre: i.nombre?.trim() || null,
      actor_email: i.email,
      actor_rol: i.rol,
      ip: i.ip,
      user_agent: i.userAgent,
    });
    if (error) return { ok: false, error: error.message };
  }
  if (!op.facturapi_csd_at) return { ok: true, bajaCsd: false };
  const baja = await darDeBajaCsd(i.operatorId);
  if (!baja.ok) return { ok: false, error: `La facturación quedó apagada, pero el certificado no se dio de baja en Facturapi: ${baja.error}. Vuelve a intentarlo.` };
  return { ok: true, bajaCsd: baja.habia };
}

/**
 * Al terminar el convenio (operadora en `baja`, 0052) el CSD se da de baja en
 * Facturapi (D20 punto 3). Ninguna pantalla da de baja a una operadora —se hace
 * con su motivo escrito—, así que esto lo revisa el cron de comprobantes cada hora:
 * quien esté en baja con la facturación prendida o el CSD registrado, se apaga.
 */
export async function bajasPorTerminacion(): Promise<{ hechas: number; errores: string[] }> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("operators")
    .select("id, name, estado_motivo, facturacion_portal_at, facturapi_csd_at")
    .eq("estado", "baja")
    .or("facturacion_portal_at.not.is.null,facturapi_csd_at.not.is.null");
  let hechas = 0;
  const errores: string[] = [];
  for (const o of (data ?? []) as { id: string; name: string; estado_motivo: string | null }[]) {
    const r = await desactivarFacturacionPortal({
      operatorId: o.id,
      rol: "casa",
      motivo: `Baja de la operadora (terminación del convenio): ${o.estado_motivo ?? "sin motivo"}`,
      nombre: null,
      email: "sistema · revisión de bajas",
      ip: null,
      userAgent: null,
    });
    if (r.ok) hechas += 1;
    else errores.push(`${o.name}: ${r.error}`);
  }
  return { hechas, errores };
}

export type EstadoPortal = {
  activa: boolean;
  activadaAt: string | null;
  activadaPor: string | null;
  csd: { serie: string | null; venceAt: string | null; subidoAt: string | null } | null;
  manifiestoAt: string | null;
  /** La facturación está apagada pero el CSD sigue en Facturapi: hay una baja por reintentar. */
  bajaPendiente: boolean;
  listo: boolean;
};

export async function estadoPortal(operatorId: string): Promise<EstadoPortal> {
  const sb = createSupabaseAdminClient();
  const [{ data: op }, { data: ultimo }] = await Promise.all([
    sb
      .from("operators")
      .select("facturacion_portal_at, facturapi_csd_at, facturapi_csd_serial, csd_vence_at, csd_subido_at, facturapi_manifiesto_at")
      .eq("id", operatorId)
      .maybeSingle(),
    sb
      .from("operator_facturacion_portal")
      .select("actor_nombre, created_at")
      .eq("operator_id", operatorId)
      .eq("accion", "activar")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const o = (op ?? {}) as Record<string, string | null>;
  const activa = Boolean(o.facturacion_portal_at);
  const csd = o.facturapi_csd_at ? { serie: o.facturapi_csd_serial ?? null, venceAt: o.csd_vence_at ?? null, subidoAt: o.csd_subido_at ?? null } : null;
  return {
    activa,
    activadaAt: o.facturacion_portal_at ?? null,
    activadaPor: activa ? ((ultimo as { actor_nombre?: string | null } | null)?.actor_nombre ?? null) : null,
    csd,
    manifiestoAt: o.facturapi_manifiesto_at ?? null,
    bajaPendiente: !activa && Boolean(csd),
    listo: activa && Boolean(csd) && Boolean(o.facturapi_manifiesto_at),
  };
}
