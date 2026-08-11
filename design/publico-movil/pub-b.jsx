/* Camino B · COMPRAR */
const {useState:uB,useEffect:uBe,useRef:uBr} = React;

function PubReservar({S,A,nav,ui,params}){
const e=PUB.exps.find(x=>x.id===params.id);
const sal=PUB.salidas.filter(s=>s.exp===e.id);
const grupo=params.grupo?sal.filter(s=>s.id===params.grupo):sal;
const [sel,setSel]=uB(params.salida||(grupo[0]?grupo[0].id:null));
const [pax,setPax]=uB(1);
const [nivel,setNivel]=uB(0);
const [pagando,setPagando]=uB(false);
const [host,setHost]=uB(null);
const rootBRef=uBr(null);
uBe(()=>{if(rootBRef.current)setHost(rootBRef.current.closest(".pub-app"));},[]);
const salida=grupo.find(s=>s.id===sel);
const precio=e.niveles?e.niveles[nivel][1]:e.precio;
const total=precio*pax;
const pagar=()=>{setPagando(true);setTimeout(()=>{setPagando(false);A.comprar(e,salida,pax,total);nav.replace("exito",{id:e.id,salida:sel,pax,total});},1400);};
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}} ref={rootBRef}>
<NavCream nav={nav} t={"Reservar · "+e.nombre} s={e.lugar}/>
{params.grupo&&<div style={{margin:"14px 20px 0"}} className="pub-blk"><span className="pub-lbl" style={{marginBottom:4}}>Salida privada</span><p style={{fontSize:14.5,color:"var(--ink-soft)",lineHeight:1.5}}>Llegaste por el link de tu grupo: solo ves esta salida. El resto del calendario no aplica aquí.</p></div>}
<div className="pub-book" style={{paddingTop:14,paddingBottom:150}}>
<div className="pub-blk">
<span className="pub-lbl">Elige tu salida</span>
{grupo.map(s=><button key={s.id} className={"pub-sel"+(sel===s.id?" on":"")+(s.quedan===0?" off":"")} disabled={s.quedan===0} onClick={()=>{setSel(s.id);if(pax>s.quedan)setPax(Math.max(1,s.quedan));}}>
<span className="rd">{sel===s.id&&<i></i>}</span>
<div className="g"><b>{s.lbl}</b><small>{s.quedan===0?"agotada — pide otra fecha abajo":s.quedan<=3?("quedan "+s.quedan+" lugares"):(s.quedan+" lugares")}</small></div>
<span className="pr">{pfmt(precio)}</span>
</button>)}
{!params.grupo&&<button className="pub-cta pub-cta-ghost pub-cta-sm" style={{width:"100%",marginTop:10}} onClick={()=>nav.push("solicitar",{id:e.id})}>¿Ninguna te sirve? Solicita tu fecha</button>}
</div>
{e.niveles&&<div className="pub-blk">
<span className="pub-lbl">Nivel</span>
{e.niveles.map(([n,p],i)=><button key={n} className={"pub-sel"+(nivel===i?" on":"")} onClick={()=>setNivel(i)}>
<span className="rd">{nivel===i&&<i></i>}</span><div className="g"><b>{n}</b></div><span className="pr">{pfmt(p)}</span>
</button>)}
</div>}
<div className="pub-blk">
<span className="pub-lbl">Personas</span>
<div className="pub-stepper">
<button aria-label="Quitar" onClick={()=>setPax(Math.max(1,pax-1))}>−</button><b>{pax}</b>
<button aria-label="Agregar" onClick={()=>setPax(Math.min(salida?salida.quedan:1,pax+1))}>+</button>
<small>Los acompañantes se registran al firmar el deslinde</small>
</div>
{salida&&pax===salida.quedan&&<p style={{fontSize:13.5,color:"var(--orange)",fontWeight:600,marginTop:8}}>Son los últimos {salida.quedan} lugares de esta salida.</p>}
</div>
<div className="pub-blk pub-total">
<span className="pub-lbl">Total</span>
<div className="row"><span>{pax} × {pfmt(precio)}</span><span className="pub-mono">{pfmt(total)}</span></div>
<div className="row"><span>IVA incluido</span><span className="pub-mono">—</span></div>
<div className="row tt"><span>Total</span><span className="pub-mono">{pfmt(total)} MXN</span></div>
</div>
</div>
{host&&ReactDOM.createPortal(<div className="pub-buybar">
<div className="p"><b>{pfmt(total)} MXN</b><small>{pax} persona{pax>1?"s":""} · {salida?salida.lbl:""}</small></div>
<button className="pub-cta pub-cta-orange" disabled={!salida||pagando} onClick={pagar}>{pagando?"Procesando…":"Pagar"}</button>
</div>,host)}
</div>;}

