const {useState:uSb} = React;

/* ── GENTE (raíz con segmentos) ── */
function ScrGente({S,A,nav,ui}){
const [seg,setSeg]=uSb("Reservas");
return <div className="adm-screen">
<Head eyebrow="Gente" title="Quién <em>viene.</em>"/>
<div className="adm-pad">
<Seg opts={["Reservas","Personas","Encuesta"]} val={seg} set={v=>{if(v==="Encuesta"){nav.push("encuesta");}else setSeg(v);}}/>
<Gap/>
{seg==="Reservas"&&<GenteReservas S={S} A={A} ui={ui} nav={nav}/>}
{seg==="Personas"&&<GentePersonas S={S} nav={nav}/>}
</div>
</div>;}

function GenteReservas({S,A,ui,nav}){
const [filtro,setFiltro]=uSb("Todas");
const map={Pagadas:"pagada",Confirmadas:"confirmada",Pendientes:"pendiente",Canceladas:"cancelada"};
const list=S.reservas.filter(r=>filtro==="Todas"||r.estado===map[filtro]||(filtro==="Pendientes"&&r.estado==="anticipo"));
const chipDe=r=>({pagada:<Chip c="ok" dot>Pagada</Chip>,anticipo:<Chip c="sol">Anticipo 50%</Chip>,pendiente:<Chip c="sol">Pendiente</Chip>,confirmada:<Chip c="mut">Confirmada</Chip>,cancelada:<Chip c="mut">Cancelada</Chip>}[r.estado]);
return <div>
<div className="adm-filters">{["Todas","Pagadas","Confirmadas","Pendientes","Canceladas"].map(f=><button key={f} className={"adm-btn adm-btn-sm "+(filtro===f?"adm-btn-forest":"adm-btn-ghost")} onClick={()=>setFiltro(f)}>{f}{f==="Todas"?" · "+S.reservas.length:""}</button>)}</div>
{list.length===0?<div className="adm-card"><Empty ic="◌" t={"Sin reservas "+filtro.toLowerCase()} p="Cuando exista una, aparece aquí."/></div>:
<div className="adm-card">
{list.map(r=>{const debe=r.total-r.pagado;
return <details className="adm-li" key={r.id}>
<summary>
<div className="r1"><span className="t">{r.persona}<small>{r.expLabel} · {r.pax} persona{r.pax>1?"s":""}</small></span><span className={"m adm-mono"+(debe>0&&r.estado!=="cancelada"?" neg":"")}>{r.estado==="cancelada"?"—":debe>0?(r.pagado>0?"debe "+fmt(debe):"sin pago"):fmt(r.total)}</span></div>
<div className="r2">{chipDe(r)}{!r.deslinde&&r.estado!=="cancelada"&&<Chip c="warn">Deslinde pendiente</Chip>}<span className="dt">{r.canal}</span></div>
</summary>
<div className="adm-x"><div className="adm-acts">
{debe>0&&r.estado!=="cancelada"&&<button className="adm-btn adm-btn-orange" onClick={()=>ui.openSheet("regPago",{id:r.id})}>Registrar pago</button>}
<button className="adm-btn adm-btn-ghost" onClick={()=>nav.push("persona",{nombre:r.persona})}>Expediente</button>
{!r.deslinde&&r.estado!=="cancelada"&&<button className="adm-btn adm-btn-ghost" onClick={()=>ui.openDialog("recordarFirma",{quien:r.persona})}>Recordar firma</button>}
{r.estado!=="cancelada"&&<button className="adm-btn adm-btn-danger" onClick={()=>ui.openDialog("cancelarReserva",{id:r.id,r})}>Cancelar reserva</button>}
</div></div>
</details>;})}
</div>}
</div>;}

function GentePersonas({S,nav}){
return <div className="adm-card">
{S.personas.map(p=><div className="adm-ros" key={p.id} onClick={()=>nav.push("persona",{nombre:p.nombre})} style={{cursor:"pointer"}}>
<span className="adm-av">{p.ini}</span><span className="nm">{p.nombre}<small>{p.viajes} {p.viajes===1?"viaje":"viajes"} · desde {p.desde}</small></span>
<Chip c={p.tag==="Debe"?"warn":p.tag==="Nueva"?"mut":"ok"}>{p.tag}</Chip>
</div>)}
</div>;}

