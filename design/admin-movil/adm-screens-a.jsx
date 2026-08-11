const {useState:uS} = React;

/* ── PANORAMA ── */
function ScrPanorama({S,A,nav,ui}){
const deslFalt=S.deslPend.length;
const pendCobro=S.reservas.filter(r=>["anticipo","pendiente"].includes(r.estado)).reduce((a,r)=>a+(r.total-r.pagado),0);
return <div className="adm-screen">
<Head eyebrow="Panorama" title="Tu operación, <em>en vivo.</em>"/>
<div className="adm-pad">
<div className="adm-note adm-note-forest"><span className="st" style={{background:"var(--orange)"}}></span><span style={{flex:1}}><b>Hoy · Hongos · Xalatlaco</b><br/>17 personas · {S.roster.filter(r=>!r.firmo).length} deslindes sin firmar</span><button className="adm-btn" style={{color:"#fff",border:"1px solid rgba(255,255,255,.35)"}} onClick={()=>{nav.setTab("eventos");nav.push("evento",{id:"hongos"});nav.push("roster",{salida:"s1"});}}>Abrir</button></div>
<Gap/>
<div className="adm-card adm-pulse">
<details open><summary><span className="lbl"><b>Ingresos del mes</b>histórico {fmt(S.historicoIng)}</span><span className="val">{fmt(S.ingresosMes)}<span className="up">+18% vs. jul</span></span><Chev/></summary>
<div className="adm-x"><Sub>Por experiencia</Sub>
<Prow l="Ocean Safari" w={66} fr="$48.000"/><Prow l="Hongos" w={24} fr="$17.850"/><Prow l="Volcanes" w={9} fr="$6.750"/>
<div className="adm-acts"><button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={()=>nav.setTab("dinero")}>Ver Dinero</button></div>
</div></details>
<details><summary><span className="lbl"><b>Por operar</b>45 pagadas · 1 confirmada</span><span className="val">20<span className="u"> próx.</span></span><Chev/></summary>
<div className="adm-x"><Sub>Por salida</Sub>
<Prow l="Hongos · hoy" w={94} fr="17/17"/><Prow l="Hongos · 23 ago" w={28} fr={S.salidas.find(s=>s.id==="s2").ocup+"/18"} warn/>
<div className="adm-acts"><button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={()=>nav.setTab("eventos")}>Ver Eventos</button></div>
</div></details>
<details><summary><span className="lbl"><b>Deslindes firmados</b>salidas próximas</span><span className="val">{44-deslFalt}<span className="u"> /44</span>{deslFalt>0&&<span className="up wr">{deslFalt} pendientes</span>}</span><Chev/></summary>
<div className="adm-x"><Sub>Dónde faltan</Sub>
{S.deslPend.slice(0,3).map(d=><Prow key={d.id} l={d.n.split(" ")[0]} w={40} fr={d.sub.split("·")[0]} warn/>)}
<div className="adm-acts"><button className="adm-btn adm-btn-orange adm-btn-sm" onClick={()=>{nav.setTab("gente");nav.push("encuesta");}}>Recordar firmas</button></div>
</div></details>
<details><summary><span className="lbl"><b>Satisfacción</b>{S.satisf.resp} respuestas</span><span className="val">{S.satisf.prom}<span className="u"> /5</span></span><Chev/></summary>
<div className="adm-x"><Sub>Distribución</Sub>
{S.satisf.dist.map((d,i)=><Prow key={i} l={d[0]} w={d[1]} fr={d[2]} warn={i===2}/>)}
<div className="adm-acts"><button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={()=>{nav.setTab("gente");nav.push("encuesta");}}>Ver Encuesta</button></div>
</div></details>
</div>
<Gap/>
{pendCobro>0&&<div className="adm-note adm-note-warn"><span className="st" style={{background:"var(--orange)"}}></span><span style={{flex:1}}><b>{fmt(pendCobro)} pendiente de cobro.</b> {S.reservas.filter(r=>["anticipo","pendiente"].includes(r.estado)).length} reservas deben saldo.</span><button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={()=>nav.setTab("gente")}>Ver</button></div>}
<Gap s/>
<div style={{display:"flex",gap:10}}><button className="adm-btn adm-btn-orange" style={{flex:1}} onClick={()=>{nav.setTab("mas");nav.push("cobro");}}>Generar cobro</button><button className="adm-btn adm-btn-ghost" style={{flex:1}} onClick={()=>ui.toastify("Nueva experiencia","la autoría completa vive en el panel de computadora")}>+ Experiencia</button></div>
</div>
</div>;}

