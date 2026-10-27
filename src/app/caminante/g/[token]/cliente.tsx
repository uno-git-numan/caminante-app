"use client";

// Las piezas CLIENTE del espacio del grupo: lo que necesita navegador
// (copiar, abrir WhatsApp, elegir a quién cubrir, las seis casillas del código,
// el reloj de «pedir otro», el OAuth). El marcado y las clases son los del
// entregable (design/comunidad/dc/espacio/*.jsx); sólo cambia que las acciones
// son reales.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { HeadFloat } from "@/app/caminante/ui/pub/atoms";
import { signInWithGoogle, signInWithApple } from "@/lib/auth/actions";
import { precioPub } from "@/lib/grupo/formato";

const IcoUser = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
  </svg>
);

/** Cabecera flotante. A la derecha, la puerta a Mi espacio (o a entrar). */
export function Head({ backHref, sesion }: { backHref?: string; sesion: boolean }) {
  return (
    <HeadFloat
      back={!!backHref}
      backHref={backHref}
      right={
        <a className="hbtn r" href={sesion ? "/caminante/perfil" : "/caminante/entrar"} aria-label={sesion ? "Mi espacio" : "Entrar"}>
          {IcoUser}
        </a>
      }
    />
  );
}

function useToast(): [string, (t: string) => void] {
  const [t, setT] = useState("");
  useEffect(() => {
    if (!t) return;
    const id = setTimeout(() => setT(""), 1800);
    return () => clearTimeout(id);
  }, [t]);
  return [t, setT];
}

async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

/** «Invitar a mi grupo» (B): copia la liga y abre WhatsApp con el mensaje listo. */
export function Invitar({ liga, mensaje }: { liga: string; mensaje: string }) {
  const [ok, setOk] = useState(false);
  const [toast, setToast] = useToast();
  const wa = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  return (
    <div className="mesp-invite open" id="invitar">
      <div className="mesp-invite-in">
        <span className="mesp-priv">Salida privada · sólo con la liga</span>
        <p className="t">Comparte la liga con tu grupo. Cada quien entra con su cuenta y aparta su lugar.</p>
        <a
          className="mesp-orange-lg"
          style={{ width: "100%", justifyContent: "center", marginTop: 14, minHeight: 52, fontSize: 15.5 }}
          href={wa}
          target="_blank"
          rel="noopener"
          onClick={() => {
            void copiar(mensaje).then((c) => {
              setOk(c);
              if (c) setToast("Liga copiada. Se abre WhatsApp con el mensaje listo.");
            });
          }}
        >
          Invitar a mi grupo
        </a>
        <div className="mesp-linkrow">
          <input readOnly value={liga} aria-label="Tu liga" />
          <button
            type="button"
            className="mesp-glassbtn"
            onClick={() => {
              void copiar(liga).then((c) => {
                setOk(c);
                setToast(c ? "Liga copiada." : "No se pudo copiar. Selecciónala y cópiala a mano.");
              });
            }}
          >
            {ok ? "Copiada" : "Copiar"}
          </button>
        </div>
        <p className="mesp-cupo">{ok ? "Liga copiada. Se abre WhatsApp con el mensaje listo." : "Abre WhatsApp con el mensaje listo para mandar."}</p>
      </div>
      <div className={"esp-toast" + (toast ? " show" : "")} role="status">{toast}</div>
    </div>
  );
}

/** Botón «Copiar» suelto (la liga en el pie, etc.). */
export function Copiar({ texto, className = "mesp-glassbtn" }: { texto: string; className?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        void copiar(texto).then((c) => {
          setOk(c);
          setTimeout(() => setOk(false), 1800);
        });
      }}
    >
      {ok ? "Copiada" : "Copiar"}
    </button>
  );
}

