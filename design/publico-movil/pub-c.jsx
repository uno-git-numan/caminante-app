/* Caminos C · MI ESPACIO, D · ENTRAR, E · LO DEMÁS */
const {useState:uC} = React;

function PubEspacio({S,A,nav,ui}){
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<HeadFloat nav={nav} oncream/>
<div className="pub-headpad"></div>
<Sec style={{paddingTop:10}}><Eyeb>Mi espacio</Eyeb><h2>Hola, <em>{S.usuario.nombre.split(" ")[0]}.</em></h2></Sec>
<Sec style={{paddingTop:0}}><Eyeb>Próximo viaje</Eyeb>
{S.viajes.filter(v=>v.proximo).map(v=>{const e=PUB.exps.find(x=>x.id===v.exp);
return <div key={v.id}>
<button className="pub-trip" style={{marginTop:12}} onClick={()=>nav.push("viaje",{id:v.id})}>
<div className="ph"><Ph cat={e.tono} slug={e.slug} ratio={.46} alt={e.nombre}/></div><div className="veil"></div>
<div className="inner"><div className="g"><small>{v.fecha}</small><h3>{e.titulo[0]}{e.titulo[1]}</h3></div><span className="pub-chip"><span className="cd"></span>{v.dias}</span></div>
</button>
{!S.deslindeOk&&<div className="pub-blk" style={{marginTop:12,borderColor:"rgba(255,93,54,.4)",borderWidth:1.5,display:"flex",alignItems:"center",gap:12}}>
<div style={{flex:1}}><b style={{fontSize:15.5}}>Falta tu deslinde</b><br/><small style={{fontSize:13.5,color:"var(--ink-soft)"}}>sin firma no se sube a la van</small></div>
<button className="pub-cta pub-cta-orange pub-cta-sm" onClick={()=>nav.push("deslinde",{id:v.exp})}>Firmar</button>
</div>}
</div>;})}
{S.viajes.filter(v=>v.proximo).length===0&&<div className="pub-blk" style={{marginTop:12}}><div className="pub-state" style={{padding:"8px 0"}}><h3>Sin viajes próximos</h3><p>El calendario tiene 4 salidas abiertas.</p><button className="pub-cta pub-cta-ghost pub-cta-sm" onClick={()=>nav.push("calendario")}>Ver calendario</button></div></div>}
</Sec>
<Sec><Eyeb>Ya viviste</Eyeb>
{S.viajes.filter(v=>!v.proximo).map(v=>{const e=PUB.exps.find(x=>x.id===v.exp);
return <button className="pub-trip" style={{marginTop:12,minHeight:130}} key={v.id} onClick={()=>nav.push("feedback",{id:v.id})}>
<div className="ph"><Ph cat={e.tono} slug={e.slug} ratio={.36} alt={e.nombre}/></div><div className="veil"></div>
<div className="inner"><div className="g"><small>{v.fecha}</small><h3>{e.titulo[0]}{e.titulo[1]}</h3></div><span className="pub-chip">{v.resena?("tu reseña ★"+v.resena):"deja tu reseña"}</span></div>
</button>;})}
</Sec>
<Sec style={{paddingBottom:26}}><Eyeb>Tu expediente</Eyeb>
<div className="pub-blk" style={{marginTop:12}}>
<button className="pub-exp-row" onClick={()=>nav.push("expediente")}><div className="g"><b>Datos y perfil médico</b><small>{S.usuario.nombre} · {S.usuario.mail}</small></div><span className="ok">ver ›</span></button>
<button className="pub-exp-row" onClick={()=>nav.push("expediente")}><div className="g"><b>Acompañantes guardados</b><small>{S.usuario.acomp.length} registrado{S.usuario.acomp.length!==1?"s":""}</small></div><span className="ok">ver ›</span></button>
<button className="pub-exp-row" style={{borderBottom:0}} onClick={()=>{A.salir();ui.toastify("Sesión cerrada","Hasta la próxima caminata");}}><div className="g"><b style={{color:"var(--orange)"}}>Salir</b></div></button>
</div>
</Sec>
</div>;}

