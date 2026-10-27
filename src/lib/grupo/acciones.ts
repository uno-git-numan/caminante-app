"use server";

// LAS ACCIONES DEL ESPACIO DEL GRUPO.
//
// Entrar al grupo = tener cuenta con celular verificado + una fila en
// grupo_lugares. El código del celular ES el login: al pedirlo se genera una
// liga mágica que se canjea cuando el código cuadra (no se manda por correo;
// la reemplaza el código). Quien ya tiene sesión sólo verifica el celular.
//
// Nada de aquí mueve dinero: apartar y pagar por otros van por /reservar y
// createCheckout, con `lugar` / `cubre` como únicas señas nuevas.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseAuthClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { puedeEditarSlot } from "@/lib/auth/alcance";
import { findOrCreateContact } from "@/lib/crm/contacts";
import { cleanGrupoToken } from "@/lib/experiences/availability";
import { fetchEspacio, contactoDeUsuario, type Espacio } from "@/lib/grupo/espacio";
import { celularE164, pedirCodigo, verificarCodigo, MINUTOS_CODIGO } from "@/lib/grupo/codigo";

const COOKIE = "cam_codigo";
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

/** La liga mágica que el código va a canjear. Crea la cuenta si no existe. */
async function ligaMagica(sb: Sb, email: string, nombre: string | null): Promise<{ tokenHash: string; userId: string } | { error: string }> {
  const gen = () => sb.auth.admin.generateLink({ type: "magiclink", email });
  let r = await gen();
  if (r.error) {
    const creado = await sb.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: nombre ? { full_name: nombre } : {},
    });
    if (creado.error && !/already/i.test(creado.error.message)) return { error: creado.error.message };
    r = await gen();
    if (r.error) return { error: r.error.message };
  }
  const tokenHash = r.data.properties?.hashed_token;
  const userId = r.data.user?.id;
  if (!tokenHash || !userId) return { error: "No se pudo preparar tu cuenta." };
  return { tokenHash, userId };
}

/**
 * C2 · «Entrar»: nombre, celular y correo. Deja el código en camino y lleva a
 * la pantalla de seis casillas. Con sesión, sólo pide el celular.
 */
export async function entrarAlGrupo(formData: FormData): Promise<void> {
  const token = cleanGrupoToken(formData.get("token"));
  if (!token) redirect("/caminante");
  const e = await fetchEspacio(token);
  if (!e) redirect("/caminante");

  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 120);
  const celular = celularE164(String(formData.get("celular") ?? ""));
  const correoForm = String(formData.get("correo") ?? "").trim().toLowerCase().slice(0, 200);
  if (!celular) redirect(conError(token, "/entrar", "celular"));

  const sb = createSupabaseAdminClient();
  const user = await getCurrentUser();

  let email = correoForm;
  let userId: string | null = null;
  let tokenHash: string | null = null;
  let nombreFinal: string | null = nombre || null;

  if (user) {
    email = (user.email ?? correoForm).toLowerCase();
    userId = user.id;
    const c = await contactoDeUsuario(user);
    nombreFinal = nombreFinal || c?.full_name || (user.user_metadata?.full_name as string | undefined) || null;
  } else {
    if (!email.includes("@")) redirect(conError(token, "/entrar", "correo"));
    if (!nombre) redirect(conError(token, "/entrar", "nombre"));
    const liga = await ligaMagica(sb, email, nombre);
    if ("error" in liga) redirect(conError(token, "/entrar", liga.error));
    tokenHash = liga.tokenHash;
    userId = liga.userId;
  }

  // El contacto existe desde ya (con el celular, sin verificar todavía).
  const contacto = await findOrCreateContact(sb, {
    email,
    fullName: nombreFinal ?? undefined,
    phone: celular,
    source: `espacio del grupo · ${e.slug}`,
    userId,
  });
  if (!contacto.ok) redirect(conError(token, "/entrar", contacto.error));

  const pedido = await pedirCodigo({
    celular,
    email,
    nombre: nombreFinal,
    userId,
    slotId: e.slotId,
    tokenHash,
    experiencia: e.tituloPlano,
  });
  if (!pedido.ok) redirect(conError(token, "/entrar", pedido.error));

  const jar = await cookies();
  jar.set(COOKIE, pedido.id, { httpOnly: true, sameSite: "lax", secure: true, path: "/caminante/g", maxAge: MINUTOS_CODIGO * 60 + 60 });
  redirect(ruta(token, "/codigo"));
}

