// EL TABLERO DEL CRM — quién está preguntando y todavía no paga.
//
// LA UNIDAD ES PERSONA × SALIDA, no persona. Alguien puede estar interesado en
// Barrancas y ser ya viajero de Hongos: son dos cosas distintas y no se pisan.
//
// Las tres primeras etapas se mueven a mano. Las tres últimas NO: Pagado cae
// con el webhook de Stripe, Preparando cuando el pago está confirmado, y Viajó
// cuando pasa la fecha. Nadie puede declarar pagado a quien no pagó — el dinero
// lo dice el banco, no un arrastre.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { experienceTitle, operadorDelAlcance } from "@/lib/admin/queries";
import { iniciales } from "@/lib/admin/formato";
import type { Experience } from "@/lib/experiences/types";
import type { EtapaId } from "@/lib/comunidad/etapas";

export type Tarjeta = {
  id: string;
  stage: EtapaId;
  persona: string;
  iniciales: string;
  experiencia: string;
  salida: string | null;
  personas: number;
  origen: string;
  /** Días desde que se movió por última vez. Una tarjeta olvidada no avisa. */
  diasQuieta: number;
  /** Se pone fría a los 7 días sin moverse. */
  fria: boolean;
  motivoCaida: string | null;
  telefono: string | null;
  email: string | null;
};

export type Tablero = { tarjetas: Tarjeta[]; caidas: Tarjeta[]; total: number };

const ORIGEN: Record<string, string> = {
  solicitud: "Solicitud de grupo",
  whatsapp: "Llegó por WhatsApp",
  embajador: "La trajo un embajador",
  manual: "Alta a mano",
};

export async function fetchTablero(): Promise<Tablero> {
  const sb = createSupabaseAdminClient();
  const operatorId = await operadorDelAlcance();

  const [{ data: cards }, { data: exps }, { data: slots }, { data: contacts }] = await Promise.all([
    sb.from("crm_cards").select("*").order("stage_changed_at", { ascending: true }),
    sb.from("experiences").select("id, slug, data, operator_id"),
    sb.from("experience_slots").select("id, label, starts_at"),
    sb.from("contacts").select("id, full_name, email, phone"),
  ]);

  type Exp = { id: string; slug: string; data: Partial<Experience> | null; operator_id: string | null };
  const titulo = new Map(
    ((exps ?? []) as Exp[]).map((e) => [e.id, experienceTitle(e.data, e.slug)]),
  );
  // ALCANCE: el operador ve SUS tarjetas. Se poda antes de contar nada.
  const mias = new Set(((exps ?? []) as Exp[]).filter((e) => !operatorId || e.operator_id === operatorId).map((e) => e.id));
  const slotLabel = new Map(
    ((slots ?? []) as { id: string; label: string | null }[]).map((s) => [s.id, s.label]),
  );
  const persona = new Map(
    ((contacts ?? []) as { id: string; full_name: string | null; email: string | null; phone: string | null }[])
      .map((c) => [c.id, c]),
  );

  const hoy = Date.now();
  const todas: Tarjeta[] = ((cards ?? []) as Record<string, unknown>[])
    .filter((c) => mias.has(String(c.experience_id)))
    .map((c) => {
      const p = persona.get(String(c.contact_id));
      const nombre = (p?.full_name || p?.email || "—").trim();
      const dias = Math.floor((hoy - new Date(String(c.stage_changed_at)).getTime()) / 86400000);
      return {
        id: String(c.id),
        stage: String(c.stage) as EtapaId,
        persona: nombre,
        iniciales: iniciales(nombre),
        experiencia: titulo.get(String(c.experience_id)) ?? "—",
        salida: c.slot_id ? slotLabel.get(String(c.slot_id)) ?? null : null,
        personas: Number(c.num_people) || 1,
        origen: ORIGEN[String(c.origen)] ?? String(c.origen),
        diasQuieta: Math.max(0, dias),
        // Siete días sin moverse. No es un número mágico: es una semana sin
        // contestarle a alguien que preguntó.
        fria: dias >= 7 && String(c.stage) !== "viajo",
        motivoCaida: (c.motivo_caida as string) ?? null,
        telefono: p?.phone ?? null,
        email: p?.email ?? null,
      };
    });

  return {
    tarjetas: todas.filter((t) => t.stage !== "caido"),
    caidas: todas.filter((t) => t.stage === "caido"),
    total: todas.length,
  };
}
