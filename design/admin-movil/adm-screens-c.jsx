const {useState:uSc,useEffect:uEc,useRef:uRc} = React;

/* ── MÁS · raíz ── */
function ScrMas({S,nav,ui}){
const pend=S.solicitudes.filter(q=>q.estado==="pendiente").length;
return <div className="adm-screen">
<Head eyebrow="Más" title="Todo lo <em>demás.</em>"/>
<div className="adm-pad">
<div className="adm-card adm-menu">
<button className="mrow" onClick={()=>nav.push("comunicacion")}><span className="mi">CO</span><span className="grow">Comunicación<small>cola de redes · kits por experiencia · boletín</small></span><span className="go">›</span></button>
<button className="mrow" onClick={()=>nav.push("solicitudes")}><span className="mi">SO</span><span className="grow">Solicitudes<small>fechas · acceso de operador · embajadores</small></span>{pend>0?<span className="nbd">{pend}</span>:<span className="go">›</span>}</button>
<button className="mrow" onClick={()=>nav.push("operador")}><span className="mi">OP</span><span className="grow">Operador<small>perfil público · alta white-label</small></span><span className="go">›</span></button>
<button className="mrow" onClick={()=>nav.push("cobro")}><span className="mi">$</span><span className="grow">Generar cobro<small>link de pago por WhatsApp</small></span><span className="go">›</span></button>
<button className="mrow out" onClick={()=>ui.toastify("Sesión","aquí cerraría la sesión")}><span className="mi" style={{background:"rgba(255,93,54,.1)",color:"var(--orange)"}}>SA</span><span className="grow">Salir</span></button>
</div>
<Gap/>
<p className="adm-mut" style={{fontSize:11.5,textAlign:"center",lineHeight:1.6}}>CAMINANTE · Modo admin · v3.0<br/>Numan Hub S.A. de C.V.</p>
</div>
</div>;}

/* ── COMUNICACIÓN ── */
function ScrComunicacion({S,A,nav,ui}){
const [vista,setVista]=uSc("Lista");
const grupos=[["Programadas","programada"],["Falló","falló"],["Publicadas","publicada"]];
return <div className="adm-screen">
<NavBar onBack={nav.pop} t="Comunicación" s="cola global de redes"/>
<div className="adm-pad">
<Seg opts={["Lista","Calendario"]} val={vista} set={setVista}/>
<Gap/>
{vista==="Lista"?<>
{grupos.map(([lbl,est])=>{const items=S.cola.filter(c=>c.estado===est);if(!items.length)return null;
return <div key={est}><Sub pad>{lbl} · {items.length}</Sub>
<div className="adm-card">
{items.map(c=><div className="adm-li" key={c.id}><div className="rowbody">
<div className="r1"><span className="t">{c.t}<small>{c.sub}</small></span>{c.cuando&&<span className="m adm-mono" style={{fontSize:12}}>{c.cuando}</span>}</div>
<div className="r2"><Life e={est==="programada"?"programada":est}/>
{est==="programada"&&<button className="adm-btn adm-btn-ghost adm-btn-sm" style={{marginLeft:"auto"}} onClick={()=>{A.cancelarPieza(c.id);ui.toastify("Publicación cancelada",c.t);}}>Cancelar publicación</button>}
{est==="falló"&&<button className="adm-btn adm-btn-ghost adm-btn-sm" style={{marginLeft:"auto"}} onClick={()=>{A.reintentarPieza(c.id);ui.toastify("Reintentando",c.t+" · reprogramada");}}>Reintentar</button>}
</div>
</div></div>)}
</div><Gap/></div>;})}
<Sub pad>Por evento</Sub>
<div className="adm-card">
<details className="adm-li" open>
<summary><div className="r1"><span className="t">Recolección de hongos</span><Chip c="ok">12 piezas</Chip></div></summary>
<div className="adm-x"><div className="adm-acts">
<button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={()=>nav.push("kit")}>Abrir Kit</button>
{["PDF vertical","PDF horizontal","Flyer redes","Ver evento"].map(x=><button key={x} className="adm-btn adm-btn-ghost adm-btn-sm" onClick={()=>ui.toastify(x,"se genera — demo")}>{x}</button>)}
</div></div>
</details>
<div className="adm-li"><div className="rowbody" onClick={()=>ui.toastify("Kit de Barrancas","5 piezas — demo")}><div className="r1"><span className="t">Trekking Barrancas del Cobre</span><Chip c="sol">5 piezas</Chip></div></div></div>
</div>
</>:<>
<div className="adm-card adm-cal">
<div className="mh"><span>Agosto 2026</span><span className="adm-mono" style={{fontSize:11,color:"var(--ink-soft)"}}>‹ ›</span></div>
<div className="gridc">
{["L","M","M","J","V","S","D"].map((d,i)=><span className="dh" key={i}>{d}</span>)}
{[27,28,29,30,31].map(d=><span className="d mut" key={"p"+d}>{d}</span>)}
{Array.from({length:30},(_,i)=>i+1).map(d=>{
const has={5:"var(--forest)",7:"var(--forest)",11:"#1c6f6a",12:"#1c6f6a",18:"#1c6f6a",23:"var(--orange)"}[d];
return <span key={d} className={"d"+(has?" has":"")+(d===9?" today":"")}>{d}{has&&<i style={{background:has}}></i>}</span>;})}
</div>
</div>
<Gap s/>
<div className="adm-card">
<div className="adm-li"><div className="rowbody"><div className="r1"><span className="t">mar 11 · 9:00<small>Hongos · M2 · dato gigante · Post 4:5</small></span><Life e="prog."/></div></div></div>
<div className="adm-li"><div className="rowbody"><div className="r1"><span className="t">sáb 23 · 8:00<small>Hongos · salida — el evento, no una pieza</small></span><Chip c="warn">salida</Chip></div></div></div>
</div>
</>}
</div>
</div>;}

