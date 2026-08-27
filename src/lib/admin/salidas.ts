// LA LÍNEA DE TIEMPO DE SALIDAS — una salida es un viaje con fecha, y tiene un
// ANTES y un DESPUÉS que son dos trabajos distintos.
//
// Antes se persiguen las firmas del deslinde; después se lee la encuesta. Hasta
// hoy eso vivía repartido en la pantalla «Encuesta», agrupado de tres formas
// distintas (por salida, por experiencia, por experiencia otra vez), y no
// existía ningún lugar donde ver TODAS las salidas de TODAS las experiencias en
// una sola línea de tiempo: para saber qué venía esta semana había que entrar
// experiencia por experiencia.
//
// ⚠️ EL HALLAZGO QUE HACE VIABLE AGRUPAR POR SALIDA: `experience_feedback` trae
// `slot_id` PROPIO (0031) y está lleno en las 41 filas de producción —incluidas
// las 6 que entraron por el link abierto y NO tienen reserva (un acompañante que
// no compró su lugar). Si esto se agrupara por reserva, esas 6 respuestas reales
// desaparecerían de la pantalla. Se agrupa por `slot_id`, siempre.
//
// ⚠️ REGLA DE LA PANTALLA: **ningún promedio se devuelve sin su denominador.**
// 4.6 de 9 respuestas sobre 18 personas es una cosa muy distinta de 4.6 de 17
// sobre 18, y el número solo no las distingue. Por eso `stars` viaja siempre
// pegado a `respuestas` e `invitadas`, y quien dibuje no puede separarlos sin
// darse cuenta.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { HOLDING_STATUSES } from "@/lib/experiences/availability";
import { experienceTitle, operadorDelAlcance } from "@/lib/admin/queries";
import { cdmxDay, formatDiaMes } from "@/lib/admin/formato";
import type { Experience } from "@/lib/experiences/types";

const TZ = "America/Mexico_City";

export type PersonaPendiente = {
  reservationId: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
};

export type PersonaFirmada = { nombre: string; fecha: string };

/** Alguien a quien se le mandó la encuesta y todavía no contesta. */
export type SinResponder = {
  /** Id de la fila de `experience_feedback` — lo pide `reenviarEncuesta`. */
  feedbackId: string;
  /** Su token personal: `/caminante/feedback/<token>`. */
  token: string | null;
  nombre: string;
  email: string | null;
  telefono: string | null;
};

export type Respuesta = {
  nombre: string;
  stars: number | null;
  nps: number | null;
  texto: string | null;
  publicable: boolean;
  /** Entró por el link de grupo y no tiene reserva. Se dice, no se esconde. */
  sinReserva: boolean;
};

export type Salida = {
  id: string;
  slug: string;
  experiencia: string;
  lugar: string;
  label: string;
  /** «operada por Kéntro» — solo cuando NO es la casa. */
  operador: string | null;
  pasada: boolean;
  /** «En 3 días» · «Mañana» · «Hoy» · «Hace 31 días» */
  cuando: string;
  /** Falta una semana o menos: la interfaz lo marca. */
  cerca: boolean;

  // ── ocupación ──
  personas: number;
  cupo: number | null;

  // ── lo editable, para el panel «Editar salida» ──
  // En «YYYY-MM-DD», que es lo que come un <input type="date">.
  inicioInput: string;
  finInput: string;
  precio: number | null;

  // ── deslinde ──
  firmados: number;
  titulares: number;
  pendientes: PersonaPendiente[];
  firmadosLista: PersonaFirmada[];

  // ── encuesta ──
  encuestaArmada: boolean;
  invitadas: number;
  respuestas: number;
  stars: number | null;
  nps: number | null;
  promotores: number;
  pasivos: number;
  detractores: number;
  peor: { label: string; stars: number } | null;
  publicables: number;
  repiten: number;
  queFalto: { texto: string; autor: string } | null;
  respondieron: Respuesta[];
  sinResponder: SinResponder[];
  /** `open` = a la venta · `closed` = ya no se vende (la fecha sigue viva). */
  estado: string;
  tokenGrupo: string | null;
};

export type LineaDeSalidas = {
  /**
   * A qué experiencias se les puede agregar una fecha.
   *
   * Solo las PUBLICADAS: una salida cuelga de un producto que ya está a la
   * venta. Ponerle fecha a un borrador crearía algo que el público no puede ver
   * y que nadie entiende por qué no aparece.
   */
  experiencias: { id: string; slug: string; nombre: string }[];
  proximas: Salida[];
  pasadas: Salida[];
  /** Próximas publicadas que nadie ha comprado. Se colapsan: no son un pendiente. */
  vacias: { id: string; slug: string; experiencia: string; lugar: string; label: string; cupo: number | null }[];
  // ── el encabezado ──
  porViajar: number;
  personasPorViajar: number;
  proximaEnDias: number | null;
  firmasPendientes: number;
  titularesProximos: number;
  repartoFirmas: { experiencia: string; faltan: number }[];
  sinEncuesta: { experiencia: string; label: string }[];
  respuestasPorLeer: { respuestas: number; invitadas: number; publicables: number; repiten: number };
};

