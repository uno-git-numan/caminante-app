"use server";

// LAS ACCIONES DEL ESPACIO DEL GRUPO.
//
// Entrar al grupo = tener cuenta (correo + contraseña, Google o Apple) con
// celular + una fila en grupo_lugares. La cuenta nace AL INSTANTE: se crea ya
// confirmada y se abre la sesión en el mismo paso. El celular se pide, no se
// verifica (7 nov 2026): la verificación por código mandado por correo dejó
// fuera a casi todos los invitados de Volcanes —a una persona nueva el token
// que se generaba era de alta sin confirmar y el canje como liga mágica lo
// rechazaba SIEMPRE— y Luis pidió cuenta con contraseña, Google y Apple.
// Cuando haya número real de WhatsApp, verificar el celular vuelve como paso
// aparte, nunca como candado para entrar.
//
// Nada de aquí mueve dinero: apartar y pagar por otros van por /reservar y
// createCheckout, con `lugar` / `cubre` como únicas señas nuevas.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { puedeEditarSlot } from "@/lib/auth/alcance";
import { findOrCreateContact } from "@/lib/crm/contacts";
import { cleanGrupoToken } from "@/lib/experiences/availability";
import { fetchEspacio, contactoDeUsuario, type Espacio } from "@/lib/grupo/espacio";
import { celularE164 } from "@/lib/grupo/celular";
import { avisarAnfitriona } from "@/lib/grupo/mensajes";

const ahora = () => new Date().toISOString();

type Sb = ReturnType<typeof createSupabaseAdminClient>;

const ruta = (token: string, sub = "") => `/caminante/g/${token}${sub}`;
const conError = (token: string, sub: string, e: string) => `${ruta(token, sub)}?error=${encodeURIComponent(e)}`;

/**
 * La persona queda ADENTRO: su fila en grupo_lugares y su tarjeta en el CRM
 * (origen 'grupo', directo en Interesado). Idempotente.
 */
async function darLugar(sb: Sb, e: Espacio, contactId: string, userId: string | null): Promise<void> {
  const esAnfitrion = e.anfitrion?.contactId === contactId;
  const { data: ya } = await sb.from("grupo_lugares").select("id, user_id").eq("slot_id", e.slotId).eq("contact_id", contactId).maybeSingle();
  if (ya) {
    if (!ya.user_id && userId) await sb.from("grupo_lugares").update({ user_id: userId, updated_at: ahora() }).eq("id", ya.id as string);
  } else {
    await sb.from("grupo_lugares").insert({
      slot_id: e.slotId,
      contact_id: contactId,
      user_id: userId,
      rol: esAnfitrion ? "anfitrion" : "invitado",
    });
  }
  // La tarjeta del CRM: la anfitriona ya tiene la suya (nació con la solicitud).
  // Un invitado nace en Interesado con «Falta pagar». Si ya hay tarjeta viva de
  // esta persona en esta salida (índice único), no se duplica.
  const { data: tarjeta } = await sb
    .from("crm_cards")
    .select("id")
    .eq("contact_id", contactId)
    .eq("slot_id", e.slotId)
    .neq("stage", "caido")
    .limit(1)
    .maybeSingle();
  if (!tarjeta && !esAnfitrion) {
    const { data: exp } = await sb.from("experiences").select("operator_id").eq("id", e.experienceId).maybeSingle();
    await sb
      .from("crm_cards")
      .insert({
        contact_id: contactId,
        experience_id: e.experienceId,
        slot_id: e.slotId,
        operator_id: (exp?.operator_id as string | null) ?? null,
        num_people: 1,
        origen: "grupo",
        stage: "interesado",
      })
      .then(() => undefined, (err) => console.error("darLugar tarjeta:", err));
  }
}

/**
 * C2 · «Entrar»: nombre, celular, correo y contraseña. Crea la cuenta YA
 * confirmada, abre la sesión y deja a la persona adentro, en un solo paso.
 * Con sesión (Google, Apple, contraseña), sólo pide el celular.
 */
