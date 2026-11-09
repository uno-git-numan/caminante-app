import "server-only";

// LA CONSTANCIA DE SITUACIÓN FISCAL — leída y confirmada al subirla.
//
// Luis, 9 nov 2026, haciendo el alta de una operadora en vivo: «La CSF no tiene
// vencimiento. Podríamos hacer el chequeo de vencimiento internamente en
// plataforma. Analizar el pdf con AI y ver su autenticidad.»
//
// Son dos pruebas distintas, y ninguna sola basta:
//
//   1 · LA IA LEE el documento: RFC, nombre, fecha de emisión, idCIF, código
//       postal, regímenes, estatus, y señales de alteración. Lo que no está en
//       el papel queda en null: la IA no completa nada.
//   2 · EL SAT CONFIRMA. Toda CSF trae un QR que apunta a su validador público
//       con `idCIF_RFC`. Probado el 9 nov 2026: con un id falso el SAT contesta
//       «no se le ha emitido su Cédula de identificación fiscal». Una CSF
//       editada en un PDF puede engañar a una persona y a una IA; no cambia lo
//       que el SAT tiene registrado.
//
// «RECIENTE» (el vencimiento interno que pidió Luis): la CSF no caduca, pero
// una de hace un año puede traer un régimen o un domicilio que ya no son. Se
// marca cuando se emitió más de `DIAS_RECIENTE` días antes de subirla.
// ⚠️ Los 90 días son una DECISIÓN de producto (el «no mayor a 3 meses» que
// piden bancos y clientes en México), no un dato del SAT. Luis lo confirma.
//
// Nunca detiene una subida: corre DESPUÉS de registrar el documento, y si
// algo falla queda dicho en `analisis` y la persona que revisa decide.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MODEL = "claude-opus-5-5";
const API = "https://api.anthropic.com/v1/messages";
const BUCKET = "expedientes";
export const DIAS_RECIENTE = 90;

export type AnalisisCsf = {
  v: 1;
  at: string;
  esConstancia: boolean | null;
  rfc: string | null;
  nombre: string | null;
  fechaEmision: string | null;
  codigoPostal: string | null;
  regimenes: string[];
  estatus: string | null;
  alertas: string[];
  sat: "validada" | "no_emitida" | "sin_respuesta" | "sin_datos";
  satUrl: string | null;
  /** Contra el RFC que la operadora ya capturó. `null` = no había con qué comparar. */
  coincideRfc: boolean | null;
  /** Días entre la emisión y la subida. `null` = no se leyó la fecha. */
  diasDeAntiguedad: number | null;
  /** Si la lectura misma falló, por qué. */
  error?: string;
};

const SISTEMA = `Lees una Constancia de Situación Fiscal (CSF) del SAT de México para verificarla.
Extrae SOLO lo que está escrito en el documento. Si un dato no aparece, devuélvelo como null: no lo deduzcas ni lo completes.
- esConstancia: true sólo si el documento es una Constancia de Situación Fiscal / Cédula de Identificación Fiscal del SAT.
- rfc: el RFC del contribuyente, en mayúsculas.
- nombre: nombre, denominación o razón social tal como aparece.
- idCif: el idCIF (número de identificación de la cédula), sólo dígitos.
- fechaEmision: la fecha de emisión ("Lugar y Fecha de Emisión"), en formato YYYY-MM-DD.
- codigoPostal: el código postal del domicilio fiscal.
- regimenes: los regímenes fiscales vigentes, con su nombre como aparece.
- estatus: el "Estatus en el padrón" (p. ej. ACTIVO).
- alertas: SÓLO señales de que el ARCHIVO fue manipulado o no lo generó el SAT: falta el QR, la cadena original o el sello digital; tipografías o alineaciones distintas en datos clave; el RFC o el nombre no son los mismos en todas las secciones; recortes o empalmes visibles. Una frase por señal. Lista vacía si no ves ninguna.
  NO son alertas las fechas del historial fiscal (inicio de operaciones, último cambio de estado, altas de régimen u obligaciones): es normal que no coincidan entre sí, porque cuentan la historia del contribuyente.
NO copies CURP ni domicilio completo: no se piden.`;

const ESQUEMA = {
  type: "object",
  properties: {
    esConstancia: { type: ["boolean", "null"] },
    rfc: { type: ["string", "null"] },
    nombre: { type: ["string", "null"] },
    idCif: { type: ["string", "null"] },
    fechaEmision: { type: ["string", "null"] },
    codigoPostal: { type: ["string", "null"] },
    regimenes: { type: "array", items: { type: "string" } },
    estatus: { type: ["string", "null"] },
    alertas: { type: "array", items: { type: "string" } },
  },
  required: ["esConstancia", "rfc", "nombre", "idCif", "fechaEmision", "codigoPostal", "regimenes", "estatus", "alertas"],
  additionalProperties: false,
};

