// Adaptador de la pestaña GENTE en el teléfono.
//
// No consulta nada nuevo: reusa las MISMAS queries del panel de escritorio
// (`lib/admin/queries.ts`, `lib/registration/pending.ts`). Si el teléfono y la
// computadora discreparan en una cifra —quién debe, quién firmó, cuántas
// respuestas hay— el bug sería imposible de explicar.
//
// Lo que el prototipo (design/admin-movil/adm-screens-b.jsx) traía inventado y
// aquí NO existe está anotado en cada bloque.
//
// ⚠️ DATOS MÉDICOS (LFPDPPP): el roster y la ficha los muestran porque el guía
// los necesita en campo. No se copian al portapapeles, no se mandan a Notion y
// no salen del panel. El único export sigue siendo el CSV admin-gated que ya
// existía en el escritorio.

import { fetchEncuestaAdmin, fetchPersonas, fetchReservas, fetchRoster, fetchSalidasParaLinkAbierto } from "@/lib/admin/queries";
import { iniciales } from "@/lib/admin/formato";
import { fetchDeslindesPendientes } from "@/lib/registration/pending";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://caminante.numanhub.com";

// ── Reservas ─────────────────────────────────────────────────────────────

/** Los cuatro cajones del filtro del entregable. `completed` cae en «pagada»:
 *  es una reserva cobrada cuyo viaje ya pasó, no un cajón nuevo. */
export type GrupoReserva = "pagada" | "confirmada" | "pendiente" | "cancelada";

export type ReservaMovil = {
  id: string;
  contactId: string;
  persona: string;
  /** «Experiencia · salida», que es como se lee una reserva de un vistazo. */
  expLabel: string;
  pax: number;
  total: number;
  pagado: number;
  debe: number;
  estadoLabel: string;
  chip: "ok" | "sol" | "mut";
  /** Cuánto del total lleva pagado. Solo cuando hay anticipo real —el «50%» del
   *  prototipo estaba escrito a mano. */
  pctPagado: number | null;
  grupo: GrupoReserva;
  canal: string;
  deslindeFirmado: boolean;
  /** Falta su firma Y la experiencia sí pide deslinde (si está apagado, no hay
   *  nada pendiente que recordar). */
  deslindePendiente: boolean;
  /** El link que se le manda para firmar. Null si no hay deslinde que firmar. */
  deslindeUrl: string | null;
  /** Se le puede registrar pago / cancelar: ni cancelada ni ya vivida. */
  operable: boolean;
};

const ESTADO_LABEL: Record<string, string> = {
  requested: "Solicitada",
  confirmed: "Confirmada",
  partially_paid: "Anticipo",
  paid: "Pagada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const ESTADO_CHIP: Record<string, "ok" | "sol" | "mut"> = {
  requested: "sol",
  confirmed: "mut",
  partially_paid: "sol",
  paid: "ok",
  completed: "ok",
  cancelled: "mut",
};

const GRUPO: Record<string, GrupoReserva> = {
  requested: "pendiente",
  partially_paid: "pendiente",
  confirmed: "confirmada",
  paid: "pagada",
  completed: "pagada",
  cancelled: "cancelada",
};

const CANAL: Record<string, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  email: "Correo",
  admin: "Panel",
};

// ── Personas ─────────────────────────────────────────────────────────────

export type PersonaMovil = {
  id: string;
  nombre: string;
  ini: string;
  email: string;
  telefono: string;
  ciudad: string;
  /** Reservas vivas (sin las canceladas). */
  viajes: number;
  /** Año de su reserva más vieja. Null si todavía no reserva nada. */
  desde: number | null;
  total: number;
  tag: string;
  tagTono: "ok" | "warn" | "mut";
  reservas: { expLabel: string; pax: number; monto: number; estadoLabel: string; pagada: boolean }[];
  firmas: { que: string; fecha: string }[];
  acompanantes: { nombre: string; relacion: string }[];
  resenas: { exp: string; stars: number | null; nps: number | null; texto: string; fecha: string }[];
};

// ── Encuesta ─────────────────────────────────────────────────────────────

export type EncuestaMovil = {
  deslindesPendientes: {
    reservationId: string;
    nombre: string;
    ini: string;
    sub: string;
    tieneCorreo: boolean;
    deslindeUrl: string;
  }[];
  encuestasPendientes: { experienceId: string; nombre: string; ini: string; sub: string; cnt: number }[];
  totalEncuestasPendientes: number;
  /** Salidas ya terminadas con encuesta encendida. `url` null = todavía sin
   *  token; generarlo vive en el panel de computadora (ver el reporte). */
  linksGrupo: { slotId: string; label: string; experiencia: string; url: string | null; respuestas: number }[];
  testimonios: { id: string; texto: string; stars: number | null; quien: string; consent: boolean }[];
};