export async function entrarAlGrupo(formData: FormData): Promise<void> {
  const token = cleanGrupoToken(formData.get("token"));
  if (!token) redirect("/caminante");
  const e = await fetchEspacio(token);
  if (!e) redirect("/caminante");

  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 120);
  const celular = celularE164(String(formData.get("celular") ?? ""));
  const correoForm = String(formData.get("correo") ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(formData.get("password") ?? "");
  if (!celular) redirect(conError(token, "/entrar", "celular"));

  const sb = createSupabaseAdminClient();
  let user = await getCurrentUser();
  let nombreFinal: string | null = nombre || null;

  if (user) {
    const c = await contactoDeUsuario(user);
    nombreFinal = nombreFinal || c?.full_name || (user.user_metadata?.full_name as string | undefined) || null;
  } else {
    if (!correoForm.includes("@")) redirect(conError(token, "/entrar", "correo"));
    if (!nombre) redirect(conError(token, "/entrar", "nombre"));
    if (password.length < 8) redirect(conError(token, "/entrar", "password"));
    // La cuenta nace confirmada: nada de correos de confirmación que se abren
    // en otro navegador y mueren (PKCE). Si el correo ya tiene cuenta, se le
    // dice y se le manda a entrar con ella.
    const creado = await sb.auth.admin.createUser({
      email: correoForm,
      password,
      email_confirm: true,
      user_metadata: { full_name: nombre },
    });
    if (creado.error) {
      if (/already|exists|registered/i.test(creado.error.message)) redirect(conError(token, "/entrar", "existe"));
      console.error("entrarAlGrupo createUser:", creado.error.message);
      redirect(conError(token, "/entrar", "No pudimos crear tu cuenta. Inténtalo otra vez."));
    }
    // La sesión queda en cookies en este mismo request.
    const auth = await createSupabaseServerClient();
    const { data, error } = await auth.auth.signInWithPassword({ email: correoForm, password });
    if (error || !data.user) {
      console.error("entrarAlGrupo signIn:", error?.message);
      redirect(conError(token, "/entrar", "Tu cuenta ya existe; entra con tu contraseña."));
    }
    user = data.user;
  }

  const email = (user.email ?? correoForm).toLowerCase();
  const contacto = await findOrCreateContact(sb, {
    email,
    fullName: nombreFinal ?? undefined,
    phone: celular,
    source: `espacio del grupo · ${e.slug}`,
    userId: user.id,
  });
  if (!contacto.ok) redirect(conError(token, "/entrar", contacto.error));
  await sb
    .from("contacts")
    .update({ phone: celular, ...(contacto.contact.user_id ? {} : { user_id: user.id }), updated_at: ahora() })
    .eq("id", contacto.contact.id);

  await darLugar(sb, e, contacto.contact.id, user.id);
  revalidatePath(ruta(token));
  redirect(ruta(token));
}

/** Con sesión y celular en la ficha: entrar al grupo es un clic. */
export async function entrarConSesion(formData: FormData): Promise<void> {
  const token = cleanGrupoToken(formData.get("token"));
  if (!token) redirect("/caminante");
  const user = await getCurrentUser();
  if (!user) redirect(ruta(token, "/entrar"));
  const e = await fetchEspacio(token);
  if (!e) redirect("/caminante");
  const c = await contactoDeUsuario(user);
  if (!c || !c.phone) redirect(ruta(token, "/entrar"));
  await darLugar(createSupabaseAdminClient(), e, c.id, user.id);
  revalidatePath(ruta(token));
  redirect(ruta(token));
}

/** Cupo lleno: «avísame si se abre un lugar». */
export async function apuntarseEnListaDeEspera(formData: FormData): Promise<void> {
  const token = cleanGrupoToken(formData.get("token"));
  if (!token) redirect("/caminante");
  const user = await getCurrentUser();
  if (!user) redirect(ruta(token, "/entrar"));
  const e = await fetchEspacio(token);
  if (!e) redirect("/caminante");
  const c = await contactoDeUsuario(user);
  if (!c) redirect(ruta(token, "/entrar"));
  const sb = createSupabaseAdminClient();
  await sb
    .from("grupo_lugares")
    .update({ lista_espera_at: ahora(), avisado_lugar_at: null, updated_at: ahora() })
    .eq("slot_id", e.slotId)
    .eq("contact_id", c.id)
    .is("lista_espera_at", null);
  revalidatePath(ruta(token));
  redirect(`${ruta(token)}?espera=1`);
}

/**
 * El panel: «Mandarle su liga» a la anfitriona. Completa lo que una salida
 * privada abierta ANTES del espacio no tiene (anfitrión, fecha límite, su
 * lugar) y manda A1/A2 por correo y WhatsApp. También sirve para reenviar.
 */