function ScrPersona({S,nav,params}){
const p=S.personas.find(x=>x.nombre===params.nombre)||{nombre:params.nombre,ini:params.nombre.split(" ").map(w=>w[0]).join("").slice(0,2),viajes:1,desde:2026,total:0,mail:"—",tel:"—",firmas:[],comp:[],reviews:[]};
const res=S.reservas.filter(r=>r.persona===p.nombre);
return <div className="adm-screen">
<NavBar onBack={nav.pop} t={p.nombre} s={"desde "+p.desde+" · "+p.viajes+" "+(p.viajes===1?"viaje":"viajes")}/>
<div className="adm-pad">
<div className="adm-card" style={{padding:16,display:"flex",alignItems:"center",gap:14}}>
<span className="adm-av" style={{width:46,height:46,fontSize:15}}>{p.ini}</span>
<div style={{flex:1}}><b style={{fontSize:16}}>{p.nombre}</b><br/><span className="adm-mut" style={{fontSize:12.5}}>{p.mail} · {p.tel}</span></div>
<span className="adm-mono" style={{fontSize:17}}>{fmt(p.total)}</span>
</div>
<Gap/>
<Sub pad>Sus reservas</Sub>
<div className="adm-card">
{res.length===0?<Empty ic="◌" t="Sin reservas" p="Todavía no reserva ninguna salida."/>:res.map(r=><div className="adm-li" key={r.id}><div className="rowbody"><div className="r1"><span className="t">{r.expLabel}<small>{r.pax} persona{r.pax>1?"s":""}</small></span><span className="m adm-mono">{fmt(r.total)}</span></div><div className="r2">{r.estado==="pagada"?<Chip c="ok" dot>Pagada</Chip>:<Chip c="sol">{r.estado}</Chip>}</div></div></div>)}
</div>
<Gap/>
<Sub pad>Deslindes firmados</Sub>
<div className="adm-card">
{p.firmas.length===0?<Empty ic="◌" t="Sin firmas" p="No ha firmado ningún deslinde."/>:p.firmas.map((f,i)=><div className="adm-ros" key={i}><span className="adm-tick">✓</span><span className="nm">{f[0]}<small>firmado {f[1]}</small></span></div>)}
</div>
{p.comp.length>0&&<><Gap/><Sub pad>Acompañantes guardados</Sub>
<div className="adm-card">{p.comp.map((c,i)=><div className="adm-ros" key={i}><span className="adm-av">{c[0].split(" ").map(w=>w[0]).join("").slice(0,2)}</span><span className="nm">{c[0]}<small>{c[1]}</small></span></div>)}</div></>}
<Gap/>
<Sub pad>Encuestas de satisfacción</Sub>
<div className="adm-card">
{(p.reviews||[]).length===0?<Empty ic="◌" t="Sin respuestas todavía" p="Cuando conteste una encuesta, su calificación y comentario viven aquí."/>:
(p.reviews||[]).map((r,i)=><div key={i} style={{padding:"14px 16px",borderBottom:i<p.reviews.length-1?"1px solid var(--line)":"none"}}>
<div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:6}}><b style={{flex:1,fontSize:14}}>{r.exp}</b><span className="adm-mono" style={{fontSize:13}}>{r.rating}/5 · NPS {r.nps}</span></div>
<p style={{fontSize:14,fontStyle:"italic",lineHeight:1.5}}>{r.txt}</p>
<p className="adm-mut" style={{fontSize:11.5,marginTop:5}}>{r.fecha}</p>
</div>)}
</div>
</div>
</div>;}

