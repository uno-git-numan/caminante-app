// EL COBRO POR CONNECT, CONTRA STRIPE DE VERDAD (modo test).
//
// Las pruebas unitarias dicen qué parámetros produce el código. Ésta dice si
// STRIPE los acepta y cómo reparte el dinero, que es otra pregunta y es la que
// importa: una transferencia perfectamente calculada sobre una cuenta
// sin la capacidad `transfers` se rechaza en la caja, con el cliente enfrente.
//
// ⚠️ NO CORRE SOLA. Cobra y reembolsa de verdad contra la API de Stripe, así
// que necesita red y una llave de prueba. Se prende a mano:
//
//   PROBAR_CONNECT=1 npm test
//
// y exige `sk_test_`. Con una llave live movería dinero de una persona.
//
// La cuenta conectada se reutiliza entre corridas si le pasas
// CONNECT_CUENTA_PRUEBA=acct_…; si no, crea una operadora mexicana ya
// verificada. Hoy existe: acct_1UIY1PGsHqvvIJpt («Operadora Cero»).
import { beforeAll, describe, expect, it } from "vitest";
import { paraStripe, planDeCobro, retencionDe } from "@/lib/payments/connect-cobro";
import type { OperadorParaGate } from "@/lib/operators/listo-para-vender";
import { comisionDeVenta, sinIva } from "@/lib/operadores/comision";

const KEY = process.env.STRIPE_SECRET_KEY ?? "";
const prendida = process.env.PROBAR_CONNECT === "1" && KEY.startsWith("sk_test_");

const api = async (ruta: string, cuerpo?: Record<string, string>, cabeceras: Record<string, string> = {}) => {
  const r = await fetch(`https://api.stripe.com/v1/${ruta}`, {
    method: cuerpo ? "POST" : "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${KEY}:`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...cabeceras,
    },
    ...(cuerpo ? { body: new URLSearchParams(cuerpo) } : {}),
  });
  const d = (await r.json()) as Record<string, never> & { error?: { code?: string; message: string } };
  if (d.error) throw new Error(`${d.error.code ?? ""}: ${d.error.message}`);
  return d as unknown as Record<string, unknown>;
};

async function crearOperadoraDePrueba(): Promise<string> {
  const a = await api("accounts", {
    country: "MX",
    email: "operadora.cero+connect@numanhub.com",
    "controller[stripe_dashboard][type]": "none",
    "controller[fees][payer]": "application",
    "controller[losses][payments]": "application",
    "controller[requirement_collection]": "application",
    "capabilities[card_payments][requested]": "true",
    "capabilities[transfers][requested]": "true",
    business_type: "individual",
    "individual[first_name]": "Operadora",
    "individual[last_name]": "Cero",
    "individual[email]": "operadora.cero+connect@numanhub.com",
    "individual[dob][day]": "1",
    "individual[dob][month]": "1",
    "individual[dob][year]": "1990",
    "individual[address][line1]": "Av Insurgentes Sur 1",
    "individual[address][city]": "Ciudad de Mexico",
    "individual[address][state]": "CMX",
    "individual[address][postal_code]": "06700",
    "individual[address][country]": "MX",
    "individual[phone]": "+525555555555",
    "individual[id_number]": "000000000",
    "business_profile[url]": "https://caminante.numanhub.com",
    "business_profile[mcc]": "4722",
    "external_account[object]": "bank_account",
    "external_account[country]": "MX",
    "external_account[currency]": "mxn",
    "external_account[account_number]": "000000001234567897",
    "external_account[account_holder_name]": "Operadora Cero",
    "tos_acceptance[date]": String(Math.floor(Date.now() / 1000)),
    "tos_acceptance[ip]": "127.0.0.1",
    "metadata[proposito]": "prueba-caminante-connect",
  });
  return a.id as string;
}

const saldoPendiente = async (cuenta: string): Promise<number> => {
  const b = await api("balance", undefined, { "Stripe-Account": cuenta });
  return ((b.pending ?? []) as { amount: number }[]).reduce((n, m) => n + m.amount, 0);
};

