/* DINERO · v2 — entrada de una pantalla, un nivel de profundidad */
const {useState:uSd} = React;

function ScrDineroV2({S,A,nav,ui}){
const pendRes=S.reservas.filter(r=>["anticipo","pendiente"].includes(r.estado));
const pend=pendRes.reduce((a,r)=>a+(r.total-r.pagado),0);
const opsSinDef=S.ops.filter(o=>o.comision==null).length;
return <div className="adm-screen">
<Head eyebrow="Dinero" title="¿Cómo <em>vamos?</em>" action={<button className="adm-btn adm-btn-orange" onClick={()=>{nav.setTab("mas");nav.push("cobro");}}>Generar cobro</button>}/>
<div className="adm-pad">
<div className="adm-card adm-pulse">
<details>
<summary><span className="lbl"><b>Cobrado en agosto</b>bruto · la tarjeta se lleva ~5%</span><span className="val">{fmt(S.ingresosMes)}<span className="up">+18% vs. jul</span></span><Chev/></summary>
<div className="adm-x"><Sub>Comparación honesta</Sub>
<ProwN l="Julio (cerrado)" fr="$61.500"/>
<ProwN l="Agosto (va)" fr={fmt(S.ingresosMes)} b/>
<ProwN l="Histórico" fr={fmt(S.historicoIng)}/>
<div className="adm-note adm-note-info" style={{marginTop:10}}><span className="st" style={{background:"var(--sand)"}}></span><span><b>Cobrado ≠ recibido.</b> Al banco llegan ≈ $69.000: la comisión de la pasarela (~5% con IVA) aún no se registra en el sistema. Cuando se registre, aquí vivirá el neto real.</span></div>
</div>
</details>
</div>
<Gap s/>
{pend>0?
<div className="adm-note adm-note-warn"><span className="st" style={{background:"var(--orange)"}}></span><span style={{flex:1}}><b>Te deben {fmt(pend)}.</b> {pendRes.length} reserva{pendRes.length>1?"s":""} con saldo abierto.</span><button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={()=>nav.setTab("gente")}>Cobrar</button></div>
:<div className="adm-note adm-note-info"><span className="st" style={{background:"var(--olive)"}}></span><span>Nadie te debe hoy. Este aviso solo aparece cuando hay saldo abierto.</span></div>}
<Gap/>
<div className="adm-card adm-menu">
<button className="mrow" onClick={()=>nav.push("meses")}><span className="mi">PG</span><span className="grow">Pagos por mes y evento<small>agosto {fmt(S.ingresosMes)} · quién pagó, ficha completa</small></span><span className="go">›</span></button>
<button className="mrow" onClick={()=>nav.push("porexp")}><span className="mi">EX</span><span className="grow">Por experiencia<small>histórico $530.600 · 4 experiencias · 46 reservas</small></span><span className="go">›</span></button>
<button className="mrow" onClick={()=>nav.push("payout")}><span className="mi">OP</span><span className="grow">Payout a operadores<small>{opsSinDef>0?(opsSinDef>1?opsSinDef+" comisiones":"1 comisión")+" sin definir — revisar antes de pagar":"comisiones definidas"}</small></span>{opsSinDef>0?<Chip c="warn">revisar</Chip>:<span className="go">›</span>}</button>
<button className="mrow" onClick={()=>nav.push("movs")}><span className="mi">MV</span><span className="grow">Movimientos<small>{S.ledger.length} en agosto · quién, cuánto, cómo</small></span><span className="go">›</span></button>
<button className="mrow" style={{opacity:.6}} onClick={()=>ui.openDialog("cfdi")}><span className="mi">₣</span><span className="grow">Facturación · CFDI<small>apagada — falta conectar la cuenta fiscal</small></span><span className="go">›</span></button>
</div>
</div>
</div>;}

