// "Mi espacio" — la página personal del caminante (diseño Claude Design jul
// 2026, integrado igual que el dashboard: CSS scopeado .mesp, server
// component, expandibles con JS de delegación, forms inline → server actions).
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { signOut } from "@/lib/auth/actions";
import { fetchMiEspacio, type ProximaSalida } from "@/lib/perfil/queries";
import {
  guardarDatosAction,
  guardarMedicoAction,
  agregarAcompananteAction,
} from "@/lib/perfil/actions";
import { ESPACIO_CSS } from "./ui/espacio-css";
import { CAMINANTE_MARK } from "./ui/logo";

export const dynamic = "force-dynamic";

const WA = "https://wa.me/525512020565";
const SANGRES = ["", "O+", "O−", "A+", "A−", "B+", "B−", "AB+", "AB−"];

// Acordeones + forms inline, sin client components (patrón del dashboard).
const TOGGLE_JS = `
document.addEventListener('click',function(e){
  var fb=e.target.closest('[data-form]');
  if(fb){var f=document.getElementById(fb.dataset.form);if(f){f.classList.toggle('on');}return;}
  var b=e.target.closest('[data-acc]');
  if(!b) return;
  var acc=document.getElementById(b.dataset.acc);
  if(acc) acc.classList.toggle('open');
});
`;

function lineaNext(p: ProximaSalida): string {
  if (p.pago !== "pagada") {
    return "Tu lugar está apartado. En cuanto se complete el pago, quedamos listos.";
  }
  if (p.deslinde && p.deslinde !== "firmado") {
    return "Solo falta tu firma. Toma dos minutos y con eso quedamos listos para caminar.";
  }
  return "Todo listo. Nos vemos en el punto de encuentro. Te escribimos por WhatsApp unos días antes.";
}

