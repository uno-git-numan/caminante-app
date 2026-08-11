"use client";

// OPERADOR — transcrita de `ScrOperadorWL` (adm-screens-c.jsx).
//
// ⚠️ Lo que el entregable pinta y el sistema NO tiene (se omite, no se inventa):
//   · Los DOS COLORES de marca con vista previa en vivo: el white-label por
//     operador (theming con variables CSS) está planeado pero no construido —
//     no hay dónde guardar esos colores ni página que los use. Un selector que
//     no guarda nada sería una promesa falsa.
//   · «Entidad legal» y «Trato · comisión 0% hasta dic»: `operators` no guarda
//     razón social, y `commission_pct` es el % que retiene la PLATAFORMA, no el
//     trato del embajador (30% de utilidad, que vive en el convenio).
//     Enseñarlo como «el trato» sería mentir sobre lo que significa la columna.
//   · «Guardar» y «Publicar»: la edición del perfil vive en el panel de
//     escritorio (/admin/operadores); aquí no se escribe nada.
//
// Lo que sí es real y se muestra: el MISMO perfil que sirve la página pública
// (fetchOperatorProfile, con includeDraft para poder revisar un borrador), con
// sus métricas calculadas de ventas y encuestas.

import { Suspense, use, useState } from "react";
import { cargarOperadorMovil, type MasMovil } from "@/lib/admin/movil/mas";
import type { OperatorProfile } from "@/lib/operators/public";
import type { Nav } from "./AppShell";
import { Chip, Empty, Fld, Gap, NavBar, Sub } from "./kit";

// `use()` necesita la MISMA promesa entre renders → caché de módulo, con un
// sello por apertura para que volver a entrar traiga datos frescos.
const cache = new Map<string, Promise<OperatorProfile | null>>();
function pedirOperador(slug: string, v: number): Promise<OperatorProfile | null> {
  const k = `${slug}:${v}`;
  let p = cache.get(k);
  if (!p) {
    for (const vieja of [...cache.keys()]) if (vieja.startsWith(`${slug}:`)) cache.delete(vieja);
    p = cargarOperadorMovil(slug).catch(() => null);
    cache.set(k, p);
  }
  return p;
}

export default function Operador({
  d,
  nav,
  params,
}: {
  d: MasMovil;
  nav: Nav;
  params: Record<string, string>;
}) {
  const slug = params.slug || "";
  // El hook va antes de cualquier retorno: si dependiera del slug, React
  // contaría distinto número de hooks entre una apertura y otra.
  const [v] = useState(() => Date.now());

  // Sin slug: la lista para elegir. Un operador sin slug (los que nacen al
  // aprobar a un embajador) todavía no tiene perfil público que abrir.
  if (!slug) {
    return (
      <div className="adm-screen">
        <NavBar onBack={nav.pop} t="Operador" s="perfil público" />
        <div className="adm-pad">
          {d.operadores.length === 0 ? (
            <div className="adm-card">
              <Empty
                ic="◌"
                t="No hay operadores activos"
                p="Se dan de alta al aprobar a un embajador o desde la computadora."
              />
            </div>
          ) : (
            <div className="adm-card">
              {d.operadores.map((o) => (
                <div className="adm-ros" key={o.id}>
                  <span className="adm-av">{o.nombre.slice(0, 2).toUpperCase()}</span>
                  <span className="nm">
                    {o.nombre}
                    <small>
                      {o.slug ? (o.publico ? "perfil en vivo" : "perfil en borrador") : "sin perfil público"}
                    </small>
                  </span>
                  {o.slug ? (
                    <button
                      className="adm-btn adm-btn-ghost adm-btn-sm"
                      onClick={() => nav.push("operador", { slug: o.slug as string })}
                    >
                      Abrir
                    </button>
                  ) : (
                    <Chip c="mut">sin perfil</Chip>
                  )}
                </div>
              ))}
            </div>
          )}
          <Gap />
          <p className="adm-mut" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
            El perfil se edita en la computadora: <b>Panel → Operador</b>. Aquí se revisa cómo quedó.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="adm-screen">
          <NavBar onBack={nav.pop} t="Operador" s="cargando…" />
          <div className="adm-pad">
            <div className="adm-card adm-skel">
              <div className="sk" style={{ width: "60%" }}></div>
              <div className="sk"></div>
            </div>
          </div>
        </div>
      }
    >
      <Perfil slug={slug} v={v} nav={nav} />
    </Suspense>
  );
}

