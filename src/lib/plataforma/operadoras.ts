import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Candado, Etapa } from "./etapas";

// Reexportados para no mover cada llamada: lo puro vive en `etapas.ts`.
export { ETAPAS } from "./etapas";
export type { Candado, Etapa } from "./etapas";

// LAS OPERADORAS DE LA PLATAFORMA — y la única pregunta que importa de cada una:
// ¿PUEDE VENDER HOY?
//
// Seis candados, y con que falte uno no vende. La lista no es arbitraria: cada
// uno es una puerta real del sistema, y estar aprobado no abre ninguna.
//
// ⚠️ Los candados NO son todos suyos, y ésa es la parte útil. Dos dependen de la
// operadora (convenio, CSD) y cuatro de la casa (definirle comisión, prenderle
// el panel, habilitarle Connect, publicarle su experiencia). Sin esa distinción
// la ficha es un diagnóstico; con ella es una lista de pendientes con dueño.
// Dos operadoras en 2 de 6 se ven idénticas y lo que las destraba es distinto.
//
// El sexto candado —una experiencia PUBLICADA a su nombre— es el que más se
// olvida: se puede tener todo firmado, el panel prendido y Connect listo, y aun
// así no tener nada que vender.

export type OperadoraPlataforma = {
  id: string;
  slug: string;
  nombre: string;
  iniciales: string;
  esLaCasa: boolean;
  rfc: string | null;
  comisionPct: number | null;
  comisionDesde: string | null;
  candados: Candado[];
  cumplidos: number;
  puedeVender: boolean;
  experienciasPublicadas: number;
  experienciasBorrador: number;
  vendidoMes: number;
  vendidoHistorico: number;
  /** De su solicitud, si entró por el funnel. NULL = se dio de alta a mano. */
  solicitudAt: string | null;
  solicitudStatus: string | null;
  diasEsperando: number | null;
  etapa: Etapa;
};

const inic = (n: string) =>
  n
    .split(/\s+/)
    .filter((p) => p.length > 1)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || n.slice(0, 2).toUpperCase();

const dias = (desde: string) =>
  Math.floor((Date.now() - new Date(desde).getTime()) / 86_400_000);