/* ── ROSTER modo campo ── */
function ScrRoster({S,A,nav,ui,params}){
const [n,setN]=uSb(4);
const sal=params&&params.salida?S.salidas.find(x=>x.id===params.salida):S.salidas.find(x=>x.id==="s1");
const exp=sal?S.exps.find(e=>e.id===sal.exp):null;
const esHoy=!sal||sal.id==="s1";
if(!esHoy)return <div className="adm-screen adm-fieldmode">
<NavBar onBack={nav.pop} t={"Roster · "+(sal?sal.etiqueta:"")} s={exp?exp.nombre:""}/>
<div className="adm-pad">
<div className="adm-card"><Empty ic="◌" t="Esta salida aún no tiene roster" p="El roster se arma con los deslindes firmados. Cuando la gente de esta salida firme, sus datos de campo aparecen aquí." btn={<button className="adm-btn adm-btn-ghost" onClick={()=>ui.openDialog("recordarFirma",{n:2,quien:"los pendientes de "+(sal?sal.etiqueta:"la salida")})}>Recordar firmas</button>}/></div>
</div>
</div>;
const sinFirmar=S.roster.filter(r=>!r.firmo).length;
return <div className="adm-screen adm-fieldmode">
<NavBar onBack={nav.pop} t="Roster · Hongos · hoy" s={S.roster.length+" registradas · modo campo"}/>
<div className="adm-pad">
<Head eyebrow="Roster · Hongos · hoy" title={S.roster.length+" personas, <em>"+sinFirmar+" sin firmar.</em>"} />
<Gap s/>
<div className="adm-note adm-note-info"><span className="st" style={{background:"var(--olive)"}}></span><span>Lista guardada en el teléfono a las 6:40 — funciona sin señal.</span></div>
<Gap s/>
<div style={{display:"flex",gap:10}}><button className="adm-btn adm-btn-ghost" style={{flex:1}} onClick={()=>ui.toastify("Imprimir","se abre el diálogo del sistema")}>Imprimir</button><button className="adm-btn adm-btn-ghost" style={{flex:1}} onClick={()=>ui.toastify("CSV descargado","roster-hongos-9ago.csv")}>Descargar CSV</button></div>
<Gap/>
<Sub pad>Toca el círculo al abordar</Sub>
<div className="adm-card">
{S.roster.slice(0,n).map((r,i)=><div className="adm-fros" key={i}>
<div className="r1"><b style={r.in?{opacity:.45,textDecoration:"line-through"}:null}>{r.n}</b><button className={"adm-tick"+(r.in?"":" off")} style={{width:38,height:38,fontSize:16}} onClick={()=>A.marcarEntrada(i)}>✓</button></div>
<a className="tel" href={"tel:"+r.tel.replace(/\s/g,"")}>{r.tel}</a>
<span className="em">Emergencia · <b>{r.em}</b></span>
{r.med&&<span className="med">{r.med}</span>}
{!r.firmo&&<button className="adm-btn adm-btn-ghost adm-btn-sm" style={{alignSelf:"flex-start"}} onClick={()=>ui.openDialog("recordarFirma",{quien:r.n})}>Recordar firma</button>}
</div>)}
{n<S.roster.length&&<div style={{padding:"12px 16px 16px"}}><button className="adm-btn adm-btn-glass adm-btn-block" onClick={()=>setN(S.roster.length)}>Ver las {S.roster.length-n} restantes</button></div>}
</div>
</div>
</div>;}

