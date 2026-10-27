/* El espacio del grupo · piezas compartidas, A y B · el mismo marcado para teléfono y escritorio */
const {useState}=React;
const IMG={hero:'assets/img/hero-edomex.jpg',trip:'assets/img/bosque-niebla.jpg',g1:'assets/img/caminata-bosque.jpg',g2:'assets/img/camp-people.jpg',g3:'assets/img/tents-sunset.jpg',g4:'assets/img/stars.jpg',logo:'assets/logos/caminante-logo-white.png',logoc:'assets/logos/caminante-logo-color.png',mark:'assets/logos/caminante-mark-color.png'};
const LIGA='caminante.numanhub.com/g/izta-miranda';
const Eb=({neg,children})=> <span className={'pub-eyebrow'+(neg?' neg':'')}><span className="sl">//</span> {children}</span>;
const Lam=({id,k,title,children,desc})=> <section className="esp-lam" id={id} data-screen-label={k}><div className="esp-lamhd"><span className="k">{k}</span><h2>{title}</h2><p>{desc}</p></div>{children}</section>;
/* un marco: phone (fijo), long (a lo largo), mini (chico) o desk (1280). El contenido es el mismo; la container query decide. */
const Phone=({long,mini,desk,children,cap,capt,buy})=> <figure className={'esp-fig'+(desk?' desk':'')}><div className={'esp-frame'+(desk?' desk':'')}><div className={'pub-app mesp esp-phone'+(long?' long':'')+(mini?' mini':'')}><div className="pub-scroll">{children}</div>{buy}</div></div>{(cap||capt)&&<figcaption className="esp-cap">{capt&&<b>{capt}</b>}{cap}</figcaption>}</figure>;
const Menu=()=> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
const Head=({oncream})=> <div className={'pub-head'+(oncream?' oncream':'')}><button className="brand"><img className="lockup" src={oncream?IMG.logoc:IMG.logo} alt="Caminante"/></button><button className="hbtn r" aria-label="Menú"><Menu/></button></div>;
const Hero=({img=IMG.hero,h=440,chips,eb,title,meta,children})=> <div className="pub-hero" style={{minHeight:h}}><div className="ph"><img src={img} alt="Iztaccíhuatl"/></div><div className="veil"></div><div className="inner" style={{paddingBottom:40}}>{chips&&<div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{chips}</div>}{eb}<h1>{title}</h1>{meta&&<span className="meta">{meta}</span>}{children}</div></div>;
const TITLE=<>Ascenso al <em>Iztaccíhuatl.</em></>;
const Priv=()=> <span className="pub-chip"><span className="cd"></span>Salida privada</span>;
const Count=({n=4,of=10,lim='Aparta antes del 14 de noviembre',left='Faltan 19 días',tone,note})=> <div className={'esp-count'+(tone?' '+tone:'')}><div className="nm"><b>{n}</b><span>de {of} lugares apartados</span></div><div className="bar"><i style={{width:n/of*100+'%'}}></i></div><div className="lim"><span>{lim}</span>{left&&<em>{left}</em>}</div>{note&&<p className="note">{note}</p>}</div>;
const Price=({variable,ex,setEx})=> <div className="esp-price">{variable?<><div><b>$12.800</b> <span className="q">por persona si van 10</span></div><div className="why"><button onClick={()=>setEx&&setEx(!ex)} aria-label="Por qué cambia">i</button>Cambia si cambia el grupo</div>{ex&&<p className="exp">El guía, el transporte y el albergue se reparten entre quienes van. Con más personas baja, con menos sube.</p>}</>:<div><b>$14.000</b> <span className="q">por persona</span></div>}</div>;
/* la tarjeta lateral: en teléfono sólo el contador; en escritorio también precio, botón e invitación (pegajosa) */
const Side=({count,price,cta,note,invite})=> <aside className="esp-side">{count}<div className="esp-donly">{price}{cta}{note&&<p className="esp-sidenote">{note}</p>}{invite}</div></aside>;
const Steps=({at})=> <ol className="esp-steps">{['Entré','Pagué','Firmé'].map((s,i)=> <li key={s} className={i<at?'ok':i===at?'now':''}><i>{i<at?'✓':i+1}</i>{s}</li>)}</ol>;
const ST={entro:'Entró',pago:'Pagó',firmo:'Firmó'};
const St=({s})=> <span className={'esp-st '+s}>{ST[s]}</span>;
const GENTE=[
  {i:'MC',n:'Miranda Castillo',s:'firmo',host:1,mt:'Pagó y firmó'},
  {i:'RB',n:'Regina Bueno',s:'firmo',mt:'Pagó 3 lugares',cov:[{i:'SR',n:'Sofía Ruiz',s:'pago'},{i:'DM',n:'Daniel Mora',s:'pago'}]},
  {i:'CE',n:'Carla Estrada',s:'entro',mt:'Falta apartar'},
  {i:'XV',n:'Ximena del Valle',s:'entro',mt:'Falta apartar'}];
