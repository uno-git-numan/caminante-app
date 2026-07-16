// Barra de material del Kit: UNIFICA la descarga del flyer desde el mismo deck
// (PDF vertical, PDF horizontal, Flyer para redes) en un solo menú, + acceso al
// calendario de redes. Antes estaban como botones sueltos en Eventos. Server
// component: solo links (sin JS); el menú es <details>.
const CSS = `
.kt .ktools{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 22px;}
.kt .matmenu{position:relative;}
.kt .matmenu>summary{list-style:none;cursor:pointer;}
.kt .matmenu>summary::-webkit-details-marker{display:none;}
.kt .matpop{position:absolute;z-index:20;top:calc(100% + 6px);left:0;min-width:220px;background:#fff;border:1px solid rgba(32,33,28,.14);border-radius:12px;box-shadow:0 18px 40px -20px rgba(0,0,0,.4);padding:6px;display:flex;flex-direction:column;}
.kt .matpop a{padding:9px 12px;border-radius:8px;font-size:13.5px;font-weight:500;color:#20211c;text-decoration:none;display:flex;align-items:center;gap:8px;}
.kt .matpop a:hover{background:#f1eee7;}
.kt .matpop .sub{font-size:11px;color:#8a8078;font-weight:400;padding:6px 12px 2px;letter-spacing:.04em;text-transform:uppercase;}
`;

export default function KitToolbar({ slug }: { slug: string }) {
  return (
    <div className="ktools">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <details className="matmenu">
        <summary className="btn btn-glass btn-sm">⬇ Descargar material ▾</summary>
        <div className="matpop">
          <div className="sub">Flyer (PDF)</div>
          <a href={`/caminante/admin/print/${slug}?o=v`} target="_blank" rel="noreferrer">📄 PDF vertical</a>
          <a href={`/caminante/admin/print/${slug}?o=h`} target="_blank" rel="noreferrer">📄 PDF horizontal</a>
          <div className="sub">Redes</div>
          <a href={`/caminante/admin/social/${slug}`} target="_blank" rel="noreferrer">🖼 Flyer para redes (PNG 4:5)</a>
        </div>
      </details>
      <a className="btn btn-glass btn-sm" href="/caminante/admin/social-cola">🗓 Calendario de redes</a>
    </div>
  );
}
