/* APRENDE · cápsulas — AP1 índice · AP2 lectura · AP3 serie */
const {useState:uP,useEffect:uPe,useRef:uPr} = React;

const CAPS=[
{id:"hongosto",titulo:["Hongosto","."],lugar:"Xalatlaco",expId:"hongos",formato:"Artículo",min:6,cara:"naturaleza",tono:"flora",estado:"publicada",destacada:true,esteMes:true,serie:"Las cuatro caras de Xalatlaco",
entradilla:"La lluvia de agosto despierta un micelio que llevaba once meses bajo el suelo."},
{id:"pisos",titulo:["Bajar es viajar ","al sur."],lugar:"Barrancas",expId:"barranca",formato:"Guía de campo",min:4,cara:"naturaleza",tono:"barranca",estado:"publicada",serie:null,
entradilla:"Cómo leer los pisos ecológicos de la barranca: arriba pino, en el fondo clima subtropical."},
{id:"acuario",titulo:["El acuario ","del mundo."],lugar:"Ensenada",expId:"ensenada",formato:"Ensayo fotográfico",min:3,cara:"naturaleza",tono:"mar",estado:"publicada",serie:null,
entradilla:"El golfo concentra el 39% de los mamíferos marinos del planeta. Se deja ver."},
{id:"mobulas",titulo:["Las mobulas","."],lugar:"Ensenada",expId:"ensenada",formato:"Documental",min:null,cara:"naturaleza",tono:"mar",estado:"encamino",cuando:"abril–julio",serie:null,
entradilla:"Miles de mantarrayas juntas frente a la costa. El fenómeno vuelve en abril."},
];
const FMT_CH={"Artículo":"artículo","Guía de campo":"guía de campo","Ensayo fotográfico":"ensayo fotográfico","Documental":"documental"};

function CapRow({c,nav,ui}){
const enCamino=c.estado==="encamino";
return <button className="cap-row" onClick={()=>enCamino?ui.openSheet("avisame",{exp:"«"+c.titulo.join("")+"» ("+c.cuando+")"}):nav.push("capsula",{id:c.id})}>
{/* banco: paisaje · miniatura de la cápsula */}
<span className="th"><Ph cat={c.tono} slug={c.expId} ratio={1.25} alt={c.titulo.join("")}/></span>
<span className="g">
<small className="pub-mono meta2">{c.lugar} · {FMT_CH[c.formato]}{c.min?" · "+c.min+" min":""}</small>
<b>{c.titulo[0]}<em>{c.titulo[1]}</em></b>
<small className="ent">{c.entradilla}</small>
{enCamino&&<span className="pub-chip warn" style={{alignSelf:"flex-start",marginTop:6}}>en camino · {c.cuando} — avísame</span>}
</span>
</button>;}

