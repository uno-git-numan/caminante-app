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
import { PASOS, pasoDe } from "@/lib/operadores/pasos";
import type { MiAlta as Datos } from "@/lib/operadores/mi-alta";
import { CDMX, enPalabras } from "@/lib/fecha/zona";
import Copiar from "./Copiar";

const LECTURA: string[] = [
  "Lo único que te pedimos aquí es llegar a la llamada. No hay documentos ni formularios, y no hay nada que preparar.",
  "Aquí te vamos a pedir papeles de tu operación. La lista depende de lo que hagas y la escribimos nosotros; van todos en paralelo, y puedes dejarlo a medias y volver.",
  "Aquí firmas el convenio: tu comisión por escrito y quién responde por qué. Es una firma, y es lo único que bloquea todo lo demás.",
  "Aquí ya construyes. Tu experiencia y tu cobro avanzan al mismo tiempo y sin orden: puedes escribirla completa antes de tocar un solo dato fiscal.",
];

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric", month: "long", year: "numeric", timeZone: CDMX,
  });

export default function MiAlta({ datos }: { datos: Datos }) {
  const aqui = pasoDe(datos.estado);
  const [viendo, setViendo] = useState(aqui.indice);
  const s = datos.solicitud;

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
          return (
            <div
              key={p.n}
              className={`paso${actual ? " now" : ""}${hecho ? " done" : ""}${viendo === i ? " sel" : ""}`}
            >
              <button className="phead" onClick={() => setViendo(i)}>
                <span className="n">{p.n}</span>
                <span className="g">
                  <b>{p.titulo}</b>
                  <small>{p.resumen}</small>
                </span>
              </button>
              <div className="subs">
                {p.momentos.map((m, k) => (
                  <button key={m} className={actual && aqui.momento === k ? "on" : undefined} disabled>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="oppane paso-pane">
        {/* ⚠️ Asomarse hacia ATRÁS no es lo mismo que asomarse hacia adelante.
            Decirle «todavía no te toca» a alguien parado en el paso 3 sobre el
            paso 1 —que ya pasó— le dice que va al revés de como va. */}
        {viendo !== aqui.indice ? (
          <p className="lectura">
            <s>{"//"}</s>
            <span className="g">
              <b>
                {viendo < aqui.indice
                  ? "Este paso ya lo pasaste, y así se veía por dentro"
                  : "Todavía no te toca este paso, y así se ve por dentro"}
              </b>
              <span>{LECTURA[viendo]}</span>
            </span>
          </p>
        ) : null}

        {/* ── 01 · Nos conocemos ─────────────────────────────────────────── */}
        {viendo === 0 && aqui.indice === 0 ? (
          aqui.momento === 1 && s?.llamadaAt ? (
            <>
              <div className="verdict si">
                <span className="n">{"//"}</span>
                <span className="g">
                  <b>Tu llamada es el {enPalabras(new Date(s.llamadaAt))}</b>
                  <span>
                    Media hora, por video, hora del centro de México. Si no te queda, respóndenos
                    el correo y la movemos. Es lo único que te pedimos en este paso.
                  </span>
                </span>
              </div>
              {s.meetUrl ? (
                <div className="card pad" style={{ boxShadow: "none" }}>
                  <span className="subtitle">La liga de la llamada</span>
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
              <p className="gnhint" style={{ maxWidth: "74ch" }}>
                Este paso no tiene un solo documento ni un solo formulario, y por eso no tiene
                botones más que los de la llamada. Cuando hablemos, te decimos qué sigue y lo verás
                en el paso 2.
              </p>
            </>
          ) : (
            <>
              {/* ⚠️ Hay operadoras que NUNCA mandaron solicitud: se dieron de
                  alta a mano y no pasaron por el embudo (Kéntro). Contarles que
                  «tenemos tu solicitud» y prometerles una respuesta en tres días
                  es hablarles de un trámite que no existe. El tablero de la casa
                  ya distingue ese caso —dice «entró por fuera»— y aquí también. */}
              <div className="verdict casa">
                <span className="n">{"//"}</span>
                <span className="g">
                  {s ? (
                    <>
                      <b>Tenemos tu solicitud</b>
                      <span>
                        {s.creadaAt ? `Llegó el ${fecha(s.creadaAt)}. ` : ""}
                        La lee una persona, no un sistema, y te contestamos en un plazo de tres
                        días hábiles. No hay nada que hagas mientras tanto.
                      </span>
                    </>
                  ) : (
                    <>
                      <b>Ya nos conocemos</b>
                      <span>
                        Tu alta la abrimos nosotros, así que este paso no aplica: no mandaste
                        solicitud ni hace falta una llamada de arranque.
                      </span>
                    </>
                  )}
                </span>
              </div>
              <p className="xh4">Qué sigue</p>
              <div className="cmfan" style={{ marginTop: 0 }}>
                <div className="r">
                  <span className="no">01</span>
                  <span>
                    Te escribimos para agendar una llamada
                    <small>
                      Media hora, por video. Sirve para entender qué operas y contarte cómo cobra la
                      plataforma.
                    </small>
                  </span>
                </div>
                <div className="r">
                  <span className="no">02</span>
                  <span>
                    Te pedimos un expediente
                    <small>
                      Documentos de tu operación. La lista depende de lo que hagas y la escribimos
                      nosotros.
                    </small>
                  </span>
                </div>
                <div className="r">
                  <span className="no">03</span>
                  <span>
                    Revisamos y te decimos
                    <small>
                      Sí o no, con razones. Si es que sí, firmas el convenio y puedes empezar a
                      armar el mismo día.
                    </small>
                  </span>
                </div>
              </div>
              <p className="gnhint" style={{ maxWidth: "74ch" }}>
                El panel se ve casi todo apagado a propósito: es una casa en obra, no una puerta en
                la cara.
              </p>
            </>
          )
        ) : null}

        {/* ── 02 · Tu expediente ─────────────────────────────────────────── */}
        {viendo === 1 && aqui.indice === 1 && s ? (
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
              </span>
            </div>
          </>
        ) : null}

        {/* ── 03 y 04 · lo que ya cuentan los candados ───────────────────── */}
        {viendo >= 2 && aqui.indice >= 2 && viendo === aqui.indice ? (
          <>
            <div className={datos.estado === "listo" ? "verdict si" : "verdict no"}>
              <span className="n">{datos.candados.filter((c) => c.cumplido).length}/6</span>
              <span className="g">
                <b>
                  {datos.estado === "por_firmar"
                    ? "Falta tu firma del convenio"
                    : datos.estado === "listo"
                      ? "Puedes vender"
                      : "Puedes armar, todavía no cobrar"}
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
                  <Link href="/caminante/admin/mi-alta/convenio">
                    {datos.estado === "por_firmar"
                      ? "Leer y firmar el convenio"
                      : "Ver mi convenio y los anexos de mis actividades"}
                  </Link>
                </span>
              </span>
            </div>
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
              />
              <Mitad
                cual="cobrar"
                titulo="Cobrar"
                pie="Tus datos fiscales con tu CSD, y tu cuenta de cobro. Sin esto no publicamos: el cobro no tendría a dónde llegar."
                candados={datos.paraCobrar}
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
  cual, titulo, pie, candados,
}: {
  cual: "armar" | "cobrar";
  titulo: string;
  pie: string;
  candados: Datos["candados"];
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
          {candados.map((c) => (
            <span key={c.clave} className={`lk${c.cumplido ? " ok" : " no"}`}>
              {c.cumplido ? PALOMA : TACHE}
              <span className="g">
                {c.nombre}
                <small>{c.detalle}</small>
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
