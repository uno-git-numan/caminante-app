"use server";

// LAS ACCIONES DE LOS CÓDIGOS DE DESCUENTO.
//   · cotizarCodigo: pública — el formulario de /reservar la llama al tocar
//     «Aplicar» para ENSEÑAR el descuento. No reserva nada ni gasta usos; el
//     checkout vuelve a resolver el código por su cuenta (nunca confía en esto).
//   · crearCodigo / apagarCodigo: sólo la casa (Recursos).

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { correoEnSesion, isCurrentUserAdmin } from "@/lib/auth/authorization";
import { parseMxnAmount } from "@/lib/payments/reservation-links";
import { normalizarCodigo, resolverCodigo, type TipoDescuento } from "@/lib/descuentos/codigos";
import type { Experience } from "@/lib/experiences/types";

export type Cotizacion = { ok: true; codigo: string; descuentoMxn: number; etiqueta: string } | { ok: false; error: string };

export async function cotizarCodigo(input: { slug: string; slotId: string; codigo: string; numPeople: number; tierIndex?: number }): Promise<Cotizacion> {
  const slug = String(input.slug ?? "").trim();
  const slotId = String(input.slotId ?? "").trim();
  if (!slug || !slotId) return { ok: false, error: "Elige primero tu salida." };
  const sb = createSupabaseAdminClient();
  const [{ data: exp }, { data: slot }] = await Promise.all([
    sb.from("experiences").select("id, data").eq("slug", slug).maybeSingle(),
    sb.from("experience_slots").select("id, price_mxn, experience_id").eq("id", slotId).maybeSingle(),
  ]);
  if (!exp || !slot || slot.experience_id !== exp.id) return { ok: false, error: "Elige primero tu salida." };
  const experience = (exp.data ?? null) as Partial<Experience> | null;
  // El mismo orden que createCheckout: nivel elegido → precio de la salida → base.
  const tiers = experience?.priceTiers ?? [];
  let perPerson: number | null = null;
  if (tiers.length) {
    const t = tiers[Number(input.tierIndex ?? -1)];
    if (!t) return { ok: false, error: "Elige primero tu nivel." };
    perPerson = parseMxnAmount(t.amount);
  }
  if (perPerson == null) perPerson = slot.price_mxn != null ? Number(slot.price_mxn) : parseMxnAmount(experience?.price?.amount);
  if (perPerson == null || perPerson <= 0) return { ok: false, error: "Esta salida no tiene precio." };
  const personas = Math.max(1, Math.min(20, Math.floor(Number(input.numPeople) || 1)));
  const r = await resolverCodigo(sb, { codigo: input.codigo, experienceId: exp.id as string, slotId, baseMxn: perPerson * personas });
  if (!r.ok) return r;
  return { ok: true, codigo: r.codigo, descuentoMxn: r.descuentoMxn, etiqueta: r.etiqueta };
}

export type NuevoCodigo = {
  codigo: string;
  tipo: TipoDescuento;
  valor: number;
  experienceSlug?: string | null;
  slotId?: string | null;
  usosMax?: number | null;
  vigenteDesde?: string | null;
  vigenteHasta?: string | null;
  nota?: string;
};

export async function crearCodigo(input: NuevoCodigo): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Sin permiso." };
  const codigo = normalizarCodigo(input.codigo);
  if (!codigo) return { ok: false, error: "El código: de 3 a 32 letras o números, sin espacios." };
  const tipo: TipoDescuento = input.tipo === "monto" ? "monto" : "porcentaje";
  const valor = Number(input.valor);
  if (!Number.isFinite(valor) || valor <= 0) return { ok: false, error: "Escribe cuánto descuenta." };
  if (tipo === "porcentaje" && valor >= 100) return { ok: false, error: "El porcentaje va de 1 a 99." };
  const usosMax = input.usosMax != null && input.usosMax !== 0 ? Math.floor(Number(input.usosMax)) : null;
  if (usosMax != null && usosMax <= 0) return { ok: false, error: "Los usos tienen que ser al menos 1 (o vacío: sin tope)." };
  const ymd = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
  const desde = ymd(input.vigenteDesde);
  const hasta = ymd(input.vigenteHasta);
  if (desde && hasta && hasta < desde) return { ok: false, error: "La vigencia termina antes de empezar." };

  const sb = createSupabaseAdminClient();
  let experienceId: string | null = null;
  let slotId: string | null = null;
  if (input.slotId) {
    const { data: s } = await sb.from("experience_slots").select("id, experience_id").eq("id", input.slotId).maybeSingle();
    if (!s) return { ok: false, error: "Esa salida no existe." };
    slotId = s.id as string;
    experienceId = s.experience_id as string;
  } else if (input.experienceSlug) {
    const { data: e } = await sb.from("experiences").select("id").eq("slug", input.experienceSlug).maybeSingle();
    if (!e) return { ok: false, error: "Esa experiencia no existe." };
    experienceId = e.id as string;
  }

  const { data, error } = await sb
    .from("codigos_descuento")
    .insert({
      codigo,
      tipo,
      valor,
      experience_id: experienceId,
      slot_id: slotId,
      usos_max: usosMax,
      vigente_desde: desde,
      vigente_hasta: hasta,
      nota: (input.nota ?? "").trim().slice(0, 200) || null,
      created_by: await correoEnSesion(),
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.code === "23505" ? "Ya existe un código con ese nombre." : error.message };
  revalidatePath("/caminante/admin/recursos");
  return { ok: true, id: data.id as string };
}

/** Apagar, no borrar: las reservas que lo usaron lo apuntan. */
export async function apagarCodigo(id: string, activo = false): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Sin permiso." };
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("codigos_descuento").update({ activo }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/caminante/admin/recursos");
  return { ok: true };
}