/* ── EVENTOS · lista ── */
function ScrEventos({S,nav}){
return <div className="adm-screen">
<Head eyebrow="Eventos" title="Las <em>experiencias.</em>"/>
<div className="adm-pad">
<div className="adm-card">
{S.exps.map(e=>{const sal=S.salidas.filter(s=>s.exp===e.id);
return <div className="adm-li" key={e.id}><div className="rowbody" onClick={()=>nav.push("evento",{id:e.id})}>
<div className="r1"><span className="t">{e.nombre}<small>{(S.ops.find(o=>o.id===e.op)||{}).nombre||"propia"} · {sal.length? sal.length+" salida"+(sal.length>1?"s":""):"sin salidas abiertas"}</small></span><span className={"m adm-mono"+(sal.length?"":" adm-mut")}>{sal.length?sal.map(s=>s.ocup+"/"+s.cupo).join(" · "):"—"}</span></div>
<div className="r2">{e.estado==="publicada"?<Chip c="ok" dot>Publicada</Chip>:<Chip c="mut">Borrador</Chip>}
{sal.some(s=>s.privada)&&<Chip c="sol">Privada</Chip>}
{sal.some(s=>s.ocup>0&&s.ocup/s.cupo<.4)&&<Chip c="warn">Necesita ventas</Chip>}
{e.candado.length>0&&<span className="dt">candado: falta {e.candado.length===1?"deslinde":"deslinde y encuesta"}</span>}
</div></div></div>;})}
</div>
</div>
</div>;}

/* ── EVENTOS · detalle ── */
function ScrEvento({S,A,nav,ui,params}){
const e=S.exps.find(x=>x.id===params.id);
if(!e)return <div className="adm-screen"><NavBar onBack={nav.pop} t="Experiencia eliminada" s=""/><div className="adm-pad"><div className="adm-card"><Empty ic="◌" t="Ya no existe" p="Esta experiencia fue eliminada."/></div></div></div>;
const op=S.ops.find(o=>o.id===e.op);
const sal=S.salidas.filter(s=>s.exp===e.id);
return <div className="adm-screen">
<NavBar onBack={nav.pop} t={e.nombre} s={(op?op.nombre:"propia")+" · "+e.estado} right={e.estado==="publicada"?<Chip c="ok" dot>Publicada</Chip>:<Chip c="mut">Borrador</Chip>}/>
<div className="adm-pad">
{sal.length>0&&<Sub pad>Salidas</Sub>}
{sal.length>0&&<div className="adm-card">
{sal.map(s=><details className="adm-li" key={s.id}>
<summary>
<div className="r1"><span className="t">{s.etiqueta}<small>{s.ini}{s.fin!==s.ini?" – "+s.fin:""}</small></span><button className="m adm-mono" style={{textDecoration:"underline",textUnderlineOffset:3,textDecorationColor:"var(--sand)",padding:"4px 0"}} onClick={ev=>{ev.preventDefault();ev.stopPropagation();nav.push("salidaGente",{salida:s.id});}}>{s.ocup} de {s.cupo}</button></div>
<div className="r2">{s.venta==="abierta"?<Chip c="ok" dot>En venta</Chip>:<Chip c="mut">Venta cerrada</Chip>}{s.privada&&<Chip c="sol">Privada</Chip>}<span className="dt">{fmt(s.precio)}/persona</span></div>
</summary>
<div className="adm-x"><div className="adm-acts">
{s.ocup>0&&<button className="adm-btn adm-btn-forest" onClick={()=>nav.push("salidaGente",{salida:s.id})}>Quién va · {s.ocup}</button>}
<button className="adm-btn adm-btn-ghost" onClick={()=>ui.openSheet("editarSalida",{id:s.id})}>Editar</button>
</div></div>
</details>)}
</div>}
<Gap/>
<Sub pad>Experiencia</Sub>
<div className="adm-card adm-menu">
<button className="mrow" onClick={()=>ui.openSheet("operador",{expId:e.id})}><span className="mi">OP</span><span className="grow">Operador<small>{op?op.nombre+" · "+(op.comision==null?"comisión por definir":"comisión "+op.comision+"%"):"sin operador asignado"}</small></span><span className="go">›</span></button>
<button className="mrow" onClick={()=>nav.push("contenido",{id:e.id})}><span className="mi">ED</span><span className="grow">Contenido<small>16 secciones · lectura y edición puntual</small></span><span className="go">›</span></button>
<button className="mrow" onClick={()=>{
if(e.estado==="borrador"&&e.candado.length)ui.openDialog("candado",{exp:e});
else {A.togglePublicar(e.id);ui.toastify(e.estado==="publicada"?"Pasó a borrador":"Publicada",e.nombre);}
}}><span className="mi">PB</span><span className="grow">Publicación<small>{e.estado==="publicada"?"publicada · pasar a borrador":"borrador · publicar"}</small></span><span className="go">›</span></button>
<button className="mrow" onClick={()=>{nav.setTab("mas");nav.push("kit");}}><span className="mi">SA</span><span className="grow">Salidas y material<small>Kit · PDF v/h · flyer · página pública</small></span><span className="go">›</span></button>
<button className="mrow out" onClick={()=>ui.openDialog("eliminarExp",{id:e.id,nombre:e.nombre})}><span className="mi" style={{background:"rgba(255,93,54,.1)",color:"var(--orange)"}}>EL</span><span className="grow">Eliminar la experiencia</span><span className="go">›</span></button>
</div>
</div>
</div>;}

