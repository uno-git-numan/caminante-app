import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AdminShell from "../../ui/AdminShell";
import OperadorSelect from "./OperadorSelect";
import ConfirmSubmit from "../../ui/ConfirmSubmit";
import { puedeEntrarAlPanel } from "@/lib/auth/authorization";
import { fetchFicha } from "@/lib/admin/catalogo";
import { fetchEventoDetalle, formatMXN } from "@/lib/admin/queries";
import {
  assignOperatorAction,
  createOperatorAction,
  setExperienceStatusAction,
  deleteExperienceAction,
} from "@/lib/admin/eventos-actions";

export const dynamic = "force-dynamic";

// LA FICHA DE UNA EXPERIENCIA — el expediente del producto.
//
// El catálogo contesta «¿cómo va?»; esto contesta «¿qué hago con ella?». Aquí
// viven tres cosas y nada más: la información del producto, sus fotos y su
// comunicación. Los grupos con fecha viven en Salidas.
//
// ⚠️ SUS FECHAS SON SOLO LECTURA. Se crean, se editan y se cierran en Salidas.
// Tenerlas editables en los dos lados es exactamente lo que hizo falta desarmar
// cuando las fechas vivían también en el formulario: dos puertas sobre el mismo
// dato terminan discrepando. Ver design/encuesta-v2/LIMITES.md.
//
// Diseño transcrito de design/encuesta-v2/dc/experiencias.dc.html.

const dec = (n: number) => n.toFixed(1).replace(".", ",");

