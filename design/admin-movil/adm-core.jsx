const {useState,useEffect,useRef} = React;
const fmt = n => "$" + Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g,".") ;
const fmtS = n => (n<0?"−":"+") + fmt(n);
const fmtD = n => {const s=Math.abs(n).toFixed(2).replace(".",",");return (n<0?"−$":"$")+s.replace(/\B(?=(\d{3})+(?!\d))/g,".");};

const INIT = {
ops:[
 {id:"nanae",nombre:"NANAE",comision:15},
 {id:"kentro",nombre:"Kéntro",comision:null,nota:"trato 0% verbal · sin definir por escrito"},
 {id:"octavio",nombre:"Octavio · Barrancas",comision:null},
],
exps:[
 {id:"hongos",nombre:"Recolección de hongos",op:"nanae",estado:"publicada",candado:[],secciones:{listas:13,total:16}},
 {id:"kentroexp",nombre:"Hacienda y hongos · Kentro",op:"kentro",estado:"publicada",candado:[]},
 {id:"barrancas",nombre:"Trekking Barrancas del Cobre",op:"octavio",estado:"publicada",candado:[]},
 {id:"ensenada",nombre:"Ensenada de Muertos",op:null,estado:"publicada",candado:[]},
 {id:"monarca",nombre:"Hike Mariposas Monarca",op:null,estado:"borrador",candado:["Deslinde de responsabilidad","Encuesta activa"]},
],
salidas:[
 {id:"s1",exp:"hongos",etiqueta:"Día de campo · hoy",fecha:"9 ago",ini:"9 ago 2026",fin:"9 ago 2026",cupo:17,ocup:17,precio:2550,venta:"cerrada",privada:false},
 {id:"s2",exp:"hongos",etiqueta:"Día de campo · 23 ago",fecha:"23 ago",ini:"23 ago 2026",fin:"23 ago 2026",cupo:18,ocup:3,precio:2550,venta:"abierta",privada:true,link:"caminante.mx/s/hongos-23ago-privada"},
 {id:"s3",exp:"kentroexp",etiqueta:"Hacienda · 29 ago",fecha:"29 ago",ini:"29 ago 2026",fin:"29 ago 2026",cupo:16,ocup:5,precio:11500,venta:"abierta",privada:true,link:"caminante.mx/s/hacienda-29ago"},
 {id:"s4",exp:"barrancas",etiqueta:"Barrancas · 8–11 oct",fecha:"8–11 oct",ini:"8 oct 2026",fin:"11 oct 2026",cupo:12,ocup:2,precio:16500,venta:"abierta",privada:false},
 {id:"s5",exp:"barrancas",etiqueta:"Barrancas · 15–18 oct",fecha:"15–18 oct",ini:"15 oct 2026",fin:"18 oct 2026",cupo:12,ocup:0,precio:16500,venta:"abierta",privada:false},
],
reservas:[
 {id:"r1",persona:"Roberto Díaz",salida:null,expLabel:"Ocean Safari · 16–19 jul",pax:1,total:16000,pagado:8000,estado:"anticipo",deslinde:true,canal:"web · 1 jul"},
 {id:"r2",persona:"Mariana López",salida:"s2",expLabel:"Hongos · 23 ago",pax:2,total:5100,pagado:5100,estado:"pagada",deslinde:true,canal:"Stripe · 2 ago"},
 {id:"r3",persona:"Karla Sandoval",salida:"s2",expLabel:"Hongos · 23 ago",pax:2,total:5100,pagado:0,estado:"pendiente",deslinde:false,canal:"cobro por WhatsApp"},
 {id:"r4",persona:"Valeria Gómez",salida:"s4",expLabel:"Barrancas · 8–11 oct",pax:1,total:16500,pagado:0,estado:"confirmada",deslinde:false,canal:"aparta lugar · sin pago"},
 {id:"r5",persona:"Marco Torres",salida:"s1",expLabel:"Hongos · hoy",pax:1,total:2550,pagado:2550,estado:"pagada",deslinde:false,canal:"Stripe · 20 jul"},
 {id:"r6",persona:"Gina Herrera",salida:"s1",expLabel:"Hongos · hoy",pax:1,total:2550,pagado:0,estado:"cancelada",deslinde:false,canal:"reembolsada 30 jul"},
],
personas:[
 {id:"p1",nombre:"Mariana López",ini:"ML",viajes:3,desde:2025,total:37100,mail:"mariana@—.mx",tel:"55 1234 5678",tag:"Recurrente",firmas:[["Ocean Safari","20 jul · 14:02"],["Hongos 23 ago","3 ago · 09:44"]],comp:[["Jorge López","emergencia: 55 8765 4321"]],reviews:[{exp:"Ocean Safari",fecha:"jul 2026",rating:5,nps:9,txt:"«El mejor regalo que me he dado.»"}]},
 {id:"p2",nombre:"Roberto Díaz",ini:"RD",viajes:1,desde:2026,total:8000,mail:"rob@—.mx",tel:"55 2222 8888",tag:"Debe",firmas:[["Ocean Safari","30 jun · 19:10"]],comp:[],reviews:[]},
 {id:"p3",nombre:"Ana Ruiz",ini:"AR",viajes:2,desde:2025,total:21050,mail:"ana@—.mx",tel:"55 1111 2222",tag:"Promotora",firmas:[["Hongos hoy","1 ago · 10:00"]],comp:[],reviews:[{exp:"Ocean Safari",fecha:"jun 2026",rating:5,nps:10,txt:"«Volví a casa distinto. No es un tour, es otra cosa.»"}]},
 {id:"p4",nombre:"Danaé Salazar",ini:"DS",viajes:1,desde:2026,total:16500,mail:"danae@revista192.com",tel:"55 2095 8279",tag:"Nueva",firmas:[],comp:[],reviews:[]},
 {id:"p5",nombre:"Renatta Pizarro",ini:"RP",viajes:1,desde:2026,total:16500,mail:"rpizarroh@gmail.com",tel:null,tag:"Nueva",firmas:[["Barrancas 8–11 oct","8 ago · 23:10"]],comp:[],reviews:[]},
 {id:"p6",nombre:"Sebastian poza",ini:"SP",viajes:1,desde:2026,total:5100,mail:"sposa@—.mx",tel:"55 8712 0034",tag:"Nueva",firmas:[["Hongos 23 ago","2 ago · 18:30"]],comp:[["Anxel García","acompañante · Hongos 23 ago"],["Nala poza","acompañante · Hongos 23 ago"]],reviews:[]},
 {id:"p7",nombre:"Valentina Ortiz Monasterio",ini:"VO",viajes:1,desde:2026,total:34500,mail:"valeortizm@—.mx",tel:"55 4410 9982",tag:"Nueva",firmas:[["Hacienda 29 ago","1 ago · 09:20"]],comp:[["5 acompañantes","sin registrar — pedir que complete el registro"]],reviews:[]},
 {id:"p8",nombre:"Abraham de Alba",ini:"AA",viajes:1,desde:2026,total:5100,mail:"abdealba@—.mx",tel:"55 3390 5511",tag:"Nueva",firmas:[],comp:[["1 acompañante","sin registrar"]],reviews:[]},
 {id:"p9",nombre:"Karla Sandoval",ini:"KS",viajes:1,desde:2026,total:0,mail:"karla@—.mx",tel:"55 9876 1234",tag:"Nueva",firmas:[],comp:[],reviews:[]},
 {id:"p10",nombre:"Valeria Gómez",ini:"VG",viajes:1,desde:2026,total:0,mail:"vale@—.mx",tel:"55 5544 3322",tag:"Nueva",firmas:[],comp:[],reviews:[]},
 {id:"p11",nombre:"Marco Torres",ini:"MT",viajes:1,desde:2026,total:2550,mail:"marco@—.mx",tel:"55 3333 4444",tag:"Nueva",firmas:[],comp:[],reviews:[]},
 {id:"p12",nombre:"Gina Herrera",ini:"GH",viajes:0,desde:2026,total:0,mail:"gina@—.mx",tel:"55 7788 9900",tag:"Nueva",firmas:[],comp:[],reviews:[]},
 {id:"p13",nombre:"Pau García",ini:"PG",viajes:2,desde:2025,total:5100,mail:"pau@—.mx",tel:"55 2222 3333",tag:"Promotora",firmas:[["Hongos 12 jul","10 jul · 08:15"],["Hongos hoy","1 ago · 11:02"]],comp:[],reviews:[{exp:"Hongos · 12 jul",fecha:"jul 2026",rating:5,nps:9,txt:"«La guía sabía el nombre de cada hongo. Impresionante.»"}]},
 {id:"p14",nombre:"Elena Vega",ini:"EV",viajes:1,desde:2026,total:2550,mail:"elena@—.mx",tel:"55 5555 6666",tag:"Nueva",firmas:[],comp:[],reviews:[]},
 {id:"p15",nombre:"Diego Lara",ini:"DL",viajes:1,desde:2026,total:2550,mail:"diego@—.mx",tel:"55 9999 0000",tag:"Nueva",firmas:[["Hongos 12 jul","10 jul · 09:00"]],comp:[],reviews:[{exp:"Hongos · 12 jul",fecha:"jul 2026",rating:4,nps:8,txt:"«Muy bien organizado. La caminata se me hizo corta.»"}]},
 {id:"p16",nombre:"Julia Peña",ini:"JP",viajes:1,desde:2026,total:2550,mail:"julia@—.mx",tel:"55 1212 3434",tag:"Nueva",firmas:[["Hongos hoy","2 ago · 10:40"]],comp:[],reviews:[]},
 {id:"p17",nombre:"Sofía Prieto",ini:"SF",viajes:1,desde:2026,total:2550,mail:"sofia@—.mx",tel:"55 7777 8888",tag:"Nueva",firmas:[["Hongos hoy","2 ago · 12:05"]],comp:[],reviews:[]},
],
roster:[
 {n:"Ana Ruiz",tel:"55 1111 2222",em:"Luis Ruiz · 55 3333 4444",med:"Alergia a picadura de abeja — trae epinefrina",firmo:true,in:false},
 {n:"Pau García",tel:"55 2222 3333",em:"Rosa García · 55 4444 5555",med:null,firmo:true,in:false},
 {n:"Marco Torres",tel:"55 3333 4444",em:"sin registrar",med:"Deslinde SIN FIRMAR — firmar antes de subir a la van",firmo:false,in:false},
 {n:"Elena Vega",tel:"55 5555 6666",em:"Raúl Vega · 55 6666 7777",med:"Deslinde SIN FIRMAR",firmo:false,in:false},
 {n:"Sofía Prieto",tel:"55 7777 8888",em:"Marta P. · 55 8888 9999",med:null,firmo:true,in:false},
 {n:"Diego Lara",tel:"55 9999 0000",em:"Nora Lara · 55 0000 1111",med:"Asma leve — trae inhalador",firmo:true,in:false},
 {n:"Julia Peña",tel:"55 1212 3434",em:"Iván Peña · 55 5656 7878",med:null,firmo:true,in:false},
],
deslPend:[{id:"d1",n:"Marco Torres",ini:"MT",sub:"Hongos · hoy · pagó y no firma"},{id:"d2",n:"Elena Vega",ini:"EV",sub:"Hongos · hoy"},{id:"d3",n:"Karla Sandoval",ini:"KS",sub:"Hongos · 23 ago"},{id:"d4",n:"Tomás Ibarra",ini:"TI",sub:"Barrancas · oct"},{id:"d5",n:"Luz Camarena",ini:"LC",sub:"Barrancas · oct"}],
encPend:[{id:"e1",n:"Ocean Safari · 23–26 jul",ini:"OS",sub:"4 de 9 sin responder",cnt:4},{id:"e2",n:"Hongos · 12 jul",ini:"HX",sub:"3 de 15 sin responder",cnt:3}],
testimonios:[
 {id:"t1",txt:"«Volví a casa distinto. No es un tour, es otra cosa.»",who:"Ana Ruiz · Ocean Safari · ★5 · NPS 10",estado:"pendiente"},
 {id:"t2",txt:"«La guía sabía el nombre de cada hongo. Impresionante.»",who:"Pau García · Hongos · ★5 · NPS 9",estado:"pendiente"},
 {id:"t3",txt:"«El mejor regalo que me he dado.»",who:"Mariana López · Ocean Safari · ★5",estado:"aprobado"},
],
grupoLinks:[{id:"g1",n:"Hongos · 12 jul · terminada",link:"caminante.mx/e/hongos-12jul"}],
solicitudes:[
 {id:"q1",bandeja:"fecha",titulo:"Hongos · fecha nueva",sub:"Grupo de Karla S. · 8 personas · propone 6 sep",estado:"pendiente",hace:"hace 2 días"},
 {id:"q2",bandeja:"fecha",titulo:"Volcanes · fecha aprobada",sub:"Grupo de Ana T. · salida creada 12 sep",estado:"aprobada",link:"caminante.mx/s/volcanes-12sep-privada",msg:"Hola Ana — quedó lista su fecha privada de Volcanes (12 sep). Reservan aquí: caminante.mx/s/volcanes-12sep-privada"},
 {id:"q3",bandeja:"operador",titulo:"Rodrigo Paredes",sub:"pide acceso al panel · guía de Volcanes",estado:"pendiente",hace:"hace 1 día"},
 {id:"q4",bandeja:"embajador",titulo:"Sofía Mendívil",sub:"guía certificada NOM-09 · Valle de Bravo · IG 12k",estado:"pendiente",hace:"hoy"},
],
historico:[["✓","Kéntro · acceso de operador","aprobado · 12 jul"],["✕","Fecha Barrancas nov","rechazada · fuera de temporada"]],
cola:[
 {id:"c1",t:"Hongos · M2 · dato gigante",sub:"Post 4:5 · @caminante.mx",cuando:"mar 11 · 9:00",estado:"programada"},
 {id:"c2",t:"Barrancas · M1 · portada",sub:"Story 9:16",cuando:"mié 12 · 18:00",estado:"programada"},
 {id:"c3",t:"Hongos · E · glosario",sub:"Instagram rechazó el video (duración)",cuando:"",estado:"falló"},
 {id:"c4",t:"Hongos · M1 · anuncio",sub:"Post 4:5",cuando:"lun 5 · 9:00",estado:"publicada"},
 {id:"c5",t:"Kentro · M2 · precio",sub:"Story 9:16",cuando:"vie 7 · 18:00",estado:"publicada"},
],
kit:[
 {id:"k1",mom:"M1 · Lanzamiento",t:"Portada · anuncio",sub:"Post 4:5",estado:"lista",cap:"«El bosque de Xalatlaco guarda más de 200 especies. El 23 de agosto vamos a leerlas juntas…»",tono:"linear-gradient(160deg,#3a4a33,#20392b)"},
 {id:"k2",mom:"M1 · Lanzamiento",t:"Fechas y precio",sub:"Story 9:16",estado:"sin caption",cap:null,tono:"var(--salvia)"},
 {id:"k3",mom:"M1 · Lanzamiento",t:"Retrato de guía",sub:"falta la foto de NANAE",estado:"falta insumo",cap:null,tono:"var(--panel)"},
 {id:"k4",mom:"M2 · Venta",t:"Dato gigante · 200 especies",sub:"Post 4:5",estado:"programada",cap:"«En un solo gramo de suelo…»",tono:"linear-gradient(160deg,#4a5a40,#2c3a26)"},
 {id:"k5",mom:"M2 · Venta",t:"Quedan lugares",sub:"Story 9:16",estado:"lista",cap:"«Quedan 15 lugares para el 23 de agosto…»",tono:"var(--salvia)"},
 {id:"k6",mom:"M3 · Prueba",t:"Testimonio · Ana",sub:"Post 4:5",estado:"publicada",cap:"«Volví a casa distinto…»",tono:"linear-gradient(160deg,#3a4a33,#20392b)"},
],
ledger:[],
cobros:[],
ingresosMes:72600,historicoIng:617250,satisf:{prom:"4,6",resp:12,dist:[[ "5 estrellas",67,8],["4 estrellas",25,3],["3 o menos",8,1]]},
};
(function(){const base=[
 ["cobro","Cobro · Sara Treviño","Recolección de hongos",2550,"Tarjeta","08 ago · 11:42",[["Bruto",2550],["Comisión tarjeta",-94.8],["Neto",2455.2]]],
 ["manual","Pago manual · Roberto Díaz","Ocean Safari",8000,"Transferencia","09 ago · 10:05",[["Saldo del anticipo 50% · BBVA ref. 88123",8000]]],
 ["payout","Payout · NANAE","Recolección de hongos · 26 jul",-37468,"Transferencia","26 jul · 09:15",[["Operación 17 pax",-32300],["IVA 16%",-5168]]],
 ["reembolso","Reembolso · Gina Herrera","Recolección de hongos",-2550,"Tarjeta","30 jul · 13:27",[["Cancelación 9 días antes · política 100%",-2550]]],
];
const nm=["Ana Ruiz","Pau García","Elena Vega","Diego Lara","Julia Peña","Sofía Prieto","Tomás Ibarra","Luz Camarena","Iván Peña","Nora Lara"];
const L=base.map((b,i)=>({id:"L"+i,tipo:b[0],t:b[1],exp:b[2],monto:b[3],medio:b[4],fecha:b[5],des:b[6]}));
for(let i=0;i<44;i++){
 const ens=i%2===0;
 const exp=ens?"Ensenada de Muertos":["Recolección de hongos","Hacienda y hongos · Kentro","Barrancas del Cobre"][i%3];
 const m=ens?16000+(i%3)*250:[2550,11500,16500][i%3];
 L.push({id:"LG"+i,tipo:"cobro",t:"Cobro · "+nm[i%nm.length],exp,monto:m,medio:ens?"Transferencia":"Tarjeta",fecha:(8-(i%8))+" ago · "+(9+(i%10))+":"+String((i*7)%60).padStart(2,"0"),des:ens?[["Transferencia directa",m]]:[["Bruto",m],["Comisión tarjeta",-(m*.036+3)*1.16],["Neto",m-(m*.036+3)*1.16]]});
}
INIT.ledger=L;})();

