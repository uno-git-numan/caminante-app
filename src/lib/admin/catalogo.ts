// EL CATÁLOGO DE PRODUCTOS — lo que se vende, no quién ya compró.
//
// El reparto con Salidas está en design/encuesta-v2/LIMITES.md y la prueba de
// una frase es: **¿esto es sobre lo que se vende, o sobre quién ya viene?**
// Publicada, operador, precio, ingresos y clientes son de la oferta. Quiénes
// van, las firmas, el roster y las respuestas de una salida concreta son del
// grupo, y viven en Salidas.
//
// Aquí solo hay tres cosas: la información del producto, sus fotos y su
// comunicación. Las solicitudes de grupo NO viven aquí — van a un CRM aparte.
//
// ⚠️ UNA EXPERIENCIA PUBLICADA SIN FECHAS NO ES UN PENDIENTE. Se vende por
// solicitud de grupo y puede vivir así para siempre. Por eso el estado del
// calendario se devuelve como un enunciado (`calendario`) y no como una alerta:
// la pantalla lo dice, no lo regaña.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { HOLDING_STATUSES } from "@/lib/experiences/availability";
import { cdmxDay, experienceTitle, operadorDelAlcance } from "@/lib/admin/queries";
import { evaluarChecklist, DIMENSIONES_DEL_PRODUCTO, type ItemEstado } from "@/lib/kit/checklist";
import { listaParaPublicar } from "@/lib/experiences/flujo-venta";
import type { Experience } from "@/lib/experiences/types";

export type Dimension = { id: string; titulo: string; estado: ItemEstado; ancla: string };

export type Producto = {
  id: string;
  slug: string;
  nombre: string;
  status: string;
  foto: string | null;
  fotoAlt: string;
  /** Nombre del operador. `null` cuando mira el operador (para él es constante). */
  operador: string | null;
  // ── el semáforo de venta ──
  puedeVender: boolean;
  faltaParaVender: string[];
  // ── cómo va ──
  ingresos: number;
  clientes: number;
  salidasCorridas: number;
  ultimaSalida: string | null;
  stars: number | null;
  respuestas: number;
  invitadas: number;
  // ── qué tan armada está ──
  dimensiones: Dimension[];
  armada: number;
  // ── su calendario, como enunciado ──
  calendario: string;
  proximaLabel: string | null;
};

export type Catalogo = {
  productos: Producto[];
  /** `true` cuando quien mira es un operador externo. */
  esOperador: boolean;
};

