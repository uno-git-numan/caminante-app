"use client";

// MI ALTA — el recorrido, visto por quien lo está caminando.
//
// Transcrito de design/panel-operador/dc/Operador Mi Alta v5.html. El riel de
// cuatro pasos, sus dos momentos y el panel del paso actual salen de ahí; los
// datos salen de `fetchMiAlta`, que existía completo desde antes y no lo usaba
// ninguna pantalla.
//
// ⚠️ SE PUEDE PICAR UN PASO QUE TODAVÍA NO TE TOCA, y eso es del diseño, no un
// descuido: el panel se ve casi todo apagado y la lámina lo dice con todas sus
// letras —«es una casa en obra, no una puerta en la cara»—. Poder asomarse a lo
// que viene es lo que hace que el apagón no se lea como un portazo.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AQUI_ESTAS, FIRMADO_EL, LECTURA_PASO, PASOS, TODAVIA_NO, pasoDe } from "@/lib/operadores/pasos";
import type { MiAlta as Datos } from "@/lib/operadores/mi-alta";
import { CDMX } from "@/lib/fecha/zona";
import Copiar from "./Copiar";
import ResumenTerminos from "./ResumenTerminos";
import RenglonDoc from "./RenglonDoc";
import Convenio, { type DatosFirma } from "./convenio/Convenio";
import { guardarTipoPersona } from "@/lib/payments/connect-actions";
import type { SolicitudEnviada } from "@/lib/operadores/mi-alta";
import { ANTIGUEDAD, PRIMEROS, SEGURO, TIPOS, etiqueta } from "@/lib/operadores/solicitud-opciones";


const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: CDMX });

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric", month: "long", year: "numeric", timeZone: CDMX,
  });

