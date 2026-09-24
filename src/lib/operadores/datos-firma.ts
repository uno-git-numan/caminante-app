import "server-only";

// LO QUE SE FIRMA, Y SI YA SE FIRMÓ — para la pantalla del convenio y para el
// paso 03 de Mi alta.
//
// Vivía dentro de `mi-alta/convenio/page.tsx`. La lámina «Panel Operadora»
// (24 sep 2026) pone la firma DENTRO del paso 03; en lugar de copiar este
// armado a la otra pantalla, se sacó aquí y las dos lo llaman. Se movió con un
// script, sin reescribirlo: es lo que decide qué texto se firma y con qué
// comisión, y una segunda copia es la que un día firma otra cosa.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { versionesConvenio, leerEstado } from "./convenio";
import { estadoDeAnexos, documentoDelAnexo } from "./subconvenio";
import { nombreDeActividad } from "./actividades";
import type { DatosFirma, DocFirmable } from "@/app/caminante/admin/mi-alta/convenio/Convenio";

export async function datosDeFirma(operatorId: string): Promise<DatosFirma> {
  const sb = createSupabaseAdminClient();
  const [versiones, anexos, { data: op }, { data: firmas }] = await Promise.all([
    versionesConvenio(),
    estadoDeAnexos(operatorId),
    // ⚠️ La columna es `name`, no `nombre`. Con el nombre equivocado PostgREST
    // falla el SELECT ENTERO y devuelve null: la pantalla de firmar decía «tu
    // operadora / sin capturar» con el RFC y la razón social capturados en la
    // base. No revienta, miente — y miente en el documento que alguien firma.
    sb.from("operators").select("name, razon_social, rfc, commission_pct, comision_desde").eq("id", operatorId).maybeSingle(),
    sb
      .from("operator_agreements")
      .select("version, firmado_at, firmante_nombre")
      .eq("operator_id", operatorId)
      .order("firmado_at", { ascending: false }),
  ]);

  const o = (op ?? {}) as Record<string, unknown>;
  const estado = leerEstado(versiones);
  // La que se le muestra es la ÚLTIMA publicada, no la exigida: si ya hay una
  // mayor por venir, que la lea y la firme desde hoy en vez de esperar a que le
  // caiga encima el día que se vuelve exigible.
  const v = estado.ultima;
  const firmadas = (firmas ?? []) as { version: string; firmado_at: string; firmante_nombre: string }[];
  const firmaDe = (version: string) => firmadas.find((f) => f.version === version) ?? null;

  const convenio: DocFirmable | null = v
    ? (() => {
        const propia = firmaDe(v.version);
        const cualquiera = firmadas[0] ?? null;
        return {
          clave: "convenio",
          titulo: v.titulo,
          texto: v.texto,
          hash: v.hash,
          version: v.version,
          firmado: propia
            ? { firmadoAt: propia.firmado_at, firmanteNombre: propia.firmante_nombre, version: propia.version }
            : cualquiera
              ? { firmadoAt: cualquiera.firmado_at, firmanteNombre: cualquiera.firmante_nombre, version: cualquiera.version }
              : null,
          desactualizado: !propia && !!cualquiera,
        };
      })()
    : null;

  const docsAnexos: DocFirmable[] = anexos.flatMap((a) => {
    const doc = documentoDelAnexo(a.actividad);
    if (!doc) return [];
    return [{
      clave: a.actividad,
      titulo: `Anexo · ${nombreDeActividad(a.actividad)}`,
      texto: doc.texto,
      hash: doc.hash,
      version: doc.version,
      firmado: a.firmado
        ? { firmadoAt: a.firmado.firmadoAt, firmanteNombre: a.firmado.firmanteNombre, version: a.firmado.version }
        : null,
      desactualizado: a.desactualizado,
    }];
  });

  // QUÉ TRATO SE FIRMA. Esto leía sólo `commission_pct` y, en NULL, decía «sin
  // definir todavía» y bloqueaba la firma. Pero NULL no es «sin comisión»:
  // con `comision_desde` puesta cobra la escala de la casa, y así se le han
  // cobrado a Nomádika sus 12 ventas. La única operadora que ya generó comisión
  // era justo la que no podía firmar. Ver la 0062.
  const pct = o.commission_pct == null ? null : Number(o.commission_pct);
  const arranca = !!(o.comision_desde as string | null);
  const comision: DatosFirma["comision"] =
    pct != null
      ? { tipo: "plano", texto: `${pct}% sobre cada venta cobrada` }
      : arranca
        ? {
            tipo: "escala",
            // No se promete una sola escala: cuál aplica lo decide cada venta,
            // según quién trajo al cliente. Decir «15%» aquí sería prometer un
            // número que el cobro no cumple.
            texto: "la tabla de la casa, por tramos — baja conforme sube el precio",
          }
        : { tipo: "sin-definir", texto: "sin definir todavía" };

  const datos: DatosFirma = {
    operadora: (o.razon_social as string) || (o.name as string) || "tu operadora",
    rfc: (o.rfc as string) ?? null,
    comision,
    convenio,
    anexos: docsAnexos,
  };

  return datos;
}