/** C2 · las seis casillas. Si cuadra, la persona entra con sesión y lugar. */
export async function verificarYEntrar(formData: FormData): Promise<void> {
  const token = cleanGrupoToken(formData.get("token"));
  if (!token) redirect("/caminante");
  const e = await fetchEspacio(token);
  if (!e) redirect("/caminante");

  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) redirect(conError(token, "/entrar", "Pide un código nuevo."));

  const codigo = String(formData.get("codigo") ?? "");
  const v = await verificarCodigo(id, codigo);
  if (!v.ok) {
    if (v.agotado) {
      jar.delete(COOKIE);
      redirect(conError(token, "/entrar", v.error));
    }
    redirect(conError(token, "/codigo", v.error));
  }

  const sb = createSupabaseAdminClient();
  let user = await getCurrentUser();

  if (!user) {
    if (!v.tokenHash) redirect(conError(token, "/entrar", "Tu sesión se perdió. Vuelve a entrar."));
    // El código cuadró: se canjea la liga mágica y la sesión queda en cookies.
    const auth = await createSupabaseAuthClient();
    const { data, error } = await auth.auth.verifyOtp({ token_hash: v.tokenHash, type: "magiclink" });
    if (error || !data.user) redirect(conError(token, "/entrar", "No pudimos abrir tu sesión. Pide un código nuevo."));
    user = data.user;
  }

  // El contacto: ligado a la cuenta, con el celular verificado.
  const email = (user.email ?? v.email ?? "").toLowerCase();
  const contacto = await findOrCreateContact(sb, {
    email,
    fullName: v.nombre ?? undefined,
    phone: v.celular,
    source: `espacio del grupo · ${e.slug}`,
    userId: user.id,
  });
  if (!contacto.ok) redirect(conError(token, "/entrar", contacto.error));
  await sb
    .from("contacts")
    .update({ phone: v.celular, phone_verified_at: ahora(), ...(contacto.contact.user_id ? {} : { user_id: user.id }), updated_at: ahora() })
    .eq("id", contacto.contact.id);

  await darLugar(sb, e, contacto.contact.id, user.id);
  jar.delete(COOKIE);
  revalidatePath(ruta(token));
  redirect(ruta(token));
}

/** Con sesión y celular ya verificado: entrar al grupo es un clic. */
export async function entrarConSesion(formData: FormData): Promise<void> {
  const token = cleanGrupoToken(formData.get("token"));
  if (!token) redirect("/caminante");
  const user = await getCurrentUser();
  if (!user) redirect(ruta(token, "/entrar"));
  const e = await fetchEspacio(token);
  if (!e) redirect("/caminante");
  const c = await contactoDeUsuario(user);
  if (!c || !c.phone_verified_at) redirect(ruta(token, "/entrar"));
  await darLugar(createSupabaseAdminClient(), e, c.id, user.id);
  revalidatePath(ruta(token));
  redirect(ruta(token));
}

/** «Puedes pedir otro»: mismo celular, código nuevo. */
export async function pedirOtroCodigo(formData: FormData): Promise<void> {
  const token = cleanGrupoToken(formData.get("token"));
  if (!token) redirect("/caminante");
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  const sb = createSupabaseAdminClient();
  const { data: row } = id && /^[0-9a-f-]{36}$/.test(id)
    ? await sb.from("codigos_celular").select("phone, email, nombre, user_id, slot_id, token_hash").eq("id", id).maybeSingle()
    : { data: null };
  if (!row) redirect(conError(token, "/entrar", "Pide un código nuevo."));
  const e = await fetchEspacio(token);
  const r = row as { phone: string; email: string | null; nombre: string | null; user_id: string | null; slot_id: string | null; token_hash: string | null };
  // La liga mágica vieja puede seguir viva, pero se genera otra por si caducó.
  let tokenHash = r.token_hash;
  if (tokenHash && r.email) {
    const liga = await ligaMagica(sb, r.email, r.nombre);
    if (!("error" in liga)) tokenHash = liga.tokenHash;
  }
  const pedido = await pedirCodigo({
    celular: r.phone,
    email: r.email,
    nombre: r.nombre,
    userId: r.user_id,
    slotId: r.slot_id,
    tokenHash,
    experiencia: e?.tituloPlano ?? null,
  });
  if (!pedido.ok) redirect(conError(token, "/codigo", pedido.error));
  jar.set(COOKIE, pedido.id, { httpOnly: true, sameSite: "lax", secure: true, path: "/caminante/g", maxAge: MINUTOS_CODIGO * 60 + 60 });
  redirect(`${ruta(token, "/codigo")}?otro=1`);
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