function ScrPorExp({nav}){
const data=[
["Ensenada de Muertos",23,384000,[["23 transferencias directas · tres temporadas",384000]]],
["Hacienda y hongos · Kentro",3,57500,[["29 ago · 5 lugares",57500]]],
["Recolección de hongos",11,56100,[["26 jul · cerrada",43350],["23 ago · en venta",12750]]],
["Barrancas del Cobre",2,33000,[["8–11 oct · 2 de 12",33000]]],
];
const max=384000;
return <div className="adm-screen">
<NavBar onBack={nav.pop} t="Por experiencia" s="histórico $530.600 · 46 reservas"/>
<div className="adm-pad">
<div className="adm-card">
{data.map(([n,res,m,sal])=><details className="adm-li" key={n}>
<summary>
<div className="r1"><span className="t">{n}<small>{res} reserva{res>1?"s":""}</small></span><span className="m adm-mono">{fmt(m)}</span></div>
<div className="r2" style={{alignItems:"center"}}><div className="adm-prow" style={{gridTemplateColumns:"1fr",padding:0,flex:1}}><div className="tk"><i style={{width:(m/max*100)+"%"}}></i></div></div></div>
</summary>
<div className="adm-x"><Sub>Por salida</Sub>
{sal.map((s,i)=><ProwN key={i} l={s[0]} fr={fmt(s[1])}/>)}
</div>
</details>)}
</div>
<Gap/>
<Sub pad>Medios de cobro</Sub>
<div className="adm-card" style={{padding:"14px 16px"}}>
<Prow l="Transferencia" w={72} fr="23 · $384.000"/>
<Prow l="Tarjeta" w={28} fr="25 · $146.600"/>
<p className="adm-mut" style={{fontSize:11.5,lineHeight:1.5,marginTop:8}}>La tarjeta paga ~5% de comisión con IVA; la transferencia no. Ese costo aún no se descuenta en las cifras.</p>
</div>
</div>
</div>;}

function ScrPayout({S,A,nav,ui}){
const rows=[
{opId:"nanae",bruto:17850,exp:"Recolección de hongos"},
{opId:"kentro",bruto:57500,exp:"Hacienda y hongos · Kentro"},
{opId:"octavio",bruto:33000,exp:"Barrancas del Cobre"},
];
return <div className="adm-screen">
<NavBar onBack={nav.pop} t="Payout a operadores" s="agosto · revisar antes de transferir"/>
<div className="adm-pad">
<div className="adm-note adm-note-info"><span className="st" style={{background:"var(--sand)"}}></span><span><b>$384.000 (Ensenada · 23 reservas) no entran a ningún payout:</b> no tienen operador asignado. Si es operación propia está bien; si no, asígnale operador en Eventos.</span></div>
<Gap/>
<div className="adm-card">
{rows.map(({opId,bruto,exp})=>{const op=S.ops.find(o=>o.id===opId);if(!op)return null;
const def=op.comision!=null;
return <details className="adm-li" key={opId} open={!def}>
<summary>
<div className="r1"><span className="t">{op.nombre}<small>{exp}</small></span><span className={"m adm-mono"+(def?"":" neg")}>{def?fmtD(bruto*(1-op.comision/100)):"—"}</span></div>
<div className="r2">{def?<Chip c="sol">calculado — revisa antes de transferir</Chip>:<Chip c="warn">comisión sin definir · no se calcula</Chip>}</div>
</summary>
<div className="adm-x">
{def?<>
<Sub>Cálculo</Sub>
<ProwN l="Bruto cobrado" fr={fmtD(bruto)}/>
<ProwN l={"Comisión "+op.comision+"%"} fr={fmtD(-bruto*op.comision/100)}/>
<ProwN l="Neto" fr={fmtD(bruto*(1-op.comision/100))} b/>
<div className="adm-note adm-note-info" style={{marginTop:10}}><span className="st" style={{background:"var(--sand)"}}></span><span>El neto no descuenta la comisión de tarjeta (~5%) — todavía no se registra.</span></div>
<div className="adm-acts"><button className="adm-btn adm-btn-orange adm-btn-sm" onClick={()=>ui.toastify("Payout marcado como pagado",op.nombre+" · "+fmtD(bruto*(1-op.comision/100)))}>Marcar pagado</button><button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={()=>ui.openSheet("comision",{opId})}>Cambiar comisión</button></div>
</>:<>
<div className="adm-note adm-note-warn" style={{marginTop:12}}><span className="st" style={{background:"var(--orange)"}}></span><span><b>Sin comisión, el neto no se muestra.</b> Con 0% saldría igual al bruto ({fmt(bruto)}) — un número peligroso para transferir. {op.nota?op.nota[0].toUpperCase()+op.nota.slice(1)+".":""}</span></div>
<div className="adm-acts"><button className="adm-btn adm-btn-orange adm-btn-block" onClick={()=>ui.openSheet("comision",{opId})}>Definir comisión de {op.nombre.split(" ")[0]}</button></div>
</>}
</div>
</details>;})}
</div>
</div>
</div>;}

