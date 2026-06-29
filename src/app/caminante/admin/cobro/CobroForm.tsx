"use client";

import { useState } from "react";
import { generarCobro, type CobroResult } from "@/lib/payments/cobro";

const inputCls =
  "mt-1 w-full rounded-lg border border-olive/30 bg-white px-3 py-2 text-sm text-lagoon " +
  "focus:border-dune focus:outline-none focus:ring-1 focus:ring-dune";

export default function CobroForm() {
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [numPeople, setNumPeople] = useState("1");
  const [slotId, setSlotId] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CobroResult | null>(null);
  const [copied, setCopied] = useState<"link" | "msg" | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setCopied(null);
    try {
      const res = await generarCobro({
        slug: slug.trim(),
        email: email.trim(),
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        numPeople: parseInt(numPeople, 10) || 1,
        slotId: slotId.trim() || null,
      });
      setResult(res);
    } catch (err) {
      setResult({ ok: false, error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  const money = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

  const waMessage =
    result?.ok
      ? `Hola${fullName ? " " + fullName.split(" ")[0] : ""} 🌊 Aquí está tu link para apartar tu lugar en Caminante (${money(result.amountMxn)}${parseInt(numPeople, 10) > 1 ? ` · ${numPeople} personas` : ""}):\n${result.url}\n\nEn cuanto se confirme el pago te mando el registro. Cualquier duda, aquí estoy.`
      : "";

  async function copy(text: string, which: "link" | "msg") {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm text-olive">
        Experiencia (slug)
        <input
          className={inputCls}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="ensenada-de-muertos"
          required
        />
      </label>

      <label className="block text-sm text-olive">
        Correo del cliente
        <input
          className={inputCls}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="cliente@correo.com"
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm text-olive">
          Nombre (opcional)
          <input
            className={inputCls}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ana López"
          />
        </label>
        <label className="block text-sm text-olive">
          WhatsApp (opcional)
          <input
            className={inputCls}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="55 1234 5678"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm text-olive">
          N.º de personas
          <input
            className={inputCls}
            type="number"
            min={1}
            value={numPeople}
            onChange={(e) => setNumPeople(e.target.value)}
          />
        </label>
        <label className="block text-sm text-olive">
          Slot / salida (opcional)
          <input
            className={inputCls}
            value={slotId}
            onChange={(e) => setSlotId(e.target.value)}
            placeholder="uuid de la salida"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-dune px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Generando…" : "Generar link de pago"}
      </button>

      {result && !result.ok && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{result.error}</p>
      )}

      {result?.ok && (
        <div className="space-y-3 rounded-lg border border-dune/30 bg-sand/40 p-4">
          <p className="text-sm text-lagoon">
            <span className="font-semibold">{money(result.amountMxn)}</span>
            {result.reused && <span className="ml-2 text-xs text-olive">(link existente)</span>}
          </p>
          <div className="flex items-center gap-2">
            <input className={inputCls + " mt-0 flex-1"} value={result.url} readOnly />
            <button
              type="button"
              onClick={() => copy(result.url, "link")}
              className="shrink-0 rounded-lg border border-dune px-3 py-2 text-sm text-dune"
            >
              {copied === "link" ? "✓" : "Copiar"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => copy(waMessage, "msg")}
            className="w-full rounded-lg bg-lagoon px-4 py-2 text-sm font-semibold text-white"
          >
            {copied === "msg" ? "✓ Mensaje copiado" : "Copiar mensaje para WhatsApp"}
          </button>
        </div>
      )}
    </form>
  );
}
