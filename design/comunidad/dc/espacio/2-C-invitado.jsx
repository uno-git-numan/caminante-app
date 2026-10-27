/* El espacio del grupo · C · lo que ve un invitado · el mismo marcado para teléfono y escritorio */
function Portada(){
  return <><Head/><div className="esp-c1">
    <Hero h={560} chips={<Priv/>} eb={<Eb neg>Miranda te invita</Eb>} title={TITLE} meta="28–29 nov · Sierra Nevada"/>
    <div className="esp-right">
      <div className="esp-donly"><Eb>Salida privada · 28–29 nov</Eb><h1>Miranda te invita al <em>Ascenso al Iztaccíhuatl.</em></h1></div>
      <Count/>
      <Price/>
      <div className="pub-sec" style={{paddingTop:14}}>
        <button className="pub-cta pub-cta-orange">Entrar al grupo</button>
        <p style={{fontSize:13,color:'var(--ink-soft)',lineHeight:1.5,marginTop:12}}>Vas a crear tu cuenta Caminante (celular y correo). El deslinde lo llenas antes de salir.</p>
      </div>
    </div></div></>;
}
function LamC1(){
  return <Lam id="c1" k="C1" title={<>Miranda <em>te invita.</em></>} desc="Antes de entrar: la foto, quién invita, cuántos lugares van y cuánto cuesta. Un solo botón. En escritorio, la foto a media pantalla a la izquierda y lo demás a la derecha.">
    <div className="esp-row"><Phone capt="C1 · Teléfono" cap="Lo que abre cualquiera que reciba la liga, con o sin cuenta."><Portada/></Phone>
    <Phone desk capt="C1 · Escritorio · 1280" cap="Nada más que esto."><Portada/></Phone></div></Lam>;
}

const Nav=({t})=> <div className="pub-nav"><span className="bk">‹</span><span className="tt"><b>{t}</b><small>Grupo de Miranda · Nov 28–29</small></span></div>;
const Cuenta=()=> <div className="esp-authwrap"><Nav t="Entrar al grupo"/><div className="esp-auth">
  <div className="pub-sec" style={{paddingTop:22}}>
    <h2 style={{marginTop:0}}>Tu cuenta <em>Caminante.</em></h2>
    <div style={{display:'flex',flexDirection:'column',gap:10}}><button className="pub-cta pub-cta-forest">Continuar con Apple</button><button className="pub-cta pub-cta-ghost">Continuar con Google</button></div>
    <div className="esp-or">o con tus datos</div>
    <div className="pub-fld"><label>Nombre</label><input defaultValue="Carla Estrada"/></div>
    <div className="pub-fld"><label>Celular</label><input defaultValue="+52 55 4821 1234" inputMode="tel"/><span className="hint">Obligatorio. Por aquí te llegan los avisos del viaje.</span></div>
    <div className="pub-fld"><label>Correo</label><input defaultValue="carla@correo.mx" inputMode="email"/></div>
    <button className="pub-cta pub-cta-orange" style={{marginTop:10}}>Entrar</button>
    <button className="pub-cta pub-cta-ghost" style={{width:'100%',marginTop:10}}>Ya tengo cuenta · entrar</button>
  </div></div></div>;
const Codigo=()=> <div className="esp-authwrap"><Nav t="Verifica tu celular"/><div className="esp-auth">
  <div className="pub-sec" style={{paddingTop:22}}>
    <h2 style={{marginTop:0}}>Te mandamos <em>un código.</em></h2>
    <p>Te mandamos un código por WhatsApp al <b>+52 55 ••• 1234</b>.</p>
    <div className="esp-code">{['4','8','1','','',''].map((d,i)=> <span key={i} className={i===3?'on':''}>{d}</span>)}</div>
    <p style={{fontSize:13.5,color:'var(--ink-soft)'}}>Puedes pedir otro en 0:42.</p>
    <button className="pub-cta pub-cta-orange" style={{marginTop:22}} disabled>Verificar</button>
    <button className="pub-cta pub-cta-ghost" style={{width:'100%',marginTop:10}}>Cambiar el número</button>
  </div></div></div>;
function LamC2(){
  return <Lam id="c2" k="C2" title={<>Crear cuenta, <em>un paso.</em></>} desc="Apple o Google llenan nombre y correo. El celular es obligatorio y se verifica con un código por WhatsApp. En escritorio es una tarjeta angosta centrada; el código le llega igual al celular.">
    <div className="esp-row">
      <Phone capt="C2 · Crear cuenta" cap="Si ya viajó con Caminante, «Ya tengo cuenta» lo lleva directo al grupo."><Cuenta/></Phone>
      <Phone capt="C2 · El código" cap="Seis casillas. El código llega por WhatsApp; si no llega, por SMS."><Codigo/></Phone>
    </div>
    <div className="esp-row" style={{marginTop:36}}>
      <Phone desk capt="C2 · Escritorio · 1280" cap="Una tarjeta de 440 centrada, con Apple y Google arriba y el formulario corto debajo."><Cuenta/></Phone>
      <Phone desk capt="C2 · El código · Escritorio" cap="La misma tarjeta. El invitado está en la computadora y el código le llega al celular."><Codigo/></Phone>
    </div></Lam>;
}