/* ── EVENTOS · contenido 16 secciones ── */
function ScrContenido({S,A,nav,ui,params}){
const e=S.exps.find(x=>x.id===params.id)||S.exps[0];
const [precio,setPrecio]=uS("$2.550"),[nivel,setNivel]=uS("Principiante · 6 km · 2.900 msnm");
const rows=[["Lo básico","listo"],["Portada","listo"],["Banco de fotos","faltan 2","8 tipos · se edita en computadora"],["Ficha científica","listo"],["Itinerario","listo"],["Qué llevar","revisar"],["Registro y deslinde","listo"],["Encuesta","activa"]];
return <div className="adm-screen">
<NavBar onBack={nav.pop} t={"Contenido · "+e.nombre.split(" ")[0]} s="16 secciones"/>
<div className="adm-pad">
<div className="adm-note adm-note-info"><span className="st" style={{background:"var(--sand)"}}></span><span>Aquí corriges lo puntual — un precio, una fecha, un texto. La autoría completa (banco de fotos, ficha científica, pre-llenar con IA) vive en el panel de computadora.</span></div>
<Gap/>
<Sub pad>Comunicación lista · 13 de 16</Sub>
<div className="adm-card">
<details className="adm-li" open>
<summary><div className="r1"><span className="t">Precio y niveles</span><Life e="listo"/></div></summary>
<div className="adm-x">
<Fld l="Precio por persona" val={precio} set={setPrecio} mono/>
<Fld l="Nivel" val={nivel} set={setNivel}/>
<div className="adm-acts"><button className="adm-btn adm-btn-ghost" onClick={nav.pop}>Descartar</button><button className="adm-btn adm-btn-orange" onClick={()=>{ui.toastify("Sección guardada","Precio y niveles · "+e.nombre);}}>Guardar sección</button></div>
</div>
</details>
{rows.map((r,i)=><div className="adm-li" key={i}><div className="rowbody" onClick={()=>ui.toastify(r[0],"edición puntual — demo")}><div className="r1"><span className="t">{r[0]}{r[2]&&<small>{r[2]}</small>}</span><Life e={r[1]}/></div></div></div>)}
<div style={{padding:"10px 16px 16px"}}><button className="adm-btn adm-btn-glass adm-btn-block" onClick={()=>ui.toastify("16 secciones","las restantes se editan igual, sección por sección")}>Ver las 16 secciones</button></div>
</div>
</div>
</div>;}

