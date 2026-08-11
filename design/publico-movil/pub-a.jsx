/* Camino A · DESCUBRIR */
const {useState:uA,useEffect:uAe,useRef:uAr} = React;

function PubInicio({S,nav,ui}){
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<HeadFloat nav={nav}/>
{/* 1 · Bienvenida — breve, orienta */}
<div className="pub-hero" style={{minHeight:520}}>
{/* banco: paisaje · bosque de niebla, Xalatlaco */}
<div className="ph"><Ph cat="paisaje" slug="hongos" ratio={1.45} alt="Bosque de pino entre niebla, Xalatlaco"/></div>
<div className="veil"></div>
<div className="inner" style={{paddingBottom:22}}>
<Eyeb neg>Ciencia real · naturaleza real</Eyeb>
<h1 style={{fontSize:34}}>{S.sesion?"Hola, ":"Bienvenido a "}<em>{S.sesion?S.usuario.nombre.split(" ")[0]+".":"Caminante."}</em></h1>
<div style={{display:"flex",gap:10}}>
<button className="pub-cta" style={{background:"var(--olive)",color:"#fff",flex:1,fontSize:14.5,minHeight:50,padding:"0 10px"}} onClick={ev=>{const c=ev.target.closest(".pub-scroll");const el=c.querySelector("#ini-lugares");if(el)scrollSuave(c,el.offsetTop-56);}}>Ver dónde caminamos →</button>
<button className="pub-cta pub-cta-glass" style={{flex:1,fontSize:14.5,minHeight:50,padding:"0 10px"}} onClick={ev=>{const c=ev.target.closest(".pub-scroll");const el=c.querySelector("#ini-salidas");if(el)scrollSuave(c,el.offsetTop-56);}}>Ver próximas experiencias →</button>
</div>
</div>
</div>
{/* Qué es Caminante — bajo el hero */}
<Sec style={{paddingTop:24}}>
<p style={{fontSize:15.5}}>Llevamos gente a caminar por lugares reales de México — un bosque de hongos, el mar de Cortés, las Barrancas del Cobre — con ciencia real, guías que llevan años leyendo cada lugar y derrama directa en sus comunidades.</p>
<p style={{fontSize:14,color:"var(--ink-soft)",marginTop:10}}>Aquí encuentras las próximas salidas, los lugares y lo que sabemos de cada uno.</p>
</Sec>
{/* Próximas salidas — lista destacada, como antes */}
<Sec id="ini-salidas"><Eyeb>Próximas salidas</Eyeb><h2>Cuándo <em>salimos.</em></h2></Sec>
{PUB.salidas.length===0?<div style={{padding:"0 20px"}}><div className="pub-blk"><div className="pub-state" style={{padding:"8px 0"}}>
<h3>Sin salidas abiertas hoy</h3><p>Las fechas nuevas se anuncian primero por correo. O pide la tuya: con 6 personas se abre una privada.</p>
<div style={{display:"flex",gap:8}}><button className="pub-cta pub-cta-orange pub-cta-sm" onClick={()=>ui.openSheet("avisame",{exp:"las próximas salidas"})}>Avísame</button><button className="pub-cta pub-cta-ghost pub-cta-sm" onClick={()=>nav.push("solicitar",{id:"hongos"})}>Solicitar fecha</button></div>
</div></div></div>:
<div style={{display:"flex",flexDirection:"column",gap:10,padding:"0 20px"}}>
{PUB.salidas.map(s=>{const e=PUB.exps.find(x=>x.id===s.exp);
return <button className="pub-fecha" key={s.id} onClick={()=>nav.push("exp",{id:e.id,origen:"Inicio"})}>
<div className="d"><b>{s.d}</b><small>{s.m}</small></div>
<div className="g"><b>{e.nombre}</b><small>{e.lugar} · {s.lbl}</small></div>
<span className={"disp"+(s.quedan<=3?" low":"")}>{s.quedan===0?"agotada":s.quedan<=3?"quedan "+s.quedan:"quedan "+s.quedan}</span>
</button>;})}
<button className="pub-cta pub-cta-ghost pub-cta-sm" onClick={()=>nav.push("calendario")}>Ver el calendario completo</button>
</div>}
{/* 3 · Lugares — el corazón del inicio */}
<Sec id="ini-lugares"><Eyeb>Lugares</Eyeb><h2>Dónde <em>caminamos.</em></h2></Sec>
<div style={{display:"flex",flexDirection:"column",gap:14,padding:"0 20px"}}>
{PUB.lugares.map(l=><button key={l.id} className="pub-expcard" style={{minHeight:210}} onClick={()=>nav.push("destino",{d:l.id})}>
<div className="ph"><Ph cat={l.tono} slug={l.slug} ratio={.6} alt={l.n}/></div>
<div className="veil"></div>
<div className="inner"><span className="date">{l.n}</span><h3>{l.acc[0]}<em>{l.acc[1]}</em></h3><div className="row"><span className="pub-chip">{l.coord}</span></div></div>
</button>)}
</div>
{/* 4 · Operadores */}
<Sec><Eyeb>Operadores</Eyeb><h2>Quién opera <em>cada salida.</em></h2></Sec>
<div style={{display:"flex",flexDirection:"column",gap:12,padding:"0 20px"}}>
{Object.entries(PUB.ops).map(([id,op])=><button key={id} className="pub-blk" style={{display:"flex",gap:14,alignItems:"center",textAlign:"left",cursor:"pointer"}} onClick={()=>nav.push("operador",{id})}>
{op.marca?<span style={{width:52,height:52,borderRadius:14,background:op.marca.fondo,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"var(--mono)",fontSize:13,fontWeight:700,letterSpacing:".08em",borderBottom:"3px solid "+op.marca.acento}}>KÉN</span>
:<span style={{width:52,height:52,borderRadius:14,background:"var(--forest)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:8}}><img src="assets/logos/caminante-mark-white.png" alt="Caminante" style={{width:"100%",height:"100%",objectFit:"contain"}}/></span>}
<span style={{flex:1,minWidth:0}}>
<b style={{fontSize:15.5,display:"block"}}>{op.n}</b>
{op.bio?<small style={{fontSize:13.5,color:"var(--ink-soft)",lineHeight:1.5,display:"block",marginTop:3}}>{op.bio}</small>
:<small style={{fontSize:13.5,color:"var(--ink-soft)",display:"block",marginTop:3}}>Opera {op.exps.filter(x=>PUB.exps.find(e=>e.id===x&&e.estado==="publicada")).length} experiencias en la plataforma</small>}
</span>
<span style={{color:"var(--sand)",fontSize:17}}>›</span>
</button>)}
<button className="pub-cta pub-cta-ghost pub-cta-sm" onClick={()=>nav.push("embajadores")}>¿Operas experiencias? Camina con nosotros →</button>
</div>
{/* 4 · Testimonios — textuales, con la calificación real */}
<Sec><Eyeb>Lo que dicen</Eyeb><h2>Al volver<em>.</em></h2>
<p style={{fontSize:14,color:"var(--ink-soft)"}}><span className="pub-mono" style={{color:"var(--charcoal)",fontWeight:600}}>4,8 de 5</span> · Ensenada de Muertos · 12 respuestas</p>
</Sec>
<div style={{padding:"0 20px"}}>{PUB.testimonios.length?PUB.testimonios.slice(0,3).map((t,i)=><Testi t={t} key={i}/>):<div className="pub-blk"><div className="pub-state" style={{padding:"6px 0"}}><h3>Todavía sin reseñas</h3><p>Las primeras llegan después de la primera salida — y se publican solo con consentimiento.</p></div></div>}</div>
{/* 5 · Nosotros — la puerta, no el manifiesto */}
<Sec style={{paddingBottom:26}}>
<button className="pub-expcard" style={{minHeight:210}} onClick={()=>nav.push("nosotros")}>
<div className="ph"><Ph cat="paisaje" slug="nosotros" ratio={.6} alt="El bosque de niebla"/></div>
<div className="veil"></div>
<div className="inner"><Eyeb neg>Nosotros</Eyeb><h3>Por qué <em>caminamos.</em></h3><div className="row"><span className="pub-chip">el método, los pilares, la conservación →</span></div></div>
</button>
</Sec>
</div>;}

function PubExps({S,nav}){
const pubs=PUB.exps.filter(e=>e.estado!=="borrador");
const prox=[...PUB.salidas].sort((a,b)=>a.dias-b.dias)[0];
const mejor=pubs.filter(e=>e.cal).sort((a,b)=>parseFloat(b.cal.p.replace(",","."))-parseFloat(a.cal.p.replace(",",".")))[0];
const nueva=pubs.find(e=>e.nueva);
const dest=[
prox&&{e:PUB.exps.find(x=>x.id===prox.exp),k:"Próxima fecha",v:prox.lbl+" · quedan "+prox.quedan},
mejor&&{e:mejor,k:"Mejor calificada",v:mejor.cal.p+" de 5 · "+mejor.cal.n+" respuestas"},
nueva&&{e:nueva,k:"Nueva",v:nueva.cat+" · "+nueva.lugar},
].filter(Boolean).filter((d,i,a)=>a.findIndex(x=>x.e.id===d.e.id)===i);
const irExps=ev=>{const c=ev.target.closest(".pub-scroll");const el=c&&c.querySelector("#exps-todas");if(el)scrollSuave(c,el.offsetTop-64);};
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<HeadFloat nav={nav} oncream/>
<div className="pub-headpad"></div>
<Sec style={{paddingTop:10}}><Eyeb>Destacados</Eyeb><h2>Por dónde <em>empezar.</em></h2>
<p style={{fontSize:14,color:"var(--ink-soft)"}}>La fecha más próxima, la mejor calificada y la más reciente.</p></Sec>
<div className="pub-rail">
{dest.map(d=><button className="pub-expcard rl" key={d.k} onClick={()=>nav.push("exp",{id:d.e.id,origen:"Experiencias"})}>
<div className="ph"><Ph cat={d.e.tono} slug={d.e.slug} ratio={1.1} alt={d.e.nombre}/></div>
<div className="veil"></div>
<div className="inner">
<span className="date" style={{color:"var(--orange)"}}>{d.k}</span>
<h3 style={{fontSize:22}}>{d.e.titulo[0]}<em>{d.e.titulo[1]}</em></h3>
<div className="row"><span className="pub-chip">{d.v}</span></div>
</div>
</button>)}
</div>
<Sec style={{paddingTop:26}}><Eyeb>Lugares</Eyeb><h2>Dónde <em>caminamos.</em></h2>
<p style={{fontSize:14,color:"var(--ink-soft)"}}>Entra a un lugar y ahí encuentras sus experiencias.</p></Sec>
<div style={{display:"flex",flexDirection:"column",gap:12,padding:"0 20px"}}>
{PUB.lugares.map(l=>{const n=l.exps.filter(id=>PUB.exps.find(x=>x.id===id).estado!=="borrador").length;
return <button key={l.id} className="pub-expcard" style={{minHeight:150}} onClick={()=>nav.push("destino",{d:l.id,origen:"Experiencias"})}>
<div className="ph"><Ph cat={l.tono} slug={l.slug} ratio={.5} alt={l.n}/></div>
<div className="veil"></div>
<div className="inner"><span className="date">{l.n}</span><h3 style={{fontSize:21}}>{l.acc[0]}<em>{l.acc[1]}</em></h3><div className="row"><span className="pub-chip">{n===1?"1 experiencia":n+" experiencias"} →</span></div></div>
</button>;})}
</div>
{[...new Set(PUB.exps.map(e=>e.cat))].map((cat,ci,cats)=><React.Fragment key={cat}>
<Sec id={ci===0?"exps-todas":undefined} style={{paddingTop:26}}><Eyeb>{cat}</Eyeb><h2 style={{fontSize:24}}>{PUB.exps.filter(e=>e.cat===cat).length===1?"Una salida":PUB.exps.filter(e=>e.cat===cat).length+" salidas"} <em>{cat==='Ocean Safari'?'al mar.':cat==='Trekking'?'de varios días.':'al bosque.'}</em></h2></Sec>
<div style={{display:"flex",flexDirection:"column",gap:16,padding:"0 20px"+(ci===cats.length-1?" 24px":" 0")}}>
{PUB.exps.filter(e=>e.cat===cat).map(e=>{const sal=PUB.salidas.filter(s=>s.exp===e.id);
return <button className="pub-expcard" key={e.id} onClick={()=>nav.push("exp",{id:e.id,origen:"Experiencias"})}>
<div className="ph"><Ph cat={e.tono} slug={e.slug} ratio={.75} alt={e.nombre}/></div>
<div className="veil"></div>
<div className="inner">
<span className="date">{e.cat} · {e.lugar}</span>
<h3>{e.titulo[0]}<em>{e.titulo[1]}</em></h3>
<div className="row">
{e.estado==="borrador"?<span className="pub-chip warn">Muy pronto</span>:
sal.length?<><span className="pub-chip">{sal[0].lbl}{sal.length>1?" +"+(sal.length-1):""}</span><span className="pub-chip">{e.precio?("desde "+pfmt(e.precio)):e.precioTxt}</span></>:
<span className="pub-chip solid">Sin fechas · solicita la tuya</span>}
</div>
</div>
</button>;})}
</div>
</React.Fragment>)}
<div style={{padding:"20px 20px 24px"}}><button className="pub-cta pub-cta-ghost" onClick={()=>nav.push("calendario")}>Ver el calendario completo</button></div>
</div>;}

/* A3 · experiencia — secciones desplegables */
function Secd({sx,t,title,open,children}){return <details className="pub-secd" data-sx={sx} open={open}><summary><span className="sy"><span className="pub-eyebrow"><span className="sl">//</span> {t}</span>{title}</span><span className="chev">⌄</span></summary><div className="bd">{children}</div></details>;}
function PubExp({S,A,nav,ui,params}){
const e=PUB.exps.find(x=>x.id===params.id);
const sal=PUB.salidas.filter(s=>s.exp===e.id);
const [idx,setIdx]=uA(0);
const [cargando,setCargando]=uA(true);
const [railHost,setRailHost]=uA(null);
const [railVis,setRailVis]=uA(false);
const rootRef=uAr(null);
uAe(()=>{const t=setTimeout(()=>setCargando(false),900);return()=>clearTimeout(t);},[]);
uAe(()=>{if(rootRef.current)setRailHost(rootRef.current.closest(".pub-app"));},[]);
uAe(()=>{if(!railHost)return;const cont=railHost.querySelector(".pub-scroll");if(!cont)return;let tm;
const onS=()=>{const els=[...cont.querySelectorAll("[data-sx]")];const st=cont.scrollTop+220;let k=0;els.forEach(el=>{if(el.offsetTop<=st)k=Math.max(k,parseInt(el.dataset.sx,10));});setIdx(k);setRailVis(true);clearTimeout(tm);tm=setTimeout(()=>setRailVis(false),1300);};
cont.addEventListener("scroll",onS,{passive:true});return()=>{clearTimeout(tm);cont.removeEventListener("scroll",onS);};},[railHost]);
const irA=i=>{const cont=railHost.querySelector(".pub-scroll");const el=cont.querySelector('[data-sx="'+i+'"]');if(el){if(el.tagName==="DETAILS")el.open=true;scrollSuave(cont,el.offsetTop-64);}};
const secs=["La experiencia","Itinerario","La inversión","Incluye","Tu guía","Comunidad",...(e.ficha&&e.ficha.especies.length?["Ficha"]:[]),"Mochila",...(e.faq.length?["Preguntas"]:[]),"Fechas"];
if(e.estado==="borrador")return <div className="pub-screen">
<HeadFloat nav={nav} back backLabel={params.origen}/>
<div className="pub-hero" style={{minHeight:420}}>
<div className="ph"><Ph cat={e.tonoHero} slug={e.slug} ratio={1.2} alt={e.nombre}/></div><div className="veil"></div>
<div className="inner"><Eyeb neg>{e.cat} · {e.lugar}</Eyeb><h1>{e.titulo[0]}<em>{e.titulo[1]}</em></h1><p>{e.tag}</p></div>
</div>
<div className="pub-state" style={{paddingTop:40}}>
<span className="ic">◌</span><h3>Todavía no se puede comprar</h3>
<p>Esta experiencia está en preparación. Déjanos tu correo y te avisamos cuando abra la primera fecha.</p>
<button className="pub-cta pub-cta-orange" style={{width:"auto",padding:"0 26px"}} onClick={()=>ui.openSheet("avisame",{exp:e.nombre})}>Avísame</button>
</div>
</div>;
return <div className="pub-screen" ref={rootRef}>
<HeadFloat nav={nav} back backLabel={params.origen}/>
<div className="pub-hero">
{/* banco: paisaje · el hero nunca lleva foto de sujeto */}
<div className="ph"><Ph cat={e.tonoHero} slug={e.slug} ratio={1.45} alt={e.nombre}/></div>
<div className="veil"></div>
<div className="inner" style={{paddingBottom:22}}>
<Eyeb neg>{e.cat} · {e.lugar}</Eyeb>
<h1>{e.nombre}. {e.titulo[0]}<em>{e.titulo[1]}</em></h1>
<p>{e.tag}</p>
{e.guia&&<span className="meta">{sal[0]?sal[0].lbl+" · ":""}guiada por {e.guia.n}</span>}
</div>
</div>
<Secd sx={0} t="La experiencia" open title={<h2>Un {e.id==="hongos"?"domingo":"viaje"} <em>completo.</em></h2>}>
{e.expTxt.map((p,i)=><p key={i}>{p}</p>)}
{/* banco: gente · el bloque de personas lleva foto de sujeto */}
<div style={{borderRadius:20,overflow:"hidden",marginTop:16,height:190,boxShadow:"var(--shadow)"}}><Ph cat="gente" slug={e.slug} ratio={.55} alt="Personas caminando en la experiencia"/></div>
</Secd>
<Secd sx={1} t="Itinerario">
<div className="pub-it">{e.iti.map((s,i)=><div className={"step "+s[3]} key={i}><span className="h">{s[0]}</span><b>{s[1]}</b>{s[2]&&<p>{s[2]}</p>}</div>)}</div>
</Secd>
<Secd sx={2} t="La inversión">
{e.niveles?<div style={{display:"flex",flexDirection:"column",gap:10}}>
{e.niveles.map(([n,p],i)=><div className="pub-fecha" key={n}><div className="g"><b>{n}</b><small>Por persona · todo incluido</small></div><span className="disp pub-mono" style={{fontSize:16}}>{pfmt(p)}</span></div>)}
</div>:
<h2 style={{margin:"0 0 10px",fontSize:26,fontWeight:200}}>{e.precio?pfmt(e.precio):e.precioTxt} <em>{e.precio?"por persona.":""}</em></h2>}
{e.precio&&!e.niveles&&<p>Todo incluido. Sin letras chicas: lo que no está en la lista de abajo, no se cobra aparte.</p>}
</Secd>
<Sec><Eyeb>El método Caminante</Eyeb><h2 style={{fontSize:24}}><em>{e.statement}</em></h2></Sec>
<Secd sx={3} t="Qué incluye">
<div className="pub-inc" style={{marginTop:0,borderTop:0}}>{e.incluye.map((r,i)=><div className="row" key={i}><span className="sl">//</span><span>{r[0]}{r[1]&&<small>{r[1]}</small>}</span></div>)}</div>
</Secd>
{e.guia&&<Secd sx={4} t="Quién te guía">
<div className="pub-guide">
{/* banco: gente · retrato de la guía */}
<div className="av"><Ph cat="gente" slug={e.slug} alt={"Retrato de "+e.guia.n}/></div>
<div className="g"><b>{e.guia.n}</b><small>{e.guia.r}</small><p>{e.guia.q}</p></div>
</div>
<button className="pub-cta pub-cta-ghost pub-cta-sm" style={{marginTop:12}} onClick={()=>nav.push("operador",{id:e.op})}>Operada por {PUB.ops[e.op].n} →</button>
</Secd>}
{e.comunidad&&<Secd sx={5} t="La comunidad" title={<h2>De quién es <em>este lugar.</em></h2>}>
<p>{e.comunidad}</p>
{/* banco: comunidad */}
<div style={{borderRadius:20,overflow:"hidden",marginTop:16,height:170,boxShadow:"var(--shadow)"}}><Ph cat="comunidad" slug={e.slug} ratio={.5} alt="La comunidad local"/></div>
</Secd>}
{e.ficha&&(e.ficha.especies.length>0||e.ficha.glosario.length>0)&&<Secd sx={secs.indexOf("Ficha")>=0?secs.indexOf("Ficha"):undefined} t="Ficha científica" title={<h2>Lo que vas a <em>encontrar.</em></h2>}>
<p>Cada dato lleva su fuente — sin fuente, el dato no entra. Es la regla de la casa.</p>
{e.ficha.especies.length>0&&<div className="pub-ficha">
{e.ficha.especies.map((sp,i)=><details key={i} open={i===0}>
<summary><b>{sp[0]}<i>{sp[1]}</i></b><span className="x">+</span></summary>
<div className="body">{sp[2]}<span className="pub-fuente">Fuente · {sp[3]}</span></div>
</details>)}
</div>}
<div className="pub-glos">{e.ficha.glosario.map(g=><span key={g}>{g}</span>)}</div>
<p style={{marginTop:12,fontSize:14,color:"var(--ink-soft)"}}><span className="pub-mono" style={{fontSize:13,letterSpacing:".08em",textTransform:"uppercase",color:"var(--olive)"}}>Temporada · </span>{e.ficha.temporada}</p>
</Secd>}
<Secd sx={secs.indexOf("Mochila")} t="La mochila">
<div className="pub-inc" style={{marginTop:0,borderTop:0}}>{e.packing.map((r,i)=><div className="row" key={i}><span className="sl">//</span><span>{r[0]}{r[1]&&<small>{r[1]}</small>}</span></div>)}</div>
</Secd>
{e.faq.length>0&&<Secd sx={secs.indexOf("Preguntas")} t="Preguntas">
<div className="pub-faq">{e.faq.map((f,i)=><details key={i} open={i===0}><summary>{f[0]}<span className="x">+</span></summary><div className="a">{f[1]}</div></details>)}</div></Secd>}
<Secd sx={secs.indexOf("Fechas")} t="Próximas fechas" open>
{cargando?<div className="pub-blk"><div className="pub-skel"><span className="sk" style={{width:"60%"}}></span><span className="sk" style={{width:"85%"}}></span></div><div style={{display:"flex",gap:10,alignItems:"center",justifyContent:"center",paddingBottom:14,fontSize:13.5,color:"var(--ink-soft)"}}><span className="pub-spin"></span>Consultando disponibilidad…</div></div>:
sal.length===0?<div className="pub-blk"><div className="pub-state" style={{padding:"10px 0 4px"}}>
<h3>No hay fechas abiertas</h3><p>Puedes pedir la tuya: con 6 personas o más se abre una salida privada.</p>
<button className="pub-cta pub-cta-orange" style={{width:"auto",padding:"0 24px"}} onClick={()=>nav.push("solicitar",{id:e.id})}>Solicitar mi fecha</button>
</div></div>:
<div style={{display:"flex",flexDirection:"column",gap:10}}>
{sal.map(s=><div className="pub-fecha" key={s.id}><div className="d"><b>{s.d}</b><small>{s.m}</small></div><div className="g"><b>{s.lbl}</b><small>Operada por {PUB.ops[e.op].n}</small><span className={"disp"+(s.quedan<=3?" low":"")} style={{display:"block",marginTop:3}}>{s.quedan===0?"agotada":s.quedan<=3?"quedan "+s.quedan:s.quedan+" lugares"}</span></div><button className="pub-cta pub-cta-orange pub-cta-sm" style={{width:"auto",flex:"0 0 auto"}} disabled={s.quedan===0} onClick={()=>nav.push("reservar",{id:e.id,salida:s.id})}>Reservar</button></div>)}
<button className="pub-cta pub-cta-ghost pub-cta-sm" onClick={()=>nav.push("solicitar",{id:e.id})}>¿Ninguna te sirve? Solicita tu fecha</button>
</div>}
</Secd>
{railHost&&ReactDOM.createPortal(<React.Fragment><div className={"pub-rail-f"+(railVis?" vis":"")}>
<span className="cnt">{secs.length} secciones</span>
{secs.map((s,i)=><button key={s} className={i===idx?"on":""} onClick={()=>irA(i)}>{s}</button>)}
</div>
<div className="pub-buybar">
<div className="p"><b>{e.precio?"desde "+pfmt(e.precio):"por anunciar"}</b><small>{sal[0]?("por persona · "+sal[0].lbl):"puedes solicitar tu fecha"}</small></div>
{sal.length?<button className="pub-cta pub-cta-orange" onClick={()=>irA(secs.indexOf("Fechas"))}>Ver fechas</button>:
<button className="pub-cta pub-cta-orange" onClick={()=>nav.push("solicitar",{id:e.id})}>Solicitar grupo</button>}
</div></React.Fragment>,railHost)}
</div>;}

/* LUGAR — la pantalla completa del territorio */
function PubDestino({S,nav,ui,params}){
const l=PUB.lugares.find(x=>x.id===params.d)||PUB.lugares.find(x=>x.n===params.d);
const caps=CAPS.filter(c=>c.estado==="publicada"&&l.exps.includes(c.expId));
const conFecha=l.exps.some(id=>PUB.salidas.some(s=>s.exp===id));
const nExps=l.exps.filter(id=>PUB.salidas.some(s=>s.exp===id)).length;
const irExps=ev=>{const cont=ev.target.closest(".pub-scroll");const el=cont&&cont.querySelector("#lug-exps");if(el)scrollSuave(cont,el.offsetTop-64);};
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<HeadFloat nav={nav} back backLabel={params.origen||"Inicio"}/>
{/* 1 · hero con coordenada — territorio, no destino turístico */}
<div className="pub-hero" style={{minHeight:440}}>
{/* banco: paisaje · del lugar */}
<div className="ph"><Ph cat={l.tono} slug={l.slug} ratio={1.2} alt={l.n}/></div><div className="veil"></div>
<div className="inner" style={{paddingBottom:24}}>
<Eyeb neg>{l.n}</Eyeb>
<h1 style={{fontSize:36}}>{l.acc[0]}<em>{l.acc[1]}</em></h1>
<p>{l.sub}</p>
<span className="meta">{l.coord}</span>
{nExps>0?<button className="pub-cta pub-cta-orange" onClick={irExps}>Ver experiencias · {nExps} →</button>
:<button className="pub-cta pub-cta-glass" onClick={irExps}>Cuándo venir · avísame</button>}
</div>
</div>
{/* 2 · el territorio por dentro */}
<Sec><Eyeb>El territorio por dentro</Eyeb>
{l.terr.map((p,i)=><p key={i} style={{marginTop:i?12:14}}>{p}</p>)}
<div className="pub-pild">{l.pild.map(([k,v])=><div className="pd" key={k}><b className="pub-mono">{v}</b><small>{k}</small></div>)}</div>
</Sec>
{/* 3 · experiencias aquí — lo primero accionable: donde se compra */}
<Sec id="lug-exps"><Eyeb>Experiencias</Eyeb><h2 style={{fontSize:24}}>{l.vivir[0]}<em>.</em></h2>
<p style={{fontSize:14.5,color:"var(--ink-soft)",marginTop:8}}>{l.vivir[1]}</p>
<div style={{display:"flex",flexDirection:"column",gap:14,marginTop:14}}>
{l.exps.filter(id=>PUB.exps.find(x=>x.id===id).estado!=="borrador").map(id=>{const e=PUB.exps.find(x=>x.id===id);const sal=PUB.salidas.filter(s=>s.exp===id);
return <button className="pub-expcard" style={{minHeight:280}} key={id} onClick={()=>nav.push("exp",{id,origen:l.n})}>
{/* banco: la foto de la experiencia, no la del estado */}
<div className="ph"><Ph cat={e.tono} slug={e.slug} ratio={.75} alt={e.nombre}/></div>
<div className="veil"></div>
<div className="inner">
{sal[0]&&<span className="date">Próxima · {sal[0].lbl} · quedan {sal[0].quedan} de {sal[0].cupo}</span>}
<h3>{e.titulo[0]}<em>{e.titulo[1]}</em></h3>
<p style={{fontSize:14.5,lineHeight:1.5,color:"rgba(255,255,255,.88)",maxWidth:"32ch"}}>{e.tag}</p>
<div className="row">
<span className="pub-chip">{e.niveles?"desde "+pfmt(e.niveles[0][1]):e.precio?pfmt(e.precio)+" por persona":"Fechas por anunciar"}</span>
{sal[1]&&<span className="pub-chip">{sal[1].lbl} · {sal[1].quedan} de {sal[1].cupo}</span>}
{e.op!=="caminante"&&<span className="pub-chip">Operada por {PUB.ops[e.op].n}</span>}
</div>
</div>
</button>;})}
{!conFecha&&<div className="pub-blk">
<span className="pub-lbl">Cuándo suele haber salida</span>
<div className="pub-inc" style={{marginTop:0,borderTop:0}}>
{(l.temporadas||[]).map(([q,c])=><div className="row" key={q}><span className="sl">//</span><span>{q}<small>{c}</small></span></div>)}
</div>
<div style={{display:"flex",gap:8,marginTop:14}}><button className="pub-cta pub-cta-orange pub-cta-sm" style={{flex:1}} onClick={()=>ui.openSheet("avisame",{exp:l.n})}>Avísame</button><button className="pub-cta pub-cta-ghost pub-cta-sm" style={{flex:1}} onClick={()=>nav.push("solicitar",{id:l.exps[0]})}>Solicitar fecha</button></div>
</div>}
</div>
</Sec>
{/* 4 · las cuatro caras */}
<Sec><Eyeb>Las cuatro caras</Eyeb><h2>Un lugar se lee <em>por cuatro lados.</em></h2>
<div className="pub-ficha">
{l.caras.map(([t,txt],i)=><details key={t} open={i===0}>
<summary><b>{t}</b><span className="x">+</span></summary>
<div className="body">{txt}</div>
</details>)}
</div>
</Sec>
{/* 5 · aprende aquí */}
<Sec><Eyeb>Aprende aquí</Eyeb>
{caps.length?<div style={{marginTop:12}}>{caps.slice(0,3).map(c=><CapRow c={c} key={c.id} nav={nav} ui={ui}/>)}</div>
:<p style={{marginTop:10,fontSize:14.5,color:"var(--ink-soft)"}}>Este lugar tendrá sus cápsulas — el material documentado ya existe.</p>}
</Sec>
{/* 6 · galería con pie — la foto sin nombre no enseña nada */}
<Sec><Eyeb>Galería</Eyeb>
<div className="pub-gal">
{l.galeria.map(([cat,pie],i)=><figure key={i}>{/* banco: {cat} · {l.slug} */}<Ph cat={cat} slug={l.slug} ratio={.8} alt={pie}/><figcaption>{pie}</figcaption></figure>)}
</div>
</Sec>
{/* 7 · cierre */}
<Sec style={{paddingBottom:28}}>
<div className="pub-expcard" style={{minHeight:200}}>
<div className="ph"><Ph cat="cielo" slug={l.slug} ratio={.55} alt={l.cierre[0]}/></div>
<div className="veil"></div>
<div className="inner"><Eyeb neg>{l.cierre[0]}</Eyeb><h3>{l.cierre[1]}<em>{l.cierre[2]}</em></h3></div>
</div>
</Sec>
</div>;}

function PubCalendario({S,nav,ui}){
const meses=[["Agosto 2026",PUB.salidas.filter(s=>s.mes==="Agosto")],["Septiembre 2026",[]],["Octubre 2026",PUB.salidas.filter(s=>s.mes==="Octubre")],["Noviembre 2026",[]]];
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<NavCream nav={nav} t="Calendario" s="las salidas abiertas, por mes"/>
<Sec style={{paddingTop:10}}><Eyeb>Calendario</Eyeb><h2>Las salidas <em>abiertas.</em></h2>
<p>Hoy hay 4 salidas en 3 experiencias. Si tu mes está vacío, pide tu fecha — con 6 personas se abre una privada.</p></Sec>
{meses.map(([m,sals])=><div className="pub-mes" key={m}>
<h3>{m}</h3>
{sals.length?<div style={{display:"flex",flexDirection:"column",gap:10}}>
{sals.map(s=>{const e=PUB.exps.find(x=>x.id===s.exp);
return <button className="pub-fecha" key={s.id} onClick={()=>nav.push("exp",{id:e.id,origen:"Calendario"})}>
<div className="d"><b>{s.d}</b><small>{s.m}</small></div>
<div className="g"><b>{e.nombre}</b><small>{e.lugar} · {PUB.ops[e.op].n}</small></div>
<span className={"disp"+(s.quedan<=3?" low":"")}>{s.quedan<=3?"quedan "+s.quedan:s.quedan+" lugares"}</span>
</button>;})}
</div>:
<div className="empty"><p>Sin salidas este mes.</p><button className="pub-cta pub-cta-ghost pub-cta-sm" onClick={()=>ui.openSheet("avisame",{exp:"salidas de "+m})}>Avísame</button></div>}
</div>)}
<div style={{height:28}}></div>
</div>;}

function PubOperador({nav,params}){
const op=PUB.ops[params.id];
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<NavCream nav={nav} t={op.n} s="operadora"/>
<Sec><Eyeb>Operadora</Eyeb><h2>{op.n}<em>.</em></h2><p>{op.d}</p></Sec>
<Sec style={{paddingTop:10,paddingBottom:26}}><Eyeb>Sus experiencias</Eyeb>
<div style={{display:"flex",flexDirection:"column",gap:14,marginTop:14}}>
{op.exps.map(id=>{const e=PUB.exps.find(x=>x.id===id);
return <button className="pub-expcard" style={{minHeight:180}} key={id} onClick={()=>nav.push("exp",{id})}>
<div className="ph"><Ph cat={e.tono} slug={e.slug} ratio={.5} alt={e.nombre}/></div><div className="veil"></div>
<div className="inner"><h3 style={{fontSize:22}}>{e.titulo[0]}<em>{e.titulo[1]}</em></h3></div>
</button>;})}
</div>
</Sec>
</div>;}

/* APRENDE — la ciencia de cada lugar, con fuente */
function PubAprende({S,nav}){
const hongos=PUB.exps.find(e=>e.id==="hongos");
return <div className="pub-screen" style={{background:"var(--panel)",minHeight:"100%"}}>
<HeadFloat nav={nav} oncream/>
<div className="pub-headpad"></div>
<Sec style={{paddingTop:10}}><Eyeb>Aprende</Eyeb><h2>La ciencia de <em>cada lugar.</em></h2>
<p>cada dato lleva su fuente — sin fuente, el dato no entra. es la regla de la casa.</p></Sec>
<Sec style={{paddingTop:14}}><Eyeb>Especies · El bosque de Xalatlaco</Eyeb>
<div className="pub-ficha">
{hongos.ficha.especies.map((sp,i)=><details key={i} open={i===0}>
<summary><b>{sp[0]}<i>{sp[1]}</i></b><span className="x">+</span></summary>
<div className="body">{sp[2]}<span className="pub-fuente">Fuente · {sp[3]}</span></div>
</details>)}
</div>
<button className="pub-cta pub-cta-ghost pub-cta-sm" style={{marginTop:12}} onClick={()=>nav.push("exp",{id:"hongos"})}>Ir a la experiencia →</button>
</Sec>
<Sec><Eyeb>Glosario y temporada · por experiencia</Eyeb>
<div className="pub-blk" style={{marginTop:14,padding:"6px 16px"}}>
{PUB.exps.filter(e=>e.ficha&&e.estado==="publicada").map(e=><button key={e.id} className="pub-exp-row" onClick={()=>nav.push("exp",{id:e.id})}>
<div className="g"><b>{e.nombre}</b><small>{e.ficha.glosario.slice(0,4).join(" · ")} · {e.ficha.temporada}</small></div><span className="ok">›</span>
</button>)}
</div>
</Sec>
<Sec style={{paddingBottom:30}}><Eyeb>El porqué</Eyeb>
<button className="pub-expcard" style={{minHeight:180,marginTop:14}} onClick={()=>nav.push("nosotros")}>
<div className="ph"><Ph cat="paisaje" slug="nosotros" ratio={.5} alt="Bosque de niebla"/></div>
<div className="veil"></div>
<div className="inner"><Eyeb neg>Nosotros</Eyeb><h3 style={{fontSize:22}}>Por qué <em>caminamos.</em></h3></div>
</button>
</Sec>
</div>;}

Object.assign(window,{PubInicio,PubExps,PubExp,PubDestino,PubCalendario,PubAprende,PubOperador});
