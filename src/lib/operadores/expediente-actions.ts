"use server";

// LAS ACCIONES DEL EXPEDIENTE — subir, mandar a revisión, aprobar y rechazar.
//
// Dos lados en un archivo porque son las dos mitades de la misma conversación,
// y separarlas invita a que una cambie sin la otra. Lo que NO se comparte es la
// autorización: cada función dice a quién deja pasar, en su primera línea.
//
// ⚠️ SOBRE QUÉ OPERADORA SE ACTÚA LO DECIDE LA SESIÓN, NO EL FORMULARIO.
// El formulario puede DECIR una (`operadora`, un input oculto), pero quien
// decide si esa petición vale es `operadoraObjetivo` (alcance.ts): la casa actúa
// sobre la que diga, una operadora sólo sobre sí misma, y si los dos no
// coinciden no se actúa sobre ninguna. Es la misma regla que ya usaba Connect.
//
// Hasta el 22 sep 2026 aquí sólo entraba la operadora sobre sí misma. Sonaba
// seguro y dejó a Nomádika atorada sin que la casa pudiera subir un papel por
// ella (design/mvp/MVP.md §1). Que la casa suba POR una operadora no es un
// atajo: es onboarding, y queda registrado en `subido_por`.

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { operadoraObjetivo } from "@/lib/auth/alcance";
import { correoEnSesion } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ACTIVIDADES, GENERALES, nombreDeActividad, requisitosDe } from "./actividades";
import { emailActividadAprobada, emailExpedienteDevuelto } from "./emails";

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
  const operatorId = await operadoraObjetivo(String(formData.get("operadora") ?? ""));
  if (!operatorId) return { ok: false, error: "No hay una operadora sobre la que subir esto." };

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
    // Quién lo subió, no de quién es. Cuando lo sube la casa por la operadora,
    // el revisor tiene que poder verlo: un papel que subió Luis no lo revisó
    // ella, y la conversación de «¿de dónde salió esto?» es distinta.
    subido_por: (await correoEnSesion()) ?? null,
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
 * Quitar una actividad declarada por error = cerrar su carpeta, con lo que traía.
 *
 * Luis, 24 sep 2026: «si me equivoqué y puse cañonismo, y no iba, la quiero
 * eliminar de mi lista». Declarar era de un clic y no había vuelta atrás: la
 * carpeta se quedaba para siempre pidiendo tres documentos de algo que la
 * operadora no hace, y su expediente nunca se podía completar.
 *
 * ⚠️ SÓLO SE QUITA LO QUE NO SOSTIENE NADA. Se niega, diciendo por qué, si:
 *   · ya está APROBADA — la aprobó una persona de la casa; darla de baja es
 *     suspenderla, y eso lo decide la casa, no un clic;
 *   · ya ACEPTÓ SU ANEXO — `anexo_aceptado_at` es el recibo de un acto legal y
 *     vive en esta fila: borrarla borraría el recibo;
 *   · alguna EXPERIENCIA suya dice ser de esta actividad — el candado de
 *     publicación pregunta por ella, y la experiencia quedaría apuntando a nada;
 *   · tiene una DISPENSA vigente — la otorgó la casa con nombre y fecha.
 *
 * Lo que se lleva: sus documentos PROPIOS (filas y archivos). Los de Lo
 * general no se tocan: son de la operadora, no de la actividad.
 */