const Who=({host,me})=> <div className="mesp-people esp-who">
  {GENTE.map(p=> <React.Fragment key={p.i}>
    <div className="mesp-person"><span className="mesp-av">{p.i}</span><div className="g"><div className="nm">{p.n}{p.i===me?' · tú':''}{p.host&&<span className="esp-host">Anfitriona</span>}</div><div className="mt">{p.mt}</div></div><St s={p.s}/></div>
    {p.cov&&p.cov.map(c=> <div key={c.i} className="mesp-person cov"><span className="mesp-av">{c.i}</span><div className="g"><div className="nm">{c.n}</div><div className="mt">Pagado por Regina · falta firmar</div></div><St s={c.s}/></div>)}
  </React.Fragment>)}
  {host&&<button className="mesp-addp" style={{width:'100%',justifyContent:'center'}}>Quedan 6 lugares · invitar a alguien más</button>}
</div>;
const Viaje=()=> <div className="pub-ficha">
  <details><summary><b>Itinerario<i>Dos días, una noche en el albergue</i></b><span className="x">+</span></summary><div className="body"><div className="pub-it" style={{margin:'4px 0 0'}}>
    <div className="step"><span className="h">Sáb 28 · 6:00</span><b>Salida de la Ciudad de México</b><p>Rumbo a Paso de Cortés. Aclimatación y caminata a La Joya.</p></div>
    <div className="step"><span className="h">Sáb 28 · tarde</span><b>Subida al albergue</b><p>Cena temprano y a dormir.</p></div>
    <div className="step hi"><span className="h">Dom 29 · 2:00</span><b>Ascenso a la cumbre</b><p>El Pecho, 5.220 m. Regreso al mediodía.</p></div></div></div></details>
  <details><summary><b>Qué incluye<i>Guía, transporte y albergue</i></b><span className="x">+</span></summary><div className="body">Guía de alta montaña certificado, transporte redondo desde la Ciudad de México, una noche en el albergue, cuota del parque y equipo técnico de grupo.</div></details>
  <details><summary><b>La mochila<i>Lo que llevas tú</i></b><span className="x">+</span></summary><div className="body">Botas de montaña, chamarra de pluma, capas térmicas, guantes, lámpara de cabeza, 3 litros de agua y comida para dos días.</div></details>
