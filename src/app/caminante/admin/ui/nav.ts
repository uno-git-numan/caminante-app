// La lista del nav del panel, en UN solo lugar.
//
// Vivía dentro de AdminShell, y el tablero financiero (que es inmersivo y trae
// su propio header) la repetía a mano. Las dos derivaron: la copia del tablero
// se quedó sin «Comunicación» ni «Solicitudes», y «Rentabilidad» existía solo
// en la copia — por eso la página no se podía encontrar desde el resto del
// panel. Un nav duplicado siempre termina así.

export type AdminSection =
  | "panorama"
  | "eventos"
  | "comunicacion"
  // «personas» conserva el nombre viejo de la clave a propósito: la sección se
  // llama Comunidad, pero renombrarla obligaba a tocar cada `active=` del panel
  // para no ganar nada. La etiqueta es lo que se lee; la clave sólo se compara.
  | "personas"
  | "recursos"
  | "operador"
  | "perfil"
  | "encuesta"
  // ── El sombrero de LA PLATAFORMA (numan) ───────────────────────────────
  // Claves aparte de las de la operadora aunque tres etiquetas se repitan. Son
  // pantallas distintas con la misma palabra: «Experiencias» con el sombrero de
  // la operadora son las de Caminante, con el de numan son las de TODAS.
  // Compartir clave habría hecho que el nav de un sombrero se marcara solo
  // estando en el otro.
  | "pl-panorama"
  | "pl-experiencias"
  | "pl-comunidad"
  | "pl-recursos";

export type AdminNavItem = { key: AdminSection; label: string; href?: string; soon?: boolean };

// «Accesos» se fundió en Solicitudes y «Facturación» vive dentro de Recursos.
// «Operador» se renderiza aparte, a la derecha, con ícono de perfil.
export const ADMIN_NAV: AdminNavItem[] = [
  { key: "panorama", label: "Panorama", href: "/caminante/admin" },
  // «Eventos» significaba EXPERIENCIAS, y una salida es mucho más un evento que
  // una experiencia: esa colisión de nombres era buena parte de por qué las dos
  // pantallas se sentían duplicadas. La clave interna se conserva para no tocar
  // las 20 llamadas a AdminShell; lo que cambia es lo que lee quien la usa.
  { key: "eventos", label: "Experiencias", href: "/caminante/admin/eventos" },
  { key: "comunicacion", label: "Comunicación", href: "/caminante/admin/comunicacion" },
  // «Solicitudes» y «Reservas» dejaron de ser pestañas: todo lo que es gente
  // vive en Comunidad y todo lo que es dinero vive en Recursos. Las páginas no
  // se borraron —siguen enteras, con sus acciones— sólo se mudaron:
  //   · /admin/solicitudes → tercera vista de /admin/comunidad
  //   · /admin/reservas    → /admin/recursos/pagos
  // Y «Personas» sí se borró: su lista era la biblioteca de Comunidad con menos
  // información. Dos pantallas de la misma gente terminan diciendo cosas
  // distintas de la misma persona.
  // Las claves internas se conservan para no tocar las llamadas a AdminShell.
  // «Personas» era una tabla de 60 renglones con una columna «Etapa» que decía
  // «Lead» en los 60 — incluida la persona que gastó $32,000. No diferenciaba
  // nada. Ahora es COMUNIDAD: la biblioteca de quién es la gente, ordenada por
  // su historia y no por fecha de alta. La clave interna se conserva para no
  // tocar las llamadas a AdminShell.
  { key: "personas", label: "Comunidad", href: "/caminante/admin/comunidad" },
  // Antes eran DOS: «Dinero» (lo que entró) y «Rentabilidad» (cuánto es tuyo).
  // Dos páginas que hablan de lo mismo se leen como redundancia y obligan a
  // saltar entre ellas para cerrar una cuenta. Ahora es una sola.
  { key: "recursos", label: "Recursos", href: "/caminante/admin/recursos" },
  // «Encuesta» pasó a llamarse «Salidas» y cambió de eje: ya no es un tipo de
  // trabajo, es el OBJETO. Una salida tiene un antes (perseguir firmas) y un
  // después (leer la encuesta), y las dos cosas viven ahí. La clave interna se
  // conserva para no tocar las 20 llamadas a AdminShell.
  { key: "encuesta", label: "Salidas", href: "/caminante/admin/salidas" },
];

// ── EL NAV DE LA PLATAFORMA ────────────────────────────────────────────────
//
// Caminante es la PLATAFORMA: cobra comisión, administra operadoras y ve el
// catálogo de todas. NUMAN es una operadora más —la propia— y usa el nav de
// arriba, con Comunicación y Salidas, porque son de quien opera.
//
// Los dos son paralelos a propósito: Panorama, Experiencias, Comunidad y
// Recursos están en los dos y en el mismo orden. Lo que cambia no es dónde
// vive cada cosa, es la unidad. Con el sombrero de Caminante (la operadora), Comunidad son los
// clientes; con el de Caminante, son las operadoras. Que la misma persona no
// tenga que reaprender el panel al cambiarse el sombrero es el punto entero.
export const NAV_PLATAFORMA: AdminNavItem[] = [
  { key: "pl-panorama", label: "Panorama", href: "/caminante/admin/plataforma" },
  { key: "pl-experiencias", label: "Experiencias", href: "/caminante/admin/plataforma/experiencias" },
  { key: "pl-comunidad", label: "Comunidad", href: "/caminante/admin/plataforma/comunidad" },
  { key: "pl-recursos", label: "Recursos", href: "/caminante/admin/plataforma/recursos" },
];