/**
 * Espera a que el saldo llegue a un valor y lo devuelve.
 *
 * ⚠️ SE MIDE EL CAMBIO, NO EL TOTAL. La cuenta de prueba se reutiliza entre
 * corridas y acumula historia: una corrida que falle a media prueba deja un
 * cargo sin reembolsar, y desde entonces el saldo absoluto nunca vuelve a cero.
 * Comparar contra el total haría que esta prueba fallara para siempre por algo
 * que pasó otro día. (Pasó: la primera corrida dejó $1,400 colgados.)
 *
 * Esperar un valor concreto —en vez de dormir un rato fijo— la hace rápida
 * cuando el saldo ya está y honesta cuando no: si nunca llega, falla diciendo
 * qué esperaba.
 */
async function saldoHastaQueSea(cuenta: string, esperado: number, segundos = 25): Promise<number> {
  let visto = await saldoPendiente(cuenta);
  for (let i = 0; i < segundos && visto !== esperado; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    visto = await saldoPendiente(cuenta);
  }
  return visto;
}

// El precio real de `corral-de-piedra` y la comisión que cobraron sus 12 ventas.
const PRECIO = 1750;
const COMISION = comisionDeVenta(
  { viaje: { precioUnitario: sinIva(PRECIO), cantidad: 1 } },
  { tipo: "escala", escala: "venta" },
).monto;
const FEE = Math.round(retencionDe(COMISION) * 100);

describe.skipIf(!prendida)("cobro por Connect contra Stripe (test)", () => {
  let cuenta = "";

  beforeAll(async () => {
    cuenta = process.env.CONNECT_CUENTA_PRUEBA || (await crearOperadoraDePrueba());
    const a = await api(`accounts/${cuenta}`);
    if (!a.charges_enabled || (a.capabilities as Record<string, string>)?.transfers !== "active") {
      throw new Error(`La cuenta ${cuenta} todavía no cobra ni recibe transferencias.`);
    }
  }, 60_000);

  it(
    "cobra a nombre de la operadora, le transfiere SÓLO lo suyo (comisión y retención fuera) y se deshace en proporción",
    async () => {
      expect(COMISION).toBe(301.72);
      expect(FEE).toBe(35000); // $350.00 de comisión + IVA

      // Exactamente lo que produce el código: `planDeCobro` + `paraStripe`.
      const plan = planDeCobro(
        {
          stripe_account_id: cuenta,
          stripe_charges_enabled: true,
          rfc: "ROBL990531HI3",
          razon_social: "Operadora Cero",
          regimen_fiscal: "612",
          cp_fiscal: "06700",
          tipo_persona: "fisica",
          convenio_firmado_at: "2026-09-01",
          commission_pct: 20,
        } as OperadorParaGate,
        COMISION,
        PRECIO,
        new Date("2026-11-11T18:00:00Z"),
      );
      if (plan.canal !== "connect") throw new Error("se esperaba connect");
      const s = paraStripe(plan);
      expect(s.transfer_data?.amount).toBe(124160); // $1,750 − $350 − $158.40 (ISR truncado, M15)

      // De aquí se mide todo. Ver `saldoHastaQueSea`.
      const antes = await saldoPendiente(cuenta);

      const pi = await api("payment_intents", {
        amount: String(PRECIO * 100),
        currency: "mxn",
        confirm: "true",
        payment_method: "pm_card_visa",
        "payment_method_types[]": "card",
        on_behalf_of: s.on_behalf_of!,
        "transfer_data[destination]": s.transfer_data!.destination,
        "transfer_data[amount]": String(s.transfer_data!.amount),
        "metadata[canal_cobro]": "connect",
      });
      expect(pi.status).toBe("succeeded");
      expect(pi.on_behalf_of).toBe(cuenta);

      // Desde el 11 nov el saldo de la operadora sube EXACTAMENTE lo transferido.
      const conLaVenta = antes + 124160;
      expect(await saldoHastaQueSea(cuenta, conLaVenta)).toBe(conLaVenta);

      // La mitad devuelta revierte la mitad de lo transferido: lo de Numan
      // (comisión + retención) queda en proporción, sin cuentas a mano.
      await api("refunds", { payment_intent: pi.id as string, amount: String((PRECIO * 100) / 2), reverse_transfer: "true" });
      const aLaMitad = antes + 124160 - 62080;
      expect(await saldoHastaQueSea(cuenta, aLaMitad)).toBe(aLaMitad);

      // Y el resto la deja como estaba.
      await api("refunds", { payment_intent: pi.id as string, reverse_transfer: "true", "metadata[origen]": "caminante-prueba" });
      expect(await saldoHastaQueSea(cuenta, antes)).toBe(antes);
    },
    120_000,
  );
});
