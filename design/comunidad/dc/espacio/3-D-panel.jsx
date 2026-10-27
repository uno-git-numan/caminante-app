/* El espacio del grupo · D · el panel, y el recibo */
const Grip=()=> <span className="cmgrip"><i></i><i></i><i></i></span>;
const Cmc=({av,n,sm,age,tags,next,picked,children})=> <div className={'cmc'+(picked?' picked':'')}><div className="hd"><Grip/><span className="av">{av}</span><span className="nm"><b>{n}</b><small>{sm} · <span className="sal">Nov 28–29</span></small></span>{age&&<span className="age">{age}</span>}</div>
  {tags&&<div className="met">{tags.map(t=> <span key={t} className="cmtag">{t}</span>)}</div>}<p className="cmnext"><s>→</s><span>{next}</span></p>{children}</div>;

const ENTRO=[['MC','Miranda Castillo','Anfitriona','Pagó · firmó'],['RB','Regina Bueno','Pagó 3 lugares','Pagó · firmó'],['SR','Sofía Ruiz','Pagado por Regina',null,'Falta firmar'],['DM','Daniel Mora','Pagado por Regina',null,'Falta firmar'],['CE','Carla Estrada','Entró el 22 oct',null,'Falta pagar'],['XV','Ximena del Valle','Entró el 24 oct',null,'Falta pagar']];
function SuEspacio({abrir}){
  const [ok,setOk]=useState(false);
  return <>
    <p className="xh4">Su espacio</p>
    <div className="salfoot" style={{marginTop:0,paddingTop:0,borderTop:0}}><div className="sallk"><span>{LIGA}</span><button className="btn btn-ghost btn-sm" onClick={()=>setOk(true)}>{ok?'Copiada':'Copiar'}</button></div>{abrir&&<button className="btn btn-ghost btn-sm">Abrir el espacio como lo ve el grupo</button>}</div>
    <dl className="dl" style={{marginTop:12}}><dt>Anfitriona</dt><dd>Miranda Castillo</dd><dt>Pidió la fecha</dt><dd>20 de octubre</dd><dt>Lugares</dt><dd>4 de 10 apartados</dd></dl>
    <div className="mini-form"><input type="date" defaultValue="2026-11-14" aria-label="Fecha límite"/><input type="number" defaultValue="6" min="1" max="10" aria-label="Mínimo" style={{width:76}}/><button className="btn btn-ghost btn-sm">Guardar</button><span className="mut" style={{fontSize:12}}>Fecha límite · mínimo de lugares</span></div>
    <p className="xh4">Quién entró · {ENTRO.length}</p>
    {ENTRO.map(([a,n,sm,ok2,pend])=> <div key={a} className="salper"><span className="av">{a}</span><span className="nm">{n}<small>{sm}</small></span><span className="rt">{pend?<span className="st">{pend}</span>:<span className="mut" style={{fontSize:12}}>{ok2}</span>}</span></div>)}
  </>;
}

