"use server";

// Acciones del BOLETÍN. Cada una re-verifica admin (el gate del layout NO cubre
// las server actions invocadas directamente).
//
// ⚠️ ENVÍO REAL = CONFIRMACIÓN DE DOS PASOS. El primer submit no manda nada:
// devuelve un token de confirmación con el resumen (plantilla, asunto, N
// destinatarios) que la UI muestra; solo el segundo submit, con ese token y el
// conteo que se le enseñó a Luis, dispara el envío. Si la lista cambió entre
// paso y paso (alguien se dio de baja), se aborta y se vuelve a pedir
// confirmación con el número nuevo — nunca se manda a una lista distinta de la
// que se aprobó.
import { createHmac } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { composeNewsletter } from "./compose";
import { contarDestinatarios, enviarBoletin, enviarPrueba } from "./send";
import type { NewsletterBody, NewsletterTemplate } from "./templates";

const PRUEBA_A = "uno@numanhub.com";

function secreto(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "caminante";
}
// El token ata la confirmación a ESTE contenido y a ESTE número de
// destinatarios: si algo cambia, deja de ser válido.
function tokenConfirmacion(slug: string, template: string, subject: string, n: number): string {
  return createHmac("sha256", secreto()).update(`${slug}|${template}|${subject}|${n}`).digest("hex").slice(0, 20);
}

function volver(slug: string, extra: string): never {
  redirect(`/caminante/admin/kit/${slug}?${extra}#boletin`);
}

function leerBody(fd: FormData): { body: NewsletterBody; subject: string; preheader: string } {
  const raw = String(fd.get("body") ?? "{}");
  let body: NewsletterBody = {};
  try {
    body = JSON.parse(raw) as NewsletterBody;
  } catch {
    body = {};
  }
  return {
    body,
    subject: String(fd.get("subject") ?? "").trim(),
    preheader: String(fd.get("preheader") ?? "").trim(),
  };
}

// Pre-llena desde la ficha/serie E/salidas y guarda el borrador.
export async function prellenarBoletin(fd: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const slug = String(fd.get("slug") ?? "").trim();
  const template = String(fd.get("template") ?? "carta") as NewsletterTemplate;
  if (!slug) return;

  const res = await composeNewsletter(slug, template);
  if (!res) volver(slug, `error=${encodeURIComponent("No se encontró la experiencia.")}`);

  const sb = createSupabaseAdminClient();
  await sb.from("newsletters").insert({
    experience_slug: slug,
    template,
    subject: res!.subject,
    preheader: res!.preheader,
    body: res!.body,
    status: "draft",
    created_by: "admin",
  });
  revalidatePath(`/caminante/admin/kit/${slug}`);
  const aviso = res!.faltantes.length
    ? `ok=${encodeURIComponent(`Borrador armado. Ojo: ${res!.faltantes[0]}`)}`
    : `ok=${encodeURIComponent("Borrador del boletín armado desde la ficha.")}`;
  volver(slug, aviso);
}

// Guarda las ediciones del borrador.
export async function guardarBoletin(fd: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const slug = String(fd.get("slug") ?? "").trim();
  const id = String(fd.get("id") ?? "").trim();
  if (!slug || !id) return;
  const { body, subject, preheader } = leerBody(fd);

  const sb = createSupabaseAdminClient();
  // Un boletín ENVIADO ya no se edita (es el registro de lo que salió).
  await sb
    .from("newsletters")
    .update({ subject, preheader, body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "draft");
  revalidatePath(`/caminante/admin/kit/${slug}`);
  volver(slug, `ok=${encodeURIComponent("Boletín guardado.")}`);
}

// PRUEBA — siempre disponible, sin confirmación. Solo a la dirección del admin.
export async function probarBoletin(fd: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const slug = String(fd.get("slug") ?? "").trim();
  const template = String(fd.get("template") ?? "carta") as NewsletterTemplate;
  const { body, subject, preheader } = leerBody(fd);
  if (!slug) return;

  const ok = await enviarPrueba(PRUEBA_A, template, body, subject || "(sin asunto)", preheader);
  volver(
    slug,
    ok
      ? `ok=${encodeURIComponent(`Prueba enviada a ${PRUEBA_A}.`)}`
      : `error=${encodeURIComponent("No se pudo enviar la prueba (revisa RESEND_API_KEY).")}`,
  );
}

// PASO 1 del envío real: NO manda nada. Cuenta la lista y devuelve el token de
// confirmación para que la UI muestre el resumen y pida el segundo clic.
export async function pedirConfirmacion(fd: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const slug = String(fd.get("slug") ?? "").trim();
  const template = String(fd.get("template") ?? "carta");
  const { subject } = leerBody(fd);
  if (!slug) return;

  const n = await contarDestinatarios();
  if (!n) volver(slug, `error=${encodeURIComponent("No hay destinatarios suscritos.")}`);
  if (!subject) volver(slug, `error=${encodeURIComponent("El boletín necesita un asunto antes de enviarse.")}`);

  const tk = tokenConfirmacion(slug, template, subject, n);
  volver(slug, `confirmar=${tk}&n=${n}`);
}

// PASO 2: envía de verdad. Exige el token del paso 1 y que el conteo siga
// siendo el mismo que se le mostró a Luis.
export async function enviarBoletinReal(fd: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const slug = String(fd.get("slug") ?? "").trim();
  const id = String(fd.get("id") ?? "").trim();
  const template = String(fd.get("template") ?? "carta") as NewsletterTemplate;
  const tk = String(fd.get("confirmar") ?? "").trim();
  const nMostrado = Number(fd.get("n") ?? 0);
  const { body, subject, preheader } = leerBody(fd);
  if (!slug || !id) return;

  const nAhora = await contarDestinatarios();
  if (nAhora !== nMostrado) {
    volver(
      slug,
      `error=${encodeURIComponent(`La lista cambió (${nMostrado} → ${nAhora} destinatarios). Vuelve a confirmar.`)}`,
    );
  }
  if (tk !== tokenConfirmacion(slug, template, subject, nAhora)) {
    volver(slug, `error=${encodeURIComponent("Confirmación inválida o vencida. Vuelve a intentar.")}`);
  }

  const res = await enviarBoletin(template, body, subject, preheader);

  const sb = createSupabaseAdminClient();
  await sb
    .from("newsletters")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      recipients_count: res.enviados,
      subject,
      preheader,
      body,
    })
    .eq("id", id)
    .eq("status", "draft"); // idempotente: un boletín ya enviado no se re-marca

  revalidatePath(`/caminante/admin/kit/${slug}`);
  const detalle = res.fallidos ? ` (${res.fallidos} fallaron)` : "";
  volver(slug, `ok=${encodeURIComponent(`Boletín enviado a ${res.enviados} de ${res.total} suscriptores${detalle}.`)}`);
}
