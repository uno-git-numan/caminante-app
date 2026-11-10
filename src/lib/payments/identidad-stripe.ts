// LO QUE STRIPE YA NO TIENE QUE PREGUNTARLE A LA OPERADORA.
//
// La cuenta de cobro se creaba vacía: correo, nombre comercial y país. En su
// verificación, Stripe le volvía a pedir razón social, RFC y código postal
// — datos que ya están en su constancia confirmada con el SAT
// (fiscal-de-csf.ts). Meta del alta en 15 minutos (Luis, 9 nov 2026): lo que
// ya sabemos se le manda a Stripe, y ella sólo pone lo que no tenemos:
// identificación, CLABE y aceptar el contrato de Stripe.
//
// Probado en modo test el 9 nov 2026 (cuentas v2, stripe-node 20.4.1): crear
// con `business_details` (moral) o `individual` (física), y actualizarlos
// después, funciona.
//
// ⚠️ El nombre de una persona física NO se manda: la constancia lo trae en una
// sola cadena y partirlo en nombre y apellidos sería adivinar. Stripe se lo
// pregunta. Puro, para poder probarlo.

export type FiscalParaStripe = {
  tipo_persona: string | null;
  rfc: string | null;
  razon_social: string | null;
  cp_fiscal: string | null;
  email: string | null;
};

type Direccion = { country: "mx"; postal_code: string };
export type IdentidadStripe = {
  business_details?: { registered_name?: string; id_numbers?: { type: "mx_rfc"; value: string }[]; address?: Direccion };
  individual?: { id_numbers?: { type: "mx_rfc"; value: string }[]; address?: Direccion; email?: string };
};

/** Lo que va en `identity` (sin país ni tipo). Vacío si no hay nada que mandar. */
export function identidadParaStripe(op: FiscalParaStripe): IdentidadStripe {
  const rfc = op.rfc?.trim().toUpperCase() || null;
  const cp = /^\d{5}$/.test(op.cp_fiscal?.trim() ?? "") ? op.cp_fiscal!.trim() : null;
  const ids = rfc ? [{ type: "mx_rfc" as const, value: rfc }] : undefined;
  const address = cp ? { country: "mx" as const, postal_code: cp } : undefined;
  if (op.tipo_persona === "moral") {
    const bd = {
      ...(op.razon_social?.trim() ? { registered_name: op.razon_social.trim() } : {}),
      ...(ids ? { id_numbers: ids } : {}),
      ...(address ? { address } : {}),
    };
    return Object.keys(bd).length ? { business_details: bd } : {};
  }
  if (op.tipo_persona === "fisica") {
    const ind = {
      ...(ids ? { id_numbers: ids } : {}),
      ...(address ? { address } : {}),
      ...(op.email?.trim() ? { email: op.email.trim() } : {}),
    };
    return Object.keys(ind).length ? { individual: ind } : {};
  }
  // Sin saber si es física o moral no se manda nada: un RFC en el lugar
  // equivocado le pediría a Stripe el KYC equivocado.
  return {};
}