function PubAprende({S,nav,ui}){
const [lugar,setLugar]=uP("Todos");
const [cara,setCara]=uP(null);
const dest=CAPS.find(c=>c.destacada);
const list=CAPS.filter(c=>!c.destacada&&(lugar==="Todos"||c.lugar===lugar)&&(!cara||c.cara===cara));
const destOk=(lugar==="Todos"||dest.lugar===lugar)&&(!cara||dest.cara===cara);
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<HeadFloat nav={nav} oncream/>
<div className="pub-headpad"></div>
<Sec style={{paddingTop:6}}><Eyeb>Aprende</Eyeb><h2>Lo que sabemos de <em>cada lugar.</em></h2>
<p style={{fontSize:14.5,color:"var(--ink-soft)"}}>Cápsulas documentales, con fuente. Sin «5 razones para».</p></Sec>
<div className="cap-filtros">
{["Todos","Xalatlaco","Ensenada","Barrancas","Volcanes"].map(l=><button key={l} className={"pub-cta pub-cta-sm "+(lugar===l?"pub-cta-forest":"pub-cta-ghost")} onClick={()=>setLugar(l)}>{l}</button>)}
</div>
<div className="cap-filtros" style={{paddingTop:0}}>
{["naturaleza","conservación","comunidades","problemas"].map(k=><button key={k} className={"cap-cara"+(cara===k?" on":"")} onClick={()=>setCara(cara===k?null:k)}>{k}</button>)}
</div>
{destOk&&<Sec style={{paddingTop:12}}><Eyeb>La cápsula del momento</Eyeb>
<button className="pub-expcard" style={{minHeight:330,marginTop:12}} onClick={()=>nav.push("capsula",{id:dest.id})}>
{/* banco: flora · la destacada */}
<div className="ph"><Ph cat={dest.tono} slug={dest.expId} ratio={.95} alt={dest.titulo.join("")}/></div>
<div className="veil"></div>
<div className="inner">
<span className="date">{dest.lugar} · {FMT_CH[dest.formato]} · {dest.min} min</span>
<h3 style={{fontSize:34}}>{dest.titulo[0]}<em>{dest.titulo[1]}</em></h3>
<div className="row"><span className="pub-chip"><span className="cd"></span>está pasando ahora</span></div>
</div>
</button>
</Sec>}
{dest.esteMes&&lugar==="Todos"&&!cara&&<Sec style={{paddingTop:16}}><Eyeb>Lo que pasa este mes</Eyeb>
<p style={{marginTop:10,fontSize:15.5}}>Agosto es el pico de los hongos en los bosques del centro — <em style={{color:"var(--orange)"}}>hongosto</em>. La cápsula de arriba lo cuenta; la salida del 23 lo camina.</p></Sec>}
<Sec style={{paddingTop:16,paddingBottom:26}}><Eyeb>Todas las cápsulas</Eyeb>
<div style={{marginTop:12}}>
{list.length===0&&!destOk?<div className="pub-blk"><div className="pub-state" style={{padding:"6px 0"}}><h3>Nada aquí todavía</h3><p>Este lugar tendrá su cápsula — el material documentado ya existe.</p></div></div>:
list.map(c=><CapRow c={c} key={c.id} nav={nav} ui={ui}/>)}
</div>
{CAPS.some(c=>c.serie)&&<button className="pub-cta pub-cta-ghost pub-cta-sm" style={{marginTop:12}} onClick={()=>nav.push("serie")}>Serie · Las cuatro caras de Xalatlaco →</button>}
</Sec>
</div>;}

/* ── AP2 · la cápsula ── */
function Dato({children,fuente}){return <div className="cap-dato"><p>{children}</p><span className="pub-fuente">Fuente · {fuente}</span></div>;}
function Foto({cat,slug,pie,ratio}){return <figure className="cap-full">{/* banco: la categoría va en data-banco */}<Ph cat={cat} slug={slug} ratio={ratio||.62} alt={pie}/><figcaption className="pie">{pie}</figcaption></figure>;}

