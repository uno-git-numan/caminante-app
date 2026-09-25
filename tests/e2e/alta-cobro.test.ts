// EL ALTA DE COBRO EN LA PLATAFORMA, CONTRA STRIPE DE VERDAD (modo test).
//
// `alta-cobro.test.ts` (unitaria) dice qué le mandamos a Stripe. Ésta dice si
// STRIPE LO ACEPTA para México: que un token de cuenta con los campos de la
// pantalla (`AltaCobro.tsx`) más una CLABE dejen la cuenta SIN requisitos
// pendientes de los que nosotros recabamos. Si Stripe cambia lo que pide para
// MX, esta prueba lo dice antes que una operadora.
//
// ⚠️ NO CORRE SOLA. Necesita red y una llave de PRUEBA (misma regla que
// connect.test.ts):
//
//   PROBAR_CONNECT=1 npm test
//
// Los tokens se crean aquí con la llave secreta —Stripe lo permite— en vez de
// con Stripe.js: lo que se prueba es la FORMA de los datos, que es la misma.
// Las cuentas que crea se borran al final; son de prueba y quedan en cero.
//
// Valores de prueba de Stripe: DOB 1901-01-01 (verifica), RFC 000000000
// (verifica), `address_full_match`, CLABE 000000001234567897 (paga).
import { afterAll, describe, expect, it } from "vitest";
import { traducirPendientes } from "@/lib/payments/alta-cobro";

const KEY = process.env.STRIPE_SECRET_KEY ?? "";
const prendida = process.env.PROBAR_CONNECT === "1" && KEY.startsWith("sk_test_");

