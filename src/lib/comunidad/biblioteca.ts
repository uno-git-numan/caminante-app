// LA BIBLIOTECA DE LA COMUNIDAD — quién es la gente, no cuántos son.
//
// No es un CRM ni una bandeja de pendientes: aquí no se persigue nada. Los
// deslindes, los pagos y los cupos son OPERACIÓN y viven en Salidas y en
// Recursos. Esto se hojea, se busca y se lee para saber quién es alguien antes
// de escribirle.
//
// Entran TODOS los que dejaron rastro, no sólo quienes viajaron: quien se
// registró y no fue, quien contestó la encuesta abierta, quien está en el
// boletín. Los que todavía no vienen son justo a quienes querrías invitar.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { HOLDING_STATUSES } from "@/lib/experiences/availability";
import { experienceTitle, operadorDelAlcance } from "@/lib/admin/queries";
import { iniciales } from "@/lib/admin/formato";
import type { Experience } from "@/lib/experiences/types";

export type ViajeBiblio = { experiencia: string; cuando: string; orden: number };

export type PersonaBiblio = {
  id: string;
  nombre: string;
  iniciales: string;
  ciudad: string;
  /** El origen EN HUMANO. `source` crudo es un slug de base de datos. */
  origen: string;
  viajes: ViajeBiblio[];
  /** Para ordenar por «su historia». 0 = nunca ha venido. */
  ultimoOrden: number;
  telefono: string | null;
  email: string | null;
  tags: string[];
  boletin: boolean;
  /** "27 de agosto" — sin año: es un cumpleaños, no una fecha de nacimiento. */
  cumple: string | null;
  cumpleMes: number | null;
  cumpleDia: number | null;
  /** Lo que escribió en la encuesta, en sus palabras. */
  voz: { texto: string; cuando: string; publicable: boolean }[];
};

export type Biblioteca = {
  personas: PersonaBiblio[];
  /** hoy · esta semana · los próximos 30. NO «este mes»: en un día 27, un mes
   *  enseñaría tres felicitaciones que ya se fueron. */
  cumples: { hoy: PersonaBiblio[]; semana: PersonaBiblio[]; proximos: PersonaBiblio[] };
  /** Variantes de una misma ciudad. Mientras estén así, no hay filtro de ciudad. */
  ciudadSucia: { cuantas: number; variantes: { texto: string; n: number }[] } | null;
  conteos: { todos: number; vinieron: number; todaviaNo: number; boletin: number; conTag: number };
};

const MES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

/** «web pago · recoleccion-de-hongos» → «Vino a Recolección de hongos». */
function humanizarOrigen(source: string, titulos: Map<string, string>): string {
  const s = (source || "").trim();
  const [tipoRaw, slugRaw] = s.split("·").map((x) => x.trim());
  const tipo = (tipoRaw || s).toLowerCase();
  const exp = slugRaw ? titulos.get(slugRaw) ?? slugRaw : "";
  if (tipo.startsWith("web pago")) return exp ? `Vino a ${exp}` : "Pagó por la web";
  if (tipo.startsWith("registro web")) return exp ? `Se registró para ${exp}` : "Se registró";
  if (tipo.startsWith("transferencia")) return exp ? `Pagó por transferencia · ${exp}` : "Pagó por transferencia";
  if (tipo.includes("encuesta")) return "Contestó la encuesta";
  return s || "—";
}

/** Normaliza para AGRUPAR variantes, no para mostrar: la ciudad se muestra tal
 *  como la escribió cada quien. Sin esto no se puede ni contar el desorden. */
const claveCiudad = (c: string) =>
  c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");

