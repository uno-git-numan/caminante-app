import "server-only";

// EL EXPEDIENTE DE UNA OPERADORA — lo que tiene, lo que le falta y qué vence.
//
// Junta dos mundos: el CATÁLOGO (`actividades.ts`, que dice qué se pide) y la
// BASE (`operator_activities` y `operator_documents`, que dicen qué entregó).
// La pantalla no vuelve a razonar nada: pinta lo que sale de aquí.
//
// ⚠️ LA REGLA QUE LE DA FORMA: un documento GENERAL se sube una vez. En la base
// eso es `actividad IS NULL`. Al abrir una actividad se listan sus documentos
// propios MÁS los generales que necesita, marcados como ya cubiertos — se
// muestran, no se vuelven a pedir. Si alguna vez se pidieran dos veces, la
// misma póliza viviría en dos filas y una podría estar aprobada y la otra
// rechazada.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ACTIVIDADES, GENERALES, requisitosDe, nombreDeActividad, type Documento } from "./actividades";

export type EstadoDoc = "falta" | "en_revision" | "aprobado" | "rechazado";
export type EstadoActividad = "incompleta" | "en_revision" | "aprobada" | "suspendida";

export type DocEnPantalla = {
  slug: string;
  nombre: string;
  porQue: string;
  estado: EstadoDoc;
  /** Por qué se rechazó. Nunca se muestra un rechazo mudo. */
  motivo: string | null;
  venceAt: string | null;
  /** Negativo = ya venció. `null` = no caduca o no se ha subido. */
  diasParaVencer: number | null;
  /** Se pinta dentro de una actividad pero VIVE en Lo general: no se re-pide. */
  cubiertoPorGeneral: boolean;
};

export type ActividadEnPantalla = {
  slug: string;
  nombre: string;
  estado: EstadoActividad;
  motivo: string | null;
  propios: DocEnPantalla[];
  /** Los generales que esta actividad vuelve críticos, ya cubiertos. */
  generales: DocEnPantalla[];
  /** Cuántos de los SUYOS faltan o están rechazados. */
  faltan: number;
};

export type Expediente = {
  generales: DocEnPantalla[];
  actividades: ActividadEnPantalla[];
  /** Generales sin entregar o rechazados. */
  faltanGenerales: number;
  faltanTotal: number;
  /** El que vence antes, para el aviso de arriba. Ya vencidos primero. */
  proximo: DocEnPantalla | null;
  vencidos: DocEnPantalla[];
  porVencer: DocEnPantalla[];
  /** Sin una sola actividad declarada la pantalla dice otra cosa. */
  vacio: boolean;
  completo: boolean;
};

/** Días entre hoy y una fecha `YYYY-MM-DD`, en días naturales. */
function diasHasta(fecha: string): number {
  const hoy = new Date();
  const h = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
  const [a, m, d] = fecha.slice(0, 10).split("-").map(Number);
  return Math.round((Date.UTC(a, m - 1, d) - h) / 86_400_000);
}

/** Cuántos días antes de vencer se considera «por vencer». */
export const AVISO_DIAS = 30;

type Fila = {
  actividad: string | null;
  documento: string;
  estado: EstadoDoc extends string ? string : never;
  motivo: string | null;
  vence_at: string | null;
};

function pintar(d: Documento, fila: Fila | undefined, cubierto: boolean): DocEnPantalla {
  const estado = (fila?.estado as EstadoDoc) ?? "falta";
  return {
    slug: d.slug,
    nombre: d.nombre,
    porQue: d.porQue,
    estado,
    motivo: fila?.motivo ?? null,
    venceAt: fila?.vence_at ?? null,
    // Sólo tiene sentido contar días de algo que YA se entregó: un documento
    // que no existe no «vence», falta, que es un problema distinto.
    diasParaVencer: fila?.vence_at ? diasHasta(fila.vence_at) : null,
    cubiertoPorGeneral: cubierto,
  };
}

/** Un documento cuenta como pendiente si falta o si se rechazó. */
const pendiente = (d: DocEnPantalla) => d.estado === "falta" || d.estado === "rechazado";

export async function fetchExpediente(operatorId: string): Promise<Expediente> {
  const sb = createSupabaseAdminClient();
  const [{ data: acts }, { data: docs }] = await Promise.all([
    sb
      .from("operator_activities")
      .select("actividad, estado, motivo")
      .eq("operator_id", operatorId),
    sb
      .from("operator_documents")
      .select("actividad, documento, estado, motivo, vence_at")
      .eq("operator_id", operatorId),
  ]);

  const filas = (docs ?? []) as Fila[];
  // Clave compuesta: `null` de actividad se escribe "" para poder indexar.
  const porClave = new Map(filas.map((f) => [`${f.actividad ?? ""}|${f.documento}`, f]));
  const general = (slug: string) => porClave.get(`|${slug}`);

  const generales = GENERALES.map((d) => pintar(d, general(d.slug), false));

  // ⚠️ Se recorre lo DECLARADO en la base, no el catálogo entero. El catálogo
  // dice qué existe; la fila dice qué eligió esta operadora. Recorrer el
  // catálogo le pediría papeles de actividades que nunca dijo que hacía.
  const declaradas = ((acts ?? []) as { actividad: string; estado: string; motivo: string | null }[])
    .filter((a) => ACTIVIDADES.some((c) => c.slug === a.actividad));

  const actividades: ActividadEnPantalla[] = declaradas.map((a) => {
    const req = requisitosDe(a.actividad);
    const propios = req.propios.map((d) => pintar(d, porClave.get(`${a.actividad}|${d.slug}`), false));
    return {
      slug: a.actividad,
      nombre: nombreDeActividad(a.actividad),
      estado: a.estado as EstadoActividad,
      motivo: a.motivo,
      propios,
      generales: req.generales.map((d) => pintar(d, general(d.slug), true)),
      faltan: propios.filter(pendiente).length,
    };
  });

  const conFecha = [...generales, ...actividades.flatMap((a) => a.propios)].filter(
    (d) => d.diasParaVencer !== null,
  );
  const vencidos = conFecha.filter((d) => (d.diasParaVencer ?? 0) < 0);
  const porVencer = conFecha
    .filter((d) => (d.diasParaVencer ?? 99) >= 0 && (d.diasParaVencer ?? 99) <= AVISO_DIAS)
    .sort((x, y) => (x.diasParaVencer ?? 0) - (y.diasParaVencer ?? 0));

  const faltanGenerales = generales.filter(pendiente).length;
  const faltanTotal = faltanGenerales + actividades.reduce((n, a) => n + a.faltan, 0);

  return {
    generales,
    actividades,
    faltanGenerales,
    faltanTotal,
    // Vencido pesa más que «vence pronto»: uno ya te impide vender.
    proximo: vencidos[0] ?? porVencer[0] ?? null,
    vencidos,
    porVencer,
    vacio: actividades.length === 0 && generales.every((d) => d.estado === "falta"),
    completo:
      actividades.length > 0 &&
      faltanTotal === 0 &&
      vencidos.length === 0 &&
      actividades.every((a) => a.estado === "aprobada"),
  };
}