export async function mandarLigaALaAnfitriona(slotId: string): Promise<{ ok: true; aviso: string; waUrl: string | null } | { ok: false; error: string }> {
  if (!(await puedeEditarSlot(slotId))) return { ok: false, error: "Sin permiso." };
  const sb = createSupabaseAdminClient();
  const { data: slot } = await sb
    .from("experience_slots")
    .select("id, experience_id, access_token, visibility, status, starts_at, anfitrion_contact_id, fecha_limite, minimo")
    .eq("id", slotId)
    .maybeSingle();
  if (!slot || !slot.access_token) return { ok: false, error: "Esa salida no tiene liga." };

  // Quién es el anfitrión: lo que diga la salida, o la tarjeta viva ligada a ella.
  let anfitrion = slot.anfitrion_contact_id as string | null;
  if (!anfitrion) {
    const { data: card } = await sb
      .from("crm_cards")
      .select("contact_id")
      .eq("slot_id", slotId)
      .neq("stage", "caido")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    anfitrion = (card?.contact_id as string | null) ?? null;
  }
  if (!anfitrion) return { ok: false, error: "Esta salida no tiene tarjeta en el CRM: no sé quién es el anfitrión." };

  const patch: Record<string, unknown> = { anfitrion_contact_id: anfitrion, updated_at: ahora() };
  if (!slot.fecha_limite) {
    const inicio = String(slot.starts_at).slice(0, 10);
    const hoyYmd = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
    const manana = new Date(Date.parse(`${hoyYmd}T12:00:00Z`) + 86400000).toISOString().slice(0, 10);
    const dosSemanas = new Date(Date.parse(`${inicio}T12:00:00Z`) - 14 * 86400000).toISOString().slice(0, 10);
    patch.fecha_limite = dosSemanas > manana ? dosSemanas : manana < inicio ? manana : null;
  }
  if (slot.minimo == null) {
    const { data: exp } = await sb.from("experiences").select("data->>minPeople").eq("id", slot.experience_id as string).maybeSingle();
    const min = parseInt(String((exp as { minPeople?: string } | null)?.minPeople ?? ""), 10);
    if (Number.isInteger(min) && min >= 1) patch.minimo = min;
  }
  await sb.from("experience_slots").update(patch).eq("id", slotId);
  await sb.from("grupo_lugares").upsert({ slot_id: slotId, contact_id: anfitrion, rol: "anfitrion" }, { onConflict: "slot_id,contact_id", ignoreDuplicates: true });

  const e = await fetchEspacio(slot.access_token as string);
  if (!e) return { ok: false, error: "No se pudo cargar el espacio." };
  const r = await avisarAnfitriona(e);
  const aviso =
    r.whatsapp && r.correo
      ? "Le llegó por WhatsApp y correo con su liga y el mensaje para su grupo."
      : r.correo
        ? "Le llegó por correo. Por WhatsApp no salió (sin plantilla aprobada o sin número real): se abre para que lo mandes tú."
        : r.whatsapp
          ? "Le llegó por WhatsApp."
          : "No salió por ningún lado: mándaselo con la liga que se abre.";
  revalidatePath("/caminante/admin/comunidad");
  revalidatePath("/caminante/admin/salidas");
  return { ok: true, aviso, waUrl: r.waUrl };
}

/** El panel (D2/D3): fecha límite y mínimo de una salida privada. */
export async function guardarLimitesDeGrupo(
  slotId: string,
  fechaLimite: string,
  minimo: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await puedeEditarSlot(slotId))) return { ok: false, error: "Sin permiso." };
  const fecha = fechaLimite.trim();
  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { ok: false, error: "Fecha inválida." };
  const min = minimo.trim() === "" ? null : parseInt(minimo, 10);
  if (min != null && (!Number.isInteger(min) || min < 1)) return { ok: false, error: "El mínimo es un entero de 1 en adelante." };
  const sb = createSupabaseAdminClient();
  const { data: slot } = await sb.from("experience_slots").select("starts_at, capacity_total").eq("id", slotId).maybeSingle();
  if (!slot) return { ok: false, error: "Esa salida no existe." };
  if (fecha && (slot.starts_at as string).slice(0, 10) < fecha) return { ok: false, error: "La fecha límite no puede ser después de la salida." };
  if (min != null && slot.capacity_total != null && min > (slot.capacity_total as number)) {
    return { ok: false, error: `El mínimo no puede pasar del cupo (${slot.capacity_total}).` };
  }
  const { error } = await sb
    .from("experience_slots")
    .update({ fecha_limite: fecha || null, minimo: min, updated_at: ahora() })
    .eq("id", slotId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/caminante/admin/comunidad");
  revalidatePath("/caminante/admin/salidas");
  return { ok: true };
}