export async function fetchBiblioteca(): Promise<Biblioteca> {
  const sb = createSupabaseAdminClient();
  const operatorId = await operadorDelAlcance();

  const [{ data: contacts }, { data: exps }, { data: slots }, { data: resvs }, { data: fbs }] =
    await Promise.all([
      sb.from("contacts").select("id, full_name, email, phone, city, birth_date, tags, source, mailing_opt_in"),
      sb.from("experiences").select("id, slug, data, operator_id"),
      sb.from("experience_slots").select("id, experience_id, label, starts_at"),
      sb.from("reservations").select("id, contact_id, experience_id, slot_id, status"),
      sb.from("experience_feedback").select("contact_id, status, loved_text, testimonial_text, testimonial_consent, created_at"),
    ]);

  type Exp = { id: string; slug: string; data: Partial<Experience> | null; operator_id: string | null };
  const listaExp = (exps ?? []) as Exp[];
  // ALCANCE: el operador ve a la gente de SUS experiencias. Se poda aquí, antes
  // de cualquier conteo — si se hiciera después, los números de las píldoras
  // ya estarían mal.
  const mias = new Set(
    listaExp.filter((e) => !operatorId || e.operator_id === operatorId).map((e) => e.id),
  );
  const titulo = new Map(listaExp.map((e) => [e.slug, experienceTitle(e.data, e.slug)]));
  const tituloPorId = new Map(listaExp.map((e) => [e.id, experienceTitle(e.data, e.slug)]));
  const slotPorId = new Map(
    ((slots ?? []) as { id: string; starts_at: string | null; label: string | null }[]).map((s) => [s.id, s]),
  );

  const viajesPor = new Map<string, ViajeBiblio[]>();
  for (const r of (resvs ?? []) as { contact_id: string; experience_id: string; slot_id: string | null; status: string }[]) {
    if (!HOLDING_STATUSES.includes(r.status)) continue;
    if (!mias.has(r.experience_id)) continue;
    const s = r.slot_id ? slotPorId.get(r.slot_id) : null;
    const ini = s?.starts_at ? new Date(s.starts_at) : null;
    const arr = viajesPor.get(r.contact_id) ?? [];
    arr.push({
      experiencia: tituloPorId.get(r.experience_id) ?? "—",
      cuando: ini
        ? `${MES[ini.getUTCMonth()].slice(0, 3)} ${ini.getUTCFullYear()}`
        : s?.label ?? "",
      orden: ini ? ini.getTime() : 0,
    });
    viajesPor.set(r.contact_id, arr);
  }

  const vozPor = new Map<string, PersonaBiblio["voz"]>();
  for (const f of (fbs ?? []) as {
    contact_id: string; status: string; loved_text: string | null;
    testimonial_text: string | null; testimonial_consent: boolean | null; created_at: string;
  }[]) {
    if (f.status !== "submitted") continue;
    const texto = (f.testimonial_text || f.loved_text || "").trim();
    if (!texto) continue;
    const d = new Date(f.created_at);
    const arr = vozPor.get(f.contact_id) ?? [];
    arr.push({
      texto,
      cuando: `${d.getUTCDate()} ${MES[d.getUTCMonth()].slice(0, 3)}`,
      publicable: !!f.testimonial_consent,
    });
    vozPor.set(f.contact_id, arr);
  }

  const hoy = new Date();
  const personas: PersonaBiblio[] = ((contacts ?? []) as {
    id: string; full_name: string | null; email: string | null; phone: string | null;
    city: string | null; birth_date: string | null; tags: string[] | null;
    source: string | null; mailing_opt_in: boolean | null;
  }[]).map((c) => {
    const viajes = (viajesPor.get(c.id) ?? []).sort((a, b) => b.orden - a.orden);
    const nac = c.birth_date ? c.birth_date.slice(0, 10).split("-") : null;
    const mes = nac ? parseInt(nac[1], 10) : null;
    const dia = nac ? parseInt(nac[2], 10) : null;
    const nombre = (c.full_name || c.email || "—").trim();
    return {
      id: c.id,
      nombre,
      iniciales: iniciales(nombre),
      ciudad: (c.city || "").trim(),
      origen: humanizarOrigen(c.source || "", titulo),
      viajes,
      ultimoOrden: viajes[0]?.orden ?? 0,
      telefono: (c.phone || "").trim() || null,
      email: (c.email || "").trim() || null,
      tags: (c.tags ?? []).filter(Boolean),
      boletin: !!c.mailing_opt_in,
      cumple: mes && dia ? `${dia} de ${MES[mes - 1]}` : null,
      cumpleMes: mes,
      cumpleDia: dia,
      voz: vozPor.get(c.id) ?? [],
    };
  });

  // ── Los cumpleaños: hoy, esta semana, los próximos 30 ──
  const dias = (p: PersonaBiblio) => {
    if (!p.cumpleMes || !p.cumpleDia) return null;
    const y = hoy.getFullYear();
    let d = new Date(y, p.cumpleMes - 1, p.cumpleDia);
    const h0 = new Date(y, hoy.getMonth(), hoy.getDate());
    if (d < h0) d = new Date(y + 1, p.cumpleMes - 1, p.cumpleDia);
    return Math.round((d.getTime() - h0.getTime()) / 86400000);
  };
  const conFecha = personas.filter((p) => dias(p) !== null);
  const cumples = {
    hoy: conFecha.filter((p) => dias(p) === 0),
    semana: conFecha.filter((p) => (dias(p) as number) > 0 && (dias(p) as number) <= 7),
    proximos: conFecha.filter((p) => (dias(p) as number) > 7 && (dias(p) as number) <= 30),
  };

  // ── La ciudad sucia. No se limpia sola: se AVISA con su cuenta. ──
  const porClave = new Map<string, Map<string, number>>();
  for (const p of personas) {
    if (!p.ciudad) continue;
    const k = claveCiudad(p.ciudad);
    if (!k) continue;
    const m = porClave.get(k) ?? new Map<string, number>();
    m.set(p.ciudad, (m.get(p.ciudad) ?? 0) + 1);
    porClave.set(k, m);
  }
  let ciudadSucia: Biblioteca["ciudadSucia"] = null;
  for (const m of porClave.values()) {
    if (m.size < 2) continue;
    const variantes = [...m.entries()].map(([texto, n]) => ({ texto, n })).sort((a, b) => b.n - a.n);
    const cuantas = variantes.reduce((a, v) => a + v.n, 0);
    if (!ciudadSucia || cuantas > ciudadSucia.cuantas) ciudadSucia = { cuantas, variantes };
  }

  personas.sort((a, b) => b.ultimoOrden - a.ultimoOrden || a.nombre.localeCompare(b.nombre));

  return {
    personas,
    cumples,
    ciudadSucia,
    conteos: {
      todos: personas.length,
      vinieron: personas.filter((p) => p.viajes.length > 0).length,
      todaviaNo: personas.filter((p) => p.viajes.length === 0).length,
      boletin: personas.filter((p) => p.boletin).length,
      conTag: personas.filter((p) => p.tags.length > 0).length,
    },
  };
}
