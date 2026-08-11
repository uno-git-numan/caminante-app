/* PAGO · ficha — misma pantalla desde Dinero y desde Eventos */
const {useState:uSp} = React;

INIT.pagos=[
{id:"pg1",persona:"Danaé Salazar",mail:"danae@revista192.com",tel:"55 2095 8279",monto:16500,medio:"Tarjeta",fecha:"8 ago · 23:05",ref:"ch_3QxB92LkTz8279",exp:"Trekking Barrancas del Cobre",expId:"barrancas",salida:"s4",salidaLbl:"Oct 8–11",pax:1,comp:[],sinReg:0,deslinde:false},
{id:"pg2",persona:"Renatta Pizarro",mail:"rpizarroh@gmail.com",tel:null,monto:16500,medio:"Tarjeta",fecha:"8 ago · 23:03",ref:"ch_3QxB8wLkTz1144",exp:"Trekking Barrancas del Cobre",expId:"barrancas",salida:"s4",salidaLbl:"Oct 8–11",pax:1,comp:[],sinReg:0,deslinde:true},
{id:"pg3",persona:"Sebastian poza",mail:"sposa@—.mx",tel:"55 8712 0034",monto:5100,medio:"Transferencia",fecha:"2 ago · 18:22",ref:"SPEI 7741002",exp:"Recolección de hongos",expId:"hongos",salida:"s2",salidaLbl:"23 ago",pax:2,comp:["Anxel García","Nala poza"],sinReg:0,deslinde:true},
{id:"pg4",persona:"Valentina Ortiz Monasterio",mail:"valeortizm@—.mx",tel:"55 4410 9982",monto:34500,medio:"Tarjeta",fecha:"1 ago · 09:12",ref:"ch_3QwA11LkTz0091",exp:"Hacienda y hongos · Kentro",expId:"kentroexp",salida:"s3",salidaLbl:"29 ago",pax:6,comp:[],sinReg:5,deslinde:true},
{id:"pg5",persona:"Abraham de Alba",mail:"abdealba@—.mx",tel:"55 3390 5511",monto:5100,medio:"Tarjeta",fecha:"28 jul · 20:40",ref:"ch_3QvZ77LkTz5511",exp:"Recolección de hongos",expId:"hongos",salida:"s2",salidaLbl:"23 ago",pax:2,comp:[],sinReg:1,deslinde:false},
];

const esNuevo=p=>p.fecha.startsWith("8 ago")||p.fecha.startsWith("9 ago");

