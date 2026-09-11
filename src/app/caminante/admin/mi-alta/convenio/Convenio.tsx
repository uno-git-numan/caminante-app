"use client";

// FIRMAR EL CONVENIO Y LOS ANEXOS — transcripción de la lámina `#p3` de
// `design/panel-operador/dc/Operador Mi Alta v5.html`.
//
// El entregable tiene la lámina del convenio; los anexos por actividad son
// nuevos y REUSAN sus mismas piezas (`.legal`, `.sig`, `.ck`, `.sigdone`,
// `.fold`) en vez de inventar CSS. Son el mismo acto —leer un documento y
// aceptarlo a nombre de la empresa— y se ven igual a propósito.
//
// ⚠️ LAS DOS CASILLAS NACEN SIN MARCAR Y EL BOTÓN ES APARTE. Nada se acepta por
// omisión, y el botón sólo se enciende con las dos puestas y el nombre escrito.
// El servidor lo vuelve a exigir: esto es comodidad, no el candado.
//
// ⚠️ SE FIRMA EL TEXTO, NO UNA LIGA. El hash de lo que se pintó viaja en el
// formulario y el servidor lo compara contra el suyo.

import { useState, useTransition } from "react";
import { firmarConvenioAction, firmarAnexoAction } from "@/lib/operadores/convenio-actions";

export type DocFirmable = {
  clave: string;
  titulo: string;
  texto: string;
  hash: string;
  version: string;
  /** `null` = sin firmar. */
  firmado: { firmadoAt: string; firmanteNombre: string; version: string } | null;
  /** Firmó, pero de una versión anterior a la que se exige hoy. */
  desactualizado: boolean;
};

export type DatosFirma = {
  operadora: string;
  rfc: string | null;
  comision: string;
  email: string;
  convenio: DocFirmable | null;
  /** Un anexo por actividad declarada. Vacío = no ha declarado ninguna. */
  anexos: DocFirmable[];
};

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-MX", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * El texto tal cual, con el formato mínimo que `.legal` sabe pintar.
 *
 * No es un renderizador de markdown: es el traductor de lo poco que el documento
 * usa —títulos y negritas—. Meter una librería aquí sería abrir la puerta a que
 * el documento firmado se vea distinto según la versión de la librería, y lo
 * que se firma tiene que ser siempre lo mismo.
 */