function Perfil({ slug, v, nav }: { slug: string; v: number; nav: Nav }) {
  const p = use(pedirOperador(slug, v));

  if (!p) {
    return (
      <div className="adm-screen">
        <NavBar onBack={nav.pop} t="Operador" s={slug} />
        <div className="adm-pad">
          <div className="adm-card">
            <Empty ic="◌" t="No pude abrir este perfil" p="El operador no existe o la sesión caducó." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-screen">
      <NavBar
        onBack={nav.pop}
        t={p.name}
        s="perfil público"
        right={
          p.isPublic ? (
            <Chip c="ok" dot>
              En vivo
            </Chip>
          ) : (
            <Chip c="sol">Borrador</Chip>
          )
        }
      />
      <div className="adm-pad">
        <Sub pad>Identidad</Sub>
        <div className="adm-card" style={{ padding: "4px 16px 14px" }}>
          <Fld l="Nombre público" val={p.name} />
          <Fld l="Su dirección" val={`caminante.numanhub.com/caminante/operador/${p.slug}`} />
          {p.instagram ? <Fld l="Instagram" val={p.instagram} /> : null}
        </div>

        {p.bio ? (
          <>
            <Gap />
            <Sub pad>Cómo se presenta</Sub>
            <div className="adm-card" style={{ padding: "14px 16px" }}>
              <p style={{ fontSize: 13, lineHeight: 1.55 }}>{p.bio}</p>
            </div>
          </>
        ) : null}

        <Gap />
        <Sub pad>Lo que dicen sus números</Sub>
        <div className="adm-card adm-kpi4">
          {(
            [
              ["salidas", String(p.metrics.salidas)],
              ["viajeros", String(p.metrics.viajeros)],
              ["★", p.metrics.stars != null ? String(p.metrics.stars) : "—"],
              ["volvería", p.metrics.volveria != null ? `${p.metrics.volveria}%` : "—"],
            ] as [string, string][]
          ).map(([l, val]) => (
            <div key={l}>
              <span className="adm-mono">{val}</span>
              <br />
              <small>{l}</small>
            </div>
          ))}
        </div>
        <p className="adm-mut" style={{ fontSize: 11.5, lineHeight: 1.5, paddingTop: 8 }}>
          {p.metrics.encuestas > 0
            ? `${p.metrics.encuestas} encuesta${p.metrics.encuestas === 1 ? "" : "s"} sostienen el promedio.`
            : "Todavía sin encuestas: la estrella no se inventa."}
        </p>

        {p.team.length > 0 ? (
          <>
            <Gap />
            <Sub pad>Su equipo</Sub>
            <div className="adm-card">
              {p.team.map((t) => (
                <div className="adm-ros" key={t.name}>
                  <span className="adm-av">{t.name.slice(0, 2).toUpperCase()}</span>
                  <span className="nm">
                    {t.name}
                    <small>{t.role || "sin vocación escrita"}</small>
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <Gap />
        <Sub pad>Sus experiencias</Sub>
        <div className="adm-card">
          {p.experiencias.length === 0 ? (
            <div className="adm-x">
              <Sub>Ninguna experiencia publicada a su nombre.</Sub>
            </div>
          ) : (
            p.experiencias.map((e) => (
              <div className="adm-ros" key={e.slug}>
                <span className="adm-tick">✓</span>
                <span className="nm">
                  {e.title}
                  <small>{e.ploc}</small>
                </span>
              </div>
            ))
          )}
        </div>

        <Gap />
        <div style={{ display: "flex", gap: 10 }}>
          <a
            className="adm-btn adm-btn-ghost"
            style={{ flex: 1 }}
            href={`/caminante/operador/${p.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            Vista previa
          </a>
          <a className="adm-btn adm-btn-ghost" style={{ flex: 1 }} href="/caminante/admin/operadores">
            Editar en computadora
          </a>
        </div>
        <Gap />
      </div>
    </div>
  );
}
