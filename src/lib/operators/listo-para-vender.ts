// Guardrail de "operador listo para vender" — espejo de `flujo-venta.ts`.
//
// La regla de la casa es la misma que la del deslinde (caso Enyd, 9 jul): si el
// flujo no está completo, NO SE VENDE. Aquí el flujo es el del operador externo:
// para que su experiencia cobre por Connect tienen que existir cinco cosas, y
// las cinco son verificables — ninguna es una casilla de honor. El CSD dejó de
// ser condición el 9 nov 2026 (facturar a su cliente desde el portal se prende
// después); los datos fiscales se quedan, pero salen solos de su constancia.
//
// Lo consulta `candadosDe` (`lib/experiences/candados-venta.ts`), que es la
// única puerta de publicar y cobrar. ⚠️ Hasta el 22 sep 2026 este encabezado
// prometía tres lugares y NADIE lo llamaba en ninguno: era documentación que se
// leía como garantía. Hoy el invariante #20 lo vigila.
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
// reclama. Lo que NO es cierto —y este archivo lo daba por hecho— es que
// `commission_pct` en NULL signifique «sin comisión»: con NULL cobra la escala
// por tramos. Ver la condición 5.

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
  /** Desde cuándo genera comisión (0047). Sin fecha, la escala no le cobra nada. */
  comision_desde?: string | null;
};

// Las columnas que hay que pedirle a PostgREST para poder evaluar el gate.
// Se exporta para que ningún call site invente su propio `select` y se deje
// fuera una columna: un campo ausente llega como `undefined` y el gate lo
// reportaría como faltante aunque en la base estuviera lleno.
export const COLUMNAS_GATE =
  "stripe_account_id,stripe_charges_enabled,csd_cer_path,csd_key_path,csd_vence_at,rfc,razon_social,regimen_fiscal,cp_fiscal,tipo_persona,convenio_firmado_at,commission_pct,comision_desde";

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
  // Ya no se usa desde que el CSD salió del gate (9 nov 2026); se conserva la
  // firma para no tocar a quien la llama con fecha.
  _hoy = new Date(),
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
      "Su cuenta de cobro todavía no está verificada: le falta completar la verificación (sección “Conecta tu cuenta”).",
    );
  }

  // 2 · DATOS FISCALES, SÍ; CSD, NO. Dos decisiones de Luis el 9 nov 2026.
  //
  // En la mañana, haciendo el alta de una operadora en vivo: el CSD no detiene
  // la venta («si quieren facturación, que se prenda en un paso posterior,
  // pero no sea un cuello para empezar a cobrar»). Facturarle a su cliente es
  // SU obligación; si no prende la facturación del portal, factura por fuera.
  // `csdVigente` sigue aquí para la pantalla de Cobrar.
  //
  // En la noche: los datos fiscales SÍ, porque NUMAN le factura su comisión con
  // Facturapi y el CFDI exige RFC, razón social, régimen y CP — pero «que
  // salgan de la constancia y no pidamos». Los escribe `analizarCsf` cuando el
  // SAT confirma la constancia (fiscal-de-csf.ts). Lo que este candado exige
  // es que estén; la operadora no teclea ninguno.
  const fiscales = [op?.rfc, op?.razon_social, op?.regimen_fiscal, op?.cp_fiscal];
  if (fiscales.some((v) => !v?.trim())) {
    faltantes.push(
      op?.rfc?.trim() && !op?.regimen_fiscal?.trim()
        ? "Su constancia fiscal trae más de un régimen de negocio: falta decidir con cuál se le factura la comisión."
        : "Falta su Constancia de Situación Fiscal confirmada con el SAT: de ahí salen sus datos fiscales para facturarle la comisión.",
    );
  }

  // 3 · Física o moral SÍ se queda.
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

  // 5 · Comisión RESUELTA. ⚠️ ESTE ES EL CANDADO QUE MÁS DINERO CUIDA.
  //
  // Lo que Numan retiene de una venta por Connect es la comisión (desde el 11
  // nov 2026 la transferencia sale neta, ver connect-cobro.ts). Si sale cero, la venta se cobra perfecta, el cliente viaja contento y Numan
  // gana NADA, sin un solo error en pantalla — y como la atribución se congela
  // al vender (0016), tampoco se puede cobrar después.
  //
  // ⚠️ PERO «RESUELTA» NO ES «PLANA». Este candado exigía `commission_pct` no
  // nulo, y eso era falso desde que existe la escala: con NULL, la regla de la
  // casa cobra por tramos (ver `reglaComisionDeOperador`). Las 12 ventas de
  // Nomádika —`commission_pct` en NULL— retuvieron $301.72 cada una, no cero.
  // El candado le decía «sin definir» a una comisión que llevaba semanas
  // cobrándose, y habría bloqueado a la primera operadora sin trato negociado,
  // que es el caso NORMAL.
  //
  // Lo que sí deja el fee en cero es no tener `comision_desde`: sin esa fecha
  // la operadora no genera comisión sobre nada (0047). Eso es lo que se exige.
  if (op?.commission_pct == null && !op?.comision_desde?.trim()) {
    faltantes.push(
      "El operador no genera comisión todavía: no tiene un porcentaje pactado ni fecha de arranque. Con el cobro a su nombre, Numan no retendría nada. Se define en su ficha antes de vender.",
    );
  }

  return { ok: faltantes.length === 0, faltantes };
}
