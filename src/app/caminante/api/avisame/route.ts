import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { findOrCreateContact } from "@/lib/crm/contacts";

// «Avísame cuando abra fecha».
//
// El diseño pide una lista de espera y NO había tabla para eso. En vez de
// inventar una, se usa `leads` (0015), que existe justo para esto: un contacto
// interesado en una experiencia, con `source` que ya admite 'web'. Lo único que
// hoy la escribe es el webhook de WhatsApp, así que este es su segundo origen.
//
// Ojo con la diferencia contra `slot_requests`: aquel es PEDIR una fecha (nace
// una solicitud que el admin aprueba o rechaza); esto es solo «avísame», y no
// genera trabajo para nadie hasta que haya fecha.

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { email?: string; slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!email.includes("@") || email.length > 200) {
    return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
  }

  const sb = createSupabaseAdminClient();

  let experienceId: string | null = null;
  if (body.slug) {
    const { data } = await sb.from("experiences").select("id").eq("slug", body.slug).maybeSingle();
    experienceId = data?.id ?? null;
  }

  const contactRes = await findOrCreateContact(sb, { email, source: "avisame" });
  if (!contactRes.ok) return NextResponse.json({ error: contactRes.error }, { status: 500 });

  // Idempotente: apuntarse dos veces a lo mismo no crea dos leads.
  const { data: ya } = await sb
    .from("leads")
    .select("id")
    .eq("contact_id", contactRes.contact.id)
    .eq("source", "web")
    .is("slot_id", null)
    .filter("experience_id", experienceId ? "eq" : "is", experienceId ?? "null")
    .maybeSingle();

  if (!ya) {
    const { error } = await sb.from("leads").insert({
      contact_id: contactRes.contact.id,
      experience_id: experienceId,
      source: "web",
      status: "new",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