export type GenteMovil = {
  reservas: ReservaMovil[];
  personas: PersonaMovil[];
  encuesta: EncuestaMovil;
};

export async function fetchGenteMovil(): Promise<GenteMovil> {
  const [{ reservas: rs }, personasRaw, encuesta, deslindesPend] = await Promise.all([
    fetchReservas(),
    fetchPersonas(),
    fetchEncuestaAdmin(),
    fetchDeslindesPendientes(),
  ]);

  // Un deslinde «pendiente» no es solo «sin firma»: la experiencia tiene que
  // pedirlo. fetchDeslindesPendientes ya aplica esa regla, así que es la fuente
  // — no `!deslindeFirmado`, que marcaría reservas de experiencias sin deslinde.
  const pendPorReserva = new Map(deslindesPend.map((d) => [d.reservationId, d]));

  const reservas: ReservaMovil[] = rs.map((r) => {
    const pend = pendPorReserva.get(r.id);
    return {
      id: r.id,
      contactId: r.contactoId,
      persona: r.contactoNombre,
      expLabel: `${r.experienciaNombre} · ${r.salidaLabel}`,
      pax: r.numPeople,
      total: r.total,
      pagado: r.pagado,
      debe: r.debe,
      estadoLabel: ESTADO_LABEL[r.estado] || r.estado,
      chip: ESTADO_CHIP[r.estado] || "mut",
      pctPagado:
        r.estado === "partially_paid" && r.total > 0 ? Math.round((r.pagado / r.total) * 100) : null,
      grupo: GRUPO[r.estado] || "pendiente",
      canal: CANAL[r.canal] || r.canal,
      deslindeFirmado: r.deslindeFirmado,
      deslindePendiente: !!pend,
      deslindeUrl: pend ? `${SITE}/caminante/registro/${pend.slug}?reserva=${r.id}` : null,
      operable: r.estado !== "cancelled" && r.estado !== "completed",
    };
  });

  // Sus reseñas, por id de contacto. Cruzarlas por nombre pondría la respuesta
  // de un homónimo en el expediente equivocado.
  const resenasPorContacto = new Map<
    string,
    { exp: string; stars: number | null; nps: number | null; texto: string; fecha: string }[]
  >();
  for (const e of encuesta.experiencias) {
    for (const resp of e.respuestas) {
      const texto = resp.textos.join(" · ");
      if (!texto) continue; // sin nada escrito no hay reseña que enseñar
      const arr = resenasPorContacto.get(resp.contactId) || [];
      arr.push({
        exp: `${e.nombre}${resp.salidaLabel ? ` · ${resp.salidaLabel}` : ""}`,
        stars: resp.stars,
        nps: resp.nps,
        texto,
        fecha: resp.fecha,
      });
      resenasPorContacto.set(resp.contactId, arr);
    }
  }

  // Lo que sabemos de cada persona por sus reservas: desde cuándo viene, qué
  // firmó y si debe algo. `fetchPersonas` no trae fechas ni firmas con fecha.
  const porContacto = new Map<string, typeof rs>();
  for (const r of rs) porContacto.set(r.contactoId, [...(porContacto.get(r.contactoId) || []), r]);

  const personas: PersonaMovil[] = personasRaw.map((p) => {
    const suyas = porContacto.get(p.id) || [];
    const vivas = suyas.filter((r) => r.estado !== "cancelled");
    const anios = suyas.map((r) => new Date(r.creada).getFullYear()).filter((y) => Number.isFinite(y));
    const debe = vivas.reduce((n, r) => n + r.debe, 0);
    const tag = debe > 0 ? "Debe" : !vivas.length ? "Sin reservas" : vivas.length > 1 ? "Recurrente" : "Cliente";
    return {
      id: p.id,
      nombre: p.nombre,
      ini: iniciales(p.nombre),
      email: p.email,
      telefono: p.phone,
      ciudad: p.city,
      viajes: vivas.length,
      desde: anios.length ? Math.min(...anios) : null,
      total: p.totalPagado,
      tag,
      tagTono: debe > 0 ? "warn" : !vivas.length ? "mut" : "ok",
      reservas: suyas.map((r) => ({
        expLabel: `${r.experienciaNombre} · ${r.salidaLabel}`,
        pax: r.numPeople,
        monto: r.total,
        estadoLabel: ESTADO_LABEL[r.estado] || r.estado,
        pagada: r.estado === "paid" || r.estado === "completed",
      })),
      firmas: suyas
        .filter((r) => r.deslindeFirmado)
        .map((r) => ({ que: `${r.experienciaNombre} · ${r.salidaLabel}`, fecha: r.deslindeFecha || "" })),
      acompanantes: p.dependientes.map((d) => ({ nombre: d.nombre, relacion: d.relacion })),
      resenas: resenasPorContacto.get(p.id) || [],
    };
  });

  // Encuestas sin responder, agrupadas por EXPERIENCIA: es como se reenvían
  // (`reenviarEncuestaDeExperiencia`), así que agrupar por otra cosa dejaría el
  // botón sin a quién apuntarle.
  const encuestasPendientes = encuesta.experiencias
    .map((e) => {
      const cnt = e.personas.filter((x) => x.estado === "invitada").length;
      return {
        experienceId: e.experienceId,
        nombre: e.nombre,
        ini: iniciales(e.nombre),
        sub: `${cnt} de ${e.invitadas} sin responder`,
        cnt,
      };
    })
    .filter((e) => e.cnt > 0);

  const salidasLink = await fetchSalidasParaLinkAbierto();

  return {
    reservas,
    personas,
    encuesta: {
      deslindesPendientes: deslindesPend.map((d) => ({
        reservationId: d.reservationId,
        nombre: d.nombre,
        ini: iniciales(d.nombre),
        sub: [d.experiencia, d.salidaLabel].filter(Boolean).join(" · "),
        tieneCorreo: !!d.email,
        deslindeUrl: `${SITE}/caminante/registro/${d.slug}?reserva=${d.reservationId}`,
      })),
      encuestasPendientes,
      totalEncuestasPendientes: encuestasPendientes.reduce((a, e) => a + e.cnt, 0),
      linksGrupo: salidasLink.map((s) => ({
        slotId: s.id,
        label: s.label,
        experiencia: s.experiencia,
        url: s.token ? `${SITE}/caminante/feedback/salida/${s.token}` : null,
        respuestas: s.respuestas,
      })),
      // Solo los que esperan decisión; aprobar exige consentimiento y la propia
      // acción lo vuelve a verificar.
      testimonios: encuesta.testimoniosPendientes.map((t) => ({
        id: t.id,
        texto: t.texto,
        stars: t.stars,
        quien: `${t.iniciales} · ${t.experiencia}`,
        consent: t.consent,
      })),
    },
  };
}

