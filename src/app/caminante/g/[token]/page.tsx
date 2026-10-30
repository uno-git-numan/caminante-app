import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyeb } from "@/app/caminante/ui/pub/atoms";
import { getCurrentUser } from "@/lib/auth/session";
import { puedeEntrarAlPanel } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { contactoDeUsuario, fetchEspacio, ligaDelEspacio, lugarDe, type Espacio, type PersonaDelGrupo } from "@/lib/grupo/espacio";
import { mensajeParaElGrupo } from "@/lib/grupo/mensajes";
import { apuntarseEnListaDeEspera, entrarConSesion } from "@/lib/grupo/acciones";
import { precioPub } from "@/lib/grupo/formato";
import { Count, DTop, EspShell, Grupo, Hero, Pie, Price, Priv, Sec, Side, TripCard, Viaje, Viene, Who } from "./ui";
import { Cubrir, Head, Invitar } from "./cliente";

// EL ESPACIO DEL GRUPO — /caminante/g/<token>.
//
// Sin lugar en el grupo (con o sin sesión) se ve la PORTADA DE INVITACIÓN (C1):
// la foto, quién invita, cuántos lugares van, cuánto cuesta y un solo botón.
// Con lugar, el ESPACIO (B para quien es anfitrión, C3 para un invitado). La
// operadora, con sesión del panel, lo ve «como lo ve el grupo».
//
// Es force-dynamic: la sesión decide qué se dibuja. El link se comparte por
// WhatsApp, así que trae su vista previa (metadata OpenGraph).

export const dynamic = "force-dynamic";

const digitos = (t: string | null) => (t ?? "").replace(/\D/g, "");

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const e = await fetchEspacio(token);
  if (!e) return { title: "Caminante" };
  const titulo = `${e.tituloPlano} · ${e.anfitrion?.pila ? `Grupo de ${e.anfitrion.pila}` : e.etiqueta}`;
  const desc = `${e.cupo != null ? `${e.apartados} de ${e.cupo} lugares apartados` : `${e.apartados} lugares apartados`} · ${e.fechaLarga}`;
  return {
    title: titulo,
    description: desc,
    openGraph: { title: titulo, description: desc, ...(e.foto ? { images: [{ url: e.foto.url }] } : {}) },
  };
}

export default async function EspacioDelGrupoPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; espera?: string }>;
}) {
  const { token } = await params;
  const { error, espera } = await searchParams;
  const e = await fetchEspacio(token);
  if (!e) notFound();

  const user = await getCurrentUser();
  const contacto = user ? await contactoDeUsuario(user) : null;
  const yo = lugarDe(e, contacto?.id ?? null);
  const operadora = !yo && !!user && (await puedeEntrarAlPanel());

  if (!yo && !operadora) {
    return <Portada e={e} sesion={!!user} celularListo={!!contacto?.phone_verified_at} error={error} />;
  }
  return <EspacioVista e={e} yo={yo} sesion={!!user} operadora={operadora} aviso={espera ? "Estás en la lista de espera. Si se abre un lugar, te avisamos por WhatsApp y correo." : error ?? null} />;
}

/* ── C1 · la portada de invitación ───────────────────────────────────────── */

function Portada({ e, sesion, celularListo, error }: { e: Espacio; sesion: boolean; celularListo: boolean; error?: string }) {
  const quien = e.anfitrion?.pila ? `${e.anfitrion.pila} te invita` : "Te invitan";
  const entrarHref = `/caminante/g/${e.token}/entrar`;
  return (
    <EspShell>
      <Head sesion={sesion} />
      <div className="esp-c1">
        <Hero e={e} h={560} chips={<Priv privada={e.privada} />} eb={<Eyeb neg>{quien}</Eyeb>} meta={[e.fechaCorta, e.lugar].filter(Boolean).join(" · ")} />
        <div className="esp-right">
          <div className="esp-donly">
            <Eyeb>{e.privada ? "Salida privada" : "Tu grupo"} · {e.fechaCorta}</Eyeb>
            <h1>
              {quien} a{" "}
              <em>
                {e.titulo}
                {e.tituloAcento ? ` ${e.tituloAcento}` : ""}
              </em>
            </h1>
          </div>
          <Count e={e} />
          <Price e={e} />
          {error ? <div className="esp-aviso err">{error}</div> : null}
          <div className="pub-sec" style={{ paddingTop: 14 }}>
            {e.yaViajaron ? (
              <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5 }}>Esta salida ya viajó. Si fuiste, entra con tu cuenta para ver tu espacio.</p>
            ) : null}
            {sesion && celularListo ? (
              <form action={entrarConSesion}>
                <input type="hidden" name="token" value={e.token} />
                <button className="pub-cta pub-cta-orange">Entrar al grupo</button>
              </form>
            ) : (
              <Link className="pub-cta pub-cta-orange" href={entrarHref}>
                Entrar al grupo
              </Link>
            )}
            <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 12 }}>
              {sesion && !celularListo
                ? "Falta verificar tu celular: por ahí te llegan los avisos del viaje. El deslinde lo llenas antes de salir."
                : "Vas a crear tu cuenta Caminante (celular y correo). El deslinde lo llenas antes de salir."}
            </p>
            {!sesion ? (
              <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 8 }}>
                ¿Ya tienes cuenta?{" "}
                <a href={`/caminante/login?next=${encodeURIComponent(`/caminante/g/${e.token}`)}`} style={{ fontWeight: 600 }}>
                  Entrar
                </a>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </EspShell>
  );
}