/** Días calendario entre hoy y una fecha, en CDMX. Negativo = ya pasó. */
function diasHasta(iso: string | null): number | null {
  if (!iso) return null;
  const hoy = new Date(`${cdmxDay(new Date())}T00:00:00`);
  const d = new Date(`${cdmxDay(iso)}T00:00:00`);
  return Math.round((d.getTime() - hoy.getTime()) / 86400000);
}

function frase(dias: number | null): string {
  if (dias === null) return "Sin fecha";
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  if (dias > 1) return `En ${dias} días`;
  if (dias === -1) return "Ayer";
  return `Hace ${Math.abs(dias)} días`;
}

function fechaLarga(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    timeZone: TZ,
  });
}

type Snap = Record<string, unknown>;

export async function fetchSalidas(): Promise<LineaDeSalidas> {
  const sb = createSupabaseAdminClient();
  const operatorId = await operadorDelAlcance();

  const [{ data: expsRaw }, { data: slotsRaw }, { data: resvsRaw }, { data: regsRaw }, { data: fbsRaw }] =
    await Promise.all([
      sb.from("experiences").select("id, slug, status, data, operator_id"),
      sb
        .from("experience_slots")
        .select(
          "id, experience_id, label, starts_at, ends_at, capacity_total, price_mxn, status, visibility, feedback_token",
        ),
      sb.from("reservations").select("id, experience_id, slot_id, contact_id, num_people, status"),
      sb.from("registrations").select("reservation_id, signed_at"),
      sb
        .from("experience_feedback")
        .select(
          "id, token, slot_id, contact_id, reservation_id, status, overall_stars, nps, section_ratings, loved_text, improve_text, testimonial_consent, publish_status, rebook_interest",
        ),
    ]);

  type ExpRow = { id: string; slug: string; status: string; data: Partial<Experience> | null; operator_id: string | null };
  let exps = (expsRaw ?? []) as ExpRow[];

  // ⚠️ LA PODA VA AQUÍ: justo después de traer las filas y ANTES de la primera
  // agregación. Así los cálculos de abajo no saben que existe un filtro, y un
  // número nuevo nace filtrado sin que nadie se acuerde de filtrarlo.
  if (operatorId) exps = exps.filter((e) => e.operator_id === operatorId);
  const expIds = new Set(exps.map((e) => e.id));
  const expById = new Map(exps.map((e) => [e.id, e]));

  let slots = ((slotsRaw ?? []) as {
    id: string;
    experience_id: string;
    label: string | null;
    ends_at: string | null;
    price_mxn: number | null;
    starts_at: string | null;
    capacity_total: number | null;
    status: string;
    visibility: string | null;
    feedback_token: string | null;
  }[]).filter((s) => expIds.has(s.experience_id));
  const slotIds = new Set(slots.map((s) => s.id));

  const resvs = ((resvsRaw ?? []) as {
    id: string;
    slot_id: string | null;
    contact_id: string;
    num_people: number | null;
    status: string;
  }[]).filter((r) => r.slot_id && slotIds.has(r.slot_id) && HOLDING_STATUSES.includes(r.status));

  const fbs = ((fbsRaw ?? []) as ({ slot_id: string | null; contact_id: string } & Snap)[]).filter(
    (f) => f.slot_id && slotIds.has(f.slot_id),
  );

  // Contactos: solo los que aparecen en lo ya podado.
  const contactIds = [...new Set([...resvs.map((r) => r.contact_id), ...fbs.map((f) => f.contact_id)])];
  const { data: contactsRaw } = contactIds.length
    ? await sb.from("contacts").select("id, full_name, email, phone").in("id", contactIds)
    : { data: [] as unknown[] };
  const cById = new Map(
    ((contactsRaw ?? []) as { id: string; full_name: string | null; email: string | null; phone: string | null }[]).map(
      (c) => [c.id, c],
    ),
  );

  const firmadoPorResv = new Map(
    ((regsRaw ?? []) as { reservation_id: string; signed_at: string }[]).map((g) => [g.reservation_id, g.signed_at]),
  );

  // Operadores, solo para la casa: a un operador «operada por» le diría siempre
  // su propio nombre, que no es un dato — es una constante.
  const opById = new Map<string, string>();
  if (!operatorId) {
    const { data: ops } = await sb.from("operators").select("id, name");
    for (const o of (ops ?? []) as { id: string; name: string }[]) opById.set(o.id, o.name);
  }

  const salidas: Salida[] = [];
  const vacias: LineaDeSalidas["vacias"] = [];

  for (const s of slots) {
    const exp = expById.get(s.experience_id);
    if (!exp) continue;
    const data = exp.data ?? null;
    const dias = diasHasta(s.starts_at);
    const pasada = dias !== null && dias < 0;

    // Las canceladas no son parte del trabajo de nadie; las cerradas sí (una
    // salida cerrada que ya viajó tiene encuesta que leer).
    if (s.status === "cancelled") continue;
    // Las privadas se operan desde Solicitudes: no ensucian la línea de tiempo.
    if ((s.visibility ?? "public") !== "public") continue;

    const mias = resvs.filter((r) => r.slot_id === s.id);
    const mios = fbs.filter((f) => f.slot_id === s.id);
    const personas = mias.reduce((n, r) => n + (r.num_people || 1), 0);

    // El deslinde se firma UNA vez por reserva y cubre al grupo: el denominador
    // son los titulares, no las personas.
    const titulares = mias.length;
    const firmados = mias.filter((r) => firmadoPorResv.has(r.id)).length;

    // Una salida PASADA que nadie compró no tiene nada que decir: no hay firmas
    // que perseguir ni encuesta que leer. No se esconde por incómoda — es que
    // literalmente no ocurrió. Gastarle una cápsula sería ruido en la única
    // pantalla que existe para ver de un vistazo qué necesita atención.
    if (pasada && titulares === 0 && mios.length === 0) continue;

    if (!pasada && titulares === 0) {
      vacias.push({
        id: s.id,
        slug: exp.slug,
        experiencia: experienceTitle(data, exp.slug),
        lugar: (data?.cardPloc || data?.estado || "").toString(),
        label: s.label || fechaLarga(s.starts_at),
        cupo: s.capacity_total,
      });
      continue;
    }

    const pendientes: PersonaPendiente[] = mias
      .filter((r) => !firmadoPorResv.has(r.id))
      .map((r) => {
        const c = cById.get(r.contact_id);
        return {
          reservationId: r.id,
          nombre: c?.full_name || c?.email || "—",
          email: c?.email ?? null,
          telefono: c?.phone ?? null,
        };
      });
    const firmadosLista: PersonaFirmada[] = mias
      .filter((r) => firmadoPorResv.has(r.id))
      .map((r) => ({
        nombre: cById.get(r.contact_id)?.full_name || "—",
        fecha: formatDiaMes(firmadoPorResv.get(r.id) ?? null),
      }));

    const enviadas = mios.filter((f) => f.status === "submitted");
    const estrellas = enviadas.map((f) => Number(f.overall_stars)).filter((n) => Number.isFinite(n));
    const npss = enviadas.map((f) => Number(f.nps)).filter((n) => Number.isFinite(n));
    const promotores = npss.filter((n) => n >= 9).length;
    const pasivos = npss.filter((n) => n >= 7 && n <= 8).length;
    const detractores = npss.filter((n) => n <= 6).length;

    // La categoría PEOR calificada. El promedio esconde justo lo que hay que
    // arreglar; esto lo saca a la superficie.
    const porCat = new Map<string, number[]>();
    for (const f of enviadas) {
      const sr = (f.section_ratings ?? {}) as Record<string, { stars?: number; label?: string }>;
      for (const [k, v] of Object.entries(sr)) {
        const n = Number(v?.stars);
        if (!Number.isFinite(n)) continue;
        porCat.set(k, [...(porCat.get(k) ?? []), n]);
      }
    }
    const cats = [...porCat.entries()].map(([k, ns]) => ({
      key: k,
      stars: ns.reduce((a, b) => a + b, 0) / ns.length,
    }));
    const etiquetaCat = new Map(
      (data?.feedback?.sections ?? []).map((x) => [x.key, x.label]),
    );
    const peorCat = cats.length ? cats.reduce((a, b) => (b.stars < a.stars ? b : a)) : null;

    const conMejora = enviadas.find((f) => ((f.improve_text as string) ?? "").trim());

    // Quién falta de contestar. Es la mitad que faltaba: la pantalla enseñaba
    // quién respondió, pero perseguir al que NO respondió es el trabajo — igual
    // que con las firmas del deslinde.
    const sinResponder: SinResponder[] = mios
      .filter((f) => f.status !== "submitted")
      .map((f) => {
        const c = cById.get(f.contact_id);
        return {
          feedbackId: String(f.id),
          token: (f.token as string) ?? null,
          nombre: c?.full_name || c?.email || "—",
          email: c?.email ?? null,
          telefono: c?.phone ?? null,
        };
      });

    const respondieron: Respuesta[] = enviadas.map((f) => ({
      nombre: cById.get(f.contact_id)?.full_name || "—",
      stars: Number.isFinite(Number(f.overall_stars)) ? Number(f.overall_stars) : null,
      nps: Number.isFinite(Number(f.nps)) ? Number(f.nps) : null,
      texto: ((f.loved_text as string) ?? "").trim() || null,
      publicable: !!f.testimonial_consent && f.publish_status === "approved",
      sinReserva: !f.reservation_id,
    }));

    salidas.push({
      id: s.id,
      slug: exp.slug,
      experiencia: experienceTitle(data, exp.slug),
      lugar: (data?.cardPloc || data?.estado || "").toString(),
      label: s.label || fechaLarga(s.starts_at),
      operador: !operatorId && exp.operator_id ? opById.get(exp.operator_id) ?? null : null,
      pasada,
      cuando: frase(dias),
      cerca: dias !== null && dias >= 0 && dias <= 7,
      personas,
      cupo: s.capacity_total,
      inicioInput: s.starts_at ? cdmxDay(s.starts_at) : "",
      finInput: s.ends_at ? cdmxDay(s.ends_at) : "",
      precio: s.price_mxn ?? null,
      firmados,
      titulares,
      pendientes,
      firmadosLista,
      encuestaArmada: !!data?.feedback?.active && (data?.feedback?.sections ?? []).length > 0,
      invitadas: mios.length,
      respuestas: enviadas.length,
      stars: estrellas.length ? estrellas.reduce((a, b) => a + b, 0) / estrellas.length : null,
      nps: npss.length ? Math.round(((promotores - detractores) / npss.length) * 100) : null,
      promotores,
      pasivos,
      detractores,
      peor: peorCat ? { label: etiquetaCat.get(peorCat.key) || peorCat.key, stars: peorCat.stars } : null,
      publicables: enviadas.filter((f) => f.testimonial_consent && f.publish_status === "approved").length,
      repiten: enviadas.filter((f) => f.rebook_interest).length,
      queFalto: conMejora
        ? {
            texto: ((conMejora.improve_text as string) ?? "").trim(),
            autor: cById.get(conMejora.contact_id)?.full_name || "—",
          }
        : null,
      respondieron,
      sinResponder,
      estado: s.status,
      tokenGrupo: s.feedback_token,
    });
  }

  // El orden sale de la FECHA, no de la etiqueta: «Oct 3-4» y «Domingo 27 sep»
  // no se pueden comparar como texto.
  const fechaDe = new Map(slots.map((s) => [s.id, s.starts_at ?? ""]));
  const proximas = salidas.filter((s) => !s.pasada);
  const pasadas = salidas.filter((s) => s.pasada);
  proximas.sort((a, b) => (fechaDe.get(a.id) ?? "").localeCompare(fechaDe.get(b.id) ?? ""));
  pasadas.sort((a, b) => (fechaDe.get(b.id) ?? "").localeCompare(fechaDe.get(a.id) ?? ""));
  vacias.sort((a, b) => (fechaDe.get(a.id) ?? "").localeCompare(fechaDe.get(b.id) ?? ""));

  const diasProxima = proximas.length ? diasHasta(fechaDe.get(proximas[0].id) ?? null) : null;
  const reparto = proximas
    .filter((s) => s.titulares - s.firmados > 0)
    .map((s) => ({ experiencia: s.experiencia, faltan: s.titulares - s.firmados }));

  return {
    experiencias: exps
      .filter((e) => e.status === "published")
      .map((e) => ({ id: e.id, slug: e.slug, nombre: experienceTitle(e.data ?? null, e.slug) }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    proximas,
    pasadas,
    vacias,
    porViajar: proximas.length,
    personasPorViajar: proximas.reduce((n, s) => n + s.personas, 0),
    proximaEnDias: diasProxima,
    firmasPendientes: proximas.reduce((n, s) => n + (s.titulares - s.firmados), 0),
    titularesProximos: proximas.reduce((n, s) => n + s.titulares, 0),
    repartoFirmas: reparto,
    sinEncuesta: proximas.filter((s) => !s.encuestaArmada).map((s) => ({ experiencia: s.experiencia, label: s.label })),
    respuestasPorLeer: {
      respuestas: pasadas.reduce((n, s) => n + s.respuestas, 0),
      invitadas: pasadas.reduce((n, s) => n + s.invitadas, 0),
      publicables: pasadas.reduce((n, s) => n + s.publicables, 0),
      repiten: pasadas.reduce((n, s) => n + s.repiten, 0),
    },
  };
}

