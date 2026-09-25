// EL ALTA DE LA CUENTA DE COBRO, DENTRO DE LA PLATAFORMA — lo puro.
//
// Luis, 24 sep 2026: «No menciones Stripe en el front end, el usuario no debe
// saber que existe una pasarela de pagos externa a Caminante. Que pongan todo y
// nosotros mandamos a Stripe.» Hasta hoy la operadora salía a la página de
// Stripe (Account Links de una cuenta Express) y volvía. Con esto captura sus
// datos AQUÍ y se envían a Stripe con tokens de Stripe.js: los datos viajan del
// navegador de la operadora a Stripe y NO pasan por nuestro servidor ni se
// guardan en nuestra base (identificación, fecha de nacimiento, CLABE…). Lo
// único que queda de este lado es lo que ya existía: el id de la cuenta y su
// estado.
//
// ⚠️ NACE APAGADA. Se prende con `COBRO_EN_PLATAFORMA=1` en Vercel, y sólo
// cuando el abogado haya cerrado la Cuarta §7 del convenio: Stripe exige que
// cada operadora acepte su contrato de cuentas conectadas, y como en pantalla
// no aparece, la aceptación vive en el convenio firmado (CONVENIO-v1.md,
// pendiente 12). Prenderla antes sería cobrar bajo un contrato que nadie
// aceptó. Apagada, TODO sigue como hoy: cuenta Express y link a Stripe.
//
// ⚠️ QUÉ CAMBIA EN STRIPE CUANDO ESTÁ PRENDIDA. La cuenta se crea con
// propiedades de control en vez de `type: "express"`: sin dashboard, la
// plataforma recaba los requisitos, paga las comisiones y responde por los
// saldos negativos. El tipo de dashboard es INMUTABLE: una cuenta Express no
// se convierte. Por eso la pantalla decide por CUENTA (`recaudaLaPlataforma`),
// no por bandera: una operadora que ya hubiera salido a Stripe seguiría con su
// link aunque la bandera esté prendida.
//
// Lo que pide Stripe para México (consultado el 24 sep 2026 en
// docs.stripe.com/connect/required-verification-information, plataforma MX,
// cuenta MX, sin dashboard, card_payments + transfers):
//   física → nombre, apellidos, nacimiento, domicilio, RFC, teléfono, correo
//   moral  → razón social, RFC, domicilio, teléfono; representante (lo mismo
//            que la física); dueños de 25% o más (nombre, nacimiento, correo,
//            porcentaje; domicilio y RFC por arriba de $250,000 cobrados)
//   ambas  → giro (MCC), sitio, aceptación del contrato, cuenta bancaria
// La identificación sólo se pide si el RFC no cuadra con el nombre.

/** Prendida sólo con `COBRO_EN_PLATAFORMA=1`. Cualquier otro valor es apagada. */
export function altaCobroEnPlataforma(env: Record<string, string | undefined> = process.env): boolean {
  return env.COBRO_EN_PLATAFORMA === "1";
}

/** Giro con el que se dan de alta todas: agencias de viajes y operadores turísticos. */
export const MCC_TURISMO = "4722";

/**
 * ¿Esta cuenta la llena la plataforma? Es lo que decide qué pantalla ve la
 * operadora: la de captura, o el botón que la lleva a Stripe.
 */
export function recaudaLaPlataforma(account: {
  controller?: { requirement_collection?: string | null } | null;
} | null | undefined): boolean {
  return account?.controller?.requirement_collection === "application";
}

/**
 * CLABE: 18 dígitos y el último es dígito verificador (pesos 3, 7, 1 sobre los
 * 17 primeros, suma de los módulos 10, y el control es lo que falta para 10).
 * Se valida antes de mandarla: Stripe rechaza una CLABE mal formada con un
 * mensaje genérico que la operadora no puede leer.
 */
export function clabeValida(clabe: string): boolean {
  const s = (clabe ?? "").replace(/\s/g, "");
  if (!/^\d{18}$/.test(s)) return false;
  const pesos = [3, 7, 1];
  let suma = 0;
  for (let i = 0; i < 17; i++) suma += (Number(s[i]) * pesos[i % 3]) % 10;
  return (10 - (suma % 10)) % 10 === Number(s[17]);
}

/** El RFC con la forma que exige el SAT: 12 (moral) o 13 (física) caracteres. */
export function rfcValido(rfc: string): boolean {
  return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test((rfc ?? "").trim().toUpperCase());
}

/** «5512345678» → «+525512345678». Diez dígitos de México; si ya trae +, se respeta. */
export function telefonoE164(t: string): string | null {
  const s = (t ?? "").replace(/[\s()-]/g, "");
  if (/^\+\d{8,15}$/.test(s)) return s;
  if (/^\d{10}$/.test(s)) return `+52${s}`;
  return null;
}

/** «1990-05-31» → {day, month, year}. Null si no es una fecha. */
export function nacimientoDe(ymd: string): { day: number; month: number; year: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((ymd ?? "").trim());
  if (!m) return null;
  const [year, month, day] = m.slice(1).map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) return null;
  return { day, month, year };
}