function CuerpoHongosto({nav}){
return <div className="cap-body">
<p className="cap-muestra">// texto de muestra · redactado a partir del material documentado; la redacción final está en camino</p>
<p>Todo el año el bosque de Xalatlaco guarda un secreto bajo el suelo: el micelio. Once meses invisible, vivo, esperando. Cuando las lluvias de julio empapan la tierra, fructifica — y agosto se llena de hongos.</p>
<p className="cap-tesis">A la palabra la inventó la gente que los recolecta: hongosto.</p>
<Foto cat="paisaje" slug="hongos" pie="El bosque de oyamel después de la lluvia · Xalatlaco, Edo. de México"/>
<p>Lo que aparece no es una planta ni un fruto cualquiera. La mayoría de los hongos comestibles de estos bosques no descomponen materia muerta:</p>
<Dato fuente="SciELO · Amanalco, Edo. de México (2012)">«La mayoría de los hongos comestibles de estos bosques no descomponen: viven asociados a las raíces de los árboles.»</Dato>
<p>Esa alianza tiene nombre: <b>ectomicorriza</b> — el árbol da azúcares, el hongo da agua y minerales. Ninguno de los dos sobrevive igual sin el otro.</p>
<Foto cat="detalle" slug="hongos" pie="Boletus edulis — debajo de la tapa no tiene láminas: tiene una esponja. Identificación en campo: Nanae Watabe" ratio={.75}/>
<p>El Estado de México es el tercer estado con más registros de hongos del país, y aun así lo que la ciencia conoce es una fracción:</p>
<Dato fuente="Revista Mexicana de Biodiversidad (2014)">Se estiman decenas de miles de especies de hongos en México, pero la ciencia conoce alrededor del 5%.</Dato>
<p>Por eso en el campo se camina con guía. El <b>chapopote</b> le dice morilla falsa a más de uno — «pero nada que ver: su sabor y su olor son mucho más fuertes».</p>
<p className="cap-tesis">El hongo que ves en agosto es la punta de algo que estuvo ahí todo el año. Igual que tu atención: donde la pones, ahí fructifica.</p>
</div>;}
function CuerpoPisos(){
return <div className="cap-body">
<p className="cap-muestra">// texto de muestra · redactado a partir del material documentado</p>
<p>Bajar la barranca es cruzar pisos ecológicos: arriba mandan el pino y el encino; en el fondo, el clima es subtropical. El mismo día tocas dos mundos.</p>
<Dato fuente="INAH">El sistema es más extenso que el Gran Cañón y casi el doble de profundo.</Dato>
<p className="cap-tesis">Bajar es viajar al sur sin moverte de estado.</p>
<Foto cat="barranca" slug="barrancas" pie="El borde y el fondo: dos climas en una misma pared · Chihuahua"/>
<p>Señales para leer el descenso: donde acaba el encino y aparecen los cultivos de ladera, ya cambiaste de piso. El calor del fondo no es impresión tuya — es otro clima.</p>
</div>;}
function CuerpoAcuario(){
return <div className="cap-body">
<p className="cap-muestra">// ensayo fotográfico · pies redactados a partir del material documentado</p>
<Foto cat="mar" slug="ensenada" pie="«El acuario del mundo», dijo Cousteau. La bahía de Ensenada de Muertos, Baja California Sur" ratio={.75}/>
<Dato fuente="UNESCO (2005)">El Golfo de California concentra el 39% de los mamíferos marinos del mundo.</Dato>
<Foto cat="mar" slug="ensenada" pie="Ballenas de diciembre a abril; tiburón ballena de octubre a abril. El mar tiene calendario, como el bosque" ratio={.75}/>
<Foto cat="cielo" slug="ensenada" pie="Kilómetros y kilómetros de mar abierto — la paz que cuentan las reseñas es literal" ratio={.6}/>
<p className="cap-tesis">mirar el mar en silencio también es fisiología: baja el ritmo cardiaco en minutos.</p>
</div>;}
const CUERPOS={hongosto:CuerpoHongosto,pisos:CuerpoPisos,acuario:CuerpoAcuario};