function PubViaje({S,nav,ui,params}){
const v=S.viajes.find(x=>x.id===params.id);
const e=PUB.exps.find(x=>x.id===v.exp);
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<NavCream nav={nav} t={e.nombre} s={v.fecha}/>
<div className="pub-hero" style={{minHeight:240}}>
<div className="ph"><Ph cat={e.tono} slug={e.slug} ratio={.66} alt={e.nombre}/></div><div className="veil"></div>
<div className="inner"><small className="meta">{v.fecha} · {v.pax} persona{v.pax>1?"s":""}</small><h1 style={{fontSize:30}}>{e.titulo[0]}<em>{e.titulo[1]}</em></h1></div>
</div>
<div style={{padding:"16px 20px 30px"}}>
<div className="pub-blk">
<button className="pub-exp-row" onClick={()=>S.deslindeOk?ui.toastify("Deslinde","firmado y en regla"):nav.push("deslinde",{id:e.id})}><div className="g"><b>Deslinde</b><small>tuyo y de tus acompañantes</small></div>{S.deslindeOk?<span className="ok">firmado ✓</span>:<span className="warn">falta tu firma</span>}</button>
<button className="pub-exp-row" onClick={()=>ui.toastify("Punto de encuentro","Ángel de la Independencia · 7:00 — se abre el mapa")}><div className="g"><b>Punto de encuentro</b><small>Ángel de la Independencia · 7:00</small></div><span className="ok">ver mapa</span></button>
<button className="pub-exp-row" onClick={()=>ui.toastify("Invitación PDF","descargando — compártela con tu grupo")}><div className="g"><b>Invitación en PDF</b><small>para compartir con tu grupo</small></div><span className="ok">descargar</span></button>
<div className="pub-exp-row" style={{borderBottom:0}}><div className="g"><b>Pago</b><small>{v.pax} persona{v.pax>1?"s":""} · {pfmt(v.total)}</small></div><span className="ok">completo</span></div>
</div>
<Sec style={{padding:"24px 0 0"}}><Eyeb>La mochila</Eyeb>
<div className="pub-inc">{e.packing.map((r,i)=><div className="row" key={i}><span className="sl">//</span><span>{r[0]}{r[1]&&<small>{r[1]}</small>}</span></div>)}</div>
</Sec>
</div>
</div>;}

function PubExpediente({S,nav}){
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<NavCream nav={nav} t="Mi expediente" s={S.usuario.nombre}/>
<div style={{padding:"14px 20px 30px"}}>
<div className="pub-blk">
<span className="pub-lbl">Datos</span>
<div className="pub-fld"><label>Nombre</label><input defaultValue={S.usuario.nombre}/></div>
<div className="pub-fld"><label>Correo</label><input defaultValue={S.usuario.mail}/></div>
<div className="pub-fld"><label>Teléfono</label><input defaultValue={S.usuario.tel}/></div>
</div>
<div className="pub-blk">
<span className="pub-lbl">Perfil médico</span>
<div className="pub-fld"><label>Alergias o condiciones</label><input defaultValue="ninguna"/></div>
<div className="pub-fld"><label>Contacto de emergencia</label><input defaultValue="Jorge López · 55 8765 4321"/></div>
</div>
<div className="pub-blk">
<span className="pub-lbl">Acompañantes guardados</span>
{S.usuario.acomp.map((a,i)=><div className="pub-exp-row" key={i}><div className="g"><b>{a}</b></div></div>)}
</div>
<div className="pub-blk">
<span className="pub-lbl">Firmas de deslinde</span>
<div className="pub-exp-row"><div className="g"><b>El mar de Cortés</b><small>jun 2026</small></div><span className="ok">firmado ✓</span></div>
<div className="pub-exp-row" style={{borderBottom:0}}><div className="g"><b>El bosque de Xalatlaco</b><small>23 ago</small></div>{S.deslindeOk?<span className="ok">firmado ✓</span>:<span className="warn">pendiente</span>}</div>
</div>
</div>
</div>;}

function PubFeedback({S,A,nav,ui,params}){
const v=S.viajes.find(x=>x.id===params.id);
const e=PUB.exps.find(x=>x.id===v.exp);
const [st,setSt]=uC({guia:0,lugar:0,org:0});
const [nps,setNps]=uC(null);
const [txt,setTxt]=uC("");
const [ok,setOk]=uC(false);
const Row=({k,l})=><div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0"}}>
<span style={{flex:1,fontSize:15}}>{l}</span>
<div className="pub-stars">{[1,2,3,4,5].map(n=><button key={n} className={st[k]>=n?"on":""} onClick={()=>setSt({...st,[k]:n})}>★</button>)}</div>
</div>;
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<NavCream nav={nav} t="¿Cómo estuvo?" s={e.nombre+" · "+v.fecha}/>
<div style={{padding:"14px 20px 30px"}}>
<div className="pub-blk">
<span className="pub-lbl">Por sección</span>
<Row k="guia" l="Tu guía"/><Row k="lugar" l="El lugar"/><Row k="org" l="La organización"/>
</div>
<div className="pub-blk">
<span className="pub-lbl">¿Lo recomendarías? · 0 a 10</span>
<div className="pub-nps">{Array.from({length:11},(_,i)=><button key={i} className={nps===i?"on":""} onClick={()=>setNps(i)}>{i}</button>)}</div>
</div>
<div className="pub-blk">
<span className="pub-lbl">Cuéntalo con tus palabras</span>
<div className="pub-fld" style={{padding:0}}><textarea rows="3" placeholder="Lo que te llevas…" value={txt} onChange={ev=>setTxt(ev.target.value)}></textarea></div>
<label style={{display:"flex",gap:10,alignItems:"flex-start",marginTop:10,fontSize:14,color:"var(--ink-soft)",cursor:"pointer"}}><input type="checkbox" style={{width:20,height:20,accentColor:"var(--olive)"}} checked={ok} onChange={ev=>setOk(ev.target.checked)}/> Autorizo publicar mi comentario con mi nombre de pila.</label>
</div>
<button className="pub-cta pub-cta-orange" style={{marginTop:14}} disabled={nps==null} onClick={()=>{A.resena(v.id,st.guia||5);nav.pop();ui.toastify("Gracias","Tu respuesta mejora las siguientes salidas");}}>Enviar</button>
</div>
</div>;}

/* D · ENTRAR */
function PubEntrar({S,A,nav,ui}){
const [mail,setMail]=uC("");
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<HeadFloat nav={nav} oncream/>
<div className="pub-headpad"></div>
<Sec style={{paddingTop:10}}><Eyeb>Entrar</Eyeb><h2>Tus viajes te <em>esperan.</em></h2></Sec>
<div style={{padding:"0 20px 30px"}}>
<div className="pub-blk">
<button className="pub-cta pub-cta-forest" style={{width:"100%"}} onClick={()=>{A.entrar();nav.push("bienvenida");}}>Continuar con Google</button>
<div style={{display:"flex",alignItems:"center",gap:12,margin:"16px 0",color:"var(--sand)",fontSize:13}}><span style={{flex:1,height:1,background:"var(--line)"}}></span>o<span style={{flex:1,height:1,background:"var(--line)"}}></span></div>
<div className="pub-fld"><label>Correo</label><input type="email" value={mail} onChange={ev=>setMail(ev.target.value)} placeholder="tu@correo.mx"/></div>
<div className="pub-fld"><label>Contraseña</label><input type="password" placeholder="••••••••"/></div>
<button className="pub-cta pub-cta-orange" style={{marginTop:8}} disabled={!mail} onClick={()=>{A.entrar();nav.push("bienvenida");}}>Entrar</button>
<button className="pub-cta pub-cta-ghost pub-cta-sm" style={{width:"100%",marginTop:10}} disabled={!mail} onClick={()=>ui.toastify("Liga mágica enviada",(mail||"tu correo")+" · revisa tu bandeja")}>Mándame una liga mágica</button>
</div>
<p style={{textAlign:"center",fontSize:14.5,color:"var(--ink-soft)",marginTop:16}}>¿Primera vez? <button style={{color:"var(--olive)",fontWeight:600,textDecoration:"underline",textUnderlineOffset:3}} onClick={()=>nav.push("crear")}>Crea tu cuenta</button></p>
</div>
</div>;}

function PubCrear({S,A,nav,ui}){
const [tipo,setTipo]=uC("viajero");
const [f,setF]=uC({nombre:"",mail:""});
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<NavCream nav={nav} t="Crear cuenta" s="un minuto"/>
<div style={{padding:"14px 20px 30px"}}>
<div className="pub-blk">
<span className="pub-lbl">¿Quién eres?</span>
<button className={"pub-sel"+(tipo==="viajero"?" on":"")} onClick={()=>setTipo("viajero")}><span className="rd">{tipo==="viajero"&&<i></i>}</span><div className="g"><b>Viajero</b><small>quiero reservar y guardar mis viajes</small></div></button>
<button className={"pub-sel"+(tipo==="operador"?" on":"")} onClick={()=>setTipo("operador")}><span className="rd">{tipo==="operador"&&<i></i>}</span><div className="g"><b>Operador o marca</b><small>opero experiencias y quiero mi espacio</small></div></button>
{tipo==="operador"&&<p style={{fontSize:14,color:"var(--ink-soft)",lineHeight:1.5,marginTop:10}}>Tu solicitud pasa por revisión — te contestamos en 48 horas.</p>}
<div className="pub-fld"><label>Nombre</label><input value={f.nombre} onChange={ev=>setF({...f,nombre:ev.target.value})}/></div>
<div className="pub-fld"><label>Correo</label><input type="email" value={f.mail} onChange={ev=>setF({...f,mail:ev.target.value})}/></div>
<button className="pub-cta pub-cta-orange" style={{marginTop:8}} disabled={!f.nombre||!f.mail} onClick={()=>{if(tipo==="viajero"){A.entrar(f.nombre);nav.push("bienvenida");}else{nav.pop();ui.toastify("Solicitud enviada","te contestamos en 48 horas");}}}>{tipo==="viajero"?"Crear cuenta":"Solicitar acceso"}</button>
</div>
</div>
</div>;}

function PubBienvenida({S,nav}){
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<div className="pub-headpad"></div>
<div className="pub-state" style={{paddingTop:50}}>
<span className="ic" style={{background:"var(--forest)",color:"#fff"}}>✓</span>
<h3 style={{fontSize:22,fontWeight:250}}>Bienvenido, {S.usuario.nombre.split(" ")[0]}.</h3>
<p>Tu espacio guarda tus viajes, tus firmas y tu perfil médico — para que la próxima reserva tome un minuto.</p>
<button className="pub-cta pub-cta-orange" style={{width:"auto",padding:"0 26px"}} onClick={()=>{nav.reset();nav.setTab("espacio");}}>Ir a mi espacio</button>
<button className="pub-cta pub-cta-ghost pub-cta-sm" onClick={()=>{nav.reset();nav.push("calendario");}}>Ver próximas salidas</button>
</div>
</div>;}

/* E · LO DEMÁS */
function PubEmbajadores({nav,ui}){
const [f,setF]=uC({nombre:"",mail:"",ig:"",por:""});
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<NavCream nav={nav} t="Embajadores" s="programa curado"/>
<Sec><Eyeb>Embajadores</Eyeb><h2>Gente que ya camina <em>con nosotros.</em></h2>
<p>Guías, científicos y creadores que comparten el método. Es un programa curado: se aplica, se revisa, se contesta.</p></Sec>
<div style={{padding:"0 20px 30px"}}>
<div className="pub-blk">
<div className="pub-fld"><label>Nombre</label><input value={f.nombre} onChange={ev=>setF({...f,nombre:ev.target.value})}/></div>
<div className="pub-fld"><label>Correo</label><input value={f.mail} onChange={ev=>setF({...f,mail:ev.target.value})}/></div>
<div className="pub-fld"><label>Instagram o portafolio</label><input value={f.ig} onChange={ev=>setF({...f,ig:ev.target.value})}/></div>
<div className="pub-fld"><label>¿Por qué tú?</label><textarea rows="3" value={f.por} onChange={ev=>setF({...f,por:ev.target.value})}></textarea></div>
<button className="pub-cta pub-cta-orange" disabled={!f.nombre||!f.mail} onClick={()=>{nav.pop();ui.toastify("Aplicación recibida","te contestamos en una semana");}}>Aplicar</button>
</div>
</div>
</div>;}

function PubFacturacion({nav,ui}){
const [folio,setFolio]=uC("");
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<NavCream nav={nav} t="Facturación" s="autofactura CFDI"/>
<div style={{padding:"14px 20px 30px"}}>
<div className="pub-blk">
<p style={{fontSize:15,lineHeight:1.6,color:"var(--ink-soft)"}}>Con el folio de tu cobro (está en el recibo del correo) generas tu CFDI al momento.</p>
<div className="pub-fld"><label>Folio del cobro</label><input className="pub-mono" placeholder="ch_3QxB92…" value={folio} onChange={ev=>setFolio(ev.target.value)}/></div>
<div className="pub-fld"><label>RFC</label><input placeholder="XAXX010101000"/></div>
<div className="pub-fld"><label>Razón social</label><input/></div>
<button className="pub-cta pub-cta-orange" disabled={!folio} onClick={()=>ui.toastify("CFDI generado","te llegó al correo del recibo")}>Generar factura</button>
</div>
</div>
</div>;}

function PubPrivacidad({nav}){
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<NavCream nav={nav} t="Aviso de privacidad" s="NUMAN HUB S.A. de C.V."/>
<Sec style={{paddingBottom:30}}>
<p>NUMAN HUB S.A. de C.V. usa tus datos para operar tu reserva: contacto, pago, perfil médico y contacto de emergencia. El perfil médico solo lo ve tu guía, el día del viaje.</p>
<p>No vendemos datos. Puedes pedir acceso, corrección o eliminación en hola@numanhub.com.</p>
</Sec>
</div>;}

function PubBaja({nav,ui}){
const [fuera,setFuera]=uC(false);
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<NavCream nav={nav} t="Baja del boletín" s="las cartas de Caminante"/>
<div className="pub-state" style={{paddingTop:40}}>
{fuera?<>
<span className="ic">✓</span><h3>Listo, ya no te escribimos</h3>
<p>Te damos de baja con dignidad: sin encuestas de culpa ni «¿estás seguro?» tres veces. Si un día quieres volver, la puerta queda abierta.</p>
</>:<>
<span className="ic">◌</span><h3>¿Ya no quieres estas cartas?</h3>
<p>Una al mes, sin promociones. Pero si ya no te sirven, aquí te das de baja — un toque y ya.</p>
<button className="pub-cta pub-cta-orange" style={{width:"auto",padding:"0 26px"}} onClick={()=>setFuera(true)}>Darme de baja</button>
</>}
</div>
</div>;}

function ShMenu({S,nav,ui}){
const go=id=>{ui.closeSheet();nav.push(id);};
return <div className="pub-sheet">
<div className="grab"></div>
<h2>Menú</h2>
<div className="pub-menu" style={{marginTop:6}}>
<button onClick={()=>go("nosotros")}>Nosotros · por qué caminamos<span className="go">›</span></button>
<button onClick={()=>go("embajadores")}>Embajadores<span className="go">›</span></button>
<button onClick={()=>go("facturacion")}>Facturación<span className="go">›</span></button>
<button onClick={()=>go("privacidad")}>Aviso de privacidad<span className="go">›</span></button>
<button onClick={()=>go("baja")}>Baja del boletín<span className="go">›</span></button>
<a href="mailto:hola@numanhub.com">Contacto · hola@numanhub.com<span className="go">›</span></a>
</div>
</div>;}

function ShAvisame({ui,params}){
const [mail,setMail]=uC("");
return <div className="pub-sheet">
<div className="grab"></div>
<h2>Te avisamos</h2>
<p className="sd">Cuando abra una fecha de {params.exp}, te llega un correo. Solo eso.</p>
<div className="pub-fld"><label>Correo</label><input type="email" value={mail} onChange={ev=>setMail(ev.target.value)} placeholder="tu@correo.mx"/></div>
<div className="pub-acts"><button className="pub-cta pub-cta-ghost" onClick={ui.closeSheet}>Cancelar</button><button className="pub-cta pub-cta-orange" disabled={!mail} onClick={()=>{ui.closeSheet();ui.toastify("Anotado",mail+" · te avisamos al abrir fecha");}}>Avísame</button></div>
</div>;}

/* NOSOTROS — la pantalla del porqué; larga y editorial a propósito */
function PubNosotros({nav}){
return <div className="pub-screen">
<HeadFloat nav={nav} back/>
<div className="pub-hero" style={{minHeight:520}}>
{/* banco: paisaje · bosque de niebla */}
<div className="ph"><Ph cat="paisaje" slug="nosotros" ratio={1.4} alt="Bosque de niebla"/></div>
<div className="veil"></div>
<div className="inner"><Eyeb neg>Nosotros</Eyeb><h1>Caminar es <em>fisiología.</em></h1>
<p>Veinte minutos de bosque bajan el cortisol medible en saliva. No es una frase bonita: es cómo funciona tu cuerpo.</p></div>
</div>
<Sec><Eyeb>Qué es Caminante</Eyeb><h2>El medio es <em>el lugar.</em></h2>
<p>Llevamos gente a lugares reales de México — un bosque de hongos, un mar con lobos marinos, un cañón más profundo que el Gran Cañón — con ciencia real y guías que llevan años leyéndolos.</p>
<p>No vendemos paisaje: cada salida es la etapa de naturaleza del método numan, hecha cuerpo.</p></Sec>
<Sec><Eyeb>El método</Eyeb><h2>movimiento → naturaleza → introspección → <em>creatividad.</em></h2>
<p><em style={{color:"var(--orange)"}}>En ese orden, porque el orden es el método.</em> Primero el cuerpo, después el lugar, al final tú. Donde pones tu atención, ahí va tu energía.</p></Sec>
<Sec><Eyeb>Las cuatro caras de cada lugar</Eyeb>
<div className="pub-inc">
<div className="row"><span className="sl">//</span><span>Naturaleza<small>Lo que el lugar es: especies, temporadas, datos con fuente</small></span></div>
<div className="row"><span className="sl">//</span><span>Conservación<small>Lo que el lugar necesita para seguir siendo</small></span></div>
<div className="row"><span className="sl">//</span><span>Comunidades<small>De quién es la montaña, y qué deja cada visita</small></span></div>
<div className="row"><span className="sl">//</span><span>Problemas<small>Lo que amenaza al lugar — también se cuenta</small></span></div>
</div>
<p style={{marginTop:12}}>Con ese marco se lee cada destino: no hay experiencia sin sus cuatro caras.</p></Sec>
<Sec><Eyeb>Conservación</Eyeb><h2>Una parte de <em>cada viaje.</em></h2>
<p>Parte de lo que pagas se queda en el lugar: permisos al ejido, guías locales, cocina de las comunidades. El viaje que no deja algo, quita.</p>
{/* banco: comunidad */}
<div style={{borderRadius:20,overflow:"hidden",marginTop:16,height:180,boxShadow:"var(--shadow)"}}><Ph cat="comunidad" slug="nosotros" ratio={.5} alt="Las comunidades con las que trabajamos"/></div></Sec>
<Sec><Eyeb>A quién servimos</Eyeb><h2>Tres <em>orillas.</em></h2>
<div className="pub-inc">
<div className="row"><span className="sl">//</span><span>A quien camina<small>Experiencias con ciencia, sin disfraz de tour</small></span></div>
<div className="row"><span className="sl">//</span><span>A quien opera<small>La plataforma completa: venta, deslindes, comunicación</small></span></div>
<div className="row"><span className="sl">//</span><span>Al lugar<small>Derrama directa y datos que ayudan a conservarlo</small></span></div>
</div></Sec>
<Sec style={{paddingBottom:30}}>
<button className="pub-cta pub-cta-orange" onClick={()=>{nav.reset();nav.push("calendario");}}>Ver próximas salidas</button>
</Sec>
</div>;}

Object.assign(window,{PubEspacio,PubViaje,PubExpediente,PubFeedback,PubEntrar,PubCrear,PubBienvenida,PubEmbajadores,PubFacturacion,PubPrivacidad,PubBaja,PubNosotros,ShMenu,ShAvisame});