export async function fetchOperadorasPlataforma(): Promise<OperadoraPlataforma[]> {
  const sb = createSupabaseAdminClient();
  const ahora = new Date();
  const desdeMes = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1)).toISOString();

  const [{ data: ops }, { data: exps }, { data: resv }, { data: apps }] = await Promise.all([
    sb
      .from("operators")
      .select(
        "id, slug, name, es_la_casa, rfc, commission_pct, comision_desde, panel_activo, stripe_charges_enabled, convenio_firmado_at, csd_subido_at, created_at",
      ),
    sb.from("experiences").select("id, status, operator_id"),
    sb.from("reservations").select("experience_id, status, total_amount_mxn, created_at"),
    // Se une por `operator_id`, que la 0035 guarda al aprobar. Unir por nombre
    // habría bastado hoy y se habría roto el día que alguien corrija una tilde.
    sb.from("operator_applications").select("operator_id, status, created_at"),
  ]);

  type Exp = { id: string; status: string; operator_id: string | null };
  type Res = { experience_id: string | null; status: string; total_amount_mxn: number | null; created_at: string };
  type App = { operator_id: string | null; status: string; created_at: string };

  const experiencias = (exps ?? []) as unknown as Exp[];
  const reservas = ((resv ?? []) as Res[]).filter((r) => r.status === "paid");
  const solicitudes = (apps ?? []) as unknown as App[];

  return ((ops ?? []) as Record<string, unknown>[]).map((o) => {
    const id = o.id as string;
    const nombre = o.name as string;
    const esLaCasa = o.es_la_casa === true;
    const mias = experiencias.filter((e) => e.operator_id === id);
    const publicadas = mias.filter((e) => e.status === "published");
    const misExpIds = new Set(mias.map((e) => e.id));
    const misReservas = reservas.filter((r) => r.experience_id && misExpIds.has(r.experience_id));
    const vendidoMes = misReservas
      .filter((r) => r.created_at >= desdeMes)
      .reduce((a, r) => a + Number(r.total_amount_mxn ?? 0), 0);

    const candados: Candado[] = [
      {
        clave: "comision",
        nombre: "Comisión definida",
        cumplido: o.commission_pct != null,
        detalle: o.commission_pct != null ? `${o.commission_pct}%` : "Sin definir",
        toca: "casa",
      },
      {
        clave: "convenio",
        nombre: "Convenio firmado",
        cumplido: Boolean(o.convenio_firmado_at),
        detalle: o.convenio_firmado_at ? "Firmado" : "Sin firmar",
        toca: "operadora",
      },
      {
        clave: "csd",
        nombre: "CSD fiscal",
        cumplido: Boolean(o.csd_subido_at),
        detalle: o.csd_subido_at ? "Cargado" : "Sin cargar",
        toca: "operadora",
      },
      {
        clave: "connect",
        nombre: "Stripe Connect",
        cumplido: o.stripe_charges_enabled === true,
        detalle: o.stripe_charges_enabled === true ? "Cuenta verificada" : "Sin conectar",
        toca: "casa",
      },
      {
        clave: "panel",
        nombre: "Panel activo",
        cumplido: o.panel_activo === true,
        detalle: o.panel_activo === true ? "Entra y ve su tablero" : "Apagado",
        toca: "casa",
      },
      {
        clave: "experiencia",
        nombre: "Una experiencia publicada",
        cumplido: publicadas.length > 0,
        detalle:
          publicadas.length > 0
            ? `${publicadas.length} publicada${publicadas.length === 1 ? "" : "s"}`
            : mias.length > 0
              ? `Ninguna publicada · ${mias.length} en borrador`
              : "Ninguna a su nombre",
        toca: "casa",
      },
    ];

    const cumplidos = candados.filter((c) => c.cumplido).length;
    const app = solicitudes.find((a) => a.operator_id === id);

    // La etapa se DEDUCE del estado real, no de un campo que alguien mueve a
    // mano. Un tablero cuyas columnas hay que mantener sincronizadas con la
    // realidad siempre termina desincronizado.
    let etapa: Etapa;
    if (app?.status === "rejected") etapa = "se_salieron";
    else if (app?.status === "pending") etapa = "llego";
    else if (app?.status === "calling") etapa = "en_llamada";
    else if (vendidoMes > 0) etapa = "vendiendo";
    else if (cumplidos === 6) etapa = "listo";
    else if (!esLaCasa && dias(o.created_at as string) > 60) etapa = "dormido";
    else etapa = "expediente";

    return {
      id,
      slug: o.slug as string,
      nombre,
      iniciales: inic(nombre),
      esLaCasa,
      rfc: (o.rfc as string) ?? null,
      comisionPct: o.commission_pct != null ? Number(o.commission_pct) : null,
      comisionDesde: (o.comision_desde as string) ?? null,
      candados,
      cumplidos,
      // La casa no tiene candados que cumplir: se vende a sí misma.
      puedeVender: esLaCasa ? publicadas.length > 0 : cumplidos === 6,
      experienciasPublicadas: publicadas.length,
      experienciasBorrador: mias.length - publicadas.length,
      vendidoMes,
      vendidoHistorico: misReservas.reduce((a, r) => a + Number(r.total_amount_mxn ?? 0), 0),
      solicitudAt: app?.created_at ?? null,
      solicitudStatus: app?.status ?? null,
      // Una operadora dada de alta a mano NO tiene solicitud: su antigüedad se
      // cuenta desde que se creó, y `solicitudAt` queda en null para que la
      // tarjeta pueda decir «entró por fuera» en vez de fingir un funnel que
      // nunca ocurrió. Y ojo: esta fecha NO es la de arranque de comisión —
      // confundirlas hacía que todas se vieran de «día 1».
      diasEsperando: app ? dias(app.created_at) : dias(o.created_at as string),
      etapa,
    } as OperadoraPlataforma;
  });
}