/* ── KIT ── */
function ScrKit({S,A,nav,ui}){
const [ia,setIa]=uSc(null);
const iaRef=uRc(null);
uEc(()=>()=>clearInterval(iaRef.current),[]);
const startIA=()=>{if(ia!=null)return;setIa(7);iaRef.current=setInterval(()=>setIa(v=>{if(v>=18){clearInterval(iaRef.current);ui.toastify("Captions listos","18 de 18 generados");A.captionsListos();return null;}return v+1;}),700);};
const k=S.kit;
const kpi={listas:k.filter(p=>["lista","programada","publicada"].includes(p.estado)).length,cap:k.filter(p=>p.cap).length,prog:k.filter(p=>p.estado==="programada").length,pub:k.filter(p=>p.estado==="publicada").length};
const moms=[...new Set(k.map(p=>p.mom))];
const [bolPaso,setBolPaso]=uSc(1);
return <div className="adm-screen">
<NavBar onBack={nav.pop} t="Kit · Hongos" s="17 piezas · 4 momentos" right={<Chip c="ok" dot>@caminante.mx</Chip>}/>
<div className="adm-pad">
<div className="adm-card adm-kpi4">
{[["listas",kpi.listas],["con caption",kpi.cap],["programadas",kpi.prog],["publicadas",kpi.pub]].map(([l,v])=><div key={l}><span className="adm-mono">{v}</span><br/><small>{l}</small></div>)}
</div>
<Gap s/>
<div className="adm-filters">
<button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={()=>ui.toastify("Formato","Post 4:5 ↔ Story 9:16 — demo")}>Post 4:5 / Story 9:16</button>
<button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={startIA}>Captions con IA</button>
<button className="adm-btn adm-btn-orange adm-btn-sm" onClick={()=>ui.openDialog("confirmLote",{n:kpi.listas,que:"programación de campaña completa · "+kpi.listas+" piezas",accion:()=>A.programarCampana()})}>Programar campaña</button>
<button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={()=>ui.toastify("Material","PDF y flyer — demo")}>Material</button>
</div>
{ia!=null&&<div className="adm-card" style={{padding:"13px 16px"}}>
<div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:8}}><b>Generando captions con IA</b><span className="adm-mono">{ia} de 18</span></div>
<div className="adm-prog"><i style={{width:(ia/18*100)+"%"}}></i></div>
<p className="adm-mut" style={{fontSize:11.5,marginTop:8}}>Corre por lotes — puedes salir de esta pantalla.</p>
</div>}
<Gap/>
{moms.map(mom=><div key={mom}>
<Sub pad>{mom} · {k.filter(p=>p.mom===mom).length} pieza{k.filter(p=>p.mom===mom).length>1?"s":""}</Sub>
<div className="adm-card">
{k.filter(p=>p.mom===mom).map(p=><details className="adm-li" key={p.id}>
<summary><div className="r1"><span style={{width:40,height:50,borderRadius:8,background:p.tono,flexShrink:0,border:p.estado==="falta insumo"?"1.5px dashed var(--sand)":"none"}}></span><span className="t">{p.t}<small>{p.sub}</small></span><Life e={p.estado}/></div></summary>
<div className="adm-x">
{p.cap?<p style={{fontSize:12.5,lineHeight:1.5,color:"var(--ink-soft)",padding:"10px 0 2px"}}>{p.cap}</p>:<p style={{fontSize:12.5,color:"var(--ink-soft)",padding:"10px 0 2px"}}>{p.estado==="falta insumo"?"Falta el insumo — se completa en computadora.":"Sin caption — usa «Captions con IA»."}</p>}
<div className="adm-acts">
<button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={()=>ui.toastify("Vista previa",p.t)}>Vista previa</button>
<button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={()=>ui.toastify("Descargada",p.t)}>Descargar</button>
{p.estado==="lista"&&<button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={()=>{A.pieza(p.id,"programada");ui.toastify("Programada",p.t+" · mañana 9:00");}}>Programar</button>}
{p.estado==="lista"&&<button className="adm-btn adm-btn-orange adm-btn-sm" onClick={()=>{A.pieza(p.id,"publicada");ui.toastify("Publicada ahora",p.t+" · @caminante.mx");}}>Publicar ahora</button>}
{p.estado==="programada"&&<button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={()=>{A.pieza(p.id,"lista");ui.toastify("Programación cancelada",p.t);}}>Cancelar programación</button>}
</div>
</div>
</details>)}
</div><Gap/></div>)}
<Sub pad>Boletín</Sub>
<div className="adm-card" style={{padding:"14px 16px"}}>
<div className="adm-steps"><b className={bolPaso===1?"":"off"}>1</b> Plantilla y prueba <i></i> <b className={bolPaso===2?"":"off"}>2</b> Envío real</div>
{bolPaso===1?<>
<p className="adm-mut" style={{fontSize:12,lineHeight:1.5,margin:"10px 0"}}>«La Carta · agosto» pre-llenada con esta experiencia. Mándate la prueba antes del paso 2.</p>
<div style={{display:"flex",gap:8}}><button className="adm-btn adm-btn-ghost adm-btn-sm" style={{flex:1}} onClick={()=>ui.toastify("Prueba enviada","a tu correo · revísala antes del envío real")}>Prueba a mí</button><button className="adm-btn adm-btn-orange adm-btn-sm" style={{flex:1}} onClick={()=>setBolPaso(2)}>Continuar · 214 suscriptores</button></div>
</>:<>
<p style={{fontSize:13,lineHeight:1.55,margin:"10px 0"}}><b>Vas a enviar «La Carta · agosto» a 214 suscriptores.</b><br/><span className="adm-mut" style={{fontSize:12}}>Envío real, una sola vez. No se puede deshacer.</span></p>
<div style={{display:"flex",gap:8}}><button className="adm-btn adm-btn-ghost adm-btn-sm" style={{flex:1}} onClick={()=>setBolPaso(1)}>Volver</button><button className="adm-btn adm-btn-orange adm-btn-sm" style={{flex:1}} onClick={()=>{setBolPaso(1);ui.toastify("Boletín enviado","214 suscriptores · La Carta · agosto");}}>Enviar a 214</button></div>
</>}
</div>
</div>
</div>;}