type Leido = {
  esConstancia: boolean | null;
  rfc: string | null;
  nombre: string | null;
  idCif: string | null;
  fechaEmision: string | null;
  codigoPostal: string | null;
  regimenes: string[];
  estatus: string | null;
  alertas: string[];
};

const vacio = (error: string): AnalisisCsf => ({
  v: 1, at: new Date().toISOString(), esConstancia: null, rfc: null, nombre: null, fechaEmision: null,
  codigoPostal: null, regimenes: [], estatus: null, alertas: [], sat: "sin_datos", satUrl: null,
  coincideRfc: null, diasDeAntiguedad: null, error,
});

/** La liga del validador del SAT, la misma que trae el QR de la constancia. */
export function urlValidadorSat(idCif: string, rfc: string): string {
  return `https://siat.sat.gob.mx/app/qr/faces/pages/mobile/validadorqr.jsf?D1=10&D2=1&D3=${encodeURIComponent(`${idCif}_${rfc}`)}`;
}

/**
 * Lo que dice el SAT de esa cédula. Lee el texto de la página: con un id que no
 * existe dice «no se le ha emitido»; con uno real, enseña el RFC.
 */
export async function preguntarAlSat(idCif: string, rfc: string): Promise<AnalisisCsf["sat"]> {
  try {
    const r = await fetch(urlValidadorSat(idCif, rfc), { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (!r.ok) return "sin_respuesta";
    const texto = (await r.text()).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    if (/no se le ha emitido/i.test(texto)) return "no_emitida";
    return texto.toUpperCase().includes(rfc.toUpperCase()) ? "validada" : "sin_respuesta";
  } catch {
    return "sin_respuesta";
  }
}

async function leerConIa(bytes: ArrayBuffer, tipo: string): Promise<Leido | { error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: "Falta ANTHROPIC_API_KEY: no se pudo leer la constancia." };
  const data = Buffer.from(bytes).toString("base64");
  const bloque =
    tipo === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
      : tipo === "image/jpeg" || tipo === "image/png"
        ? { type: "image", source: { type: "base64", media_type: tipo, data } }
        : null;
  if (!bloque) return { error: "Ese formato no se puede leer (HEIC). Para revisarla sola, sube el PDF que da el SAT." };

  const res = await fetch(API, {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system:
        SISTEMA +
        "\n\nRESPONDE ÚNICAMENTE con un objeto JSON válido — sin markdown ni texto alrededor — que cumpla este JSON Schema:\n" +
        JSON.stringify(ESQUEMA),
      messages: [{ role: "user", content: [bloque, { type: "text", text: "Lee esta constancia." }] }],
    }),
    signal: AbortSignal.timeout(50_000),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) return { error: `La IA no pudo leer la constancia: ${json?.error?.message || `HTTP ${res.status}`}` };
  const texto = (json?.content || []).find((b: { type: string }) => b.type === "text")?.text as string | undefined;
  if (!texto) return { error: "La IA no devolvió nada." };
  try {
    const crudo = JSON.parse(texto.slice(texto.indexOf("{"), texto.lastIndexOf("}") + 1)) as Partial<Leido>;
    const t = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    return {
      esConstancia: typeof crudo.esConstancia === "boolean" ? crudo.esConstancia : null,
      rfc: t(crudo.rfc)?.toUpperCase().replace(/\s+/g, "") ?? null,
      nombre: t(crudo.nombre),
      idCif: t(crudo.idCif)?.replace(/\D/g, "") || null,
      fechaEmision: /^\d{4}-\d{2}-\d{2}$/.test(t(crudo.fechaEmision) ?? "") ? t(crudo.fechaEmision) : null,
      codigoPostal: /^\d{5}$/.test(t(crudo.codigoPostal) ?? "") ? t(crudo.codigoPostal) : null,
      regimenes: Array.isArray(crudo.regimenes) ? crudo.regimenes.filter((x): x is string => typeof x === "string").slice(0, 8) : [],
      estatus: t(crudo.estatus),
      alertas: Array.isArray(crudo.alertas) ? crudo.alertas.filter((x): x is string => typeof x === "string").slice(0, 8) : [],
    };
  } catch {
    return { error: "La lectura de la IA no se pudo interpretar." };
  }
}

/** Días entre dos fechas `YYYY-MM-DD` / ISO. */
const diasEntre = (desde: string, hasta: string) =>
  Math.round((Date.parse(hasta.slice(0, 10)) - Date.parse(desde.slice(0, 10))) / 86_400_000);

/**
 * Lee la CSF del documento `docId`, la confirma con el SAT y guarda el
 * resultado en `operator_documents.analisis`. Nunca lanza.
 */
