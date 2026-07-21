// Vista de CALENDARIO mensual de la cola de redes: cada publicación cae en su
// fecha (programada → scheduled_at; publicada → published_at). Color por estado;
// las programadas se pueden cancelar desde su chip. Navegación mes anterior/siguiente.
import type { SocialPost } from "@/lib/social/posts";
import { cancelarPostForm } from "@/lib/social/publish-actions";
import { HORA_PUBLICACION_CORTA } from "@/lib/social/publish-hora";

const TZ = "America/Mexico_City";
const dayKey = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ }) : "";
const hora = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleTimeString("es-MX", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }) : "";

// Fecha "relevante" del post para ubicarlo en el calendario.
function postDate(p: SocialPost): string | null {
  if (p.status === "published") return p.publishedAt || p.scheduledAt || p.createdAt;
  return p.scheduledAt || p.publishedAt || p.createdAt;
}

const CHIPCLASS: Record<SocialPost["status"], string> = {
  scheduled: "k-sched",
  publishing: "k-ing",
  published: "k-pub",
  failed: "k-fail",
  canceled: "k-cancel",
};

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const CAL_CSS = `
.cal{margin-top:6px;}
.cal .nav{display:flex;align-items:center;gap:14px;margin-bottom:14px;}
.cal .nav .mlabel{font-size:18px;font-weight:500;min-width:190px;}
.cal .nav a{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:999px;border:1px solid rgba(32,33,28,.14);background:#f1eee7;color:#20211c;text-decoration:none;font-size:16px;}
.cal .nav a.today{width:auto;padding:0 14px;font-size:13px;font-weight:600;}
.cal .grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;}
.cal .dow{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8a8078;text-align:left;padding:2px 4px;}
.cal .cell{min-height:96px;border:1px solid rgba(32,33,28,.1);border-radius:10px;padding:6px 6px 8px;background:#fff;display:flex;flex-direction:column;gap:4px;}
.cal .cell.blank{background:transparent;border:none;}
.cal .cell.today{border-color:#ff5d36;box-shadow:0 0 0 1px #ff5d36 inset;}
.cal .dn{font-size:12px;color:rgba(32,33,28,.55);font-weight:600;}
.cal .cell.today .dn{color:#ff5d36;}
.cal .pchip{display:flex;align-items:center;gap:5px;border-radius:7px;padding:3px 6px;font-size:11px;font-weight:600;line-height:1.15;color:#20211c;text-decoration:none;}
.cal .pchip .x{margin-left:auto;border:none;background:transparent;cursor:pointer;font-size:12px;color:inherit;opacity:.6;padding:0 2px;font-family:inherit;}
.cal .pchip .x:hover{opacity:1;}
.cal .k-sched{background:rgba(201,183,156,.32);color:#7a5e2e;}
.cal .k-ing{background:rgba(60,120,200,.16);color:#2f5c96;}
.cal .k-pub{background:rgba(99,113,84,.18);color:#46543a;}
.cal .k-fail{background:rgba(255,93,54,.14);color:#b0341a;}
.cal .k-cancel{background:rgba(32,33,28,.08);color:#6b6b63;text-decoration:line-through;}
.cal .legend{display:flex;gap:14px;flex-wrap:wrap;margin-top:16px;font-size:12px;color:#6b6b63;}
.cal .legend span{display:inline-flex;align-items:center;gap:6px;}
.cal .dot{width:10px;height:10px;border-radius:3px;display:inline-block;}
@media(max-width:720px){.cal .cell{min-height:70px;}.cal .pchip{font-size:10px;}}
`;

function shiftMonth(y: number, m: number, delta: number): string {
  const idx = (y * 12 + (m - 1)) + delta;
  const ny = Math.floor(idx / 12);
  const nm = (idx % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

export default function ColaCalendar({ posts, monthParam }: { posts: SocialPost[]; monthParam: string }) {
  const [ys, ms] = monthParam.split("-");
  const y = Number(ys);
  const m = Number(ms); // 1-12
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const firstSun0 = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); // 0=Dom
  const lead = (firstSun0 + 6) % 7; // Lunes-primero
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: TZ });

  // Agrupar posts por día (clave YYYY-MM-DD en CDMX).
  const byDay = new Map<string, SocialPost[]>();
  for (const p of posts) {
    const k = dayKey(postDate(p));
    if (!k) continue;
    (byDay.get(k) ?? byDay.set(k, []).get(k)!).push(p);
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="cal">
      <style dangerouslySetInnerHTML={{ __html: CAL_CSS }} />
      <div className="nav">
        <a href={`?m=${shiftMonth(y, m, -1)}`} aria-label="Mes anterior">‹</a>
        <span className="mlabel">{MESES[m - 1]} {y}</span>
        <a href={`?m=${shiftMonth(y, m, 1)}`} aria-label="Mes siguiente">›</a>
        <a className="today" href="?">Hoy</a>
      </div>

      <div className="grid">
        {DOW.map((d) => <div key={d} className="dow">{d}</div>)}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="cell blank" />;
          const key = `${ys}-${ms.padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const dayPosts = byDay.get(key) ?? [];
          return (
            <div key={i} className={`cell${key === todayKey ? " today" : ""}`}>
              <div className="dn">{d}</div>
              {dayPosts.map((p) => {
                // Publicada: hora real de published_at. Programada (y demás): la
                // hora guardada es la normalizada (≈02:00) que solo marca el día
                // → mostramos la hora REAL del cron (~1pm), no la que engaña.
                const t = p.status === "published" ? hora(postDate(p)) : HORA_PUBLICACION_CORTA;
                const label = `${p.pieceId ? p.pieceId + " " : ""}${t}`;
                const inner = (
                  <>
                    <span>{label}</span>
                    {p.status === "scheduled" ? (
                      <form action={cancelarPostForm} style={{ marginLeft: "auto", display: "inline" }}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="x" title="Cancelar programada">✕</button>
                      </form>
                    ) : null}
                  </>
                );
                return p.igPermalink ? (
                  <a key={p.id} className={`pchip ${CHIPCLASS[p.status]}`} href={p.igPermalink} target="_blank" rel="noreferrer" title={p.caption || p.experienceSlug || ""}>{inner}</a>
                ) : (
                  <span key={p.id} className={`pchip ${CHIPCLASS[p.status]}`} title={p.caption || p.experienceSlug || ""}>{inner}</span>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="legend">
        <span><i className="dot k-sched" /> Programada</span>
        <span><i className="dot k-pub" /> Publicada</span>
        <span><i className="dot k-fail" /> Falló</span>
        <span><i className="dot k-cancel" /> Cancelada</span>
      </div>
    </div>
  );
}
