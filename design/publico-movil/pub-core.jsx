const {useState,useEffect} = React;
const pfmt = n => "$" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,".");
/* foto placeholder brand-toned; data-banco conecta con el bucket real */
const TONOS={paisaje:"%234a5a44",flora:"%23637154",gente:"%23847a63",comunidad:"%237a6a52",comida:"%23935f3e",detalle:"%23b0a68f",cielo:"%23b9c2c0",mar:"%232e4a52",barranca:"%23684f3c",claro:"%23dad8cc"};
const Ph=({cat,slug,alt,ratio})=><img src={`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 ${Math.round(40*(ratio||1))}'%3E%3Crect fill='${TONOS[cat]||TONOS.paisaje}' width='40' height='${Math.round(40*(ratio||1))}'/%3E%3C/svg%3E`} data-banco={cat+" · "+slug} alt={alt}/>;

const PUB={
exps:[
{id:"hongos",slug:"hongos",estado:"publicada",nombre:"Recolección de hongos",titulo:["El bosque ","de Xalatlaco."],lugar:"Estado de México",destino:"Estado de México",cat:"Hiking",precio:2550,precioTxt:"$2.550 · todo incluido",cal:{p:"3,0",n:1},op:"caminante",fotos:80,tono:"flora",tonoHero:"claro",
tag:"Un bosque de oyamel guarda más de 200 especies. Aprenderás a leer tres: cuál se come, cuál cura, cuál mata.",
expTxt:["Salimos de la ciudad a las 7:00. A las 9 ya estás dentro del bosque, canasta en mano, con una micóloga que lleva quince años leyendo este suelo.","Comes lo que recolectaste, preparado ahí mismo. Regresas antes de que anochezca."],
iti:[["7:00 · CDMX","Salida","Punto de encuentro Ángel de la Independencia. Van con café.",""],["9:00 · Bosque","Entrada al oyamel","Caminata suave de 6 km. Se recolecta con guía, nunca solo.",""],["13:30 · Claro","Comida de lo recolectado","Quesadillas de hongo, caldo, tortilla hecha a mano.","hi"],["17:00 · CDMX","Regreso","Llegada al mismo punto, antes de anochecer.",""]],
niveles:null,
statement:"Donde pones tu atención, ahí va tu energía. El método pasa por el cuerpo antes que por la cabeza: primero caminas, después entiendes.",
incluye:[["Transporte redondo desde CDMX","Van con seguro de pasajero"],["Guía micóloga certificada","Nanae Watabe · NANAE"],["Comida de campo","De lo que el bosque dio ese día"],["Acceso y permisos del ejido",""]],
guia:{n:"Nanae Watabe",r:"Micóloga · 15 años en este bosque",q:"«Un hongo no se arranca: se corta, para que el micelio siga vivo.»"},
comunidad:"La montaña es del ejido de Xalatlaco. Cada lugar pagado deja derrama directa: guías locales, cocina de las señoras del pueblo, permisos al ejido.",
ficha:{especies:[["Boletus","Boletus edulis","Comestible codiciado. Poro esponjoso en lugar de laminillas — así lo distingues.","CONABIO · Hongos de México, 2023"],["Chapopote","Gyromitra (morilla falsa)","Tóxico crudo. Se confunde con la morilla verdadera — la diferencia salva vidas.","Guzmán, G. · Los hongos de México, UNAM"],["Yema","Amanita caesarea","El único Amanita que se come sin duda. Naranja intenso, volva blanca.","CONABIO · Hongos de México, 2023"],["Hongos coral","Ramaria spp.","Parecen coral de mar en el suelo del bosque. Solo algunas especies son comestibles.","Herbario FCME · UNAM"]],
glosario:["micelio","volva","laminillas","esporada"],temporada:"Jun–oct · la lluvia manda: el pico es agosto–septiembre."},
packing:[["Botas o tenis de agarre","El suelo está húmedo todo el año"],["Impermeable ligero",""],["1.5 L de agua",""]],
faq:[["¿Necesito condición física?","No. Son 6 km planos a paso de bosque, con pausas. Van niños desde 8 años."],["¿Y si llueve?","Se camina igual — la lluvia es cuando salen los hongos. Solo se cancela por tormenta eléctrica, con reembolso completo."],["¿Puedo comer lo que recolecte?","Solo lo que la guía valida. Esa es la regla que mantiene quince años sin incidentes."]]},
{id:"volcanes",slug:"volcanes",estado:"publicada",nombre:"El bosque de los volcanes",titulo:["Hacienda ","y hongos."],lugar:"Estado de México",destino:"Estado de México",cat:"Hiking",precio:11500,precioTxt:"2 niveles de precio",op:"kentro",fotos:27,tono:"paisaje",tonoHero:"paisaje",
tag:"Dos días entre los volcanes: caminata, recolección y una hacienda del siglo XVII para dormir.",
expTxt:["Un fin de semana completo al pie del Popocatépetl. Se camina, se recolecta y se duerme en hacienda."],
iti:[["Sáb 8:00","Salida y caminata","Ascenso suave por el bosque de pino.",""],["Sáb 19:00","Hacienda","Cena y noche en la hacienda.","hi"],["Dom 9:00","Recolección","Mañana de hongos con guía local.",""]],
niveles:[["Habitación compartida",11500],["Habitación privada",14800]],
statement:"La montaña de noche enseña lo que el día esconde.",
incluye:[["Hospedaje en hacienda","1 noche"],["Todas las comidas",""],["Guías locales de Amecameca",""]],
guia:{n:"Equipo Kéntro",r:"Operadora · Amecameca",q:"«La montaña se camina despacio o no se camina.»"},
comunidad:"Opera Kéntro con guías de Amecameca; la hacienda es de una familia local.",
ficha:{especies:[],glosario:["oyamel","monzón","ladera"],temporada:"Ago–oct."},
packing:[["Ropa de frío para la noche",""],["Botas de agarre",""]],
faq:[["¿Cuánta condición pide?","Media: 8 km el sábado con pendiente suave."]]},
{id:"barranca",slug:"barrancas",estado:"publicada",nueva:true,nombre:"El fondo de la barranca",titulo:["Trekking Barrancas ","del Cobre."],lugar:"Chihuahua",destino:"Chihuahua",cat:"Trekking",precio:16500,precioTxt:"$16.500",op:"kentro",fotos:21,tono:"barranca",tonoHero:"barranca",
tag:"Cuatro días dentro de un sistema de cañones más profundo que el Gran Cañón. Se baja caminando.",
expTxt:["Cuatro días, tres noches, un cañón que se cruza a pie con arrieros rarámuri."],
iti:[["Día 1","Chihuahua → borde","Tren El Chepe hasta el borde de la barranca.",""],["Día 2–3","El descenso","Bajada al fondo, noche en ranchería.","hi"],["Día 4","Regreso","Subida y tren de vuelta.",""]],
niveles:null,
statement:"El cuerpo entiende la escala cuando las piernas la miden.",
incluye:[["Tren El Chepe redondo",""],["Arrieros y mulas de carga",""],["Todas las comidas",""],["Hospedaje en ranchería",""]],
guia:{n:"Octavio",r:"Guía · 20 años en la barranca",q:"«Aquí el camino lo marcan los rarámuri; nosotros lo pedimos prestado.»"},
comunidad:"Las rancherías del fondo hospedan y cocinan; los arrieros son rarámuri de la zona.",
ficha:{especies:[],glosario:["ranchería","arriero","cañón"],temporada:"Oct–mar · fuera del calor del fondo."},
packing:[["Mochila de 40 L",""],["Botas de trekking usadas","No estrenes botas aquí"],["Capas de frío y calor","El fondo es 10° más caliente que el borde"]],
faq:[["¿Es peligroso?","Es exigente, no técnico. 12 km diarios con guía y mulas de apoyo."]]},
{id:"ensenada",slug:"ensenada",estado:"publicada",nombre:"Ensenada de Muertos",titulo:["El mar ","de Cortés."],lugar:"Baja California Sur",destino:"Baja California Sur",cat:"Ocean Safari",precio:null,precioTxt:"próximas fechas por anunciar",cal:{p:"4,8",n:12},op:"caminante",fotos:18,tono:"mar",tonoHero:"mar",
tag:"El acuario del mundo, dijo Cousteau. Lancha, snorkel y kilómetros de mar abierto.",
expTxt:["Tres días de mar: lobos marinos, snorkel en arrecife y la bahía más tranquila del golfo."],
iti:[["Día 1","Llegada a La Paz","Traslado a Ensenada de Muertos.",""],["Día 2","Sea safari","Lancha todo el día: lobos, arrecife, playa sola.","hi"],["Día 3","Mañana libre y regreso","",""]],
niveles:null,
statement:"Mirar el mar en silencio también es fisiología: baja el ritmo cardiaco en minutos.",
incluye:[["Lancha y capitán",""],["Equipo de snorkel",""],["Hospedaje frente al mar","2 noches"]],
guia:{n:"Equipo Caminante",r:"Numan · Caminante",q:"«El mar no se visita: se escucha.»"},
comunidad:"Capitanes y cocina de la comunidad de la bahía.",
ficha:{especies:[],glosario:["arrecife","lobera","plancton","marea","bajamar"],temporada:"Sep–nov · agua más clara del año."},
packing:[["Bloqueador biodegradable","El normal daña el arrecife"],["Traje de baño y capa para el viento",""]],
faq:[]},
{id:"monarca",slug:"monarca",estado:"borrador",nombre:"Hike Mariposas Monarca",titulo:["El bosque ","que migra."],lugar:"Estado de México",destino:"Estado de México",cat:"Hiking",precio:null,precioTxt:"en preparación",op:"caminante",fotos:0,tono:"flora",tonoHero:"flora",tag:"Cien millones de monarcas pasan el invierno en estos oyameles.",expTxt:[],iti:[],niveles:null,statement:"",incluye:[],guia:null,comunidad:"",ficha:null,packing:[],faq:[]},
],
salidas:[
{id:"sa1",exp:"hongos",lbl:"Domingo 23 ago",fecha:"2026-08-23",d:"23",m:"ago",mes:"Agosto",cupo:18,quedan:11,dias:13},
{id:"sa2",exp:"volcanes",lbl:"Ago 29–30",fecha:"2026-08-29",d:"29",m:"ago",mes:"Agosto",cupo:16,quedan:7,dias:19},
{id:"sa3",exp:"barranca",lbl:"Oct 8–11",fecha:"2026-10-08",d:"8",m:"oct",mes:"Octubre",cupo:12,quedan:8,dias:59},
{id:"sa4",exp:"barranca",lbl:"Oct 15–18",fecha:"2026-10-15",d:"15",m:"oct",mes:"Octubre",cupo:12,quedan:12,dias:66},
],
ops:{caminante:{n:"Numan · Caminante",bio:"«Caminamos para recordar cómo funciona tu cuerpo. No es creencia, es fisiología: movimiento, naturaleza, introspección y creatividad — en ese orden, porque el orden es el método.»",d:"La operadora propia. Naturaleza con ciencia real, dentro del método numan.",exps:["hongos","ensenada","monarca"],marca:null},kentro:{n:"Kéntro",bio:null,d:"Operadora aliada en Estado de México y Chihuahua. Guías locales, trato directo con las comunidades.",exps:["volcanes","barranca"],marca:{fondo:"#212121",acento:"#9a3b2d"}}},
destinos:[["Baja California Sur","mar",["ensenada"]],["Estado de México","flora",["hongos","volcanes","monarca"]],["Chihuahua","barranca",["barranca"]]],
lugares:[
{id:"bcs",n:"Baja California Sur",acc:["El Mar ","de Cortés."],coord:"23.6°N · Golfo de California",tono:"mar",slug:"ensenada",
sub:"Donde el desierto cae al agua y empieza otro mundo. Una franja de costa entre la sierra seca y el golfo más vivo del planeta.",
terr:["Un mar joven y cerrado entre la península y el continente. Cousteau lo llamó el acuario del mundo: aquí convergen aguas frías y cálidas, y la vida se concentra.","La costa se recorre en lancha desde Agua Amarga: loberas, arrecifes y bahías donde el desierto llega al agua."],
pild:[["Especies de peces","900+"],["Mamíferos marinos del mundo","39%"]],
caras:[["Naturaleza","Orcas, ballenas, rayas mobula, tiburón martillo y lobos marinos. El golfo reúne en pocos kilómetros lo que otros mares reparten en miles."],["Conservación","Bloqueador biodegradable, distancia de las loberas, cero basura al agua. El arrecife no distingue intenciones."],["Comunidades","Capitanes y cocina de la comunidad de Agua Amarga — la travesía deja derrama directa en la bahía."],["Problemas","La presión pesquera y el turismo sin regla amenazan lo que hace único al golfo. También se cuenta."]],
galeria:[["detalle","Tiburón martillo"],["mar","Orcas"],["mar","Ballenas"],["mar","Delfines"],["mar","Rayas mobula"],["paisaje","El desierto"],["comunidad","El campamento"],["cielo","La noche"]],
vivir:["Vivir el golfo","Travesías guiadas por biólogos y por la comunidad de Agua Amarga."],
temporadas:[["Ballenas","dic–abr"],["Tiburón ballena","oct–abr"],["Agregaciones de mobulas","abr–jul"]],
cierre:["El golfo espera","Nos vemos ","en el mar."],
exps:["ensenada"]},
{id:"edomex",n:"Estado de México",acc:["Bosque ","de oyamel."],coord:"19.2°N · Eje Neovolcánico",tono:"flora",slug:"hongos",
sub:"Bosques de oyamel y pino a casi tres mil metros, donde nace el agua y la monarca pasa el invierno.",
terr:["Bosques de agua que abastecen al centro del país. Aquí el aire se enfría, la niebla se posa.","Se camina entre oyameles con la gente que lleva generaciones leyéndolos: hongueros, guías del ejido, cocina del pueblo."],
pild:[["Altitud del bosque","~3.000 m"],["Registros de hongos","3er estado del país"]],
caras:[["Naturaleza","Decenas de especies de hongos, flores y plantas de altura, la mariposa monarca que llega cada invierno, venados y aves."],["Conservación","Lo que se recolecta se corta, no se arranca — el micelio sigue vivo. El bosque de agua se cuida caminando con regla."],["Comunidades","La montaña es del ejido de Xalatlaco: guías locales, cocina de las señoras del pueblo, permisos al ejido."],["Problemas","La tala y la presión sobre el suelo del bosque. Por eso se entra con guía y con permiso."]],
galeria:[["flora","Mariposa monarca"],["detalle","Hongos"],["flora","Flores de altura"],["paisaje","Bosque de niebla"]],
vivir:["Vivir el bosque","Jornadas guiadas por la comunidad y los hongueros de Xalatlaco."],
cierre:["El bosque espera","Nos vemos ","entre los oyameles."],
exps:["hongos","volcanes","monarca"]},
{id:"chih",n:"Chihuahua",acc:["Las Barrancas ","del Cobre."],coord:"27.3°N · Sierra Tarahumara",tono:"barranca",slug:"barrancas",
sub:"Un sistema de cañones más hondo que el Gran Cañón, tallado en la Sierra Madre. Del pino en el filo al subtrópico en el fondo.",
terr:["No son un cañón, sino seis. Del borde al fondo caen más de mil ochocientos metros.","Se baja a pie con arrieros rarámuri, durmiendo en rancherías del fondo."],
pild:[["Desnivel del borde al fondo","1.800 m"],["Cañones del sistema","6"]],
caras:[["Naturaleza","Del bosque de pino y encino en el filo al matorral subtropical en el fondo: mil ochocientos metros de caída que concentran climas, agaves, aves y especies que no conviven en ningún otro sitio."],["Conservación","El camino lo marcan los rarámuri; se pide prestado y se deja como estaba."],["Comunidades","Las rancherías del fondo hospedan y cocinan; los arrieros son rarámuri de la zona."],["Problemas","La sequía y la migración vacían la sierra. Viajar con su gente es parte de la respuesta."]],
galeria:[["barranca","Barrancas al atardecer"],["paisaje","El filo"],["cielo","La tormenta sobre el cañón"],["comunidad","El campamento"],["gente","La vereda"],["detalle","La piedra"]],
vivir:["Vivir la barranca","Travesías guiadas por la sierra y su gente."],
cierre:["La barranca espera","Nos vemos ","en el fondo."],
exps:["barranca"]},
],
testimonios:[["«Estuvo padrísimo todos súper buena onda»","Recolección de hongos · ★5"],["«Las aventuras compartidas con la nueva gente que conocí, convivencia…»","Ensenada de Muertos · ★5"],["«La paz de estar en la lancha buscando y viendo kilómetros y kilómetros»","Ensenada de Muertos · ★5"],["«Fue un viaje que jamás había vivido algo parecido, entonces fue muy…»","Barrancas del Cobre · ★5"],["«Nunca había ido a un sea safari, me encantó!»","Ensenada de Muertos · ★5"]],
};