/** Rutas del sombrero de numan (la plataforma). Todo lo demás del panel es el sombrero de Caminante (la operadora). */
export const RAIZ_PLATAFORMA = "/caminante/admin/plataforma";

/**
 * ¿Qué sombrero corresponde a esta ruta?
 *
 * Se DEDUCE de la ruta en vez de recibirse por prop. Con prop, una pantalla
 * nueva que olvidara pasarla se dibujaría con el nav del otro sombrero y se
 * vería perfectamente normal — el mismo tipo de error silencioso que tuvo el
 * chrome del panel enseñando 14 rutas de 27.
 */
export function sombreroDeRuta(
  pathname: string | null | undefined,
): "plataforma" | "operadora" {
  return pathname?.startsWith(RAIZ_PLATAFORMA) ? "plataforma" : "operadora";
}

// «Operador» va aparte porque se dibuja a la DERECHA del nav y con ícono, no en
// la fila de píldoras. Pero vive aquí, no dentro de un componente: estaba
// escrito a mano en AdminShell y el tablero de Recursos —que arma su nav desde
// ADMIN_NAV— se quedaba sin él. O sea, Recursos era la única sección desde la
// que no se podía llegar al perfil del operador ni a su convenio, que es justo
// el salto que se hace al liquidarle a alguien. Es la misma deriva que este
// archivo existe para evitar; si el nav vuelve a tener una excepción, va aquí.
export const ADMIN_NAV_OPERADOR: AdminNavItem = {
  key: "operador",
  label: "Operador",
  href: "/caminante/admin/operadores",
};

export const PERSON_ICON =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';


// ── El nav que ve un OPERADOR externo ────────────────────────────────────
//
// Se deriva de ADMIN_NAV en vez de escribirse aparte, por la misma razón que
// este archivo existe: dos listas siempre divergen. Aquí solo se dice qué
// SOBRA, y una sección nueva aparece automáticamente en los dos navs — lo que
// obliga a decidir a conciencia si el operador debe verla.
//
// ⚠️ Esconder la píldora NO es el candado. El candado es la lista blanca de
// `lib/auth/panel-operador.ts`, que se aplica en el layout aunque alguien
// escriba la URL a mano. Esto es cortesía visual: enseñar un botón que rebota
// se siente roto.
const FUERA_DEL_OPERADOR: AdminSection[] = [
  "recursos", // rentabilidad, proveedores, egresos, payouts (y ahí vive Pagos)
];
// Ojo: «Solicitudes» ya no se poda aquí porque dejó de ser una sección. Es una
// vista dentro de Comunidad, y Comunidad SÍ es del operador. El corte de esa
// vista está en `comunidad/page.tsx`: con rol operador la bandeja no se
// consulta. Si algún día vuelve a ser pantalla propia, vuelve a esta lista.

// «Mi alta» NO está en ADMIN_NAV y es a propósito: la casa no tiene alta que
// seguir, y ponerla ahí con un filtro sería una sección que existe para todos y
// se esconde para uno. Va como excepción explícita, igual que «Operador», y por
// eso se lee de un vistazo que sólo el operador la ve.
export const MI_ALTA_NAV: AdminNavItem = {
  key: "panorama", // comparte activo con Panorama: es su puerta mientras el alta no termina
  label: "Mi alta",
  href: "/caminante/admin/mi-alta",
};

export const ADMIN_NAV_DE_OPERADOR: AdminNavItem[] = [
  MI_ALTA_NAV,
  ...ADMIN_NAV.filter((i) => !FUERA_DEL_OPERADOR.includes(i.key)),
];

/**
 * @param conAlta — la casa trae puesto el sombrero de una operadora que SÍ
 *   tiene alta (Kéntro, hoy). Ahí «Mi alta» deja de ser «la casa no tiene alta
 *   que seguir» y pasa a ser justo lo que se está mirando: el alta de ella,
 *   recorrida como la recorre ella. Sin sombrero, o con el de la casa, no sale.
 */
/**
 * «Mi perfil»: en lo que se convierte «Mi alta» cuando el alta cierra (lámina
 * «Panel Operadora»: «Tu alta cerró: las seis secciones están abiertas, y lo
 * tuyo se mudó a Mi perfil, en la orilla derecha»). Misma ruta: la pantalla
 * decide qué enseñar según el estado.
 */
export const MI_PERFIL_NAV: AdminNavItem = {
  key: "perfil",
  label: "Mi perfil",
  href: "/caminante/admin/mi-alta",
};

/** Puro: quita «Mi alta» del frente y pone «Mi perfil» al final (a la derecha). */
export function navConAltaCerrada(items: AdminNavItem[]): AdminNavItem[] {
  return [...items.filter((i) => i.href !== MI_ALTA_NAV.href), MI_PERFIL_NAV];
}

export function navPara(rol: "admin" | "operador", conAlta = false): AdminNavItem[] {
  if (rol === "operador") return ADMIN_NAV_DE_OPERADOR;
  return conAlta ? [MI_ALTA_NAV, ...ADMIN_NAV] : ADMIN_NAV;
}
