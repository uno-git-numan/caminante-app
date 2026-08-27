import Link from "next/link";
import { redirect } from "next/navigation";
import AdminShell from "../ui/AdminShell";
import Capsula from "./Capsula";
import NuevaSalida from "./NuevaSalida";
import { puedeEntrarAlPanel } from "@/lib/auth/authorization";
import { fetchSalidas } from "@/lib/admin/salidas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Salidas · Admin — Caminante" };

// SALIDAS — la línea de tiempo de todos los viajes con fecha.
//
// Una salida tiene un ANTES (perseguir firmas del deslinde) y un DESPUÉS (leer
// la encuesta): dos trabajos distintos sobre el mismo objeto, y por eso la
// pantalla se parte por TIEMPO y no por tipo de trabajo.
//
// Diseño transcrito de design/encuesta-v2/dc/salidas.dc.html.
// El reparto con Experiencias está en design/encuesta-v2/LIMITES.md:
// Experiencias = la OFERTA (lo que se puede comprar) · Salidas = el GRUPO
// (quien ya compró). Por eso aquí no hay dinero: esta pantalla también la ve un
// operador externo y sus ingresos viven en Panorama.

const SITIO = (process.env.NEXT_PUBLIC_SITE_URL || "https://caminante.numanhub.com").replace(/\/$/, "");

