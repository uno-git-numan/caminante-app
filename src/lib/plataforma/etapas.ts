// LAS SIETE ETAPAS y las formas que las acompañan.
//
// Viven APARTE de `operadoras.ts` por una razón de empaque, no de orden: ese
// módulo es `server-only` —abre el cliente de servicio de Supabase— y el
// tablero del pipeline es un componente de navegador. Importar las etapas
// desde allá arrastraba medio servidor al bundle y el build reventaba.
//
// Aquí no hay nada que consultar: son constantes y tipos. Se pueden leer de
// los dos lados sin abrir ninguna puerta.

export type Candado = {
  clave: string;
  nombre: string;
  cumplido: boolean;
  detalle: string;
  /** Quién lo destraba: la operadora o la casa. */
  toca: "operadora" | "casa";
  /**
   * QUÉ bloquea si falta. No todos bloquean lo mismo, y tratarlos igual es la
   * forma más rápida de perder a un operador: pedirle su sello del SAT a
   * alguien que todavía no ha escrito su primera experiencia lo manda a cerrar
   * la pestaña. Con «armar» puede entrar y construir en borrador desde el día
   * uno; lo de cobrar se le pide cuando ya tiene algo que quiere publicar.
   */
  bloquea: "armar" | "cobrar";
};

export type Etapa =
  | "llego"
  | "en_llamada"
  | "expediente"
  | "listo"
  | "vendiendo"
  | "dormido"
  | "se_salieron";

export const ETAPAS: { clave: Etapa; num: string; nombre: string; como: string }[] = [
  { clave: "llego", num: "01", nombre: "Llegó", como: "Automática · cae la solicitud" },
  { clave: "en_llamada", num: "02", nombre: "En llamada", como: "A mano · se agenda" },
  { clave: "expediente", num: "03", nombre: "Expediente", como: "A mano · se juntan papeles" },
  { clave: "listo", num: "04", nombre: "Listo para vender", como: "Automática · seis candados" },
  { clave: "vendiendo", num: "05", nombre: "Vendiendo", como: "Automática · tiene ventas del mes" },
  { clave: "dormido", num: "06", nombre: "Dormido", como: "Automática · 60 días sin vender" },
  { clave: "se_salieron", num: "07", nombre: "Se salieron", como: "Con su motivo" },
];

// ─── LA TARJETA DICE LO QUE IMPORTA EN SU COLUMNA ───────────────────────────
//
// ⚠️ Antes la tarjeta era la MISMA en las siete etapas: los cinco candados y un
// «me toca». En «01 Llegó» eso es ruido —todavía no importa ningún candado, lo
// único que importa es que alguien lleva días esperando respuesta— y en «02 En
// llamada» escondía justo el dato por el que abres el tablero: cuándo es la
// llamada. El entregable (design/plataforma/dc/plataforma.dc.html) resuelve
// tarjeta por columna; esto lo transcribe.
//
// Es una función PURA a propósito: la lámina del pipeline es un componente de
// navegador, y así se puede probar sin montar nada.

export type Tarjeta = {
  /** Bajo el nombre: de qué va esta etapa para esta operadora. */
  subtitulo: string;
  /** A la derecha del nombre. */
  edad: string;
  chips: { texto: string; valor?: string }[];
  /** El renglón «//» — lo siguiente que hay que hacer. */
  siguiente: string;
  /** Se pinta como vencida (naranja). */
  fria: boolean;
};

/** «Contestarle o cerrarla»: a partir de aquí una solicitud sin respuesta arde. */
export const DIAS_FRIA = 10;

const pesos = (n: number) => "$" + Math.round(n).toLocaleString("es-MX");

const dd = (iso: string, conHora = false) =>
  new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric", month: "short", timeZone: "America/Mexico_City",
    ...(conHora ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
  });

/** El proveedor, leído de la liga. No se guarda: la liga ya lo dice. */
export function proveedorDeLiga(url: string | null): string {
  if (!url) return "Videollamada";
  let h = "";
  try { h = new URL(url).hostname.replace(/^www\./, ""); } catch { return "Videollamada"; }
  if (h.endsWith("meet.google.com")) return "Meet";
  if (h.endsWith("zoom.us")) return "Zoom";
  if (h.endsWith("teams.microsoft.com") || h.endsWith("teams.live.com")) return "Teams";
  if (h.endsWith("whereby.com")) return "Whereby";
  if (h.endsWith("meet.jit.si")) return "Jitsi";
  return h;
}

/** Días → «hoy», «3 días», «5 meses». Sobre los dos meses, contar días no dice nada. */
function edadDe(dias: number | null): string {
  if (dias === null) return "entró por fuera";
  if (dias <= 0) return "hoy";
  // ⚠️ El corte NO puede ser a los 60: la etapa «Dormido» se prende justo
  // ahí, y una tarjeta que dice «2 meses» el día 61 esconde el dato por el que
  // se prendió. A los tres meses ya nadie cuenta días.
  if (dias < 90) return `${dias} ${dias === 1 ? "día" : "días"}`;
  const m = Math.round(dias / 30);
  return `${m} ${m === 1 ? "mes" : "meses"}`;
}

