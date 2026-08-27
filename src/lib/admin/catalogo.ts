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
import { CORE, evaluarChecklist, DIMENSIONES_DEL_PRODUCTO, type ItemEstado } from "@/lib/kit/checklist";
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

/** La banda de arriba del catálogo. Cada cifra sale de `productos`, ninguna
 *  se estima: si algo no se puede calcular viene en `null` y la tarjeta lo dice. */
export type Resumen = {
  ingresos: number;
  vendieron: number;
  operadores: number;
  publicadas: number;
  frenadas: string[];
  completas: string[];
  total: number;
  /** Promedio PONDERADO por número de respuestas, no promedio de promedios. */
  stars: number | null;
  respuestas: number;
  invitadas: number;
};

export type Catalogo = {
  productos: Producto[];
  /** `true` cuando quien mira es un operador externo. */
  esOperador: boolean;
  /** Solo para la casa: el operador ve una sola cartera y la banda le sobra. */
  resumen: Resumen | null;
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

  const conRespuestas = productos.filter((p) => p.stars != null && p.respuestas > 0);
  const totalRespuestas = conRespuestas.reduce((a, p) => a + p.respuestas, 0);

  const resumen: Resumen | null = operatorId
    ? null
    : {
        ingresos: productos.reduce((a, p) => a + p.ingresos, 0),
        vendieron: productos.filter((p) => p.ingresos > 0).length,
        operadores: new Set(productos.map((p) => p.operador).filter(Boolean)).size,
        publicadas: productos.filter((p) => p.status === "published").length,
        frenadas: productos
          .filter((p) => p.status === "published" && !p.puedeVender)
          .map((p) => `${p.nombre}: ${p.faltaParaVender.join(" ")}`),
        completas: productos
          .filter((p) => p.armada === DIMENSIONES_DEL_PRODUCTO.length)
          .map((p) => p.nombre),
        total: productos.length,
        // ⚠️ Ponderado. Promediar los promedios le daría el mismo peso a una
        // experiencia con una respuesta que a otra con veinte.
        stars: totalRespuestas
          ? conRespuestas.reduce((a, p) => a + (p.stars as number) * p.respuestas, 0) / totalRespuestas
          : null,
        respuestas: totalRespuestas,
        invitadas: productos.reduce((a, p) => a + p.invitadas, 0),
      };

  return { productos, esOperador: !!operatorId, resumen };
}

// ── LA FICHA de una experiencia ──────────────────────────────────────────
//
// El catálogo contesta «¿cómo va?»; la ficha contesta «¿qué hago con ella?».
// Por eso se NAVEGA y no se expande: es un destino donde se pasa rato, y al
// que se llega desde otras pantallas y desde links que uno se manda a sí mismo.
// Un acordeón no se puede enlazar.

export type FotoSlot = { k: string; label: string; n: number; muestra: string | null };

export type Ficha = {
  producto: Producto;
  /** El banco de fotos por tipo: la materia prima de la página, el Kit y el correo. */
  fotos: FotoSlot[];
  /** Sus fechas publicadas, SOLO LECTURA. Se crean y se cierran en Salidas. */
  fechas: { id: string; label: string; cupo: number | null; tomados: number; pasada: boolean }[];
  testimonios: { texto: string; autor: string; stars: number | null }[];
};

export async function fetchFicha(slug: string): Promise<Ficha | null> {
  const { productos } = await fetchCatalogo();
  const producto = productos.find((p) => p.slug === slug);
  // Si no está en el catálogo del alcance, no es suya. No se distingue entre
  // «no existe» y «no es tuya»: quien pregunta por una ajena no debe aprender
  // que existe.
  if (!producto) return null;

  const sb = createSupabaseAdminClient();
  const { data: exp } = await sb
    .from("experiences")
    .select("id, data")
    .eq("slug", slug)
    .maybeSingle();
  const data = (exp?.data ?? null) as Partial<Experience> | null;

  const pb = data?.photoBank ?? {};
  const fotos: FotoSlot[] = CORE.map((c) => {
    const urls = ((pb as Record<string, string[] | undefined>)[c.k] ?? []).filter((u) => u && u.trim());
    return { k: c.k, label: c.label, n: urls.length, muestra: urls[0] ?? null };
  });

  const [{ data: slotsRaw }, { data: resvsRaw }, { data: fbsRaw }] = await Promise.all([
    sb
      .from("experience_slots")
      .select("id, label, starts_at, capacity_total, status, visibility")
      .eq("experience_id", producto.id)
      .order("starts_at", { ascending: false }),
    sb.from("reservations").select("id, slot_id, num_people, status").eq("experience_id", producto.id),
    sb
      .from("experience_feedback")
      .select("slot_id, contact_id, status, overall_stars, testimonial_text, testimonial_consent, publish_status")
      .eq("experience_id", producto.id),
  ]);

  const hoy = cdmxDay(new Date());
  const resvs = ((resvsRaw ?? []) as { slot_id: string | null; num_people: number | null; status: string }[]).filter(
    (r) => HOLDING_STATUSES.includes(r.status),
  );
  const fechas = ((slotsRaw ?? []) as {
    id: string;
    label: string | null;
    starts_at: string | null;
    capacity_total: number | null;
    status: string;
    visibility: string | null;
  }[])
    .filter((s) => (s.visibility ?? "public") === "public" && s.status !== "cancelled")
    .map((s) => ({
      id: s.id,
      label: s.label || "",
      cupo: s.capacity_total,
      tomados: resvs.filter((r) => r.slot_id === s.id).reduce((n, r) => n + (r.num_people || 1), 0),
      pasada: !!s.starts_at && cdmxDay(s.starts_at) < hoy,
    }));

  // Solo los que dieron permiso Y están aprobados. Publicar un testimonio sin
  // las dos cosas es usar la voz de alguien sin que lo haya autorizado.
  const contactIds = [...new Set(((fbsRaw ?? []) as { contact_id: string }[]).map((f) => f.contact_id))];
  const { data: cs } = contactIds.length
    ? await sb.from("contacts").select("id, full_name").in("id", contactIds)
    : { data: [] as unknown[] };
  const nombre = new Map(((cs ?? []) as { id: string; full_name: string | null }[]).map((c) => [c.id, c.full_name]));

  const testimonios = ((fbsRaw ?? []) as {
    contact_id: string;
    status: string;
    overall_stars: number | null;
    testimonial_text: string | null;
    testimonial_consent: boolean;
    publish_status: string;
  }[])
    .filter((f) => f.status === "submitted" && f.testimonial_consent && f.publish_status === "approved")
    .filter((f) => (f.testimonial_text ?? "").trim())
    .map((f) => ({
      texto: (f.testimonial_text ?? "").trim(),
      autor: nombre.get(f.contact_id) || "—",
      stars: Number.isFinite(Number(f.overall_stars)) ? Number(f.overall_stars) : null,
    }));

  return { producto, fotos, fechas, testimonios };
}