/* ── UI átomos ── */
const Chip=({c,dot,children})=><span className={"adm-chip adm-c-"+c}>{dot&&<span className="cd"></span>}{children}</span>;
const Chev=()=><span className="adm-chev">⌄</span>;
const Prow=({l,w,fr,warn})=><div className={"adm-prow"+(warn?" warn":"")}><span>{l}</span><div className="tk">{w!=null&&<i style={{width:w+"%"}}></i>}</div><span className="fr">{fr}</span></div>;
const ProwN=({l,fr,b})=><div className="adm-prow"><span>{b?<b>{l}</b>:l}</span><div></div><span className="fr" style={b?{color:"var(--charcoal)",fontWeight:600}:null}>{fr}</span></div>;
const Sub=({children,pad})=><span className={"adm-sub"+(pad?" pad":"")}>{children}</span>;
const Gap=({s})=><div className={s?"adm-gap-s":"adm-gap"}></div>;
const Eyebrow=({children})=><span className="adm-eyebrow"><span className="sl">//</span> {children}</span>;
const Status=({warnTxt})=><div className="adm-status"><span className="adm-mono">{new Date().toTimeString().slice(0,5)}</span><span className="adm-mono" style={warnTxt?{color:"#e8431f",fontWeight:700}:{color:"var(--ink-soft)"}}>{warnTxt||"LTE ▮▮▮"}</span></div>;
const Head=({eyebrow,title,action})=><header className="adm-head"><div><Eyebrow>{eyebrow}</Eyebrow><h1 className="adm-display" dangerouslySetInnerHTML={{__html:title}}></h1></div>{action}</header>;
const NavBar=({onBack,t,s,right})=><div className="adm-nav"><button className="bk" onClick={onBack}>‹</button><div className="tt"><b>{t}</b><small>{s}</small></div>{right}</div>;
const Fld=({l,val,set,hint,err,mono,type,ph})=><div className={"adm-fld"+(err?" err":"")}><label>{l}</label><input className={mono?"mono-in":""} type={type||"text"} value={val} placeholder={ph} onChange={e=>set&&set(e.target.value)} readOnly={!set}/><span className="hint">{hint}</span></div>;
const Seg=({opts,val,set})=><div className="adm-seg">{opts.map(o=><button key={o} className={o===val?"on":""} onClick={()=>set(o)}>{o}</button>)}</div>;
const CopyBox=({v,txt,ui})=><div className="adm-copy"><span className={"cv"+(txt?" txt":"")}>{v}</span><button onClick={()=>ui.copy(v)}>COPIAR</button></div>;
const Life=({e})=>{const m={"falta insumo":"lf-miss","sin caption":"lf-nocap","lista":"lf-ready","programada":"lf-sched","publicada":"lf-pub","falló":"lf-fail","listo":"lf-ready","revisar":"lf-nocap","faltan 2":"lf-miss","activa":"lf-ready","prog.":"lf-sched"};return <span className={"adm-life "+(m[e]||"lf-ready")}><i></i>{e}</span>;};
const Empty=({ic,t,p,btn})=><div className="adm-state"><span className="ic">{ic}</span><h3>{t}</h3><p>{p}</p>{btn}</div>;

