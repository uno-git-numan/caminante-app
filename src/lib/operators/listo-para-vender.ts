// Guardrail de "operador listo para vender" — espejo de `flujo-venta.ts`.
//
// La regla de la casa es la misma que la del deslinde (caso Enyd, 9 jul): si el
// flujo no está completo, NO SE VENDE. Aquí el flujo es el del operador externo:
// para que su experiencia cobre por Connect y facture a su nombre tienen que
// existir cuatro cosas, y las cuatro son verificables — ninguna es una casilla
// de honor.
//
// Lo consultan los mismos tres lugares que hoy consultan `deslindeListo`:
//   1. publicar desde el formulario
//   2. publicar desde el dashboard
//   3. cobrar
//
// ⚠️ SOLO aplica a experiencias CON operador externo en Connect. Las propias de
// Caminante siguen por el camino de siempre y este gate no las toca: un operador
// sin `stripe_account_id` no está en Connect, y `operadorListo` lo deja pasar
// (ver `requiereConnect`). Ese es el "detrás de una bandera por operador" del
// plan — el camino que hoy cobra dinero real no se toca.

// ⚠️ LA COMISIÓN SALE DE `commission_pct` Y DE NINGÚN OTRO LADO.
// `platform_fee_pct` duplicaba ese dato sin que nadie la leyera; la 0037 la borra
// justo para que no pueda usarse por error. Si Connect leyera una y el reporte de
// payout la otra, el checkout cobraría un porcentaje y el corte mostraría otro:
// un bug de dinero silencioso, del que nadie se entera hasta que un operador
// reclama. Y `commission_pct` en NULL bloquea la venta (condición 5, abajo).

export type OperadorFlujo = {
  ok: boolean;
  faltantes: string[]; // todo lo listado bloquea vender a nombre del operador
};

// La forma mínima que necesita el gate. Se declara aquí —y no se importa un
// `Operator` global— porque hoy no existe ese tipo y el gate debe poder
// evaluarse con un `select` corto, sin traerse la fila entera.
export type OperadorParaGate = {
  stripe_account_id?: string | null;
  stripe_charges_enabled?: boolean | null;
  csd_cer_path?: string | null;
  csd_key_path?: string | null;
  csd_vence_at?: string | null; // date (YYYY-MM-DD)
  rfc?: string | null;
  razon_social?: string | null;
  regimen_fiscal?: string | null;
  cp_fiscal?: string | null;
  tipo_persona?: string | null;
  convenio_firmado_at?: string | null;
  commission_pct?: number | null;
};

// Las columnas que hay que pedirle a PostgREST para poder evaluar el gate.
// Se exporta para que ningún call site invente su propio `select` y se deje
// fuera una columna: un campo ausente llega como `undefined` y el gate lo
// reportaría como faltante aunque en la base estuviera lleno.
export const COLUMNAS_GATE =
  "stripe_account_id,stripe_charges_enabled,csd_cer_path,csd_key_path,csd_vence_at,rfc,razon_social,regimen_fiscal,cp_fiscal,tipo_persona,convenio_firmado_at,commission_pct";

// Un operador solo entra al camino nuevo cuando tiene cuenta conectada. Sin
// ella opera por el flujo de siempre (Numan cobra y le transfiere a mano), y
// exigirle CSD o convenio para vender rompería lo que hoy funciona.
export function requiereConnect(op: OperadorParaGate | null | undefined): boolean {
  return Boolean(op?.stripe_account_id?.trim());
}

// El CSD caduca a los 4 años. Vencido no sirve para timbrar: el SAT rechaza el
// sello. Se compara por DÍA en tiempo local del servidor —el certificado vence
// al final de su día, no a una hora— y una fecha ausente cuenta como faltante,
// nunca como vigente.
export function csdVigente(vence: string | null | undefined, hoy = new Date()): boolean {
  if (!vence?.trim()) return false;
  const [y, m, d] = vence.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return false;
  const finDelDia = new Date(y, m - 1, d, 23, 59, 59, 999);
  return finDelDia.getTime() >= hoy.getTime();
}

// Días que le quedan al CSD. Negativo = ya venció. Lo usa el aviso de 60 días
// y la columna de estado del panel.
export function diasParaVencerCsd(
  vence: string | null | undefined,
  hoy = new Date(),
): number | null {
  if (!vence?.trim()) return null;
  const [y, m, d] = vence.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  const finDelDia = new Date(y, m - 1, d, 23, 59, 59, 999);
  return Math.ceil((finDelDia.getTime() - hoy.getTime()) / 86_400_000);
}

