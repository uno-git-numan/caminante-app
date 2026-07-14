// Facturación — panel admin (F3). Solo lectura + descargas: los CFDI se timbran
// en la autofactura pública del cliente (/caminante/facturacion) o, al cierre de
// mes, en el global "público en general" (pendiente). Aquí el admin ve qué está
// emitido y qué sigue por-emitir, y baja los XML/PDF.
import AdminShell from "../ui/AdminShell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { facturacionActiva } from "@/lib/facturacion/facturapi";
import { reenviarCFDI } from "@/lib/facturacion/admin-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Facturación · Admin" };

type Inv = {
  id: string;
  rfc: string;
  razon_social: string;
  uuid_cfdi: string | null;
  total_mxn: number;
  email: string;
  xml_url: string | null;
  pdf_url: string | null;
  stamped_at: string | null;
};
type PorEmitir = { amount_mxn: number; paid_at: string | null; contact_id: string | null };

const money = (n: number) => "$" + Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const fecha = (s: string | null) => (s ? new Date(s).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default async function FacturacionAdminPage() {
  const activa = facturacionActiva();
  let emitidos: Inv[] = [];
  let porEmitir: PorEmitir[] = [];
  let signed: Record<string, { xml?: string; pdf?: string }> = {};
  let tablaLista = true;

  try {
    const sb = createSupabaseAdminClient();
    const { data: invs, error } = await sb
      .from("cfdi_invoices")
      .select("id, rfc, razon_social, uuid_cfdi, total_mxn, email, xml_url, pdf_url, stamped_at")
      .eq("status", "stamped")
      .order("stamped_at", { ascending: false });
    if (error) throw error;
    emitidos = (invs ?? []) as Inv[];

    const { data: pend } = await sb
      .from("payments")
      .select("amount_mxn, paid_at, contact_id")
      .eq("status", "paid")
      .eq("status_cfdi", "por-emitir")
      .order("paid_at", { ascending: false });
    porEmitir = (pend ?? []) as PorEmitir[];

    // Signed URLs para descargar los pares XML/PDF (bucket privado).
    signed = Object.fromEntries(
      await Promise.all(
        emitidos.map(async (inv) => {
          const out: { xml?: string; pdf?: string } = {};
          if (inv.xml_url) {
            const { data } = await sb.storage.from("cfdi").createSignedUrl(inv.xml_url, 3600);
            if (data?.signedUrl) out.xml = data.signedUrl;
          }
          if (inv.pdf_url) {
            const { data } = await sb.storage.from("cfdi").createSignedUrl(inv.pdf_url, 3600);
            if (data?.signedUrl) out.pdf = data.signedUrl;
          }
          return [inv.id, out] as const;
        }),
      ),
    );
  } catch {
    // La migración 0019 aún no está aplicada → panel vacío con aviso.
    tablaLista = false;
  }

  const totalEmitido = emitidos.reduce((n, i) => n + Number(i.total_mxn || 0), 0);
  const totalPorEmitir = porEmitir.reduce((n, p) => n + Number(p.amount_mxn || 0), 0);

  return (
    <AdminShell active="dinero">
      <div style={{ marginBottom: 14 }}>
        <a href="/caminante/admin/dinero" className="mut" style={{ fontSize: 13, textDecoration: "none" }}>
          ← Dinero
        </a>
      </div>
      <div className="sec-head">
        <span className="eyebrow"><span className="sl">{"//"}</span> Facturación</span>
        <h1 className="display">CFDI de ingresos</h1>
        <p className="subtitle">
          Los clientes facturan solos en <b>caminante.numanhub.com/caminante/facturacion</b> (con su correo y
          el monto que pagaron). Aquí ves lo emitido y lo que sigue por-emitir, y descargas los XML/PDF.
        </p>
      </div>

      {!activa ? (
        <div className="empty" style={{ borderColor: "#ff5d36", color: "#a33" }}>
          Facturación aún <b>no activa</b>: falta la llave de Facturapi (<code>FACTURAPI_SECRET_KEY</code>) en el
          entorno. Mientras tanto los cobros quedan <b>por-emitir</b>.
        </div>
      ) : !tablaLista ? (
        <div className="empty">
          La tabla de facturas aún no existe — aplica la migración <b>0019_facturacion_cfdi.sql</b> en Supabase.
        </div>
      ) : null}

      {/* Resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginTop: 8 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="mut" style={{ fontSize: 12.5 }}>Emitidos</div>
          <div style={{ fontSize: 26, fontWeight: 600 }}>{emitidos.length}</div>
          <div className="mut" style={{ fontSize: 13 }}>{money(totalEmitido)}</div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="mut" style={{ fontSize: 12.5 }}>Por emitir (pagos cobrados sin CFDI)</div>
          <div style={{ fontSize: 26, fontWeight: 600 }}>{porEmitir.length}</div>
          <div className="mut" style={{ fontSize: 13 }}>{money(totalPorEmitir)}</div>
        </div>
      </div>

      {/* Emitidos */}
      <div className="sec-head" style={{ marginTop: 30 }}>
        <span className="eyebrow"><span className="sl">{"//"}</span> Emitidos</span>
      </div>
      {emitidos.length === 0 ? (
        <div className="empty">Todavía no hay CFDI emitidos.</div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th><th>RFC</th><th>Razón social</th><th>Folio fiscal</th>
                  <th style={{ textAlign: "right" }}>Total</th><th>Archivos</th><th></th>
                </tr>
              </thead>
              <tbody>
                {emitidos.map((inv) => (
                  <tr key={inv.id}>
                    <td className="mut">{fecha(inv.stamped_at)}</td>
                    <td style={{ fontWeight: 500 }}>{inv.rfc}</td>
                    <td>{inv.razon_social}</td>
                    <td className="mut" style={{ fontSize: 11.5, fontFamily: "monospace" }}>{inv.uuid_cfdi || "—"}</td>
                    <td style={{ textAlign: "right" }}>{money(inv.total_mxn)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {signed[inv.id]?.pdf ? <a href={signed[inv.id].pdf} style={{ color: "#4f5d44", fontWeight: 600, textDecoration: "underline" }}>PDF</a> : null}
                      {signed[inv.id]?.pdf && signed[inv.id]?.xml ? " · " : null}
                      {signed[inv.id]?.xml ? <a href={signed[inv.id].xml} style={{ color: "#4f5d44", fontWeight: 600, textDecoration: "underline" }}>XML</a> : null}
                    </td>
                    <td>
                      <form action={reenviarCFDI}>
                        <input type="hidden" name="invoiceId" value={inv.id} />
                        <button type="submit" className="btn btn-glass btn-sm" title={`Reenviar a ${inv.email}`}>
                          Reenviar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mut" style={{ fontSize: 12.5, marginTop: 14 }}>
        Al cierre de mes, lo que quede <b>por-emitir</b> se agrupa en un CFDI global a público en general
        (<code>XAXX010101000</code>) — ese paso se hará desde aquí en la siguiente fase.
      </p>
    </AdminShell>
  );
}