/* ── SHEETS Y DIÁLOGOS de Eventos ── */
function ShEditarSalida({S,A,ui,params}){
const s=S.salidas.find(x=>x.id===params.id);
const [f,setF]=uS({etiqueta:s.etiqueta,ini:s.ini,fin:s.fin,cupo:String(s.cupo),precio:fmt(s.precio)});
const cupoN=parseInt(f.cupo,10);
const cupoErr=!isNaN(cupoN)&&cupoN<s.ocup;
const ok=!cupoErr&&!isNaN(cupoN);
return <div className="adm-sheet"><div className="grab"></div>
<h2>Editar salida</h2><p className="sd">{s.etiqueta}</p>
<Fld l="Etiqueta" val={f.etiqueta} set={v=>setF({...f,etiqueta:v})}/>
<div className="adm-2col">
<Fld l="Inicio" val={f.ini} set={v=>setF({...f,ini:v})} mono/>
<Fld l="Fin" val={f.fin} set={v=>setF({...f,fin:v})} mono/>
</div>
<div className="adm-2col">
<Fld l="Cupo" val={f.cupo} set={v=>setF({...f,cupo:v})} mono err={cupoErr} hint={cupoErr?`Hay ${s.ocup} lugares ocupados — el cupo no puede quedar abajo de la ocupación.`:""}/>
<Fld l="Precio" val={f.precio} set={v=>setF({...f,precio:v})} mono/>
</div>
<Sub>Venta</Sub>
<div className="adm-acts" style={{paddingTop:8}}>
<button className="adm-btn adm-btn-ghost" onClick={()=>{A.toggleVenta(s.id);ui.toastify(s.venta==="abierta"?"Venta cerrada":"Venta reabierta",s.etiqueta);}}>{s.venta==="abierta"?"Cerrar venta":"Reabrir venta"}</button>
{s.privada&&<button className="adm-btn adm-btn-ghost" onClick={()=>ui.copy(s.link)}>Copiar link privado</button>}
<button className="adm-btn adm-btn-danger" onClick={()=>{
ui.closeSheet();
const res=S.reservas.filter(r=>r.salida===s.id&&r.estado!=="cancelada");
if(res.length)ui.openDialog("rechazoCancelar",{salida:s,res});
else ui.openDialog("confirmCancelarSalida",{id:s.id,etiqueta:s.etiqueta});
}}>Cancelar salida</button>
</div>
<div className="adm-acts" style={{borderTop:"1px solid var(--line)",marginTop:12,paddingTop:14}}><button className="adm-btn adm-btn-ghost" onClick={ui.closeSheet}>Cancelar</button><button className="adm-btn adm-btn-orange" disabled={!ok} onClick={()=>{A.saveSalida(s.id,{etiqueta:f.etiqueta,ini:f.ini,fin:f.fin,cupo:cupoN,precio:parseInt(f.precio.replace(/\D/g,""),10)||s.precio});ui.closeSheet();ui.toastify("Salida guardada",f.etiqueta);}}>Guardar</button></div>
</div>;}

function ShOperador({S,A,ui,params}){
const e=S.exps.find(x=>x.id===params.expId);
const [sel,setSel]=uS(e.op);
const [nuevo,setNuevo]=uS(false);
const [nm,setNm]=uS(""),[mail,setMail]=uS(""),[com,setCom]=uS("15"),[porDef,setPorDef]=uS(false);
return <div className="adm-sheet"><div className="grab"></div>
<h2>Operador de la experiencia</h2><p className="sd">Cobra su comisión sobre lo vendido.</p>
<div className="adm-card" style={{boxShadow:"none"}}>
{S.ops.map(o=><div className="adm-ros" key={o.id} onClick={()=>setSel(o.id)} style={{cursor:"pointer"}}><span className="adm-av">{o.nombre.slice(0,2).toUpperCase()}</span><span className="nm">{o.nombre}<small>{o.comision==null?"comisión por definir":"comisión "+o.comision+"%"+(o.nota?" · "+o.nota:"")}</small></span><span className={"adm-tick"+(sel===o.id?"":" off")}>✓</span></div>)}
</div>
<Gap s/>
{!nuevo?<button className="adm-btn adm-btn-ghost adm-btn-block" onClick={()=>setNuevo(true)}>+ Crear operador nuevo</button>:
<div>
<Fld l="Nombre" val={nm} set={setNm} ph="Nombre del operador"/>
<Fld l="Correo" val={mail} set={setMail} ph="correo@operador.mx" type="email"/>
<div className="adm-fld"><label>Comisión</label>
<div style={{display:"flex",gap:8,alignItems:"center"}}><input className="mono-in" style={{width:90,opacity:porDef?.4:1}} value={porDef?"—":com+" %"} onChange={ev=>setCom(ev.target.value.replace(/\D/g,""))} readOnly={porDef}/><button className={"adm-btn adm-btn-sm "+(porDef?"adm-btn-forest":"adm-btn-ghost")} onClick={()=>setPorDef(!porDef)}>Por definir</button></div>
<span className="hint">«Por definir» bloquea el payout hasta fijarla — nunca se paga con comisión en cero por accidente.</span></div>
</div>}
<div className="adm-acts"><button className="adm-btn adm-btn-ghost" onClick={ui.closeSheet}>Cancelar</button><button className="adm-btn adm-btn-orange" onClick={()=>{
let opId=sel;
if(nuevo&&nm){opId=A.crearOperador(nm,mail,porDef?null:parseInt(com,10)||0);}
A.setOperador(e.id,opId);ui.closeSheet();ui.toastify("Operador guardado",e.nombre);
}}>Guardar</button></div>
</div>;}