/* ── ENCUESTA ── */
function ScrEncuesta({S,A,nav,ui}){
return <div className="adm-screen">
<NavBar onBack={nav.pop} t="Encuesta" s="firmas, respuestas y testimonios"/>
<div className="adm-pad">
<Sub pad>1 · Deslindes pendientes · {S.deslPend.length}</Sub>
<div className="adm-card">
{S.deslPend.length===0?<Empty ic="✓" t="Todos firmaron" p="No hay deslindes pendientes."/>:<>
{S.deslPend.slice(0,3).map(d=><div className="adm-ros" key={d.id}><span className="adm-av">{d.ini}</span><span className="nm">{d.n}<small>{d.sub}</small></span><button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={()=>ui.openDialog("recordarFirma",{quien:d.n,accion:()=>A.quitarDeslinde(d.id)})}>Recordar</button></div>)}
<div style={{padding:"10px 16px 16px"}}><button className="adm-btn adm-btn-orange adm-btn-block" onClick={()=>ui.openDialog("recordarFirma",{n:S.deslPend.length,quien:S.deslPend.length+" personas",accion:()=>A.limpiarDeslindes()})}>Recordar a los {S.deslPend.length}</button></div></>}
</div>
<Gap/>
<Sub pad>2 · Encuestas sin responder · {S.encPend.reduce((a,e)=>a+e.cnt,0)}</Sub>
<div className="adm-card">
{S.encPend.length===0?<Empty ic="✓" t="Todas respondidas" p="No hay encuestas pendientes."/>:<>
{S.encPend.map(e=><div className="adm-ros" key={e.id}><span className="adm-av">{e.ini}</span><span className="nm">{e.n}<small>{e.sub}</small></span><button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={()=>ui.openDialog("confirmLote",{n:e.cnt,que:"reenvío de encuesta · "+e.n,accion:()=>A.quitarEnc(e.id)})}>Reenviar</button></div>)}
<div style={{padding:"10px 16px 16px"}}><button className="adm-btn adm-btn-ghost adm-btn-block" onClick={()=>ui.openDialog("confirmLote",{n:S.encPend.reduce((a,e)=>a+e.cnt,0),que:"reenvío de encuesta",accion:()=>A.limpiarEnc()})}>Reenviar a los {S.encPend.reduce((a,e)=>a+e.cnt,0)} pendientes</button></div></>}
</div>
<Gap/>
<Sub pad>3 · Link de encuesta del grupo</Sub>
<div className="adm-card" style={{padding:"14px 16px"}}>
<b style={{fontSize:14}}>{S.grupoLinks[0].n}</b>
<p className="adm-mut" style={{fontSize:12,lineHeight:1.5,margin:"4px 0 10px"}}>Para el WhatsApp del grupo — la contestan también los acompañantes que no compraron.</p>
<CopyBox v={S.grupoLinks[0].link} ui={ui}/>
</div>
<Gap/>
<Sub pad>4 · Testimonios por aprobar · {S.testimonios.filter(t=>t.estado==="pendiente").length}</Sub>
<div className="adm-card">
{S.testimonios.filter(t=>t.estado==="pendiente").length===0?<Empty ic="◌" t="Nada por aprobar" p="Los testimonios nuevos llegan aquí antes de publicarse."/>:
S.testimonios.filter(t=>t.estado==="pendiente").map(t=><div key={t.id} style={{padding:"14px 16px",borderBottom:"1px solid var(--line)"}}>
<p style={{fontSize:14,fontStyle:"italic",lineHeight:1.5}}>{t.txt}</p>
<p className="adm-mut" style={{fontSize:11.5,margin:"6px 0 10px"}}>{t.who}</p>
<div style={{display:"flex",gap:8}}><button className="adm-btn adm-btn-orange adm-btn-sm" style={{flex:1}} onClick={()=>{A.testimonio(t.id,"aprobado");ui.toastify("Testimonio aprobado","se publica con consentimiento");}}>Aprobar publicación</button><button className="adm-btn adm-btn-ghost adm-btn-sm" style={{flex:1}} onClick={()=>{A.testimonio(t.id,"rechazado");ui.toastify("Testimonio rechazado","no se publica");}}>Rechazar</button></div>
</div>)}
</div>
</div>
</div>;}