export async function quitarActividad(actividad: string, operadora?: string | null): Promise<Res> {
  const operatorId = await operadoraObjetivo(operadora);
  if (!operatorId) return { ok: false, error: "No hay una operadora sobre la que quitar esto." };
  if (!VALIDAS.has(actividad)) return { ok: false, error: "Esa actividad no existe." };
  const nombre = nombreDeActividad(actividad);

  const sb = createSupabaseAdminClient();
  const [{ data: act, error: e1 }, { data: exps, error: e2 }, { data: disps, error: e3 }] = await Promise.all([
    sb.from("operator_activities").select("id, estado, anexo_aceptado_at")
      .eq("operator_id", operatorId).eq("actividad", actividad).maybeSingle(),
    sb.from("experiences").select("id").eq("operator_id", operatorId).eq("actividad", actividad),
    sb.from("operator_activity_dispensas").select("id, vence_at, revocada_at")
      .eq("operator_id", operatorId).eq("actividad", actividad),
  ]);
  // Sin poder verificar, no se borra: un «no pude revisar» no es un «no hay nada».
  if (e1 || e2 || e3) return { ok: false, error: "No pude revisar qué depende de esta actividad. Intenta de nuevo." };
  const fila = act as { id: string; estado: string; anexo_aceptado_at: string | null } | null;
  if (!fila) return { ok: false, error: `${nombre} no está en tu lista.` };

  if (fila.estado === "aprobada") {
    return { ok: false, error: `${nombre} ya está aprobada. Si ya no la vas a operar, escríbenos y la suspendemos: no se quita con un clic.` };
  }
  if (fila.anexo_aceptado_at) {
    return { ok: false, error: `Ya aceptaste el anexo de ${nombre}. Ese recibo no se borra; si ya no la vas a operar, escríbenos.` };
  }
  const nExp = ((exps ?? []) as unknown[]).length;
  if (nExp > 0) {
    return { ok: false, error: `${nExp === 1 ? "Una experiencia tuya dice" : `${nExp} experiencias tuyas dicen`} ser de ${nombre}. Cámbiales la actividad o bórralas, y después la quitas.` };
  }
  const ahora = Date.now();
  const vigente = ((disps ?? []) as { vence_at: string; revocada_at: string | null }[])
    .some((d) => !d.revocada_at && new Date(d.vence_at).getTime() > ahora);
  if (vigente) {
    return { ok: false, error: `${nombre} vende con una dispensa que otorgó la casa. Mientras esté vigente no se quita.` };
  }

  // Primero las FILAS, después los archivos. Si fallara lo segundo quedaría un
  // objeto sin fila —invisible e inofensivo—; al revés quedaría una fila
  // apuntando a un archivo que ya no existe, y la pantalla mentiría.
  const { data: docs, error: e4 } = await sb
    .from("operator_documents").select("id, archivo_path")
    .eq("operator_id", operatorId).eq("actividad", actividad);
  if (e4) return { ok: false, error: "No pude leer sus documentos. No se quitó nada." };
  const rutas = ((docs ?? []) as { archivo_path: string | null }[]).map((d) => d.archivo_path).filter((x): x is string => !!x);

  const { error: e5 } = await sb.from("operator_documents").delete()
    .eq("operator_id", operatorId).eq("actividad", actividad);
  if (e5) {
    console.error("quitarActividad documentos:", e5);
    return { ok: false, error: "No se pudieron quitar sus documentos. No se quitó nada." };
  }
  const { error: e6 } = await sb.from("operator_activities").delete().eq("id", fila.id);
  if (e6) {
    console.error("quitarActividad actividad:", e6);
    return { ok: false, error: "Se quitaron sus documentos pero no la actividad. Vuelve a intentarlo." };
  }
  if (rutas.length) {
    const { error: e7 } = await sb.storage.from(BUCKET).remove(rutas);
    if (e7) console.error("quitarActividad archivos (quedan huérfanos, sin fila):", e7);
  }

  revalidatePath(RUTA);
  revalidatePath("/caminante/admin/mi-alta");
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
export async function declararActividad(actividad: string, operadora?: string | null): Promise<Res> {
  const operatorId = await operadoraObjetivo(operadora);
  if (!operatorId) return { ok: false, error: "No hay una operadora sobre la que declarar esto." };
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

export async function mandarARevision(actividad: string, operadora?: string | null): Promise<Res> {
  const operatorId = await operadoraObjetivo(operadora);
  if (!operatorId) return { ok: false, error: "No hay una operadora cuyo expediente mandar." };
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

/**
 * A quién le escribimos por su expediente.
 *
 * ⚠️ Un correo que no sale NO tumba la revisión. El veredicto ya está guardado
 * y es lo que manda; quedarse sin avisar es malo, pero devolver un error
 * después de haber escrito en la base sería peor: el admin volvería a apretar
 * y la fila ya estaba resuelta.
 */
async function correoDe(operatorId: string): Promise<{ email: string; nombre: string | null } | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("operators").select("email, name").eq("id", operatorId).maybeSingle();
  const r = data as { email: string | null; name: string | null } | null;
  return r?.email ? { email: r.email, nombre: r.name } : null;
}

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

  // Un rechazo se AVISA. Sin esto el papel se quedaba en rojo dentro de una
  // pantalla a la que ella no tenía por qué volver a entrar ese día, y el
  // expediente se paraba sin que nadie supiera por qué.
  if (!aprobado) {
    const { data: doc } = await sb
      .from("operator_documents")
      .select("operator_id, actividad, documento")
      .eq("id", id)
      .maybeSingle();
    const d = doc as { operator_id: string; actividad: string | null; documento: string } | null;
    if (d) {
      const quien = await correoDe(d.operator_id);
      const catalogo =
        d.actividad === null
          ? GENERALES.find((g) => g.slug === d.documento)
          : requisitosDe(d.actividad).propios.find((x) => x.slug === d.documento);
      if (quien) {
        await emailExpedienteDevuelto(quien.email, quien.nombre, catalogo?.nombre ?? d.documento, razon).catch((e) =>
          console.error("emailExpedienteDevuelto:", e),
        );
      }
    }
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

  // El veredicto se AVISA, en los dos sentidos. Aprobar sin decirlo es dejarla
  // esperando algo que ya pasó; devolver sin decirlo es peor.
  const quien = await correoDe(operatorId);
  if (quien) {
    const nombre = nombreDeActividad(actividad);
    const correo = aprobada
      ? emailActividadAprobada(quien.email, quien.nombre, nombre)
      : emailExpedienteDevuelto(quien.email, quien.nombre, `Tu expediente de ${nombre.toLowerCase()}`, razon);
    await correo.catch((e) => console.error("aviso de actividad:", e));
  }

  revalidatePath(RUTA);
  revalidatePath("/caminante/admin/plataforma/comunidad");
  return { ok: true };
}

// ── La dispensa: el brinco del candado, como objeto ──────────────────────────
//
// Hasta hoy, cuando Luis decía «publícala aunque falte el certificado, ya lo
// estoy tramitando», el sistema lo dejaba pasar porque NO SE DABA CUENTA: el
// candado sólo pregunta al guardar. La experiencia quedaba publicada por
// accidente y se despublicaba sola al siguiente guardado. Una dispensa es esa
// misma decisión pero escrita: quién, por qué, hasta cuándo — y vence sola.

const DIAS_MAX_DISPENSA = 90;

export async function otorgarDispensa(input: {
  operadorId: string;
  actividad: string;
  motivo: string;
  /** AAAA-MM-DD. Obligatoria: una dispensa sin fecha es un agujero con nombre. */
  venceEl: string;
}): Promise<Res> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Solo la casa dispensa." };
  const quien = await correoEnSesion();
  if (!quien) return { ok: false, error: "Sin sesión." };

  const operadorId = input.operadorId.trim();
  const actividad = input.actividad.trim();
  const motivo = input.motivo.replace(/\s+/g, " ").trim();
  if (!operadorId) return { ok: false, error: "Falta la operadora." };
  if (!VALIDAS.has(actividad)) return { ok: false, error: "Esa actividad no existe." };
  if (motivo.length < 10) return { ok: false, error: "Di por qué se dispensa, con al menos una frase." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.venceEl)) return { ok: false, error: "Falta hasta cuándo (una fecha)." };

  // Vence al final de ese día en CDMX (UTC-6 todo el año).
  const vence = new Date(`${input.venceEl}T23:59:59-06:00`);
  const dias = (vence.getTime() - Date.now()) / 86_400_000;
  if (!(dias > 0)) return { ok: false, error: "La fecha ya pasó: una dispensa nace vigente o no nace." };
  if (dias > DIAS_MAX_DISPENSA) {
    return { ok: false, error: `Máximo ${DIAS_MAX_DISPENSA} días. Si hace falta más, se renueva a conciencia.` };
  }

  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("operator_activity_dispensas").insert({
    operator_id: operadorId,
    actividad,
    motivo,
    autorizada_por: quien,
    vence_at: vence.toISOString(),
  });
  if (error) {
    console.error("otorgarDispensa:", error);
    return { ok: false, error: "No se pudo registrar la dispensa." };
  }
  revalidatePath("/caminante/admin/plataforma/comunidad");
  return { ok: true };
}

export async function revocarDispensa(id: string): Promise<Res> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Solo la casa revoca." };
  const quien = await correoEnSesion();
  if (!quien) return { ok: false, error: "Sin sesión." };
  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("operator_activity_dispensas")
    .update({ revocada_at: new Date().toISOString(), revocada_por: quien })
    .eq("id", id)
    .is("revocada_at", null);
  if (error) {
    console.error("revocarDispensa:", error);
    return { ok: false, error: "No se pudo revocar." };
  }
  revalidatePath("/caminante/admin/plataforma/comunidad");
  return { ok: true };
}
