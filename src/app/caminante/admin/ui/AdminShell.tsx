import Link from "next/link";
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
  | "reservas"
  | "personas"
  | "dinero"
  | "encuesta";

// Al lanzar cada fase, se cambia soon→href. No enlaza el marketplace dormido.
const items: { key: AdminSection; label: string; href?: string; soon?: boolean }[] = [
  { key: "panorama", label: "Panorama", href: "/caminante/admin" },
  { key: "eventos", label: "Eventos", soon: true },
  { key: "reservas", label: "Reservas", soon: true },
  { key: "personas", label: "Personas", soon: true },
  { key: "dinero", label: "Dinero", soon: true },
  { key: "encuesta", label: "Encuesta", soon: true },
];

export default function AdminShell({
  active,
  children,
}: {
  active: AdminSection;
  children: React.ReactNode;
}) {
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
          </div>
        </div>
        <nav className="nav">
          {items.map((it) =>
            it.href ? (
              <Link key={it.key} href={it.href} className={active === it.key ? "on" : ""}>
                {it.label}
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