function PubExito({S,nav,params}){
const e=PUB.exps.find(x=>x.id===params.id);
const s=PUB.salidas.find(x=>x.id===params.salida);
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<div className="pub-headpad"></div>
<div className="pub-state" style={{paddingTop:30}}>
<span className="ic" style={{background:"var(--forest)",color:"#fff",fontSize:22}}>✓</span>
<h3 style={{fontSize:22,fontWeight:250,letterSpacing:"-.01em"}}>Tu lugar está apartado.</h3>
<p><b style={{color:"var(--charcoal)"}}>{e.nombre} · {s.lbl}</b><br/>{params.pax} persona{params.pax>1?"s":""} · {pfmt(params.total)} pagados. Te llegó el recibo por correo.</p>
</div>
<div style={{padding:"0 20px"}}>
<div className="pub-blk" style={{borderColor:"rgba(255,93,54,.4)",borderWidth:1.5}}>
<span className="pub-lbl" style={{color:"var(--orange)"}}>El siguiente paso no es opcional</span>
<p style={{fontSize:15.5,lineHeight:1.6}}>Falta <b>firmar el deslinde</b> — sin firma no se sube a la van. Toma 3 minutos y ahí registras a tus acompañantes.</p>
<button className="pub-cta pub-cta-orange" style={{marginTop:14}} onClick={()=>nav.replace("deslinde",{id:e.id})}>Firmar el deslinde ahora</button>
</div>
<button className="pub-cta pub-cta-ghost" style={{width:"100%",marginTop:12}} onClick={()=>{nav.reset();nav.setTab("espacio");}}>Lo hago después · ir a Mi espacio</button>
</div>
</div>;}

function PubDeslinde({S,A,nav,ui,params}){
const e=PUB.exps.find(x=>x.id===params.id)||PUB.exps[0];
const [paso,setPaso]=uB(1);
const [acomp,setAcomp]=uB([""]);
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<NavCream nav={nav} t="Registro y deslinde" s={e.nombre}/>
<div style={{padding:"14px 20px 30px"}}>
<div className="pub-blk">
<span className="pub-lbl">1 · El deslinde</span>
<p style={{fontSize:15,lineHeight:1.6,color:"var(--ink-soft)"}}>Actividad en naturaleza real: terreno irregular, clima cambiante. Declaro que participo por voluntad propia, que mi estado de salud me lo permite, y libero a NUMAN HUB S.A. de C.V. de responsabilidad por riesgos inherentes a la actividad.</p>
<label style={{display:"flex",gap:12,alignItems:"flex-start",marginTop:14,fontSize:15,cursor:"pointer"}}><input type="checkbox" style={{width:22,height:22,accentColor:"var(--olive)",marginTop:1}} onChange={ev=>setPaso(ev.target.checked?2:1)}/> Lo leí y lo acepto con mi nombre.</label>
</div>
<div className="pub-blk" style={{opacity:paso>=2?1:.5}}>
<span className="pub-lbl">2 · Perfil médico</span>
<div className="pub-fld"><label>Alergias o condiciones</label><input placeholder="ej. alergia a picadura de abeja" disabled={paso<2}/></div>
<div className="pub-fld"><label>Contacto de emergencia</label><input placeholder="nombre · teléfono" disabled={paso<2}/></div>
</div>
<div className="pub-blk" style={{opacity:paso>=2?1:.5}}>
<span className="pub-lbl">3 · Tus acompañantes</span>
<p style={{fontSize:14,color:"var(--ink-soft)",lineHeight:1.5,marginBottom:6}}>El día del viaje la guía necesita saber quién va. Si los dejas vacíos, te lo vamos a volver a pedir.</p>
{acomp.map((a,i)=><div className="pub-fld" key={i}><label>Acompañante {i+1}</label><input value={a} placeholder="nombre completo" disabled={paso<2} onChange={ev=>setAcomp(acomp.map((x,j)=>j===i?ev.target.value:x))}/></div>)}
<button className="pub-cta pub-cta-ghost pub-cta-sm" disabled={paso<2} onClick={()=>setAcomp([...acomp,""])}>+ Agregar otro</button>
</div>
<button className="pub-cta pub-cta-orange" style={{marginTop:16}} disabled={paso<2} onClick={()=>{A.firmar();nav.reset();nav.setTab("espacio");ui.toastify("Deslinde firmado","tu registro quedó completo");}}>Firmar y terminar</button>
</div>
</div>;}

