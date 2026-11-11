// LA CLABE: validarla y saber de qué banco es SIN preguntarlo (11 nov 2026).
//
// La informativa mensual de plataformas (LIVA 18-J III, decisión D4 de legal)
// pide «institución financiera y CLABE» de cada operadora. La CLABE ya dice el
// banco: sus tres primeros dígitos son la clave que Banxico le asigna. Regla de
// la casa: un dato se obtiene, no se pide.
//
// Estructura (18 dígitos): banco (3) · plaza (3) · cuenta (11) · control (1).
// El dígito de control: cada uno de los 17 primeros por 3, 7, 1, 3, 7, 1…,
// cada producto módulo 10, se suman, y control = (10 − suma mód 10) mód 10.

/**
 * Bancos por los tres primeros dígitos de la CLABE. Fuente: listado oficial de
 * instituciones participantes de Banxico (CEP, banxico.org.mx/cep-scl/
 * listaInstituciones.do), consultado el 11 nov 2026. La clave de 5 dígitos de
 * Banxico termina en los 3 de la CLABE (40012 → 012 BBVA). Sin colisiones.
 * Un prefijo que no esté aquí NO se adivina: se pide el nombre del banco.
 */
export const BANCOS_POR_CLAVE: Readonly<Record<string, string>> = {
  "001": "BANXICO",
  "002": "BANAMEX",
  "006": "BANCOMEXT",
  "009": "BANOBRAS",
  "012": "BBVA MEXICO",
  "014": "SANTANDER",
  "019": "BANJERCITO",
  "021": "HSBC",
  "030": "BAJIO",
  "036": "INBURSA",
  "042": "MIFEL",
  "044": "SCOTIABANK",
  "058": "BANREGIO",
  "059": "INVEX",
  "060": "BANSI",
  "062": "AFIRME",
  "072": "BANORTE",
  "106": "BANK OF AMERICA",
  "108": "MUFG",
  "110": "JP MORGAN",
  "112": "BMONEX",
  "113": "VE POR MAS",
  "124": "CITI MEXICO",
  "127": "AZTECA",
  "128": "KAPITAL",
  "129": "BARCLAYS",
  "130": "COMPARTAMOS",
  "132": "MULTIVA BANCO",
  "133": "ACTINVER",
  "135": "NAFIN",
  "136": "INTERCAM BANCO",
  "137": "BANCOPPEL",
  "138": "UALA",
  "140": "CONSUBANCO",
  "141": "VOLKSWAGEN",
  "145": "BBASE",
  "147": "BANKAOOL",
  "148": "PAGATODO",
  "150": "INMOBILIARIO",
  "151": "DONDE",
  "152": "BANCREA",
  "154": "BANCO COVALTO",
  "155": "ICBC",
  "156": "SABADELL",
  "157": "SHINHAN",
  "158": "MIZUHO BANK",
  "159": "BANK OF CHINA",
  "160": "BANCO S3",
  "166": "BaBien",
  "167": "HEY BANCO",
  "168": "HIPOTECARIA FED",
  "170": "REVOLUT BANK",
  "600": "MONEXCB",
  "601": "GBM",
  "602": "MASARI",
  "605": "VALUE",
  "616": "FINAMEX",
  "617": "VALMEX",
  "620": "PROFUTURO",
  "631": "TRF",
  "634": "FINCOMUN",
  "638": "NUBANK",
  "646": "STP",
  "652": "CREDICAPITAL",
  "653": "KUSPIT",
  "656": "UNAGRA",
  "659": "ASP INTEGRA OPC",
  "660": "Altor",
  "661": "KLAR",
  "670": "LIBERTAD",
  "677": "CAJA POP MEXICA",
  "680": "CRISTOBAL COLON",
  "683": "CAJA TELEFONIST",
  "684": "TRANSFER",
  "685": "FONDO (FIRA)",
  "688": "CREDICLUB",
  "699": "FONDEADORA",
  "703": "TESORED",
  "706": "ARCUS FI",
  "710": "NVIO",
  "714": "PPBALANCEMX",
  "715": "CASHI CUENTA",
  "720": "MexPago",
  "721": "albo",
  "722": "Mercado Pago W",
  "723": "Cuenca",
  "725": "COOPDESARROLLO",
  "727": "TRANSFER DIRECT",
  "728": "SPIN BY OXXO",
  "729": "Dep y Pag Dig",
  "730": "Clip",
  "732": "Peibo",
  "734": "FINCO PAY",
  "738": "FINTOC",
  "901": "CLS",
  "902": "INDEVAL",
  "903": "CoDi Valida",
};

const PESOS = [3, 7, 1] as const;

/** Sólo dígitos, para aceptar lo que la persona pegue con espacios o guiones. */
export const limpiarClabe = (s: string): string => s.replace(/\D/g, "");

export function digitoControl(primeros17: string): number {
  let suma = 0;
  for (let i = 0; i < 17; i++) suma += (Number(primeros17[i]) * PESOS[i % 3]) % 10;
  return (10 - (suma % 10)) % 10;
}

export type ClabeValida = { ok: true; clabe: string; clave: string; banco: string | null } | { ok: false; porque: string };

export function validarClabe(entrada: string): ClabeValida {
  const clabe = limpiarClabe(entrada);
  if (clabe.length !== 18) return { ok: false, porque: "La CLABE tiene 18 dígitos." };
  if (digitoControl(clabe.slice(0, 17)) !== Number(clabe[17])) {
    return { ok: false, porque: "Esa CLABE no es válida: su último dígito no cuadra. Revisa que esté bien copiada." };
  }
  const clave = clabe.slice(0, 3);
  return { ok: true, clabe, clave, banco: BANCOS_POR_CLAVE[clave] ?? null };
}

/** Para enseñarla sin exponerla: sólo los últimos 4. */
export const clabeEnmascarada = (clabe: string): string => `•••• ${clabe.slice(-4)}`;
