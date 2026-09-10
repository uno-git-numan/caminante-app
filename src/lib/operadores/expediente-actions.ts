"use server";

// LAS ACCIONES DEL EXPEDIENTE — subir, mandar a revisión, aprobar y rechazar.
//
// Dos lados en un archivo porque son las dos mitades de la misma conversación,
// y separarlas invita a que una cambie sin la otra. Lo que NO se comparte es la
// autorización: cada función dice a quién deja pasar, en su primera línea.
//
// ⚠️ EL OPERADOR SALE DE LA SESIÓN, NUNCA DEL FORMULARIO. Si el `operatorId`
// viniera del cliente, cualquiera podría subir un papel al expediente de otra
// operadora —o peor, aprobarse el suyo—. `operadorDelAlcance()` lo resuelve del
// lado del servidor y es la única fuente.

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { operadorDelAlcance } from "@/lib/admin/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ACTIVIDADES, GENERALES, requisitosDe } from "./actividades";

const BUCKET = "expedientes";
const MAX_BYTES = 10 * 1024 * 1024;
const TIPOS = ["application/pdf", "image/jpeg", "image/png", "image/heic"];
const RUTA = "/caminante/admin/mi-alta/expediente";

export type Res = { ok: true; aviso?: string } | { ok: false; error: string };

const VALIDAS = new Set(ACTIVIDADES.map((a) => a.slug));
const esGeneral = (d: string) => GENERALES.some((g) => g.slug === d);

/**
 * ¿Este documento se le puede pedir a esta actividad?
 *
 * Sin esto, un POST directo podría crear la fila `(buceo, licencia-fmp)` —una
 * licencia de paracaidismo dentro de la carpeta de buceo—. Nadie la pediría,
 * nadie sabría pintarla, y la cuenta de «te faltan N» quedaría descuadrada para
 * siempre contra una fila que no debería existir.
 */
function pertenece(actividad: string | null, documento: string): boolean {
  if (actividad === null) return esGeneral(documento);
  if (!VALIDAS.has(actividad)) return false;
  return requisitosDe(actividad).propios.some((d) => d.slug === documento);
}

// ── Lado de la operadora ─────────────────────────────────────────────────────

