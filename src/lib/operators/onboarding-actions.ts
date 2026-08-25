"use server";

// ONBOARDING de operador externo (white-label) — el alta canónica desde el
// panel. Crea (o completa) la fila de `operators` con identidad + branding +
// legal + trato, y le atribuye sus experiencias (experiences.operator_id).
// Curado: lo captura Luis en v1. Cada action re-verifica admin.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OperatorBranding, OperatorLegal } from "@/lib/operators/branding";

const RUTA = "/caminante/admin/operadores/nuevo";

const clean = (v: FormDataEntryValue | null, max = 300): string =>
  String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const HEX = /^#[0-9a-fA-F]{6}$/;

export async function onboardOperator(formData: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) redirect(`${RUTA}?error=admin`);

  const opId = clean(formData.get("opId"), 60); // vacío = crear
  const nombre = clean(formData.get("nombre"), 120);
  const email = clean(formData.get("email"), 200).toLowerCase();
  const slug = slugify(clean(formData.get("slug"), 80) || nombre);
  const instagram = clean(formData.get("instagram"), 120);

  const logoUrl = clean(formData.get("logoUrl"), 500);
  const logoDarkUrl = clean(formData.get("logoDarkUrl"), 500);
  const primary = clean(formData.get("primary"), 9);
  const accent = clean(formData.get("accent"), 9);
  const poweredBy = clean(formData.get("poweredBy"), 12) === "visible" ? "visible" : "discreto";

  const razonSocial = clean(formData.get("razonSocial"), 200);
  const rfc = clean(formData.get("rfc"), 20).toUpperCase();
  const domicilio = clean(formData.get("domicilio"), 300);
  const responsable = clean(formData.get("responsable"), 200);

  const trato = clean(formData.get("trato"), 400);
  // 0042 · el interruptor del panel del operador. Va en el formulario y no en un
  // UPDATE a mano porque el momento de decidirlo es el alta, con la persona
  // enfrente — pedirle a Luis que abra el SQL Editor a media junta es la forma
  // segura de que el operador se vaya sin acceso.
  const panelActivo = formData.get("panelActivo") === "on";
  const expIds = formData.getAll("experiencias").map((v) => clean(v, 60)).filter(Boolean);

  if (!nombre || !email.includes("@") || !slug) redirect(`${RUTA}?error=datos`);
  // El logo NO se exige: el mínimo son los dos colores (marca.ts). Un operador
  // que llega con paleta y sin logo se viste igual; su nombre va en texto.
  if (!HEX.test(primary) || !HEX.test(accent)) redirect(`${RUTA}?error=marca`);

  const branding: OperatorBranding = {
    logoUrl, // puede ir vacío: opcional
    ...(logoDarkUrl ? { logoDarkUrl } : {}),
    colors: { primary, accent },
    poweredBy,
  };
  // ⚠️ 0038: `legal` es la entidad que RESPONDE por el viaje (deslinde). El RFC y
  // la razón social son del EMISOR del CFDI y van a sus columnas planas. Antes
  // iban los cuatro aquí, y como el jsonb exigía los tres juntos para guardarse,
  // capturar solo el domicilio se perdía en silencio.
  const legal: OperatorLegal | null = domicilio
    ? { domicilio, ...(responsable ? { responsable } : {}) }
    : null;

  const sb = createSupabaseAdminClient();

  // El slug es la URL pública del portal: nunca pisar el de OTRO operador.
  const { data: dueno } = await sb.from("operators").select("id").eq("slug", slug).maybeSingle();
  if (dueno && (dueno as { id: string }).id !== opId) redirect(`${RUTA}?error=slug`);

  let operatorId = opId || null;
  const campos = {
    name: nombre,
    email,
    slug,
    instagram: instagram || null,
    branding,
    legal,
    rfc: rfc || null,
    razon_social: razonSocial || null,
    notes: trato || null,
    panel_activo: panelActivo,
    // ⚠️ El alta PUBLICA al operador. Este formulario es el acto de ponerlo en
    // el aire —su botón dice «ver su portal»— y `is_public` es lo que abre sus
    // dos páginas públicas: el portal con su marca (/caminante/o/<slug>) y su
    // perfil (/caminante/operador/<slug>). Sin esto el portal daría 404 justo
    // al terminar el alta, enfrente del operador. Para bajarlo está «Pasar a
    // borrador» en su tarjeta de perfil, que es el control que ya existía.
    is_public: true,
  };
  if (operatorId) {
    const { error } = await sb.from("operators").update(campos).eq("id", operatorId);
    if (error) {
      console.error("onboardOperator update:", error);
      redirect(`${RUTA}?error=guardar`);
    }
  } else {
    const { data, error } = await sb.from("operators").insert(campos).select("id").single();
    if (error || !data) {
      console.error("onboardOperator insert:", error);
      redirect(`${RUTA}?error=guardar`);
    }
    operatorId = (data as { id: string }).id;
  }

  // Atribución de experiencias: SOLO las marcadas pasan al operador (las no
  // marcadas no se tocan — jamás des-atribuimos en silencio).
  for (const id of expIds) {
    const { error } = await sb.from("experiences").update({ operator_id: operatorId }).eq("id", id);
    if (error) console.error("onboardOperator exp:", id, error);
  }

  revalidatePath("/caminante/admin/operadores");
  revalidatePath(`/caminante/o/${slug}`);
  redirect(`${RUTA}?ok=${encodeURIComponent(slug)}`);
}
