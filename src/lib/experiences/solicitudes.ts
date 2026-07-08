"use server";

// "Solicitar nueva fecha": un viajero pide abrir una fecha para una experiencia
// existente (grupo privado con link cerrado, o salida abierta). NADIE paga aquí:
// la solicitud cae en `slot_requests`, notifica al admin y él la aprueba desde
// el panel (ahí nace la salida real). Ver plan "solicitar fecha + grupos".

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { findOrCreateContact } from "@/lib/crm/contacts";
import { getCurrentUser } from "@/lib/auth/session";
import { notifySolicitudFecha } from "@/lib/notifications/notify-admin";
import type { Experience } from "@/lib/experiences/types";

function fechaBonita(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export async function submitSlotRequest(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "").trim();
  const back = (q: string) => `/caminante/solicitar/${slug}?${q}`;
  if (!slug) redirect("/caminante");

  // Honeypot: los bots llenan el campo oculto "web"; un humano jamás lo ve.
  if (String(formData.get("web") ?? "").trim()) redirect(back("ok=1"));

  const nombre = String(formData.get("nombre") ?? "").trim();
  const correo = String(formData.get("correo") ?? "").trim().toLowerCase();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const fecha = String(formData.get("fecha") ?? "").trim(); // YYYY-MM-DD u ""
  const nota = String(formData.get("nota") ?? "").trim();
  const personas = Math.max(1, Math.min(80, parseInt(String(formData.get("personas") ?? "1"), 10) || 1));
  const tipo = String(formData.get("tipo") ?? "privado") === "abierta" ? "open" : "private";

  if (!nombre || !correo || !correo.includes("@") || !whatsapp) redirect(back("error=datos"));
  // La BD exige al menos una señal de cuándo quieren salir (check fecha_o_nota).
  if (!fecha && !nota) redirect(back("error=fecha"));
  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) redirect(back("error=fecha"));

  const sb = createSupabaseAdminClient();
  const { data: expRow } = await sb
    .from("experiences")
    .select("id, data, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!expRow || expRow.status !== "published") redirect("/caminante");
  const experience = expRow.data as Experience;

  // Mínimo releído del SERVIDOR (el form valida en cliente, pero no se confía).
  const min = Math.max(1, experience.minPeople ?? 1);
  if (personas < min) redirect(back("error=personas"));

  const user = await getCurrentUser().catch(() => null);
  const contacto = await findOrCreateContact(sb, {
    email: correo,
    fullName: nombre,
    phone: whatsapp,
    source: `solicitud fecha · ${slug}`,
    userId: user?.id ?? null,
  });
  if (!contacto.ok) redirect(back("error=guardar"));

  // Dedupe suave: misma solicitud NUEVA del mismo contacto/experiencia/fecha →
  // no se duplica (doble click o reenvío del form).
  let dupQuery = sb
    .from("slot_requests")
    .select("id")
    .eq("experience_id", expRow.id)
    .eq("contact_id", contacto.contact.id)
    .eq("status", "new");
  dupQuery = fecha ? dupQuery.eq("desired_date", fecha) : dupQuery.is("desired_date", null);
  const { data: dup } = await dupQuery;

  if (!dup?.length) {
    const { error } = await sb.from("slot_requests").insert({
      experience_id: expRow.id,
      contact_id: contacto.contact.id,
      desired_date: fecha || null,
      nota: nota || null,
      num_people: personas,
      group_type: tipo,
    });
    if (error) redirect(back("error=guardar"));

    const titulo =
      [experience.title, experience.titleAccent].filter(Boolean).join(" ").trim() ||
      experience.docTitle ||
      slug;
    // Best-effort: una notificación caída jamás rompe la solicitud.
    await notifySolicitudFecha({
      cliente: nombre,
      whatsapp,
      experiencia: titulo,
      fecha: fecha ? fechaBonita(fecha) : `flexible${nota ? `: ${nota}` : ""}`,
      personas,
      tipo: tipo === "private" ? "privado" : "abierto",
      ...(nota ? { nota } : {}),
    }).catch(() => {});
  }

  redirect(back("ok=1"));
}
