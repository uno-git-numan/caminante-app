// Autofactura pública. Cuatro estados según los params:
//   ok=1         → CFDI timbrado: descarga de XML/PDF.
//   p + t válido → formulario fiscal para ESE pago.
//   email+monto  → lookup: encuentra el pago facturable y muestra el formulario.
//   (nada)       → formulario de búsqueda (correo + monto).
// Diseño provisional con los tokens de marca (lagoon/olive/forest/cream/sand);
// se puede re-skinnear con Claude Design sin tocar la lógica.
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { facturacionActiva } from "@/lib/facturacion/facturapi";
import { firmarPago, tokenValido } from "@/lib/facturacion/token";
import FacturacionForm from "./FacturacionForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Factura tu experiencia · Caminante" };

function parseMonto(raw: string): number | null {
  const n = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <section className="mx-auto w-full max-w-xl px-6 py-14 sm:py-16">{children}</section>;
}

export default async function FacturacionPage({
  searchParams,
}: {
  searchParams: Promise<{
    p?: string;
    t?: string;
    ok?: string;
    error?: string;
    email?: string;
    monto?: string;
  }>;
}) {
  const sp = await searchParams;
  const errorMsg = sp.error || "";

  if (!facturacionActiva()) {
    return (
      <Shell>
        <h1 className="text-3xl font-semibold tracking-tight text-lagoon">Facturación</h1>
        <p className="mt-4 text-sm leading-relaxed text-olive">
          La facturación electrónica estará disponible muy pronto. Si necesitas tu CFDI ahora,
          escríbenos y con gusto lo emitimos a mano.
        </p>
        <Link href="/caminante" className="mt-8 inline-block text-sm font-semibold text-forest underline">
          Volver a Caminante
        </Link>
      </Shell>
    );
  }

  const sb = createSupabaseAdminClient();

  // ── Estado ÉXITO: CFDI ya timbrado ──────────────────────────────────────────
  if (sp.ok === "1" && sp.p && sp.t && tokenValido(sp.p, sp.t)) {
    const { data: inv } = await sb
      .from("cfdi_invoices")
      .select("uuid_cfdi, xml_url, pdf_url, total_mxn, email")
      .eq("payment_id", sp.p)
      .eq("status", "stamped")
      .maybeSingle();
    let xmlUrl: string | null = null;
    let pdfUrl: string | null = null;
    if (inv?.xml_url) {
      const { data } = await sb.storage.from("cfdi").createSignedUrl(inv.xml_url as string, 3600);
      xmlUrl = data?.signedUrl ?? null;
    }
    if (inv?.pdf_url) {
      const { data } = await sb.storage.from("cfdi").createSignedUrl(inv.pdf_url as string, 3600);
      pdfUrl = data?.signedUrl ?? null;
    }
    return (
      <Shell>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forest/15">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 13l4 4L19 7" stroke="#5A7A4E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-lagoon">¡Tu factura está lista!</h1>
        <p className="mt-3 text-sm leading-relaxed text-olive">
          Timbramos tu CFDI y lo enviamos a <span className="font-semibold">{inv?.email}</span>. También
          puedes descargarlo aquí.
        </p>
        {inv?.uuid_cfdi ? (
          <p className="mt-2 text-xs text-olive/70">Folio fiscal: {inv.uuid_cfdi}</p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {pdfUrl ? (
            <a
              href={pdfUrl}
              className="rounded-xl bg-lagoon px-6 py-3 text-center text-sm font-semibold text-cream transition hover:bg-dune"
            >
              Descargar PDF
            </a>
          ) : null}
          {xmlUrl ? (
            <a
              href={xmlUrl}
              className="rounded-xl border border-sand px-6 py-3 text-center text-sm font-semibold text-lagoon transition hover:border-dune"
            >
              Descargar XML
            </a>
          ) : null}
        </div>
        <Link href="/caminante" className="mt-8 inline-block text-sm font-semibold text-forest underline">
          Volver a Caminante
        </Link>
      </Shell>
    );
  }

  // ── Resolver el pago a facturar ─────────────────────────────────────────────
  // (a) por token firmado (desde la pantalla de éxito), o (b) por lookup correo+monto.
  let paymentId: string | null = null;
  let token: string | null = null;
  let noEncontrado = false;

  if (sp.p && sp.t && tokenValido(sp.p, sp.t)) {
    paymentId = sp.p;
    token = sp.t;
  } else if (sp.email && sp.monto) {
    const monto = parseMonto(sp.monto);
    const email = sp.email.trim().toLowerCase();
    if (monto && email.includes("@")) {
      const { data: contact } = await sb
        .from("contacts")
        .select("id")
        .ilike("email", email)
        .maybeSingle();
      if (contact) {
        const { data: pays } = await sb
          .from("payments")
          .select("id, amount_mxn")
          .eq("contact_id", contact.id)
          .eq("status", "paid")
          .eq("status_cfdi", "por-emitir")
          .order("paid_at", { ascending: false });
        const match = (pays ?? []).find((p) => Math.round(Number(p.amount_mxn)) === Math.round(monto));
        if (match) {
          paymentId = match.id as string;
          token = firmarPago(paymentId);
        }
      }
    }
    if (!paymentId) noEncontrado = true;
  }

  // ── Estado FORMULARIO FISCAL ────────────────────────────────────────────────
  if (paymentId && token) {
    const { data: pay } = await sb
      .from("payments")
      .select("amount_mxn, status, status_cfdi, contact_id")
      .eq("id", paymentId)
      .maybeSingle();
    if (!pay || pay.status !== "paid" || pay.status_cfdi !== "por-emitir") {
      return (
        <Shell>
          <h1 className="text-3xl font-semibold tracking-tight text-lagoon">Facturación</h1>
          <p className="mt-4 text-sm leading-relaxed text-olive">
            {pay?.status_cfdi === "emitido"
              ? "Este pago ya fue facturado. Si no recibiste tu CFDI, escríbenos."
              : "No pudimos preparar la factura de ese pago. Escríbenos y lo resolvemos."}
          </p>
          <Link href="/caminante/facturacion" className="mt-8 inline-block text-sm font-semibold text-forest underline">
            Buscar otro pago
          </Link>
        </Shell>
      );
    }
    // Prefill del correo desde el contacto (editable).
    let emailPrefill = "";
    if (pay.contact_id) {
      const { data: c } = await sb.from("contacts").select("email").eq("id", pay.contact_id).maybeSingle();
      emailPrefill = (c?.email as string | null) ?? "";
    }
    return (
      <Shell>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-forest">// Factura tu experiencia</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-lagoon">Tus datos fiscales</h1>
        <p className="mt-3 text-sm leading-relaxed text-olive">
          Monto a facturar: <span className="font-semibold">${Number(pay.amount_mxn).toLocaleString("es-MX")} MXN</span>{" "}
          (IVA 16% incluido). Escribe tu razón social <span className="font-semibold">tal como está ante el SAT</span>.
        </p>
        <FacturacionForm
          paymentId={paymentId}
          token={token}
          emailPrefill={emailPrefill}
          error={errorMsg}
        />
      </Shell>
    );
  }

  // ── Estado BÚSQUEDA (correo + monto) ────────────────────────────────────────
  return (
    <Shell>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-forest">// Factura tu experiencia</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-lagoon">Factura tu pago</h1>
      <p className="mt-3 text-sm leading-relaxed text-olive">
        Escribe el correo con el que reservaste y el monto exacto que pagaste. Encontramos tu pago y te
        pedimos tus datos fiscales para emitir el CFDI.
      </p>
      {noEncontrado ? (
        <p className="mt-4 rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-700">
          No encontramos un pago facturable con esos datos. Revisa el correo y el monto exacto, o escríbenos.
        </p>
      ) : null}
      <form method="get" className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-olive">Correo de tu reserva</span>
          <input
            type="email"
            name="email"
            required
            defaultValue={sp.email || ""}
            className="rounded-xl border border-sand bg-white px-4 py-3 text-sm text-lagoon outline-none focus:border-dune"
            placeholder="tucorreo@ejemplo.com"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-olive">Monto que pagaste (MXN)</span>
          <input
            type="text"
            name="monto"
            required
            inputMode="decimal"
            defaultValue={sp.monto || ""}
            className="rounded-xl border border-sand bg-white px-4 py-3 text-sm text-lagoon outline-none focus:border-dune"
            placeholder="2550"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-xl bg-lagoon px-6 py-3 text-sm font-semibold text-cream transition hover:bg-dune"
        >
          Buscar mi pago
        </button>
      </form>
      <Link href="/caminante" className="mt-8 inline-block text-sm font-semibold text-forest underline">
        Volver a Caminante
      </Link>
    </Shell>
  );
}
