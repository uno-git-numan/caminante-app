"use client";

// La tabla del roster con FICHA DESPLEGABLE por persona.
//
// La tabla resume para poder barrerla de un vistazo; la ficha es para cuando hay
// que ACTUAR — llamar a alguien, escribirle, o leerle a un médico lo que esa
// persona declaró. Eran dos necesidades distintas metidas en las mismas seis
// columnas: el teléfono ya venía en la consulta y no se dibujaba en ningún lado,
// y las alergias, los padecimientos y la dieta se concatenaban en una celda.
//
// ⚠️ LA FILA DE DETALLE SE RENDERIZA SIEMPRE y se esconde con CSS, nunca con un
// `&&` de React. Es lo que permite que al IMPRIMIR salgan TODAS las fichas
// abiertas sin tocar nada: el guía se lleva la hoja al cerro, donde no hay quién
// le dé clic a un chevron. Con render condicional, imprimir daría una hoja con
// los datos que de verdad hacen falta escondidos.
//
// Es cliente solo por el toggle. Los datos ya vienen resueltos del servidor
// (`fetchRoster`), y aquí no se consulta ni se calcula nada.

import { useState } from "react";
import type { RosterRow } from "@/lib/admin/queries";

function Dato({ k, v, tel, mail }: { k: string; v: string | null; tel?: boolean; mail?: boolean }) {
  if (!v) return null;
  const href = tel ? `tel:${v.replace(/[^\d+]/g, "")}` : mail ? `mailto:${v}` : null;
  return (
    <div className="r-dato">
      <span className="r-k">{k}</span>
      <span className="r-v">
        {href ? (
          <a href={href} style={{ textDecoration: "underline" }}>
            {v}
          </a>
        ) : (
          v
        )}
      </span>
    </div>
  );
}

export default function RosterTabla({ rows }: { rows: RosterRow[] }) {
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th className="num">Edad</th>
            <th>Contacto de emergencia</th>
            <th>Alergias / condiciones / dieta</th>
            <th>Contrató</th>
            <th>Deslinde</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const abierto = abierta === i;
            // Un acompañante no es `contacts`: no tiene teléfono ni correo
            // propios. Decirlo es más útil que dejar la ficha en blanco.
            const sinContactoPropio = !!r.titular && !r.telefono && !r.email;
            return [
              <tr key={`f${i}`}>
                <td style={{ fontWeight: 500 }}>
                  <button
                    type="button"
                    className={`r-name${abierto ? " abierto" : ""}`}
                    aria-expanded={abierto}
                    onClick={() => setAbierta(abierto ? null : i)}
                  >
                    <span className="r-chev" aria-hidden>
                      ›
                    </span>
                    <span>
                      {r.nombre}
                      {r.titular ? (
                        <span className="mut" style={{ fontWeight: 400 }}> · viene con {r.titular}</span>
                      ) : null}
                    </span>
                  </button>
                </td>
                <td className="num">{r.edad ?? "—"}</td>
                <td>{r.emergencia}</td>
                <td className={r.condiciones === "Ninguna" ? "mut" : ""}>{r.condiciones}</td>
                <td className={r.adicional ? "" : "mut"}>{r.adicional || "—"}</td>
                <td>
                  {r.deslinde ? (
                    <span className="tick">✓ {r.fechaFirma}</span>
                  ) : (
                    <span style={{ color: "var(--orange)", fontWeight: 600 }}>Pendiente</span>
                  )}
                </td>
              </tr>,
              <tr key={`d${i}`} className={`r-det${abierto ? " abierta" : ""}`}>
                <td colSpan={6}>
                  <div className="r-ficha">
                    <div className="r-grupo">
                      <div className="r-tit">Cómo localizarle</div>
                      <Dato k="WhatsApp" v={r.telefono} tel />
                      <Dato k="Correo" v={r.email} mail />
                      {sinContactoPropio ? (
                        <div className="r-vacio">
                          Viene con {r.titular} — no tiene contacto propio. Llámale a su titular.
                        </div>
                      ) : null}
                      {!r.titular && !r.telefono && !r.email ? (
                        <div className="r-vacio">Sin teléfono ni correo capturados.</div>
                      ) : null}
                    </div>

                    <div className="r-grupo">
                      <div className="r-tit">En caso de emergencia</div>
                      <Dato k="Nombre" v={r.emergenciaNombre} />
                      <Dato k="Parentesco" v={r.emergenciaParentesco} />
                      <Dato k="Teléfono" v={r.emergenciaTelefono} tel />
                      {!r.emergenciaNombre && !r.emergenciaTelefono ? (
                        <div className="r-vacio">Sin contacto de emergencia. Pídelo antes de salir.</div>
                      ) : null}
                    </div>

                    <div className="r-grupo">
                      <div className="r-tit">Salud declarada</div>
                      <Dato k="Alergias" v={r.alergias} />
                      <Dato k="Padecimientos" v={r.padecimientos} />
                      <Dato k="Medicamentos" v={r.medicamentos} />
                      <Dato k="Dieta" v={r.dieta} />
                      <Dato k="Tipo de sangre" v={r.tipoSangre} />
                      <Dato k="Condición física / nado" v={r.nivelFisico} />
                      {!r.alergias && !r.padecimientos && !r.medicamentos && !r.dieta && !r.tipoSangre && !r.nivelFisico ? (
                        <div className="r-vacio">
                          {r.deslinde ? "Declaró no tener nada que reportar." : "Aún no llena su perfil médico."}
                        </div>
                      ) : null}
                    </div>

                    <div className="r-grupo">
                      <div className="r-tit">Su viaje</div>
                      <Dato k="Contrató" v={r.adicional} />
                      <Dato k="Edad" v={r.edad != null ? `${r.edad} años` : null} />
                      <Dato k="Deslinde" v={r.deslinde ? `Firmado el ${r.fechaFirma}` : "Pendiente de firma"} />
                      {r.titular ? <Dato k="Viene con" v={r.titular} /> : null}
                    </div>
                  </div>
                </td>
              </tr>,
            ];
          })}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <div className="empty" style={{ border: 0 }}>
                  Aún no hay personas apuntadas a esta salida.
                </div>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