function DlgRechazoCancelar({ui,params}){
const {salida,res}=params;
return <div className="adm-dlg">
<h2>No se puede cancelar esta salida</h2>
<p><b>{res.length} reserva{res.length>1?"s":""} está{res.length>1?"n":""} apartando lugar</b> ({res.map(r=>r.persona.split(" ")[0]).join(", ")}). Cancelar borraría su compra sin avisarles.</p>
<div className="adm-lock">
<div className="it"><span className="st" style={{background:"var(--olive)"}}></span><span className="g">Cierra la venta<small>deja de vender sin tocar las reservas</small></span><button className="lnk" onClick={ui.closeDialog}>Cerrar</button></div>
<div className="it"><span className="st" style={{background:"var(--olive)"}}></span><span className="g">Contacta a los reservados<small>si de verdad no saldrá, primero se les avisa y reembolsa</small></span><button className="lnk" onClick={ui.closeDialog}>Ver</button></div>
</div>
<div className="adm-acts"><button className="adm-btn adm-btn-ghost adm-btn-block" onClick={ui.closeDialog}>Entendido</button></div>
</div>;}

function DlgConfirmCancelarSalida({A,ui,params}){
return <div className="adm-dlg">
<h2 style={{color:"#e8431f"}}>¿Cancelar «{params.etiqueta}»?</h2>
<p>No tiene reservas — se puede soltar sin costo. Desaparece de la venta.</p>
<div className="adm-acts"><button className="adm-btn adm-btn-ghost" onClick={ui.closeDialog}>Conservar</button><button className="adm-btn adm-btn-orange" onClick={()=>{A.cancelarSalida(params.id);ui.closeDialog();ui.toastify("Salida cancelada",params.etiqueta);}}>Cancelar salida</button></div>
</div>;}

function DlgCandado({S,A,ui,nav,params}){
const e=S.exps.find(x=>x.id===params.exp.id)||params.exp;
return <div className="adm-dlg">
<Eyebrow>Casi lista</Eyebrow>
<h2 style={{marginTop:8}}>A {e.nombre.replace("Hike ","")} le falta{e.candado.length>1?"n":""} {e.candado.length} cosa{e.candado.length>1?"s":""} para publicarse</h2>
<p>Es el estándar de la casa: nadie compra sin deslinde ni se va sin encuesta.</p>
<div className="adm-lock">
{e.candado.map((c,i)=><div className="it" key={i}><span className="st" style={{background:"var(--orange)"}}></span><span className="g">{c}<small>{c.includes("Deslinde")?"falta el documento de la experiencia":"actívala o hereda la general"}</small></span><button className="lnk" onClick={()=>{A.resolverCandado(e.id,c);ui.toastify(c,"resuelto — demo");}}>{c.includes("Deslinde")?"Completar":"Activar"}</button></div>)}
<div className="it"><span className="st" style={{background:"var(--olive)"}}></span><span className="g">Todo lo demás está listo<small>portada, precio, fechas, itinerario</small></span></div>
</div>
<div className="adm-acts">
<button className="adm-btn adm-btn-ghost" style={{flex:1}} onClick={ui.closeDialog}>Volver</button>
{e.candado.length===0&&<button className="adm-btn adm-btn-orange" style={{flex:1}} onClick={()=>{A.togglePublicar(e.id);ui.closeDialog();ui.toastify("Publicada",e.nombre);}}>Publicar</button>}
</div>
</div>;}

function DlgEliminarExp({A,ui,nav,params}){
const [txt,setTxt]=uS("");
return <div className="adm-dlg">
<h2 style={{color:"#e8431f"}}>¿Eliminar «{params.nombre}»?</h2>
<p>Se borra la experiencia, su contenido y su material de comunicación. <b>No se puede deshacer.</b> Sus salidas pasadas y pagos quedan en el historial de Dinero.</p>
<div className="adm-fld" style={{paddingTop:14}}><label>Escribe ELIMINAR para confirmar</label><input className="mono-in" value={txt} onChange={e=>setTxt(e.target.value)} placeholder="ELIMINAR"/></div>
<div className="adm-acts"><button className="adm-btn adm-btn-ghost" onClick={ui.closeDialog}>Conservar</button><button className="adm-btn adm-btn-orange" disabled={txt.trim().toUpperCase()!=="ELIMINAR"} onClick={()=>{A.eliminarExp(params.id);ui.closeDialog();nav.pop();ui.toastify("Experiencia eliminada",params.nombre);}}>Eliminar</button></div>
</div>;}

Object.assign(window,{ScrPanorama,ScrEventos,ScrEvento,ScrContenido,ShEditarSalida,ShOperador,DlgRechazoCancelar,DlgConfirmCancelarSalida,DlgCandado,DlgEliminarExp});
