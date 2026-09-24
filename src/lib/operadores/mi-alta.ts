import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchOperadorasPlataforma, type OperadoraPlataforma } from "@/lib/plataforma/operadoras";
import { correoEnSesion } from "@/lib/auth/authorization";

// MI ALTA — la misma ficha que ve la casa, contada desde el otro lado.
//
// ⚠️ LOS CANDADOS NO SE RECALCULAN AQUÍ. Se leen de `fetchOperadorasPlataforma`,
// que es la función que usa la casa. Si esta pantalla tuviera su propia cuenta,
// tarde o temprano la ficha de Luis diría 2 de 6 y la del operador 3 de 6, y el
// que se enoja es el que tiene razón. Sale más caro un fetch de más que una
// contradicción entre las dos pantallas.
//
// Los siete estados NO son un campo: se deducen. Un estado que alguien mueve a
// mano se desincroniza de la realidad el primer día que nadie lo mueve.

export type EstadoAlta =
  | "recibida"        // 01 · mandó su solicitud, no hay nada que hacer
  | "llamada"         // 02 · hay videollamada agendada
  | "expediente"      // 03 · le pedimos documentos y faltan
  | "revision"        // 04 · entregó todo, la pelota es nuestra
  | "por_firmar"      // 05a · aprobado, pero sin convenio no empieza nada
  | "armando"         // 05b · puede construir; le falta lo de cobrar
  | "listo"           // 06 · seis de seis
  | "no_esta_vez"     // 07 · rechazada
  | "suspendida";     // fuera del alta: dejó de vender, sigue operando

export type MiAlta = {
  estado: EstadoAlta;
  operadora: OperadoraPlataforma | null;
  /** Los seis, tal cual los ve la casa. */
  candados: OperadoraPlataforma["candados"];
  paraArmar: OperadoraPlataforma["candados"];
  paraCobrar: OperadoraPlataforma["candados"];
  /** Lo que le toca a él, en orden. Lo de la casa NO lleva botón. */
  miTurno: OperadoraPlataforma["candados"];
  solicitud: {
    id: string;
    status: string;
    creadaAt: string;
    llamadaAt: string | null;
    meetUrl: string | null;
    documentosPedidos: number;
    documentosSubidos: number;
    motivoPublico: string | null;
    reabreAt: string | null;
  } | null;
  /** Estado de la operadora: activa, suspendida, en_salida, baja. */
  estadoOperadora: string | null;
  estadoMotivo: string | null;
};

type Expediente = { nombre?: string; archivo?: string | null }[];

/** El correo con el que está dada de alta una operadora. Sin él no hay alta. */
async function correoDeOperadora(operatorId: string): Promise<string | null> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("operators")
    .select("email")
    .eq("id", operatorId)
    .maybeSingle();
  if (error || !data) return null;
  return ((data as { email: string | null }).email ?? "").toLowerCase() || null;
}

/**
 * El alta de quien tiene la sesión, o —para la casa— la de otra operadora.
 *
 * ⚠️ `porOperadora` NO AUTORIZA NADA: se limita a resolver el correo por el que
 * se va a leer. Quien la pasa tiene que haber comprobado ANTES que es la casa,
 * exactamente como ya lo hacen las pantallas del expediente y de la marca. Si
 * esta función decidiera el permiso, cualquier llamada nueva que se le olvidara
 * comprobarlo le abriría a una operadora el alta de otra — con su expediente y
 * sus documentos adentro.
 *
 * Existe porque el alta se hace acompañada: Luis captura por la operadora en la
 * llamada, y hasta el 24 sep 2026 podía entrar a su expediente, a su cobro y a
 * su marca por separado con `?operadora=`, pero NO a la pantalla que las junta
 * y dice en qué paso va. Esa rebotaba a `/caminante/admin`.
 */
