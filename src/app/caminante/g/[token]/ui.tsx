// Las piezas de SERVIDOR del espacio del grupo, transcritas del entregable
// (design/comunidad/dc/espacio/1-compartido-A-B.jsx y 2-C-invitado.jsx). El
// marcado y las clases van tal cual; lo que cambia es que los datos son los de
// la salida (lib/grupo/espacio.ts) y los botones llevan a rutas reales.
//
// Lo que el entregable inventa y aquí NO se dibuja:
//   · el precio «del cotizador» (no existe un precio por tamaño de grupo);
//   · la fila de mensajes de preparación con fechas (no hay mensajes
//     programados todavía: «Lo que viene» dice sólo lo que es verdad);
//   · las fotos del recuerdo (no hay fotos del grupo).

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Eyeb } from "@/app/caminante/ui/pub/atoms";
import { ESPACIO_CSS } from "@/app/caminante/perfil/ui/espacio-css";
import { ESP_CSS } from "@/lib/publico/espacio-grupo-css";
import PubStyles from "@/app/caminante/ui/pub/PubStyles";
import { signOut } from "@/lib/auth/actions";
import { precioPub } from "@/lib/grupo/formato";
import type { Espacio, EstadoLugar, PersonaDelGrupo } from "@/lib/grupo/espacio";

/** El marco: .pub.esp > .pub-app.mesp > .pub-scroll > .pub-screen (+ barra de compra). */
export function EspShell({ children, buybar }: { children: ReactNode; buybar?: ReactNode }) {
  return (
    <>
      <PubStyles modo="solo" />
      <style dangerouslySetInnerHTML={{ __html: ESPACIO_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: ESP_CSS }} />
      <div className="pub esp">
        <div className="pub-app mesp">
          <div className="pub-scroll">
            <div className="pub-screen">{children}</div>
          </div>
          {buybar}
        </div>
      </div>
    </>
  );
}

export const Titulo = ({ e }: { e: Espacio }) => (
  <>
    {e.titulo}
    {e.tituloAcento ? (
      <>
        {" "}
        <em>{e.tituloAcento}</em>
      </>
    ) : null}
  </>
);

export const Priv = () => (
  <span className="pub-chip">
    <span className="cd"></span>Salida privada
  </span>
);

export function Hero({
  e,
  h = 440,
  chips,
  eb,
  title,
  meta,
}: {
  e: Espacio;
  h?: number;
  chips?: ReactNode;
  eb?: ReactNode;
  title?: ReactNode;
  meta?: string;
}) {
  const style: CSSProperties | undefined = e.foto?.pos ? { objectPosition: e.foto.pos } : undefined;
  return (
    <div className="pub-hero" style={{ minHeight: h }}>
      {e.foto ? (
        <div className="ph">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.foto.url} alt={e.foto.alt} style={style} />
        </div>
      ) : null}
      <div className="veil"></div>
      <div className="inner" style={{ paddingBottom: 40 }}>
        {chips ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{chips}</div> : null}
        {eb}
        <h1>{title ?? <Titulo e={e} />}</h1>
        {meta ? <span className="meta">{meta}</span> : null}
      </div>
    </div>
  );
}