/* ── DINERO ── */
function ScrDinero({S,A,nav,ui}){
const pend=S.reservas.filter(r=>["anticipo","pendiente"].includes(r.estado));
const pendTotal=pend.reduce((a,r)=>a+(r.total-r.pagado),0);
const oct=S.ops.find(o=>o.id==="octavio");
return <div className="adm-screen">
<Head eyebrow="Dinero" title="Lo que <em>entra.</em>" action={<button className="adm-btn adm-btn-orange" onClick={()=>{nav.setTab("mas");nav.push("cobro");}}>Generar cobro</button>}/>
<div className="adm-pad">
<div className="adm-card adm-pulse">
<details><summary><span className="lbl"><b>Cobrado en agosto</b>histórico {fmt(S.historicoIng)}</span><span className="val">{fmt(S.ingresosMes)}<span className="up">+18% vs. jul</span></span><Chev/></summary>
<div className="adm-x"><Sub>Ingresos por experiencia → salida</Sub>
<details style={{border:0}}>
<summary style={{display:"flex",gap:10,padding:"7px 0",fontSize:13,cursor:"pointer",listStyle:"none",alignItems:"center"}}><b style={{flex:1}}>Ocean Safari</b><span className="adm-mono" style={{fontSize:13}}>$48.000</span><span className="adm-chev" style={{width:22,height:22,fontSize:10}}>⌄</span></summary>
<Prow l="· 23–26 jul" w={67} fr="$32.000"/><Prow l="· 16–19 jul" w={33} fr="$16.000"/>
</details>
<Prow l="Hongos" w={24} fr="$17.850"/><Prow l="Volcanes" w={9} fr="$6.750"/>
</div></details>
<details open={pendTotal>0}><summary><span className="lbl"><b>Pendiente de cobro</b>{pend.length} reserva{pend.length!==1?"s":""}</span><span className="val wr">{fmt(pendTotal)}</span><Chev/></summary>
<div className="adm-x"><Sub>Quién debe</Sub>
{pend.map(r=><Prow key={r.id} l={r.persona.split(" ")[0]} w={Math.min(100,(r.total-r.pagado)/300)} fr={fmt(r.total-r.pagado)} warn/>)}
{pend.length===0&&<p style={{fontSize:12.5,color:"var(--ink-soft)",padding:"8px 0"}}>Nadie debe — todo cobrado.</p>}
<div className="adm-acts"><button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={()=>nav.setTab("gente")}>Ir a Reservas</button></div>
</div></details>
<details><summary><span className="lbl"><b>Reembolsos del mes</b>1 cancelación</span><span className="val">$2.550</span><Chev/></summary>
<div className="adm-x"><Prow l="Gina Herrera" w={100} fr="$2.550"/></div></details>
</div>
<Gap/>
<Sub pad>Payout por operador · agosto</Sub>
<div className="adm-card">
<details className="adm-li">
<summary><div className="r1"><span className="t">NANAE<small>Hongos · comisión 15%</small></span><span className="m adm-mono">$15.173</span></div><div className="r2"><Chip c="ok" dot>Listo para depositar</Chip></div></summary>
<div className="adm-x"><Sub>Cálculo</Sub>
<ProwN l="Bruto" fr="$17.850,00"/><ProwN l="Comisión 15%" fr="−$2.677,50"/><ProwN l="Neto" fr="$15.172,50" b/>
<div className="adm-acts"><button className="adm-btn adm-btn-orange adm-btn-sm" onClick={()=>ui.toastify("Payout marcado como pagado","NANAE · $15.172,50")}>Marcar pagado</button></div>
</div>
</details>
<details className="adm-li" open={oct.comision==null}>
<summary><div className="r1"><span className="t">Octavio · Barrancas<small>{oct.comision==null?"comisión por definir":"comisión "+oct.comision+"%"}</small></span><span className={"m adm-mono"+(oct.comision==null?" neg":"")}>{oct.comision==null?"bloqueado":fmt(33000*(1-oct.comision/100))}</span></div><div className="r2">{oct.comision==null?<Chip c="warn">Comisión sin definir</Chip>:<Chip c="ok" dot>Listo para depositar</Chip>}</div></summary>
<div className="adm-x">
{oct.comision==null?<>
<div className="adm-note adm-note-warn" style={{marginTop:12}}><span className="st" style={{background:"var(--orange)"}}></span><span><b>No se calcula el neto sin comisión.</b> Con 0% el neto saldría igual al bruto ($33.000) — un número peligroso para pagar. Define la comisión primero.</span></div>
<div className="adm-acts"><button className="adm-btn adm-btn-orange adm-btn-block" onClick={()=>ui.openSheet("comision",{opId:"octavio"})}>Definir comisión de Octavio</button></div>
</>:<>
<Sub>Cálculo</Sub><ProwN l="Bruto" fr="$33.000,00"/><ProwN l={"Comisión "+oct.comision+"%"} fr={fmtD(-33000*oct.comision/100)}/><ProwN l="Neto" fr={fmtD(33000*(1-oct.comision/100))} b/>
</>}
</div>
</details>
</div>
<Gap/>
<div className="adm-card adm-menu">
<button className="mrow" onClick={()=>nav.push("ledger")}><span className="mi">LG</span><span className="grow">Ledger de pagos<small>{S.ledger.length} movimientos · agosto</small></span><span className="go">›</span></button>
<button className="mrow" onClick={()=>ui.openDialog("cfdi")}><span className="mi">₣</span><span className="grow">Facturación · CFDI<small>apagada — falta conectar la cuenta fiscal</small></span><span className="go">›</span></button>
</div>
</div>
</div>;}