function ScrMovs({S,nav,ui}){
const [q,setQ]=uSd("");
const [filtro,setFiltro]=uSd("Todos");
const [n,setN]=uSd(8);
const map={Tarjeta:m=>m.medio==="Tarjeta"&&m.tipo==="cobro",Transferencia:m=>m.medio==="Transferencia"&&m.tipo!=="payout",Payouts:m=>m.tipo==="payout","A mano":m=>m.tipo==="manual"};
const list=S.ledger.filter(m=>(filtro==="Todos"||map[filtro](m))&&(!q||m.t.toLowerCase().includes(q.toLowerCase())));
return <div className="adm-screen">
<NavBar onBack={nav.pop} t="Movimientos" s={S.ledger.length+" en agosto"}/>
<div className="adm-pad">
<div className="adm-fld" style={{padding:"0 0 10px"}}><input placeholder="Buscar por persona…" value={q} onChange={e=>{setQ(e.target.value);setN(8);}}/></div>
<div className="adm-filters">{["Todos","Tarjeta","Transferencia","Payouts","A mano"].map(f=><button key={f} className={"adm-btn adm-btn-sm "+(filtro===f?"adm-btn-forest":"adm-btn-ghost")} onClick={()=>{setFiltro(f);setN(8);}}>{f}</button>)}</div>
<Sub pad>Agosto · {list.length}</Sub>
<div className="adm-card">
{list.slice(0,n).map(m=><details className="adm-li" key={m.id}>
<summary>
<div className="r1"><span className="t">{m.t.replace("Cobro · ","").replace("Pago manual · ","")}<small>{m.exp} · {m.fecha}</small></span><span className={"m adm-mono"+(m.monto<0?" neg":"")}>{fmtS(m.monto)}</span></div>
<div className="r2"><Chip c="mut">{m.medio}</Chip>{m.tipo==="manual"&&<Chip c="sol">registrado a mano</Chip>}{m.tipo==="payout"&&<Chip c="sol">payout</Chip>}{m.tipo==="reembolso"&&<Chip c="warn">reembolso</Chip>}</div>
</summary>
<div className="adm-x"><Sub>Desglose</Sub>
{m.des.map((d,i)=><ProwN key={i} l={d[0]} fr={fmtD(d[1])} b={d[0]==="Neto"}/>)}
</div>
</details>)}
{list.length===0&&<Empty ic="◌" t="Nada con ese filtro" p={q?("Sin resultados para «"+q+"».") : "No hay movimientos de este tipo en agosto."}/>}
{n<list.length&&<div style={{padding:"12px 16px 16px"}}><button className="adm-btn adm-btn-glass adm-btn-block" onClick={()=>setN(n+12)}>Mostrar {Math.min(12,list.length-n)} más</button></div>}
</div>
</div>
</div>;}

function ShComisionG({S,A,ui,params}){
const op=S.ops.find(o=>o.id===params.opId);
const [pct,setPct]=uSd("12");
return <div className="adm-sheet"><div className="grab"></div>
<h2>Comisión de {op.nombre}</h2><p className="sd">{op.comision==null?"Hoy está «por definir» y el payout está bloqueado.":"Hoy es "+op.comision+"%."} Fíjala por escrito con el operador antes de guardar.</p>
<Fld l="Comisión %" val={pct} set={v=>setPct(v.replace(/\D/g,""))} mono/>
<div className="adm-acts"><button className="adm-btn adm-btn-ghost" onClick={ui.closeSheet}>Cancelar</button><button className="adm-btn adm-btn-orange" disabled={pct===""} onClick={()=>{A.setComision(op.id,parseInt(pct,10));ui.closeSheet();ui.toastify("Comisión definida",op.nombre+" · "+pct+"% — payout desbloqueado");}}>Guardar {pct||"—"}%</button></div>
</div>;}

Object.assign(window,{ScrDineroV2,ScrPorExp,ScrPayout,ScrMovs,ShComisionG});