/** El contador «4 de 10 lugares apartados» con su barra y la fecha límite. */
export function Count({ e, enEspera = 0 }: { e: Espacio; enEspera?: number }) {
  let tone = "";
  let lim = "";
  let left: string | null = null;
  let note: string | null = null;
  if (e.yaViajaron) {
    tone = " full";
    lim = `Viajaron el ${e.fechaLarga}`;
  } else if (e.cupoLleno) {
    tone = " full";
    lim = "Cupo lleno";
    left = enEspera ? `${enEspera} en lista de espera` : "Lista de espera abierta";
    note = "Si alguien libera su lugar, entra el primero de la lista y le avisamos.";
  } else if (e.vencida) {
    tone = " warn";
    lim = `Se cerró el ${e.fechaLimiteTexto}`;
    left = e.minimo != null ? `Mínimo ${e.minimo}` : null;
    note = e.vencidaSinMinimo
      ? `No se juntó el mínimo. La salida sigue en pie mientras tanto: ${e.operadora.nombre.split(" · ")[0]} te va a escribir para ver cómo seguimos.`
      : `Ya pasó la fecha límite para apartar. Si falta alguien, escríbele a ${e.operadora.nombre.split(" · ")[0]}.`;
  } else if (e.fechaLimite && e.diasParaLimite != null) {
    tone = e.diasParaLimite <= 3 ? " warn" : "";
    lim = `Aparta antes del ${e.fechaLimiteTexto}`;
    left = e.diasParaLimite === 0 ? "Hoy es el último día" : e.diasParaLimite === 1 ? "Falta 1 día" : `Faltan ${e.diasParaLimite} días`;
  } else {
    lim = "Aparta tu lugar";
    left = e.disponibles != null ? (e.disponibles === 1 ? "Queda 1" : `Quedan ${e.disponibles}`) : null;
  }
  const pct = e.cupo ? Math.min(100, (e.apartados / e.cupo) * 100) : 0;
  return (
    <div className={"esp-count" + tone}>
      <div className="nm">
        <b>{e.apartados}</b>
        <span>{e.cupo != null ? `de ${e.cupo} lugares apartados` : e.apartados === 1 ? "lugar apartado" : "lugares apartados"}</span>
      </div>
      {e.cupo != null ? (
        <div className="bar">
          <i style={{ width: `${pct}%` }}></i>
        </div>
      ) : null}
      <div className="lim">
        <span>{lim}</span>
        {left ? <em>{left}</em> : null}
      </div>
      {note ? <p className="note">{note}</p> : null}
    </div>
  );
}

export function Price({ e }: { e: Espacio }) {
  if (e.precio == null) return null;
  return (
    <div className="esp-price">
      <div>
        <b>{precioPub(e.precio)}</b> <span className="q">por persona</span>
      </div>
    </div>
  );
}

/** La tarjeta lateral: en teléfono sólo el contador; en escritorio también precio, botón e invitación (pegajosa). */
export function Side({ count, price, cta, note, invite }: { count: ReactNode; price?: ReactNode; cta?: ReactNode; note?: string | null; invite?: ReactNode }) {
  return (
    <aside className="esp-side">
      {count}
      <div className="esp-donly">
        {price}
        {cta}
        {note ? <p className="esp-sidenote">{note}</p> : null}
        {invite}
      </div>
    </aside>
  );
}

const PASOS: { k: EstadoLugar; t: string }[] = [
  { k: "entro", t: "Entré" },
  { k: "pago", t: "Pagué" },
  { k: "firmo", t: "Firmé" },
];
const nivel = (s: EstadoLugar) => (s === "firmo" ? 3 : s === "pago" ? 2 : 1);

export const Steps = ({ estado }: { estado: EstadoLugar }) => {
  const at = nivel(estado);
  return (
    <ol className="esp-steps">
      {PASOS.map((p, i) => (
        <li key={p.k} className={i < at ? "ok" : i === at ? "now" : ""}>
          <i>{i < at ? "✓" : i + 1}</i>
          {p.t}
        </li>
      ))}
    </ol>
  );
};

const ST: Record<EstadoLugar, string> = { entro: "Entró", pago: "Pagó", firmo: "Firmó" };
export const St = ({ s }: { s: EstadoLugar }) => <span className={"esp-st " + s}>{ST[s]}</span>;

function lineaDe(p: PersonaDelGrupo): string {
  if (p.pagadoPor) return `Pagado por ${p.pagadoPor} · ${p.estado === "firmo" ? "firmó" : "falta firmar"}`;
  if (p.estado === "firmo") return p.lugaresPagados > 1 ? `Pagó ${p.lugaresPagados} lugares` : "Pagó y firmó";
  if (p.estado === "pago") return p.lugaresPagados > 1 ? `Pagó ${p.lugaresPagados} lugares · falta firmar` : "Pagó · falta firmar";
  if (p.listaEspera) return "En lista de espera";
  return "Falta apartar";
}

