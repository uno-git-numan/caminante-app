// LA CUOTA DE ADMISIÓN (admision.ts). Luis, 11 nov 2026: los MX$20 que Stripe
// cobra por cuenta conectada se le descuentan a la operadora del primer pago
// que se le manda, UNA sola vez. Estas pruebas fijan el «una sola vez», el
// reintento y que nunca tumba el pago.
import { describe, expect, it } from "vitest";
import {
  ADMISION_MXN,
  CONCEPTO_ADMISION,
  admisionDescontada,
  centavos,
  cobrarAdmisionSiToca,
  pendienteAbandonada,
  type FilaAdmision,
} from "@/lib/operadores/admision";

// ── Una base en memoria con lo justo del cliente de Supabase ────────────────
type Fila = Record<string, unknown>;
function baseFalsa(opts: { sinTabla?: boolean; inicial?: Fila[] } = {}) {
  const filas: Fila[] = [...(opts.inicial ?? [])];
  const err = (code: string, message = code) => ({ code, message });
  const tabla = {
    select() {
      const filtros: [string, unknown][] = [];
      const q = {
        eq(c: string, v: unknown) {
          filtros.push([c, v]);
          return q;
        },
        async maybeSingle() {
          if (opts.sinTabla) return { data: null, error: err("PGRST205") };
          const f = filas.find((r) => filtros.every(([c, v]) => r[c] === v));
          return { data: f ?? null, error: null };
        },
      };
      return q;
    },
    async insert(row: Fila) {
      if (opts.sinTabla) return { error: err("PGRST205") };
      if (filas.some((r) => r.operator_id === row.operator_id)) return { error: err("23505") };
      filas.push({ ...row });
      return { error: null };
    },
    update(cambios: Fila) {
      const filtros: [string, unknown][] = [];
      const aplicar = () => {
        const tocadas = filas.filter((r) => filtros.every(([c, v]) => r[c] === v));
        tocadas.forEach((r) => Object.assign(r, cambios));
        return tocadas;
      };
      const q = {
        eq(c: string, v: unknown) {
          filtros.push([c, v]);
          return q;
        },
        async select() {
          return { data: aplicar().map((r) => ({ operator_id: r.operator_id })), error: null };
        },
        then(res: (v: { error: null }) => void) {
          aplicar();
          res({ error: null });
        },
      };
      return q;
    },
  };
  return { sb: { from: () => tabla } as never, filas };
}

function stripeFalso(opts: { falla?: string; previas?: { id: string; metadata: Record<string, string> }[] } = {}) {
  const llamadas: { transfer: string; amount: number; key?: string }[] = [];
  const stripe = {
    transfers: {
      async createReversal(transfer: string, p: { amount: number }, o?: { idempotencyKey?: string }) {
        if (opts.falla) throw new Error(opts.falla);
        llamadas.push({ transfer, amount: p.amount, key: o?.idempotencyKey });
        return { id: `trr_${llamadas.length}` };
      },
      async listReversals() {
        return { data: opts.previas ?? [] };
      },
    },
  } as never;
  return { stripe, llamadas };
}

const venta = { operatorId: "op-1", paymentId: "pay-1", transferId: "tr_1" };
const ahora = new Date("2026-11-11T21:00:00Z");