export default async function MiEspacioPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/caminante/login?next=%2Fcaminante%2Fperfil");
  if (await isCurrentUserAdmin()) redirect("/caminante/admin");

  const { ok, error } = await searchParams;
  const me = await fetchMiEspacio(user);

  return (
    <div className="mesp">
      <style dangerouslySetInnerHTML={{ __html: ESPACIO_CSS }} />

      <div className="topbar">
        <div className="in">
          <a href="/caminante" aria-label="Caminante — inicio" className="logo" dangerouslySetInnerHTML={{ __html: CAMINANTE_MARK }} />
          <div className="rt">
            <a className="sitelink" href="/caminante">
              Ver el sitio
            </a>
            <form action={signOut}>
              <button type="submit" className="out">
                Salir
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="wrap">
        <header className="hd">
          <span className="eyebrow">
            <span className="sl">{"//"}</span> Mi espacio
          </span>
          <h1 className="display">
            Hola, <em className="ac">{me.nombre}.</em>
          </h1>
          <p className="po">El paisaje te está esperando.</p>
        </header>

        {ok ? <div className="flash ok">Guardado. ✓</div> : null}
        {error ? <div className="flash err">{error}</div> : null}

        {/* ===== PRÓXIMAS SALIDAS ===== */}
        <section className="sec">
          <span className="eyebrow">
            <span className="sl">{"//"}</span> Tus próximas salidas
          </span>

          {me.proximas.length === 0 ? (
            <div className="empty">
              Aún no tienes salidas reservadas.{" "}
              <a href="/caminante#proximos">Mira los próximos paisajes →</a>
            </div>
          ) : (
            me.proximas.map((p) => (
              <article className="trip" key={p.reservaId}>
                <div className="ph">
                  {p.foto ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.foto} alt={p.titulo} />
                  ) : null}
                </div>
                <div className="top">
                  <span className="chip-date">{p.fecha}</span>
                </div>
                <div className="body">
                  {p.lugar ? (
                    <span className="eb">
                      <span className="sl">{"//"}</span> {p.lugar}
                    </span>
                  ) : null}
                  <h3>{p.titulo}</h3>
                  <div className="pax">{p.personasLinea}</div>
                  <div className="chips">
                    {p.pago === "pagada" ? (
                      <span className="chip c-ok">
                        Pagada <span className="tick">✓</span>
                      </span>
                    ) : (
                      <span className="chip c-warn">
                        {p.pago === "parcial" ? "Pago parcial" : "Pago pendiente"}
                      </span>
                    )}
                    {p.deslinde === "firmado" ? (
                      <span className="chip c-ok">
                        Deslinde firmado <span className="tick">✓</span>
                      </span>
                    ) : p.deslinde ? (
                      <a className="cta-firma" href={p.deslinde.firmarUrl}>
                        Firma tu deslinde →
                      </a>
                    ) : null}
                  </div>
                  <p className="next">{lineaNext(p)}</p>
                  <div className="foot">
                    <a
                      className="btn-glassy"
                      href={WA}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ¿Dudas? Escríbenos
                    </a>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        {/* ===== SALIDAS VIVIDAS ===== */}
        {me.vividas.length > 0 ? (
          <section className="sec">
            <span className="eyebrow">
              <span className="sl">{"//"}</span> Tus salidas vividas
            </span>
            <div className="past">
              {me.vividas.map((v, i) => (
                <article className="pcard" key={i}>
                  <div className="pim">
                    {v.foto ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={v.foto} alt={v.titulo} />
                    ) : null}
                  </div>
                  <div className="pin">
                    <div className="nm">{v.titulo}</div>
                    <div className="mt">{v.meta}</div>
                    {v.encuesta === "hecha" ? (
                      <span className="done">Encuesta enviada ✓</span>
                    ) : v.encuesta ? (
                      <a className="linky" href={`/caminante/feedback/${v.encuesta.token}`}>
                        Cuéntanos cómo te fue →
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {/* ===== EXPEDIENTE ===== */}
        <section className="sec">
          <span className="eyebrow">
            <span className="sl">{"//"}</span> Tu expediente
          </span>

          {/* Tus datos */}
          <div className="acc" id="a1">
            <button className="acc-h" data-acc="a1" type="button">
              <span className="l">
                <span className="ti">Tus datos</span>
                <span className="su">Nombre, contacto, ciudad</span>
              </span>
              <span className="chev">▾</span>
            </button>
            <div className="acc-b">
              <div className="acc-in">
                <div className="dgrid">
                  <div className="drow">
                    <span className="k">Nombre</span>
                    <span className="v">{me.datos.nombreCompleto || "—"}</span>
                  </div>
                  <div className="drow">
                    <span className="k">Correo</span>
                    <span className="v">{me.datos.email || "—"}</span>
                  </div>
                  <div className="drow">
                    <span className="k">WhatsApp</span>
                    <span className="v">{me.datos.whatsapp || "—"}</span>
                  </div>
                  <div className="drow">
                    <span className="k">Ciudad</span>
                    <span className="v">{me.datos.ciudad || "—"}</span>
                  </div>
                  <div className="drow">
                    <span className="k">Fecha de nacimiento</span>
                    <span className="v">{me.datos.nacimientoFmt || "—"}</span>
                  </div>
                </div>
                <div className="acc-act">
                  <button className="btn btn-ghost btn-sm" data-form="f1" type="button">
                    Editar
                  </button>
                </div>
                <form className="form" id="f1" action={guardarDatosAction}>
                  <div className="f2">
                    <div className="fg">
                      <label htmlFor="mesp-nombre">Nombre completo</label>
                      <input
                        id="mesp-nombre"
                        name="fullName"
                        type="text"
                        defaultValue={me.datos.nombreCompleto}
                      />
                    </div>
                    <div className="fg">
                      <label htmlFor="mesp-nac">Fecha de nacimiento</label>
                      <input
                        id="mesp-nac"
                        name="birthDate"
                        type="date"
                        defaultValue={me.datos.nacimiento}
                      />
                    </div>
                  </div>
                  <div className="f2">
                    <div className="fg">
                      <label htmlFor="mesp-wa">WhatsApp</label>
                      <input
                        id="mesp-wa"
                        name="phone"
                        type="tel"
                        defaultValue={me.datos.whatsapp}
                      />
                    </div>
                    <div className="fg">
                      <label htmlFor="mesp-ciudad">Ciudad</label>
                      <input
                        id="mesp-ciudad"
                        name="city"
                        type="text"
                        defaultValue={me.datos.ciudad}
                      />
                    </div>
                  </div>
                  <label className="check">
                    <input
                      type="checkbox"
                      name="mailingOptIn"
                      defaultChecked={me.datos.mailingOptIn}
                    />
                    Quiero recibir noticias de próximas salidas
                  </label>
                  <div className="acts">
                    <button className="btn btn-ghost btn-sm" data-form="f1" type="button">
                      Cancelar
                    </button>
                    <button className="btn btn-orange btn-sm" type="submit">
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Perfil de seguridad */}
          <div className="acc" id="a2">
            <button className="acc-h" data-acc="a2" type="button">
              <span className="l">
                <span className="ti">Tu perfil de seguridad</span>
                <span className="su">Salud, dieta y contacto de emergencia</span>
              </span>
              <span className="chev">▾</span>
            </button>
            <div className="acc-b">
              <div className="acc-in">
                <div className="dgrid">
                  <div className="drow">
                    <span className="k">Tipo de sangre</span>
                    <span className="v">{me.medico?.sangre || "—"}</span>
                  </div>
                  <div className="drow">
                    <span className="k">Alergias</span>
                    <span className="v">{me.medico?.alergias || "Ninguna"}</span>
                  </div>
                  <div className="drow">
                    <span className="k">Condiciones</span>
                    <span className="v">{me.medico?.condiciones || "Ninguna"}</span>
                  </div>
                  <div className="drow">
                    <span className="k">Medicamentos</span>
                    <span className="v">{me.medico?.medicamentos || "Ninguno"}</span>
                  </div>
                  <div className="drow">
                    <span className="k">Dieta</span>
                    <span className="v">{me.medico?.dieta || "Sin restricciones"}</span>
                  </div>
                  <div className="drow">
                    <span className="k">Contacto de emergencia</span>
                    <span className="v">
                      {me.medico?.emergenciaNombre
                        ? `${me.medico.emergenciaNombre}${
                            me.medico.emergenciaRelacion
                              ? ` · ${me.medico.emergenciaRelacion}`
                              : ""
                          }${me.medico.emergenciaTel ? ` · ${me.medico.emergenciaTel}` : ""}`
                        : "—"}
                    </span>
                  </div>
                </div>
                <p className="edit-note">
                  Esto solo lo ve el equipo que camina contigo. Jamás se comparte.
                </p>
                <div className="acc-act">
                  <button className="btn btn-ghost btn-sm" data-form="f2" type="button">
                    Editar
                  </button>
                </div>
                <form className="form" id="f2" action={guardarMedicoAction}>
                  <div className="f2">
                    <div className="fg">
                      <label htmlFor="mesp-sangre">Tipo de sangre</label>
                      <select
                        id="mesp-sangre"
                        name="bloodType"
                        defaultValue={me.medico?.sangre || ""}
                      >
                        {SANGRES.map((s) => (
                          <option key={s || "x"} value={s}>
                            {s || "—"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="fg">
                      <label htmlFor="mesp-dieta">Dieta</label>
                      <input
                        id="mesp-dieta"
                        name="dietaryRestrictions"
                        type="text"
                        defaultValue={me.medico?.dieta || ""}
                        placeholder="Ej. vegetariana, sin gluten…"
                      />
                    </div>
                  </div>
                  <div className="fg">
                    <label htmlFor="mesp-alergias">Alergias</label>
                    <textarea
                      id="mesp-alergias"
                      name="allergies"
                      defaultValue={me.medico?.alergias || ""}
                      placeholder="Ej. penicilina, mariscos…"
                    />
                  </div>
                  <div className="fg">
                    <label htmlFor="mesp-cond">Condiciones</label>
                    <textarea
                      id="mesp-cond"
                      name="conditions"
                      defaultValue={me.medico?.condiciones || ""}
                      placeholder="Ej. asma, hipertensión…"
                    />
                  </div>
                  <div className="fg">
                    <label htmlFor="mesp-meds">Medicamentos de uso periódico</label>
                    <textarea
                      id="mesp-meds"
                      name="medications"
                      defaultValue={me.medico?.medicamentos || ""}
                      placeholder="Ej. levotiroxina, diario"
                    />
                  </div>
                  <div className="f2">
                    <div className="fg">
                      <label htmlFor="mesp-em-n">Emergencia · nombre</label>
                      <input
                        id="mesp-em-n"
                        name="emergencyName"
                        type="text"
                        defaultValue={me.medico?.emergenciaNombre || ""}
                      />
                    </div>
                    <div className="fg">
                      <label htmlFor="mesp-em-r">Relación</label>
                      <input
                        id="mesp-em-r"
                        name="emergencyRelationship"
                        type="text"
                        defaultValue={me.medico?.emergenciaRelacion || ""}
                      />
                    </div>
                  </div>
                  <div className="fg">
                    <label htmlFor="mesp-em-t">Emergencia · teléfono</label>
                    <input
                      id="mesp-em-t"
                      name="emergencyPhone"
                      type="tel"
                      defaultValue={me.medico?.emergenciaTel || ""}
                    />
                  </div>
                  <div className="acts">
                    <button className="btn btn-ghost btn-sm" data-form="f2" type="button">
                      Cancelar
                    </button>
                    <button className="btn btn-orange btn-sm" type="submit">
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Acompañantes */}
          <div className="acc" id="a3">
            <button className="acc-h" data-acc="a3" type="button">
              <span className="l">
                <span className="ti">Tus acompañantes guardados</span>
                <span className="su">Para futuras firmas, sin re-teclear</span>
              </span>
              <span className="chev">▾</span>
            </button>
            <div className="acc-b">
              <div className="acc-in">
                <div className="comps">
                  {me.acompanantes.map((a) => (
                    <div className="comp" key={a.id}>
                      <div className="cn">{a.nombre}</div>
                      {a.linea ? <div className="cm">{a.linea}</div> : null}
                    </div>
                  ))}
                  <button className="comp add" data-form="f3" type="button">
                    + Agregar acompañante
                  </button>
                </div>
                <form className="form" id="f3" action={agregarAcompananteAction}>
                  <div className="f2">
                    <div className="fg">
                      <label htmlFor="mesp-dep-n">Nombre completo</label>
                      <input id="mesp-dep-n" name="fullName" type="text" required />
                    </div>
                    <div className="fg">
                      <label htmlFor="mesp-dep-b">Fecha de nacimiento</label>
                      <input id="mesp-dep-b" name="birthDate" type="date" />
                    </div>
                  </div>
                  <div className="fg">
                    <label htmlFor="mesp-dep-r">Relación</label>
                    <input
                      id="mesp-dep-r"
                      name="relationship"
                      type="text"
                      placeholder="Ej. hija, esposo, amiga…"
                    />
                  </div>
                  <div className="acts">
                    <button className="btn btn-ghost btn-sm" data-form="f3" type="button">
                      Cancelar
                    </button>
                    <button className="btn btn-orange btn-sm" type="submit">
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Firmas */}
          <div className="acc" id="a4">
            <button className="acc-h" data-acc="a4" type="button">
              <span className="l">
                <span className="ti">Tus firmas</span>
                <span className="su">Historial de deslindes · solo lectura</span>
              </span>
              <span className="chev">▾</span>
            </button>
            <div className="acc-b">
              <div className="acc-in">
                {me.firmas.length === 0 ? (
                  <p className="edit-note">Aún no has firmado ningún deslinde.</p>
                ) : (
                  me.firmas.map((f) => (
                    <div className="sig" key={f.id}>
                      <div>
                        <div>{f.titulo}</div>
                        <div className="sm">Firmado el {f.fecha}</div>
                      </div>
                      <div className="rt">
                        <span className="ver">deslinde {f.version}</span>
                        <span className="ok">✓</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <script dangerouslySetInnerHTML={{ __html: TOGGLE_JS }} />
    </div>
  );
}