export default function MiAlta({
  datos,
  porOtra = null,
  firma = null,
}: {
  datos: Datos;
  /** Lo que se firma en el paso 03, y si ya se firmó. `null` actuando por otra. */
  firma?: DatosFirma | null;
  /**
   * El id de la operadora cuando quien mira es la casa actuando por ella.
   *
   * ⚠️ TIENE QUE VIAJAR EN TODAS LAS LIGAS DE ESTA PANTALLA. Cada sub-pantalla
   * (expediente, convenio, cobro, marca) resuelve por su cuenta a quién toca:
   * con `?operadora=` a ella, y sin él a quien tiene la sesión. Una sola liga
   * que se le olvide el parámetro deja a la casa capturando EN SU PROPIA FILA
   * a media alta ajena, sin que nada falle.
   */
  porOtra?: string | null;
}) {
  const aqui = pasoDe(datos.estado);
  const [viendo, setViendo] = useState(aqui.indice);
  const firmadoEl = datos.operadora?.convenioFirmadoAt ?? null;
  const s = datos.solicitud;
  const liga = (ruta: string) =>
    porOtra ? `${ruta}?operadora=${encodeURIComponent(porOtra)}` : ruta;

  // EL RESUMEN DE TÉRMINOS, DESPLEGABLE. Es el mismo documento que viaja en
  // PDF con la invitación a la llamada —misma lista de bloques, ver
  // `lib/operadores/terminos.ts`— para que se pueda releer sin buscar el
  // correo (Luis, 24 sep 2026). Usa el `details.fold` de la lámina, el mismo
  // de «Ver lo que mandé».
  const plegableTerminos = (antesDeLaLlamada: boolean) =>
    datos.terminos.length ? (
      <details className="fold" style={{ marginTop: 16 }}>
        <summary>
          <b>Resumen de términos</b>
          <span className="mut">
            {antesDeLaLlamada
              ? "Llegó con la invitación · léelo antes y anota tus dudas"
              : "Lo que se habló en la llamada, para releerlo cuando quieras"}
          </span>
        </summary>
        <div className="fb">
          <ResumenTerminos bloques={datos.terminos} />
        </div>
      </details>
    ) : null;

  return (
    <>
      <div className="pasos" id="pasos">
        {PASOS.map((p, i) => {
          // ⚠️ `done`, NO `hecho`. El único `.hecho` del CSS es
          // `.paso .subs button.hecho` —un botón dentro de otra cosa—, así que
          // `.paso.hecho` no casaba con ninguna regla y los pasos ya cumplidos
          // se pintaban como si no lo estuvieran. El modificador del entregable
          // para un paso terminado es `done`, y tiene sus cuatro reglas.
          const hecho = i < aqui.indice;
          const actual = i === aqui.indice;
          // Lámina «Panel Operadora»: done / now / next, y una sola línea de
          // estado en lugar de las dos pastillas de momentos de la v5.
          const estado = hecho
            ? i === 2 && firmadoEl
              ? FIRMADO_EL + fecha(firmadoEl)
              : p.cerrado
            : actual
              ? AQUI_ESTAS
              : TODAVIA_NO;
          return (
            <div
              key={p.n}
              className={`paso ${hecho ? "done" : actual ? "now" : "next"}${viendo === i ? " sel" : ""}`}
            >
              <button className="phead" onClick={() => setViendo(i)}>
                <span className="n">{hecho ? <span className="pal" /> : p.n}</span>
                <span className="g">
                  <b>{p.titulo}</b>
                  <small>{p.resumen}</small>
                  <span className="st">{estado}</span>
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="oppane paso-pane">
        {/* El aviso sólo va al asomarse a un paso que VIENE (lámina «Panel
            Operadora»). Uno que ya pasó enseña lo que pasó, sin encabezado: la
            v5 le ponía «Este paso ya lo pasaste, y así se veía por dentro» y
            debajo sólo la frase de presentación. */}
        {viendo > aqui.indice && viendo >= 1 ? (
          <p className="lectura">
            <s>{"//"}</s>
            <span className="g">
              <b>Todavía no te toca este paso, y así se ve por dentro</b>
              <span>{LECTURA_PASO[viendo as 1 | 2 | 3]}</span>
            </span>
          </p>
        ) : null}

        {/* ── 01 · Nos conocemos ─────────────────────────────────────────────
            Transcrito de la lámina «Panel Operadora» (recurso bf8eb7a0 · Paso1).
            Un solo bloque con dos veredictos: «Nos conocimos el …» cuando la
            llamada ya se tuvo, «Tenemos tu solicitud» con la tarjeta de la
            llamada mientras no. Debajo, siempre, «Ver lo que mandé».
            ⚠️ El resumen de términos NO está en la lámina: lo pidió Luis (24 sep
            2026) para releer lo que llegó con la invitación. Va al final.
            ⚠️ «La llamada ya se tuvo» = la operadora ya pasó de este paso. Con
            fila activa la fila manda: aunque su solicitud diga otra cosa, el
            paso quedó cerrado. La fecha sólo sale si está registrada. */}
        {viendo === 0 ? (
          <>
            {aqui.indice > 0 ? (
              <div className="verdict si">
                <span className="n">{"//"}</span>
                <span className="g">
                  <b>{s?.llamadaAt ? `Nos conocimos el ${fecha(s.llamadaAt)}` : "Nos conocimos"}</b>
                  <span>{s ? "Este paso quedó cerrado. Aquí sigue tu solicitud tal como la mandaste, por si quieres releerla." : "Este paso quedó cerrado."}</span>
                </span>
              </div>
            ) : (
              <div className="verdict casa">
                <span className="n">{"//"}</span>
                <span className="g">
                  <b>Tenemos tu solicitud</b>
                  <span>
                    {s?.creadaAt ? `Llegó el ${fecha(s.creadaAt)}. ` : ""}
                    {"La lee una persona, no un sistema. Lo único que te pedimos en este paso es llegar a la llamada: no hay documentos ni formularios."}
                  </span>
                </span>
              </div>
            )}

            {aqui.indice === 0 && s?.llamadaAt && s.meetUrl ? (
              <div className="card pad" style={{ boxShadow: "none", marginTop: 14 }}>
                <span className="subtitle">
                  Tu llamada · {fecha(s.llamadaAt)}, {hora(s.llamadaAt)} h
                </span>
                <Copiar url={s.meetUrl} />
                <p className="gnhint" style={{ maxWidth: "70ch" }}>
                  La liga vive aquí, no sólo en el correo. Si borras el correo, la llamada no se
                  pierde.
                </p>
                <div className="salfoot">
                  <a className="btn btn-orange btn-sm" href={s.meetUrl} target="_blank" rel="noreferrer">
                    Entrar a la llamada
                  </a>
                </div>
              </div>
            ) : null}

            {s ? <LoQueMande e={s.enviada} creadaAt={s.creadaAt} /> : null}

            {/* El resumen llega con la invitación: antes de agendar la llamada
                todavía no existe para ella. */}
            {aqui.indice > 0 || aqui.momento === 1 ? plegableTerminos(aqui.indice === 0) : null}
          </>
        ) : null}

        {/* ── 02 · Tu expediente ─────────────────────────────────────────── */}
        {/* EL EXPEDIENTE REAL, SIEMPRE QUE HAY OPERADORA. Se ve al picar el
            paso esté donde esté —antes, en él o después—, porque es la lista
            de lo que hay que subir y su estado, y eso no deja de ser cierto
            por mirarlo desde otro paso. Transcrito de la lámina v5 (#p2): la
            barra «N de M», las filas `.doc` y `.doc.pend` con sus dos íconos,
            y los veredictos de cada momento. */}
        {viendo === 1 && datos.expediente ? (
          <Expediente02
            e={datos.expediente}
            dispensas={datos.dispensas.filter((d) => d.vigente)}
            liga={liga}
            porOtra={porOtra}
          />
        ) : viendo === 1 && aqui.indice === 1 && s ? (
          <>
            {/* ⚠️ La lámina dice «ocho documentos». En la app la lista NO es
                fija: se escribe al pedir el expediente y cambia por actividad
                —a una operadora de montaña no se le pide certificación de
                buceo—. Poner un ocho de adorno le prometería a alguien un
                número que su lista no tiene. */}
            <div className={s.documentosSubidos >= s.documentosPedidos ? "verdict casa" : "verdict no"}>
              <span className="n">
                {s.documentosSubidos}/{s.documentosPedidos}
              </span>
              <span className="g">
                {s.documentosSubidos >= s.documentosPedidos ? (
                  <>
                    <b>Entregaste todo. Ahora nos toca a nosotros</b>
                    <span>
                      Los revisa una persona y tarda entre tres y cinco días hábiles. No falta nada
                      tuyo y no hay nada que puedas apurar desde aquí.
                    </span>
                  </>
                ) : (
                  <>
                    <b>Te faltan {s.documentosPedidos - s.documentosSubidos} documentos</b>
                    <span>
                      Van todos en paralelo y se guardan solos: puedes dejarlo a medias y volver
                      cuando quieras.
                    </span>
                  </>
                )}
                {/* ⚠️ EL PASO 02 NO TENÍA PUERTA. Decía «te faltan N
                    documentos» y no llevaba a ningún lado: el expediente existe
                    en `mi-alta/expediente` y esta pantalla —la que cuenta los
                    documentos— era la única del recorrido que no enlazaba a su
                    propio paso. El 04 sí lleva a convenio, cobro y marca. Se
                    descubrió cuando la casa quiso subir por una operadora y
                    tuvo que teclear la URL. */}
                <span style={{ marginTop: 8 }}>
                  <Link href={liga("/caminante/admin/mi-alta/expediente")}>
                    {s.documentosSubidos >= s.documentosPedidos
                      ? "Ver el expediente"
                      : "Subir los documentos"}
                  </Link>
                </span>
              </span>
            </div>
          </>
        ) : null}

        {/* ── 03 y 04 · lo que ya cuentan los candados ───────────────────── */}
        {/* ⚠️ SE VE DESDE CUALQUIER PASO, no sólo cuando es el actual. Aquí
            viven las ligas al cobro, a la marca y a los documentos: con el
            expediente abierto la operadora está en el 02, y si esto sólo se
            pintara estando en el 03 o el 04 se quedaba sin cómo llegar a su
            marca. La lámina lo promete arriba de cada paso: «así se ve por
            dentro».
            Y el veredicto sale de los candados (`puedeArmar`/`puedeCobrar`),
            no del número de paso: antes, estando en el 02, habría dicho
            «Puedes armar» sin preguntarle a nadie si era cierto. */}
        {/* ── 03 · El convenio (lámina «Panel Operadora») ───────────────── */}
        {viendo === 2 ? (
          <Paso03 datos={datos} firma={firma} porOtra={porOtra} irAPaso4={() => setViendo(3)} />
        ) : null}

        {/* ── 04 · Armar y cobrar (lámina «Panel Operadora») ──────────────── */}
        {viendo === 3 ? <Paso04 datos={datos} firma={firma} liga={liga} /> : null}
      </div>
    </>
  );
}

// ── PASO 03 · EL CONVENIO ─────────────────────────────────────────────────
//
// Transcrito de la lámina «Panel Operadora» (recurso bf8eb7a0 · Paso3). Los
// textos se copiaron del archivo con un script; dos se ajustan al dato real y
// se dice cuáles:
//   · «Firmas a nombre de Nomádika…» → el nombre de ESTA operadora, y «tu
//     identificación ya está en Lo general» sólo si de verdad la subió.
//   · «el poder del representante, aquí» → en nuestro catálogo el poder va CON
//     el acta, en Lo general («Acta constitutiva y poder del representante»);
//     pedirlo aquí otra vez sería pedir el mismo papel dos veces.
//
// ⚠️ LA FIRMA ES LA DE SIEMPRE: el componente de `mi-alta/convenio`, con su
// versión y la huella del texto leído, no una copia. Y sólo se ofrece a la
// operadora sobre sí misma: actuando por otra, la casa ve quién firma, no un
// botón que rebotaría (invariante #22).
const IcoFirmado = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
    <path d="M4 12.6l5.2 5.2L20 6.6" />
  </svg>
);

function QuienFirma({ op, porOtra }: { op: NonNullable<Datos["operadora"]>; porOtra: string | null }) {
  const [pendiente, arranca] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const elegir = (tipo: "fisica" | "moral") =>
    arranca(async () => {
      setError(null);
      const r = await guardarTipoPersona(porOtra ?? op.id, tipo);
      if (r.ok) router.refresh();
      else setError(r.error ?? "No se pudo guardar.");
    });
  return (
    <>
      <div className="opts">
        {([["fisica", "Persona física"], ["moral", "Persona moral"]] as const).map(([v, t]) => (
          <button
            key={v}
            type="button"
            className={"opt" + (op.tipoPersona === v ? " on" : "")}
            disabled={pendiente}
            onClick={() => elegir(v)}
          >
            <i />
            {t}
          </button>
        ))}
      </div>
      {error ? <p className="gnhint">{error}</p> : null}
    </>
  );
}

function Paso03({
  datos,
  firma,
  porOtra,
  irAPaso4,
}: {
  datos: Datos;
  firma: DatosFirma | null;
  porOtra: string | null;
  irAPaso4: () => void;
}) {
  const op = datos.operadora;
  if (!op) return null;
  const f = firma?.convenio?.firmado ?? null;
  const firmadoAt = f?.firmadoAt ?? op.convenioFirmadoAt;

  if (firmadoAt) {
    const detalle = [
      f?.firmanteNombre ? `${f.firmanteNombre}, por ${firma?.operadora ?? op.nombre}` : null,
      op.rfc ? `RFC ${op.rfc}` : null,
      firma ? `comisión: ${firma.comision.texto}` : null,
      f?.version ? `versión ${f.version}` : null,
    ].filter(Boolean).join(" · ");
    return (
      <div>
        <div className="sigdone">
          <IcoFirmado />
          <span className="g">
            <b>Firmado el {fecha(firmadoAt)}</b>
            {detalle ? <span>{detalle}</span> : null}
          </span>
          {f?.version ? <span className="chip c-paid">v{f.version}</span> : null}
        </div>
        <div className="ahora" style={{ marginTop: 14 }}>
          <span className="lb">{"// "}Se abrió tu catálogo</span>
          <h3>
            Experiencias ya está prendida: <em>arma la tuya.</em>
          </h3>
          <p>Tu firma es lo único que hacía falta. Desde hoy puedes escribir tu experiencia, subir fotos y poner precios, mientras resuelves lo de cobrar en el paso 4, en el orden que quieras.</p>
          <div className="salfoot">
            <button type="button" className="btn btn-orange" onClick={irAPaso4}>
              Ir a armar y cobrar
            </button>
          </div>
        </div>
        <details className="fold" style={{ marginTop: 14 }}>
          <summary>
            <b>El convenio que firmaste</b>
            {f?.version ? <span className="fr">v{f.version}</span> : null}
            <span className="mut">{fecha(firmadoAt)}</span>
          </summary>
          <div className="fb">
            {firma ? (
              <Convenio datos={firma} />
            ) : (
              <p className="gnhint">El texto firmado lo lee ella desde su panel.</p>
            )}
          </div>
        </details>
      </div>
    );
  }

  const idSubida = datos.expediente?.generales.find((g) => g.slug === "id-responsable");
  const acta = datos.expediente?.generales.find((g) => g.slug === "acta-constitutiva");
  return (
    <div>
      <p className="xh4" style={{ marginTop: 0 }}>¿Quién firma?</p>
      <QuienFirma op={op} porOtra={porOtra} />
      {op.tipoPersona === "fisica" ? (
        <p className="calm">
          <s>{"//"}</s>
          <span className="g">
            <b>Con tu identificación basta</b>
            <span>
              Firmas a nombre de {op.nombre}, que eres tú: no hay una sociedad de por medio. Tu identificación{" "}
              {idSubida && idSubida.estado !== "falta" ? "ya está" : "va"} en Lo general.
            </span>
          </span>
        </p>
      ) : op.tipoPersona === "moral" ? (
        <>
          <p className="calm">
            <s>{"//"}</s>
            <span className="g">
              <b>Una sociedad firma con acta y poder</b>
              <span>
                El acta constitutiva y el poder del representante van en Lo general. El nombre de quien firma tiene que ser el mismo del poder. Sin él la firma no obliga a la sociedad.
              </span>
            </span>
          </p>
          {acta ? (
            <div className="docs" style={{ marginTop: 12 }}>
              <RenglonDoc d={acta} actividad={null} operadora={porOtra} />
            </div>
          ) : null}
        </>
      ) : null}
      <p className="xh4">El convenio completo</p>
      {firma ? (
        <Convenio datos={firma} />
      ) : (
        <p className="calm">
          <s>{"//"}</s>
          <span className="g">
            <b>La firma la hace ella, desde su panel</b>
            <span>Firmar es un acto de la operadora: la casa no firma por nadie.</span>
          </span>
        </p>
      )}
    </div>
  );
}

// ── PASO 04 · ARMAR Y COBRAR ──────────────────────────────────────────────
//
// Transcrito de la lámina «Panel Operadora» (recurso bf8eb7a0 · Paso4): la
// tira de los seis, «Ya puedes vender» cuando aplica, y las dos mitades.
// Textos copiados del archivo por script. Lo que NO se transcribió, y por qué:
//   · el mini formulario de experiencia de «Armar» → Luis eligió (24 sep) sus
//     experiencias con su estado y el editor de siempre: dos editores de la
//     misma experiencia terminan guardando cosas distintas;
//   · el formulario incrustado de la cuenta de cobro («Titular + CLABE») → el
//     alta de la cuenta dentro de la plataforma es otra obra, y depende de la
//     cláusula del procesador (CONVENIO-v1.md, Cuarta §7); mientras, se enseña
//     el estado y la puerta a la pantalla de cobro;
//   · «el resto llega a tu cuenta dos días hábiles después de la salida» → el
//     plazo de pago está abierto con el abogado; no se promete;
//   · «uno para armar y cinco para cobrar» → nuestros seis no se reparten así.
const SixIco = ({ ok }: { ok: boolean }) =>
  ok ? (
    <svg className="st" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12.6l5.2 5.2L20 6.6" />
    </svg>
  ) : (
    <svg className="st" viewBox="0 0 24 24" fill="none" stroke="var(--sand)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );

function Paso04({
  datos,
  firma,
  liga,
}: {
  datos: Datos;
  firma: DatosFirma | null;
  liga: (ruta: string) => string;
}) {
  const op = datos.operadora;
  if (!op) return null;
  // «Armar» se prende al firmar el convenio, como el nav del alta.
  const firmado = !!(firma?.convenio?.firmado || op.convenioFirmadoAt);
  const lectura = !firmado;
  const n6 = datos.candados.filter((c) => c.cumplido).length;
  const publicadas = datos.experiencias.filter((e) => e.estado === "published");
  const f = datos.fiscal;
  const fiscalOK = !!(f.rfc && f.razonSocial && f.regimen && f.cp);
  const csdOK = datos.candados.find((c) => c.clave === "csd")?.cumplido ?? false;
  const cuentaOK = datos.candados.find((c) => c.clave === "connect")?.cumplido ?? false;
  const cobrarN = [fiscalOK, csdOK, cuentaOK].filter(Boolean).length;
  const comision = datos.candados.find((c) => c.clave === "comision")?.detalle ?? "";
  const armarEstado = lectura ? "Cuando firmes" : publicadas.length ? "Publicada" : "Ya puedes";

  return (
    <div>
      {datos.estado === "listo" ? (
        <div className="win" style={{ marginBottom: 16 }}>
          <span className="lb">{"// "}{op.nombre}</span>
          <p style={{ fontSize: "clamp(20px,2.6vw,27px)", fontWeight: 200, letterSpacing: "-.02em", lineHeight: 1.2, maxWidth: "26ch" }}>
            Ya puedes vender. 6 de 6.
          </p>
          <div className="row">
            <div>
              <span className="big">6/6</span>
              <p className="gnhint" style={{ maxWidth: "none" }}>Cerraste los seis.</p>
            </div>
            <div>
              <span className="big">{publicadas.length}</span>
              <p className="gnhint" style={{ maxWidth: "none" }}>
                {publicadas.length === 1
                  ? `«${publicadas[0].titulo}» publicada. Ya se puede comprar.`
                  : "Publicadas. Ya se pueden comprar."}
              </p>
            </div>
            <div>
              <span className="big">{comision}</span>
              <p className="gnhint" style={{ maxWidth: "none" }}>Retiene la plataforma de cada venta.</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="seis">
        {datos.candados.map((c) => (
          <span key={c.clave} className={"six" + (c.cumplido ? " ok" : "")}>
            <SixIco ok={c.cumplido} />
            {c.nombre}
          </span>
        ))}
        <span className="fr">{n6} de 6</span>
      </div>

      <div className="mitades" style={{ marginTop: 16 }}>
        <div className="mitad armar">
          <div className="mh">
            <b>Armar</b>
            <span className="fr">{armarEstado}</span>
            <small>Crear tu experiencia, escribir tu itinerario, poner cupos y precios. No necesita un solo dato fiscal.</small>
          </div>
          <div className="mb">
            {datos.experiencias.length ? (
              <div className="docs">
                {datos.experiencias.map((e) => (
                  <div key={e.slug} className={"doc" + (e.estado === "published" ? "" : " pend")}>
                    <SixIco ok={e.estado === "published"} />
                    <span className="nm">
                      <b>{e.titulo}</b>
                      {e.actividad ? <small>{e.actividad}</small> : null}
                    </span>
                    <span className="fl">
                      <span className="mut">{e.estado === "published" ? "Publicada" : "Borrador"}</span>
                    </span>
                    <span className="ac">
                      {!lectura ? (
                        <Link className="btn btn-ghost btn-sm" href={`/caminante/admin/experiencias/${e.slug}`}>
                          Abrir
                        </Link>
                      ) : null}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="gnhint" style={{ marginTop: 0 }}>Todavía no tienes experiencias.</p>
            )}
            {lectura ? (
              <p className="gnhint">Se prende en cuanto firmes el convenio.</p>
            ) : (
              <div className="salfoot">
                <Link className="btn btn-orange btn-sm" href="/caminante/admin/experiencias/nueva">
                  Crear una experiencia
                </Link>
              </div>
            )}
            {/* La marca no es de la lámina: Luis pidió (24 sep) que se ofrezca
                en el alta, y es de «armar» —cómo se ve lo suyo—. */}
            <p className="gnhint">
              <Link href={liga("/caminante/admin/mi-alta/marca")}>
                {op.marca.completa ? "Mi marca" : "Poner mi marca"}
              </Link>
              {" · "}
              {op.marca.completa
                ? "Tu portal y la reserva de tus clientes se ven con tus colores."
                : `Te falta ${op.marca.faltan.join(", ")}. Mientras, se ven de Caminante con tu nombre.`}
            </p>
          </div>
        </div>

        <div className="mitad cobrar">
          <div className="mh">
            <b>Cobrar</b>
            <span className="fr" style={cobrarN === 3 ? { color: "var(--olive-d)" } : undefined}>
              {lectura ? "Esto se te va a pedir" : cobrarN === 3 ? "Listo" : `Falta ${3 - cobrarN} de 3`}
            </span>
            <small>Tus datos fiscales, tu CSD y tu cuenta de cobro. Sin esto no publicamos: el cobro no tendría a dónde llegar.</small>
          </div>
          <div className="mb">
            <div className="subh" style={{ marginTop: 0 }}>
              <b>Datos fiscales</b>
              {fiscalOK ? (
                <span className="chip c-paid"><span className="cd" />Completos</span>
              ) : null}
            </div>
            <div className="pf">
              <Renglon k="RFC" v={f.rfc} />
              <Renglon k="Razón social" v={f.razonSocial} />
              <Renglon k="Régimen fiscal" v={f.regimen} />
              <Renglon k="Código postal fiscal" v={f.cp} />
            </div>
            <div className="subh">
              <b>Certificado de Sello Digital</b>
              <small>Con él timbramos las facturas de tus viajeros a tu nombre.</small>
            </div>
            <p className="gnhint" style={{ marginTop: 0 }}>{csdOK ? "Cargado." : "Sin cargar."}</p>
            <div className="subh">
              <b>Cuenta de cobro</b>
              {cuentaOK ? (
                <span className="chip c-paid"><span className="cd" />Verificada</span>
              ) : null}
            </div>
            <p className="gnhint" style={{ marginTop: 0 }}>
              {cuentaOK ? "Verificada: tus ventas pueden entrar a tu nombre." : "Sin conectar."}
            </p>
            <div className="salfoot">
              <Link className="btn btn-orange btn-sm" href={liga("/caminante/admin/mi-alta/cobrar")}>
                {cobrarN === 3 ? "Ver mis datos de cobro" : "Completar mis datos de cobro"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// «VER LO QUE MANDÉ» — la solicitud, congelada, tal cual la lámina v5 (#p1,
// momento s1): `details.fold` con `.solgrid` de dos `.pf` y sus `.pfr`, las
// citas en `.solp` y los tres compromisos como `.chip.c-paid`. Las palabras de
// cada respuesta son las del formulario (`solicitud-opciones.ts`), no otras.
const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: CDMX });

function Renglon({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="pfr">
      <span className="k">{k}</span>
      <span className="v">{v ?? <span className="mut">—</span>}</span>
      <span className="t" />
    </div>
  );
}

function Acepto({ si }: { si: boolean }) {
  return si ? (
    <span className="chip c-paid">
      <span className="cd" />
      Aceptado
    </span>
  ) : (
    <span className="mut">No lo aceptó</span>
  );
}

function LoQueMande({ e, creadaAt }: { e: SolicitudEnviada; creadaAt: string }) {
  return (
    <details className="fold" style={{ marginTop: 16 }}>
      <summary>
        <b>Ver lo que mandé</b>
        <span className="fr">{fechaCorta(creadaAt)}</span>
        <span className="mut">Tu solicitud, como la escribiste</span>
      </summary>
      <div className="fb">
        <p className="gnhint" style={{ maxWidth: "74ch", marginTop: 0 }}>
          Es el registro de lo que declaraste ese día, y queda congelado así. Si algo salió con un
          error, escríbenos y lo anotamos antes de revisarla. Lo que sí vas a poder editar cuando
          termine tu alta es <b>tu perfil</b>: tu página, la que ve el viajero.
        </p>
        <div className="solgrid">
          <div className="pf">
            <div className="ph">
              <b>Quién es</b>
            </div>
            <Renglon k="Operadora" v={e.nombreOperadora} />
            <Renglon k="Responsable" v={e.responsable} />
            <Renglon k="Correo" v={e.email} />
            <Renglon k="WhatsApp" v={e.whatsapp} />
            <Renglon k="Instagram" v={e.instagram} />
            <Renglon k="Desde" v={e.ciudadEstado} />
          </div>
          <div className="pf">
            <div className="ph">
              <b>Qué opera</b>
            </div>
            <Renglon k="Tipo de operación" v={etiqueta(TIPOS, e.tipo)} />
            <Renglon k="Antigüedad" v={etiqueta(ANTIGUEDAD, e.antiguedad)} />
            <Renglon k="Salidas al año" v={e.salidasAno} />
            <Renglon k="Personas por salida" v={e.personasSalida} />
            <Renglon k="Rango de precio" v={e.rangoPrecio} />
          </div>
        </div>
        {e.descripcion ? (
          <>
            <p className="xh4" style={{ marginTop: 20 }}>
              Cómo describiste tu operación
            </p>
            <p className="solp">«{e.descripcion}»</p>
          </>
        ) : null}
        <div className="solgrid" style={{ marginTop: 20 }}>
          <div className="pf">
            <div className="ph">
              <b>Cómo cuida a su gente</b>
            </div>
            <Renglon k="Seguro de responsabilidad civil" v={etiqueta(SEGURO, e.seguro)} />
            <Renglon k="Primeros auxilios" v={etiqueta(PRIMEROS, e.primeros)} />
            <Renglon k="Guías por persona" v={e.ratioGuias} />
          </div>
          <div className="pf">
            <div className="ph">
              <b>Lo que aceptó al mandarla</b>
            </div>
            <Renglon k="Cobro por la plataforma" v={<Acepto si={e.aceptaCobro} />} />
            <Renglon k="Deslinde de responsabilidad" v={<Acepto si={e.aceptaDeslinde} />} />
            <Renglon k="Encuesta de satisfacción" v={<Acepto si={e.aceptaEncuesta} />} />
          </div>
        </div>
        {e.incidentes ? (
          <>
            <p className="xh4" style={{ marginTop: 20 }}>
              Lo que contestaste sobre incidentes
            </p>
            <p className="solp">«{e.incidentes}»</p>
          </>
        ) : null}
        {e.porque ? (
          <>
            <p className="xh4" style={{ marginTop: 20 }}>
              Por qué Caminante
            </p>
            <p className="solp">«{e.porque}»</p>
          </>
        ) : null}
        {e.conociste ? (
          <div className="pf" style={{ marginTop: 12 }}>
            <div className="ph">
              <b>Cómo nos conoció</b>
            </div>
            <Renglon k="Por" v={e.conociste} />
          </div>
        ) : null}
      </div>
    </details>
  );
}

function Expediente02({
  e,
  dispensas,
  liga,
  porOtra,
}: {
  e: NonNullable<Datos["expediente"]>;
  dispensas: Datos["dispensas"];
  liga: (ruta: string) => string;
  /** La operadora por la que actúa la casa; `null` si es ella misma. */
  porOtra: string | null;
}) {
  const subir = liga("/caminante/admin/mi-alta/expediente");
  // Lo que se pinta dentro de una actividad pero VIVE en Lo general no se
  // cuenta dos veces: se pide una sola vez.
  const todos = [...e.generales, ...e.actividades.flatMap((a) => a.propios)];
  const total = todos.length;
  const entregados = total - e.faltanTotal;
  const pct = total ? Math.round((entregados / total) * 100) : 0;

  return (
    <>
      {e.completo ? (
        <div className="verdict si">
          <span className="n">
            {total}/{total}
          </span>
          <span className="g">
            <b>Tu expediente quedó completo y revisado</b>
            <span>
              Este paso se queda abierto para consultar lo que entregaste: tu póliza, tus permisos y
              las certificaciones de tus guías, con sus vigencias.
            </span>
          </span>
        </div>
      ) : e.vacio ? (
        <div className="verdict no">
          <span className="n">{"//"}</span>
          <span className="g">
            <b>Todavía no declaras qué actividades haces</b>
            <span>
              La lista de documentos depende de eso: a una operadora de montaña no se le pide lo de
              buceo. Declara tus actividades y te pedimos sólo lo que te toca.
            </span>
          </span>
        </div>
      ) : e.faltanTotal === 0 ? (
        <div className="verdict casa">
          <span className="n">{"//"}</span>
          <span className="g">
            <b>Entregaste todo. Ahora nos toca a nosotros</b>
            <span>
              Los revisa una persona y tarda entre tres y cinco días hábiles. No falta nada tuyo y no
              hay nada que puedas apurar desde aquí.
            </span>
          </span>
        </div>
      ) : (
        <div className="verdict no">
          <span className="n">
            {entregados}/{total}
          </span>
          <span className="g">
            <b>
              Te faltan {e.faltanTotal} {e.faltanTotal === 1 ? "documento" : "documentos"}
            </b>
            <span>
              Van todos en paralelo y se guardan solos: puedes dejarlo a medias y volver cuando
              quieras.
            </span>
          </span>
        </div>
      )}

      {/* ⚠️ UNA DISPENSA NO COMPLETA EL EXPEDIENTE, y por eso se dice aquí y no
          en su lugar. Deja vender mientras tanto —con dueño y caducidad—; sin
          este renglón, «te faltan 9 documentos» se leería como «estás
          bloqueada» cuando la operadora está vendiendo. */}
      {dispensas.map((d) => (
        <p key={d.id} className="cmstop">
          <s>{"//"}</s>
          <span>
            Vendes <b>{d.nombre.toLowerCase()}</b> con una dispensa hasta el{" "}
            <b>{fecha(d.venceAt)}</b>. Te deja vender mientras tanto; el expediente sigue abierto.
          </span>
        </p>
      ))}

      <div className="card pad" style={{ marginTop: 14 }}>
        <div className="docbar">
          <span className="fr">
            {entregados} de {total}
          </span>
          <span className="bar">
            <i style={{ width: `${pct}%` }} />
          </span>
          <span className="mut" style={{ fontSize: 12 }}>
            Se guarda solo · puedes dejarlo a medias
          </span>
        </div>

        <p className="xh4" style={{ marginTop: 6 }}>
          Lo general · se entrega una sola vez
        </p>
        <div className="docs">
          {e.generales.map((d) => (
            <RenglonDoc key={`g-${d.slug}`} d={d} actividad={null} operadora={porOtra} />
          ))}
        </div>

        {e.actividades.map((a) => (
          <div key={a.slug}>
            <p className="xh4" style={{ marginTop: 22 }}>
              {a.nombre}
            </p>
            {a.propios.length ? (
              <div className="docs">
                {a.propios.map((d) => (
                  <RenglonDoc key={`${a.slug}-${d.slug}`} d={d} actividad={a.slug} operadora={porOtra} />
                ))}
              </div>
            ) : (
              <p className="gnhint">Esta actividad no pide documentos propios.</p>
            )}
          </div>
        ))}

        <div className="salfoot" style={{ marginTop: 16 }}>
          <Link className="btn btn-orange btn-sm" href={subir}>
            {e.faltanTotal > 0 || e.vacio ? "Subir los documentos" : "Ver el expediente"}
          </Link>
        </div>
      </div>
    </>
  );
}
