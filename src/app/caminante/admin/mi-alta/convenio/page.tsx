// EL CONVENIO Y SUS ANEXOS — el paso que abre el catálogo.
//
// Vive bajo `mi-alta/` como el expediente: sólo tiene sentido para quien se
// está dando de alta o mantiene lo suyo. La casa no entra — no firma un
// convenio consigo misma.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminShell from "../../ui/AdminShell";
import { MI_ALTA_CSS } from "../../ui/mi-alta-css";
import { fetchMiAlta } from "@/lib/operadores/mi-alta";
import { versionesConvenio, leerEstado } from "@/lib/operadores/convenio";
import { estadoDeAnexos, documentoDelAnexo } from "@/lib/operadores/subconvenio";
import { nombreDeActividad } from "@/lib/operadores/actividades";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import Convenio, { type DatosFirma, type DocFirmable } from "./Convenio";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Tu convenio · Caminante",
  robots: { index: false, follow: false },
};

export default async function ConvenioPage() {
  const alta = await fetchMiAlta();
  if (!alta) redirect("/caminante/admin");
  if (alta.operadora?.esLaCasa) redirect("/caminante/admin");
  const operatorId = alta.operadora?.id;
  if (!operatorId) redirect("/caminante/admin/mi-alta");

  const sb = createSupabaseAdminClient();
  const [versiones, anexos, { data: op }, { data: firmas }] = await Promise.all([
    versionesConvenio(),
    estadoDeAnexos(operatorId),
    // ⚠️ La columna es `name`, no `nombre`. Con el nombre equivocado PostgREST
    // falla el SELECT ENTERO y devuelve null: la pantalla de firmar decía «tu
    // operadora / sin capturar» con el RFC y la razón social capturados en la
    // base. No revienta, miente — y miente en el documento que alguien firma.
    sb.from("operators").select("name, razon_social, rfc, commission_pct").eq("id", operatorId).maybeSingle(),
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

  const pct = o.commission_pct;
  const datos: DatosFirma = {
    operadora: (o.razon_social as string) || (o.name as string) || "tu operadora",
    rfc: (o.rfc as string) ?? null,
    // Sin comisión definida no se firma en blanco — `firmarConvenio` lo exige y
    // aquí se dice antes, para no dejarlo descubrirlo hasta el último clic.
    comision: pct == null ? "sin definir todavía" : `${pct}% sobre cada venta cobrada`,
    // El correo de quien firma sale de SU SOLICITUD, no de un campo del
    // formulario: es el mismo con el que entró al funnel.
    email: alta.operadora?.solicitud?.email ?? "",
    convenio,
    anexos: docsAnexos,
  };

  return (
    <AdminShell active="panorama">
      <style dangerouslySetInnerHTML={{ __html: MI_ALTA_CSS }} />
      <div className="sec-head" style={{ marginBottom: 18 }}>
        <div>
          <span className="eyebrow"><span className="sl">{"//"}</span> Paso 03 · Tu convenio</span>
          <h2 className="display" style={{ fontSize: 30, marginTop: 8 }}>
            El marco una vez, <em className="ac">y un anexo por actividad.</em>
          </h2>
          <p className="desc">
            Es lo único de todo el camino que bloquea lo que viene: al firmarlo se abre tu catálogo
            el mismo día. Guardamos el documento exacto que leíste en pantalla, no una liga.
          </p>
          <p className="desc" style={{ marginTop: 10 }}>
            <Link href="/caminante/admin/mi-alta">Volver a Mi alta</Link>
          </p>
        </div>
      </div>
      <Convenio datos={datos} />
    </AdminShell>
  );
}