/* ── SOLICITUDES ── */
function ScrSolicitudes({S,A,nav,ui}){
const [bandeja,setBandeja]=uSc("fecha");
const cnt=b=>S.solicitudes.filter(q=>q.bandeja===b&&q.estado==="pendiente").length;
const tabs=[["fecha","Fechas"],["operador","Operador"],["embajador","Embajador"]];
const list=S.solicitudes.filter(q=>q.bandeja===bandeja&&q.estado!=="rechazada");
return <div className="adm-screen">
<NavBar onBack={nav.pop} t="Solicitudes" s={S.solicitudes.filter(q=>q.estado==="pendiente").length+" pendientes"}/>
<div className="adm-pad">
<div className="adm-seg">{tabs.map(([id,lbl])=><button key={id} className={bandeja===id?"on":""} onClick={()=>setBandeja(id)}>{lbl}{cnt(id)>0?" · "+cnt(id):""}</button>)}</div>
<Gap/>
{list.length===0?<div className="adm-card"><Empty ic="◌" t="Sin solicitudes pendientes" p="Cuando alguien pida una fecha, acceso o entrar al programa, aparece aquí."/></div>:
<div className="adm-card">
{list.map(q=><details className="adm-li" key={q.id} open>
<summary>
<div className="r1"><span className="t">{q.titulo}<small>{q.sub}</small></span></div>
<div className="r2">{q.estado==="pendiente"?<Chip c="sol">Pendiente · {q.hace}</Chip>:<Chip c="ok" dot>Aprobada</Chip>}</div>
</summary>
<div className="adm-x">
{q.estado==="pendiente"?<div className="adm-acts">
<button className="adm-btn adm-btn-orange" onClick={()=>{A.aprobarSolicitud(q.id);ui.toastify("Aprobada",q.bandeja==="fecha"?"salida creada — el link queda guardado abajo":q.bandeja==="embajador"?q.titulo+" · alta como operador":q.titulo+" · acceso concedido");}}>{q.bandeja==="fecha"?"Aprobar · crear salida":q.bandeja==="embajador"?"Aprobar · alta como operador":"Aprobar acceso"}</button>
<button className="adm-btn adm-btn-ghost" onClick={()=>{A.rechazarSolicitud(q.id);ui.toastify("Rechazada",q.titulo);}}>Rechazar</button>
</div>:q.link?<>
<Sub>Link y mensaje — quedan guardados aquí, no desaparecen</Sub>
<div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
<CopyBox v={q.link} ui={ui}/>
<CopyBox v={q.msg} txt ui={ui}/>
</div>
</>:<p style={{fontSize:12.5,color:"var(--ink-soft)",padding:"8px 0"}}>Resuelta.</p>}
</div>
</details>)}
</div>}
<Gap/>
<Sub pad>Histórico</Sub>
<div className="adm-card">
{S.historico.map((h,i)=><div className="adm-ros" key={i}><span className={"adm-tick"+(h[0]==="✕"?" off":"")}>{h[0]}</span><span className="nm">{h[1]}<small>{h[2]}</small></span></div>)}
{S.solicitudes.filter(q=>q.estado==="rechazada").map(q=><div className="adm-ros" key={q.id}><span className="adm-tick off">✕</span><span className="nm">{q.titulo}<small>rechazada · hoy</small></span></div>)}
</div>
</div>
</div>;}