const TabIcon={
panorama:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M2.5 12.5h3l2.5-6 4 10 2.5-6h5" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>,
eventos:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="4.5" width="16" height="14" rx="3" strokeWidth="1.75"/><path d="M3 9h16M7.5 2.75v3.5M14.5 2.75v3.5" strokeWidth="1.75" strokeLinecap="round"/></svg>,
gente:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="8" cy="8" r="3.25" strokeWidth="1.75"/><path d="M2.75 18.5c.7-3 2.8-4.5 5.25-4.5s4.55 1.5 5.25 4.5" strokeWidth="1.75" strokeLinecap="round"/><circle cx="15.5" cy="9" r="2.5" strokeWidth="1.75"/><path d="M16.5 14.2c1.6.5 2.6 1.7 3 3.3" strokeWidth="1.75" strokeLinecap="round"/></svg>,
dinero:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8.25" strokeWidth="1.75"/><path d="M13.6 8.4c-.5-.9-1.5-1.4-2.6-1.4-1.6 0-2.9 1-2.9 2.2 0 3 5.8 1.4 5.8 4.4 0 1.2-1.3 2.2-2.9 2.2-1.2 0-2.2-.6-2.7-1.5M11 5.5v11" strokeWidth="1.6" strokeLinecap="round"/></svg>,
mas:<svg width="22" height="22" viewBox="0 0 22 22"><circle cx="5" cy="11" r="1.6" fill="currentColor"/><circle cx="11" cy="11" r="1.6" fill="currentColor"/><circle cx="17" cy="11" r="1.6" fill="currentColor"/></svg>,
};
Object.assign(window,{fmt,fmtS,fmtD,INIT,Chip,Chev,Prow,ProwN,Sub,Gap,Eyebrow,Status,Head,NavBar,Fld,Seg,CopyBox,Life,Empty,TabIcon});
