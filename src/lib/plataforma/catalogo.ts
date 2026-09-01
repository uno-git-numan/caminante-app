import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { experienceTitle } from "@/lib/admin/queries";
import type { Experience } from "@/lib/experiences/types";

// EL CATÁLOGO DE LA PLATAFORMA — todas las experiencias de todas las operadoras.
//
// ⚠️ El orden NO es alfabético ni por operadora: es POR ESTADO DE VIDA, o sea
// por si se puede comprar hoy. Con siete experiencias da igual; con trescientas
// es la diferencia entre una lista que se lee y una que nadie abre. La pregunta
// que contesta esta pantalla no es «cuáles hay» sino «cuáles están rotas».
//
// Los cuatro grupos, y por qué son cuatro y no dos:
//
//   vendiendo  — publicada y con fecha futura. Se puede comprar. Todo bien.
//   en_el_aire — PUBLICADA Y SIN FECHA FUTURA. Éste es el grupo que justifica
//                la pantalla: la experiencia se ve viva —está publicada, tiene
//                histórico, aparece en el sitio— y nadie puede reservarla. Es
//                dinero apagado que parece encendido, y hoy no hay una sola
//                señal en el panel que lo diga. Es el equivalente, en
//                inventario, de la columna 06 Dormido del pipeline.
//   agendada   — el error inverso: BORRADOR CON FECHA. Hay una salida en el
//                calendario de algo que nadie puede ver ni reservar.
//   borrador   — sin publicar y sin fechas. Trabajo pendiente, no un problema.
//
// Aquí vive el VOLUMEN (cuánto se movió). La comisión es dinero y vive en
// Recursos. La misma venta contestando dos preguntas distintas: si las dos
// pantallas acaban mostrando la misma cifra por lo mismo, una de las dos sobra.

export type GrupoVida = "vendiendo" | "en_el_aire" | "agendada" | "borrador";

export type SalidaDelCatalogo = {
  id: string;
  fecha: string | null;
  etiqueta: string | null;
  cupo: number | null;
  futura: boolean;
  reservas: number;
  vendido: number;
};

export type ExperienciaDelCatalogo = {
  id: string;
  slug: string;
  titulo: string;
  publicada: boolean;
  grupo: GrupoVida;
  operadora: { nombre: string; iniciales: string; esLaCasa: boolean } | null;
  estado: string | null;
  categorias: string[];
  proximaSalida: { fecha: string; cupo: number | null } | null;
  salidasFuturas: number;
  mes: { reservas: number; vendido: number };
  historico: { reservas: number; vendido: number };
  canceladas: number;
  salidas: SalidaDelCatalogo[];
};

export type Catalogo = {
  experiencias: ExperienciaDelCatalogo[];
  grupos: Record<GrupoVida, ExperienciaDelCatalogo[]>;
  operadoras: string[];
  estados: string[];
  categorias: string[];
  mesEnCurso: string;
};

const inic = (n: string) =>
  n
    .split(/\s+/)
    .filter((p) => p.length > 1)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || n.slice(0, 2).toUpperCase();