/** «Quién va»: una fila por persona; quien pagó por otros lleva a los cubiertos debajo. Nunca montos ni datos médicos. */
export function Who({ e, yo, anfitrion }: { e: Espacio; yo: PersonaDelGrupo | null; anfitrion: boolean }) {
  const cubiertosDe = (p: PersonaDelGrupo) => e.personas.filter((c) => c.pagadoPor && c.reservationId && c.reservationId === p.reservationId && c.lugarId !== p.lugarId);
  const raiz = e.personas.filter((p) => !p.pagadoPor);
  const fila = (p: PersonaDelGrupo, cov: boolean) => (
    <div key={p.lugarId} className={"mesp-person" + (cov ? " cov" : "")}>
      <span className="mesp-av">{p.iniciales}</span>
      <div className="g">
        <div className="nm">
          {p.nombre}
          {yo && p.lugarId === yo.lugarId ? " · tú" : ""}
          {p.anfitrion ? <span className="esp-host">Anfitrión</span> : null}
        </div>
        <div className="mt">{lineaDe(p)}</div>
      </div>
      <St s={p.estado} />
    </div>
  );
  return (
    <div className="mesp-people esp-who">
      {raiz.map((p) => (
        <div key={p.lugarId} style={{ display: "contents" }}>
          {fila(p, false)}
          {cubiertosDe(p).map((c) => fila(c, true))}
        </div>
      ))}
      {anfitrion && !e.cupoLleno && !e.yaViajaron ? (
        <a className="mesp-addp" style={{ width: "100%", justifyContent: "center" }} href="#invitar">
          {e.disponibles != null ? `${e.disponibles === 1 ? "Queda 1 lugar" : `Quedan ${e.disponibles} lugares`} · invitar a alguien más` : "Invitar a alguien más"}
        </a>
      ) : null}
    </div>
  );
}