export async function subirDocumento(formData: FormData): Promise<Res> {
  const operatorId = await operadorDelAlcance();
  if (!operatorId) return { ok: false, error: "Solo una operadora sube su expediente." };

  const cruda = String(formData.get("actividad") ?? "").trim();
  const actividad = cruda === "" ? null : cruda;
  const documento = String(formData.get("documento") ?? "").trim();
  if (!pertenece(actividad, documento)) {
    return { ok: false, error: "Ese documento no corresponde a esa actividad." };
  }

  const file = formData.get("archivo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Falta el archivo." };
  if (file.size > MAX_BYTES) return { ok: false, error: "Máximo 10 MB." };
  const tipo = file.type || "application/pdf";
  if (!TIPOS.includes(tipo)) return { ok: false, error: "Sube un PDF o una foto." };

  // `vence_at` es fecha, no casilla (ver la 0058). Si el catálogo dice que este
  // documento caduca, la fecha es obligatoria: sin ella el expediente se vería
  // completo para siempre.
  const venceAt = String(formData.get("venceAt") ?? "").trim() || null;
  const caduca = actividad === null
    ? GENERALES.find((g) => g.slug === documento)?.vence
    : requisitosDe(actividad).propios.find((d) => d.slug === documento)?.vence;
  if (caduca && !venceAt) return { ok: false, error: "Falta la fecha de vencimiento." };

  const ext = tipo === "application/pdf" ? "pdf" : (tipo.split("/")[1] || "jpg");
  // El nombre original suele traer el nombre de una persona; dentro del bucket
  // no aporta nada y sí filtra datos a quien vea la ruta.
  const path = `${operatorId}/${randomBytes(16).toString("hex")}.${ext}`;

  const sb = createSupabaseAdminClient();
  const { error: subida } = await sb.storage
    .from(BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: tipo, upsert: false });
  if (subida) {
    console.error("subirDocumento storage:", subida);
    return { ok: false, error: "No se pudo guardar el archivo." };
  }

  // ⚠️ NADA DE `upsert` CON `onConflict` AQUÍ, y la razón cuesta encontrarla:
  // el índice de los documentos GENERALES es PARCIAL (`where actividad is null`,
  // ver la 0058), y Postgres no puede inferir un índice parcial para un
  // `ON CONFLICT (operator_id, documento)`. Falla con 42P10, «there is no unique
  // or exclusion constraint matching the ON CONFLICT specification».
  //
  // Lo vicioso es CÓMO fallaba: el archivo YA estaba en el bucket cuando
  // reventaba el insert, así que quedaba un objeto huérfano y la operadora
  // veía «Todavía no lo has subido» después de una subida que se veía bien.
  // Sólo salió al subir un PDF de verdad; `tsc` y el build no lo podían ver.
  //
  // Buscar y luego actualizar o insertar no depende de la forma del índice.
  const base = sb
    .from("operator_documents")
    .select("id, archivo_path")
    .eq("operator_id", operatorId)
    .eq("documento", documento);
  const { data: previa } = await (actividad === null
    ? base.is("actividad", null)
    : base.eq("actividad", actividad)
  ).maybeSingle();

  // REEMPLAZAR LIMPIA EL RECHAZO. Dejar el `motivo` viejo mostraría el archivo
  // nuevo con la razón por la que se rechazó el anterior, y quien lo lea creerá
  // que su corrección no sirvió.
  const campos = {
    archivo_path: path,
    archivo_nombre: file.name.slice(0, 200),
    estado: "en_revision",
    motivo: null,
    vence_at: venceAt,
    subido_at: new Date().toISOString(),
    revisado_at: null,
    revisado_por: null,
  };
  const anterior = (previa as { id: string; archivo_path: string } | null) ?? null;
  const { error } = anterior
    ? await sb.from("operator_documents").update(campos).eq("id", anterior.id)
    : await sb
        .from("operator_documents")
        .insert({ operator_id: operatorId, actividad, documento, ...campos });

  if (error) {
    // ⚠️ SI LA FILA NO SE ESCRIBE, EL ARCHIVO NO SE QUEDA. Un objeto sin fila
    // que lo apunte es basura invisible en un bucket privado: nadie lo ve,
    // nadie lo borra, y cuenta para el límite de Storage.
    await sb.storage.from(BUCKET).remove([path]);
    console.error("subirDocumento:", error);
    return { ok: false, error: "No se pudo registrar el documento." };
  }

  // Y el archivo VIEJO tampoco: al reemplazar, ya no lo apunta nadie.
  if (anterior?.archivo_path && anterior.archivo_path !== path) {
    await sb.storage.from(BUCKET).remove([anterior.archivo_path]);
  }

  revalidatePath(RUTA);
  return { ok: true };
}

/**
 * Declarar una actividad = abrir su carpeta.
 *
 * Hasta ahora las actividades sólo nacían al aprobar la solicitud, con lo que
 * declaró en ella. Pero una operadora crece: el día que quiera ofrecer buceo
 * tiene que poder pedir su expediente sin que la casa le abra la puerta a mano.
 *
 * ⚠️ NACE `incompleta`, NUNCA `aprobada`. Declarar es decir «quiero ofrecer
 * esto», no «ya puedo». Si naciera aprobada, cualquiera se habilitaría solo la
 * alta montaña con un clic — que es exactamente el candado que existe para que
 * nadie suba a una montaña con quien no acreditó nada.
 *
 * ⚠️ `ignoreDuplicates` porque volver a declarar algo que ya está en revisión
 * —o aprobado— no puede tirarle el avance a `incompleta`.
 */
export async function declararActividad(actividad: string): Promise<Res> {
  const operatorId = await operadorDelAlcance();
  if (!operatorId) return { ok: false, error: "Solo una operadora declara sus actividades." };
  if (!VALIDAS.has(actividad)) return { ok: false, error: "Esa actividad no existe." };

  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("operator_activities")
    .upsert({ operator_id: operatorId, actividad }, { onConflict: "operator_id,actividad", ignoreDuplicates: true });
  if (error) {
    console.error("declararActividad:", error);
    return { ok: false, error: "No se pudo declarar la actividad." };
  }
  revalidatePath(RUTA);
  return { ok: true };
}