export default async function FichaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { slug } = await params;
  if (!(await puedeEntrarAlPanel())) redirect(`/caminante/login?next=/caminante/admin/eventos/${slug}`);

  const ficha = await fetchFicha(slug);
  if (!ficha) notFound();
  const { producto: p, fotos, fechas, testimonios } = ficha;
  const ev = await fetchEventoDetalle(slug);

  const sp = await searchParams;
  const error = sp.error?.trim() || "";
  const aviso = error || sp.ok?.trim() || "";
  const borrador = p.status !== "published";
  const faltanFotos = fotos.filter((f) => f.n === 0);

  return (
    <AdminShell active="eventos">
      <div className="sec-head">
        <div>
          <span className="eyebrow">
            <span className="sl">{"//"}</span>{" "}
            <Link href="/caminante/admin/eventos" style={{ textDecoration: "underline" }}>
              Experiencias
            </Link>
          </span>
          <h1 className="display" style={{ fontSize: 26, marginTop: 9 }}>
            La experiencia <em className="ac">completa.</em>
          </h1>
        </div>
      </div>

      {aviso ? (
        <div
          className="card pad"
          style={{
            marginBottom: 20,
            borderColor: error ? "rgba(179,53,23,.35)" : "rgba(99,113,84,.35)",
            background: error ? "rgba(179,53,23,.06)" : "rgba(99,113,84,.07)",
          }}
        >
          {aviso}
        </div>
      ) : null}

      <div className="exhero">
        {p.foto ? (
          <div className="ph">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.foto} alt={p.fotoAlt} />
          </div>
        ) : null}
        <div className="in">
          <span className={`chip ${borrador ? "c-draft" : "c-pub"}`}>
            {borrador ? null : <span className="cd" />}
            {borrador ? "Borrador" : "Publicada"}
          </span>
          <h2>{p.nombre}</h2>
          {p.operador ? <p className="sub">Operada por {p.operador}</p> : null}
          {borrador ? (
            <p className="exsem dorm big" style={{ marginTop: 12 }}>
              <s>·</s>
              <span>En borrador, todavía no se vende</span>
            </p>
          ) : p.puedeVender ? (
            <p className="exsem si big" style={{ marginTop: 12 }}>
              <s>✓</s>
              <span>Lista para vender</span>
            </p>
          ) : (
            <p className="exsem no big" style={{ marginTop: 12 }}>
              <s>⚠</s>
              <span>No vende: {p.faltaParaVender.join(" ")}</span>
            </p>
          )}
        </div>
      </div>

      <div className="exbar">
        <Link href={`/caminante/admin/experiencias/${slug}`} className="btn btn-orange">
          Editar contenido
        </Link>
        <a href={`/caminante/experiencias/${slug}`} target="_blank" rel="noreferrer" className="btn btn-glass">
          Ver página pública
        </a>
        <Link href={`/caminante/admin/kit/${slug}`} className="btn btn-ghost">
          Kit de comunicación
        </Link>
        <form action={setExperienceStatusAction} style={{ display: "inline" }}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="status" value={borrador ? "published" : "draft"} />
          <button type="submit" className="btn btn-ghost">
            {borrador ? "Publicar" : "Pasar a borrador"}
          </button>
        </form>
      </div>

      {/* ── 1 · CÓMO VA ── */}
      <span className="subtitle">Cómo va</span>
      <div className="kpis" style={{ margin: "10px 0 24px" }}>
        <div className="kpi card">
          <div className="k-lbl">Ingresos</div>
          <div className={`k-val${p.ingresos ? "" : " mut"}`}>{p.ingresos ? formatMXN(p.ingresos) : "—"}</div>
          <div className="k-sub">
            De <b>{p.salidasCorridas}</b> {p.salidasCorridas === 1 ? "salida corrida" : "salidas corridas"}
          </div>
        </div>
        <div className="kpi card">
          <div className="k-lbl">Clientes que han pasado</div>
          <div className={`k-val${p.clientes ? "" : " mut"}`}>{p.clientes || "—"}</div>
          <div className="k-sub">Personas distintas, no reservas.</div>
        </div>
        <div className="kpi card">
          <div className="k-lbl">Salidas corridas</div>
          <div className={`k-val${p.salidasCorridas ? "" : " mut"}`}>{p.salidasCorridas || "—"}</div>
          <div className="k-sub">{p.ultimaSalida ? <>Última: <b>{p.ultimaSalida}</b></> : "Todavía no viaja nadie."}</div>
        </div>
        <div className="kpi card">
          <div className="k-lbl">Estrellas</div>
          {/* ⚠️ El promedio NUNCA sin su denominador. */}
          <div className={`k-val${p.stars != null ? "" : " mut"}`}>{p.stars != null ? dec(p.stars) : "—"}</div>
          <div className="k-sub">
            {p.respuestas ? (
              <>
                De <b>{p.respuestas} de {p.invitadas}</b> que contestaron
              </>
            ) : (
              <>Sin respuestas todavía · <b>0 de {p.invitadas}</b> contestaron</>
            )}
          </div>
        </div>
      </div>

      {/* ── 2 · SUS FOTOS ── */}
      <div className="card pad">
        <span className="subtitle">Sus fotos</span>
        <p className="desc" style={{ margin: 0 }}>
          El banco por tipo. Es la materia prima de la página pública, del Kit y del correo.
        </p>
        <div className="exban">
          {fotos.map((f) =>
            f.muestra ? (
              <div className="exsl" key={f.k}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.muestra} alt={f.label} />
                <span className="n">{f.n}</span>
                <span className="tt">{f.label}</span>
              </div>
            ) : (
              <div className="exsl vacia" key={f.k}>
                <span className="lb">{f.label}</span>
                <span className="ad">Falta</span>
                <Link href={`/caminante/admin/experiencias/${slug}#s1b`} className="btn btn-ghost btn-sm">
                  Subir
                </Link>
              </div>
            ),
          )}
        </div>
        <p className="mut" style={{ fontSize: 12.5, marginTop: 12, lineHeight: 1.55 }}>
          {faltanFotos.length === 0
            ? "Los cinco tipos tienen material: el Kit puede repartir la foto correcta a cada pieza."
            : `${fotos.length - faltanFotos.length} de ${fotos.length} tipos con material. Sin ${faltanFotos
                .map((f) => f.label.toLowerCase())
                .join(" ni ")}, el Kit no puede armar las piezas que las usan.`}
        </p>
      </div>

      {/* ── 3 · SU COMUNICACIÓN ── */}
      <div className="grid2" style={{ marginTop: 20 }}>
        <div className="card pad">
          <span className="subtitle">Su comunicación</span>
          <p className="desc" style={{ margin: "6px 0 0" }}>
            Las piezas del Kit se arman de sus fotos y su ficha científica.
          </p>
          <div className="act-row">
            <Link href={`/caminante/admin/kit/${slug}`} className="btn btn-glass btn-sm">
              Abrir Kit de comunicación
            </Link>
          </div>
        </div>
        <div className="card pad">
          <span className="subtitle">Testimonios publicables</span>
          {testimonios.length ? (
            <div className="testi" style={{ marginTop: 12 }}>
              {testimonios.map((t, i) => (
                <div className="tcard glass" key={i}>
                  <div className="tt">«{t.texto}»</div>
                  <div className="tm">
                    {t.autor}
                    {t.stars != null ? ` · ★ ${t.stars}` : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty" style={{ padding: 22, marginTop: 12 }}>
              {p.respuestas
                ? "Nadie ha autorizado publicar el suyo todavía."
                : "Ninguno todavía. Los testimonios los deja la encuesta, y esta experiencia no tiene respuestas."}
            </div>
          )}
        </div>
      </div>

      {/* ── 4 · QUÉ LE FALTA ── */}
      <div className="card pad" style={{ marginTop: 20 }}>
        <span className="subtitle">Qué le falta</span>
        <div className="exdim">
          {p.dimensiones.map((d) => (
            <div
              className={`d ${d.estado === "ok" ? "full" : d.estado === "parcial" ? "half" : "none"}`}
              key={d.id}
            >
              <i />
              <div className="g">{d.titulo}</div>
              {d.estado === "ok" ? (
                <span className="tick">✓</span>
              ) : (
                <Link href={`/caminante/admin/experiencias/${slug}${d.ancla}`}>Completar →</Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 5 · EL TRATO ── */}
      <div className="card pad" style={{ marginTop: 20 }}>
        {ev?.miOperatorId ? (
          <>
            <span className="subtitle">Tu trato</span>
            <div className="extrato">
              <span className="pct">{ev.miComisionPct != null ? `${ev.miComisionPct}%` : "Por definir"}</span>
              <div className="g">
                Es la comisión que Caminante toma de cada venta de esta experiencia.{" "}
                <b style={{ color: "var(--charcoal)", fontWeight: 600 }}>Se congela en cada venta</b>: lo ya
                vendido nunca cambia de porcentaje, y un ajuste aplica solo a ventas futuras.
              </div>
            </div>
          </>
        ) : (
          <>
            <span className="subtitle">Operador y comisión</span>
            <form action={assignOperatorAction} className="mini-form" style={{ marginTop: 10 }}>
              <input type="hidden" name="experienceId" value={ev?.id ?? ""} />
              <input type="hidden" name="slug" value={slug} />
              <OperadorSelect
                operadores={(ev?.operadores ?? []).map((o) => ({
                  id: o.id,
                  name: o.name,
                  commissionPct: o.commissionPct,
                }))}
                operadorId={ev?.operatorId ?? null}
              />
              <button className="btn btn-ghost btn-sm" type="submit">
                Guardar
              </button>
            </form>
            <details style={{ marginTop: 12 }}>
              <summary className="mut" style={{ fontSize: 12.5, cursor: "pointer" }}>
                + Crear operador nuevo
              </summary>
              <form action={createOperatorAction} className="mini-form">
                <input type="hidden" name="experienceId" value={ev?.id ?? ""} />
                <input type="hidden" name="slug" value={slug} />
                <input name="name" placeholder="Nombre" required style={{ flex: 1, minWidth: 120 }} />
                <input name="email" type="email" placeholder="Correo" required style={{ flex: 1, minWidth: 150 }} />
                <input name="commissionPct" type="number" min={0} max={100} step="0.5" placeholder="%" style={{ maxWidth: 70 }} />
                <button className="btn btn-orange btn-sm" type="submit">
                  Crear y asignar
                </button>
              </form>
            </details>
            <p className="mut" style={{ fontSize: 12, marginTop: 10 }}>
              La comisión se congela en cada venta al momento de cobrar (no cambia ventas pasadas).
            </p>
          </>
        )}
      </div>

      {/* ── SUS FECHAS · REFLEJO ── */}
      <div className="exfech">
        <span className="subtitle">Sus fechas publicadas</span>
        <p className="exmir">
          <s>{"//"}</s>
          <span>
            Reflejo de lo que hay en{" "}
            <Link href="/caminante/admin/salidas" style={{ textDecoration: "underline" }}>
              Salidas
            </Link>
            . Se crean, se editan y se cierran allá; aquí solo se leen.
          </span>
        </p>
        {fechas.length === 0 ? (
          <div className="empty" style={{ marginTop: 12 }}>
            Sin fechas planeadas. No es un pendiente: la experiencia se vende por solicitud de grupo.
          </div>
        ) : (
          fechas.map((f) => (
            <div className="exro" key={f.id}>
              <span>
                <span className="dt">{f.label}</span>
                <span className="sub">
                  {f.tomados} de {f.cupo ?? "∞"} lugares
                  {f.cupo && f.tomados >= f.cupo ? " · llenos" : ""}
                </span>
              </span>
              <span className="rt">
                {f.pasada ? <span className="chip c-draft">Ya viajó</span> : null}
                <Link href="/caminante/admin/salidas" className="btn btn-ghost btn-sm">
                  Abrir salida →
                </Link>
              </span>
            </div>
          ))
        )}
      </div>

      <div className="act-row" style={{ marginTop: 34 }}>
        <form action={deleteExperienceAction}>
          <input type="hidden" name="slug" value={slug} />
          <ConfirmSubmit
            className="btn btn-danger btn-sm"
            message={`Vas a ELIMINAR «${p.nombre}». Esto no se puede deshacer. ¿Seguro?`}
          >
            Eliminar experiencia
          </ConfirmSubmit>
        </form>
      </div>
    </AdminShell>
  );
}