/* calendario de solicitud — bloquea las fechas ya ocupadas por el operador */
const RANGOS={sa1:["2026-08-23"],sa2:["2026-08-29","2026-08-30"],sa3:["2026-10-08","2026-10-09","2026-10-10","2026-10-11"],sa4:["2026-10-15","2026-10-16","2026-10-17","2026-10-18"]};
function CalPick({expId,sel,onSel}){
const op=PUB.exps.find(x=>x.id===expId).op;
const bloq=new Set();
PUB.salidas.forEach(s=>{const e2=PUB.exps.find(x=>x.id===s.exp);if(e2&&e2.op===op&&RANGOS[s.id])RANGOS[s.id].forEach(d=>bloq.add(d));});
const meses=[[7,"Agosto"],[8,"Septiembre"],[9,"Octubre"],[10,"Noviembre"]];
const [mi,setMi]=uB(0);
const [mnum,mlbl]=meses[mi];
const dow=(new Date(2026,mnum,1).getDay()+6)%7;
const dias=new Date(2026,mnum+1,0).getDate();
return <div className="pub-calpick">
<div className="mh"><button disabled={mi===0} onClick={()=>setMi(mi-1)}>‹</button><b>{mlbl} 2026</b><button disabled={mi===meses.length-1} onClick={()=>setMi(mi+1)}>›</button></div>
<div className="gridc">
{["L","M","M","J","V","S","D"].map((d,i)=><span className="dh" key={i}>{d}</span>)}
{Array.from({length:dow}).map((_,i)=><span key={"b"+i}></span>)}
{Array.from({length:dias},(_,i)=>i+1).map(d=>{
const key="2026-"+String(mnum+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");
const pasado=mnum===7&&d<=10;
const ocupada=bloq.has(key);
return <button key={d} disabled={pasado||ocupada} className={"d"+(ocupada?" bloq":"")+(pasado?" mut":"")+(sel===key?" sel":"")} onClick={()=>onSel(key,d+" "+mlbl.toLowerCase().slice(0,3)+" 2026")}>{d}{ocupada&&<i></i>}</button>;})}
</div>
<p className="leyenda"><i></i> fecha ya ocupada por el operador</p>
</div>;}

function PubSolicitar({S,nav,ui,params}){
const e=PUB.exps.find(x=>x.id===params.id)||PUB.exps[0];
const [f,setF]=uB({nombre:"",mail:"",pax:"6",cuando:"",cuandoKey:null});
const [enviada,setEnviada]=uB(false);
if(enviada)return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<NavCream nav={nav} t="Solicitud enviada" s={e.nombre}/>
<div className="pub-state" style={{paddingTop:50}}>
<span className="ic" style={{background:"var(--forest)",color:"#fff"}}>✓</span>
<h3>Recibimos tu solicitud</h3>
<p>Te contestamos en menos de 48 horas con la fecha propuesta y el link privado de tu grupo.</p>
<button className="pub-cta pub-cta-ghost" style={{width:"auto",padding:"0 24px"}} onClick={nav.pop}>Volver</button>
</div>
</div>;
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<NavCream nav={nav} t="Solicitar mi fecha" s={e.nombre}/>
<div style={{padding:"14px 20px 30px"}}>
<div className="pub-blk">
<p style={{fontSize:15.5,lineHeight:1.6}}>Con <b>6 personas o más</b> abrimos una salida privada de {e.nombre} en la fecha que les acomode.</p>
<div className="pub-fld"><label>Tu nombre</label><input value={f.nombre} onChange={ev=>setF({...f,nombre:ev.target.value})}/></div>
<div className="pub-fld"><label>Correo</label><input type="email" value={f.mail} onChange={ev=>setF({...f,mail:ev.target.value})}/></div>
<div className="pub-fld"><label>¿Cuántos son?</label><input value={f.pax} onChange={ev=>setF({...f,pax:ev.target.value.replace(/\D/g,"")})}/></div>
<div className="pub-fld"><label>¿Cuándo les acomoda?</label>
<CalPick expId={e.id} sel={f.cuandoKey} onSel={(key,lbl)=>setF({...f,cuandoKey:key,cuando:lbl})}/>
<span className="hint">{f.cuando?("Eligieron el "+f.cuando+"."):"Toca un día libre — las fechas ocupadas del operador están bloqueadas."}</span>
</div>
<button className="pub-cta pub-cta-orange" style={{marginTop:10}} disabled={!f.nombre||!f.mail||!f.cuandoKey} onClick={()=>setEnviada(true)}>Enviar solicitud</button>
</div>
</div>
</div>;}

Object.assign(window,{PubReservar,PubExito,PubDeslinde,PubSolicitar});
