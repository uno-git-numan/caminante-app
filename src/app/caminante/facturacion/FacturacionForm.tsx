"use client";

// Formulario fiscal del receptor. Filtra los regímenes según la longitud del RFC
// (12 = moral, 13 = física) para no ofrecer opciones inválidas. Diseño provisional
// con tokens de marca — la lógica (catálogos + validación) es la que importa.
import { useMemo, useState } from "react";
import { emitirCFDI } from "@/lib/facturacion/actions";
import { REGIMENES, USOS_CFDI, USO_CFDI_DEFAULT } from "@/lib/facturacion/catalogos";

const inputCls =
  "rounded-xl border border-sand bg-white px-4 py-3 text-sm text-lagoon outline-none focus:border-dune";

export default function FacturacionForm({
  paymentId,
  token,
  emailPrefill,
  error,
}: {
  paymentId: string;
  token: string;
  emailPrefill: string;
  error?: string;
}) {
  const [rfc, setRfc] = useState("");

  const persona = useMemo<"fisica" | "moral" | null>(() => {
    const r = rfc.trim().toUpperCase();
    if (r.length === 13) return "fisica";
    if (r.length === 12) return "moral";
    return null;
  }, [rfc]);

  const regimenes = useMemo(
    () => REGIMENES.filter((x) => !persona || x.persona === "ambos" || x.persona === persona),
    [persona],
  );

  return (
    <form action={emitirCFDI} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="paymentId" value={paymentId} />
      <input type="hidden" name="token" value={token} />

      {error ? (
        <p className="rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-700">{error}</p>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-olive">RFC</span>
        <input
          name="rfc"
          required
          autoCapitalize="characters"
          maxLength={13}
          value={rfc}
          onChange={(e) => setRfc(e.target.value.toUpperCase())}
          className={inputCls}
          placeholder="XAXX010101000"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-olive">
          Razón social / nombre (como está en el SAT)
        </span>
        <input name="razonSocial" required className={inputCls} placeholder="Mi Empresa SA de CV" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-olive">Régimen fiscal</span>
          <select name="regimen" required className={inputCls} defaultValue="">
            <option value="" disabled>
              Elige tu régimen
            </option>
            {regimenes.map((r) => (
              <option key={r.clave} value={r.clave}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-olive">Código postal fiscal</span>
          <input
            name="cp"
            required
            inputMode="numeric"
            maxLength={5}
            className={inputCls}
            placeholder="11000"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-olive">Uso de CFDI</span>
        <select name="uso" required className={inputCls} defaultValue={USO_CFDI_DEFAULT}>
          {USOS_CFDI.map((u) => (
            <option key={u.clave} value={u.clave}>
              {u.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-olive">
          Correo para recibir el CFDI
        </span>
        <input
          type="email"
          name="email"
          required
          defaultValue={emailPrefill}
          className={inputCls}
          placeholder="tucorreo@ejemplo.com"
        />
      </label>

      <button
        type="submit"
        className="mt-2 rounded-xl bg-lagoon px-6 py-3 text-sm font-semibold text-cream transition hover:bg-dune"
      >
        Emitir mi factura
      </button>
      <p className="text-xs leading-relaxed text-olive/70">
        Al emitir, generamos tu CFDI 4.0 con IVA 16% desglosado y te lo enviamos por correo. Verifica que
        tus datos coincidan con tu Constancia de Situación Fiscal.
      </p>
    </form>
  );
}