function ScrLedger({S,nav,ui}){
const [filtro,setFiltro]=uSb("Todos");
const [n,setN]=uSb(6);
const map={Cobros:"cobro",Payouts:"payout",Reembolsos:"reembolso",Manuales:"manual"};
const list=S.ledger.filter(m=>filtro==="Todos"||m.tipo===map[filtro]);
return <div className="adm-screen">
<NavBar onBack={nav.pop} t="Ledger de pagos" s={S.ledger.length+" movimientos · agosto"}/>
<div className="adm-pad">
<div className="adm-filters">{["Todos","Cobros","Payouts","Reembolsos","Manuales"].map(f=><button key={f} className={"adm-btn adm-btn-sm "+(filtro===f?"adm-btn-forest":"adm-btn-ghost")} onClick={()=>{setFiltro(f);setN(6);}}>{f}{f==="Todos"?" · "+S.ledger.length:""}</button>)}</div>
<div className="adm-card">
{list.slice(0,n).map(m=><details className="adm-li" key={m.id}>
<summary>
<div className="r1"><span className="t">{m.t}<small>{m.sub}</small></span><span className={"m adm-mono"+(m.monto<0?" neg":"")}>{fmtS(m.monto)}</span></div>
<div className="r2">{m.estado==="Liquidado"||m.estado==="Pagado"?<Chip c="ok" dot>{m.estado}</Chip>:m.estado==="Registrado a mano"?<Chip c="sol">{m.estado}</Chip>:<Chip c="mut">{m.estado}</Chip>}<span className="dt">{m.fecha}</span></div>
</summary>
<div className="adm-x"><Sub>Desglose</Sub>
{m.des.map((d,i)=><ProwN key={i} l={d[0]} fr={fmtD(d[1])} b={d[0]==="Neto"}/>)}
</div>
</details>)}
{n<list.length&&<div style={{padding:"12px 16px 16px"}}><button className="adm-btn adm-btn-glass adm-btn-block" onClick={()=>setN(n+12)}>Mostrar {Math.min(12,list.length-n)} movimientos más</button></div>}
{list.length===0&&<Empty ic="◌" t="Sin movimientos" p="Con este filtro no hay nada este mes."/>}
</div>
</div>
</div>;}

/* ── sheets/diálogos Gente+Dinero ── */
function ShRegPago({S,A,ui,params}){
const r=S.reservas.find(x=>x.id===params.id);
const debe=r.total-r.pagado;
const [metodo,setMetodo]=uSb("Transferencia");
const [monto,setMonto]=uSb(fmt(debe));
const [fecha,setFecha]=uSb("9 ago 2026");
const [nota,setNota]=uSb("");
return <div className="adm-sheet"><div className="grab"></div>
<h2>Registrar pago</h2><p className="sd">{r.persona} · {r.expLabel} · saldo {fmt(debe)}</p>
<div className="adm-fld"><label>Método</label><Seg opts={["Transferencia","Efectivo"]} val={metodo} set={setMetodo}/></div>
<div className="adm-2col">
<Fld l="Monto" val={monto} set={setMonto} mono/>
<Fld l="Fecha" val={fecha} set={setFecha} mono/>
</div>
<Fld l="Nota (opcional)" val={nota} set={setNota} ph="referencia, banco…"/>
<p className="sd" style={{margin:"2px 0 0"}}>Así entran al ledger los cobros hechos fuera del sistema.</p>
<div className="adm-acts"><button className="adm-btn adm-btn-ghost" onClick={ui.closeSheet}>Cancelar</button><button className="adm-btn adm-btn-orange" onClick={()=>{
const m=parseInt(monto.replace(/\D/g,""),10)||debe;
A.regPago(r.id,m,metodo,fecha,nota);ui.closeSheet();
ui.toastify("Pago registrado",fmt(m)+" · "+r.persona+" · "+metodo.toLowerCase(),()=>A.undo());
}}>Registrar {monto}</button></div>
</div>;}