export async function mandarARevision(actividad: string): Promise<Res> {
  const operatorId = await operadorDelAlcance();
  if (!operatorId) return { ok: false, error: "Solo una operadora manda su expediente." };
  if (!VALIDAS.has(actividad)) return { ok: false, error: "Esa actividad no existe." };

  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("operator_documents")
    .select("documento, estado")
    .eq("operator_id", operatorId)
    .eq("actividad", actividad);

  const subidos = new Map(((data ?? []) as { documento: string; estado: string }[]).map((d) => [d.documento, d.estado]));
  // Falta o rechazado cuenta igual: en los dos casos hay algo que hacer del lado
  // de la operadora, y mandarlo a revisión así sólo nos devolvería el trabajo.
  const pendientes = requisitosDe(actividad).propios.filter(
    (d) => !subidos.has(d.slug) || subidos.get(d.slug) === "rechazado",
  );
  if (pendientes.length) {
    return {
      ok: false,
      error: `Todavía falta: ${pendientes.map((d) => d.nombre).join(", ")}.`,
    };
  }

  const { error } = await sb
    .from("operator_activities")
    .update({ estado: "en_revision", enviada_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("operator_id", operatorId)
    .eq("actividad", actividad)
    .in("estado", ["incompleta"]);
  if (error) {
    console.error("mandarARevision:", error);
    return { ok: false, error: "No se pudo mandar a revisión." };
  }
  revalidatePath(RUTA);
  return { ok: true };
}

// ── Lado de la casa ──────────────────────────────────────────────────────────

export async function resolverDocumento(id: string, aprobado: boolean, motivo?: string): Promise<Res> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Solo admin." };
  const razon = (motivo ?? "").trim();
  // La base también lo exige, pero fallar aquí permite DECIRLO en vez de
  // devolver un error de constraint que nadie sabe leer.
  if (!aprobado && !razon) return { ok: false, error: "Un rechazo tiene que decir por qué." };

  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("operator_documents")
    .update({
      estado: aprobado ? "aprobado" : "rechazado",
      motivo: aprobado ? null : razon.slice(0, 500),
      revisado_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.error("resolverDocumento:", error);
    return { ok: false, error: "No se pudo guardar la revisión." };
  }
  revalidatePath(RUTA);
  return { ok: true };
}

export async function resolverActividad(
  operatorId: string,
  actividad: string,
  aprobada: boolean,
  motivo?: string,
): Promise<Res> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Solo admin." };
  if (!VALIDAS.has(actividad)) return { ok: false, error: "Esa actividad no existe." };
  const razon = (motivo ?? "").trim();
  if (!aprobada && !razon) return { ok: false, error: "Devolver una actividad exige decir por qué." };

  const sb = createSupabaseAdminClient();

  // ⚠️ NO SE APRUEBA UNA CARPETA CON UN PAPEL SIN APROBAR DENTRO. Es el error
  // que la pantalla no podría desmentir: la actividad diría «aprobada, puedes
  // publicar» y adentro habría un documento rechazado o sin revisar. Y de esa
  // aprobación depende que alguien suba a una montaña.
  if (aprobada) {
    const { data } = await sb
      .from("operator_documents")
      .select("documento, estado")
      .eq("operator_id", operatorId)
      .eq("actividad", actividad);
    const porSlug = new Map(((data ?? []) as { documento: string; estado: string }[]).map((d) => [d.documento, d.estado]));
    const flojos = requisitosDe(actividad).propios.filter((d) => porSlug.get(d.slug) !== "aprobado");
    if (flojos.length) {
      return {
        ok: false,
        error: `No se puede aprobar: ${flojos.map((d) => d.nombre).join(", ")} sin aprobar.`,
      };
    }
  }

  const ahora = new Date().toISOString();
  const { error } = await sb
    .from("operator_activities")
    .update(
      aprobada
        ? { estado: "aprobada", resuelta_at: ahora, motivo: null, updated_at: ahora }
        // Devolver NO es suspender: vuelve a `incompleta` para que pueda
        // corregir y reenviar. `suspendida` es otra cosa y la decide otra puerta.
        : { estado: "incompleta", resuelta_at: ahora, motivo: razon.slice(0, 500), updated_at: ahora },
    )
    .eq("operator_id", operatorId)
    .eq("actividad", actividad);
  if (error) {
    console.error("resolverActividad:", error);
    return { ok: false, error: "No se pudo guardar la decisión." };
  }
  revalidatePath(RUTA);
  revalidatePath("/caminante/admin/plataforma/comunidad");
  return { ok: true };
}