</div>;
const VIENE=[['14 nov','14 días antes','Cómo prepararte: el entrenamiento de estas dos semanas y la lista de la mochila.'],['21 nov','7 días antes','El deslinde, para quien no lo ha firmado.'],['23 nov','5 días antes','El clima en la montaña y la mochila final.'],['26 nov','2 días antes','Punto de encuentro, hora y quién te recoge.'],['27 nov','1 día antes','Mañana salimos. Duerme temprano.']];
const Viene=()=> <>
  <div className="pub-inc">{VIENE.map(([d,a,t])=> <div key={d} className="row"><span className="sl">//</span><span><b style={{fontWeight:600}}>{d}</b> <span className="pub-mono" style={{fontSize:12.5,color:'var(--ink-soft)'}}>· {a}</span><small>{t}</small></span></div>)}
    <div className="row"><span className="sl">//</span><span><b style={{fontWeight:600}}>Punto de encuentro</b><small>Todavía no está puesto. Te llega el 26 de noviembre.</small></span></div></div>
  <p style={{fontSize:13.5,color:'var(--ink-soft)',marginTop:12}}>Te llega por WhatsApp y correo.</p></>;
const Grupo=()=> <div style={{display:'flex',flexDirection:'column',gap:8}}><button className="pub-cta pub-cta-ghost">Abrir el grupo de WhatsApp</button><p style={{fontSize:13.5,color:'var(--ink-soft)',lineHeight:1.5}}>Ahí se platica. Los avisos del viaje te llegan aparte, a ti.</p></div>;
const Pie=()=> <><div className="pub-guide"><span className="mesp-av">LU</span><div className="g"><b>Luis · Caminante</b><small>Tu operadora</small><p>+52 55 1202 0565<br/>uno@numanhub.com</p></div></div>
  <div className="pub-acts"><button className="pub-cta pub-cta-ghost pub-cta-sm">WhatsApp</button><button className="pub-cta pub-cta-ghost pub-cta-sm">Correo</button></div></>;
const DTop=()=> <div className="esp-dtop"><img src={IMG.logoc} alt="Caminante"/><span className="lk"><span>Experiencias</span><span>Aprende</span><span>Mi espacio</span></span><span className="out">Salir</span></div>;

function Cubrir(){
  const [open,setOpen]=useState(false);const [sel,setSel]=useState([]);
  const tg=i=>setSel(s=>s.includes(i)?s.filter(x=>x!==i):[...s,i]);
  return <div className={'mesp-acc'+(open?' open':'')}>
    <button className="mesp-acc-h" onClick={()=>setOpen(!open)}><span className="l"><span className="ti">Pagar por alguien más</span><span className="su">¿Quieres cubrir el lugar de alguien del grupo?</span></span><span className="mesp-chev">▼</span></button>
    <div className="mesp-acc-b"><div className="mesp-acc-in">
      <p style={{fontSize:13.5,color:'var(--ink-soft)',marginBottom:12,lineHeight:1.5}}>Lo normal es que cada quien pague su lugar. Si quieres cubrir a alguien, elige de quienes ya entraron.</p>
      {[['CE','Carla Estrada'],['XV','Ximena del Valle']].map(([i,n])=> <button key={i} className={'pub-sel'+(sel.includes(i)?' on':'')} onClick={()=>tg(i)}><span className="rd"><i></i></span><span className="g"><b>{n}</b><small>Entró · falta apartar</small></span><span className="pr">$14.000</span></button>)}
      <button className="pub-cta pub-cta-orange" style={{marginTop:14}} disabled={!sel.length}>{sel.length?`Pagar ${sel.length} ${sel.length>1?'lugares':'lugar'} · $${sel.length*14}.000`:'Elige a quién'}</button>
    </div></div></div>;
}

function Invitar(){
  const [ok,setOk]=useState(false);
  return <div className="mesp-invite open"><div className="mesp-invite-in">
    <span className="mesp-priv">Salida privada · sólo con la liga</span>
    <p className="t">Comparte la liga con tu grupo. Cada quien entra con su cuenta y aparta su lugar.</p>
    <button className="mesp-orange-lg" style={{width:'100%',justifyContent:'center',marginTop:14,minHeight:52,fontSize:15.5}} onClick={()=>setOk(true)}>Invitar a mi grupo</button>
    <div className="mesp-linkrow"><input readOnly value={LIGA}/><button className="mesp-glassbtn" onClick={()=>setOk(true)}>{ok?'Copiada':'Copiar'}</button></div>
    <p className="mesp-cupo">{ok?'Liga copiada. Se abre WhatsApp con el mensaje listo.':'Abre WhatsApp con el mensaje listo para mandar.'}</p>
  </div></div>;
}

const TripCard=({who,sub,at,children,chips})=> <article className="mesp-trip" style={{margin:0}}><div className="ph"><img src={IMG.trip} alt="Bosque del Iztaccíhuatl"/></div><span className="chip-date">Nov 28–29</span><div className="pad" style={{paddingTop:120}}>
  <span className="eb"><span className="sl">//</span> Tu lugar</span><h3>{who}</h3><p className="pax">{sub}</p><Steps at={at}/>{chips&&<div className="st">{chips}</div>}{children}</div></article>;

/* ── A · los dos mensajes ── */
const WaHd=({sub='Cuenta de empresa'})=> <div className="esp-wa-hd"><span className="bk">‹</span><span className="av"><img src={IMG.mark} alt=""/></span><span><b>Caminante</b><small>{sub}</small></span></div>;
const Mail=({subject,cap,capt,children})=> <figure className="esp-fig"><div className="esp-mail"><div className="esp-mailhd"><span className="mesp-av">CA</span><span><b>Caminante</b><small>uno@numanhub.com · para miranda@correo.mx</small></span><span className="dt">Hoy, 10:42</span></div>
  <div className="band"><img src={IMG.logo} alt="Caminante"/></div><div className="bd"><div className="eb"><s>//</s> {subject}</div>{children}</div>
  <div className="ft">Caminante · Naturaleza en movimiento — un proyecto NUMAN<br/>uno@numanhub.com · caminante.numanhub.com</div></div>
  <figcaption className="esp-cap" style={{maxWidth:600}}><b>{capt}</b>{cap}</figcaption></figure>;
function LamA(){
  return <Lam id="a" k="A" title={<>Lo que recibe <em>Miranda.</em></>} desc="Al pasar su tarjeta a «Interesado» le llegan dos mensajes, por WhatsApp y por correo. El de WhatsApp en el teléfono; el de correo como se ve en un cliente de escritorio, en el marco de los correos de Caminante.">
    <div className="esp-row">
      <Phone capt="A1 · WhatsApp" cap="Qué se abrió, qué sigue y la liga de su espacio."><div className="esp-wa"><WaHd/><div className="esp-wa-bd">
        <span className="esp-wa-day">Hoy</span>
        <div className="esp-bub">
          <p>Hola, Miranda. Ya es oficial: eres la anfitriona del <b>Ascenso al Iztaccíhuatl.</b></p>
          <p>Se abrió tu salida privada:<span className="li">Sábado 28 y domingo 29 de noviembre</span><span className="li">10 lugares</span><span className="li">$14.000 por persona</span></p>
          <p>Lo que sigue:<span className="li">Invita a tu grupo con tu liga.</span><span className="li">Cada quien aparta su lugar antes del 14 de noviembre.</span><span className="li">Cada quien firma su deslinde antes de salir.</span></p>
          <p>Tu espacio: <a>{LIGA}</a></p>
          <span className="tm">10:42</span>
          <span className="cta">Abrir mi espacio</span>
        </div>
      </div></div></Phone>
      <Mail subject="Eres la anfitriona" capt="A1 · Correo" cap="El mismo mensaje, en el marco de los correos de Caminante (600 de ancho, banda verde).">
        <h1>Miranda, se abrió tu salida.</h1>
        <p>Ya es oficial: eres la anfitriona del <b>Ascenso al Iztaccíhuatl</b>. Esto es lo que se abrió para tu grupo:</p>
        <ul><li>Sábado 28 y domingo 29 de noviembre</li><li>10 lugares</li><li>$14.000 por persona</li></ul>
        <p>Lo que sigue:</p>
        <ul><li>Invita a tu grupo con tu liga.</li><li>Cada quien aparta su lugar antes del 14 de noviembre.</li><li>Cada quien firma su deslinde antes de salir.</li></ul>
        <span className="cta">Abrir mi espacio →</span>
        <p className="fb">Si el botón no funciona, copia esta dirección en tu navegador:<br/><a>{LIGA}</a></p>
      </Mail>
    </div>
    <div className="esp-row" style={{marginTop:36}}>
      <Phone capt="A2 · WhatsApp" cap="Listo para copiar o reenviar tal cual. La vista previa muestra la foto y el contador."><div className="esp-wa"><WaHd/><div className="esp-wa-bd">
        <span className="esp-wa-day">Hoy</span>
        <div className="esp-bub"><p>Este es el mensaje para tu grupo. Reenvíalo o cópialo:</p><span className="tm">10:42</span></div>
        <div className="esp-bub">
          <div className="esp-lnk"><img src={IMG.hero} alt=""/><div className="t"><b>Ascenso al Iztaccíhuatl · Grupo de Miranda</b><small>4 de 10 lugares apartados · caminante.numanhub.com</small></div></div>
          <p>Hola, estoy armando el Ascenso al Iztaccíhuatl el 28 y 29 de noviembre con Caminante. Somos 10 lugares. Entra aquí para apartar el tuyo: <a>{LIGA}</a></p>
          <span className="tm">10:42</span>
          <span className="cta">Copiar el mensaje</span><span className="cta">Reenviar</span>
        </div>
      </div></div></Phone>
      <Mail subject="Para tu grupo" capt="A2 · Correo" cap="El texto para reenviar va en un recuadro, listo para copiar.">
        <h1>El mensaje para tu grupo.</h1>
        <p>Cópialo y mándalo a tus amigos o a tu grupo de WhatsApp:</p>
        <div className="fwd">Hola, estoy armando el Ascenso al Iztaccíhuatl el 28 y 29 de noviembre con Caminante. Somos 10 lugares. Entra aquí para apartar el tuyo: <a>{LIGA}</a></div>
        <span className="cta">Copiar el mensaje</span>
        <div className="hr"></div>
        <p className="fb">Cada persona que entre por tu liga crea su cuenta Caminante y aparta su lugar. Tú ves quién va entrando en tu espacio.</p>
      </Mail>
    </div></Lam>;
}

/* ── B · el espacio de la anfitriona ── */
const Sec=({eb,title,children})=> <div className="pub-sec"><Eb>{eb}</Eb>{title&&<h2>{title}</h2>}{children}</div>;
function EspacioAnfitriona({variable}){
  const [ex,setEx]=useState(true);
  return <><DTop/><Head/>
    <div className="esp-body">
      <Hero chips={<Priv/>} eb={<Eb neg>Nov 28–29 · Grupo de Miranda</Eb>} title={TITLE}/>
      <Side count={<Count/>} price={<Price variable={variable} ex={ex} setEx={setEx}/>} cta={<button className="pub-cta pub-cta-ghost" disabled>Tu lugar está apartado y firmado</button>} invite={<Invitar/>}/>
      <div className="esp-main">
        {variable&&<div className="esp-monly"><Price variable ex={ex} setEx={setEx}/></div>}
        <Sec eb="Tu lugar" title={<>Ya estás <em>lista.</em></>}>
          <TripCard who="Miranda Castillo" sub="Anfitriona · 1 lugar" at={3} chips={<><span className="mesp-stchip st-ok"><span className="tk">✓</span>Pagado</span><span className="mesp-stchip st-ok"><span className="tk">✓</span>Deslinde firmado</span></>}><div className="esp-monly"><Invitar/></div></TripCard>
        </Sec>
        <Sec eb="Quién va" title={<>Seis adentro, <em>cuatro lugares.</em></>}><Who host me="MC"/><div style={{marginTop:14}}><Cubrir/></div></Sec>
        <Sec eb="El viaje"><Viaje/></Sec>
        <Sec eb="Lo que viene"><Viene/></Sec>
        <Sec eb="El grupo"><Grupo/></Sec>
        <Sec eb="Tu operadora"><Pie/></Sec>
      </div>
    </div></>;
}
function LamB(){
  return <Lam id="b" k="B" title={<>El espacio, <em>como lo ve Miranda.</em></>} desc="Una sola pantalla larga. En teléfono: el contador bajo la portada y la invitación dentro de su tarjeta. En escritorio, dos columnas: el contenido a la izquierda y una tarjeta pegajosa a la derecha con el contador, la fecha límite, el precio y la invitación.">
    <div className="esp-row">
      <Phone long capt="B · Teléfono" cap="Nunca se ven montos ni datos médicos de otros: sólo quién entró, quién pagó y quién firmó."><EspacioAnfitriona/></Phone>
      <Phone desk capt="B · Escritorio · 1280" cap="El mismo marcado. La tarjeta de la derecha no se va al hacer scroll; «Pagar por alguien más» sigue siendo acordeón en la columna izquierda."><EspacioAnfitriona/></Phone>
    </div></Lam>;
}

/* ── B-estados ── */
const HERO_EB=<Eb neg>Nov 28–29 · Grupo de Miranda</Eb>;
const ESTADOS=[
  ['Abierto','Hay lugares y la fecha límite corre.',{chips:<Priv/>,count:<Count/>,cta:<button className="pub-cta pub-cta-orange">Apartar mi lugar</button>}],
  ['Cupo lleno','Ya no se aparta. Quien llega entra a la lista de espera.',{chips:<><Priv/><span className="pub-chip">Cupo lleno</span></>,count:<Count n={10} tone="full" lim="Cupo lleno" left="2 en lista de espera" note="Si alguien libera su lugar, entra el primero de la lista y le avisamos."/>,cta:<button className="pub-cta pub-cta-forest">Avísame si se abre un lugar</button>}],
  ['Venció sin el mínimo','No se cancela sola: Luis escribe.',{chips:<Priv/>,count:<Count tone="warn" lim="Se cerró el 14 de noviembre" left="Mínimo 6" note="No se juntó el mínimo. La salida sigue en pie mientras tanto: Luis te va a escribir para ver cómo seguimos."/>,cta:<button className="pub-cta pub-cta-ghost">Escribirle a Luis</button>}],
  ['Ya viajaron','El espacio se vuelve recuerdo.',{img:IMG.g3,chips:<span className="pub-chip">Ya viajaron</span>,title:<>Subieron <em>los diez.</em></>,count:<Count n={10} of={10} tone="full" lim="Viajaron el 28 y 29 de noviembre" left={null}/>,cta:<button className="pub-cta pub-cta-orange">Contar cómo te fue</button>,note:'Las fotos del grupo y «Volver a salir» viven abajo.',after:<div className="pub-sec"><div className="pub-gal" style={{marginTop:0}}><figure><img src={IMG.g1} alt=""/></figure><figure><img src={IMG.g4} alt=""/></figure></div><div style={{display:'flex',flexDirection:'column',gap:10,marginTop:16}}><button className="pub-cta pub-cta-orange">Contar cómo te fue</button><button className="pub-cta pub-cta-ghost">Volver a salir con el grupo</button></div></div>}]];
function LamBEst(){
  return <Lam id="b-estados" k="B-estados" title={<>La portada, <em>en cuatro momentos.</em></>} desc="En teléfono cambia el contador bajo la portada. En escritorio cambia sólo la tarjeta pegajosa: se dibuja ella sola.">
    <div className="esp-row minis">{ESTADOS.map(([c,cap,s])=> <Phone key={c} mini capt={c} cap={cap}><Head/><Hero h={400} img={s.img} chips={s.chips} eb={HERO_EB} title={s.title||TITLE}/>{s.count}{s.after}</Phone>)}</div>
    <div className="esp-row sides" style={{marginTop:36}}>{ESTADOS.map(([c,cap,s])=> <figure key={c} className="esp-fig"><Side count={s.count} price={<Price/>} cta={s.cta} note={s.note}/><figcaption className="esp-cap"><b>{c} · Escritorio</b>{cap}</figcaption></figure>)}</div>
  </Lam>;
}

/* ── B-precio ── */
function LamBPrecio(){
  const [ex,setEx]=useState(true);
  const blk=(v)=> <><Head/><Hero h={360} chips={<Priv/>} eb={HERO_EB} title={TITLE}/><Count/><Price variable={v} ex={ex} setEx={setEx}/></>;
  return <Lam id="b-precio" k="B-precio" title={<>El precio, <em>fijo o por grupo.</em></>} desc="Si la experiencia tiene precio fijo, se muestra fijo. Si sale del cotizador por tamaño de grupo, dice para cuántos es y que puede cambiar. En escritorio vive en la tarjeta pegajosa.">
    <div className="esp-row minis">
      <Phone mini capt="Precio fijo" cap="El de la experiencia, sin condiciones.">{blk(false)}</Phone>
      <Phone mini capt="Precio del cotizador" cap="La «i» abre una línea que lo explica.">{blk(true)}</Phone>
    </div>
    <div className="esp-row sides" style={{marginTop:36}}>
      <figure className="esp-fig"><Side count={<Count/>} price={<Price/>} cta={<button className="pub-cta pub-cta-orange">Apartar mi lugar</button>}/><figcaption className="esp-cap"><b>Precio fijo · Escritorio</b></figcaption></figure>
      <figure className="esp-fig"><Side count={<Count/>} price={<Price variable ex={ex} setEx={setEx}/>} cta={<button className="pub-cta pub-cta-orange">Apartar mi lugar</button>}/><figcaption className="esp-cap"><b>Cotizador · Escritorio</b>El mismo bloque, con la explicación abierta.</figcaption></figure>
    </div></Lam>;
}
Object.assign(window,{IMG,LIGA,Eb,Lam,Phone,Head,Hero,TITLE,Priv,Count,Price,Side,Steps,St,Who,Viaje,Viene,Grupo,Pie,DTop,TripCard,WaHd,Sec,HERO_EB,LamA,LamB,LamBEst,LamBPrecio});