function PubCapsula({S,nav,ui,params}){
const c=CAPS.find(x=>x.id===params.id);
const e=PUB.exps.find(x=>x.id===c.expId);
const sal=PUB.salidas.filter(s=>s.exp===e.id);
const [host,setHost]=uP(null);
const [prog,setProg]=uP(0);
const [showHead,setShowHead]=uP(false);
const rootRef=uPr(null);const lastY=uPr(0);
uPe(()=>{if(rootRef.current)setHost(rootRef.current.closest(".pub-app"));},[]);
uPe(()=>{if(!host)return;const cont=host.querySelector(".pub-scroll");if(!cont)return;
const onS=()=>{const y=cont.scrollTop;const max=cont.scrollHeight-cont.clientHeight;setProg(max>0?Math.min(1,y/max):0);setShowHead(y>420&&y<lastY.current);lastY.current=y;};
cont.addEventListener("scroll",onS,{passive:true});return()=>cont.removeEventListener("scroll",onS);},[host]);
const Cuerpo=CUERPOS[c.id];
const otras=CAPS.filter(x=>x.id!==c.id&&x.estado==="publicada"&&(x.lugar===c.lugar||x.serie===c.serie)).concat(CAPS.filter(x=>x.id!==c.id&&x.estado==="publicada")).filter((x,i,a)=>a.indexOf(x)===i).slice(0,2);
return <div className="pub-screen" ref={rootRef}>
<div className="pub-hero" style={{minHeight:500}}>
{/* banco: fondo neutro — detrás de la portada nunca va foto de sujeto */}
<div className="ph"><Ph cat={c.tono} slug={e.slug} ratio={1.35} alt={c.titulo.join("")}/></div>
<div className="veil"></div>
<div className="inner" style={{paddingBottom:26}}>
<Eyeb neg>{c.lugar} · {FMT_CH[c.formato]}</Eyeb>
<h1>{c.titulo[0]}<em>{c.titulo[1]}</em></h1>
<p>{c.entradilla}</p>
<span className="meta">{c.min} min de lectura</span>
</div>
</div>
{Cuerpo&&<Cuerpo nav={nav}/>}
<Sec style={{paddingTop:4}}>
{c.serie&&<button className="pub-cta pub-cta-ghost pub-cta-sm" onClick={()=>nav.push("serie")}>Serie · {c.serie} →</button>}
</Sec>
<Sec style={{paddingTop:10,paddingBottom:30}}><Eyeb>Sigue leyendo</Eyeb>
<div style={{marginTop:10}}>{otras.map(o=><CapRow c={o} key={o.id} nav={nav} ui={ui}/>)}</div>
</Sec>
{host&&ReactDOM.createPortal(<React.Fragment>
<div className="cap-prog"><i style={{width:(prog*100)+"%"}}></i></div>
<div className={"cap-head"+(showHead?" show":"")}><b>{c.titulo.join("")}</b><small>{c.lugar} · {FMT_CH[c.formato]}</small></div>
<button className="cap-btn l" aria-label="Regresar" onClick={nav.pop}><svg width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M8 1L1.5 8 8 15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
<button className="cap-btn r" aria-label="Compartir" onClick={()=>{ui.toastify("Link copiado","caminante.mx/aprende/"+c.id+" — listo para Instagram");}}><svg width="16" height="18" viewBox="0 0 16 18" fill="none"><path d="M8 11V1.5M8 1.5L4.5 5M8 1.5L11.5 5M2 9v6a1.5 1.5 0 001.5 1.5h9A1.5 1.5 0 0014 15V9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
<div className="pub-buybar">
<div className="p"><b>{e.nombre}</b><small>{sal[0]?("próxima salida · "+sal[0].lbl+(e.precio?" · "+pfmt(e.precio):"")):"sin fecha abierta todavía"}</small></div>
{sal[0]?<button className="pub-cta pub-cta-orange" onClick={()=>nav.push("exp",{id:e.id,origen:"Aprende"})}>Conocer el lugar</button>
:<button className="pub-cta pub-cta-orange" onClick={()=>ui.openSheet("avisame",{exp:e.nombre})}>Avísame</button>}
</div>
</React.Fragment>,host)}
</div>;}

/* ── AP3 · serie ── */
function PubSerie({nav,ui}){
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<NavCream nav={nav} t="Las cuatro caras de Xalatlaco" s="serie · 4 entregas"/>
<div className="pub-hero" style={{minHeight:240}}>
{/* banco: paisaje · portada de la serie */}
<div className="ph"><Ph cat="flora" slug="hongos" ratio={.66} alt="El bosque de Xalatlaco"/></div>
<div className="veil"></div>
<div className="inner"><Eyeb neg>Serie</Eyeb><h1 style={{fontSize:30}}>Las cuatro caras <em>de Xalatlaco.</em></h1></div>
</div>
<Sec><p style={{fontSize:15,color:"var(--ink-soft)"}}>Un lugar se lee por sus cuatro caras: naturaleza, conservación, comunidades y problemas. Cuatro entregas, un bosque.</p></Sec>
<div style={{padding:"0 20px 30px",display:"flex",flexDirection:"column",gap:10}}>
<button className="pub-fecha on" onClick={()=>nav.push("capsula",{id:"hongosto"})}>
<div className="d"><b>1</b><small>de 4</small></div>
<div className="g"><b>Hongosto</b><small>naturaleza · artículo · 6 min</small></div>
<span className="disp">leída ✓</span>
</button>
{[["2","Quién cuida el bosque","conservación"],["3","El ejido","comunidades"],["4","Lo que lo amenaza","problemas"]].map(([n,t,cara])=><div className="pub-fecha off" key={n}>
<div className="d"><b>{n}</b><small>de 4</small></div>
<div className="g"><b>{t}</b><small>{cara} · en camino</small></div>
<button className="pub-cta pub-cta-ghost pub-cta-sm" style={{width:"auto",flex:"0 0 auto"}} onClick={()=>ui.openSheet("avisame",{exp:"la entrega «"+t+"»"})}>Avísame</button>
</div>)}
</div>
</div>;}

Object.assign(window,{PubAprende,PubCapsula,PubSerie,CAPS});