const api = async (ruta: string, cuerpo?: Record<string, string>, metodo?: "DELETE") => {
  const r = await fetch(`https://api.stripe.com/v1/${ruta}`, {
    method: metodo ?? (cuerpo ? "POST" : "GET"),
    headers: {
      Authorization: `Basic ${Buffer.from(`${KEY}:`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    ...(cuerpo ? { body: new URLSearchParams(cuerpo) } : {}),
  });
  const d = (await r.json()) as Record<string, unknown> & { error?: { code?: string; message: string } };
  if (d.error) throw new Error(`${d.error.code ?? ""}: ${d.error.message}`);
  return d;
};

/** Lo que la pantalla del alta manda y por tanto NO puede seguir pendiente. */
const LO_QUE_MANDAMOS = [
  /^individual\./, /^representative\./, /^company\.(name|tax_id|address|phone|owners_provided)/,
  /^external_account$/, /^tos_acceptance\./, /^business_profile\.(mcc|url)$/, /^business_type$/,
];
const pendientesNuestros = (req: unknown) =>
  (((req ?? {}) as { currently_due?: string[] }).currently_due ?? []).filter((k) => LO_QUE_MANDAMOS.some((re) => re.test(k)));

const CONTROL = {
  "controller[stripe_dashboard][type]": "none",
  "controller[fees][payer]": "application",
  "controller[losses][payments]": "application",
  "controller[requirement_collection]": "application",
  country: "MX",
  "capabilities[card_payments][requested]": "true",
  "capabilities[transfers][requested]": "true",
  "business_profile[mcc]": "4722",
  "business_profile[url]": "https://caminante.numanhub.com",
  "business_profile[product_description]": "Experiencias guiadas en naturaleza, reservadas por Caminante.",
  "metadata[proposito]": "prueba-caminante-alta-cobro",
};

const creadas: string[] = [];

describe.skipIf(!prendida)("alta de cobro en la plataforma, contra Stripe (test)", () => {
  afterAll(async () => {
    for (const id of creadas) await api(`accounts/${id}`, undefined, "DELETE").catch(() => {});
  });

  it(
    "persona FÍSICA: token de cuenta + CLABE ⇒ nada de lo nuestro queda pendiente",
    async () => {
      const tok = await api("tokens", {
        "account[business_type]": "individual",
        "account[individual][first_name]": "Operadora",
        "account[individual][last_name]": "Cero",
        "account[individual][dob][day]": "1", "account[individual][dob][month]": "1", "account[individual][dob][year]": "1901",
        "account[individual][address][line1]": "address_full_match",
        "account[individual][address][city]": "Ciudad de México",
        "account[individual][address][state]": "CMX",
        "account[individual][address][postal_code]": "06700",
        "account[individual][address][country]": "MX",
        "account[individual][id_number]": "000000000",
        "account[individual][phone]": "+525555555555",
        "account[individual][email]": "operadora.cero+alta@numanhub.com",
        "account[tos_shown_and_accepted]": "true",
      });
      const acct = await api("accounts", { ...CONTROL, email: "operadora.cero+alta@numanhub.com", account_token: tok.id as string });
      creadas.push(acct.id as string);

      const btok = await api("tokens", {
        "bank_account[country]": "MX", "bank_account[currency]": "mxn",
        "bank_account[account_number]": "000000001234567897",
        "bank_account[account_holder_name]": "Operadora Cero",
        "bank_account[account_holder_type]": "individual",
      });
      await api(`accounts/${acct.id}`, { external_account: btok.id as string });

      const a = await api(`accounts/${acct.id}`);
      expect((a.controller as { requirement_collection: string }).requirement_collection).toBe("application");
      // La aceptación quedó sellada por el token: fecha, IP y navegador.
      expect((a.tos_acceptance as { date: number | null }).date).toBeTruthy();
      const pend = pendientesNuestros(a.requirements);
      expect(pend, `Stripe sigue pidiendo: ${pend.join(", ")}`).toEqual([]);
      // Y lo que quede (si queda) tiene traducción, o sale en crudo pero sale.
      const todo = ((a.requirements as { currently_due?: string[] }).currently_due ?? []);
      expect(traducirPendientes(todo).length).toBe(new Set(traducirPendientes(todo)).size);
    },
    60_000,
  );

  it(
    "persona MORAL: token de cuenta (empresa) + token de persona (representante y dueño) ⇒ nada de lo nuestro pendiente",
    async () => {
      const tok = await api("tokens", {
        "account[business_type]": "company",
        "account[company][name]": "Operadora Cero SA de CV",
        "account[company][tax_id]": "000000000",
        "account[company][phone]": "+525555555555",
        "account[company][address][line1]": "address_full_match",
        "account[company][address][city]": "Ciudad de México",
        "account[company][address][state]": "CMX",
        "account[company][address][postal_code]": "06700",
        "account[company][address][country]": "MX",
        "account[company][owners_provided]": "true",
        "account[tos_shown_and_accepted]": "true",
      });
      const acct = await api("accounts", { ...CONTROL, email: "operadora.cero+moral@numanhub.com", account_token: tok.id as string });
      creadas.push(acct.id as string);

      const ptok = await api("tokens", {
        "person[first_name]": "Catalina", "person[last_name]": "Cero",
        "person[dob][day]": "1", "person[dob][month]": "1", "person[dob][year]": "1901",
        "person[address][line1]": "address_full_match", "person[address][city]": "Ciudad de México",
        "person[address][state]": "CMX", "person[address][postal_code]": "06700", "person[address][country]": "MX",
        "person[id_number]": "000000000", "person[phone]": "+525555555555", "person[email]": "catalina@example.com",
        "person[relationship][representative]": "true", "person[relationship][executive]": "true",
        "person[relationship][owner]": "true", "person[relationship][percent_ownership]": "100",
        "person[relationship][title]": "Directora general",
      });
      await api(`accounts/${acct.id}/persons`, { person_token: ptok.id as string });

      const btok = await api("tokens", {
        "bank_account[country]": "MX", "bank_account[currency]": "mxn",
        "bank_account[account_number]": "000000001234567897",
        "bank_account[account_holder_name]": "Operadora Cero SA de CV",
        "bank_account[account_holder_type]": "company",
      });
      await api(`accounts/${acct.id}`, { external_account: btok.id as string });

      const a = await api(`accounts/${acct.id}`);
      const pend = pendientesNuestros(a.requirements);
      expect(pend, `Stripe sigue pidiendo: ${pend.join(", ")}`).toEqual([]);
    },
    60_000,
  );
});
