"use server";

// GUARDAR LA COTIZACIÓN — cerrar el ciclo sin hoja de cálculo.
//
// Hasta aquí el cotizador calculaba y no dejaba rastro: se armaba la cuenta de
// una salida, se mandaba por WhatsApp y al cerrar la pestaña se perdía. Lo que
// falta no es una tabla nueva —eso daría DOS verdades sobre lo que cuesta una
// salida, y la que gobierna el equilibrio sería la que no estás editando— sino
// escribir en las mismas tres cosas de las que ya lee todo el panel:
// `experiences` (el borrador y sus cortesías), `experience_slots` (fecha, cupo,
// precio) y `experience_costs` (los renglones con su modo).
//
// Las escrituras de la SALIDA pasan por `crearSalida`/`updateSlot`, que no son
// un rodeo: ahí viven las guardas que ya costaron caro (no bajar el cupo por
// debajo de lo vendido, no fechar el fin antes del inicio —dispara la encuesta
// «¿cómo te fue?» ANTES del viaje—, no duplicar una fecha). Reescribirlas aquí
// sería tener dos reglas para la misma salida y que una se quedara vieja.

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { alcanceActual, esOperador, puedeEditarExperiencia } from "@/lib/auth/alcance";
import { fetchSlotAvailability } from "@/lib/experiences/availability";
import { crearSalida, updateSlot } from "@/lib/admin/eventos-actions";
import type { Cortesia } from "./costeo";
import type { Ambito, LineaGuardable } from "./cotizacion";

export type CotizacionPayload = {
  /** La salida que se está cotizando. null = todavía no existe, se crea. */
  slotId: string | null;
  /** Su experiencia. null = experiencia nueva, nace en BORRADOR. */
  experienceId: string | null;
  /** Solo para experiencia nueva: de aquí salen el título y el slug. */
  nombre: string;
  etiqueta: string;
  fecha: string; // YYYY-MM-DD
  fin: string; // YYYY-MM-DD, "" = sin fecha de fin
  cupo: number | null;
  publico: number;
  operatorId: string | null;
  cortesias: Cortesia[];
  costos: LineaGuardable[];
  /** El admin ya vio que esto le mueve el precio a una salida vendida. */
  confirmaPrecio?: boolean;
};

export type GuardarResult =
  | { ok: true; slotId: string; experienceId: string; slug: string; aviso: string | null }
  // code "precio_cambia": la salida ya tiene lugares apartados y el precio que
  // trae la cotización no es el que se les prometió. Mismo trato que el
  // `slug_exists` de saveExperience: no se decide callado, se pregunta.
  | { ok: false; error: string; code?: "precio_cambia" };

const fail = (error: string, code?: "precio_cambia"): GuardarResult => ({ ok: false, error, code });