const BuyBar=({full})=> <div className="pub-buybar">{full?<button className="pub-cta pub-cta-forest" style={{flex:1}}>Cupo lleno · avísame si se abre un lugar</button>:<><div className="p"><b>$14.000</b><small>Quedan 6 · antes del 14 nov</small></div><button className="pub-cta pub-cta-orange">Apartar mi lugar</button></>}</div>;
const guestCount=({full,feo})=>full?<Count n={10} tone="full" lim="Cupo lleno" left="Lista de espera abierta"/>:feo?<Count tone="warn" left="Faltan 3 días" lim="Aparta antes del 14 de noviembre"/>:<Count/>;
const guestCta=({full})=>full?<button className="pub-cta pub-cta-forest">Cupo lleno · avísame si se abre un lugar</button>:<button className="pub-cta pub-cta-orange">Apartar mi lugar · $14.000</button>;
function EspacioInvitado({full,feo}){
  return <><DTop/><Head/>
    <div className="esp-body">
      <Hero chips={<><Priv/>{full&&<span className="pub-chip">Cupo lleno</span>}</>} eb={HERO_EB} title={TITLE}/>
      <Side count={guestCount({full,feo})} price={<Price/>} cta={guestCta({full})} note={full?'Entraste. Si alguien libera su lugar, te avisamos por WhatsApp.':'Entraste. Tu lugar queda apartado al pagar; el deslinde se firma después.'}/>
      <div className="esp-main">
        <Sec eb="Tu lugar" title={full?<>Te avisamos <em>si se abre.</em></>:<>Falta <em>apartarlo.</em></>}>
          <TripCard who="Carla Estrada" sub={full?'Entraste · el cupo se llenó':'Entraste · tu lugar no está apartado'} at={1} chips={full?<span className="mesp-stchip st-amber"><span className="dot"></span>Lista de espera</span>:<><span className="mesp-stchip st-warn"><span className="dot"></span>{feo?'Faltan 3 días para apartar':'Falta pagar'}</span><span className="mesp-stchip st-amber"><span className="dot"></span>Deslinde después</span></>}>
            <div className="acts esp-monly">{full?<button className="mesp-glassbtn" style={{width:'100%'}}>Avísame si se abre un lugar</button>:<button className="mesp-orange-lg" style={{width:'100%',justifyContent:'center',minHeight:52,fontSize:15.5}}>Apartar mi lugar · $14.000</button>}</div>
          </TripCard>
        </Sec>
        <Sec eb="Quién va"><Who me="CE"/></Sec>
        {!full&&<><Sec eb="El viaje"><Viaje/></Sec><Sec eb="Lo que viene"><Viene/></Sec><Sec eb="El grupo"><Grupo/></Sec><Sec eb="Tu operadora"><Pie/></Sec></>}
      </div>
    </div></>;
}

function LamC3(){
  return <Lam id="c3" k="C3" title={<>El espacio, <em>como lo ve Carla.</em></>} desc="Lo mismo que ve Miranda, sin «Invitar» ni «Pagar por alguien más». Su tarjeta va arriba y el botón de apartar es lo más visible: en el teléfono, en la tarjeta y en la barra de abajo que no se va; en escritorio, en la tarjeta pegajosa.">
    <div className="esp-row">
      <Phone long capt="C3 · Teléfono" cap="La barra dice cuántos lugares quedan y la fecha límite sin tener que buscarla." buy={<BuyBar/>}><EspacioInvitado/></Phone>
      <Phone desk capt="C3 · Escritorio · 1280" cap="La tarjeta pegajosa lleva contador, fecha límite, precio y el botón de apartar."><EspacioInvitado/></Phone>
    </div></Lam>;
}

function LamC4(){
  return <Lam id="c4" k="C4" title={<>Faltan tres días, <em>y el cupo lleno.</em></>} desc="El estado feo: Carla entró, no ha pagado y faltan 3 días para la fecha límite. Y el caso de quien llega cuando ya no hay lugar. En escritorio cambia sólo la tarjeta pegajosa.">
    <div className="esp-row">
      <Phone capt="C4 · El recordatorio" cap="Le llega a ella directo, por WhatsApp y correo. No depende del grupo."><div className="esp-wa"><WaHd/><div className="esp-wa-bd">
        <span className="esp-wa-day">Martes 11 nov</span>
        <div className="esp-bub">
          <p>Hola, Carla. Faltan 3 días para apartar tu lugar en el <b>Ascenso al Iztaccíhuatl</b> con el grupo de Miranda.</p>
          <p>Van 4 de 10 lugares. La lista se cierra el viernes 14 de noviembre.</p>
          <p>Aparta aquí: <a>{LIGA}</a></p>
          <span className="tm">9:00</span>
          <span className="cta">Apartar mi lugar</span>
        </div>
      </div></div></Phone>
      <Phone capt="C4 · Su tarjeta a 3 días" cap="El contador y el chip pasan a naranja. El botón no cambia." buy={<BuyBar/>}><EspacioInvitado feo/></Phone>
      <Phone capt="C4 · Cupo lleno" cap="Ve el grupo igual. El único botón la apunta a la lista de espera." buy={<BuyBar full/>}><EspacioInvitado full/></Phone>
    </div>
    <div className="esp-row sides" style={{marginTop:36}}>
      <figure className="esp-fig"><Side count={guestCount({feo:1})} price={<Price/>} cta={guestCta({})} note="Entraste. Tu lugar queda apartado al pagar."/><figcaption className="esp-cap"><b>A 3 días · Escritorio</b>La fecha límite en naranja. El botón no cambia.</figcaption></figure>
      <figure className="esp-fig"><Side count={guestCount({full:1})} price={<Price/>} cta={guestCta({full:1})} note="Entraste. Si alguien libera su lugar, te avisamos por WhatsApp."/><figcaption className="esp-cap"><b>Cupo lleno · Escritorio</b>Lista de espera.</figcaption></figure>
    </div></Lam>;
}
Object.assign(window,{LamC1,LamC2,LamC3,LamC4});