export async function analizarCsf(docId: string): Promise<AnalisisCsf | null> {
  try {
    const sb = createSupabaseAdminClient();
    const { data: fila } = await sb
      .from("operator_documents")
      .select("id, operator_id, documento, archivo_path, subido_at")
      .eq("id", docId)
      .maybeSingle();
    const doc = fila as { id: string; operator_id: string; documento: string; archivo_path: string | null; subido_at: string | null } | null;
    if (!doc || doc.documento !== "csf" || !doc.archivo_path) return null;

    const ext = doc.archivo_path.split(".").pop() ?? "";
    const tipo = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : ext === "jpg" ? "image/jpeg" : "image/heic";
    const { data: archivo, error: eDescarga } = await sb.storage.from(BUCKET).download(doc.archivo_path);

    let analisis: AnalisisCsf;
    if (eDescarga || !archivo) {
      analisis = vacio("No se pudo abrir el archivo para leerlo.");
    } else {
      const leido = await leerConIa(await archivo.arrayBuffer(), tipo);
      if ("error" in leido) {
        analisis = vacio(leido.error);
      } else {
        const { data: op } = await sb.from("operators").select("rfc").eq("id", doc.operator_id).maybeSingle();
        const rfcCapturado = ((op as { rfc?: string | null } | null)?.rfc ?? "").trim().toUpperCase();
        const sat = leido.idCif && leido.rfc ? await preguntarAlSat(leido.idCif, leido.rfc) : "sin_datos";
        analisis = {
          v: 1,
          at: new Date().toISOString(),
          esConstancia: leido.esConstancia,
          rfc: leido.rfc,
          nombre: leido.nombre,
          fechaEmision: leido.fechaEmision,
          codigoPostal: leido.codigoPostal,
          regimenes: leido.regimenes,
          estatus: leido.estatus,
          alertas: leido.alertas,
          sat,
          satUrl: leido.idCif && leido.rfc ? urlValidadorSat(leido.idCif, leido.rfc) : null,
          coincideRfc: rfcCapturado && leido.rfc ? rfcCapturado === leido.rfc : null,
          diasDeAntiguedad:
            leido.fechaEmision && doc.subido_at ? Math.max(0, diasEntre(leido.fechaEmision, doc.subido_at)) : null,
        };
      }
    }

    const { error } = await sb.from("operator_documents").update({ analisis }).eq("id", doc.id);
    // Sin la 0077 aplicada la columna no existe: se dice en el log y la
    // subida sigue intacta.
    if (error) console.error("analizarCsf (¿falta la 0077?):", error.message);
    return analisis;
  } catch (e) {
    console.error("analizarCsf:", e);
    return null;
  }
}

/** Lo que se le dice a una persona del análisis, en una línea y con su tono. */
export function resumenCsf(a: AnalisisCsf): { tono: "ok" | "aviso" | "mal"; texto: string } {
  if (a.error) return { tono: "aviso", texto: `No la pudimos leer sola: ${a.error} La revisa una persona.` };
  if (a.esConstancia === false) return { tono: "mal", texto: "Este archivo no parece una Constancia de Situación Fiscal." };
  if (a.sat === "no_emitida") return { tono: "mal", texto: "El SAT no reconoce esta constancia: su idCIF no corresponde a ese RFC." };
  const partes: string[] = [];
  if (a.rfc) partes.push(`RFC ${a.rfc}`);
  if (a.fechaEmision) {
    const [y, m, d] = a.fechaEmision.split("-").map(Number);
    partes.push(`emitida el ${new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}`);
  }
  if (a.sat === "validada") partes.push("confirmada con el SAT");
  const avisos: string[] = [];
  if (a.coincideRfc === false) avisos.push("el RFC no es el que capturaste");
  if (a.diasDeAntiguedad !== null && a.diasDeAntiguedad > DIAS_RECIENTE) avisos.push(`tiene ${Math.round(a.diasDeAntiguedad / 30)} meses: descarga una reciente del SAT`);
  if (a.sat === "sin_respuesta") avisos.push("el SAT no respondió; la confirmamos a mano");
  if (a.alertas.length) {
    // Con el SAT confirmándola, lo que vea la IA es una observación para quien
    // revisa, no una sospecha: el registro del SAT pesa más que la vista.
    avisos.push(
      a.sat === "validada"
        ? `${a.alertas.length === 1 ? "una observación" : `${a.alertas.length} observaciones`} de la lectura: ${a.alertas.join(" ")}`
        : `${a.alertas.length === 1 ? "una señal" : `${a.alertas.length} señales`} de que el archivo pudo alterarse: ${a.alertas.join(" ")}`,
    );
  }
  const texto = `Leída: ${partes.join(" · ") || "sin datos claros"}.${avisos.length ? ` Ojo: ${avisos.join("; ")}.` : ""}`;
  return { tono: avisos.length || a.sat !== "validada" ? "aviso" : "ok", texto };
}