export default async function SalidasPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  if (!(await puedeEntrarAlPanel())) redirect("/caminante/login?next=/caminante/admin/salidas");
  const sp = await searchParams;
  const error = sp.error?.trim() || "";
  const aviso = error || sp.ok?.trim() || "";
  const d = await fetchSalidas();

  const tasa = d.respuestasPorLeer.invitadas
    ? Math.round((d.respuestasPorLeer.respuestas / d.respuestasPorLeer.invitadas) * 100)
    : 0;

  return (
    <AdminShell active="encuesta">
      {/* NuevaSalida OWNS el .sec-head: el panel de alta va DESPUÉS del
          encabezado, como en el entregable, y no dentro de él. */}
      <NuevaSalida experiencias={d.experiencias}>
        <div>
          <span className="eyebrow">
            <span className="sl">{"//"}</span> Salidas
          </span>
          <h1 className="display" style={{ marginTop: 10 }}>
            Cada viaje, <em className="ac">antes y después.</em>
          </h1>
          <p className="desc">
            Antes se persiguen las firmas del deslinde; después se lee cómo estuvo.
          </p>
        </div>
      </NuevaSalida>

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

      {/* ── El encabezado: lo que hay que saber sin abrir nada ── */}
      <div className="kpis" style={{ marginBottom: 34 }}>
        <div className="kpi card">
          <div className="k-lbl">Por viajar</div>
          <div className="k-val">
            {d.porViajar}
            <span className="u"> {d.porViajar === 1 ? "salida" : "salidas"}</span>
          </div>
          <div className="k-sub">
            {d.proximaEnDias != null ? (
              <>
                La más cercana en <b>{d.proximaEnDias === 0 ? "hoy" : `${d.proximaEnDias} días`}</b> ·{" "}
                {d.personasPorViajar} personas suben
              </>
            ) : (
              "Ninguna salida con gente por delante."
            )}
          </div>
        </div>

        <div className="kpi card">
          <div className="k-lbl">Firmas pendientes</div>
          <div className="k-val">
            {d.firmasPendientes}
            <span className="u"> de {d.titularesProximos}</span>
          </div>
          <div className="k-sub">
            {d.repartoFirmas.length ? (
              <>
                Reparto:{" "}
                {d.repartoFirmas.map((r, i) => (
                  <span key={i}>
                    {i > 0 ? ", " : ""}
                    <b>{r.faltan}</b> en {r.experiencia}
                  </span>
                ))}
              </>
            ) : (
              "Nadie debe firma en las salidas que vienen."
            )}
          </div>
          {d.titularesProximos > 0 ? (
            <div className={`prog${d.firmasPendientes ? " warn" : ""}`} style={{ marginTop: 12 }}>
              <div className="tk2">
                <i
                  style={{
                    width: `${((d.titularesProximos - d.firmasPendientes) / d.titularesProximos) * 100}%`,
                  }}
                />
              </div>
              <span className="fr">
                {d.titularesProximos - d.firmasPendientes}/{d.titularesProximos}
              </span>
            </div>
          ) : null}
        </div>

        {/* Esta tarjeta nace de un incidente: hongos viajó el 26 jul con 18
            personas y nadie recibió encuesta. La casilla estaba apagada, ningún
            gate la exigía, y el único síntoma fue el silencio. */}
        <div
          className="kpi card"
          style={d.sinEncuesta.length ? { borderColor: "rgba(255,93,54,.34)" } : undefined}
        >
          <div className="k-lbl">Sin encuesta armada</div>
          <div className="k-val" style={d.sinEncuesta.length ? { color: "var(--orange)" } : undefined}>
            {d.sinEncuesta.length}
            <span className="u"> {d.sinEncuesta.length === 1 ? "salida" : "salidas"}</span>
          </div>
          <div className="k-sub">
            {d.sinEncuesta.length ? (
              <>
                {d.sinEncuesta.map((x) => `${x.experiencia}, ${x.label}`).join(" · ")}. Si viaja así, no
                hay cómo saber cómo estuvo.
              </>
            ) : (
              "Todas las que vienen van a poder medirse."
            )}
          </div>
        </div>

        <div className="kpi card">
          <div className="k-lbl">Respuestas por leer</div>
          <div className="k-val">
            {d.respuestasPorLeer.respuestas}
            <span className="u"> de {d.respuestasPorLeer.invitadas}</span>
          </div>
          <div className="k-sub">
            {tasa}% respondió · <b>{d.respuestasPorLeer.publicables}</b> testimonios listos para publicar ·{" "}
            <b>{d.respuestasPorLeer.repiten}</b> quieren repetir
          </div>
        </div>
      </div>

      {/* ── PRÓXIMAS ── */}
      <section className="sec">
        {/* Los dos grupos llevan el MISMO peso que el título de la pantalla: son
            las dos mitades del trabajo, no subtítulos de una lista. Mismo patrón
            que .sec-head — eyebrow con las diagonales, display con remate en
            itálica naranja, y una línea que dice qué se hace ahí. */}
        <div className="sec-head">
          <div>
            <span className="eyebrow">
              <span className="sl">{"//"}</span> Próximas · {d.proximas.length}{" "}
              {d.proximas.length === 1 ? "salida" : "salidas"}
            </span>
            <h2 className="display" style={{ fontSize: 30 }}>
              Lo que <em className="ac">viene.</em>
            </h2>
            <div className="desc">
              La más cercana arriba. Aquí se persiguen las firmas del deslinde: sin ellas, esa persona
              no debería subir.
            </div>
          </div>
        </div>

        {d.proximas.length === 0 && d.vacias.length === 0 ? (
          <div className="empty">
            No hay salidas por delante. No es un pendiente: una experiencia puede venderse por
            solicitud de grupo sin fechas planeadas.
          </div>
        ) : null}

        {d.proximas.map((s) => (
          <Capsula key={s.id} s={s} sitio={SITIO} />
        ))}

        {/* Publicadas que nadie ha comprado. Se colapsan: tampoco son un
            pendiente — es una fecha esperando a que alguien la tome. */}
        {d.vacias.length ? (
          <details className="card salvac salcard">
            <summary>
              <span className="g">
                <b>
                  {d.vacias.length} {d.vacias.length === 1 ? "salida próxima" : "salidas próximas"} sin
                  reservas
                </b>{" "}
                — publicadas, nadie ha comprado lugar todavía
              </span>
              <span className="chev2">▾</span>
            </summary>
            <div className="in">
              {d.vacias.map((v) => (
                <div className="salvl" key={v.id}>
                  <span className="nm">
                    {v.experiencia}
                    {v.lugar ? ` · ${v.lugar}` : ""}
                  </span>
                  <span className="dt">
                    {v.label} · 0 de {v.cupo ?? "∞"}
                  </span>
                  <Link href={`/caminante/admin/eventos/${v.slug}`}>Abrir</Link>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </section>

      {/* ── PASADAS ── */}
      <section className="sec">
        <div className="sec-head">
          <div>
            <span className="eyebrow">
              <span className="sl">{"//"}</span> Pasadas · {d.pasadas.length}{" "}
              {d.pasadas.length === 1 ? "salida" : "salidas"}
            </span>
            <h2 className="display" style={{ fontSize: 30 }}>
              Lo que <em className="ac">fue.</em>
            </h2>
            <div className="desc">
              La más reciente arriba. Ningún promedio se muestra sin su denominador: 4,6 de nueve
              respuestas sobre dieciocho personas no es lo mismo que 4,6 de diecisiete.
            </div>
          </div>
        </div>
        {d.pasadas.length === 0 ? (
          <div className="empty">Todavía no ha viajado ningún grupo.</div>
        ) : (
          d.pasadas.map((s) => <Capsula key={s.id} s={s} sitio={SITIO} />)
        )}
      </section>
    </AdminShell>
  );
}
