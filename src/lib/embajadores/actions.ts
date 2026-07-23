"use server";

// APLICACIÓN al programa de embajadores (formulario público de
// /caminante/embajadores). Patrón de submitSlotRequest: honeypot que finge
// éxito a los bots, validación server-side, y estado comunicado SOLO por query
// param (?ok / ?error) — es página pública dinámica, sin revalidatePath.
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emailConfirmacionAplicacion, emailAvisoAdminAplicacion } from "@/lib/embajadores/emails";

const PERFILES = new Set(["creador", "agencia", "comunidad"]);
const back = (q: string): never => redirect(`/caminante/embajadores?${q}#aplicar`);

const clean = (v: FormDataEntryValue | null, max = 400): string =>
  String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
// Los campos largos conservan saltos de línea (se leen en el panel).
const cleanLargo = (v: FormDataEntryValue | null, max = 2000): string =>
  String(v ?? "").replace(/\r/g, "").trim().slice(0, max);

export async function submitAmbassadorApplication(formData: FormData): Promise<void> {
  // Honeypot: a los bots se les finge éxito (jamás se les enseña el error).
  if (clean(formData.get("web"))) back("ok=1");

  const nombre = clean(formData.get("nombre"), 160);
  const email = clean(formData.get("correo"), 200).toLowerCase();
  const whatsapp = clean(formData.get("whatsapp"), 40);
  const perfil = clean(formData.get("perfil"), 20);
  const links = cleanLargo(formData.get("links"), 800);
  const experiencia = cleanLargo(formData.get("experiencia"));
  const porque = cleanLargo(formData.get("porque"));
  const conociste = clean(formData.get("conociste"), 200);

  if (!nombre || !email.includes("@") || !whatsapp) back("error=datos");
  if (!PERFILES.has(perfil)) back("error=perfil");
  if (!links) back("error=links");

  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("ambassador_applications").insert({
    full_name: nombre,
    email,
    whatsapp,
    profile_kind: perfil,
    social_links: links,
    experience: experiencia || null,
    why_caminante: porque || null,
    referral_source: conociste || null,
  });
  if (error) {
    // Único índice de la tabla: una aplicación PENDIENTE por correo.
    if (error.code === "23505") back("error=duplicada");
    console.error("submitAmbassadorApplication:", error);
    back("error=guardar");
  }

  // Correos best-effort: la aplicación YA está guardada — un fallo de correo
  // jamás le enseña un error al aplicante.
  const res = await Promise.allSettled([
    emailConfirmacionAplicacion(email, nombre),
    emailAvisoAdminAplicacion({ nombre, email, whatsapp, perfil, links }),
  ]);
  for (const r of res) if (r.status === "rejected") console.error("embajadores correo:", r.reason);

  back("ok=1");
}