/** «El viaje»: itinerario, qué incluye y la mochila, en acordeones. Sólo lo que la experiencia trae. */
export function Viaje({ e }: { e: Espacio }) {
  const hay = e.itinerario.length || e.incluye.length || e.mochila.length;
  if (!hay) return null;
  return (
    <div className="pub-ficha">
      {e.itinerario.length ? (
        <details>
          <summary>
            <b>
              Itinerario<i>{e.itinerario.length === 1 ? "Un día" : `${e.itinerario.length} días`}</i>
            </b>
            <span className="x">+</span>
          </summary>
          <div className="body">
            <div className="pub-it" style={{ margin: "4px 0 0" }}>
              {e.itinerario.map((d, i) => (
                <div key={i} className="step">
                  <span className="h">{d.lab}</span>
                  {d.ttl ? <b>{d.ttl}</b> : null}
                  {d.texto ? <p>{d.texto}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </details>
      ) : null}
      {e.incluye.length ? (
        <details>
          <summary>
            <b>
              Qué incluye<i>{e.incluye.length} cosas</i>
            </b>
            <span className="x">+</span>
          </summary>
          <div className="body">{e.incluye.join(" · ")}</div>
        </details>
      ) : null}
      {e.mochila.length ? (
        <details>
          <summary>
            <b>
              La mochila<i>Lo que llevas tú</i>
            </b>
            <span className="x">+</span>
          </summary>
          <div className="body">{e.mochila.join(" · ")}</div>
        </details>
      ) : null}
    </div>
  );
}

/** «Lo que viene»: sólo lo que es verdad hoy: la fecha límite, el deslinde y el punto de encuentro. */
const Row = ({ t, s }: { t: string; s: string }) => (
  <div className="row">
    <span className="sl">{"//"}</span>
    <span>
      <b style={{ fontWeight: 600 }}>{t}</b>
      <small>{s}</small>
    </span>
  </div>
);

export function Viene({ e }: { e: Espacio }) {
  return (
    <>
      <div className="pub-inc">
        {e.fechaLimiteTexto && !e.yaViajaron ? <Row t={`Antes del ${e.fechaLimiteTexto}`} s="Cada quien aparta su lugar. Después de esa fecha se cierra la lista." /> : null}
        {!e.yaViajaron ? <Row t="Antes de salir" s="Cada quien firma su deslinde desde su lugar, aquí mismo." /> : null}
        <Row
          t="Punto de encuentro"
          s={
            e.puntoEncuentro
              ? `${e.puntoEncuentro.texto}${e.puntoEncuentro.hora ? ` · ${e.puntoEncuentro.hora}` : ""}`
              : "Todavía no está puesto. Te llega unos días antes de salir."
          }
        />
      </div>
      <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginTop: 12 }}>Te llega por WhatsApp y correo.</p>
    </>
  );
}

export function Grupo({ url }: { url: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <a className="pub-cta pub-cta-ghost" href={url} target="_blank" rel="noopener">
        Abrir el grupo de WhatsApp
      </a>
      <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>Ahí se platica. Los avisos del viaje te llegan aparte, a ti.</p>
    </div>
  );
}

const digitos = (t: string | null) => (t ?? "").replace(/\D/g, "");

export function Pie({ e }: { e: Espacio }) {
  const o = e.operadora;
  const ini = o.nombre
    .split(" · ")[0]
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <>
      <div className="pub-guide">
        <span className="mesp-av">{ini}</span>
        <div className="g">
          <b>{o.nombre}</b>
          <small>Tu operadora</small>
          <p>
            {o.whatsapp ? o.whatsapp : null}
            {o.whatsapp && o.email ? <br /> : null}
            {o.email ? o.email : null}
          </p>
        </div>
      </div>
      <div className="pub-acts">
        {o.whatsapp ? (
          <a className="pub-cta pub-cta-ghost pub-cta-sm" href={`https://wa.me/${digitos(o.whatsapp)}`} target="_blank" rel="noopener">
            WhatsApp
          </a>
        ) : null}
        {o.email ? (
          <a className="pub-cta pub-cta-ghost pub-cta-sm" href={`mailto:${o.email}`}>
            Correo
          </a>
        ) : null}
      </div>
    </>
  );
}

/** La barra superior de escritorio (de Mi espacio v2). */
export function DTop({ sesion }: { sesion: boolean }) {
  return (
    <div className="esp-dtop">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/landing/assets/logos/caminante-logo.svg" alt="Caminante" />
      <span className="lk">
        <Link href="/caminante/experiencias">Experiencias</Link>
        <Link href="/caminante/aprende">Aprende</Link>
        <a href="/caminante/entrar">Mi espacio</a>
      </span>
      {sesion ? (
        <form action={signOut}>
          <button className="out">Salir</button>
        </form>
      ) : (
        <a className="out" href="/caminante/entrar">
          Entrar
        </a>
      )}
    </div>
  );
}

export const Sec = ({ eb, title, children }: { eb: string; title?: ReactNode; children: ReactNode }) => (
  <div className="pub-sec">
    <Eyeb>{eb}</Eyeb>
    {title ? <h2>{title}</h2> : null}
    {children}
  </div>
);

/** La tarjeta «Tu lugar» (.mesp-trip de Mi espacio) con entré → pagué → firmé. */
export function TripCard({ e, who, sub, estado, chips, children }: { e: Espacio; who: string; sub: string; estado: EstadoLugar; chips?: ReactNode; children?: ReactNode }) {
  return (
    <article className="mesp-trip" style={{ margin: 0 }}>
      {e.foto ? (
        <div className="ph">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.foto.url} alt={e.foto.alt} />
        </div>
      ) : null}
      <span className="chip-date">{e.etiqueta}</span>
      <div className="pad" style={{ paddingTop: 120 }}>
        <span className="eb">
          <span className="sl">{"//"}</span> Tu lugar
        </span>
        <h3>{who}</h3>
        <p className="pax">{sub}</p>
        <Steps estado={estado} />
        {chips ? <div className="st">{chips}</div> : null}
        {children}
      </div>
    </article>
  );
}

/** El regreso crema de las pantallas de cuenta (C2). */
export function Nav({ t, sub, backHref }: { t: string; sub: string; backHref: string }) {
  return (
    <div className="pub-nav">
      <Link className="bk" href={backHref} aria-label="Regresar">
        ‹
      </Link>
      <span className="tt">
        <b>{t}</b>
        <small>{sub}</small>
      </span>
    </div>
  );
}