export async function fetchCatalogo(): Promise<Catalogo> {
  const sb = createSupabaseAdminClient();
  const hoy = new Date().toISOString().slice(0, 10);
  const ahora = new Date();
  const desdeMes = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1)).toISOString();

  const [{ data: exps }, { data: ops }, { data: slots }, { data: resv }] = await Promise.all([
    sb.from("experiences").select("id, slug, status, data, operator_id"),
    sb.from("operators").select("id, name, es_la_casa"),
    sb.from("experience_slots").select("id, experience_id, starts_at, label, capacity_total"),
    sb.from("reservations").select("id, experience_id, slot_id, status, total_amount_mxn, created_at"),
  ]);

  type Op = { id: string; name: string; es_la_casa: boolean };
  const porOp = new Map(((ops ?? []) as Op[]).map((o) => [o.id, o]));

  type Slot = {
    id: string;
    experience_id: string;
    starts_at: string | null;
    label: string | null;
    capacity_total: number | null;
  };
  const slotsDe = new Map<string, Slot[]>();
  for (const s of (slots ?? []) as Slot[]) {
    const l = slotsDe.get(s.experience_id) ?? [];
    l.push(s);
    slotsDe.set(s.experience_id, l);
  }

  type Res = {
    experience_id: string | null;
    slot_id: string | null;
    status: string;
    total_amount_mxn: number | null;
    created_at: string;
  };
  const reservas = (resv ?? []) as Res[];

  const experiencias: ExperienciaDelCatalogo[] = ((exps ?? []) as {
    id: string;
    slug: string;
    status: string;
    data: Partial<Experience> | null;
    operator_id: string | null;
  }[]).map((e) => {
    const mios = (slotsDe.get(e.id) ?? []).sort((a, b) => (a.starts_at ?? "").localeCompare(b.starts_at ?? ""));
    const futuras = mios.filter((s) => (s.starts_at ?? "") >= hoy);
    const publicada = e.status === "published";

    // El estado de vida sale de dos hechos, no de uno: publicada Y con fecha.
    // Mirar sólo `status` es lo que hace invisible a la experiencia en el aire.
    const grupo: GrupoVida = publicada
      ? futuras.length > 0
        ? "vendiendo"
        : "en_el_aire"
      : futuras.length > 0
        ? "agendada"
        : "borrador";

    const rs = reservas.filter((r) => r.experience_id === e.id);
    const pagadas = rs.filter((r) => r.status === "paid");
    const suma = (l: Res[]) => ({
      reservas: l.length,
      vendido: l.reduce((a, r) => a + Number(r.total_amount_mxn ?? 0), 0),
    });

    const op = e.operator_id ? porOp.get(e.operator_id) : null;
    const d = (e.data ?? {}) as Record<string, unknown>;

    return {
      id: e.id,
      slug: e.slug,
      titulo: experienceTitle(e.data ?? null, e.slug),
      publicada,
      grupo,
      operadora: op
        ? { nombre: op.name, iniciales: inic(op.name), esLaCasa: op.es_la_casa }
        : null,
      estado: typeof d.estado === "string" ? d.estado : null,
      categorias: Array.isArray(d.lenses)
        ? (d.lenses as { key?: string }[]).map((l) => l?.key ?? "").filter(Boolean)
        : [],
      proximaSalida: futuras[0]?.starts_at
        ? { fecha: futuras[0].starts_at, cupo: futuras[0].capacity_total }
        : null,
      salidasFuturas: futuras.length,
      mes: suma(pagadas.filter((r) => r.created_at >= desdeMes)),
      historico: suma(pagadas),
      // Las canceladas no son ventas, pero SÍ existen: si la lista muestra
      // menos reservas de las que alguien recuerda, tiene que poder saber
      // por qué sin abrir la base.
      canceladas: rs.filter((r) => r.status !== "paid").length,
      salidas: mios.map((s) => {
        const suyas = pagadas.filter((r) => r.slot_id === s.id);
        return {
          id: s.id,
          fecha: s.starts_at,
          etiqueta: s.label,
          cupo: s.capacity_total,
          futura: (s.starts_at ?? "") >= hoy,
          reservas: suyas.length,
          vendido: suyas.reduce((a, r) => a + Number(r.total_amount_mxn ?? 0), 0),
        };
      }),
    };
  });

  // Dentro de cada grupo, primero lo que más se mueve.
  const orden = (a: ExperienciaDelCatalogo, b: ExperienciaDelCatalogo) =>
    b.historico.vendido - a.historico.vendido;
  const grupo = (g: GrupoVida) => experiencias.filter((e) => e.grupo === g).sort(orden);

  const unicos = (xs: (string | null | undefined)[]) =>
    [...new Set(xs.filter((x): x is string => Boolean(x)))].sort();

  return {
    experiencias,
    grupos: {
      vendiendo: grupo("vendiendo"),
      en_el_aire: grupo("en_el_aire"),
      agendada: grupo("agendada"),
      borrador: grupo("borrador"),
    },
    operadoras: unicos(experiencias.map((e) => e.operadora?.nombre)),
    estados: unicos(experiencias.map((e) => e.estado)),
    categorias: unicos(experiencias.flatMap((e) => e.categorias)),
    mesEnCurso: ahora.toLocaleDateString("es-MX", { month: "long", timeZone: "America/Mexico_City" }),
  };
}