function LamD(){
  return <Lam id="d" k="D" title={<>Lo que cambia <em>en el panel.</em></>} desc="Tres piezas, nada más: la tarjeta del grupo en el CRM, el bloque «Su espacio» en el panel lateral, y el mismo bloque en la cápsula de la salida.">
    <div className="pnl esp-pieces">
      <div>
        <div className="vtag"><b>D1 · La tarjeta del grupo</b><span>La de Miranda se vuelve tarjeta de grupo. Cada invitado que entra es su propia tarjeta, directo en «Interesado».</span></div>
        <div className="cmboard"><div className="cmtrack">
          <div className="cmcol"><div className="cmcol-hd"><span className="no">03</span><h3>Interesado</h3><span className="ct">3</span><span className="how">Se arrastra</span></div><div className="cmcol-bd">
            <Cmc picked av="MC" n="Miranda Castillo" sm="Ascenso al Iztaccíhuatl" age="6 días" tags={['Anfitriona','Salida privada']} next={<><b>6</b> entraron · <b>2</b> pagaron</>}><div className="prog" style={{marginTop:10}}><div className="tk2"><i style={{width:'40%'}}></i></div><span className="fr">4/10 lugares</span></div></Cmc>
            <Cmc av="CE" n="Carla Estrada" sm="Grupo de Miranda" age="4 días" tags={['Grupo de Miranda']} next={<>Falta pagar <b>$14.000</b> · antes del <b>14 nov</b></>}/>
            <Cmc av="XV" n="Ximena del Valle" sm="Grupo de Miranda" age="2 días" tags={['Grupo de Miranda']} next={<>Falta pagar <b>$14.000</b> · antes del <b>14 nov</b></>}/>
          </div></div>
          <div className="cmcol recv"><div className="cmcol-hd"><span className="no">04</span><h3>Pagado</h3><span className="ct">3</span><span className="how auto">Cae solo con el pago</span></div><div className="cmcol-bd">
            <Cmc av="RB" n="Regina Bueno" sm="Grupo de Miranda" tags={['Grupo de Miranda','3 lugares']} next={<>Pagó por ella, Sofía y Daniel</>}/>
            <Cmc av="SR" n="Sofía Ruiz" sm="Grupo de Miranda" tags={['Pagado por Regina']} next={<>Falta firmar el deslinde</>}/>
            <Cmc av="DM" n="Daniel Mora" sm="Grupo de Miranda" tags={['Pagado por Regina']} next={<>Falta firmar el deslinde</>}/>
          </div></div>
        </div></div>
      </div>
      <div className="esp-two">
        <div>
          <div className="vtag"><b>D2 · Panel lateral</b><span>El bloque nuevo, debajo de lo que ya tenía.</span></div>
          <aside className="cmpanel wide">
            <div className="cmpanel-hd"><span className="av">MC</span><span className="g"><b>Miranda Castillo</b><small>Ascenso al Iztaccíhuatl · <span className="sal">Nov 28–29</span> · 10 lugares</small></span><button className="x" aria-label="Cerrar">×</button></div>
            <div className="cmpanel-st"><span className="n">03</span>Interesado<span className="mv">Se arrastra a mano</span></div>
            <div className="cmpanel-bd">
              <div className="met" style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:6}}><span className="cmtag">Anfitriona</span><span className="cmtag">Salida privada</span><span className="cmtag">Pidió el <span className="k">20 oct</span></span></div>
              <SuEspacio/>
            </div>
          </aside>
        </div>
        <div>
          <div className="vtag"><b>D3 · Cápsula de la salida</b><span>El mismo bloque debajo del roster, con la puerta al espacio.</span></div>
          <article className="card salcard">
            <div className="pad">
              <div className="saltop"><div className="g"><h3>Ascenso al Iztaccíhuatl</h3><p className="meta">Nov 28–29 · Salida privada · Grupo de Miranda · operada por Caminante</p></div><span className="salwhen">En 33 días</span></div>
              <div className="salbars"><div className="progrow"><span className="mut">Lugares</span><div className="prog"><div className="tk2"><i style={{width:'40%'}}></i></div><span className="fr">4/10</span></div></div><div className="progrow"><span className="mut">Deslindes</span><div className="prog warn"><div className="tk2"><i style={{width:'50%'}}></i></div><span className="fr">2/4</span></div></div></div>
              <p className="xh4" style={{marginTop:18}}>Roster</p>
              <div className="salper"><span className="av">MC</span><span className="nm">Miranda Castillo<small>miranda@correo.mx · +52 55 3310 2280</small></span><span className="rt"><span className="mut" style={{fontSize:12}}>Firmó</span></span></div>
              <div className="salper"><span className="av">RB</span><span className="nm">Regina Bueno<small>regina@correo.mx · +52 55 7702 4419</small></span><span className="rt"><span className="mut" style={{fontSize:12}}>Firmó</span></span></div>
              <div className="salper"><span className="av">SR</span><span className="nm">Sofía Ruiz<small>sofia@correo.mx · +52 55 1180 6623</small></span><span className="rt"><span className="st">Pendiente</span><button className="btn btn-glass btn-sm">Recordar</button></span></div>
              <div className="salper"><span className="av">DM</span><span className="nm">Daniel Mora<small>daniel@correo.mx · +52 55 9043 3071</small></span><span className="rt"><span className="st">Pendiente</span><button className="btn btn-glass btn-sm">Recordar</button></span></div>
              <SuEspacio abrir/>
            </div>
          </article>
        </div>
      </div>
    </div></Lam>;
}