/* ── FICHA ── */
function ScrPago({S,A,nav,ui,params}){
const p=S.pagos.find(x=>x.id===params.id);
const totalReg=1+p.comp.length;
const inconsistente=p.comp.length>0&&totalReg>p.pax;
const wa=p.tel?"https://wa.me/52"+p.tel.replace(/\D/g,""):null;
return <div className="adm-screen">
<NavBar onBack={nav.pop} t={"Pago · "+p.persona.split(" ")[0]} s={p.fecha} right={esNuevo(p)?<Chip c="warn">nuevo</Chip>:null}/>
<div className="adm-pad">
<div className="adm-card" style={{padding:"18px 16px"}}>
<span className="adm-mono" style={{fontSize:36,fontWeight:300,letterSpacing:"-.02em",display:"block"}}>{fmt(p.monto)}</span>
<div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"10px 0 8px"}}><Chip c="mut">{p.medio}</Chip><Chip c="mut">{p.fecha}</Chip></div>
<div className="adm-copy" style={{marginTop:4}}><span className="cv">{p.ref}</span><button onClick={()=>ui.copy(p.ref)}>COPIAR</button></div>
<p className="adm-mut" style={{fontSize:11,marginTop:6}}>Referencia para cruzar con el banco.</p>
</div>
<Gap/>
<Sub pad>Quién pagó</Sub>
<div className="adm-card" style={{padding:"14px 16px"}}>
<b style={{fontSize:16.5}}>{p.persona}</b>
<p className="adm-mut" style={{fontSize:12.5,margin:"3px 0 12px"}}>{p.mail}{p.tel?" · "+p.tel:" · sin teléfono registrado"}</p>
<div style={{display:"flex",gap:8}}>
{wa?<a className="adm-btn adm-btn-forest" style={{flex:1}} href={wa} target="_blank" rel="noopener">WhatsApp</a>:<button className="adm-btn adm-btn-ghost" style={{flex:1,opacity:.5}} disabled>WhatsApp</button>}
<a className="adm-btn adm-btn-ghost" style={{flex:1}} href={"mailto:"+p.mail}>Correo</a>
<button className="adm-btn adm-btn-ghost" style={{flex:1}} onClick={()=>ui.copy(p.tel||p.mail)}>Copiar</button>
</div>
</div>
<Gap/>
<Sub pad>Personas · {p.pax}</Sub>
<div className="adm-card" style={{padding:"14px 16px"}}>
{p.pax===1&&<p style={{fontSize:14}}>Va {p.persona.split(" ")[0]} — el titular, nadie más.</p>}
{p.pax>1&&p.comp.length>0&&<><p style={{fontSize:14,lineHeight:1.5}}>Va con <b>{p.comp.join(" y ")}</b>.</p>
{inconsistente&&<div className="adm-note adm-note-info" style={{marginTop:10}}><span className="st" style={{background:"var(--sand)"}}></span><span>Pagó por {p.pax} y registró {p.comp.length} acompañantes — {totalReg} personas en total. Se muestra lo que hay, sin cuadrarlo.</span></div>}</>}
{p.pax>1&&p.sinReg>0&&<>
<p style={{fontSize:14,lineHeight:1.5}}>{p.comp.length>0?"Además, ":""}<b style={{color:"#e8431f"}}>{p.sinReg} acompañante{p.sinReg>1?"s":""} sin registrar.</b></p>
<div className="adm-note adm-note-info" style={{margin:"10px 0"}}><span className="st" style={{background:"var(--sand)"}}></span><span>El sistema sabe cuántos van, no quiénes: los acompañantes solo se capturan si el titular los escribe al firmar el deslinde, y esa sección es opcional.</span></div>
<button className="adm-btn adm-btn-orange adm-btn-block" onClick={()=>{ui.copy(`Hola ${p.persona.split(" ")[0]} — para operar la salida necesitamos el nombre y contacto de tus ${p.sinReg} acompañante${p.sinReg>1?"s":""}. Complétalo aquí: caminante.mx/registro/${p.id}`);ui.toastify("Mensaje copiado","pídele que complete el registro por WhatsApp");}}>Pedirle que complete el registro</button>
</>}
</div>
<Gap/>
<Sub pad>A qué entra</Sub>
<div className="adm-card adm-menu">
<button className="mrow" onClick={()=>{nav.setTab("eventos");nav.push("evento",{id:p.expId});}}><span className="mi">EX</span><span className="grow">{p.exp}<small>salida {p.salidaLbl}</small></span><span className="go">›</span></button>
<button className="mrow" onClick={()=>nav.push("salidaGente",{salida:p.salida})}><span className="mi">QP</span><span className="grow">Quién más pagó esta salida</span><span className="go">›</span></button>
<button className="mrow" onClick={()=>nav.push("roster",{salida:p.salida})}><span className="mi">RO</span><span className="grow">Roster de la salida</span><span className="go">›</span></button>
</div>
<Gap/>
<Sub pad>Deslinde</Sub>
<div className="adm-card" style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
{p.deslinde?<><span className="adm-tick">✓</span><span style={{flex:1,fontSize:14}}>Firmado.</span></>
:<><span className="adm-tick off">✓</span><span style={{flex:1,fontSize:14}}><b style={{color:"#e8431f"}}>Pendiente.</b> Pagó y no ha firmado.</span><button className="adm-btn adm-btn-orange adm-btn-sm" onClick={()=>ui.openDialog("recordarFirma",{quien:p.persona})}>Recordar</button></>}
</div>
</div>
</div>;}

/* ── DINERO · camino: mes → evento → pagos → ficha ── */
function ScrMeses({S,nav}){
const ago=S.pagos.filter(p=>p.fecha.includes("ago"));
const evs={};ago.forEach(p=>{evs[p.exp]=evs[p.exp]||[0,0];evs[p.exp][0]+=p.monto;evs[p.exp][1]++;});
const meses=[
{n:"Agosto 2026",total:S.ingresosMes,cnt:48,evs:Object.entries(evs).map(([e,[m,c]])=>[e,m,c]),mes:"ago",abierto:true},
{n:"Julio 2026",total:61500,cnt:21,evs:[["Recolección de hongos",43350,17],["Ocean Safari",18150,4]],mes:"jul"},
{n:"Junio 2026",total:58900,cnt:4,evs:[["Ensenada de Muertos",58900,4]],mes:"jun"},
];
return <div className="adm-screen">
<NavBar onBack={nav.pop} t="Pagos por mes" s="mes → evento → pago"/>
<div className="adm-pad">
<div className="adm-card">
{meses.map(m=><details className="adm-li" key={m.n} open={m.abierto}>
<summary><div className="r1"><span className="t">{m.n}<small>{m.cnt} pagos</small></span><span className="m adm-mono">{fmt(m.total)}</span></div></summary>
<div className="adm-x"><Sub>Eventos con ingreso</Sub>
{m.evs.map(([e,mt,c])=><button key={e} className="adm-btn adm-btn-glass adm-btn-block" style={{justifyContent:"space-between",marginTop:8,fontWeight:500}} onClick={()=>nav.push("pagosEvento",{exp:e,mes:m.mes,lbl:m.n})}><span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{e} · {c} pago{c>1?"s":""}</span><span className="adm-mono">{fmt(mt)} ›</span></button>)}
</div>
</details>)}
</div>
</div>
</div>;}