/* ── B / C3 · el espacio ─────────────────────────────────────────────────── */

async function encuestaDe(e: Espacio, yo: PersonaDelGrupo | null): Promise<string | null> {
  if (!e.yaViajaron || !yo) return null;
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("experience_feedback")
    .select("token, status")
    .eq("contact_id", yo.contactId)
    .eq("experience_id", e.experienceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = data as { token: string | null; status: string | null } | null;
  return row?.token && row.status !== "submitted" ? row.token : null;
}

async function EspacioVista({ e, yo, sesion, operadora, aviso }: { e: Espacio; yo: PersonaDelGrupo | null; sesion: boolean; operadora: boolean; aviso: string | null }) {
  const anfitrion = !!yo?.anfitrion;
  const liga = ligaDelEspacio(e.token);
  const reservarBase = `/caminante/reservar/${e.slug}?grupo=${e.token}`;
  const apartarHref = yo ? `${reservarBase}&lugar=${yo.lugarId}` : reservarBase;
  const firmarHref = yo?.reservationId && e.deslindeActivo ? `/caminante/registro/${e.slug}?reserva=${yo.reservationId}` : null;
  const escribirHref = e.operadora.whatsapp ? `https://wa.me/${digitos(e.operadora.whatsapp)}` : e.operadora.email ? `mailto:${e.operadora.email}` : null;
  const enEspera = e.personas.filter((p) => p.listaEspera && p.estado === "entro").length;
  const encuestaToken = await encuestaDe(e, yo);
  const pila = e.operadora.nombre.split(" · ")[0];

  // El botón que toca, según el estado del lugar. Es lo más visible de la
  // pantalla para quien no ha pagado (en la tarjeta pegajosa y en la barra).
  let cta: React.ReactNode = null;
  let ctaMovil: React.ReactNode = null;
  let note: string | null = null;
  let buybar: React.ReactNode = null;
  const puedeApartar = !!yo && yo.estado === "entro" && !e.vencida && !e.cupoLleno && !e.yaViajaron && e.status === "open";

  if (!yo) {
    note = operadora ? "Lo ves como operadora: el grupo ve esto mismo, cada quien con su lugar arriba." : null;
  } else if (e.yaViajaron) {
    cta = encuestaToken ? (
      <Link className="pub-cta pub-cta-orange" href={`/caminante/feedback/${encuestaToken}`}>
        Contar cómo te fue
      </Link>
    ) : (
      <Link className="pub-cta pub-cta-ghost" href={`/caminante/experiencias/${e.slug}`}>
        Volver a salir
      </Link>
    );
    ctaMovil = cta;
  } else if (yo.estado === "firmo") {
    cta = (
      <button className="pub-cta pub-cta-ghost" disabled>
        Tu lugar está apartado y firmado
      </button>
    );
  } else if (yo.estado === "pago") {
    cta = firmarHref ? (
      <Link className="pub-cta pub-cta-orange" href={firmarHref}>
        Firmar deslinde
      </Link>
    ) : (
      <button className="pub-cta pub-cta-ghost" disabled>
        Tu lugar está apartado
      </button>
    );
    ctaMovil = firmarHref ? (
      <Link className="mesp-orange-lg" style={{ width: "100%", justifyContent: "center", minHeight: 52, fontSize: 15.5 }} href={firmarHref}>
        Firmar deslinde
      </Link>
    ) : null;
    note = firmarHref ? "Tu lugar está apartado. Falta firmar el deslinde: toma unos minutos." : "Tu lugar está apartado. El deslinde se firma unos días antes de salir.";
  } else if (e.cupoLleno) {
    cta = yo.listaEspera ? (
      <button className="pub-cta pub-cta-ghost" disabled>
        Estás en la lista de espera
      </button>
    ) : (
      <form action={apuntarseEnListaDeEspera}>
        <input type="hidden" name="token" value={e.token} />
        <button className="pub-cta pub-cta-forest">Cupo lleno · avísame si se abre un lugar</button>
      </form>
    );
    ctaMovil = yo.listaEspera ? null : (
      <form action={apuntarseEnListaDeEspera}>
        <input type="hidden" name="token" value={e.token} />
        <button className="mesp-glassbtn" style={{ width: "100%" }}>
          Avísame si se abre un lugar
        </button>
      </form>
    );
    note = "Entraste. Si alguien libera su lugar, te avisamos por WhatsApp.";
    buybar = yo.listaEspera ? null : (
      <div className="pub-buybar">
        <form action={apuntarseEnListaDeEspera} style={{ flex: 1, display: "flex" }}>
          <input type="hidden" name="token" value={e.token} />
          <button className="pub-cta pub-cta-forest" style={{ flex: 1 }}>
            Cupo lleno · avísame si se abre un lugar
          </button>
        </form>
      </div>
    );
  } else if (e.vencida || e.status !== "open") {
    cta = escribirHref ? (
      <a className="pub-cta pub-cta-ghost" href={escribirHref} target="_blank" rel="noopener">
        Escribirle a {pila}
      </a>
    ) : null;
    note = e.status !== "open" ? "Esta salida ya no se vende. Si tienes dudas, escríbele a tu operadora." : null;
  } else if (puedeApartar) {
    const precio = e.precio != null ? ` · ${precioPub(e.precio)}` : "";
    cta = (
      <Link className="pub-cta pub-cta-orange" href={apartarHref}>
        Apartar mi lugar{precio}
      </Link>
    );
    ctaMovil = (
      <Link className="mesp-orange-lg" style={{ width: "100%", justifyContent: "center", minHeight: 52, fontSize: 15.5 }} href={apartarHref}>
        Apartar mi lugar{precio}
      </Link>
    );
    note = "Entraste. Tu lugar queda apartado al pagar; el deslinde se firma después.";
    buybar = (
      <div className="pub-buybar">
        <div className="p">
          {e.precio != null ? <b>{precioPub(e.precio)}</b> : null}
          <small>
            {e.disponibles != null ? (e.disponibles === 1 ? "Queda 1" : `Quedan ${e.disponibles}`) : "Hay lugar"}
            {e.fechaLimiteTexto ? ` · antes del ${e.fechaLimiteTexto}` : ""}
          </small>
        </div>
        <Link className="pub-cta pub-cta-orange" href={apartarHref}>
          Apartar mi lugar
        </Link>
      </div>
    );
  }

  // Los chips de la tarjeta «Tu lugar».
  const chips = yo ? (
    yo.estado === "firmo" ? (
      <>
        <span className="mesp-stchip st-ok">
          <span className="tk">✓</span>Pagado
        </span>
        <span className="mesp-stchip st-ok">
          <span className="tk">✓</span>Deslinde firmado
        </span>
      </>
    ) : yo.estado === "pago" ? (
      <>
        <span className="mesp-stchip st-ok">
          <span className="tk">✓</span>Pagado
        </span>
        <span className="mesp-stchip st-warn">
          <span className="dot"></span>Falta firmar
        </span>
      </>
    ) : e.cupoLleno ? (
      <span className="mesp-stchip st-amber">
        <span className="dot"></span>Lista de espera
      </span>
    ) : (
      <>
        <span className="mesp-stchip st-warn">
          <span className="dot"></span>
          {e.diasParaLimite != null && e.diasParaLimite >= 0 && e.diasParaLimite <= 3
            ? e.diasParaLimite === 0
              ? "Hoy es el último día para apartar"
              : `Falta${e.diasParaLimite === 1 ? "" : "n"} ${e.diasParaLimite} día${e.diasParaLimite === 1 ? "" : "s"} para apartar`
            : "Falta pagar"}
        </span>
        <span className="mesp-stchip st-amber">
          <span className="dot"></span>Deslinde después
        </span>
      </>
    )
  ) : null;

  const tituloLugar = !yo ? null : e.yaViajaron ? (
    <>
      Ya <em>viajaste.</em>
    </>
  ) : yo.estado === "firmo" ? (
    <>
      Todo <em>listo.</em>
    </>
  ) : yo.estado === "pago" ? (
    <>
      Falta <em>firmar.</em>
    </>
  ) : e.cupoLleno ? (
    <>
      Te avisamos <em>si se abre.</em>
    </>
  ) : (
    <>
      Falta <em>apartarlo.</em>
    </>
  );
  const subLugar = !yo
    ? ""
    : yo.anfitrion
      ? `Anfitrión · ${yo.lugaresPagados > 1 ? `${yo.lugaresPagados} lugares` : "1 lugar"}`
      : yo.estado === "entro"
        ? e.cupoLleno
          ? "Entraste · el cupo se llenó"
          : "Entraste · tu lugar no está apartado"
        : yo.pagadoPor
          ? `Tu lugar lo pagó ${yo.pagadoPor}`
          : yo.lugaresPagados > 1
            ? `${yo.lugaresPagados} lugares`
            : "1 lugar";

  const tituloQuienVa =
    e.cupo != null ? (
      <>
        {e.entraron} adentro, <em>{e.disponibles === 0 ? "cupo lleno." : e.disponibles === 1 ? "queda 1 lugar." : `quedan ${e.disponibles} lugares.`}</em>
      </>
    ) : (
      <>
        {e.entraron} <em>adentro.</em>
      </>
    );

  const candidatos = e.personas.filter((p) => p.estado === "entro" && !p.listaEspera && (!yo || p.lugarId !== yo.lugarId)).map((p) => ({ lugarId: p.lugarId, nombre: p.nombre, iniciales: p.iniciales }));
  const invitar = anfitrion && !e.yaViajaron ? <Invitar liga={liga} mensaje={mensajeParaElGrupo(e)} /> : null;

  return (
    <EspShell buybar={buybar}>
      <DTop sesion={sesion} />
      <Head sesion={sesion} />
      {aviso ? <div className={"esp-aviso" + (aviso.startsWith("Estás en la lista") ? "" : " err")}>{aviso}</div> : null}
      <div className="esp-body">
        <Hero
          e={e}
          chips={
            <>
              <Priv privada={e.privada} />
              {e.cupoLleno && !e.yaViajaron ? <span className="pub-chip">Cupo lleno</span> : null}
              {e.yaViajaron ? <span className="pub-chip">Ya viajaron</span> : null}
            </>
          }
          eb={
            <Eyeb neg>
              {e.etiqueta}
              {e.anfitrion?.pila ? ` · Grupo de ${e.anfitrion.pila}` : ""}
            </Eyeb>
          }
        />
        <Side count={<Count e={e} enEspera={enEspera} />} price={<Price e={e} />} cta={cta} note={note} invite={invitar} />
        <div className="esp-main">
          {yo ? (
            <Sec eb="Tu lugar" title={tituloLugar}>
              <TripCard e={e} who={yo.nombre} sub={subLugar} estado={yo.estado} chips={chips}>
                {invitar ? <div className="esp-monly">{invitar}</div> : ctaMovil ? <div className="acts esp-monly">{ctaMovil}</div> : null}
              </TripCard>
            </Sec>
          ) : null}
          <Sec eb="Quién va" title={tituloQuienVa}>
            <Who e={e} yo={yo} anfitrion={anfitrion} />
            {anfitrion && !e.yaViajaron && e.precio != null ? (
              <div style={{ marginTop: 14 }}>
                <Cubrir candidatos={candidatos} precio={e.precio} reservarBase={reservarBase} />
              </div>
            ) : null}
          </Sec>
          {e.itinerario.length || e.incluye.length || e.mochila.length ? (
            <Sec eb="El viaje">
              <Viaje e={e} />
            </Sec>
          ) : null}
          <Sec eb="Lo que viene">
            <Viene e={e} />
          </Sec>
          {e.grupoWhatsappUrl ? (
            <Sec eb="El grupo">
              <Grupo url={e.grupoWhatsappUrl} />
            </Sec>
          ) : null}
          <Sec eb="Tu operadora">
            <Pie e={e} />
          </Sec>
        </div>
      </div>
    </EspShell>
  );
}
