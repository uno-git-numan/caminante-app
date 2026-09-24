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

import { useState } from "react";
import Link from "next/link";
import { AQUI_ESTAS, FIRMADO_EL, LECTURA_PASO, PASOS, TODAVIA_NO, pasoDe } from "@/lib/operadores/pasos";
import type { MiAlta as Datos } from "@/lib/operadores/mi-alta";
import { CDMX } from "@/lib/fecha/zona";
import Copiar from "./Copiar";
import ResumenTerminos from "./ResumenTerminos";
import RenglonDoc from "./RenglonDoc";
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
}: {
  datos: Datos;
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
        {viendo >= 2 && datos.operadora ? (
          <>
            <div className={datos.operadora.puedeCobrar ? "verdict si" : "verdict no"}>
              <span className="n">{datos.candados.filter((c) => c.cumplido).length}/6</span>
              <span className="g">
                <b>
                  {datos.operadora.puedeCobrar
                    ? "Puedes vender"
                    : datos.operadora.puedeArmar
                      ? "Puedes armar, todavía no cobrar"
                      : datos.candados.some((c) => c.clave === "convenio" && !c.cumplido)
                        ? "Falta tu firma del convenio"
                        : "Todavía no puedes armar"}
                </b>
                <span>
                  {datos.miTurno.length
                    ? `Te toca a ti: ${datos.miTurno.map((c) => c.nombre).join(" y ")}.`
                    : "No falta nada tuyo. Lo que queda lo hacemos nosotros."}
                </span>
                {/* El candado decía «falta tu firma» y no había a dónde ir: la
                    pantalla de firmar existía sin una sola puerta que llevara
                    a ella. Un pendiente sin destino se lee como un reproche. */}
                <span style={{ marginTop: 8 }}>
                  {/* ⚠️ EL CONVENIO NO SE ABRE POR ELLA, Y NO ES UN OLVIDO.
                      `mi-alta/convenio` es la única sub-pantalla del alta que
                      NO acepta `?operadora=`: firmar es un acto de ella, y una
                      pantalla donde la casa pudiera apretar «Acepto» a nombre
                      de alguien más es justo la que no queremos construir. Así
                      que actuando por otra no se ofrece la liga —ofrecerla
                      sería mandar a un rebote sin explicación— y en su lugar se
                      dice por qué. Todo lo demás del alta sí se puede hacer por
                      ella: expediente, cobro y marca. */}
                  {porOtra ? (
                    <span className="mut">La firma del convenio la hace ella desde su panel</span>
                  ) : (
                    <Link href={liga("/caminante/admin/mi-alta/convenio")}>
                      {datos.estado === "por_firmar"
                        ? "Leer y firmar el convenio"
                        : "Ver mi convenio y los anexos de mis actividades"}
                    </Link>
                  )}
                  {" · "}
                  <Link href={liga("/caminante/admin/mi-alta/cobrar")}>Mi cuenta de cobro y datos fiscales</Link>
                  {" · "}
                  {/* ⚠️ EL EXPEDIENTE TAMBIÉN VA AQUÍ, no sólo en el paso 02.
                      Su puerta del 02 vive dentro del panel de ese paso, y ese
                      panel deja de dibujarse en cuanto el alta avanza: para una
                      operadora que ya va en el 04 —Nomádika, hoy— el expediente
                      quedaba otra vez sin una sola liga en toda la pantalla. Y
                      no es una pantalla de sólo lectura: un documento se vence,
                      se rechaza o se agrega al declarar una actividad nueva.
                      Tampoco hay candado que lleve a él: los seis son comisión,
                      convenio, CSD, Connect, panel y experiencia. */}
                  <Link href={liga("/caminante/admin/mi-alta/expediente")}>Mis documentos</Link>
                  {" · "}
                  {/* ⚠️ LA MARCA SE OFRECE, NO SÓLO SE RECLAMA. Hasta el 24 sep
                      2026 sólo aparecía en el aviso de abajo, o sea únicamente
                      cuando estaba a medias — y en cuanto se completaba
                      desaparecía de esta pantalla, sin manera de volver a verla
                      ni de cambiarla desde aquí. Una cosa que sólo existe
                      cuando está mal es una cosa que nadie elige hacer: se
                      descubre al ser regañado. Aquí va siempre, junto al
                      convenio y al cobro, porque los tres son lo que se hace
                      mientras se arma. */}
                  <Link href={liga("/caminante/admin/mi-alta/marca")}>
                    {datos.operadora?.marca.completa ? "Mi marca" : "Poner mi marca"}
                  </Link>
                </span>
              </span>
            </div>
            {/* Tarea #103. La marca no es candado —no bloquea vender— pero a
                medias apaga el portal y viste el funnel de Caminante, y nadie
                se entera hasta que lo ve. Se dice aquí, con su puerta. */}
            {datos.operadora && !datos.operadora.marca.completa ? (
              <div className="verdict no" style={{ marginTop: 12 }}>
                <span className="n">{"//"}</span>
                <span className="g">
                  <b>Tu marca está a medias: te falta {datos.operadora.marca.faltan.join(", ")}</b>
                  <span>
                    Mientras, tu portal y la reserva de tus clientes se ven de Caminante con tu nombre.
                    Son dos colores.
                  </span>
                  <span style={{ marginTop: 8 }}>
                    <Link href={liga("/caminante/admin/mi-alta/marca")}>Completar mi marca</Link>
                  </span>
                </span>
              </div>
            ) : null}
            {/* ⚠️ `.gate` NO EXISTE EN NINGÚN ENTREGABLE. Sus 14 reglas están en
                mi-alta-css.ts porque el extractor se trajo el CSS de la v5
                completo, y ahí adentro venían las de la v2 —un bloque cuyo
                markup la v5 ya había sustituido—. La clase casaba, la
                estructura no: `.gate .gh` y `.gate .gb` esperan una cabecera y
                un cuerpo, así que un `<b>` y un `<span>` sueltos salían sin una
                sola regla encima. Lo que la v5 sí dibuja para estos seis es
                `.mitad.armar` / `.mitad.cobrar` con su `.locks` de `.lk`
                adentro, y es lo mismo que ya pinta la casa en `Candados.tsx`.
                El contenedor `.gates` se queda: su rejilla de 1fr/1.55fr existe
                justamente para estos dos grupos de tamaño distinto. */}
            <div className="gates">
              <Mitad
                cual="armar"
                titulo="Armar"
                pie="Crear tu experiencia, subir fotos, escribir tu itinerario, poner cupos y precios. No necesita un solo dato fiscal."
                candados={datos.paraArmar}
                liga={liga}
                conFirma={porOtra ? null : "/caminante/admin/mi-alta/convenio"}
              />
              <Mitad
                cual="cobrar"
                titulo="Cobrar"
                pie="Tus datos fiscales con tu CSD, y tu cuenta de cobro. Sin esto no publicamos: el cobro no tendría a dónde llegar."
                candados={datos.paraCobrar}
                liga={liga}
                conFirma={porOtra ? null : "/caminante/admin/mi-alta/convenio"}
              />
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}

// LA PALOMA Y EL TACHE, tal cual los trae el entregable de la plataforma
// (`design/plataforma/dc/plataforma.dc.html`, el bloque `.locks`). Son los
// mismos dos SVG que dibuja `Candados.tsx` del lado de la casa: si aquí se
// dibujaran de otra forma, el mismo candado se vería distinto según quién lo
// mire, que es justo lo que `fetchMiAlta` se cuida de no permitir con los datos.
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

const PALOMA = (
  <svg className="m" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12.6l5.2 5.2L20 6.6" />
  </svg>
);
const TACHE = (
  <svg className="m" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

// UNA DE LAS DOS MITADES. El reparto no se escribe aquí: sale de `bloquea`, en
// `fetchMiAlta`. La cuenta del `.fr` tampoco — se cuenta de la lista que llega,
// porque «1 de 1 y 2 de 5» es lo que decía la lámina y los datos reales reparten
// 2 y 4. Un número de adorno en la pantalla del operador es un número que él
// puede desmentir mirando sus propios candados.
//
// ⚠️ Sin `.own`: «Yo» y «Él» son la voz de la CASA. Aquí el dueño ya lo dice el
// veredicto de arriba —«Te toca a ti: …»— y en esta pantalla el «Él» sería él.
function Mitad({
  cual, titulo, pie, candados, liga, conFirma,
}: {
  cual: "armar" | "cobrar";
  titulo: string;
  pie: string;
  candados: Datos["candados"];
  /** El constructor de ligas del padre, para que el `?operadora=` no se pierda
      aquí adentro. Se pasa en vez de rehacerlo: dos constructores del mismo
      enlace son dos lugares donde se puede olvidar el parámetro. */
  liga: (ruta: string) => string;
  /** La puerta del convenio, o `null` cuando la casa actúa por otra: firmar es
      de ella y esa pantalla no acepta `?operadora=`. El candado se sigue
      viendo en rojo; lo que no aparece es un «Resolverlo» que rebota. */
  conFirma: string | null;
}) {
  const cumplidos = candados.filter((c) => c.cumplido).length;
  return (
    <div className={`mitad ${cual}`}>
      <div className="mh">
        <b>{titulo}</b>
        <span className="fr">
          {cumplidos} de {candados.length}
        </span>
        <small>{pie}</small>
      </div>
      <div className="mb">
        <div className="locks">
          {candados.map((c) => {
            // CADA CANDADO QUE LE TOCA A ELLA LLEVA SU PUERTA. «Falta tu CSD» sin
            // un lugar a dónde ir se leía como un reproche: CSD y Connect vivían
            // sólo en la pantalla de la casa hasta el 22 sep 2026.
            const puerta =
              !c.cumplido && c.toca === "operadora"
                ? c.clave === "convenio"
                  ? conFirma
                  : c.clave === "csd" || c.clave === "connect"
                    ? liga("/caminante/admin/mi-alta/cobrar")
                    : null
                : null;
            return (
              <span key={c.clave} className={`lk${c.cumplido ? " ok" : " no"}`}>
                {c.cumplido ? PALOMA : TACHE}
                <span className="g">
                  {c.nombre}
                  <small>
                    {c.detalle}
                    {puerta ? (
                      <>
                        {" · "}
                        <Link href={puerta}>Resolverlo</Link>
                      </>
                    ) : null}
                  </small>
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
