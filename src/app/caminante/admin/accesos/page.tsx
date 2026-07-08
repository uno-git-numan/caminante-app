// Accesos — solicitudes de OPERADOR (whitelist). Las pendientes
// (is_active=false) se aprueban aquí (→ pasan a admin) o se rechazan; abajo, la
// lista de operadores activos (solo lectura). Refleja el modelo: el rol se
// deriva del whitelist; esta es la ÚNICA vía para conceder acceso al panel.
import AdminShell from "../ui/AdminShell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import AccesoCard from "./AccesoCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Accesos · Admin" };

type Row = { email: string; is_active: boolean; note: string | null; created_at: string };

function nombreDeNota(note: string | null): string {
  const m = /solicitud operador:\s*(.+)/i.exec(note || "");
  return m ? m[1].trim() : "";
}

export default async function AccesosPage() {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("admin_whitelist")
    .select("email, is_active, note, created_at")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as Row[];
  const pendientes = rows.filter((r) => !r.is_active);
  const activos = rows.filter((r) => r.is_active);

  return (
    <AdminShell active="accesos">
      <div className="sec-head">
        <span className="eyebrow"><span className="sl">{"//"}</span> Accesos</span>
        <h1 className="display">Operadores del panel</h1>
        <p className="subtitle">
          Quien se registra como <b>operador</b> queda aquí en espera. Aprobar le da acceso al panel
          (crear/editar experiencias, cobrar, gestionar). El acceso al panel <b>nunca</b> es automático:
          se concede solo desde aquí.
        </p>
      </div>

      {pendientes.length === 0 ? (
        <div className="empty">Sin solicitudes de acceso pendientes.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {pendientes.map((r) => (
            <AccesoCard key={r.email} email={r.email} nombre={nombreDeNota(r.note)} />
          ))}
        </div>
      )}

      <div className="sec-head" style={{ marginTop: 34 }}>
        <span className="eyebrow"><span className="sl">{"//"}</span> Operadores activos</span>
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Correo</th>
                <th>Nota</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {activos.map((r) => (
                <tr key={r.email}>
                  <td style={{ fontWeight: 500 }}>{r.email}</td>
                  <td className="mut">{r.note || "—"}</td>
                  <td><span className="chip c-paid">Activo</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mut" style={{ fontSize: 12.5, marginTop: 10 }}>
        Para quitarle el acceso a alguien, desactívalo en Supabase (admin_whitelist · is_active=false).
      </p>
    </AdminShell>
  );
}