export function operadorListo(
  op: OperadorParaGate | null | undefined,
  hoy = new Date(),
): OperadorFlujo {
  // Sin operador o sin Connect: no aplica este gate. La experiencia propia de
  // Caminante no tiene por qué traer CSD ni convenio para venderse.
  if (!requiereConnect(op)) return { ok: true, faltantes: [] };

  const faltantes: string[] = [];

  // 1 · Stripe. `charges_enabled` es lo que STRIPE dice, no lo que nosotros
  // creemos: lo escribe el webhook `account.updated`. Que exista la cuenta no
  // significa que ya pueda cobrar — el KYC puede seguir incompleto.
  if (!op?.stripe_charges_enabled) {
    faltantes.push(
      "Stripe todavía no habilita los cobros de este operador: le falta completar su verificación (sección “Conecta tu cuenta”).",
    );
  }

  // 2 · CSD cargado y vigente. Sin él no se puede timbrar a su nombre, que es
  // justo lo que distingue a un operador de un embajador.
  // ⚠️ Los DOS archivos, no uno. El SAT entrega `.cer` (certificado) y `.key`
  // (llave privada) y timbrar necesita ambos: con solo uno el expediente se ve
  // completo en pantalla y falla en producción, que es la peor forma de fallar.
  const faltanArchivos = [
    !op?.csd_cer_path?.trim() ? ".cer" : null,
    !op?.csd_key_path?.trim() ? ".key" : null,
  ].filter(Boolean);
  if (faltanArchivos.length) {
    faltantes.push(
      `Falta subir el ${faltanArchivos.join(" y el ")} del CSD del operador (sección “Sube tu CSD”). Sin los dos archivos no puede facturar a su nombre.`,
    );
  } else if (!csdVigente(op?.csd_vence_at, hoy)) {
    const dias = diasParaVencerCsd(op?.csd_vence_at, hoy);
    faltantes.push(
      dias === null
        ? "El CSD no tiene fecha de vigencia registrada: no se puede saber si sigue sirviendo para timbrar."
        : `El CSD del operador venció hace ${Math.abs(dias)} día(s). El SAT rechaza el sello: hay que renovarlo antes de vender.`,
    );
  }

  // 3 · Datos fiscales completos. Son los del EMISOR del CFDI; si falta uno, el
  // timbrado falla en producción y el cliente se queda sin factura.
  const fiscales: [string | null | undefined, string][] = [
    [op?.rfc, "RFC"],
    [op?.razon_social, "razón social"],
    [op?.regimen_fiscal, "régimen fiscal"],
    [op?.cp_fiscal, "código postal fiscal"],
  ];
  const faltanFiscales = fiscales.filter(([v]) => !v?.trim()).map(([, etiqueta]) => etiqueta);
  if (faltanFiscales.length) {
    faltantes.push(
      `Faltan datos fiscales del operador (${faltanFiscales.join(", ")}): son los del emisor del CFDI y sin ellos no se puede timbrar.`,
    );
  }
  // `tipo_persona` define si aplica retención de ISR e IVA. Vender sin saberlo
  // deja a Numan expuesta como corresponsable solidaria.
  if (!op?.tipo_persona?.trim()) {
    faltantes.push(
      "Falta indicar si el operador es persona física o moral: de eso depende si hay retención de ISR e IVA.",
    );
  }

  // 4 · Convenio firmado. El gate lee la fecha de firma del expediente, no una
  // casilla que alguien marcó de buena fe.
  if (!op?.convenio_firmado_at?.trim()) {
    faltantes.push("El convenio con el operador no está firmado. Sin él la comisión y las responsabilidades no son exigibles.");
  }

  // 5 · Comisión pactada. ⚠️ ESTE ES EL CANDADO QUE MÁS DINERO CUIDA.
  //
  // Con cargo directo el dinero entra a la cuenta del operador y lo ÚNICO que se
  // queda Numan es el `application_fee`, que sale de `commission_pct`. En NULL no
  // hay nada que retener: la venta se cobraría perfecta, el cliente viajaría
  // contento y Numan ganaría CERO, sin un solo error en pantalla. Y como la
  // atribución se congela en la venta (0016), tampoco se puede cobrar después.
  //
  // Por eso NULL bloquea aquí y no se trata como 0. Comprobado el 18 ago: los dos
  // operadores de la base (Kéntro y Numan · Caminante) tienen `commission_pct` en
  // NULL — sin este candado, el primero que conectara Stripe vendería gratis.
  if (op?.commission_pct === null || op?.commission_pct === undefined) {
    faltantes.push(
      "El operador no tiene comisión pactada (“% por definir”). Con cargo directo el cobro entra a su cuenta y Numan no retendría nada: hay que capturarla en el convenio antes de vender.",
    );
  }

  return { ok: faltantes.length === 0, faltantes };
}