function ScrPagosEvento({S,nav,params}){
const list=S.pagos.filter(p=>p.exp===params.exp&&p.fecha.includes(params.mes));
return <div className="adm-screen">
<NavBar onBack={nav.pop} t={params.exp} s={params.lbl+" · "+list.length+" pago"+(list.length!==1?"s":"")+" con ficha"}/>
<div className="adm-pad">
{list.length===0?<div className="adm-card"><Empty ic="◌" t="Sin ficha detallada" p="Estos pagos son anteriores al registro detallado — solo está el total del mes."/></div>:
<div className="adm-card">
{list.map(p=><div className="adm-li" key={p.id}><div className="rowbody" onClick={()=>nav.push("pago",{id:p.id})}>
<div className="r1"><span className="t">{p.persona}<small>{p.pax} persona{p.pax>1?"s":""} · {p.salidaLbl}</small></span><span className="m adm-mono">{fmt(p.monto)}</span></div>
<div className="r2">{esNuevo(p)&&<Chip c="warn">nuevo</Chip>}<Chip c="mut">{p.medio}</Chip><span className="dt">{p.fecha}</span></div>
</div></div>)}
</div>}
</div>
</div>;}

/* ── EVENTOS · salida → gente ── */
function ScrSalidaGente({S,nav,params}){
const s=S.salidas.find(x=>x.id===params.salida)||{etiqueta:"Salida",cupo:0,ocup:0};
const exp=S.exps.find(e=>e.id===s.exp)||{nombre:""};
const list=S.pagos.filter(p=>p.salida===s.id);
const vendido=list.reduce((a,p)=>a+p.monto,0);
return <div className="adm-screen">
<NavBar onBack={nav.pop} t={"Quién va · "+s.etiqueta} s={exp.nombre}/>
<div className="adm-pad">
<div className="adm-card adm-kpi4" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
<div><span className="adm-mono">{s.ocup}/{s.cupo}</span><br/><small>ocupación</small></div>
<div><span className="adm-mono">{fmt(vendido)}</span><br/><small>vendido</small></div>
<div><span className="adm-mono">{s.cupo-s.ocup}</span><br/><small>por llenar</small></div>
</div>
<Gap s/>
<button className="adm-btn adm-btn-forest adm-btn-block" onClick={()=>nav.push("roster",{salida:s.id})}>Roster de la salida</button>
<Gap/>
<Sub pad>Pagos de esta salida · {list.length}</Sub>
{list.length===0?<div className="adm-card"><Empty ic="◌" t="Sin pagos todavía" p="Cuando alguien pague esta salida, aparece aquí con su ficha."/></div>:
<div className="adm-card">
{list.map(p=><div className="adm-li" key={p.id}><div className="rowbody" onClick={()=>nav.push("pago",{id:p.id})}>
<div className="r1"><span className="t">{p.persona}<small>{p.pax} persona{p.pax>1?"s":""}{p.sinReg>0?" · "+p.sinReg+" sin registrar":p.comp.length>0?" · con "+p.comp.join(" y "):""}</small></span><span className="m adm-mono">{fmt(p.monto)}</span></div>
<div className="r2">{esNuevo(p)&&<Chip c="warn">nuevo</Chip>}{p.deslinde?<Chip c="ok" dot>Deslinde ✓</Chip>:<Chip c="warn">Deslinde pendiente</Chip>}<span className="dt">{p.fecha}</span></div>
</div></div>)}
</div>}
</div>
</div>;}

Object.assign(window,{ScrPago,ScrMeses,ScrPagosEvento,ScrSalidaGente});