/** «Pagar por alguien más» (B): acordeón cerrado; eliges de quienes entraron y no han apartado. */
export function Cubrir({
  candidatos,
  precio,
  reservarBase,
}: {
  candidatos: { lugarId: string; nombre: string; iniciales: string }[];
  precio: number | null;
  reservarBase: string; // /caminante/reservar/<slug>?grupo=<token>
}) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const tg = (i: string) => setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  const href = `${reservarBase}&cubre=${sel.join(",")}`;
  const total = precio != null ? precioPub(precio * sel.length) : "";
  return (
    <div className={"mesp-acc" + (open ? " open" : "")}>
      <button type="button" className="mesp-acc-h" onClick={() => setOpen(!open)}>
        <span className="l">
          <span className="ti">Pagar por alguien más</span>
          <span className="su">¿Quieres cubrir el lugar de alguien del grupo?</span>
        </span>
        <span className="mesp-chev">▼</span>
      </button>
      <div className="mesp-acc-b">
        <div className="mesp-acc-in">
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 12, lineHeight: 1.5 }}>
            Lo normal es que cada quien pague su lugar. Si quieres cubrir a alguien, elige de quienes ya entraron.
          </p>
          {candidatos.length === 0 ? (
            <p style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>Todos los que han entrado ya tienen su lugar apartado.</p>
          ) : (
            candidatos.map((c) => (
              <button key={c.lugarId} type="button" className={"pub-sel" + (sel.includes(c.lugarId) ? " on" : "")} onClick={() => tg(c.lugarId)}>
                <span className="rd">
                  <i></i>
                </span>
                <span className="g">
                  <b>{c.nombre}</b>
                  <small>Entró · falta apartar</small>
                </span>
                {precio != null ? <span className="pr">{precioPub(precio)}</span> : null}
              </button>
            ))
          )}
          {candidatos.length ? (
            sel.length ? (
              <Link className="pub-cta pub-cta-orange" style={{ marginTop: 14 }} href={href}>
                Pagar {sel.length} {sel.length > 1 ? "lugares" : "lugar"}
                {total ? ` · ${total}` : ""}
              </Link>
            ) : (
              <button type="button" className="pub-cta pub-cta-orange" style={{ marginTop: 14 }} disabled>
                Elige a quién
              </button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Las seis casillas del código (C2). Un solo input real debajo; las casillas lo reflejan. */
export function CodigoInput({ name = "codigo" }: { name?: string }) {
  const [v, setV] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const d = v.replace(/\D/g, "").slice(0, 6);
  return (
    <div className="esp-codewrap" onClick={() => ref.current?.focus()}>
      <div className="esp-code" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={i === Math.min(d.length, 5) ? "on" : ""}>
            {d[i] ?? ""}
          </span>
        ))}
      </div>
      <input
        ref={ref}
        className="esp-code-in"
        name={name}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        value={d}
        onChange={(e) => setV(e.target.value)}
        aria-label="Código de seis dígitos"
        required
      />
      <button className="pub-cta pub-cta-orange" style={{ marginTop: 22 }} disabled={d.length !== 6}>
        Verificar
      </button>
    </div>
  );
}

/** «Puedes pedir otro en 0:42» → al llegar a cero, el botón de pedir otro. */
export function PedirOtro({ segundos, token, action }: { segundos: number; token: string; action: (fd: FormData) => Promise<void> }) {
  const [s, setS] = useState(Math.max(0, segundos));
  useEffect(() => {
    if (s <= 0) return;
    const id = setInterval(() => setS((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(id);
  }, [s]);
  const mmss = useMemo(() => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`, [s]);
  if (s > 0) return <p style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>Puedes pedir otro en {mmss}.</p>;
  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      <button className="pub-cta pub-cta-ghost" style={{ width: "100%" }}>
        Pedir otro código
      </button>
    </form>
  );
}

/**
 * «Continuar con Apple / Google». Igual que login/GoogleButton: el OAuth
 * arranca en el servidor (PKCE en cookie) y la navegación la hace el navegador.
 */
export function OAuth({ next, apple }: { next: string; apple: boolean }) {
  const [yendo, setYendo] = useState<"" | "google" | "apple">("");
  const [error, setError] = useState("");
  async function ir(p: "google" | "apple") {
    setYendo(p);
    setError("");
    const fd = new FormData();
    fd.set("next", next);
    try {
      const r = p === "google" ? await signInWithGoogle(fd) : await signInWithApple(fd);
      if ("url" in r) {
        window.location.assign(r.url);
        return;
      }
      setError(r.error);
    } catch {
      setError(p === "google" ? "No se pudo abrir Google. Entra con tus datos." : "No se pudo abrir Apple. Entra con tus datos.");
    }
    setYendo("");
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {apple ? (
        <button type="button" className="pub-cta pub-cta-forest" disabled={!!yendo} onClick={() => ir("apple")}>
          {yendo === "apple" ? "Abriendo Apple…" : "Continuar con Apple"}
        </button>
      ) : null}
      <button type="button" className="pub-cta pub-cta-ghost" disabled={!!yendo} onClick={() => ir("google")}>
        {yendo === "google" ? "Abriendo Google…" : "Continuar con Google"}
      </button>
      {error ? (
        <p style={{ fontSize: 13, color: "var(--orange)" }} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