// ── Roster de una salida (se carga al abrirlo: depende del slotId) ───────

export type RosterMovil = {
  slotId: string;
  experiencia: string;
  salida: string;
  csvUrl: string;
  imprimibleUrl: string;
  sinFirmar: number;
  /** Lugares vendidos. Puede ser MENOS que `personas.length`. */
  lugaresPagados: number;
  titulares: number;
  firmados: number;
  personas: {
    reservationId: string;
    nombre: string;
    edad: number | null;
    telefono: string | null;
    emergencia: string;
    /** Alergias / padecimientos / dieta. Sensible: se ve, no se copia. */
    condiciones: string;
    firmo: boolean;
    titular: string | null;
    adicional: string | null;
  }[];
};

export async function fetchRosterMovil(slotId: string): Promise<RosterMovil | null> {
  if (!/^[0-9a-fA-F-]{36}$/.test(slotId)) return null;
  const r = await fetchRoster(slotId);
  if (!r) return null;
  return {
    slotId: r.slotId,
    experiencia: r.experienciaNombre,
    salida: r.salidaLabel,
    // Las dos salidas que YA existen en el escritorio, admin-gated las dos.
    csvUrl: `/caminante/admin/roster/${r.slotId}/csv`,
    imprimibleUrl: `/caminante/admin/roster/${r.slotId}`,
    // El deslinde lo firma el TITULAR; el acompañante lo hereda. Contar sobre
    // las filas daba «todas firmaron» con firmas de menos.
    sinFirmar: r.titulares - r.firmados,
    lugaresPagados: r.lugaresPagados,
    titulares: r.titulares,
    firmados: r.firmados,
    personas: r.rows.map((x) => ({
      reservationId: x.reservationId,
      nombre: x.nombre,
      edad: x.edad,
      telefono: x.telefono,
      emergencia: x.emergencia,
      // "Ninguna" y "—" son ruido en campo: el guía lee lo que sí importa.
      condiciones: x.condiciones === "Ninguna" || x.condiciones === "—" ? "" : x.condiciones,
      firmo: x.deslinde,
      titular: x.titular,
      adicional: x.adicional,
    })),
  };
}