const RECIBO=[
 ['Caminante Sitio Público App',[['.pub-app .pub-scroll .pub-head .brand .hbtn','El marco del teléfono y la cabecera flotante.'],['.pub-hero .veil .inner .meta · .pub-eyebrow .pub-chip','Las portadas y el chip «Salida privada».'],['.pub-sec .pub-display · .pub-ficha · .pub-it · .pub-inc','Secciones, el viaje en acordeones, el itinerario y «Lo que viene».'],['.pub-cta (-orange -ghost -forest -sm) · .pub-buybar · .pub-acts','Botones y la barra de apartar.'],['.pub-fld · .pub-nav · .pub-sel · .pub-guide · .pub-gal','Formulario de cuenta, regreso, elegir a quién cubrir, contacto de Luis y fotos del recuerdo.']]],
 ['Mi espacio',[['.mesp-trip .ph .chip-date .eb .pax .st .acts','La tarjeta de «Tu lugar».'],['.mesp-stchip .st-ok .st-warn .st-amber','Los chips de pago y deslinde.'],['.mesp-invite .mesp-invite-in .mesp-priv .mesp-linkrow .mesp-cupo','«Invitar a mi grupo», dentro de la tarjeta, como en Mi espacio.'],['.mesp-people .mesp-person .mesp-av .mesp-addp','«Quién va».'],['.mesp-acc .mesp-acc-h .mesp-chev .mesp-acc-b','«Pagar por alguien más».'],['.mesp-glassbtn .mesp-orange-lg','Copiar y Apartar dentro de la tarjeta.']]],
 ['Comunidad y Salidas',[['.cmboard .cmtrack .cmcol .cmcol-hd .cmcol-bd .cmc .cmgrip .cmtag .cmnext','La tarjeta de grupo y las de los invitados.'],['.prog .tk2 .fr · .progrow · .salbars','Las barras de lugares y deslindes.'],['.cmpanel.wide .cmpanel-hd .cmpanel-st .cmpanel-bd','El panel lateral.'],['.sallk .salfoot .salper .dl .mini-form .xh4 .vtag','El bloque «Su espacio» se arma sólo con esto.'],['.card.salcard .saltop .salwhen','La cápsula de la salida.']]],
 ['Clases nuevas',[['.esp-frame (.desk) · .esp-phone (.long .mini) · .esp-fig .esp-cap','El marco: teléfono o escritorio a 1280. Sólo para la lámina.'],['.esp-body .esp-main .esp-side · .esp-donly .esp-monly','La disposición: una columna en teléfono; dos columnas y tarjeta pegajosa en escritorio. Lo que sólo se ve en uno u otro.'],['.esp-dtop','La barra superior de escritorio (logo, Experiencias, Aprende, Mi espacio, Salir), como en Mi espacio v2.'],['.esp-c1 .esp-right','La portada de invitación: foto a media pantalla en escritorio.'],['.esp-auth .esp-authwrap','La tarjeta angosta de 440 para crear cuenta y el código.'],['.esp-count','El contador «4 de 10» con su barra y la fecha límite.'],['.esp-steps','Entré → pagué → firmé, sobre la foto.'],['.esp-who .esp-st .esp-host','Una fila por persona, su chip de estado y la etiqueta de anfitriona.'],['.esp-price','Precio fijo o del cotizador, con su «i».'],['.esp-wa .esp-wa-hd .esp-bub .esp-lnk','El chat de WhatsApp de A y C4.'],['.esp-mail .esp-mailhd','El correo de escritorio: el marco de caminante-emails/signup.html (600 de ancho, banda verde, botón naranja, pie gris) pasado a clases.'],['.esp-code .esp-or','Las seis casillas del código y el separador de Apple/Google.'],['.esp-lam .esp-row (.minis .sides) .esp-pieces .esp-two .esp-recibo','La lámina.']]],
 ['Notas',[['Una sola query en 699','Teléfono y escritorio salen del mismo marcado. En el sitio el corte es @media (min-width:700px); en esta lámina, para ver las dos a la vez, el mismo bloque de reglas va en @container esp (min-width:700px). Es la misma regla, con otro sujeto.'],['Escritorio a escala','Los marcos de 1280 se muestran al 60 % para caber en la lámina. Las medidas internas son las reales.'],['Secciones que no cambian','«El grupo de WhatsApp» y el pie de la operadora se ven cortos en la columna izquierda de escritorio; no los rellené. Si quieres, el pie puede pasar a la tarjeta pegajosa.'],['Lo que no es del sitio','La barra superior de escritorio y los enlaces Experiencias / Aprende / Mi espacio salen de Mi espacio v2. No dibujé el menú ni el pie del sitio público.']]]];
function Recibo(){
  return <Lam id="recibo" k="Recibo" title={<>Qué se reusó <em>y qué es nuevo.</em></>} desc="Los estilos del panel y de Mi espacio se copiaron tal cual y se acotaron a su contenedor (.pnl y .mesp) para que no choquen con el sitio público.">
    <div className="pnl"><div className="esp-recibo">{RECIBO.map(([t,L])=> <div key={t} className="card"><p className="xh4">{t}</p>{L.map(([c,x])=> <div key={c} className="rr"><code>{c}</code><span>{x}</span></div>)}</div>)}</div></div></Lam>;
}

function App(){
  return <div className="esp-wrap">
    <header className="esp-intro"><Eb>Salida privada · Nov 28–29</Eb><h1 className="pub-display">El espacio <em>del grupo.</em></h1><p>La liga de una salida privada lleva a un espacio del grupo: la anfitriona ve su viaje, invita y ve quién entra y quién paga; cada invitado entra con su cuenta, aparta su lugar y firma. Cada pantalla de A a C va en teléfono y en escritorio, del mismo marcado; D sólo en escritorio.</p>
      <nav className="esp-idx">{[['a','A'],['b','B'],['b-estados','B-estados'],['b-precio','B-precio'],['c1','C1'],['c2','C2'],['c3','C3'],['c4','C4'],['d','D'],['recibo','Recibo']].map(([h,l])=> <a key={h} href={'#'+h}>{l}</a>)}</nav></header>
    <LamA/><LamB/><LamBEst/><LamBPrecio/><LamC1/><LamC2/><LamC3/><LamC4/><LamD/><Recibo/>
  </div>;
}
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