export type DatosTarjeta = {
  etapa: Etapa;
  candados: Candado[];
  cumplidos: number;
  experienciasPublicadas: number;
  experienciasBorrador: number;
  vendidoMes: number;
  comisionPct: number | null;
  solicitudAt: string | null;
  diasEsperando: number | null;
  llamadaAt: string | null;
  llamadaUrl: string | null;
};

export function tarjetaDeEtapa(o: DatosTarjeta): Tarjeta {
  const edad = edadDe(o.diasEsperando);
  const origen = o.solicitudAt ? `Solicitud · ${dd(o.solicitudAt)}` : "Alta a mano · sin solicitud";
  const faltan = o.candados.filter((c) => !c.cumplido);
  const listar = (cs: Candado[]) => cs.map((c) => c.nombre).join(" y ");

  switch (o.etapa) {
    case "llego": {
      const d = o.diasEsperando ?? 0;
      const fria = d >= DIAS_FRIA;
      return {
        subtitulo: origen,
        edad,
        chips: [{ texto: "Sin contestar" }],
        siguiente: fria
          ? `Contestarle o cerrarla. Lleva ${edad}.`
          : `Contestarle. Lleva ${edad} esperando.`,
        fria,
      };
    }

    case "en_llamada": {
      // El dato por el que se abre esta columna es CUÁNDO. Si la llamada se
      // agendó sin fecha (no debería, pero el estado existe), se dice.
      const cuando = o.llamadaAt ? `Videollamada · ${dd(o.llamadaAt, true)}` : "Sin fecha todavía";
      return {
        subtitulo: cuando,
        edad: o.llamadaAt ? "agendada" : edad,
        chips: [{ texto: proveedorDeLiga(o.llamadaUrl) }],
        siguiente: o.llamadaAt
          ? "Preguntarle qué experiencia trae y con qué precio."
          : "Ponerle fecha y mandarle la invitación.",
        fria: !o.llamadaAt,
      };
    }

    case "expediente": {
      // Aquí sólo se muestran los DOS de papeles. Los otros cuatro son de la
      // casa y no son lo que se está esperando en esta columna.
      const papeles = o.candados.filter((c) => c.clave === "convenio" || c.clave === "csd");
      const mios = faltan.filter((c) => c.toca === "casa");
      const suyos = faltan.filter((c) => c.toca === "operadora");
      return {
        subtitulo: `Expediente · ${o.cumplidos} de 6`,
        edad,
        chips: papeles.map((c) => ({ texto: c.nombre.split(" ")[0], valor: c.cumplido ? "ok" : "no" })),
        siguiente: suyos.length
          ? `Le falta ${listar(suyos)}.`
          : mios.length
            ? `Me toca: ${listar(mios)}.`
            : "Todo listo. Sólo falta que venda.",
        fria: false,
      };
    }

    case "listo":
      return {
        // Sin fecha: no se guarda CUÁNDO se puso verde el sexto candado, y
        // ponerle una inventada sería peor que no ponerla.
        subtitulo: "Seis candados verdes",
        edad,
        chips: [{
          texto: o.experienciasPublicadas
            ? `${o.experienciasPublicadas} publicada${o.experienciasPublicadas === 1 ? "" : "s"}`
            : `${o.experienciasBorrador} en borrador`,
        }],
        siguiente: o.experienciasPublicadas
          ? "No ha vendido nada. Empujarle la primera salida."
          : "Publicarle su experiencia para que pueda vender.",
        fria: false,
      };

    case "vendiendo": {
      const mes = new Date().toLocaleDateString("es-MX", { month: "long", timeZone: "America/Mexico_City" });
      const chips: Tarjeta["chips"] = [{ texto: pesos(o.vendidoMes) }];
      // Sin porcentaje pactado no hay comisión que mostrar; inventarla sería
      // prometer un número que nadie firmó.
      if (o.comisionPct !== null) {
        chips.push({ texto: "Comisión", valor: pesos(o.vendidoMes * (o.comisionPct / 100)) });
      }
      return {
        subtitulo: `${o.experienciasPublicadas} publicada${o.experienciasPublicadas === 1 ? "" : "s"} · ${mes}`,
        edad,
        chips,
        siguiente: `Emitirle el CFDI de ${mes}.`,
        fria: false,
      };
    }

    case "dormido":
      return {
        subtitulo: `${o.solicitudAt ? "Por solicitud" : "Alta a mano"} · sin ventas`,
        edad,
        chips: [{ texto: `${o.experienciasPublicadas} publicadas` }],
        siguiente: o.experienciasPublicadas
          ? "Lleva dos meses sin vender. Preguntarle si sigue."
          : "Sigue sin experiencia publicada. Publicarle una o preguntarle si sigue.",
        fria: true,
      };

    default:
      return { subtitulo: origen, edad, chips: [], siguiente: "Fuera del pipeline.", fria: false };
  }
}