export async function fetchMiAlta(porOperadora?: string): Promise<MiAlta | null> {
  const email = porOperadora
    ? await correoDeOperadora(porOperadora)
    : await correoEnSesion();
  if (!email) return null;

  const sb = createSupabaseAdminClient();
  const [{ data: op }, { data: apps }] = await Promise.all([
    sb.from("operators")
      .select("id, estado, estado_motivo")
      .eq("email", email)
      .maybeSingle(),
    sb.from("operator_applications")
      .select("id, status, created_at, llamada_at, llamada_meet_url, expediente, motivo_publico, reabre_at")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const a = (apps ?? [])[0] as Record<string, unknown> | undefined;
  const exp = Array.isArray(a?.expediente) ? (a.expediente as Expediente) : [];
  const solicitud = a
    ? {
        id: a.id as string,
        status: a.status as string,
        creadaAt: a.created_at as string,
        llamadaAt: (a.llamada_at as string | null) ?? null,
        meetUrl: (a.llamada_meet_url as string | null) ?? null,
        documentosPedidos: exp.length,
        documentosSubidos: exp.filter((d) => d.archivo).length,
        motivoPublico: (a.motivo_publico as string | null) ?? null,
        reabreAt: (a.reabre_at as string | null) ?? null,
      }
    : null;

  // ⚠️ LA FILA MANDA (Luis, 22 sep 2026). Dos verdades hablaban del mismo hecho
  // —«¿esta persona ya es operadora?»— y esta función le creía a la equivocada.
  //
  // `operators` dice si hay una operadora viva; `operator_applications` cuenta
  // cómo llegó. Hasta hoy, mientras la solicitud estuviera en el embudo
  // (pendiente, llamada, documentos), se devolvía `operadora: null` AUNQUE la
  // fila existiera y estuviera activa — y `operadora: null` es lo que la página
  // del expediente usa para rebotar. Así quedó Nomádika: aprobada por atajo el
  // 25 ago, su solicitud reabierta a `calling`, su fila activa. No podía subir un
  // solo documento, y como sin actividad declarada no se publica, el candado la
  // mandaba… al expediente. Un lazo sin salida. Y la casa tampoco podía subir por
  // ella. Ver design/mvp/MVP.md §1.
  //
  // Desde aquí: si hay fila ACTIVA, es operadora y su alta se lee de sus seis
  // candados; el embudo se muestra como historia, no como puerta. El recorrido
  // sólo manda cuando no hay fila, o la que hay no está activa (baja,
  // suspendida): ahí sí, lo único que existe es la solicitud.
  const fila = op as { id: string; estado: string; estado_motivo: string | null } | null;
  const enRecorrido =
    !!solicitud && ["pending", "calling", "docs", "rejected"].includes(solicitud.status);
  if (!fila || (enRecorrido && fila.estado !== "activa")) {
    if (!solicitud) return null;
    let estado: EstadoAlta = "recibida";
    if (solicitud.status === "rejected") estado = "no_esta_vez";
    else if (solicitud.status === "calling") estado = "llamada";
    else if (solicitud.status === "docs") {
      // «En revisión» no es un status propio: es haber entregado todo lo que se
      // pidió. Guardarlo como campo aparte sería un tercer lugar que mantener.
      estado =
        solicitud.documentosPedidos > 0 &&
        solicitud.documentosSubidos >= solicitud.documentosPedidos
          ? "revision"
          : "expediente";
    }
    return {
      estado, operadora: null, candados: [], paraArmar: [], paraCobrar: [], miTurno: [],
      solicitud, estadoOperadora: null, estadoMotivo: null,
    };
  }

  const todas = await fetchOperadorasPlataforma();
  const mia = todas.find((o) => o.id === fila.id) ?? null;
  const candados = mia?.candados ?? [];
  const paraArmar = candados.filter((c) => c.bloquea === "armar");
  const paraCobrar = candados.filter((c) => c.bloquea === "cobrar");
  const miTurno = candados.filter((c) => !c.cumplido && c.toca === "operadora");

  let estado: EstadoAlta;
  if (fila.estado !== "activa") estado = "suspendida";
  else if (mia?.puedeCobrar) estado = "listo";
  else if (mia?.puedeArmar) estado = "armando";
  else estado = "por_firmar";

  return {
    estado, operadora: mia, candados, paraArmar, paraCobrar, miTurno,
    solicitud, estadoOperadora: fila.estado, estadoMotivo: fila.estado_motivo,
  };
}