function Legal({ doc }: { doc: DocFirmable }) {
  const negritas = (linea: string) =>
    linea.split(/\*\*(.+?)\*\*/g).map((t, i) => (i % 2 ? <b key={i}>{t}</b> : t));
  return (
    <div className="legal">
      {doc.texto.split("\n").map((linea, i) => {
        const l = linea.trim();
        if (!l) return null;
        if (l.startsWith("#")) return <h4 key={i}>{l.replace(/^#+\s*/, "")}</h4>;
        return <p key={i}>{negritas(l)}</p>;
      })}
      <p className="vers">Versión {doc.version}</p>
    </div>
  );
}

function Casilla({ nombre, marcada, onToggle, children }: {
  nombre: string;
  marcada: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    // El entregable dibuja la casilla con `<i>` y la clase `.on`; aquí hay
    // además un checkbox de verdad —oculto, no ausente— para que el formulario
    // lo mande y para que se pueda marcar con el teclado.
    <label className={"ck" + (marcada ? " on" : "")}>
      <input
        type="checkbox"
        name={nombre}
        checked={marcada}
        onChange={(e) => onToggle(e.target.checked)}
        style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
      />
      <i />
      <span>{children}</span>
    </label>
  );
}

function Firmar({ doc, datos, esAnexo }: { doc: DocFirmable; datos: DatosFirma; esAnexo: boolean }) {
  const [pendiente, arranca] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [leido, setLeido] = useState(false);
  const [facultades, setFacultades] = useState(false);
  const listo = nombre.trim().length > 2 && leido && facultades;

  return (
    <form
      action={(fd) =>
        arranca(async () => {
          const r = esAnexo ? await firmarAnexoAction(fd) : await firmarConvenioAction(fd);
          setError(r.ok ? null : r.error);
        })
      }
    >
      <input type="hidden" name="hash" value={doc.hash} />
      <input type="hidden" name="version" value={doc.version} />
      <input type="hidden" name="actividad" value={esAnexo ? doc.clave : ""} />
      <input type="hidden" name="email" value={datos.email} />
      <div className="sig" style={{ marginTop: 18 }}>
        <div className="tw">
          <span>Escribe tu nombre completo</span>
          <input
            type="text"
            name="nombre"
            value={nombre}
            placeholder="Como aparece en tu identificación"
            onChange={(e) => setNombre(e.target.value)}
            disabled={pendiente}
          />
        </div>
        <div className="who">
          <span className="f"><span>Firma por</span><b>{datos.operadora}</b></span>
          <span className="f"><span>RFC</span><b className="mono">{datos.rfc ?? "sin capturar"}</b></span>
          <span className="f"><span>Fecha</span><b className="mono">{fecha(new Date().toISOString())}</b></span>
          <span className="f"><span>Comisión pactada</span><b>{datos.comision}</b></span>
        </div>
        <Casilla nombre="aceptado" marcada={leido} onToggle={setLeido}>
          Leí {esAnexo ? "el anexo" : "el convenio"} completo y lo acepto a nombre de {datos.operadora}.
          Entiendo que esta firma electrónica tiene el mismo valor que una firma de puño y letra.
        </Casilla>
        <Casilla nombre="facultades" marcada={facultades} onToggle={setFacultades}>
          Declaro tener facultades para obligar a {datos.operadora}.
        </Casilla>
        <div className="salfoot">
          <button className="btn btn-orange" disabled={!listo || pendiente}>
            {pendiente ? "Firmando…" : esAnexo ? "Firmar el anexo" : "Firmar el convenio"}
          </button>
          {error ? <span className="mut">{error}</span> : null}
        </div>
        <p className="firmanota">
          <s>{"//"}</s>
          <span>
            Al firmar guardamos el documento exacto que estás leyendo en esta pantalla: este texto,
            esta versión, esta fecha. No guardamos una liga ni una referencia, sino una copia fiel de
            lo que viste, y queda en tu panel para consultarla cuando quieras.
          </span>
        </p>
        <p className="gnhint" style={{ maxWidth: "74ch" }}>
          Las dos casillas van sin marcar y el botón es aparte: nada se acepta por omisión.
        </p>
      </div>
    </form>
  );
}

function Bloque({ doc, datos, esAnexo }: { doc: DocFirmable; datos: DatosFirma; esAnexo: boolean }) {
  if (doc.firmado && !doc.desactualizado) {
    return (
      <div style={{ marginTop: 18 }}>
        <div className="sigdone">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--olive)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12.6l5.2 5.2L20 6.6" />
          </svg>
          <span className="g">
            <b>{doc.titulo} · firmado el {fechaHora(doc.firmado.firmadoAt)}</b>
            <span>{doc.firmado.firmanteNombre}, por {datos.operadora} · versión {doc.firmado.version}</span>
          </span>
        </div>
        <details className="fold" style={{ marginTop: 14 }}>
          <summary>
            <b>{esAnexo ? "El anexo que firmaste" : "El convenio que firmaste"}</b>
            <span className="fr">{doc.firmado.version}</span>
          </summary>
          <div className="fb"><Legal doc={doc} /></div>
        </details>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 18 }}>
      {doc.desactualizado ? (
        <p className="calm">
          <s>{"//"}</s>
          <span className="g">
            <b>Cambió lo que se te pide para esta actividad</b>
            <span>
              Firmaste la versión {doc.firmado!.version} y hoy se exige la {doc.version}. Lo que
              ya vendiste se opera y se honra; para publicar algo nuevo hace falta esta firma.
            </span>
          </span>
        </p>
      ) : null}
      <Legal doc={doc} />
      <Firmar doc={doc} datos={datos} esAnexo={esAnexo} />
    </div>
  );
}

export default function Convenio({ datos }: { datos: DatosFirma }) {
  return (
    <>
      <p className="xh4" style={{ marginTop: 0 }}>El convenio</p>
      {datos.convenio ? (
        <Bloque doc={datos.convenio} datos={datos} esAnexo={false} />
      ) : (
        // Sin versión publicada el pendiente es de la CASA, y se dice así. Un
        // candado que le echa la culpa a quien no puede resolverlo es peor que
        // no tenerlo.
        <p className="calm">
          <s>{"//"}</s>
          <span className="g">
            <b>Todavía no publicamos el convenio</b>
            <span>
              Nos falta a nosotros, no a ti. En cuanto esté, lo vas a encontrar aquí completo para
              leerlo y firmarlo, y te avisamos.
            </span>
          </span>
        </p>
      )}

      <p className="xh4" style={{ marginTop: 34 }}>Los anexos de tus actividades</p>
      <p className="gnhint" style={{ maxWidth: "74ch" }}>
        Uno por cada actividad que declaraste. El convenio fija el marco; el anexo dice qué se te
        pide para esa actividad en particular — una caminata y un descenso a una caverna no se
        acreditan igual. Cada uno se firma por separado, y lo firmado sigue vendiendo.
      </p>
      {datos.anexos.length === 0 ? (
        <p className="calm">
          <s>{"//"}</s>
          <span className="g">
            <b>No has declarado ninguna actividad</b>
            <span>Se declaran en tu expediente. Cuando declares una, su anexo aparece aquí.</span>
          </span>
        </p>
      ) : (
        datos.anexos.map((a) => <Bloque key={a.clave} doc={a} datos={datos} esAnexo />)
      )}
    </>
  );
}