export async function fetchCatalogo(): Promise<Catalogo> {
  const sb = createSupabaseAdminClient();
  const operatorId = await operadorDelAlcance();

  const [{ data: expsRaw }, { data: slotsRaw }, { data: resvsRaw }, { data: paysRaw }, { data: fbsRaw }] =
    await Promise.all([
      sb.from("experiences").select("id, slug, status, data, operator_id"),
      sb.from("experience_slots").select("id, experience_id, label, starts_at, status, visibility"),
      sb.from("reservations").select("id, experience_id, contact_id, num_people, status"),
      sb.from("payments").select("reservation_id, amount_mxn, status"),
      sb.from("experience_feedback").select("slot_id, status, overall_stars"),
    ]);

  type ExpRow = {
    id: string;
    slug: string;
    status: string;
    data: Partial<Experience> | null;
    operator_id: string | null;
  };
  let exps = (expsRaw ?? []) as ExpRow[];

  // La poda, antes de la primera agregación. (Ver lib/admin/salidas.ts.)
  if (operatorId) exps = exps.filter((e) => e.operator_id === operatorId);
  const expIds = new Set(exps.map((e) => e.id));

  const slots = ((slotsRaw ?? []) as {
    id: string;
    experience_id: string;
    label: string | null;
    starts_at: string | null;
    status: string;
    visibility: string | null;
  }[]).filter((s) => expIds.has(s.experience_id));

  const resvs = ((resvsRaw ?? []) as {
    id: string;
    experience_id: string;
    contact_id: string;
    num_people: number | null;
    status: string;
  }[]).filter((r) => expIds.has(r.experience_id) && HOLDING_STATUSES.includes(r.status));

  const resvPorId = new Map(resvs.map((r) => [r.id, r]));
  const pagos = ((paysRaw ?? []) as { reservation_id: string; amount_mxn: number | null; status: string }[]).filter(
    (p) => p.status === "paid" && resvPorId.has(p.reservation_id),
  );

  const slotExp = new Map(slots.map((s) => [s.id, s.experience_id]));
  const fbs = ((fbsRaw ?? []) as { slot_id: string | null; status: string; overall_stars: number | null }[]).filter(
    (f) => f.slot_id && slotExp.has(f.slot_id),
  );

  const opById = new Map<string, string>();
  if (!operatorId) {
    const { data: ops } = await sb.from("operators").select("id, name");
    for (const o of (ops ?? []) as { id: string; name: string }[]) opById.set(o.id, o.name);
  }

  const hoy = cdmxDay(new Date());

  const productos: Producto[] = exps.map((e) => {
    const data = e.data ?? null;
    const mias = slots.filter((s) => s.experience_id === e.id);
    const abiertas = mias.filter((s) => s.status === "open" && (s.visibility ?? "public") === "public");
    const futuras = abiertas.filter((s) => s.starts_at && cdmxDay(s.starts_at) >= hoy);
    const corridas = mias.filter((s) => s.starts_at && cdmxDay(s.starts_at) < hoy);
    futuras.sort((a, b) => (a.starts_at ?? "").localeCompare(b.starts_at ?? ""));
    corridas.sort((a, b) => (b.starts_at ?? "").localeCompare(a.starts_at ?? ""));

    const misResvs = resvs.filter((r) => r.experience_id === e.id);
    const clientes = new Set(misResvs.map((r) => r.contact_id)).size;
    const ingresos = pagos
      .filter((p) => resvPorId.get(p.reservation_id)?.experience_id === e.id)
      .reduce((n, p) => n + Number(p.amount_mxn ?? 0), 0);

    const misFbs = fbs.filter((f) => slotExp.get(f.slot_id as string) === e.id);
    const enviadas = misFbs.filter((f) => f.status === "submitted");
    const estrellas = enviadas.map((f) => Number(f.overall_stars)).filter((n) => Number.isFinite(n));

    // La armadura del PRODUCTO: cinco dimensiones. «Salidas» se queda fuera —
    // vive en el Kit, donde sin fecha de verdad no hay campaña que programar.
    // Ver el porqué en checklist.ts.
    const items = evaluarChecklist({
      photoBank: data?.photoBank,
      ficha: data?.ficha,
      registration: data?.registration,
      feedback: data?.feedback,
      guias: (data?.page?.blocks ?? [])
        .filter((b): b is Extract<typeof b, { type: "split" }> => b.type === "split")
        .map((b) => ({ name: b.title, bio: (b.paragraphs ?? []).find((x) => x && x.trim()) })),
      salidas: abiertas.map((s) => ({ date: s.starts_at ?? "" })),
    }).filter((i) => DIMENSIONES_DEL_PRODUCTO.includes(i.id));

    const flujo = listaParaPublicar({ registration: data?.registration, feedback: data?.feedback });

    const calendario = futuras.length
      ? `${futuras.length === 1 ? "Una fecha publicada" : `${futuras.length} fechas publicadas`}`
      : "Sin fechas planeadas · se vende por solicitud";

    const hero = (data?.page?.blocks ?? []).find((b) => b.type === "hero") as
      | { bg?: { url?: string; alt?: string } }
      | undefined;

    return {
      id: e.id,
      slug: e.slug,
      nombre: experienceTitle(data, e.slug),
      status: e.status,
      foto: hero?.bg?.url || data?.heroImageUrl || data?.gallery?.[0] || null,
      fotoAlt: hero?.bg?.alt || data?.heroImageAlt || "",
      operador: !operatorId && e.operator_id ? opById.get(e.operator_id) ?? null : null,
      puedeVender: flujo.ok,
      faltaParaVender: flujo.faltantes,
      ingresos,
      clientes,
      salidasCorridas: corridas.length,
      ultimaSalida: corridas[0]?.label ?? null,
      stars: estrellas.length ? estrellas.reduce((a, b) => a + b, 0) / estrellas.length : null,
      respuestas: enviadas.length,
      invitadas: misFbs.length,
      dimensiones: items.map((i) => ({ id: i.id, titulo: i.titulo, estado: i.estado, ancla: i.ancla })),
      armada: items.filter((i) => i.estado === "ok").length,
      calendario,
      proximaLabel: futuras[0]?.label ?? null,
    };
  });

  // ⚠️ EL ORDEN ES UNA RESPUESTA, no un alfabeto: arriba lo que no puede
  // venderse (está frenado y quizá nadie lo sabe), luego lo que está vendiendo,
  // y al final lo dormido. Quien abre esta pantalla ya sabe qué mirar.
  productos.sort((a, b) => {
    const rank = (p: Producto) =>
      p.status !== "published" ? 2 : !p.puedeVender ? 0 : 1;
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    if (b.ingresos !== a.ingresos) return b.ingresos - a.ingresos;
    return a.nombre.localeCompare(b.nombre);
  });

  return { productos, esOperador: !!operatorId };
}