function DlgCancelarReserva({A,ui,params}){
const r=params.r;
return <div className="adm-dlg">
<h2 style={{color:"#e8431f"}}>¿Cancelar la reserva de {r.persona}?</h2>
<p>{r.expLabel} · {r.pax} persona{r.pax>1?"s":""}{r.pagado>0?<> · pagó <b>{fmt(r.pagado)}</b></>:null}. Se libera{r.pax>1?"n":""} su{r.pax>1?"s":""} lugar{r.pax>1?"es":""}. {r.pagado>0&&<>El reembolso <b>no es automático</b>: queda pendiente en Dinero.</>}</p>
<div className="adm-acts"><button className="adm-btn adm-btn-ghost" onClick={ui.closeDialog}>Conservar</button><button className="adm-btn adm-btn-orange" onClick={()=>{A.cancelarReserva(r.id);ui.closeDialog();ui.toastify("Reserva cancelada",r.persona+" · "+r.expLabel,()=>A.undo());}}>Cancelar reserva</button></div>
</div>;}

function DlgConfirmLote({ui,params}){
return <div className="adm-dlg">
<h2>Vas a escribirle a {params.n} persona{params.n>1?"s":""}</h2>
<p>{params.que[0].toUpperCase()+params.que.slice(1)}. Es un mensaje real a clientes reales — se envía una sola vez.</p>
<div className="adm-acts"><button className="adm-btn adm-btn-ghost" onClick={ui.closeDialog}>Revisar lista</button><button className="adm-btn adm-btn-orange" onClick={()=>{params.accion&&params.accion();ui.closeDialog();ui.toastify("Enviado a "+params.n,params.que);}}>Enviar a {params.n}</button></div>
</div>;}

function ShComision({S,A,ui,params}){
const [pct,setPct]=uSb("12");
return <div className="adm-sheet"><div className="grab"></div>
<h2>Comisión de Octavio</h2><p className="sd">Barrancas del Cobre · hoy está «por definir» y el payout está bloqueado.</p>
<Fld l="Comisión %" val={pct} set={v=>setPct(v.replace(/\D/g,""))} mono/>
<div className="adm-acts"><button className="adm-btn adm-btn-ghost" onClick={ui.closeSheet}>Cancelar</button><button className="adm-btn adm-btn-orange" disabled={pct===""} onClick={()=>{A.setComision(params.opId,parseInt(pct,10));ui.closeSheet();ui.toastify("Comisión definida","Octavio · "+pct+"% — payout desbloqueado");}}>Guardar {pct||"—"}%</button></div>
</div>;}

function DlgCfdi({ui}){
return <div className="adm-dlg">
<h2>La facturación está apagada</h2>
<p>Falta conectar la cuenta fiscal (CSD del SAT). Cuando esté, aquí viven los CFDI emitidos, los por emitir y el reenvío por correo.</p>
<div className="adm-acts"><button className="adm-btn adm-btn-ghost" onClick={ui.closeDialog}>Cerrar</button><button className="adm-btn adm-btn-orange" onClick={()=>{ui.closeDialog();ui.toastify("Conexión fiscal","se configura desde el panel de computadora");}}>Conectar cuenta fiscal</button></div>
</div>;}

function DlgRecordarFirma({ui,params}){
const quien=params.quien;
const env=medio=>{params.accion&&params.accion();ui.closeDialog();ui.toastify("Recordatorio enviado por "+medio,quien+" · firma de deslinde");};
return <div className="adm-dlg">
<h2>Recordar la firma{params.n>1?" a "+params.n+" personas":""}</h2>
<p>{params.n>1?<>Se les manda el link del deslinde a <b>{params.n} personas</b> que pagaron y no han firmado.</>:<><b>{quien}</b> pagó y no ha firmado. Se le manda el link del deslinde.</>} ¿Por dónde?</p>
<div className="adm-acts">
<button className="adm-btn adm-btn-forest" style={{flex:1}} onClick={()=>env("WhatsApp")}>WhatsApp</button>
<button className="adm-btn adm-btn-ghost" style={{flex:1}} onClick={()=>env("correo")}>Correo</button>
</div>
<div className="adm-acts" style={{paddingTop:8}}><button className="adm-btn adm-btn-ghost adm-btn-block" onClick={ui.closeDialog}>Cancelar</button></div>
</div>;}

Object.assign(window,{ScrGente,ScrPersona,ScrRoster,ScrEncuesta,ScrDinero,ScrLedger,ShRegPago,DlgCancelarReserva,DlgConfirmLote,ShComision,DlgCfdi,DlgRecordarFirma});
