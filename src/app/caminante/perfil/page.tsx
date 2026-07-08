// "Mi espacio" — la página personal del caminante (diseño Claude Design jul
// 2026 "completo": CSS scopeado .mesp, server component, acordeones + pops de
// invitar con JS de delegación, forms inline → server actions). Sus próximas
// salidas (con pendientes de pago/deslinde e INVITAR a la gente), experiencias
// vividas, su gente y su expediente.
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { signOut } from "@/lib/auth/actions";
import { fetchMiEspacio } from "@/lib/perfil/queries";
import {
  guardarDatosAction,
  guardarMedicoAction,
  agregarAcompananteAction,
} from "@/lib/perfil/actions";
import { ESPACIO_CSS } from "./ui/espacio-css";
import { CAMINANTE_MARK } from "./ui/logo";

export const dynamic = "force-dynamic";

const SITE = "https://caminante.numanhub.com";
const SANGRES = ["", "O+", "O−", "A+", "A−", "B+", "B−", "AB+", "AB−"];
const wa = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
const inicial = (nombre: string) => (nombre.trim()[0] || "·").toUpperCase();

// Acordeones + pops de invitar + toggle del form de acompañante + copiar/toast.
// Delegación global, sin client components (mismo patrón del dashboard).
const MESP_JS = `
(function(){
  var toast=document.getElementById('mesp-toast'),tt;
  function showToast(){ if(!toast)return; toast.classList.add('show'); clearTimeout(tt); tt=setTimeout(function(){toast.classList.remove('show');},1800); }
  document.addEventListener('click',function(e){
    var cp=e.target.closest('[data-copy]');
    if(cp){ try{navigator.clipboard.writeText(cp.getAttribute('data-copy'));}catch(_){} showToast(); return; }
    var inv=e.target.closest('[data-invite]');
    if(inv){ var el=document.getElementById(inv.getAttribute('data-invite')); if(el) el.classList.toggle('open'); return; }
    var af=e.target.closest('[data-addform]');
    if(af){ var f=document.getElementById(af.getAttribute('data-addform')); if(f) f.classList.toggle('on'); return; }
    var ac=e.target.closest('[data-acc]');
    if(ac){ var a=ac.closest('.mesp-acc'); if(a) a.classList.toggle('open'); return; }
  });
})();
`;

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
  const friendLink = `${SITE}/caminante`;

  return (
    <div className="mesp">
      <style dangerouslySetInnerHTML={{ __html: ESPACIO_CSS }} />

      {/* TOPBAR */}
      <div className="mesp-top">
        <div className="in">
          <a href="/caminante" aria-label="Caminante — inicio" className="mesp-logo" dangerouslySetInnerHTML={{ __html: CAMINANTE_MARK }} />
          <form action={signOut}>
            <button type="submit" className="mesp-out">Salir</button>
          </form>
        </div>
      </div>

      <div className="mesp-wrap">
        {/* HEADER */}
        <header className="mesp-hd">
          <span className="mesp-eyebrow"><span className="sl">{"//"}</span> Tu espacio</span>
          <h1 className="mesp-display">Hola, <em className="mesp-ac">{me.nombre}.</em></h1>
          <p className="sub">Aquí vive todo tu viaje con Caminante.</p>
          {ok ? <div className="mesp-flash ok">Guardado. ✓</div> : null}
          {error ? <div className="mesp-flash err">{error}</div> : null}
        </header>

        {/* PRÓXIMAS SALIDAS */}
        <section className="mesp-sec">
          <span className="mesp-eyebrow"><span className="sl">{"//"}</span> Próximas salidas</span>
          <p className="lead">Lo que sigue en tu camino — y lo que falta para estar listos.</p>

          {me.proximas.length === 0 ? (
            <div className="mesp-empty">
              <h3>Aún no tienes una salida agendada.</h3>
              <p>El paisaje te está esperando.</p>
              <div className="acts">
                <a className="mesp-btn mesp-orange" href="/caminante#proximos">Explorar experiencias</a>
              </div>
            </div>
          ) : (
            me.proximas.map((p, i) => {
              const invId = `mesp-inv-${i}`;
              const waTxt = `Vente conmigo a ${p.titulo} con Caminante 🌿\n${p.invite.link}`;
              return (
                <article className="mesp-trip" key={p.reservaId}>
                  <div className="ph">
                    {p.foto ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.foto} alt={p.titulo} />
                    ) : null}
                  </div>
                  <span className="chip-date">{p.fecha}</span>
                  <div className="pad">
                    {p.lugar ? <span className="eb"><span className="sl">{"//"}</span> {p.lugar}</span> : null}
                    <h3>{p.titulo}</h3>
                    <div className="pax">{p.personasLinea}</div>
                    <div className="st">
                      {p.pago === "pagada" ? (
                        <span className="mesp-stchip st-ok">Pagada <span className="tk">✓</span></span>
                      ) : (
                        <span className="mesp-stchip st-amber"><span className="dot" /> {p.pago === "parcial" ? "Pago parcial" : "Pago pendiente"}</span>
                      )}
                      {p.deslinde === "firmado" ? (
                        <span className="mesp-stchip st-ok">Deslinde firmado <span className="tk">✓</span></span>
                      ) : p.deslinde ? (
                        <span className="mesp-stchip st-warn"><span className="dot" /> Falta tu deslinde</span>
                      ) : null}
                    </div>
                    <div className="acts">
                      {p.pago !== "pagada" ? (
                        <a className="mesp-orange-lg" href={p.pagarUrl}>Completa tu pago →</a>
                      ) : null}
                      {p.deslinde && p.deslinde !== "firmado" ? (
                        <a className="mesp-glassbtn" href={p.deslinde.firmarUrl}>Firma tu deslinde</a>
                      ) : null}
                      <button className="mesp-glassbtn" type="button" data-invite={invId}>Invita a tu gente</button>
                    </div>
                    <div className="mesp-invite" id={invId}>
                      <div className="mesp-invite-in">
                        {p.invite.esPrivada ? (
                          <span className="mesp-priv">● Grupo privado — solo quien tenga el link</span>
                        ) : null}
                        <p className="t">Comparte tu salida para que se sumen — reservan su lugar con este link.</p>
                        {p.invite.cupoLinea ? <p className="mesp-cupo">{p.invite.cupoLinea}</p> : null}
                        <div className="mesp-linkrow">
                          <input type="text" readOnly value={p.invite.link} aria-label="Link para invitar" />
                          <button className="mesp-glassbtn" type="button" data-copy={p.invite.link}>Copiar link</button>
                        </div>
                        <div className="row2">
                          <a className="mesp-glassbtn" href={wa(waTxt)} target="_blank" rel="noopener noreferrer">Compartir por WhatsApp</a>
                          <a className="mesp-glassbtn" href={`/caminante/invitar/${p.slug}?o=v`} target="_blank" rel="noopener noreferrer">Descargar invitación (PDF)</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* TU GENTE */}
        <section className="mesp-sec">
          <span className="mesp-eyebrow"><span className="sl">{"//"}</span> Tu gente</span>
          <p className="lead">Los que caminan contigo. Guárdalos para no volver a teclear sus datos.</p>

          <div className="mesp-invite-friend">
            <div className="l">
              <div className="tt">Invita a un amigo a Caminante</div>
              <div className="dd">Regálale su primer camino — comparte el sitio con tu gente.</div>
            </div>
            <div className="r">
              <button className="mesp-btn mesp-soft mesp-sm" type="button" data-copy={friendLink}>Copiar link</button>
              <a className="mesp-btn mesp-soft mesp-sm" href={wa(`Camina conmigo en Caminante 🌿 ${friendLink}`)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </div>
          </div>

          <div className="mesp-people">
            {me.acompanantes.map((a) => (
              <div className="mesp-person" key={a.id}>
                <span className="mesp-av">{inicial(a.nombre)}</span>
                <div>
                  <div className="nm">{a.nombre}</div>
                  {a.linea ? <div className="mt">{a.linea}</div> : null}
                </div>
              </div>
            ))}
            <button className="mesp-addp" type="button" data-addform="mesp-add">+ Agregar acompañante</button>
          </div>
          <form className="mesp-addform" id="mesp-add" action={agregarAcompananteAction}>
            <div className="mesp-f2">
              <div className="mesp-fg"><label htmlFor="mesp-dep-n">Nombre completo</label><input id="mesp-dep-n" name="fullName" type="text" required /></div>
              <div className="mesp-fg"><label htmlFor="mesp-dep-b">Fecha de nacimiento</label><input id="mesp-dep-b" name="birthDate" type="date" /></div>
            </div>
            <div className="mesp-fg"><label htmlFor="mesp-dep-r">Relación</label><input id="mesp-dep-r" name="relationship" type="text" placeholder="Ej. hija, esposo, amiga…" /></div>
            <div className="mesp-save"><button className="mesp-btn mesp-orange mesp-sm" type="submit">Guardar acompañante</button></div>
          </form>
        </section>

        {/* VIVIDAS */}
        {me.vividas.length > 0 ? (
          <section className="mesp-sec">
            <span className="mesp-eyebrow"><span className="sl">{"//"}</span> Experiencias vividas</span>
            <p className="lead">Tus recuerdos. Los caminos que ya son parte de ti.</p>
            <div className="mesp-album">
              {me.vividas.map((v, i) => (
                <article className="mesp-mem" key={i}>
                  <div className="im">
                    {v.foto ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={v.foto} alt={v.titulo} />
                    ) : null}
                  </div>
                  <div className="body">
                    <div className="nm">{v.titulo}</div>
                    <div className="mt">{v.meta}</div>
                    <div className="foot">
                      {v.encuesta === "hecha" ? (
                        <span className="mesp-seal">Reseña enviada ✓</span>
                      ) : v.encuesta ? (
                        <a className="mesp-btn mesp-orange mesp-sm" href={`/caminante/feedback/${v.encuesta.token}`}>Cuéntanos cómo te fue →</a>
                      ) : (
                        <span className="mesp-seal" style={{ color: "var(--ink-soft)" }}>Un camino vivido</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {/* EXPEDIENTE */}
        <section className="mesp-sec">
          <span className="mesp-eyebrow"><span className="sl">{"//"}</span> Tu expediente</span>
          <p className="lead">Tus datos, tu perfil de seguridad y tus firmas — todo en un solo lugar.</p>

          {/* Datos personales */}
          <div className="mesp-acc">
            <button className="mesp-acc-h" type="button" data-acc="1">
              <span className="l"><span className="ti">Datos personales</span><span className="su">Nombre, contacto y ciudad</span></span>
              <span className="mesp-chev">▾</span>
            </button>
            <div className="mesp-acc-b"><div className="mesp-acc-in">
              <form action={guardarDatosAction}>
                <div className="mesp-fg"><label htmlFor="mesp-nombre">Nombre completo</label><input id="mesp-nombre" name="fullName" type="text" defaultValue={me.datos.nombreCompleto} /></div>
                <div className="mesp-f2">
                  <div className="mesp-fg"><label htmlFor="mesp-cor">Correo</label><input id="mesp-cor" type="email" defaultValue={me.datos.email} disabled /></div>
                  <div className="mesp-fg"><label htmlFor="mesp-wa">WhatsApp</label><input id="mesp-wa" name="phone" type="tel" defaultValue={me.datos.whatsapp} /></div>
                </div>
                <div className="mesp-f2">
                  <div className="mesp-fg"><label htmlFor="mesp-ciudad">Ciudad</label><input id="mesp-ciudad" name="city" type="text" defaultValue={me.datos.ciudad} /></div>
                  <div className="mesp-fg"><label htmlFor="mesp-nac">Fecha de nacimiento</label><input id="mesp-nac" name="birthDate" type="date" defaultValue={me.datos.nacimiento} /></div>
                </div>
                <label className="mesp-toggle">
                  <span className="tl">Quiero recibir noticias de Caminante</span>
                  <input type="checkbox" name="mailingOptIn" defaultChecked={me.datos.mailingOptIn} />
                  <span className="mesp-sw" />
                </label>
                <div className="mesp-save"><button className="mesp-btn mesp-orange mesp-sm" type="submit">Guardar cambios</button></div>
              </form>
            </div></div>
          </div>

          {/* Perfil médico */}
          <div className="mesp-acc">
            <button className="mesp-acc-h" type="button" data-acc="2">
              <span className="l"><span className="ti">Perfil médico y de seguridad</span><span className="su">Opcional · nos ayuda a cuidarte mejor</span></span>
              <span className="mesp-chev">▾</span>
            </button>
            <div className="mesp-acc-b"><div className="mesp-acc-in">
              <form action={guardarMedicoAction}>
                <div className="mesp-f2">
                  <div className="mesp-fg"><label htmlFor="mesp-sangre">Tipo de sangre</label>
                    <select id="mesp-sangre" name="bloodType" defaultValue={me.medico?.sangre || ""}>
                      {SANGRES.map((s) => <option key={s || "x"} value={s}>{s || "—"}</option>)}
                    </select>
                  </div>
                  <div className="mesp-fg"><label htmlFor="mesp-dieta">Dieta</label><input id="mesp-dieta" name="dietaryRestrictions" type="text" defaultValue={me.medico?.dieta || ""} placeholder="Ej. vegetariana, sin gluten…" /></div>
                </div>
                <div className="mesp-fg"><label htmlFor="mesp-alergias">Alergias</label><textarea id="mesp-alergias" name="allergies" defaultValue={me.medico?.alergias || ""} placeholder="Ej. penicilina, mariscos…" /></div>
                <div className="mesp-fg"><label htmlFor="mesp-cond">Condiciones</label><textarea id="mesp-cond" name="conditions" defaultValue={me.medico?.condiciones || ""} placeholder="Ej. asma, hipertensión…" /></div>
                <div className="mesp-fg"><label htmlFor="mesp-meds">Medicamentos de uso periódico</label><textarea id="mesp-meds" name="medications" defaultValue={me.medico?.medicamentos || ""} placeholder="Ej. levotiroxina, diario" /></div>
                <div className="mesp-sub-eb">Contacto de emergencia</div>
                <div className="mesp-f2">
                  <div className="mesp-fg"><label htmlFor="mesp-em-n">Nombre</label><input id="mesp-em-n" name="emergencyName" type="text" defaultValue={me.medico?.emergenciaNombre || ""} /></div>
                  <div className="mesp-fg"><label htmlFor="mesp-em-r">Parentesco</label><input id="mesp-em-r" name="emergencyRelationship" type="text" defaultValue={me.medico?.emergenciaRelacion || ""} /></div>
                </div>
                <div className="mesp-fg"><label htmlFor="mesp-em-t">Teléfono</label><input id="mesp-em-t" name="emergencyPhone" type="tel" defaultValue={me.medico?.emergenciaTel || ""} /></div>
                <p className="mesp-note">Solo lo vemos tus guías; nunca se comparte.</p>
                <div className="mesp-save"><button className="mesp-btn mesp-orange mesp-sm" type="submit">Guardar cambios</button></div>
              </form>
            </div></div>
          </div>

          {/* Deslindes firmados */}
          <div className="mesp-acc">
            <button className="mesp-acc-h" type="button" data-acc="3">
              <span className="l"><span className="ti">Mis deslindes firmados</span><span className="su">Historial · solo lectura</span></span>
              <span className="mesp-chev">▾</span>
            </button>
            <div className="mesp-acc-b"><div className="mesp-acc-in">
              {me.firmas.length === 0 ? (
                <p className="mesp-note">Aún no has firmado ningún deslinde.</p>
              ) : (
                me.firmas.map((f) => (
                  <div className="mesp-sig" key={f.id}>
                    <div><div className="tt">{f.titulo}</div><div className="mt">Firmado el {f.fecha}</div></div>
                    <div className="r">
                      <span className="mesp-ver">{f.version}</span>
                      {f.docUrl ? <a href={f.docUrl} target="_blank" rel="noopener noreferrer">Ver documento</a> : <span className="mesp-seal">✓</span>}
                    </div>
                  </div>
                ))
              )}
            </div></div>
          </div>
        </section>
      </div>

      <div className="mesp-toast" id="mesp-toast">✓ Copiado</div>
      <script dangerouslySetInnerHTML={{ __html: MESP_JS }} />
    </div>
  );
}