/** Título → slug. Igual que los slugs que ya viven en la tabla: minúsculas y guiones. */
function slugificar(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * LA FILA, CON LA FORMA EXACTA QUE EXIGE EL CHECK.
 *
 * `experience_costs_modo_coherente` (0057) no acepta una fila «casi»: cada modo
 * obliga a que los campos de los OTROS modos vengan en NULL, y en los cuatro
 * derivados `monto_mxn` tiene que ser 0. No es burocracia — es lo que evita que
 * una tarifa vieja se quede pegada al cambiar de modo en la pantalla y siga
 * cobrándose sin que nadie la vea. Por eso se parte de todo en NULL y solo se
 * enciende lo del modo, en vez de copiar la línea tal cual viene del navegador.
 *
 * `proporcion` sigue la misma regla: solo se guarda donde el motor la LEE
 * (`por_persona` y `tarifa_por_tramo`). En `unico`, `desde_personas` y
 * `porcentaje`, `costoDeLinea` ni la mira, así que guardarla sería dejar
 * escrito un supuesto que no afecta la cuenta: el renglón diría «la toma la
 * mitad» y la cuenta la cobraría entera.
 */
function filaDeLinea(
  l: LineaGuardable,
  experienceId: string,
  slotId: string,
): Record<string, unknown> | { error: string } {
  const concepto = (l.concepto ?? "").trim();
  if (!concepto) return { error: "Hay un costo sin concepto. Ponle nombre o quítalo." };

  const tipo = l.tipo === "fijo" || l.tipo === "buffer" ? l.tipo : "variable";
  const base: Record<string, unknown> = {
    experience_id: experienceId,
    slot_id: l.ambito === "salida" ? slotId : null,
    concepto,
    tipo,
    monto_mxn: 0,
    tarifa_mxn: null,
    escalones: null,
    tramos: null,
    porcentaje: null,
    proporcion: null,
    modo: l.modo,
  };

  const prop =
    l.proporcion != null && l.proporcion > 0 && l.proporcion <= 1 ? l.proporcion : null;

  switch (l.modo) {
    case "unico": {
      const m = Number(l.montoMxn ?? 0);
      if (!Number.isFinite(m) || m < 0) return { error: `«${concepto}»: el monto no puede ser negativo.` };
      return { ...base, monto_mxn: m };
    }
    case "por_persona": {
      const t = Number(l.tarifaMxn ?? 0);
      if (!Number.isFinite(t) || t < 0) return { error: `«${concepto}»: la tarifa no puede ser negativa.` };
      return { ...base, tarifa_mxn: t, proporcion: prop };
    }
    case "tarifa_por_tramo": {
      const tramos = (l.tramos ?? []).filter((t) => Number.isFinite(t.desde) && Number.isFinite(t.tarifa));
      if (!tramos.length) return { error: `«${concepto}»: la tarifa por tramo necesita al menos un tramo.` };
      return { ...base, tramos, proporcion: prop };
    }
    case "desde_personas": {
      const escalones = (l.escalones ?? []).filter((e) => Number.isFinite(e.desde) && Number.isFinite(e.monto));
      if (!escalones.length) return { error: `«${concepto}»: el escalón necesita al menos un tramo.` };
      return { ...base, escalones };
    }
    case "porcentaje": {
      const p = Number(l.porcentaje ?? 0);
      if (!Number.isFinite(p) || p < 0) return { error: `«${concepto}»: el porcentaje no puede ser negativo.` };
      return { ...base, porcentaje: p };
    }
    default:
      return { error: `«${concepto}»: modo de costo desconocido.` };
  }
}

export async function guardarCotizacionAction(p: CotizacionPayload): Promise<GuardarResult> {
  const alcance = await alcanceActual();
  if (!alcance) return fail("No autorizado. Inicia sesión.");

  if (!p.fecha || Number.isNaN(Date.parse(`${p.fecha}T12:00:00Z`))) {
    return fail("La salida necesita una fecha.");
  }
  if (!(p.publico > 0)) return fail("El precio público tiene que ser mayor que cero.");

  const sb = createSupabaseAdminClient();

  // ── 1 · La experiencia ────────────────────────────────────────────────────
  let experienceId = p.experienceId;
  let slug: string;

  if (experienceId) {
    if (!(await puedeEditarExperiencia(experienceId))) return fail("Esa experiencia no es tuya.");
    const { data: exp } = await sb
      .from("experiences")
      .select("slug")
      .eq("id", experienceId)
      .maybeSingle();
    if (!exp) return fail("Esa experiencia ya no existe.");
    slug = String((exp as { slug: string }).slug);
  } else {
    const nombre = (p.nombre ?? "").trim();
    if (!nombre) return fail("Ponle nombre a la experiencia para guardarla.");
    const raiz = slugificar(nombre);
    if (!raiz) return fail("Ese nombre no da un identificador utilizable. Usa letras o números.");

    // Un slug libre. No se sobrescribe una experiencia existente por tener el
    // mismo nombre: `saveExperience` bloquea justo eso porque el upsert por
    // slug la reemplazaría entera, y aquí el riesgo es idéntico.
    const { data: parecidos } = await sb
      .from("experiences")
      .select("slug")
      .like("slug", `${raiz}%`);
    const tomados = new Set(((parecidos ?? []) as { slug: string }[]).map((e) => e.slug));
    slug = raiz;
    for (let n = 2; tomados.has(slug); n++) slug = `${raiz}-${n}`;

    // Nace en BORRADOR y sin fotos: es la mitad que le toca a Luis. Lo único
    // que se siembra en `data` es el título, que es de donde lo lee todo el
    // panel (`experienceTitle`) — el resto lo llena él en «+ experiencia».
    const fila: Record<string, unknown> = {
      slug,
      status: "draft",
      data: { slug, title: nombre, status: "draft" },
    };
    if (p.operatorId) fila.operator_id = p.operatorId;
    else if (esOperador(alcance)) fila.operator_id = alcance.operatorId;

    const { data: creada, error } = await sb
      .from("experiences")
      .insert(fila)
      .select("id")
      .single();
    if (error || !creada) return fail(error?.message ?? "No se pudo crear la experiencia.");
    experienceId = String((creada as { id: string }).id);
  }

  // ── 2 · La salida ─────────────────────────────────────────────────────────
  const startsAt = `${p.fecha}T12:00:00Z`;
  const endsAt = p.fin ? `${p.fin}T23:00:00Z` : null;
  const etiqueta = (p.etiqueta ?? "").trim() || p.fecha;
  let slotId = p.slotId;
  let aviso: string | null = null;

  if (slotId) {
    // ⚠️ EL PRECIO DE LA SALIDA ES EL QUE COBRA EL CHECKOUT (`checkout.ts`
    // lo lee como segunda prioridad, después de los niveles). El cotizador es
    // una herramienta de «qué pasaría si»: se mueve el precio para ver la
    // tabla, y guardar sin preguntar le cambiaría el precio a gente que ya
    // apartó su lugar. Con lugares tomados se pide confirmación explícita.
    const { data: slot } = await sb
      .from("experience_slots")
      .select("id, experience_id, price_mxn")
      .eq("id", slotId)
      .maybeSingle();
    if (!slot) return fail("Esa salida ya no existe.");
    const s = slot as { experience_id: string; price_mxn: number | null };
    if (s.experience_id !== experienceId) {
      return fail("Esa salida es de otra experiencia. Vuelve a elegirla en el selector.");
    }

    const previo = s.price_mxn != null ? Number(s.price_mxn) : null;
    if (previo !== p.publico) {
      const taken = (await fetchSlotAvailability(experienceId)).get(slotId)?.taken ?? 0;
      if (taken > 0 && !p.confirmaPrecio) {
        return fail(
          previo != null
            ? `Esta salida ya tiene ${taken} lugares apartados a $${previo.toLocaleString("es-MX")} por persona. Guardar la deja en $${p.publico.toLocaleString("es-MX")}.`
            : `Esta salida ya tiene ${taken} lugares apartados y no tenía precio propio (cobraba el base de la experiencia). Guardar la deja en $${p.publico.toLocaleString("es-MX")}.`,
          "precio_cambia",
        );
      }
      if (taken > 0) {
        aviso = `Le cambiaste el precio a una salida con ${taken} lugares ya apartados: revisa esas reservas.`;
      }
    }

    const r = await updateSlot({
      slotId,
      slug,
      label: etiqueta,
      startsAt,
      endsAt,
      capacityTotal: p.cupo,
      priceMxn: p.publico,
    });
    if (!r.ok) return fail(r.error);
  } else {
    const r = await crearSalida({
      experienceId,
      slug,
      label: etiqueta,
      startsAt,
      endsAt,
      capacityTotal: p.cupo,
      priceMxn: p.publico,
    });
    if (!r.ok) return fail(r.error);
    if (!r.slotId) return fail("La salida se creó pero no devolvió id.");
    slotId = r.slotId;
  }

  // ── 3 · Las cortesías ─────────────────────────────────────────────────────
  // Viven en la EXPERIENCIA porque los mismos dos guías afectan a todos sus
  // costos por persona (0057). Se guarda el arreglo tal cual, vacío incluido:
  // «no va nadie de cortesía» es una respuesta, y dejarlo en NULL la
  // confundiría con «nunca se preguntó».
  const cortesias = (p.cortesias ?? [])
    .filter((c) => Number(c.cuantas) > 0)
    .map((c) => ({
      rol: (c.rol ?? "").trim() || "cortesía",
      cuantas: Math.max(0, Math.trunc(Number(c.cuantas) || 0)),
      descuento_pct: Math.min(100, Math.max(0, Number(c.descuentoPct) || 0)),
    }));
  const { error: eCort } = await sb
    .from("experiences")
    .update({ cabezas_cortesia: cortesias })
    .eq("id", experienceId);
  if (eCort) return fail(eCort.message);

  // ── 4 · Los costos ────────────────────────────────────────────────────────
  // Se valida TODO antes de escribir nada: si la línea 4 está mal, las tres
  // primeras no deben quedar guardadas a medias.
  const filas: { id: string | null; ambito: Ambito; fila: Record<string, unknown> }[] = [];
  for (const l of p.costos) {
    // Una línea en blanco (la que aparece sola al abrir) no es un costo.
    if (!(l.concepto ?? "").trim() && !l.montoMxn && !l.tarifaMxn && !l.porcentaje) continue;
    const r = filaDeLinea(l, experienceId, slotId);
    if ("error" in r) return fail(r.error as string);
    filas.push({ id: l.id, ambito: l.ambito, fila: r });
  }

  // Lo que este cotizador GOBIERNA es exactamente lo que leyó: los costos de
  // esta salida más los de su experiencia. Los de las OTRAS fechas de la misma
  // experiencia no se tocan — borrarlos aquí sería descostear salidas que esta
  // pantalla ni siquiera mostró.
  const { data: previas } = await sb
    .from("experience_costs")
    .select("id, slot_id")
    .eq("experience_id", experienceId);
  const gobernadas = ((previas ?? []) as { id: string; slot_id: string | null }[]).filter(
    (c) => c.slot_id === slotId || c.slot_id === null,
  );
  const vivas = new Set(filas.map((f) => f.id).filter(Boolean) as string[]);
  const aBorrar = gobernadas.filter((c) => !vivas.has(c.id)).map((c) => c.id);

  if (aBorrar.length) {
    const { error } = await sb.from("experience_costs").delete().in("id", aBorrar);
    if (error) return fail(error.message);
  }
  for (const f of filas.filter((x) => x.id)) {
    const { error } = await sb.from("experience_costs").update(f.fila).eq("id", f.id as string);
    if (error) return fail(error.message);
  }
  const nuevas = filas.filter((x) => !x.id).map((x) => x.fila);
  if (nuevas.length) {
    const { error } = await sb.from("experience_costs").insert(nuevas);
    if (error) return fail(error.message);
  }

  revalidatePath("/caminante/admin/recursos/cotizador");
  revalidatePath("/caminante/admin/recursos");
  revalidatePath("/caminante/admin/salidas");
  revalidatePath(`/caminante/admin/eventos/${slug}`);

  return { ok: true, slotId, experienceId, slug, aviso };
}
