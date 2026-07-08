import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ADMIN_CSS } from "./admin-css";

// Shell del dashboard de admin (diseño Claude Design jul 2026). Server
// component: inyecta el CSS scopeado (.adm), el header sticky con la marca y
// el nav de secciones, y el script de expandibles (delegación de clicks sobre
// [data-x] — sin client components, mismo patrón del HTML original).

const G1 =
  '<g class="g1"><path d="M14.64,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64S0,96.44,0,104.52s6.56,14.64,14.64,14.64"/><path d="M102.08,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M91.72,114.57L4.29,27.44C-1.43,21.73-1.43,12.46,4.29,6.74c5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
const G2 =
  '<g class="g2"><path d="M218.65,2.3c-8.09,0-14.64,6.56-14.64,14.64s6.56,14.64,14.64,14.64,14.64-6.56,14.64-14.64-6.56-14.64-14.64-14.64"/><path d="M276.91,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/><path d="M189.47,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/></g>';
const G3 =
  '<g class="g3"><path d="M335.23,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M422.67,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M412.31,114.57l-87.43-87.13c-5.72-5.72-5.72-14.99,0-20.71,5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
const MARK = `<svg viewBox="0 0 437.31 121.74" role="img" aria-label="Caminante">${G1}${G2}${G3}</svg>`;

// Expandibles: ningún número es un callejón sin salida. Delegación global —
// ignora clicks en controles interactivos para no pelearse con forms/links.
const TOGGLE_JS = `
document.addEventListener('click',function(e){
  var pr=e.target.closest('[data-print]');
  if(pr){window.print();return;}
  if(e.target.closest('button, a, input, select, textarea')) return;
  var h=e.target.closest('[data-x]');
  if(!h) return;
  var body=document.getElementById(h.dataset.x);
  if(!body) return;
  var on=body.classList.toggle('on');
  h.classList.toggle('open',on);
});
`;

export type AdminSection =
  | "panorama"
  | "eventos"
  | "solicitudes"
  | "accesos"
  | "reservas"
  | "personas"
  | "dinero"
  | "encuesta";

// Al lanzar cada fase, se cambia soon→href. No enlaza el marketplace dormido.
const items: { key: AdminSection; label: string; href?: string; soon?: boolean }[] = [
  { key: "panorama", label: "Panorama", href: "/caminante/admin" },
  { key: "eventos", label: "Eventos", href: "/caminante/admin/eventos" },
  { key: "solicitudes", label: "Solicitudes", href: "/caminante/admin/solicitudes" },
  { key: "accesos", label: "Accesos", href: "/caminante/admin/accesos" },
  { key: "reservas", label: "Reservas", href: "/caminante/admin/reservas" },
  { key: "personas", label: "Personas", href: "/caminante/admin/personas" },
  { key: "dinero", label: "Dinero", href: "/caminante/admin/dinero" },
  { key: "encuesta", label: "Encuesta", href: "/caminante/admin/encuesta" },
];

// Solicitudes de fecha sin resolver → badge en el nav. Best-effort: si la
// consulta falla, el nav sale sin badge (jamás rompe una página del admin).
async function pendientesSolicitudes(): Promise<number> {
  try {
    const sb = createSupabaseAdminClient();
    const { count } = await sb
      .from("slot_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");
    return count ?? 0;
  } catch {
    return 0;
  }
}

// Solicitudes de acceso de operador (whitelist is_active=false) → badge.
async function pendientesAccesos(): Promise<number> {
  try {
    const sb = createSupabaseAdminClient();
    const { count } = await sb
      .from("admin_whitelist")
      .select("email", { count: "exact", head: true })
      .eq("is_active", false);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function AdminShell({
  active,
  children,
}: {
  active: AdminSection;
  children: React.ReactNode;
}) {
  const [pendientes, accesos] = await Promise.all([pendientesSolicitudes(), pendientesAccesos()]);
  const badgeDe = (key: AdminSection): number =>
    key === "solicitudes" ? pendientes : key === "accesos" ? accesos : 0;
  return (
    <div className="adm">
      <style dangerouslySetInnerHTML={{ __html: ADMIN_CSS }} />
      <header className="ahead">
        <div className="top">
          <div className="brand">
            <Link
              href="/caminante"
              className="logo"
              aria-label="Caminante — inicio"
              dangerouslySetInnerHTML={{ __html: MARK }}
            />
            <span className="mode">Modo admin</span>
          </div>
          <div className="qa">
            <Link href="/caminante/admin/cobro" className="btn btn-glass btn-sm">
              Generar cobro
            </Link>
            <Link href="/caminante/admin/experiencias/nueva" className="btn btn-orange btn-sm">
              + Experiencia
            </Link>
            <form action={signOut}>
              <button type="submit" className="btn btn-glass btn-sm" title="Cerrar sesión">
                Salir
              </button>
            </form>
          </div>
        </div>
        <nav className="nav">
          {items.map((it) =>
            it.href ? (
              <Link key={it.key} href={it.href} className={active === it.key ? "on" : ""}>
                {it.label}
                {badgeDe(it.key) > 0 ? (
                  <span
                    style={{
                      marginLeft: 7,
                      background: "#ff5d36",
                      color: "#fff",
                      borderRadius: 999,
                      padding: "1px 7px",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {badgeDe(it.key)}
                  </span>
                ) : null}
              </Link>
            ) : (
              <span key={it.key} className="soon" title="Pronto">
                {it.label}
              </span>
            ),
          )}
        </nav>
      </header>
      <div className="page">{children}</div>
      <script dangerouslySetInnerHTML={{ __html: TOGGLE_JS }} />
    </div>
  );
}