/* ── OPERADOR white-label ── */
function ScrOperadorWL({S,nav,ui}){
const [c1,setC1]=uSc("#123C4F"),[c2,setC2]=uSc("#E0B23C"),[nm,setNm]=uSc("Kéntro Expediciones");
return <div className="adm-screen">
<NavBar onBack={nav.pop} t="Alta de operador externo" s="white-label"/>
<div className="adm-pad">
<Sub pad>Identidad</Sub>
<div className="adm-card" style={{padding:"4px 16px 14px"}}>
<Fld l="Nombre público" val={nm} set={setNm}/>
<Fld l="Entidad legal" val="Kéntro S.A.P.I. de C.V." set={()=>{}}/>
<Fld l="Trato" val="Comisión 0% hasta dic 2026, luego 12%" set={()=>{}}/>
</div>
<Gap/>
<Sub pad>Marca · vista previa en vivo</Sub>
<div className="adm-card" style={{padding:"14px 16px"}}>
<div className="adm-swatch">
<div className="sw"><i style={{background:c1}}></i><input value={c1} onChange={e=>setC1(e.target.value)}/></div>
<div className="sw"><i style={{background:c2}}></i><input value={c2} onChange={e=>setC2(e.target.value)}/></div>
</div>
<Gap s/>
<div className="adm-prev">
<div className="hero" style={{background:`linear-gradient(160deg,${c1},${c1}cc)`}}><span>{nm.split(" ")[0].toUpperCase()}</span></div>
<div className="body"><button className="adm-btn" style={{background:c2,color:c1}}>Reservar</button><small>Así se ve su página de venta con logo y sus dos colores.</small></div>
</div>
</div>
<Gap/>
<Sub pad>Sus experiencias</Sub>
<div className="adm-card">
<div className="adm-ros"><span className="adm-tick">✓</span><span className="nm">Hacienda y hongos · Kentro</span></div>
<div className="adm-ros"><span className="adm-tick off">✓</span><span className="nm">Volcanes</span></div>
</div>
<Gap/>
<div style={{display:"flex",gap:10}}>
<button className="adm-btn adm-btn-ghost" style={{flex:1}} onClick={()=>ui.toastify("Vista previa","página pública — demo")}>Vista previa</button>
<button className="adm-btn adm-btn-ghost" style={{flex:1}} onClick={()=>ui.toastify("Borrador guardado",nm)}>Guardar</button>
<button className="adm-btn adm-btn-orange" style={{flex:1}} onClick={()=>ui.toastify("Publicado",nm+" · perfil en vivo")}>Publicar</button>
</div>
</div>
</div>;}