/* átomos */
const Eyeb=({neg,children})=><span className={"pub-eyebrow"+(neg?" neg":"")}><span className="sl">//</span> {children}</span>;
const Sec=({id,sx,children,style})=><div className="pub-sec" id={id} data-sx={sx} style={style}>{children}</div>;
const Brand=({onHome,oncream})=><button className="brand" onClick={onHome}><img className="lockup" src={oncream?"assets/logos/caminante-logo-color.png":"assets/logos/caminante-logo-white.png"} alt="NMN Caminante"/></button>;
const HeadFloat=({nav,back,backLabel,oncream,right})=>{
const [sc,setSc]=useState(false);
const ref=React.useRef(null);
useEffect(()=>{
const el=ref.current;if(!el)return;
const cont=el.closest(".pub-scroll");if(!cont)return;
const onScroll=()=>{
const scr=el.closest(".pub-screen");
const hero=scr&&scr.querySelector(".pub-hero");
const th=(hero&&hero.offsetTop<120)?Math.max(hero.offsetHeight-72,60):8;
setSc(cont.scrollTop>th);
};
onScroll();
cont.addEventListener("scroll",onScroll,{passive:true});
return ()=>cont.removeEventListener("scroll",onScroll);
},[]);
const on=oncream||sc;
if(backLabel)return <header ref={ref} className={"pub-head flexh"+(on?" oncream":"")+(sc?" scrolled":"")}>
<button className="hbtn lblb" aria-label="Regresar" onClick={nav.pop}><svg width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M8 1L1.5 8 8 15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg><span>{backLabel}</span></button>
{right||<button className="hbtn" aria-label="Menú" onClick={()=>nav.ui.openSheet("menu")}><svg width="18" height="14" viewBox="0 0 18 14" fill="none"><path d="M1 1h16M1 7h16M1 13h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg></button>}
</header>;
return <header ref={ref} className={"pub-head"+(on?" oncream":"")+(back?" hasback":"")+(sc?" scrolled":"")}>
{back&&<button className="hbtn l" aria-label="Regresar" onClick={nav.pop}><svg width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M8 1L1.5 8 8 15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
<Brand onHome={()=>nav.setTab("inicio")} oncream={on}/>
{right||<button className="hbtn r" aria-label="Menú" onClick={()=>nav.ui.openSheet("menu")}><svg width="18" height="14" viewBox="0 0 18 14" fill="none"><path d="M1 1h16M1 7h16M1 13h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg></button>}
</header>;};
const NavCream=({nav,t,s})=><div className="pub-nav"><button className="bk" onClick={nav.pop}>‹</button><div className="tt"><b>{t}</b><small>{s}</small></div></div>;
const Testi=({t})=><div className="pub-testi"><p>{t[0]}</p><small>{t[1]} · testimonio publicado con consentimiento</small></div>;
const TabIcons={
inicio:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3.5 9.5L11 3l7.5 6.5V18a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 18V9.5z" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>,
experiencias:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 17.5L9 5l4 8 2.5-4.5L19 17.5H4z" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>,
calendario:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="4.5" width="16" height="14" rx="3" strokeWidth="1.75"/><path d="M3 9h16M7.5 2.75v3.5M14.5 2.75v3.5" strokeWidth="1.75" strokeLinecap="round"/></svg>,
aprende:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 5.5C9.5 4 7.2 3.5 4.5 3.5c-.6 0-1 .45-1 1v11c0 .55.4 1 1 1 2.7 0 5 .5 6.5 2 1.5-1.5 3.8-2 6.5-2 .6 0 1-.45 1-1v-11c0-.55-.4-1-1-1-2.7 0-5 .5-6.5 2z" strokeWidth="1.75" strokeLinejoin="round"/><path d="M11 5.5v13" strokeWidth="1.75" strokeLinecap="round"/></svg>,
espacio:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="3.5" strokeWidth="1.75"/><path d="M4.5 19c.9-3.4 3.4-5 6.5-5s5.6 1.6 6.5 5" strokeWidth="1.75" strokeLinecap="round"/></svg>,
};
const scrollSuave=(cont,top)=>{const antes=cont.scrollTop;try{cont.scrollTo({top,behavior:"smooth"});}catch(e){cont.scrollTop=top;}setTimeout(()=>{if(Math.abs(cont.scrollTop-antes)<2&&Math.abs(top-antes)>2)cont.scrollTop=top;},160);};
Object.assign(window,{pfmt,Ph,PUB,Eyeb,Sec,Brand,HeadFloat,NavCream,Testi,TabIcons,scrollSuave});