describe("cobrarAdmisionSiToca", () => {
  it("primera venta por Connect ⇒ revierte $20 de su transferencia y la marca cobrada", async () => {
    const { sb, filas } = baseFalsa();
    const { stripe, llamadas } = stripeFalso();
    const r = await cobrarAdmisionSiToca(sb, stripe, venta, ahora);
    expect(r).toEqual({ resultado: "cobrada", reversalId: "trr_1" });
    expect(llamadas).toEqual([{ transfer: "tr_1", amount: 2000, key: "admision-op-1-tr_1" }]);
    expect(filas[0]).toMatchObject({ estado: "cobrada", reversal_id: "trr_1", monto_mxn: ADMISION_MXN });
  });

  it("segunda venta ⇒ no vuelve a cobrar", async () => {
    const { sb } = baseFalsa();
    const { stripe, llamadas } = stripeFalso();
    await cobrarAdmisionSiToca(sb, stripe, venta, ahora);
    const r = await cobrarAdmisionSiToca(sb, stripe, { ...venta, paymentId: "pay-2", transferId: "tr_2" }, ahora);
    expect(r).toEqual({ resultado: "ya_cobrada" });
    expect(llamadas).toHaveLength(1);
  });

  it("dos ventas al mismo tiempo ⇒ la PK deja cobrar a una sola", async () => {
    const { sb } = baseFalsa({
      inicial: [{ operator_id: "op-1", estado: "pendiente", monto_mxn: 20, transfer_id: "tr_0", updated_at: ahora.toISOString() }],
    });
    const { stripe, llamadas } = stripeFalso();
    const r = await cobrarAdmisionSiToca(sb, stripe, venta, ahora);
    expect(r).toEqual({ resultado: "ocupada" });
    expect(llamadas).toHaveLength(0);
  });

  it("Stripe la rechaza ⇒ queda fallida con el error, sin lanzar", async () => {
    const { sb, filas } = baseFalsa();
    const { stripe } = stripeFalso({ falla: "Insufficient funds" });
    const r = await cobrarAdmisionSiToca(sb, stripe, venta, ahora);
    expect(r).toEqual({ resultado: "fallida", error: "Insufficient funds" });
    expect(filas[0]).toMatchObject({ estado: "fallida", error: "Insufficient funds" });
  });

  it("una fallida ⇒ la siguiente venta la reintenta con SU transferencia", async () => {
    const { sb, filas } = baseFalsa({
      inicial: [{ operator_id: "op-1", estado: "fallida", monto_mxn: 20, transfer_id: "tr_0", updated_at: "2026-11-10T00:00:00Z" }],
    });
    const { stripe, llamadas } = stripeFalso();
    const r = await cobrarAdmisionSiToca(sb, stripe, { ...venta, transferId: "tr_9" }, ahora);
    expect(r.resultado).toBe("cobrada");
    expect(llamadas[0].transfer).toBe("tr_9");
    expect(filas[0].estado).toBe("cobrada");
  });

  it("una pendiente abandonada que SÍ llegó a Stripe ⇒ se reconoce, no se cobra dos veces", async () => {
    const { sb, filas } = baseFalsa({
      inicial: [{ operator_id: "op-1", estado: "pendiente", monto_mxn: 20, transfer_id: "tr_0", updated_at: "2026-11-11T18:00:00Z" }],
    });
    const { stripe, llamadas } = stripeFalso({ previas: [{ id: "trr_viejo", metadata: { concepto: CONCEPTO_ADMISION } }] });
    const r = await cobrarAdmisionSiToca(sb, stripe, { ...venta, transferId: "tr_9" }, ahora);
    expect(r).toEqual({ resultado: "ya_cobrada" });
    expect(llamadas).toHaveLength(0);
    expect(filas[0]).toMatchObject({ estado: "cobrada", reversal_id: "trr_viejo" });
  });

  it("sin la 0078 aplicada ⇒ no cobra y lo dice", async () => {
    const { sb } = baseFalsa({ sinTabla: true });
    const { stripe, llamadas } = stripeFalso();
    expect(await cobrarAdmisionSiToca(sb, stripe, venta, ahora)).toEqual({ resultado: "sin_tabla" });
    expect(llamadas).toHaveLength(0);
  });

  it("sin transferencia (no fue cargo con destino) ⇒ nada", async () => {
    const { sb } = baseFalsa();
    const { stripe } = stripeFalso();
    expect(await cobrarAdmisionSiToca(sb, stripe, { ...venta, transferId: null }, ahora)).toEqual({ resultado: "sin_datos" });
  });
});

describe("admisionDescontada", () => {
  it("sólo la cobrada se resta de lo que recibe", () => {
    expect(admisionDescontada({ estado: "cobrada", monto_mxn: "20.00" })).toBe(20);
    expect(admisionDescontada({ estado: "pendiente", monto_mxn: 20 })).toBe(0);
    expect(admisionDescontada({ estado: "fallida", monto_mxn: 20 })).toBe(0);
    expect(admisionDescontada(null)).toBe(0);
  });
});

describe("pendienteAbandonada / centavos", () => {
  const f = (updated_at: string): Pick<FilaAdmision, "estado" | "updated_at"> => ({ estado: "pendiente", updated_at });
  it("una hora sin moverse ⇒ abandonada", () => {
    expect(pendienteAbandonada(f("2026-11-11T19:59:00Z"), ahora)).toBe(true);
    expect(pendienteAbandonada(f("2026-11-11T20:30:00Z"), ahora)).toBe(false);
  });
  it("$20 son 2000 centavos", () => {
    expect(centavos(ADMISION_MXN)).toBe(2000);
  });
});
