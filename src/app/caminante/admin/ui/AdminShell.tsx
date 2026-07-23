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

// Ícono de perfil para el acceso al perfil del operador (a la derecha del nav).
const PERSON_ICON =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';

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
  | "comunicacion"
  | "solicitudes"
  | "reservas"
  | "personas"
  | "dinero"
  | "operador"
  | "encuesta";

// Al lanzar cada fase, se cambia soon→href. No enlaza el marketplace dormido.
// Nav principal. "Accesos" se fundió en Solicitudes (solicitud operador +
// solicitud cliente) y "Facturación" se movió dentro de Dinero. "Operador" se
// renderiza aparte, a la derecha del nav con ícono de perfil.
const items: { key: AdminSection; label: string; href?: string; soon?: boolean }[] = [
  { key: "panorama", label: "Panorama", href: "/caminante/admin" },
  { key: "eventos", label: "Eventos", href: "/caminante/admin/eventos" },
  { key: "comunicacion", label: "Comunicación", href: "/caminante/admin/comunicacion" },
  { key: "solicitudes", label: "Solicitudes", href: "/caminante/admin/solicitudes" },
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

// Aplicaciones de EMBAJADOR pendientes → badge. Best-effort: si la tabla no
// existe todavía (0029 sin aplicar), cuenta 0 — jamás rompe el nav.
async function pendientesEmbajadores(): Promise<number> {
  try {
    const sb = createSupabaseAdminClient();
    const { count, error } = await sb
      .from("ambassador_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    if (error) return 0;
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
  const [pendientes, accesos, embajadores] = await Promise.all([
    pendientesSolicitudes(),
    pendientesAccesos(),
    pendientesEmbajadores(),
  ]);
  // Solicitudes agrupa operador (accesos) + cliente (fechas) + embajador → un solo badge.
  const badgeDe = (key: AdminSection): number =>
    key === "solicitudes" ? pendientes + accesos + embajadores : 0;
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
          {/* Perfil del operador: a la derecha del nav, con ícono de perfil. */}
          <Link
            href="/caminante/admin/operadores"
            className={active === "operador" ? "on" : ""}
            style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}
            title="Perfil del operador"
          >
            <span
              style={{ display: "inline-flex", alignItems: "center" }}
              dangerouslySetInnerHTML={{ __html: PERSON_ICON }}
            />
            Operador
          </Link>
        </nav>
      </header>
      <div className="page">{children}</div>
      <script dangerouslySetInnerHTML={{ __html: TOGGLE_JS }} />
    </div>
  );
}