/* ── GENERAR COBRO ── */
function ScrCobro({S,A,nav,ui}){
const [f,setF]=uSc({salida:"Hongos · 23 ago",nombre:"",pax:"1",mail:"",tel:""});
const [gen,setGen]=uSc(null);
const [cargando,setCargando]=uSc(false);
const precio=2550*(parseInt(f.pax,10)||1);
const ok=f.nombre.trim()&&f.mail.trim();
const generar=()=>{setCargando(true);setTimeout(()=>{
const slug=f.nombre.trim().toLowerCase().split(" ")[0].replace(/[^a-z]/g,"")||"cliente";
const g={link:"pay.caminante.mx/"+slug+"-hongos23",msg:`Hola ${f.nombre.trim().split(" ")[0]} — aquí puedes apartar ${f.pax==="1"?"tu lugar":"sus "+f.pax+" lugares"} para Hongos (23 ago), ${fmt(precio)} en total: pay.caminante.mx/${slug}-hongos23`};
setGen(g);setCargando(false);A.nuevoCobro(f,g);
},1800);};
return <div className="adm-screen">
<NavBar onBack={nav.pop} t="Generar cobro" s="link de pago por WhatsApp"/>
<div className="adm-pad">
<div className="adm-card" style={{padding:"4px 16px 14px"}}>
<Fld l="Experiencia · salida" val={f.salida} set={v=>setF({...f,salida:v})}/>
<div className="adm-2col">
<Fld l="Nombre" val={f.nombre} set={v=>setF({...f,nombre:v})} ph="Nombre del cliente"/>
<Fld l="Personas" val={f.pax} set={v=>setF({...f,pax:v.replace(/\D/g,"")||"1"})} mono/>
</div>
<Fld l="Correo" val={f.mail} set={v=>setF({...f,mail:v})} ph="correo@cliente.mx" type="email"/>
<Fld l="Teléfono" val={f.tel} set={v=>setF({...f,tel:v})} ph="55 0000 0000" type="tel"/>
<div className="adm-acts"><button className="adm-btn adm-btn-orange adm-btn-block" disabled={!ok||cargando} onClick={generar}>{cargando?"Generando…":"Generar link · "+fmt(precio)}</button></div>
{cargando&&<div className="adm-load-note" style={{paddingTop:6}}><span className="adm-spin"></span>Generando el cobro… la primera vez tarda hasta 20 s. No cierres — te avisamos aquí.</div>}
</div>
{gen&&<><Gap/>
<Sub pad>Listo para mandar</Sub>
<div className="adm-card" style={{padding:"14px 16px"}}>
<div style={{display:"flex",flexDirection:"column",gap:8}}>
<CopyBox v={gen.link} ui={ui}/>
<CopyBox v={gen.msg} txt ui={ui}/>
</div>
</div></>}
{S.cobros.length>0&&<><Gap/>
<Sub pad>Cobros generados</Sub>
<div className="adm-card">
{S.cobros.map((c,i)=><div className="adm-ros" key={i}><span className="adm-av">{c.f.nombre.trim().slice(0,2).toUpperCase()}</span><span className="nm">{c.f.nombre}<small>{c.f.salida} · {c.g.link}</small></span><button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={()=>ui.copy(c.g.link)}>Copiar</button></div>)}
</div></>}
</div>
</div>;}

Object.assign(window,{ScrMas,ScrComunicacion,ScrKit,ScrSolicitudes,ScrOperadorWL,ScrCobro});