/** Los 32 estados, con la clave ISO 3166-2 que Stripe entiende. */
export const ESTADOS_MX: { clave: string; nombre: string }[] = [
  { clave: "AGU", nombre: "Aguascalientes" }, { clave: "BCN", nombre: "Baja California" },
  { clave: "BCS", nombre: "Baja California Sur" }, { clave: "CAM", nombre: "Campeche" },
  { clave: "CHP", nombre: "Chiapas" }, { clave: "CHH", nombre: "Chihuahua" },
  { clave: "CMX", nombre: "Ciudad de México" }, { clave: "COA", nombre: "Coahuila" },
  { clave: "COL", nombre: "Colima" }, { clave: "DUR", nombre: "Durango" },
  { clave: "GUA", nombre: "Guanajuato" }, { clave: "GRO", nombre: "Guerrero" },
  { clave: "HID", nombre: "Hidalgo" }, { clave: "JAL", nombre: "Jalisco" },
  { clave: "MEX", nombre: "Estado de México" }, { clave: "MIC", nombre: "Michoacán" },
  { clave: "MOR", nombre: "Morelos" }, { clave: "NAY", nombre: "Nayarit" },
  { clave: "NLE", nombre: "Nuevo León" }, { clave: "OAX", nombre: "Oaxaca" },
  { clave: "PUE", nombre: "Puebla" }, { clave: "QUE", nombre: "Querétaro" },
  { clave: "ROO", nombre: "Quintana Roo" }, { clave: "SLP", nombre: "San Luis Potosí" },
  { clave: "SIN", nombre: "Sinaloa" }, { clave: "SON", nombre: "Sonora" },
  { clave: "TAB", nombre: "Tabasco" }, { clave: "TAM", nombre: "Tamaulipas" },
  { clave: "TLA", nombre: "Tlaxcala" }, { clave: "VER", nombre: "Veracruz" },
  { clave: "YUC", nombre: "Yucatán" }, { clave: "ZAC", nombre: "Zacatecas" },
];

/**
 * Quita lo vacío antes de tokenizar. Un token de actualización sólo debe
 * llevar lo que se quiere cambiar: Stripe rechaza `first_name: ""` y, peor,
 * nunca deja poner en blanco un dato obligatorio. Recursivo; un objeto que
 * queda vacío también se quita.
 */
export function sinVacios<T>(v: T): T | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "string") return v.trim() === "" ? undefined : (v.trim() as unknown as T);
  if (typeof v === "number" || typeof v === "boolean") return v;
  if (Array.isArray(v)) {
    const a = v.map(sinVacios).filter((x) => x !== undefined);
    return (a.length ? a : undefined) as unknown as T;
  }
  if (typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      const y = sinVacios(x);
      if (y !== undefined) o[k] = y;
    }
    return (Object.keys(o).length ? o : undefined) as unknown as T;
  }
  return v;
}

// ── Lo que Stripe todavía pide, en palabras de la operadora ─────────────────
//
// `requirements.currently_due` trae claves como `individual.dob.day` o
// `representative.verification.document`. La pantalla de la casa las enseña
// tal cual (un revisor sí las lee); la de la operadora no puede: ni sabe qué
// es `individual`, ni debe leer «Stripe». Una clave que no está en la tabla
// se enseña en crudo antes que ocultarla — si Stripe pide algo nuevo, que se
// vea.

const SUJETO: [RegExp, string][] = [
  [/^individual\./, ""],
  [/^representative\./, "del representante legal"],
  [/^owners\./, "de un dueño"],
  [/^company\./, "de la empresa"],
  [/^directors\./, "de un director"],
  [/^executives\./, "de un ejecutivo"],
];

const CAMPO: [RegExp, string][] = [
  [/^(first|last)_name$/, "nombre y apellidos"],
  [/^dob\./, "fecha de nacimiento"],
  [/^address\./, "domicilio"],
  [/^id_number$/, "RFC"],
  [/^tax_id$/, "RFC"],
  [/^name$/, "razón social"],
  [/^phone$/, "teléfono"],
  [/^email$/, "correo"],
  [/^verification\.document/, "identificación oficial (foto)"],
  [/^verification\.additional_document/, "comprobante de domicilio"],
  [/^relationship\.percent_ownership$/, "porcentaje de participación"],
  [/^relationship\.title$/, "cargo"],
  [/^owners_provided$/, "confirmar quiénes son los dueños"],
  [/^directors_provided$/, "confirmar quiénes son los directores"],
  [/^executives_provided$/, "confirmar quiénes son los ejecutivos"],
];

const CUENTA: [RegExp, string][] = [
  [/^external_account$/, "cuenta bancaria (CLABE)"],
  [/^tos_acceptance\./, "aceptación del convenio"],
  [/^business_profile\.(mcc|url|product_description)$/, "giro y sitio (los pone Caminante)"],
  [/^business_type$/, "tipo de persona"],
];

/** Una clave de Stripe → lo que se le pide a la operadora. Sin duplicados. */
export function traducirPendientes(claves: string[]): string[] {
  const vistos = new Set<string>();
  for (const clave of claves ?? []) {
    let texto: string | null = null;
    for (const [re, t] of CUENTA) if (re.test(clave)) { texto = t; break; }
    if (!texto) {
      let sujeto: string | null = null;
      let resto = clave;
      for (const [re, s] of SUJETO) {
        if (re.test(clave)) { sujeto = s; resto = clave.replace(re, ""); break; }
      }
      if (sujeto !== null) {
        for (const [re, t] of CAMPO) if (re.test(resto)) { texto = sujeto ? `${t} ${sujeto}` : t; break; }
      }
    }
    vistos.add(texto ?? clave);
  }
  return [...vistos];
}

export type ErrorDeVerificacion = { campo: string; mensaje: string };

/**
 * `requirements.errors` es lo único que explica POR QUÉ algo sigue pendiente
 * (RFC que no cuadra, documento ilegible). Se traduce el campo y se conserva
 * el mensaje de Stripe, que ya viene en español cuando la cuenta es MX.
 */
export function erroresDeVerificacion(
  errores: { requirement?: string; reason?: string; code?: string }[] | null | undefined,
): ErrorDeVerificacion[] {
  return (errores ?? []).map((e) => ({
    campo: traducirPendientes([e.requirement ?? ""])[0] ?? "",
    mensaje: e.reason ?? e.code ?? "No pasó la verificación.",
  }));
}
